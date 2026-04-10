import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuthStore } from '../store/authStore';
import { useInterviewSession } from '../hooks/useInterviewSession';
import { interviewService } from '../services/interview';

export default function InterviewSession() {
  const { id: interviewId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  
  const [interview, setInterview] = useState<any>(null);
  const [showEndDialog, setShowEndDialog] = useState(false);

  const { isConnected, isListening, isSpeaking, waitingForUser, stopSpeaking, disconnect } = useInterviewSession({
    interviewId: interviewId!,
  });

  useEffect(() => {
    interviewService.getById(interviewId!).then(setInterview).catch(console.error);
  }, [interviewId]);

  const handleEnd = () => {
    stopSpeaking();
    disconnect();
    setShowEndDialog(false);
    navigate('/dashboard');
  };

  if (!user) {
    return <div className="min-h-screen flex items-center justify-center"><p className="text-white">Veuillez vous connecter</p></div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 flex flex-col items-center justify-center p-8">
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
        <div className="mb-6">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full mb-4">
            <span className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-400' : 'bg-yellow-400 animate-pulse'}`} />
            <span className="text-white/80 text-sm">{isConnected ? 'En ligne' : 'Connexion...'}</span>
          </div>
          <h1 className="text-2xl font-bold text-white mb-1">Entretien vidéo</h1>
          <p className="text-white/60 text-sm">{interview?.jobTitle || 'Poste à définir'}</p>
        </div>

        <div className="relative mb-6">
          <motion.div 
            animate={{ scale: (isListening || waitingForUser) ? [1, 1.1, 1] : 1 }}
            transition={{ repeat: (isListening || waitingForUser) ? Infinity : 0, duration: 0.8 }}
            className={`w-32 h-32 rounded-full flex items-center justify-center mx-auto ${
              isSpeaking ? 'bg-blue-500 shadow-lg shadow-blue-500/50' : 
              waitingForUser ? 'bg-green-500 shadow-lg shadow-green-500/50 animate-pulse' :
              isListening ? 'bg-red-500 shadow-lg shadow-red-500/50' : isConnected ? 'bg-primary shadow-lg shadow-primary/50' : 'bg-gray-600'
            }`}
          >
            <span className="material-icons text-5xl text-white">
              {isSpeaking ? 'volume_up' : waitingForUser ? 'record_voice_over' : isListening ? 'mic' : isConnected ? 'person' : 'hourglass_empty'}
            </span>
          </motion.div>
          {(isListening || waitingForUser) && (
            <motion.div animate={{ scale: [1, 1.4, 1], opacity: [0.5, 0, 0.5] }} transition={{ repeat: Infinity, duration: 1.5 }} className={`absolute inset-0 rounded-full border-4 mx-auto w-32 h-32 ${waitingForUser ? 'border-green-400' : 'border-red-400'}`} />
          )}
        </div>

        <p className="text-white/60 mb-6 text-sm">
          {isSpeaking ? 'Le recruteur parle...' : 
           waitingForUser ? 'À vous ! Parlez maintenant...' : 
           isListening ? 'Écoute en cours...' : 
           isConnected ? 'Conversation en cours' : 'Connexion au recruteur...'}
        </p>

        {isConnected && (
          <button onClick={() => setShowEndDialog(true)} className="w-16 h-16 rounded-full bg-gray-600 hover:bg-gray-500 flex items-center justify-center shadow-lg mx-auto">
            <span className="material-icons text-3xl text-white">call_end</span>
          </button>
        )}
      </motion.div>

      {showEndDialog && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 bg-black/70 flex items-center justify-center p-4" onClick={() => setShowEndDialog(false)}>
          <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-white rounded-2xl p-6 max-w-sm" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Terminer l'entretien ?</h3>
            <p className="text-gray-500 mb-4">Êtes-vous sûr de vouloir mettre fin à cet entretien ?</p>
            <div className="flex gap-3">
              <button onClick={() => setShowEndDialog(false)} className="flex-1 py-2 px-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">Annuler</button>
              <button onClick={handleEnd} className="flex-1 py-2 px-4 bg-red-500 text-white rounded-lg hover:bg-red-600">Terminer</button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}