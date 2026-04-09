import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '../components/ui';
import { Logo } from '../components/features/Logo';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
};

const featureVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, delay: 0.3 } }
};

export default function Landing() {
  return (
    <motion.div 
      className="min-h-screen flex flex-col bg-background"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      <motion.header 
        className="flex items-center justify-between px-6 lg:px-12 py-5"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <Logo size="sm" />
        <nav className="flex items-center gap-3">
          <Link
            to="/login"
            className="px-5 py-2.5 text-primary-dark font-medium hover:text-primary transition-colors"
          >
            Connexion
          </Link>
          <Link
            to="/register"
            className="px-5 py-2.5 bg-primary text-primary-dark font-medium rounded-lg hover:bg-primary-light transition-colors"
          >
            Inscription
          </Link>
        </nav>
      </motion.header>

      <main className="flex-1 flex flex-col items-center justify-center px-6 lg:px-12 py-12 lg:py-20">
        <motion.div 
          className="max-w-4xl text-center"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.div 
            variants={itemVariants}
            className="inline-flex items-center gap-2 bg-primary-lighter px-4 py-1.5 rounded-full mb-6"
          >
            <span className="material-icons text-sm text-primary-dark">auto_awesome</span>
            <span className="text-sm font-medium text-primary-dark">IA avancée pour vos entretiens</span>
          </motion.div>
          
          <motion.h1 
            variants={itemVariants}
            className="text-4xl md:text-5xl lg:text-6xl font-bold text-primary-dark mb-6 leading-tight"
          >
            Maîtrisez vos entretiens<br />
            <span className="text-primary">avec l'intelligence artificielle</span>
          </motion.h1>
          <motion.p 
            variants={itemVariants}
            className="text-lg md:text-xl text-muted mb-10 max-w-2xl mx-auto leading-relaxed"
          >
            Une plateforme de simulation d'entretien oral assistée par IA. 
            Entraînez-vous, recevez des retours personnalisés et décrochez votre rêve professionnel.
          </motion.p>
          <motion.div 
            variants={itemVariants}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Link to="/register">
              <Button size="lg" className="w-full sm:w-auto">
                <span className="material-icons mr-2 text-lg">rocket_launch</span>
                Commencer gratuitement
              </Button>
            </Link>
            <Link to="/login">
              <Button variant="outline" size="lg" className="w-full sm:w-auto">
                <span className="material-icons mr-2 text-lg">login</span>
                Se connecter
              </Button>
            </Link>
          </motion.div>
        </motion.div>

        <motion.div 
          className="mt-16 lg:mt-24 grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 max-w-5xl w-full"
          variants={featureVariants}
          initial="hidden"
          animate="visible"
        >
          <FeatureCard 
            icon={<span className="material-icons text-2xl">forum</span>}
            title="Simulations réalistes"
            description="Pratiquez avec des questions d'entretien adaptées à votre profil et domaine professionnel."
          />
          <FeatureCard 
            icon={<span className="material-icons text-2xl">psychology</span>}
            title="Feedback intelligent"
            description="Recevez des analyses approfondies sur vos points forts et axes d'amélioration."
          />
          <FeatureCard 
            icon={<span className="material-icons text-2xl">trending_up</span>}
            title="Progression continue"
            description="Suivez votre évolution et améliorez vos compétences à chaque session d'entraînement."
          />
        </motion.div>

        <motion.div 
          className="mt-24 w-full max-w-3xl"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <div className="bg-primary-lighter/50 rounded-2xl p-8 text-center border border-primary/20">
            <div className="flex items-center justify-center gap-3 mb-4">
              <span className="material-icons text-primary text-3xl">workspace_premium</span>
            </div>
            <h3 className="text-xl font-semibold text-primary-dark mb-2">Préparez-vous comme un professionnel</h3>
            <p className="text-muted max-w-xl mx-auto">
              Des milliers de candidats font confiance à Talkova pour réussir leurs entretiens.
              Rejoignez-les et boostez votre confiance.
            </p>
          </div>
        </motion.div>
      </main>

      <motion.footer 
        className="px-6 lg:px-12 py-6 text-center text-muted text-sm border-t border-gray-100"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.6 }}
      >
        <div className="flex flex-col md:flex-row items-center justify-center gap-4">
          <span>© {new Date().getFullYear()} Talkova. Tous droits réservés.</span>
          <div className="flex items-center gap-4">
            <Link to="/login" className="hover:text-primary transition-colors">Mentions légales</Link>
            <Link to="/login" className="hover:text-primary transition-colors">Confidentialité</Link>
            <Link to="/login" className="hover:text-primary transition-colors">Contact</Link>
          </div>
        </div>
      </motion.footer>
    </motion.div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <motion.div 
      className="bg-surface p-6 lg:p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-lg hover:border-primary/30 transition-all duration-300 group"
      whileHover={{ y: -5, transition: { duration: 0.2 } }}
    >
      <div className="w-14 h-14 bg-primary-lighter rounded-xl mb-5 flex items-center justify-center text-primary-dark group-hover:bg-primary group-hover:text-primary-dark transition-colors">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-primary-dark mb-3">{title}</h3>
      <p className="text-muted text-sm leading-relaxed">{description}</p>
    </motion.div>
  );
}