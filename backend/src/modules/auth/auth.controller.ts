import { Request, Response } from 'express';
import { AuthService } from './auth.service.js';

export const AuthController = {
  async register(req: Request, res: Response): Promise<void> {
    try {
      const user = await AuthService.register(req.body);
      console.log(user);
      res.status(201).json({ message: 'User registered successfully', user });
    } catch (error: any) {
      if (error.message === 'Email already in use') {
        res.status(400).json({ error: error.message });
        return;
      }
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  async adminRegister(req: Request, res: Response): Promise<void> {
    try {
      const user = await AuthService.adminRegister(req.body);
      res.status(201).json({ message: 'Admin registered successfully', user });
    } catch (error: any) {
      if (error.message === 'Email already in use') {
        res.status(400).json({ error: error.message });
        return;
      }
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  async login(req: Request, res: Response): Promise<void> {
    try {
      const result = await AuthService.login(req.body);
      res.status(200).json({ message: 'Login successful', ...result });
    } catch (error: any) {
      if (error.message === 'Invalid credentials' || error.message === 'Invalid credentials or inactive account') {
        res.status(400).json({ error: error.message });
        return;
      }
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  async adminLogin(req: Request, res: Response): Promise<void> {
    try {
      const result = await AuthService.adminLogin(req.body);
      res.status(200).json({ message: 'Admin login successful', ...result });
    } catch (error: any) {
      if (error.message === 'Invalid credentials' || error.message === 'Invalid credentials or inactive account' || error.message === 'Unauthorized') {
        res.status(401).json({ error: error.message });
        return;
      }
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  async getProfile(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user.id;
      const profile = await AuthService.getProfile(userId);
      res.status(200).json(profile);
    } catch (error: any) {
      if (error.message === 'User not found') {
        res.status(404).json({ error: error.message });
        return;
      }
      res.status(500).json({ error: 'Internal server error' });
    }
  }
};
