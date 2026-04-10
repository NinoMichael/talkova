import { prisma } from '../db/prisma';
import bcrypt from 'bcryptjs';
export const authService = {
    async register(input) {
        const existingUser = await prisma.user.findUnique({
            where: { email: input.email },
        });
        if (existingUser) {
            throw new Error('Email already in use');
        }
        const hashedPassword = await bcrypt.hash(input.password, 10);
        const username = input.username || input.email.split('@')[0];
        const user = await prisma.user.create({
            data: {
                email: input.email,
                password: hashedPassword,
                username,
                profile: input.fullName || input.careers || input.education ? {
                    create: {
                        fullName: input.fullName || null,
                        careers: input.careers ? {
                            create: input.careers.map(c => ({ title: c.title }))
                        } : undefined,
                        education: input.education ? {
                            create: input.education.map(e => ({
                                institution: e.institution,
                                degree: e.degree,
                                field: e.field,
                                startDate: e.startDate || null,
                                endDate: e.endDate || null,
                            }))
                        } : undefined,
                        internships: input.internships ? {
                            create: input.internships.map(i => ({
                                company: i.company,
                                position: i.position,
                                startDate: i.startDate || null,
                                endDate: i.endDate || null,
                                description: i.description || null,
                            }))
                        } : undefined,
                        experiences: input.experiences ? {
                            create: input.experiences.map(exp => ({
                                title: exp.title,
                                company: exp.company,
                                startDate: exp.startDate || null,
                                endDate: exp.endDate || null,
                                description: exp.description || null,
                            }))
                        } : undefined,
                    }
                } : undefined,
            },
        });
        return {
            user: { id: user.id, email: user.email, username: user.username },
        };
    },
    async login(input) {
        const user = await prisma.user.findUnique({
            where: { email: input.email },
        });
        if (!user) {
            throw new Error('Invalid credentials');
        }
        const isValid = await bcrypt.compare(input.password, user.password);
        if (!isValid) {
            throw new Error('Invalid credentials');
        }
        return {
            user: { id: user.id, email: user.email, username: user.username },
        };
    },
};
