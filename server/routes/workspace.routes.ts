import { Router } from 'express';
import { prisma } from '../index';
import { authenticate } from './auth.routes';

const router = Router();

router.use(authenticate);

// Get all workspaces for the authenticated user
router.get('/', async (req: any, res) => {
  try {
    const workspaces = await prisma.workspace.findMany({
      where: { ownerId: req.user.userId }
    });
    res.json(workspaces);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create workspace
router.post('/', async (req: any, res) => {
  try {
    const { name } = req.body;
    const workspace = await prisma.workspace.create({
      data: {
        name,
        ownerId: req.user.userId,
      }
    });
    res.status(201).json(workspace);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
