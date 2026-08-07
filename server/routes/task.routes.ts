import { Router } from 'express';
import { prisma } from '../index';
import { authenticate } from './auth.routes';

const router = Router();
router.use(authenticate);

// Get tasks for project
router.get('/:projectId', async (req: any, res) => {
  try {
    const { projectId } = req.params;
    const tasks = await prisma.task.findMany({
      where: { projectId }
    });
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/', async (req: any, res) => {
  try {
    const { title, description, projectId, assigneeId, status, priority, dueDate } = req.body;
    const task = await prisma.task.create({
      data: {
        title,
        description,
        projectId,
        assigneeId,
        status: status || 'TODO',
        priority: priority || 'MEDIUM',
        dueDate: dueDate ? new Date(dueDate) : null
      }
    });
    res.status(201).json(task);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/:id', async (req: any, res) => {
  try {
    const { id } = req.params;
    const data = req.body;
    const updated = await prisma.task.update({
      where: { id },
      data
    });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/:id', async (req: any, res) => {
  try {
    const { id } = req.params;
    await prisma.task.delete({ where: { id } });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
