import { Router } from 'express';
import { prisma } from '../index';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key';

// Mock Email Service for Invitations
const mockEmailService = {
  sendInvitation: (email: string, inviteUrl: string) => {
    console.log('\n=======================================');
    console.log(`[MOCK EMAIL] Invitation sent to: ${email}`);
    console.log(`Click this link to accept: ${inviteUrl}`);
    console.log('=======================================\n');
  }
};

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
    
    const { passwordHash, ...userWithoutPassword } = user;
    res.json({ user: userWithoutPassword, token });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/signup', async (req, res) => {
  try {
    const { email, name, password } = req.body;
    
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(400).json({ error: 'Email already exists' });
    }

    const passwordHash = await bcrypt.hash(password || 'password123', 10);
    
    const user = await prisma.user.create({
      data: {
        email,
        name,
        passwordHash,
        role: 'SUPER_ADMIN', // First user logic or default
        isVerified: true
      }
    });

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
    
    const { passwordHash: _, ...userWithoutPassword } = user;
    res.status(201).json({ user: userWithoutPassword, token });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Middleware for authentication
export const authenticate = (req: any, res: any, next: any) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'No token provided' });
  
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

router.get('/me', authenticate, async (req: any, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.userId } });
    if (!user) return res.status(404).json({ error: 'User not found' });
    
    const { passwordHash, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/users', authenticate, async (req: any, res) => {
  try {
    const users = await prisma.user.findMany();
    const cleanUsers = users.map(u => {
      const { passwordHash, ...rest } = u;
      return rest;
    });
    res.json(cleanUsers);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Mock sending an invitation email
router.post('/invite', authenticate, async (req: any, res) => {
  try {
    const { email, name, role, departmentId } = req.body;
    
    // Check if user exists
    let user = await prisma.user.findUnique({ where: { email } });
    if (user) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Since we mock invitations without a separate Invitation model right now,
    // we'll just create the user directly but unverified.
    const tempPasswordHash = await bcrypt.hash(Math.random().toString(36), 10);
    user = await prisma.user.create({
      data: {
        email,
        name,
        role: role || 'MEMBER',
        passwordHash: tempPasswordHash,
        isVerified: false
      }
    });

    const inviteToken = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
    const inviteUrl = `http://localhost:5173/accept-invite?token=${inviteToken}`;
    
    // Call mock email service
    mockEmailService.sendInvitation(email, inviteUrl);

    res.json({ message: 'Invitation sent' });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
