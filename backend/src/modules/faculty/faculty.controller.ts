import { Request, Response } from 'express';
import { FacultyService } from './faculty.service.js';

export const FacultyController = {
  async getMyStudents(req: Request, res: Response): Promise<void> {
    try {
      const facultyId = (req as any).user.id;
      const students = await FacultyService.getMyStudents(facultyId);
      res.json(students);
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to fetch students' });
    }
  },

  async getAvailableQuestions(req: Request, res: Response): Promise<void> {
    try {
      const modules = await FacultyService.getAvailableQuestions();
      res.json(modules);
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to fetch questions' });
    }
  },

  async createTest(req: Request, res: Response): Promise<void> {
    try {
      const facultyId = (req as any).user.id;
      const { title, questionIds } = req.body;
      const test = await FacultyService.createCustomTest(facultyId, title, questionIds);
      res.json(test);
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to create test' });
    }
  },

  async getMyTests(req: Request, res: Response): Promise<void> {
    try {
      const facultyId = (req as any).user.id;
      const tests = await FacultyService.getMyTests(facultyId);
      res.json(tests);
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to fetch tests' });
    }
  }
};
