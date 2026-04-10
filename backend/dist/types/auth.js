import { z } from 'zod';
export const registerSchema = z.object({
    fullName: z.string().min(2, 'Le nom doit contenir au moins 2 caractères'),
    email: z.string().email('Email invalide'),
    password: z.string().min(6, 'Le mot de passe doit contenir au moins 6 caractères'),
    confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
    message: 'Les mots de passe ne correspondent pas',
    path: ['confirmPassword'],
});
export const loginSchema = z.object({
    email: z.string().email('Email invalide'),
    password: z.string().min(1, 'Le mot de passe est requis'),
});
export const careerSchema = z.object({
    title: z.string().min(1, 'Le titre est requis'),
});
export const educationSchema = z.object({
    institution: z.string().min(1, "L'établissement est requis"),
    degree: z.string().min(1, 'Le diplôme est requis'),
    field: z.string().optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
});
export const internshipSchema = z.object({
    company: z.string().min(1, 'L\'entreprise est requise'),
    position: z.string().min(1, 'Le poste est requis'),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    description: z.string().optional(),
});
export const experienceSchema = z.object({
    title: z.string().min(1, 'Le titre est requis'),
    company: z.string().min(1, 'L\'entreprise est requise'),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    description: z.string().optional(),
});
