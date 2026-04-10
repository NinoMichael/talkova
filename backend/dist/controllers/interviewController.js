import { interviewService } from "../services/interviewService.js";
import { aiService } from "../services/aiService.js";
import { z } from "zod";
const createInterviewSchema = z.object({
    jobTitle: z.string().min(1),
    company: z.string().optional(),
});
const completeInterviewSchema = z.object({
    score: z.number().min(0).max(100),
    feedback: z.string(),
});
export const interviewController = {
    async create(req, res) {
        try {
            const userId = req.query.userId || req.body.userId;
            const input = createInterviewSchema.parse(req.body);
            const interview = await interviewService.create({ ...input, userId });
            res.status(201).json(interview);
        }
        catch (error) {
            if (error instanceof z.ZodError) {
                return res
                    .status(400)
                    .json({ error: "Invalid input", details: error.errors });
            }
            res
                .status(400)
                .json({ error: error.message || "Failed to create interview" });
        }
    },
    async getAll(req, res) {
        try {
            const userId = req.query.userId || req.body.userId;
            const interviews = await interviewService.getByUserId(userId);
            res.json(interviews);
        }
        catch (error) {
            res.status(500).json({ error: "Failed to get interviews" });
        }
    },
    async getStats(req, res) {
        try {
            const userId = req.query.userId || req.body.userId;
            const stats = await interviewService.getStats(userId);
            res.json(stats);
        }
        catch (error) {
            res.status(500).json({ error: "Failed to get stats" });
        }
    },
    async getById(req, res) {
        try {
            const { id } = req.params;
            const interview = await interviewService.getById(id);
            if (!interview) {
                return res.status(404).json({ error: "Interview not found" });
            }
            res.json(interview);
        }
        catch (error) {
            res.status(500).json({ error: "Failed to get interview" });
        }
    },
    async generateContext(req, res) {
        try {
            const { id } = req.params;
            const context = await aiService.generateJobOfferContext(id);
            res.json(context);
        }
        catch (error) {
            console.error("Generate context error:", error);
            res
                .status(500)
                .json({ error: error.message || "Failed to generate context" });
        }
    },
    async complete(req, res) {
        try {
            const { id } = req.params;
            const input = completeInterviewSchema.parse(req.body);
            const interview = await interviewService.complete(id, input.score, input.feedback);
            res.json(interview);
        }
        catch (error) {
            if (error instanceof z.ZodError) {
                return res
                    .status(400)
                    .json({ error: "Invalid input", details: error.errors });
            }
            res
                .status(400)
                .json({ error: error.message || "Failed to complete interview" });
        }
    },
    async update(req, res) {
        try {
            const { id } = req.params;
            const { context, jobTitle, company, status } = req.body;
            const interview = await interviewService.update(id, {
                context,
                jobTitle,
                company,
                status,
            });
            res.json(interview);
        }
        catch (error) {
            res.status(400).json({ error: error.message || "Failed to update interview" });
        }
    },
};
