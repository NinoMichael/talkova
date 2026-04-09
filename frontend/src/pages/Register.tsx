import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Button, Input, Card } from '../components/ui';
import { StepIndicator } from '../components/features';
import { Logo } from '../components/features/Logo';
import { useDynamicFields } from '../hooks';
import { authService } from '../services/auth';
import { useAuthStore } from '../store/authStore';
import type { Career, Education, Internship, Experience } from '../types';

export default function Register() {
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);
  const [step, setStep] = useState(1);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const [personalData, setPersonalData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const careers = useDynamicFields<Career>({ initialValue: [{ id: '1', title: '' }] });
  const education = useDynamicFields<Education>({ initialValue: [{ id: '1', institution: '', degree: '', field: '', startDate: '', endDate: '' }] });
  const internships = useDynamicFields<Internship>({ initialValue: [{ id: '1', company: '', position: '', startDate: '', endDate: '', description: '' }] });
  const experiences = useDynamicFields<Experience>({ initialValue: [{ id: '1', title: '', company: '', startDate: '', endDate: '', description: '' }] });

  const handlePersonalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPersonalData({ ...personalData, [e.target.name]: e.target.value });
  };

  const handleStep1Submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!personalData.fullName || !personalData.email || !personalData.password || !personalData.confirmPassword) {
      setError('Veuillez remplir tous les champs');
      return;
    }

    if (personalData.password !== personalData.confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }

    if (personalData.password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    setStep(2);
  };

  const handleStep2Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const result = await authService.register({
        fullName: personalData.fullName,
        email: personalData.email,
        password: personalData.password,
        careers: careers.items.filter(c => c.title.trim() !== ''),
        education: education.items.filter(e => e.institution.trim() !== ''),
        internships: internships.items.filter(i => i.company.trim() !== ''),
        experiences: experiences.items.filter(exp => exp.title.trim() !== ''),
      });
      
      login(result.user);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || "Erreur lors de l'inscription");
      setIsLoading(false);
    }
  };

  const icons = {
    career: <span className="material-icons text-xl">work</span>,
    education: <span className="material-icons text-xl">school</span>,
    internship: <span className="material-icons text-xl">business</span>,
    experience: <span className="material-icons text-xl">history</span>,
  };

  return (
    <motion.div 
      className="min-h-screen flex items-center justify-center px-4 py-8 bg-background"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      <motion.div 
        className="w-full max-w-2xl"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <motion.div 
          className="text-center mb-8"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <Link to="/">
            <Logo size="md" />
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: 0.3 }}
        >
          <Card variant="elevated" className="p-8">
            <StepIndicator currentStep={step} totalSteps={2} />

            <AnimatePresence mode="wait">
              {step === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="text-center mb-6">
                    <motion.div 
                      className="w-14 h-14 bg-primary-lighter rounded-full mx-auto mb-4 flex items-center justify-center"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ duration: 0.4, delay: 0.3 }}
                    >
                      <span className="material-icons text-2xl text-primary-dark">person_add</span>
                    </motion.div>
                    <h1 className="text-2xl font-bold text-primary-dark mb-2">
                      Créer votre compte
                    </h1>
                    <p className="text-muted">
                      Commencez votre parcours vers le succès
                    </p>
                  </div>

                  {error && (
                    <motion.div 
                      className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-6 text-sm flex items-center gap-2"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <span className="material-icons text-lg">error</span>
                      {error}
                    </motion.div>
                  )}

                  <form onSubmit={handleStep1Submit} className="space-y-5">
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: 0.4 }}
                    >
                      <Input
                        type="text"
                        label="Nom complet"
                        name="fullName"
                        placeholder="Jean Dupont"
                        value={personalData.fullName}
                        onChange={handlePersonalChange}
                        required
                      />
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: 0.5 }}
                    >
                      <Input
                        type="email"
                        label="Email"
                        name="email"
                        placeholder="vous@exemple.com"
                        value={personalData.email}
                        onChange={handlePersonalChange}
                        required
                      />
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: 0.6 }}
                    >
                      <Input
                        type="password"
                        label="Mot de passe"
                        name="password"
                        placeholder="••••••••"
                        value={personalData.password}
                        onChange={handlePersonalChange}
                        required
                      />
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: 0.7 }}
                    >
                      <Input
                        type="password"
                        label="Confirmer le mot de passe"
                        name="confirmPassword"
                        placeholder="••••••••"
                        value={personalData.confirmPassword}
                        onChange={handlePersonalChange}
                        required
                      />
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: 0.8 }}
                    >
                      <Button type="submit" className="w-full">
                        <span className="material-icons mr-2">arrow_forward</span>
                        Suivant
                      </Button>
                    </motion.div>
                  </form>

                  <motion.p 
                    className="mt-6 text-center text-muted"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3, delay: 0.9 }}
                  >
                    Déjà un compte ?{' '}
                    <Link to="/login" className="text-primary font-medium hover:underline">
                      Se connecter
                    </Link>
                  </motion.p>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="text-center mb-6">
                    <motion.div 
                      className="w-14 h-14 bg-primary-lighter rounded-full mx-auto mb-4 flex items-center justify-center"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ duration: 0.4 }}
                    >
                      <span className="material-icons text-2xl text-primary-dark">description</span>
                    </motion.div>
                    <h1 className="text-2xl font-bold text-primary-dark mb-2">
                      Votre parcours professionnel
                    </h1>
                    <p className="text-muted">
                      Décrivez votre expérience pour des simulations personnalisées
                    </p>
                  </div>

                  {error && (
                    <motion.div 
                      className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-6 text-sm flex items-center gap-2"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <span className="material-icons text-lg">error</span>
                      {error}
                    </motion.div>
                  )}

                  <form onSubmit={handleStep2Submit} className="space-y-6">
                    <FieldSection title="Emplois envisagés" icon={icons.career} onAdd={careers.add}>
                      {careers.items.map((career) => (
                        <DynamicInput
                          key={career.id}
                          value={career.title}
                          onChange={(e) => careers.update(career.id, { title: e.target.value })}
                          onRemove={careers.items.length > 1 ? () => careers.remove(career.id) : undefined}
                          placeholder="Ex: Développeur Full Stack, Chef de projet..."
                        />
                      ))}
                    </FieldSection>

                    <FieldSection title="Formations" icon={icons.education} onAdd={education.add}>
                      {education.items.map((edu) => (
                        <div key={edu.id} className="bg-gray-50 rounded-xl p-4 space-y-3">
                          <div className="grid grid-cols-2 gap-3">
                            <input
                              type="text"
                              value={edu.institution}
                              onChange={(e) => education.update(edu.id, { institution: e.target.value })}
                              className="px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                              placeholder="Établissement"
                            />
                            <input
                              type="text"
                              value={edu.degree}
                              onChange={(e) => education.update(edu.id, { degree: e.target.value })}
                              className="px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                              placeholder="Diplôme"
                            />
                            <input
                              type="text"
                              value={edu.field}
                              onChange={(e) => education.update(edu.id, { field: e.target.value })}
                              className="px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                              placeholder="Domaine d'étude"
                            />
                            <div className="flex gap-2">
                              <input
                                type="month"
                                value={edu.startDate}
                                onChange={(e) => education.update(edu.id, { startDate: e.target.value })}
                                className="flex-1 px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                              />
                              <input
                                type="month"
                                value={edu.endDate}
                                onChange={(e) => education.update(edu.id, { endDate: e.target.value })}
                                className="flex-1 px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                              />
                            </div>
                          </div>
                          {education.items.length > 1 && (
                            <button
                              type="button"
                              onClick={() => education.remove(edu.id)}
                              className="text-sm text-red-500 hover:underline flex items-center gap-1"
                            >
                              <span className="material-icons text-sm">delete</span>
                              Supprimer
                            </button>
                          )}
                        </div>
                      ))}
                    </FieldSection>

                    <FieldSection title="Stages" icon={icons.internship} onAdd={internships.add}>
                      {internships.items.map((intern) => (
                        <div key={intern.id} className="bg-gray-50 rounded-xl p-4 space-y-3">
                          <div className="grid grid-cols-2 gap-3">
                            <input
                              type="text"
                              value={intern.company}
                              onChange={(e) => internships.update(intern.id, { company: e.target.value })}
                              className="px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                              placeholder="Entreprise"
                            />
                            <input
                              type="text"
                              value={intern.position}
                              onChange={(e) => internships.update(intern.id, { position: e.target.value })}
                              className="px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                              placeholder="Poste"
                            />
                            <input
                              type="month"
                              value={intern.startDate}
                              onChange={(e) => internships.update(intern.id, { startDate: e.target.value })}
                              className="px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                            />
                            <input
                              type="month"
                              value={intern.endDate}
                              onChange={(e) => internships.update(intern.id, { endDate: e.target.value })}
                              className="px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                            />
                          </div>
                          <textarea
                            value={intern.description}
                            onChange={(e) => internships.update(intern.id, { description: e.target.value })}
                            className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                            placeholder="Description de votre mission..."
                            rows={2}
                          />
                          {internships.items.length > 1 && (
                            <button
                              type="button"
                              onClick={() => internships.remove(intern.id)}
                              className="text-sm text-red-500 hover:underline flex items-center gap-1"
                            >
                              <span className="material-icons text-sm">delete</span>
                              Supprimer
                            </button>
                          )}
                        </div>
                      ))}
                    </FieldSection>

                    <FieldSection title="Expériences professionnelles" icon={icons.experience} onAdd={experiences.add}>
                      {experiences.items.map((exp) => (
                        <div key={exp.id} className="bg-gray-50 rounded-xl p-4 space-y-3">
                          <div className="grid grid-cols-2 gap-3">
                            <input
                              type="text"
                              value={exp.title}
                              onChange={(e) => experiences.update(exp.id, { title: e.target.value })}
                              className="px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                              placeholder="Poste"
                            />
                            <input
                              type="text"
                              value={exp.company}
                              onChange={(e) => experiences.update(exp.id, { company: e.target.value })}
                              className="px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                              placeholder="Entreprise"
                            />
                            <input
                              type="month"
                              value={exp.startDate}
                              onChange={(e) => experiences.update(exp.id, { startDate: e.target.value })}
                              className="px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                            />
                            <input
                              type="month"
                              value={exp.endDate}
                              onChange={(e) => experiences.update(exp.id, { endDate: e.target.value })}
                              className="px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                            />
                          </div>
                          <textarea
                            value={exp.description}
                            onChange={(e) => experiences.update(exp.id, { description: e.target.value })}
                            className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                            placeholder="Description de vos missions..."
                            rows={2}
                          />
                          {experiences.items.length > 1 && (
                            <button
                              type="button"
                              onClick={() => experiences.remove(exp.id)}
                              className="text-sm text-red-500 hover:underline flex items-center gap-1"
                            >
                              <span className="material-icons text-sm">delete</span>
                              Supprimer
                            </button>
                          )}
                        </div>
                      ))}
                    </FieldSection>

                    <motion.div 
                      className="flex gap-3 pt-4"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: 0.5 }}
                    >
                      <Button type="button" variant="outline" onClick={() => setStep(1)} className="flex-1">
                        <span className="material-icons mr-2">arrow_back</span>
                        Retour
                      </Button>
                      <Button type="submit" className="flex-1" isLoading={isLoading}>
                        <span className="material-icons mr-2">check</span>
                        S'inscrire
                      </Button>
                    </motion.div>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>
          </Card>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

function FieldSection({ title, icon, onAdd, children }: { title: string; icon: React.ReactNode; onAdd: () => void; children: React.ReactNode }) {
  return (
    <motion.div 
      className="space-y-3"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center justify-between">
        <label className="text-sm font-semibold text-primary-dark flex items-center gap-2">
          {icon}
          {title}
        </label>
        <button type="button" onClick={onAdd} className="text-sm text-primary hover:underline font-medium flex items-center gap-1">
          <span className="material-icons text-sm">add</span>
          Ajouter
        </button>
      </div>
      {children}
    </motion.div>
  );
}

function DynamicInput({ value, onChange, onRemove, placeholder }: { value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; onRemove?: () => void; placeholder: string }) {
  return (
    <motion.div 
      className="flex gap-2"
      layout
    >
      <input
        type="text"
        value={value}
        onChange={onChange}
        className="flex-1 px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
        placeholder={placeholder}
      />
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="px-3 py-2 text-red-500 hover:bg-red-50 rounded-lg"
        >
          <span className="material-icons">close</span>
        </button>
      )}
    </motion.div>
  );
}