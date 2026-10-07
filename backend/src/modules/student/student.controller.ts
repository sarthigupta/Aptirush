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
  }
};
