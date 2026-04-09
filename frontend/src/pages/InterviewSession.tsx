import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button, Card } from '../components/ui';

export default function InterviewSession() {
  const navigate = useNavigate();

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-4xl mx-auto"
    >
      <Card className="p-12 text-center">
        <div className="w-20 h-20 bg-primary-lighter rounded-full mx-auto mb-6 flex items-center justify-center">
          <span className="material-icons text-4xl text-primary-dark">mic</span>
        </div>
        <h2 className="text-2xl font-bold text-primary-dark mb-3">
          Session d'entretien en cours
        </h2>
        <p className="text-muted mb-6">
          Cette page est en cours de développement...
        </p>
        <Button variant="outline" onClick={() => navigate('/dashboard')}>
          Retour au dashboard
        </Button>
      </Card>
    </motion.div>
  );
}