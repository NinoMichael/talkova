import { prisma } from '../db/prisma';
export const interviewService = {
    async create(input) {
        const interview = await prisma.interview.create({
            data: {
                userId: input.userId,
                jobTitle: input.jobTitle,
                company: input.company || null,
                status: 'PENDING',
            },
        });
        return interview;
    },
    async update(id, input) {
        const interview = await prisma.interview.update({
            where: { id },
            data: {
                ...(input.context && { context: input.context }),
                ...(input.jobTitle && { jobTitle: input.jobTitle }),
                ...(input.company && { company: input.company }),
                ...(input.status && { status: input.status }),
            },
        });
        return interview;
    },
    async getByUserId(userId) {
        const interviews = await prisma.interview.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            include: {
                questions: true,
            },
        });
        return interviews;
    },
    async getById(id) {
        const interview = await prisma.interview.findUnique({
            where: { id },
            include: {
                questions: true,
            },
        });
        return interview;
    },
    async getStats(userId) {
        const interviews = await prisma.interview.findMany({
            where: { userId, status: 'COMPLETED' },
            select: {
                score: true,
                createdAt: true,
                jobTitle: true,
            },
        });
        if (interviews.length === 0) {
            return {
                totalInterviews: 0,
                averageScore: 0,
                totalQuestions: 0,
                recentScores: [],
            };
        }
        const scores = interviews.filter(i => i.score !== null).map(i => i.score);
        const averageScore = scores.length > 0
            ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
            : 0;
        return {
            totalInterviews: interviews.length,
            averageScore,
            totalQuestions: interviews.length * 3,
            recentScores: interviews.slice(0, 5).map(i => ({
                score: i.score,
                date: i.createdAt,
                jobTitle: i.jobTitle,
            })),
        };
    },
    async complete(id, score, feedback) {
        const interview = await prisma.interview.update({
            where: { id },
            data: {
                status: 'COMPLETED',
                score,
                feedback,
            },
        });
        return interview;
    },
};
