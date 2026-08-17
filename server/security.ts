import type { NextFunction, Request, Response } from 'express';

export const ROLES = ['SUPER_ADMIN', 'ADMIN', 'MEMBER'] as const;
export const TASK_STATUSES = ['TODO', 'IN_PROGRESS', 'DONE'] as const;
export const TASK_PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'] as const;

export const isValidEmail = (value: unknown) =>
  typeof value === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) && value.length <= 254;
export const isValidDate = (value: unknown) =>
  value === null || value === undefined || value === '' ||
  (typeof value === 'string' && !Number.isNaN(new Date(value).getTime()));
export const isShortString = (value: unknown, max = 5000) =>
  typeof value === 'string' && value.trim().length > 0 && value.length <= max;

/** In-memory limiter. Use a shared-store limiter (e.g. Redis) when running multiple instances. */
export const rateLimit = (limit: number, windowMs: number) => {
  const hits = new Map<string, { count: number; reset: number }>();
  return (req: Request, res: Response, next: NextFunction) => {
    const key = `${req.ip}:${req.path}`;
    const now = Date.now();
    const item = hits.get(key);
    if (!item || item.reset <= now) {
      hits.set(key, { count: 1, reset: now + windowMs });
      return next();
    }
    item.count += 1;
    if (item.count > limit) {
      res.setHeader('Retry-After', Math.ceil((item.reset - now) / 1000));
      return res.status(429).json({ error: 'Too many requests. Please try again later.' });
    }
    next();
  };
};
