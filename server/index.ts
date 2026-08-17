import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import path from 'path';
import { PrismaClient } from '@prisma/client';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;
const corsOrigin = process.env.CORS_ORIGIN;
if (!corsOrigin) throw new Error('CORS_ORIGIN is required');

// Global Prisma Client instance
export const prisma = new PrismaClient();

app.use(helmet({ crossOriginResourcePolicy: { policy: 'same-site' } }));
app.use(cors({ origin: corsOrigin.split(',').map(origin => origin.trim()), methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'], credentials: false }));
app.use(express.json({ limit: '100kb' }));

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

app.get('/api/health', async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: 'ok', database: 'connected' });
  } catch (error) {
    console.error('Health check database error:', error);
    res.status(503).json({ status: 'unavailable' });
  }
});

app.use((error: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled request error:', error);
  res.status(500).json({ error: 'Internal server error' });
});

// Serve frontend in production
const __dirname = path.resolve();
app.use(express.static(path.join(__dirname, 'dist')));

app.get(/.*/, (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
