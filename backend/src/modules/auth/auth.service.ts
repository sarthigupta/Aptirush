import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import {prisma} from '../../lib/prisma.js';
import { RegisterInput, LoginInput } from './auth.validation.js';

const JWT_SECRET = process.env.JWT_SECRET;
if(!JWT_SECRET){
  throw new Error("Jwt is not initalized");
}

export const AuthService = {
  async register(data: RegisterInput) {
    const { name, email, password, role } = data;

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      throw new Error('Email already in use');
    }

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password_hash,
        role: role || 'STUDENT',
      },
    });

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    };
  },

  async login(data: LoginInput) {
    const { email, password } = data;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.is_active || user.deleted_at) {
      throw new Error('Invalid credentials or inactive account');
    }

    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      throw new Error('Invalid credentials');
    }

    const token = jwt.sign(
      { id: user.id, role: user.role, email: user.email },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    return {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    };
  },

  async getProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        created_at: true,
        updated_at: true,
        is_active: true
      },
    });

    if (!user) {
      throw new Error('User not found');
    }

    return user;
  }
};
