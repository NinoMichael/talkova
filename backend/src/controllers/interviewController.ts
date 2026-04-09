import { Request, Response } from 'express';
import { interviewService } from '../services/interviewService';
import { z } from 'zod';

const createInterviewSchema = z.object({
  jobTitle: z.string().min(1),
  company: z.string().optional(),
});

const completeInterviewSchema = z.object({
  score: z.number().min(0).max(100),
  feedback: z.string(),
});

export const interviewController = {
  async create(req: Request, res: Response) {
    try {
      const userId = (req.query.userId as string) || req.body.userId;
      const input = createInterviewSchema.parse(req.body);
      const interview = await interviewService.create({ ...input, userId });
      res.status(201).json(interview);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Invalid input', details: error.errors });
      }
      res.status(400).json({ error: error.message || 'Failed to create interview' });
    }
  },

  async getAll(req: Request, res: Response) {
    try {
      const userId = (req.query.userId as string) || req.body.userId;
      const interviews = await interviewService.getByUserId(userId);
      res.json(interviews);
    } catch (error: any) {
      res.status(500).json({ error: 'Failed to get interviews' });
    }
  },

  async getStats(req: Request, res: Response) {
    try {
      const userId = (req.query.userId as string) || req.body.userId;
      const stats = await interviewService.getStats(userId);
      res.json(stats);
    } catch (error: any) {
      res.status(500).json({ error: 'Failed to get stats' });
    }
  },

  async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const interview = await interviewService.getById(id);
      if (!interview) {
        return res.status(404).json({ error: 'Interview not found' });
      }
      res.json(interview);
    } catch (error: any) {
      res.status(500).json({ error: 'Failed to get interview' });
    }
  },

  async complete(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const input = completeInterviewSchema.parse(req.body);
      const interview = await interviewService.complete(id, input.score, input.feedback);
      res.json(interview);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Invalid input', details: error.errors });
      }
      res.status(400).json({ error: error.message || 'Failed to complete interview' });
    }
  },
};