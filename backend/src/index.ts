import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './modules/auth/auth.routes.js';
import adminRoutes from './modules/admin/admin.routes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Modular Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'AptiRush Backend is running (Modular Monolith)' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
