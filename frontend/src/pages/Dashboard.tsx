import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Button, Card } from "../components/ui";
import { Logo } from "../components/features/Logo";
import { useAuthStore } from "../store/authStore";
import { interviewService } from "../services/interview";
import type { InterviewStats, Interview } from "../types";

export default function Dashboard() {
	const user = useAuthStore((state) => state.user);
	const logout = useAuthStore((state) => state.logout);
	const [stats, setStats] = useState<InterviewStats | null>(null);
	const [interviews, setInterviews] = useState<Interview[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [showStartModal, setShowStartModal] = useState(false);
	const [jobTitle, setJobTitle] = useState("");
	const [company, setCompany] = useState("");

	useEffect(() => {
		loadData();
	}, []);

	const loadData = async () => {
		try {
			const [statsData, interviewsData] = await Promise.all([
				interviewService.getStats(),
				interviewService.getAll(),
			]);
			setStats(statsData);
			setInterviews(interviewsData);
		} catch (error) {
			console.error("Failed to load data", error);
		} finally {
			setIsLoading(false);
		}
	};

	const handleStartInterview = async () => {
		if (!jobTitle.trim()) return;
		try {
			await interviewService.create(jobTitle, company || undefined);
			setShowStartModal(false);
			setJobTitle("");
			setCompany("");
			loadData();
		} catch (error) {
			console.error("Failed to start interview", error);
		}
	};

	if (!user) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-background">
				<p className="text-muted">Veuillez vous connecter</p>
			</div>
		);
	}

	return (
		<motion.div
			className="min-h-screen bg-background"
			initial={{ opacity: 0 }}
			animate={{ opacity: 1 }}
			transition={{ duration: 0.4 }}
		>
			<header className="bg-surface border-b border-gray-100 px-6 lg:px-12 py-4">
				<div className="max-w-7xl mx-auto flex items-center justify-between">
					<Link to="/">
						<Logo size="sm" />
					</Link>
					<div className="flex items-center gap-4">
						<span className="text-sm text-muted">
							Bonjour,{" "}
							<span className="font-medium text-primary-dark">
								{user.username}
							</span>
						</span>
						<Button
							variant="outline"
							size="sm"
							onClick={() => {
								logout();
								window.location.href = "/";
							}}
						>
							<span className="material-icons text-sm mr-1">logout</span>
							Déconnexion
						</Button>
					</div>
				</div>
			</header>

			<main className="max-w-7xl mx-auto px-6 lg:px-12 py-8">
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.1 }}
					className="mb-8"
				>
					<h1 className="text-3xl font-bold text-primary-dark mb-2">
						Tableau de bord
					</h1>
					<p className="text-muted">
						Suivez vos performances et préparez votre prochain entretien
					</p>
				</motion.div>

				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.5 }}
					className="mb-16"
				>
					<Card className="p-8 text-center bg-primary-lighter/30 border-2 border-dashed border-primary/20">
						<div className="w-16 h-16 bg-primary rounded-full mx-auto mb-4 flex items-center justify-center">
							<span className="material-icons text-3xl text-primary-dark">
								play_arrow
							</span>
						</div>
						<h2 className="text-xl font-semibold text-primary-dark mb-2">
							Commencer un nouvel entretien
						</h2>
						<p className="text-muted mb-6 max-w-md mx-auto">
							Préparez-vous pour votre prochain entretien avec notre simulation
							alimentée par l'IA
						</p>
						<Button size="lg" onClick={() => setShowStartModal(true)}>
							<span className="material-icons mr-2">add</span>
							Commencer un entretien
						</Button>
					</Card>
				</motion.div>

				<div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
					<motion.div
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: 0.2 }}
					>
						<Card className="p-6 bg-linear-to-br from-primary to-primary-dark text-white">
							<div className="flex items-center justify-between mb-4">
								<span className="material-icons text-3xl">quiz</span>
								<span className="text-4xl font-bold">
									{stats?.totalInterviews || 0}
								</span>
							</div>
							<p className="text-white/80">Entretiens realisés</p>
						</Card>
					</motion.div>

					<motion.div
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: 0.3 }}
					>
						<Card className="p-6 bg-linear-to-br from-primary-lighter to-primary text-primary-dark">
							<div className="flex items-center justify-between mb-4">
								<span className="material-icons text-3xl">trending_up</span>
								<span className="text-4xl font-bold">
									{stats?.averageScore || 0}%
								</span>
							</div>
							<p className="text-primary-dark/80">Score moyen</p>
						</Card>
					</motion.div>

					<motion.div
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: 0.4 }}
					>
						<Card className="p-6 bg-linear-to-br from-surface to-gray-50 border border-gray-100">
							<div className="flex items-center justify-between mb-4">
								<span className="material-icons text-3xl text-primary">
									help
								</span>
								<span className="text-4xl font-bold text-primary-dark">
									{stats?.totalQuestions || 0}
								</span>
							</div>
							<p className="text-muted">Questions répondues</p>
						</Card>
					</motion.div>
				</div>

				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.6 }}
				>
					<h2 className="text-xl font-semibold text-primary-dark mb-4">
						Historique des entretiens
					</h2>
					{isLoading ? (
						<div className="flex items-center justify-center py-12">
							<div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
						</div>
					) : interviews.length === 0 ? (
						<Card className="p-8 text-center">
							<span className="material-icons text-4xl text-muted mb-4">
								history
							</span>
							<p className="text-muted">Aucun entretien pour le moment</p>
							<p className="text-sm text-muted mt-1">
								Commencez votre premier entretien pour voir votre historique ici
							</p>
						</Card>
					) : (
						<div className="space-y-4">
							{interviews.map((interview, index) => (
								<motion.div
									key={interview.id}
									initial={{ opacity: 0, x: -20 }}
									animate={{ opacity: 1, x: 0 }}
									transition={{ delay: 0.1 * index }}
								>
									<Card className="p-4 flex items-center justify-between hover:shadow-md transition-shadow">
										<div className="flex items-center gap-4">
											<div
												className={`w-10 h-10 rounded-full flex items-center justify-center ${
													interview.status === "COMPLETED"
														? "bg-green-100 text-green-600"
														: interview.status === "IN_PROGRESS"
														? "bg-yellow-100 text-yellow-600"
														: "bg-gray-100 text-gray-600"
												}`}
											>
												<span className="material-icons text-lg">
													{interview.status === "COMPLETED"
														? "check_circle"
														: interview.status === "IN_PROGRESS"
														? "pending"
														: "schedule"}
												</span>
											</div>
											<div>
												<h3 className="font-medium text-primary-dark">
													{interview.jobTitle}
												</h3>
												{interview.company && (
													<p className="text-sm text-muted">
														{interview.company}
													</p>
												)}
												<p className="text-xs text-muted mt-1">
													{new Date(interview.createdAt).toLocaleDateString(
														"fr-FR"
													)}
												</p>
											</div>
										</div>
										{interview.score !== null &&
											interview.score !== undefined && (
												<div
													className={`px-3 py-1 rounded-full text-sm font-medium ${
														interview.score >= 70
															? "bg-green-100 text-green-700"
															: interview.score >= 50
															? "bg-yellow-100 text-yellow-700"
															: "bg-red-100 text-red-700"
													}`}
												>
													{interview.score}%
												</div>
											)}
									</Card>
								</motion.div>
							))}
						</div>
					)}
				</motion.div>
			</main>

			{showStartModal && (
				<motion.div
					className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					onClick={() => setShowStartModal(false)}
				>
					<motion.div
						className="bg-surface rounded-2xl p-6 w-full max-w-md"
						initial={{ scale: 0.9, opacity: 0 }}
						animate={{ scale: 1, opacity: 1 }}
						onClick={(e) => e.stopPropagation()}
					>
						<h2 className="text-xl font-semibold text-primary-dark mb-4">
							Nouvel entretien
						</h2>
						<div className="space-y-4">
							<div>
								<label className="block text-sm font-medium text-primary-dark mb-1">
									Poste visé
								</label>
								<input
									type="text"
									value={jobTitle}
									onChange={(e) => setJobTitle(e.target.value)}
									placeholder="Ex: Développeur Full Stack"
									className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
								/>
							</div>
							<div>
								<label className="block text-sm font-medium text-primary-dark mb-1">
									Entreprise (optionnel)
								</label>
								<input
									type="text"
									value={company}
									onChange={(e) => setCompany(e.target.value)}
									placeholder="Ex: Google"
									className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
								/>
							</div>
						</div>
						<div className="flex gap-3 mt-6">
							<Button
								variant="outline"
								className="flex-1"
								onClick={() => setShowStartModal(false)}
							>
								Annuler
							</Button>
							<Button
								className="flex-1"
								onClick={handleStartInterview}
								disabled={!jobTitle.trim()}
							>
								<span className="material-icons mr-1">play_arrow</span>
								Commencer
							</Button>
						</div>
					</motion.div>
				</motion.div>
			)}
		</motion.div>
	);
}
