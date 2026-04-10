import { authService, } from "../services/authService";
import { z } from "zod";
const registerSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
    username: z.string().optional(),
    fullName: z.string().optional(),
    careers: z.array(z.object({ title: z.string() })).optional(),
    education: z.array(z.object({
        institution: z.string(),
        degree: z.string(),
        field: z.string(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
    })).optional(),
    internships: z.array(z.object({
        company: z.string(),
        position: z.string(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
        description: z.string().optional(),
    })).optional(),
    experiences: z.array(z.object({
        title: z.string(),
        company: z.string(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
        description: z.string().optional(),
    })).optional(),
});
const loginSchema = z.object({
    email: z.string().email(),
    password: z.string(),
});
export const authController = {
    async register(req, res) {
        try {
            const input = registerSchema.parse(req.body);
            const result = await authService.register(input);
            res.status(201).json(result);
        }
        catch (error) {
            if (error instanceof z.ZodError) {
                return res
                    .status(400)
                    .json({ error: "Invalid input", details: error.errors });
            }
            res.status(400).json({ error: error.message || "Registration failed" });
        }
    },
    async login(req, res) {
        try {
            const input = loginSchema.parse(req.body);
            const result = await authService.login(input);
            res.json(result);
        }
        catch (error) {
            if (error instanceof z.ZodError) {
                return res
                    .status(400)
                    .json({ error: "Invalid input", details: error.errors });
            }
            res.status(401).json({ error: error.message || "Login failed" });
        }
    },
};
