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
  }
};
