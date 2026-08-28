import { Router } from 'express';
import { prisma } from '../index';
import { authenticate } from './auth.routes';

const router = Router();
router.use(authenticate);

const DEFAULT_PROJECT_COLOR = '#6C5CE7';

router.get('/:workspaceId', async (req: any, res) => {
  try {
    const { workspaceId } = req.params;
    const user = req.actor;
    if (workspaceId !== user.workspaceId) {
      return res.status(403).json({ error: 'Cannot list projects in another workspace' });
    }

    const where: any = { workspaceId };
    if (user.role !== 'SUPER_ADMIN') {
      where.members = { some: { userId: user.id } };
    }

    const projects = await prisma.project.findMany({
      where,
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                profilePic: true
              }
            }
          }
        }
      }
    });
    res.json(
      projects.map(p => ({
        ...p,
        departmentId: p.teamId || undefined,
        color: p.color || DEFAULT_PROJECT_COLOR,
        ownerId: user.id,
        description: p.description || '',
        members: p.members.map(m => ({
          id: m.user.id,
          name: m.user.name,
          email: m.user.email,
          profilePic: m.user.profilePic,
          role: m.role
        }))
      }))
    );
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/', async (req: any, res) => {
  try {
    const {
      name,
      description,
      deptId,
      departmentId,
      teamId: bodyTeamId,
      status,
      startDate,
      dueDate,
      color,
      memberIds
    } = req.body;
    let { workspaceId } = req.body;

    const user = req.actor;
    if (user.role !== 'SUPER_ADMIN' && user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Only admins can create a project' });
    }

    const actorWorkspaceId = user.workspaceId;
    if (workspaceId && workspaceId !== actorWorkspaceId) {
      return res.status(403).json({ error: 'Cannot create a project in another workspace' });
    }
    workspaceId = actorWorkspaceId;

    let teamId = null;
    const selectedDeptId = deptId || departmentId || bodyTeamId;
    if (selectedDeptId && selectedDeptId !== "") {
      teamId = selectedDeptId;
    } else if (user.role === 'ADMIN') {
      if (!user.teamId) {
        return res.status(400).json({ error: 'Department admin has no department assigned' });
      }
      teamId = user.teamId;
    }

    if (teamId) {
      const team = await prisma.team.findFirst({ where: { id: teamId, workspaceId } });
      if (!team) {
        return res.status(400).json({ error: 'Invalid department for this workspace' });
      }
    }

    const project = await prisma.project.create({
      data: {
        name,
        description,
        workspaceId,
        teamId,
        color: color || null,
        status: status || 'ACTIVE',
        startDate: startDate ? new Date(startDate) : null,
        dueDate: dueDate ? new Date(dueDate) : null,
        members: {
          create: [
            // Always make the creator an ADMIN member
            { userId: user.id, role: 'ADMIN' },
            // Add all other selected members as MEMBER
            ...(Array.isArray(memberIds) ? memberIds.filter(id => id !== user.id).map((id: string) => ({ userId: id, role: 'MEMBER' })) : [])
          ]
        }
      }
    });
    const projectWithMembers = await prisma.project.findUnique({
      where: { id: project.id },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                profilePic: true
              }
            }
          }
        }
      }
    });
    if (!projectWithMembers) {
      return res.status(500).json({ error: 'Failed to retrieve created project' });
    }
    res.status(201).json({
      ...projectWithMembers,
      departmentId: projectWithMembers.teamId || undefined,
      color: projectWithMembers.color || DEFAULT_PROJECT_COLOR,
      ownerId: user.id,
      description: projectWithMembers.description || '',
      members: projectWithMembers.members.map(m => ({
        id: m.user.id,
        name: m.user.name,
        email: m.user.email,
        profilePic: m.user.profilePic,
        role: m.role
      }))
    });
  } catch (error) {
    console.error('Project creation failed:', error);
    res.status(500).json({ error: 'Internal server error', details: String(error) });
  }
});

router.put('/:id', async (req: any, res) => {
  try {
    const { id } = req.params;
    const { name, description, departmentId, deptId, teamId: bodyTeamId, color, memberIds } = req.body;
    const user = req.actor;
    const workspaceId = user.workspaceId;

    const project = await prisma.project.findUnique({ where: { id } });
    if (!project) return res.status(404).json({ error: 'Project not found' });
    if (project.workspaceId !== workspaceId) {
      return res.status(403).json({ error: 'Project is not in your workspace' });
    }

    const isOwningDeptAdmin =
      user.role === 'ADMIN' && Boolean(user.teamId) && project.teamId === user.teamId;
    if (user.role !== 'SUPER_ADMIN' && !isOwningDeptAdmin) {
      return res.status(403).json({ error: 'Not allowed to modify this project' });
    }

    let teamId = null;
    const selectedDeptId = deptId || departmentId || bodyTeamId;
    if (selectedDeptId && selectedDeptId !== "") {
      teamId = selectedDeptId;
    } else if (user.role === 'ADMIN') {
      teamId = user.teamId;
    }

    if (teamId) {
      const team = await prisma.team.findFirst({ where: { id: teamId, workspaceId } });
      if (!team) {
        return res.status(400).json({ error: 'Invalid department for this workspace' });
      }
    }

    const updated = await prisma.project.update({
      where: { id },
      data: {
        name,
        description,
        teamId,
        color: color || null
      }
    });

    if (Array.isArray(memberIds)) {
      await prisma.projectMember.deleteMany({ where: { projectId: id } });
      
      const uniqueMemberIds = Array.from(new Set([user.id, ...memberIds]));
      await prisma.projectMember.createMany({
        data: uniqueMemberIds.map(uid => ({
          projectId: id,
          userId: uid,
          role: uid === user.id ? 'ADMIN' : 'MEMBER'
        }))
      });
    }

    const updatedWithMembers = await prisma.project.findUnique({
      where: { id },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                profilePic: true
              }
            }
          }
        }
      }
    });

    if (!updatedWithMembers) {
      return res.status(500).json({ error: 'Failed to retrieve updated project' });
    }

    res.json({
      ...updatedWithMembers,
      departmentId: updatedWithMembers.teamId || undefined,
      color: updatedWithMembers.color || DEFAULT_PROJECT_COLOR,
      ownerId: user.id,
      description: updatedWithMembers.description || '',
      members: updatedWithMembers.members.map(m => ({
        id: m.user.id,
        name: m.user.name,
        email: m.user.email,
        profilePic: m.user.profilePic,
        role: m.role
      }))
    });
  } catch (error) {
    console.error('Project update failed:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/:id', async (req: any, res) => {
  try {
    const { id } = req.params;
    const user = req.actor;
    const workspaceId = user.workspaceId;

    const project = await prisma.project.findUnique({ where: { id } });
    if (!project) return res.status(404).json({ error: 'Project not found' });
    if (project.workspaceId !== workspaceId) {
      return res.status(403).json({ error: 'Project is not in your workspace' });
    }

    const isOwningDeptAdmin =
      user.role === 'ADMIN' && Boolean(user.teamId) && project.teamId === user.teamId;
    if (user.role !== 'SUPER_ADMIN' && !isOwningDeptAdmin) {
      return res.status(403).json({ error: 'Not allowed to delete this project' });
    }

    const taskCount = await prisma.task.count({ where: { projectId: id } });
    if (taskCount > 0) {
      return res.status(409).json({
        error: `Cannot delete project: ${taskCount} task${taskCount === 1 ? '' : 's'} ${
          taskCount === 1 ? 'is' : 'are'
        } still assigned to it. Move or remove them first.`
      });
    }

    await prisma.project.delete({ where: { id } });
    res.status(204).send();
  } catch (error) {
    console.error('Project delete error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
