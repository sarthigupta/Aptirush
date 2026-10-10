import { Request, Response } from 'express';
import { StudentService } from './student.service.js';

export const StudentController = {
  async getModules(req: Request, res: Response) {
    try {
      const modules = await StudentService.getModules();
      res.json(modules);
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to fetch modules' });
    }
  },
  
  async getModuleQuiz(req: Request, res: Response) {
    try {
      const quiz = await StudentService.getModuleQuiz(req.params.id as string);
      if (!quiz) {
         res.status(404).json({ error: 'Module not found' });
         return;
      }
      res.json(quiz);
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to fetch quiz' });
    }
  },

  async saveTestAttempt(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user.id;
      const { moduleId, score, total, customTestId, durationMs } = req.body;
      const attempt = await StudentService.saveTestAttempt(userId, moduleId || null, score, total, customTestId || null, durationMs || 0);
      res.json(attempt);
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to save attempt' });
    }
  },

  async getAssignedTests(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user.id;
      const tests = await StudentService.getAssignedTests(userId);
      res.json(tests);
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to fetch assigned tests' });
    }
  },

  async getDashboardStats(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user.id;
      const stats = await StudentService.getDashboardStats(userId);
      res.json(stats);
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to fetch stats' });
    }
  },

  async getLeaderboard(req: Request, res: Response): Promise<void> {
    try {
      const leaderboard = await StudentService.getLeaderboard();
      res.json(leaderboard);
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to fetch leaderboard' });
    }
  }
};
