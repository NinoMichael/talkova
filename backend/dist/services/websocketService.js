import { WebSocketServer } from "ws";
import { prisma } from "../db/prisma.js";
import nlp from "compromise";
const sessions = new Map();
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_MODEL = "meta-llama/llama-3.1-8b-instruct";
function analyzeIntent(text) {
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
    if (salutation)
        intent = "greeting";
    else if (affirmation)
        intent = "affirmation";
    else if (negation)
        intent = "negation";
    else if (question)
        intent = "question";
    return {
        intent,
        confidence: 0.8,
        salutation,
        question,
        affirmation,
        negation,
    };
}
function generateQuickResponse(intent, stage) {
    const responses = {
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
    if (!stageResponses)
        return null;
    const key = intent.intent === "general" ? "general" : intent.intent;
    const possibleResponses = stageResponses[key];
    if (possibleResponses && possibleResponses.length > 0) {
        return possibleResponses[Math.floor(Math.random() * possibleResponses.length)];
    }
    return null;
}
export function setupWebSocket(server) {
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
            }
            catch (error) {
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
async function handleMessage(ws, interviewId, userId, message) {
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
            ws.send(JSON.stringify({ type: "error", message: "Unknown message type" }));
    }
}
async function handleStartSession(ws, interviewId, userId) {
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
            ws.send(JSON.stringify({
                type: "error",
                message: "Unauthorized access to this interview",
            }));
            ws.close();
            return;
        }
        const session = {
            interviewId,
            userId: interview.userId,
            ws,
            messages: [],
            startedAt: Date.now(),
            currentQuestionIndex: 0,
            conversationStage: "greeting",
        };
        sessions.set(interviewId, session);
        const profile = interview.user.profile;
        const initialMessage = buildInitialMessage(interview, profile);
        session.messages.push({
            role: "assistant",
            content: initialMessage,
            timestamp: Date.now(),
        });
        ws.send(JSON.stringify({
            type: "welcome",
            message: initialMessage,
            interview: {
                jobTitle: interview.jobTitle,
                company: interview.company,
            },
        }));
    }
    catch (error) {
        console.error("Start session error:", error);
        ws.send(JSON.stringify({ type: "error", message: "Failed to start session" }));
    }
}
function buildInitialMessage(interview, profile) {
    const careers = profile?.careers?.map((c) => c.title).join(", ") || "Non spécifié";
    const experiences = profile?.experiences
        ?.map((e) => `${e.title} chez ${e.company}`)
        .join(", ") || "Non spécifié";
    const education = profile?.education
        ?.map((e) => `${e.degree} en ${e.field}`)
        .join(", ") || "Non spécifié";
    return `Bonjour et bienvenue chez ${interview.company || "cette entreprise"} !

Je suis ${getRecruiterName()}, le recruteur pour le poste de ${interview.jobTitle}.

J'ai bien reçu votre candidature et je suis ravi de vous rencontrer aujourd'hui. Votre profil m'a particulièrement interessé, notamment votre parcours dans ${careers}.

Pouvez-vous vous présenter brièvement et me parler de votre expérience professionnelle, en particulier ${experiences !== "Non spécifié" ? experiences : "votre parcours"} ?`;
}
function getRecruiterName() {
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
    return `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`;
}
async function handleAudioMessage(ws, interviewId, transcript) {
    if (!transcript)
        return;
    await processUserResponse(ws, interviewId, transcript);
}
async function handleTextMessage(ws, interviewId, content) {
    if (!content)
        return;
    await processUserResponse(ws, interviewId, content);
}
async function processUserResponse(ws, interviewId, userResponse) {
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
    const intent = analyzeIntent(userResponse);
    const quickResponse = generateQuickResponse(intent, session.conversationStage);
    if (quickResponse && session.messages.length < 4) {
        await new Promise(resolve => setTimeout(resolve, 500));
        session.messages.push({
            role: "assistant",
            content: quickResponse,
            timestamp: Date.now(),
        });
        updateConversationStage(session, intent);
        ws.send(JSON.stringify({
            type: "response",
            message: quickResponse,
        }));
        return;
    }
    try {
        const aiResponse = await generateAIResponse(interviewId, userResponse);
        session.messages.push({
            role: "assistant",
            content: aiResponse,
            timestamp: Date.now(),
        });
        updateConversationStage(session, intent);
        ws.send(JSON.stringify({
            type: "response",
            message: aiResponse,
        }));
    }
    catch (error) {
        console.error("AI response error:", error);
        ws.send(JSON.stringify({
            type: "error",
            message: "Désolé, j'ai eu un problème technique. Pouvez-vous reformuler votre réponse ?",
        }));
    }
}
function updateConversationStage(session, intent) {
    const messageCount = session.messages.filter(m => m.role === "user").length;
    if (messageCount <= 1) {
        session.conversationStage = "greeting";
    }
    else if (messageCount <= 3) {
        session.conversationStage = "introduction";
    }
    else if (messageCount <= 6) {
        session.conversationStage = "experience";
    }
    else if (messageCount <= 9) {
        session.conversationStage = "technical";
    }
    else if (messageCount <= 12) {
        session.conversationStage = "motivation";
    }
    else {
        session.conversationStage = "closing";
    }
}
async function generateAIResponse(interviewId, userMessage) {
    const session = sessions.get(interviewId);
    if (!session)
        throw new Error("Session not found");
    const interview = await prisma.interview.findUnique({
        where: { id: interviewId },
    });
    if (!interview)
        throw new Error("Interview not found");
    const contextData = interview.context;
    const requirements = contextData?.requirements || [];
    const questions = contextData?.questions || [];
    const niceToHave = contextData?.niceToHave || [];
    const conversationHistory = session.messages
        .map((m) => `${m.role === "user" ? "Candidat" : "Recruteur"}: ${m.content}`)
        .join("\n\n");
    const systemPrompt = `Tu es un recruteur professionnel dans une simulation d'entretien d'embauche pour le poste de "${interview.jobTitle}" chez ${interview.company || "une entreprise"}.

Contexte de l'offre d'emploi:
- Description: ${contextData?.description || ""}
- Exigences: ${requirements.join(", ")}
- Atouts appréciés: ${niceToHave.join(", ")}

Questions à poser (utilise-les naturellement):
${questions.map((q, i) => `${i + 1}. ${q}`).join("\n")}

Instructions:
1. Sois naturel et conversationnel, comme un vrai recruteur humain
2. Pose des questions de suivi basées sur les réponses du candidat
3. Utilise le contexte du profil du candidat pour personnaliser les questions
4. Alterne entre questions techniques et questions sur l'expérience
5. Sois concis mais engageant (2-4 phrases maximum pour les réponses)
6. Ne pose pas toutes les questions d'un coup - espace-les naturellement
7. Si le candidat répond bien, montre de l'intérêt avec des questions de suivi
8. Si le candidat donne une réponse courte, pose une question ouverte pour l'encourager à developper
9. Termine toujours par une question ou une remarque pour maintenir la conversation
10. En french uniquement

Historique de la conversation:
${conversationHistory}

Dernière réponse du candidat: "${userMessage}"

Réponds de manière naturelle et conversationnelle:`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 45000);
    try {
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
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
                max_tokens: 300,
            }),
        });
        clearTimeout(timeout);
        if (!response.ok) {
            throw new Error("AI request failed");
        }
        const data = await response.json();
        return (data.choices?.[0]?.message?.content ||
            "Pouvez-vous developper davantage ?");
    }
    catch (error) {
        clearTimeout(timeout);
        if (error.name === "AbortError") {
            return "Excusez-moi, avez-vous autre chose à ajouter concernant ce sujet ?";
        }
        throw error;
    }
}
async function handleEndSession(ws, interviewId) {
    const session = sessions.get(interviewId);
    if (!session)
        return;
    try {
        await prisma.interview.update({
            where: { id: interviewId },
            data: {
                status: "COMPLETED",
            },
        });
    }
    catch (error) {
        console.error("Error saving conversation:", error);
    }
    sessions.delete(interviewId);
    ws.send(JSON.stringify({
        type: "ended",
        message: "Entretien terminé. Merci pour votre participation !",
    }));
}
