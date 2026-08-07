import { Router } from 'express';
import { prisma } from '../index';
import { authenticate } from './auth.routes';

const router = Router();
router.use(authenticate);

// Get all departments (Teams in schema)
router.get('/:workspaceId', async (req: any, res) => {
  try {
    const { workspaceId } = req.params;
    const teams = await prisma.team.findMany({
      where: { workspaceId },
      include: {
        lead: true,
        members: true
      }
    });
    // Map to frontend Department format
    const departments = teams.map(t => ({
      id: t.id,
      name: t.name,
      leadId: t.leadId,
      memberCount: t.members.length,
      budget: 0, // Mocked for now as it's not in schema
      expenses: 0,
      goals: []
    }));
    res.json(departments);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create department (Team)
router.post('/', async (req: any, res) => {
  try {
    const { name, workspaceId, leadId } = req.body;
    const team = await prisma.team.create({
      data: {
        name,
        workspaceId,
        leadId: leadId || null
      }
    });
    res.status(201).json(team);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete department
router.delete('/:id', async (req: any, res) => {
  try {
    const { id } = req.params;
    await prisma.team.delete({ where: { id } });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
