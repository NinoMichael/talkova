import { prisma } from "../db/prisma.js";

interface UserProfile {
	fullName: string | null;
	careers: { title: string }[];
	education: { institution: string; degree: string; field: string }[];
	internships: {
		company: string;
		position: string;
		description: string | null;
	}[];
	experiences: { title: string; company: string; description: string | null }[];
}

interface JobOfferContext {
	jobTitle: string;
	company: string;
	description: string;
	requirements: string[];
	niceToHave: string[];
	interviewFormat: string;
	questions: string[];
}

export const aiService = {
	async generateJobOfferContext(interviewId: string): Promise<JobOfferContext> {
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

		if (!interview) {
			throw new Error("Interview not found");
		}

		const profile = interview.user.profile as UserProfile | null;

		const prompt = this.buildPrompt(interview.jobTitle, profile);

		const controller = new AbortController();
		const timeout = setTimeout(() => controller.abort(), 30000);

		const response = await fetch(
			"https://openrouter.ai/api/v1/chat/completions",
			{
				method: "POST",
				signal: controller.signal,
				headers: {
					Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
					"Content-Type": "application/json",
					"HTTP-Referer": "http://localhost:5173",
					"X-Title": "Talkova",
				},
				body: JSON.stringify({
					model: "meta-llama/llama-3.1-8b-instruct",
					messages: [
						{
							role: "system",
							content:
								'Tu es un expert en recrutement. Génère une offre d\'emploi fictive réaliste basée sur le profil du candidat. Réponds UNIQUEMENT en JSON valide avec cette structure exacte: {"jobTitle":"string","company":"string","description":"string","requirements":["string"],"niceToHave":["string"],"interviewFormat":"string","questions":["string"]}',
						},
						{
							role: "user",
							content: prompt,
						},
					],
					temperature: 0.7,
					max_tokens: 2000,
				}),
			}
		);
		clearTimeout(timeout);

		if (!response.ok) {
			const error = await response.text();
			console.error("OpenRouter error:", error);
			throw new Error("Failed to generate job offer context");
		}

		const data = await response.json();
		const content = data.choices?.[0]?.message?.content;

		if (!content) {
			throw new Error("No content received from AI");
		}

		try {
			const parsed = JSON.parse(content);

			await prisma.interview.update({
				where: { id: interviewId },
				data: {
					status: "IN_PROGRESS",
				},
			});

			return parsed as JobOfferContext;
		} catch (parseError) {
			console.error("Failed to parse AI response:", content);
			throw new Error("Invalid response from AI");
		}
	},

	buildPrompt(jobTitle: string, profile: UserProfile | null): string {
		const careers =
			profile?.careers?.map((c) => c.title).join(", ") || "Non spécifié";
		const education =
			profile?.education
				?.map((e) => `${e.degree} en ${e.field} à ${e.institution}`)
				.join(", ") || "Non spécifié";
		const experiences =
			profile?.experiences
				?.map((e) => `${e.title} chez ${e.company}`)
				.join(", ") || "Non spécifié";
		const internships =
			profile?.internships
				?.map((i) => `${i.position} chez ${i.company}`)
				.join(", ") || "Non spécifié";

		return `
Génère une offre d'emploi fictive pour le poste de "${jobTitle}" basée sur ce profil de candidat:

CARRIÈRE SOUHAITÉE: ${careers}
FORMATION: ${education}
EXPÉRIENCE PROFESSIONNELLE: ${experiences}
STAGES: ${internships}

L'offre doit être réaliste, correspondre au niveau du candidat (cadre debutant/expérimenté), et inclure:
- Un titre de poste précis
- Une entreprise fictive avec une description
- Une description du poste
- 5-6 exigences/compétences requises
- 3-4 compétences bonus (nice to have)
- Le format de l'entretien (technique, RH, etc.)

Réponds uniquement en JSON.
`;
	},

	async generateFeedback(
		question: string,
		answer: string,
		context: string
	): Promise<{ feedback: string; score: number }> {
		const response = await fetch(
			"https://openrouter.ai/api/v1/chat/completions",
			{
				method: "POST",
				headers: {
					Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
					"Content-Type": "application/json",
					"HTTP-Referer": "http://localhost:5173",
					"X-Title": "Talkova",
				},
				body: JSON.stringify({
					model: "meta-llama/llama-3.1-8b-instruct",
					messages: [
						{
							role: "system",
							content:
								'Tu es un expert en accompagnement aux entretiens. Analyse la réponse du candidat et fournis un feedback constructif. Réponds UNIQUEMENT en JSON avec: {"feedback":"string","score":number}',
						},
						{
							role: "user",
							content: `
Contexte de l'offre d'emploi:
${context}

Question: ${question}
Réponse du candidat: ${answer}

Donne un feedback constructif et une note sur 100.
`,
						},
					],
					temperature: 0.5,
					max_tokens: 1000,
				}),
			}
		);

		if (!response.ok) {
			throw new Error("Failed to generate feedback");
		}

		const data = await response.json();
		const content = data.choices?.[0]?.message?.content;

		if (!content) {
			throw new Error("No content received from AI");
		}

		try {
			return JSON.parse(content);
		} catch {
			throw new Error("Invalid feedback response");
		}
	},
};
