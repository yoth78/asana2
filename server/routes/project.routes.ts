import { Router } from 'express';
import { prisma } from '../index';
import { authenticate } from './auth.routes';

const router = Router();
router.use(authenticate);

// Get projects for workspace
router.get('/:workspaceId', async (req: any, res) => {
  try {
    const { workspaceId } = req.params;
    const projects = await prisma.project.findMany({
      where: { workspaceId }
    });
    // Map to match frontend Project type if needed, but Prisma schema looks similar enough
    res.json(projects);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/', async (req: any, res) => {
  try {
    const { name, description, workspaceId, deptId, status, startDate, dueDate } = req.body;
    const project = await prisma.project.create({
      data: {
        name,
        description,
        workspaceId,
        teamId: deptId,
        status: status || 'ACTIVE',
        startDate: startDate ? new Date(startDate) : null,
        dueDate: dueDate ? new Date(dueDate) : null
      }
    });
    res.status(201).json(project);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/:id', async (req: any, res) => {
  try {
    const { id } = req.params;
    await prisma.project.delete({ where: { id } });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
