import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button, Card } from "../components/ui";
import { useAuthStore } from "../store/authStore";
import { interviewService } from "../services/interview";
import type { Interview } from "../types";

interface JobOfferContext {
	jobTitle: string;
	company: string;
	description: string;
	requirements: string[];
	niceToHave: string[];
	interviewFormat: string;
	questions: string[];
}

export default function InterviewContext() {
	const { id } = useParams<{ id: string }>();
	const navigate = useNavigate();
	const user = useAuthStore((state) => state.user);
	const [, setInterview] = useState<Interview | null>(null);
	const [context, setContext] = useState<JobOfferContext | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [isGenerating, setIsGenerating] = useState(false);
	const [error, setError] = useState("");

	useEffect(() => {
		if (id) {
			loadInterviewAndGenerate();
		}
	}, [id]);

	const loadInterviewAndGenerate = async () => {
		if (!id) return;

		setIsLoading(true);
		setIsGenerating(true);
		setError("");

		try {
			const data = await interviewService.getById(id);
			setInterview(data);

			const response = await fetch(
				`${
					import.meta.env.VITE_API_URL || "http://localhost:3001"
				}/api/interviews/${id}/context`,
				{
					method: "POST",
					headers: { "Content-Type": "application/json" },
				}
			);

			if (!response.ok) {
				const err = await response.json();
				throw new Error(err.error || "Failed to generate context");
			}

			const ctx = await response.json();
			setContext(ctx);

			await fetch(
				`${
					import.meta.env.VITE_API_URL || "http://localhost:3001"
				}/api/interviews/${id}`,
				{
					method: "PATCH",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ 
						context: ctx,
						jobTitle: ctx.jobTitle,
						company: ctx.company
					}),
				}
			);
		} catch (err: any) {
			setError(err.message || "Erreur lors de la génération du contexte");
		} finally {
			setIsLoading(false);
			setIsGenerating(false);
		}
	};

	const handleStartSession = () => {
		navigate(`/interview/${id}/session`);
	};

	if (!user) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-background">
				<p className="text-muted">Veuillez vous connecter</p>
			</div>
		);
	}

	if (isLoading || isGenerating) {
		return (
			<motion.div
				className="flex items-center justify-center min-h-[60vh]"
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
			>
				<div className="text-center max-w-md">
					<div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
					<h2 className="text-xl font-semibold text-primary-dark mb-2">
						Génération en cours
					</h2>
					<p className="text-muted">
						L'IA prépare une offre d'emploi aléatoire basée sur votre profil...
					</p>
				</div>
			</motion.div>
		);
	}

	if (error && !context) {
		return (
			<motion.div
				className="max-w-4xl mx-auto"
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
			>
				<Card className="p-12 text-center">
					<div className="w-16 h-16 bg-red-100 rounded-full mx-auto mb-4 flex items-center justify-center">
						<span className="material-icons text-3xl text-red-600">error</span>
					</div>
					<h2 className="text-xl font-semibold text-primary-dark mb-2">
						Erreur de génération
					</h2>
					<p className="text-muted mb-6">{error}</p>
					<Button onClick={loadInterviewAndGenerate}>
						<span className="material-icons mr-2">refresh</span>
						Réessayer
					</Button>
				</Card>
			</motion.div>
		);
	}

	return (
		<motion.div
			initial={{ opacity: 0 }}
			animate={{ opacity: 1 }}
			className="max-w-4xl mx-auto"
		>
			<motion.div
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				className="mb-8"
			>
				<h1 className="text-3xl font-bold text-primary-dark mb-2">
					Offre d'emploi
				</h1>
				<p className="text-muted">
					Cette offre a été générée aléatoirement pour votre simulation
				</p>
			</motion.div>

			{context && (
				<div className="space-y-6">
					<motion.div
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: 0.1 }}
					>
						<Card className="p-6 bg-gradient-to-r from-primary-dark to-primary text-white">
							<div className="flex items-start justify-between">
								<div>
									<h2 className="text-2xl font-bold mb-1">
										{context.jobTitle}
									</h2>
									<p className="text-white/80 text-lg">{context.company}</p>
								</div>
								<div className="px-4 py-2 bg-white/20 rounded-lg">
									<span className="material-icons">business</span>
								</div>
							</div>
						</Card>
					</motion.div>

					<motion.div
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: 0.2 }}
					>
						<Card className="p-6">
							<h3 className="text-lg font-semibold text-primary-dark mb-4 flex items-center gap-2">
								<span className="material-icons text-primary">description</span>
								Description du poste
							</h3>
							<p className="text-muted leading-relaxed">
								{context.description}
							</p>
						</Card>
					</motion.div>

					<div className="grid md:grid-cols-2 gap-6">
						<motion.div
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ delay: 0.3 }}
						>
							<Card className="p-6 h-full">
								<h3 className="text-lg font-semibold text-primary-dark mb-4 flex items-center gap-2">
									<span className="material-icons text-green-600">
										check_circle
									</span>
									Compétences requises
								</h3>
								<ul className="space-y-3">
									{context.requirements.map((req, index) => (
										<li key={index} className="flex items-start gap-3">
											<span className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center text-green-600 text-sm flex-shrink-0 mt-0.5">
												{index + 1}
											</span>
											<span className="text-muted">{req}</span>
										</li>
									))}
								</ul>
							</Card>
						</motion.div>

						<motion.div
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ delay: 0.4 }}
						>
							<Card className="p-6 h-full">
								<h3 className="text-lg font-semibold text-primary-dark mb-4 flex items-center gap-2">
									<span className="material-icons text-yellow-600">star</span>
									Compétences bonus
								</h3>
								<ul className="space-y-3">
									{context.niceToHave.map((item, index) => (
										<li key={index} className="flex items-start gap-3">
											<span className="w-6 h-6 bg-yellow-100 rounded-full flex items-center justify-center text-yellow-600 text-sm flex-shrink-0 mt-0.5">
												★
											</span>
											<span className="text-muted">{item}</span>
										</li>
									))}
								</ul>
							</Card>
						</motion.div>
					</div>

					<motion.div
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: 0.5 }}
					>
						<Card className="p-6">
							<h3 className="text-lg font-semibold text-primary-dark mb-4 flex items-center gap-2">
								<span className="material-icons text-primary">event</span>
								Format de l'entretien
							</h3>
							<p className="text-muted">{context.interviewFormat}</p>
						</Card>
					</motion.div>

					<motion.div
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: 0.7 }}
						className="flex justify-end"
					>
						<Button size="lg" onClick={handleStartSession}>
							<span className="material-icons mr-2">play_arrow</span>
							Commencer l'entretien
						</Button>
					</motion.div>
				</div>
			)}
		</motion.div>
	);
}
