import { WebSocketServer, WebSocket } from "ws";
import { Server } from "http";
import { prisma } from "../db/prisma.js";
import nlp from "compromise";

interface ConversationMessage {
	role: "user" | "assistant";
	content: string;
	timestamp: number;
}

interface InterviewSession {
	interviewId: string;
	userId: string;
	ws: WebSocket;
	messages: ConversationMessage[];
	startedAt: number;
	currentQuestionIndex: number;
	conversationStage: "greeting" | "introduction" | "experience" | "technical" | "motivation" | "closing";
}

const sessions = new Map<string, InterviewSession>();

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_MODEL = "meta-llama/llama-3.1-8b-instruct";

interface IntentResult {
	intent: string;
	confidence: number;
	salutation: boolean;
	question: boolean;
	affirmation: boolean;
	negation: boolean;
}

function analyzeIntent(text: string): IntentResult {
	const doc = nlp(text);
	const lowerText = text.toLowerCase();
	
	const salutations = ["bonjour", "salut", "bonsoir", "hello", "coucou", "hi"];
	const questions = ["?", "pourquoi", "comment", "que", "quoi", "quel", "quelle", "qui", "où", "quand", "est-ce que"];
	const affirmations = ["oui", "bien sûr", "exact", "c'est ça", "oui oui", "parfait", "d'accord", "ok", "OK"];
	const negations = ["non", "pas", "jamais", "aucun", "aucune", "rien"];
	
	const salutation = salutations.some(s => lowerText.includes(s));
	const question = questions.some(q => lowerText.includes(q)) || text.trim().endsWith("?");
	const affirmation = affirmations.some(a => lowerText.includes(a));
	const negation = negations.some(n => lowerText.includes(n));
	
	let intent = "general";
	if (salutation) intent = "greeting";
	else if (affirmation) intent = "affirmation";
	else if (negation) intent = "negation";
	else if (question) intent = "question";
	
	return {
		intent,
		confidence: 0.8,
		salutation,
		question,
		affirmation,
		negation,
	};
}

function generateQuickResponse(intent: IntentResult, stage: string): string | null {
	const responses: Record<string, Record<string, string[]>> = {
		greeting: {
			affirmation: [
				"Parfait ! Ravi de vous rencontrer. Commençons par une présentation.",
				"Excellent ! Alors, racontez-moi un peu votre parcours.",
			],
			general: [
				"Bonjour ! Bienvenue. Parlez-moi un peu de vous.",
				"Salut ! Bienvenue. Alors, qu'est-ce qui vous a poussé à postuler ?",
			],
		},
		experience: {
			affirmation: [
				"Très intéressant ! Pouvez-vous me donner plus de détails ?",
				" прекрасно ! Et concrètement, quelles étaient vos missions ?",
			],
			question: [
				" Bonne question. Dans ce poste, nous cherchons quelqu'un de polyvalent.",
				"Intéressant ! Parlons maintenant de vos compétences techniques.",
			],
		},
		technical: {
			affirmation: [
				"Parfait, vous avez l'air à l'aise avec ces technologies. Et en termes de projets ?",
				"Excellent ! Comment avez-vous appliqué ces compétences en situation réelle ?",
			],
			question: [
				"Excellente question. Nous utilisons principalement ces technologies en interne.",
				"Bonne question. Je vous expliquerai le contexte technique plus en détail.",
			],
		},
		motivation: {
			affirmation: [
				"Super ! Qu'est-ce qui vous attire particulièrement chez nous ?",
				"Parfait. Et pourquoi ce poste plutôt qu'un autre ?",
			],
		},
	};

	const stageResponses = responses[stage];
	if (!stageResponses) return null;
	
	const key = intent.intent === "general" ? "general" : intent.intent;
	const possibleResponses = stageResponses[key];
	
	if (possibleResponses && possibleResponses.length > 0) {
		return possibleResponses[Math.floor(Math.random() * possibleResponses.length)];
	}
	
	return null;
}

export function setupWebSocket(server: Server) {
	const wss = new WebSocketServer({ server, path: "/ws/interview" });

	wss.on("connection", (ws, req) => {
		const url = new URL(req.url || "", `http://${req.headers.host}`);
		const interviewId = url.searchParams.get("interviewId");
		const userId = url.searchParams.get("userId");

		if (!interviewId || !userId) {
			ws.close(4001, "Missing interviewId or userId");
			return;
		}

		ws.on("message", async (data) => {
			try {
				const message = JSON.parse(data.toString());
				await handleMessage(ws, interviewId, userId, message);
			} catch (error) {
				console.error("WebSocket message error:", error);
				ws.send(JSON.stringify({ type: "error", message: "Invalid message" }));
			}
		});

		ws.on("close", () => {
			if (interviewId && sessions.has(interviewId)) {
				sessions.delete(interviewId);
			}
		});

		ws.on("error", (error) => {
			console.error("WebSocket error:", error);
		});
	});

	return wss;
}

async function handleMessage(
	ws: WebSocket,
	interviewId: string,
	userId: string,
	message: any
) {
	switch (message.type) {
		case "start":
			await handleStartSession(ws, interviewId, userId);
			break;
		case "audio":
			await handleAudioMessage(ws, interviewId, message.transcript);
			break;
		case "text":
			await handleTextMessage(ws, interviewId, message.content);
			break;
		case "end":
			await handleEndSession(ws, interviewId);
			break;
		default:
			ws.send(
				JSON.stringify({ type: "error", message: "Unknown message type" })
			);
	}
}

async function handleStartSession(
	ws: WebSocket,
	interviewId: string,
	userId: string
) {
	try {
		const interview = await prisma.interview.findUnique({
			where: { id: interviewId },
			include: {
				user: {
					include: {
						profile: {
							include: {
								careers: true,
								education: true,
								internships: true,
								experiences: true,
							},
						},
					},
				},
			},
		});

		if (!interview || interview.userId !== userId) {
			ws.send(
				JSON.stringify({
					type: "error",
					message: "Unauthorized access to this interview",
				})
			);
			ws.close();
			return;
		}

		const session: InterviewSession = {
			interviewId,
			userId: interview.userId,
			ws,
			messages: [],
			startedAt: Date.now(),
			currentQuestionIndex: 0,
			conversationStage: "greeting",
		};

		sessions.set(interviewId, session);

		const profile = interview.user.profile as any;
		const initialMessage = buildInitialMessage(interview, profile);

		session.messages.push({
			role: "assistant",
			content: initialMessage,
			timestamp: Date.now(),
		});

		ws.send(
			JSON.stringify({
				type: "welcome",
				message: initialMessage,
				interview: {
					jobTitle: interview.jobTitle,
					company: interview.company,
				},
			})
		);
	} catch (error) {
		console.error("Start session error:", error);
		ws.send(
			JSON.stringify({ type: "error", message: "Failed to start session" })
		);
	}
}

function buildInitialMessage(interview: any, profile: any): string {
	const careers =
		profile?.careers?.map((c: any) => c.title).join(", ") || "Non spécifié";
	const experiences =
	profile?.experiences
			?.map((e: any) => `${e.title} chez ${e.company}`)
			.join(", ") || "Non spécifié";
	const education =
		profile?.education
			?.map((e: any) => `${e.degree} en ${e.field}`)
			.join(", ") || "Non spécifié";

	const contextData = interview.context as any;
	const jobTitle = contextData?.jobTitle || interview.jobTitle || "ce poste";
	const companyName = contextData?.company || interview.company || "cette entreprise";

	const greetings = [
		`Bonjour et bienvenue chez ${companyName} !`,
		`Bienvenue chez ${companyName} !`,
		`Bonjour ! Ravi de vous avoir parmi nous.`,
		`Salut ! Bienvenue dans notre processus de recrutement.`,
	];

	const introductions = [
		`Je m'appelle ${getRecruiterName()}, je suis le recruteur pour le poste de ${jobTitle}.`,
		`Je suis ${getRecruiterName()}, responsable du recrutement pour ${jobTitle}.`,
		`Je suis ${getRecruiterName()}, et je vais vous interviewer pour le poste de ${jobTitle}.`,
	];

	const interests = [
		`J'ai examiné votre profil et je suis très interéssé par votre parcours dans ${careers}.`,
		`Votre parcours dans ${careers} a retenu toute mon attention.`,
		`Votre profil nous interesše particulièrement.`,
	];

	const questions = [
		`Pouvez-vous vous présenter et me parler de votre expérience professionnelle, en particulier ${experiences !== "Non spécifié" ? experiences : "votre parcours"} ?`,
		`J'aimerais en savoir plus sur ${experiences !== "Non spécifié" ? experiences : "votre parcours"}. Pouvez-vous me le décrire ?`,
		`Racontez-moi votre parcours professionnel, en particulier ${experiences !== "Non spécifié" ? experiences : "ce que vous avez fait récemment"}.`,
	];

	const greeting = greetings[Math.floor(Math.random() * greetings.length)];
	const intro = introductions[Math.floor(Math.random() * introductions.length)];
	const interest = interests[Math.floor(Math.random() * interests.length)];
	const question = questions[Math.floor(Math.random() * questions.length)];

	return `${greeting}\n\n${intro}\n\n${interest}\n\n${question}`;
}

function getRecruiterName(): string {
	const firstNames = [
		"Marie",
		"Sophie",
		"Thomas",
		"Lucas",
		"Emma",
		"Nathan",
		"Chloé",
		"Antoine",
	];
	const lastNames = [
		"Dupont",
		"Martin",
		"Bernard",
		"Laurent",
		"Moreau",
		"Lefebvre",
		"Rousseau",
		"Garcia",
	];
	return `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${
		lastNames[Math.floor(Math.random() * lastNames.length)]
	}`;
}

async function handleAudioMessage(
	ws: WebSocket,
	interviewId: string,
	transcript: string
) {
	if (!transcript) return;
	await processUserResponse(ws, interviewId, transcript);
}

async function handleTextMessage(
	ws: WebSocket,
	interviewId: string,
	content: string
) {
	if (!content) return;
	await processUserResponse(ws, interviewId, content);
}

async function processUserResponse(
	ws: WebSocket,
	interviewId: string,
	userResponse: string
) {
	const session = sessions.get(interviewId);
	if (!session) {
		ws.send(JSON.stringify({ type: "error", message: "Session not found" }));
		return;
	}

	session.messages.push({
		role: "user",
		content: userResponse,
		timestamp: Date.now(),
	});

	ws.send(JSON.stringify({ type: "thinking" }));

	try {
		const aiResponse = await generateAIResponse(interviewId, userResponse);

		session.messages.push({
			role: "assistant",
			content: aiResponse,
			timestamp: Date.now(),
		});

		ws.send(
			JSON.stringify({
				type: "response",
				message: aiResponse,
			})
		);
	} catch (error) {
		console.error("AI response error:", error);
		const fallbackResponses = [
			"Intéressant ! Parlez-moi de vos compétences principales.",
			"Merci ! Comment avez-vous acquis cette expérience ?",
			"Parfait. Qu'est-ce qui vous motive dans ce poste ?",
		];
		const fallback = fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];
		ws.send(
			JSON.stringify({
				type: "response",
				message: fallback,
			})
		);
	}
}

function updateConversationStageBasedOnMessages(session: InterviewSession) {
	const messageCount = session.messages.filter(m => m.role === "user").length;
	
	if (messageCount <= 1) {
		session.conversationStage = "greeting";
	} else if (messageCount <= 3) {
		session.conversationStage = "introduction";
	} else if (messageCount <= 6) {
		session.conversationStage = "experience";
	} else if (messageCount <= 9) {
		session.conversationStage = "technical";
	} else if (messageCount <= 12) {
		session.conversationStage = "motivation";
	} else {
		session.conversationStage = "closing";
	}
}

async function generateAIResponse(
	interviewId: string,
	userMessage: string
): Promise<string> {
	const session = sessions.get(interviewId);
	if (!session) throw new Error("Session not found");

	const interview = await prisma.interview.findUnique({
		where: { id: interviewId },
	});

	if (!interview) throw new Error("Interview not found");

	const contextData = interview.context as any;
	const requirements = contextData?.requirements || [];
	const questions = contextData?.questions || [];
	const niceToHave = contextData?.niceToHave || [];

	const jobTitle = contextData?.jobTitle || interview.jobTitle || "ce poste";
	const companyName = contextData?.company || interview.company || "une entreprise";

	const conversationHistory = session.messages
		.map((m) => `${m.role === "user" ? "Candidat" : "Recruteur"}: ${m.content}`)
		.join("\n\n");

	const greetingPhrases = [
		"Parfait, merci pour cette réponse.",
		"Très intéressant, continuez.",
		"D'accord, j'ai bien noté.",
		"Excellent, cela m'aide à mieux vous connaître.",
		"Intéressant, pouvez-vous développer ?",
	];

	const greeting = greetingPhrases[Math.floor(Math.random() * greetingPhrases.length)];

	const systemPrompt = `Tu es un recruteur professionnel pour une entreprise comme ${companyName}, cherchant à emboucher quelqu'un pour le poste de ${jobTitle}.

Contexte de l'offre d'emploi:
- Description: ${contextData?.description || "Entreprise en croissance"}
- Exigences du poste: ${requirements.length > 0 ? requirements.join(", ") : "Compétences polyvalentes"}
- Atouts appréciés: ${niceToHave.length > 0 ? niceToHave.join(", ") : "Autonomie et adaptabilité"}

${questions.length > 0 ? `Questions importantes à couvrir:\n${questions.map((q: string) => `- ${q}`).join("\n")}` : ""}

	Règles de réponse:
1. Sois naturel et conversationnel comme un vrai recruteur humain
2. Sois TRÈS concis (1-2 phrases max par réponse, max 80 mots)
3. Pose une seule question à la fois
4. Utilise le greeting aléatoire: "${greeting}" au début de chaque réponse
5. Termine toujours par une question pour maintenir le dialogue
6. Réponds en français uniquement
7. Évite les réponses trop longues qui seront coupées

Historique de la conversation:
${conversationHistory}

Dernière réponse du candidat: "${userMessage}"

Réponds de manière naturelle et engageante:`;

	const controller = new AbortController();
	const timeout = setTimeout(() => controller.abort(), 60000);

	try {
		const response = await fetch(
			"https://openrouter.ai/api/v1/chat/completions",
			{
				method: "POST",
				signal: controller.signal,
				headers: {
					Authorization: `Bearer ${OPENROUTER_API_KEY}`,
					"Content-Type": "application/json",
					"HTTP-Referer": "http://localhost:5173",
					"X-Title": "Talkova",
				},
				body: JSON.stringify({
					model: OPENROUTER_MODEL,
					messages: [{ role: "system", content: systemPrompt }],
					temperature: 0.7,
					max_tokens: 200,
				}),
			}
		);
		clearTimeout(timeout);

		if (!response.ok) {
			const fallbackResponses = [
				"Intéressant ! Pouvez-vous m'en dire plus sur votre expérience ?",
				"Merci ! Comment avez-vous développé ces compétences ?",
				"Parfait. Qu'est-ce qui vous a poussé à choisir ce domaine ?",
				"D'accord. Quels sont vos objectifs professionnels ?",
			];
			return fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];
		}

		const data = await response.json();
		const content = data.choices?.[0]?.message?.content;
		
		if (!content || content.trim() === '') {
			const fallbackResponses = [
				"Merci pour cette réponse. Pouvez-vous développer davantage ?",
				"Très bien. Parlez-moi de vos réalisations récentes.",
				"Intéressant. Comment avez-vous géré ce type de situation ?",
			];
			return fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];
		}

		return content;
	} catch (error: any) {
		clearTimeout(timeout);
		
		const fallbackResponses = [
			"Excusez-moi, pourriez-vous répéter ou reformuler ?",
			"Pardon, je n'ai pas bien saisi. Pouvez-vous développer ?",
			"Intéressant. Qu'est-ce qui vous a le plus plu dans cette expérience ?",
			"Merci. Parlez-moi de vos principales compétences.",
		];
		
		return fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];
	}
}

async function handleEndSession(ws: WebSocket, interviewId: string) {
	const session = sessions.get(interviewId);
	if (!session) return;

	try {
		await prisma.interview.update({
			where: { id: interviewId },
			data: {
				status: "COMPLETED",
			},
		});
	} catch (error) {
		console.error("Error saving conversation:", error);
	}

	sessions.delete(interviewId);
	ws.send(
		JSON.stringify({
			type: "ended",
			message: "Entretien terminé. Merci pour votre participation !",
		})
	);
}
