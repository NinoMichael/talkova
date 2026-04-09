import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button, Card } from '../components/ui';
import { useAuthStore } from '../store/authStore';
import { interviewService } from '../services/interview';
import type { InterviewStats, Interview } from '../types';

export default function Dashboard() {
  const user = useAuthStore((state) => state.user);
  const [stats, setStats] = useState<InterviewStats | null>(null);
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

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
      console.error('Failed to load data', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartInterview = async () => {
    try {
      const interview = await interviewService.create('Poste à définir', undefined);
      navigate(`/interview/${interview.id}/context`);
    } catch (error) {
      console.error('Failed to start interview', error);
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
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold text-primary-dark mb-2">Tableau de bord</h1>
        <p className="text-muted">Suivez vos performances et préparez votre prochain entretien</p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="p-6 bg-gradient-to-br from-primary to-primary-dark text-white">
            <div className="flex items-center justify-between mb-4">
              <span className="material-icons text-3xl">quiz</span>
              <span className="text-4xl font-bold">{stats?.totalInterviews || 0}</span>
            </div>
            <p className="text-white/80">Entretiens réalisé{stats?.totalInterviews !== 1 ? 's' : ''}</p>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="p-6 bg-gradient-to-br from-primary-lighter to-primary text-primary-dark">
            <div className="flex items-center justify-between mb-4">
              <span className="material-icons text-3xl">trending_up</span>
              <span className="text-4xl font-bold">{stats?.averageScore || 0}%</span>
            </div>
            <p className="text-primary-dark/80">Score moyen</p>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="p-6 bg-gradient-to-br from-surface to-gray-50 border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <span className="material-icons text-3xl text-primary">help</span>
              <span className="text-4xl font-bold text-primary-dark">{stats?.totalQuestions || 0}</span>
            </div>
            <p className="text-muted">Questions répondues</p>
          </Card>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="mb-8"
      >
        <Card className="p-8 text-center bg-primary-lighter/30 border-2 border-dashed border-primary/20">
          <div className="w-16 h-16 bg-primary rounded-full mx-auto mb-4 flex items-center justify-center">
            <span className="material-icons text-3xl text-primary-dark">play_arrow</span>
          </div>
          <h2 className="text-xl font-semibold text-primary-dark mb-2">Commencer un nouvel entretien</h2>
          <p className="text-muted mb-6 max-w-md mx-auto">
            Lancez une simulation d'entretien aléatoire basée sur l'IA et testez vos compétences
          </p>
          <Button size="lg" onClick={handleStartInterview}>
            <span className="material-icons mr-2">add</span>
            Commencer un entretien
          </Button>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <h2 className="text-xl font-semibold text-primary-dark mb-4">Historique des entretiens</h2>
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : interviews.length === 0 ? (
          <Card className="p-8 text-center">
            <span className="material-icons text-4xl text-muted mb-4">history</span>
            <p className="text-muted">Aucun entretien pour le moment</p>
            <p className="text-sm text-muted mt-1">Commencez votre premier entretien pour voir votre historique ici</p>
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
                <Card 
                  className="p-4 flex items-center justify-between hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => navigate(`/interview/${interview.id}/context`)}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      interview.status === 'COMPLETED' 
                        ? 'bg-green-100 text-green-600' 
                        : interview.status === 'IN_PROGRESS'
                        ? 'bg-yellow-100 text-yellow-600'
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      <span className="material-icons text-lg">
                        {interview.status === 'COMPLETED' ? 'check_circle' : interview.status === 'IN_PROGRESS' ? 'pending' : 'schedule'}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-medium text-primary-dark">{interview.jobTitle}</h3>
                      {interview.company && <p className="text-sm text-muted">{interview.company}</p>}
                      <p className="text-xs text-muted mt-1">
                        {new Date(interview.createdAt).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                  </div>
                  {interview.score !== null && interview.score !== undefined && (
                    <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                      interview.score >= 70 ? 'bg-green-100 text-green-700' :
                      interview.score >= 50 ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {interview.score}%
                    </div>
                  )}
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </>
  );
}