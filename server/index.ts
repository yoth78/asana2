import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

// Global Prisma Client instance
export const prisma = new PrismaClient();

app.use(cors());
app.use(express.json());

import authRoutes from './routes/auth.routes';
import workspaceRoutes from './routes/workspace.routes';
import departmentRoutes from './routes/department.routes';
import projectRoutes from './routes/project.routes';
import taskRoutes from './routes/task.routes';

app.use('/api/auth', authRoutes);
app.use('/api/workspaces', workspaceRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/tasks', taskRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
