import { Router, Request, Response } from 'express';
import { prisma } from '../config/database';
import { authMiddleware } from '../middleware/auth';
import { createAuditLog } from './auditLog';

const router = Router();

router.use(authMiddleware);

router.get('/dashboard', async (req: Request, res: Response) => {
  try {
    const projects = await prisma.project.findMany({
      where: { userId: req.user!.userId },
      select: {
        id: true, clientName: true, fiscalYearStart: true, fiscalYearEnd: true,
        dossierStatus: true, status: true, updatedAt: true,
        _count: { select: { documents: true, transactions: true, notifications: { where: { isRead: false } } } },
      },
      orderBy: { updatedAt: 'desc' },
    });

    const unreadNotifications = await prisma.notification.count({
      where: { userId: req.user!.userId, isRead: false },
    });

    res.json({ projects, unreadNotifications });
  } catch (err) {
    console.error('Client dashboard error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.get('/projects/:id', async (req: Request, res: Response) => {
  try {
    const project = await prisma.project.findFirst({
      where: { id: req.params.id, userId: req.user!.userId },
      include: {
        documents: {
          include: {
            extractions: {
              include: { fields: true },
              orderBy: { processedAt: 'desc' },
              take: 1,
            },
          },
          orderBy: { createdAt: 'desc' },
        },
        _count: { select: { transactions: true, anomalies: true } },
      },
    });
    if (!project) {
      res.status(404).json({ error: 'Projet introuvable' });
      return;
    }
    res.json({ project });
  } catch (err) {
    console.error('Client project error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.get('/notifications', async (req: Request, res: Response) => {
  try {
    const notifications = await prisma.notification.findMany({
      where: { userId: req.user!.userId },
      include: { project: { select: { clientName: true } } },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    const unreadCount = notifications.filter(n => !n.isRead).length;
    res.json({ notifications, unreadCount });
  } catch (err) {
    console.error('Client notifications error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.get('/profile', async (req: Request, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      select: {
        id: true, email: true, fullName: true, role: true,
        firmName: true, phoneNumber: true, emailVerified: true,
        raisonSociale: true, clientICE: true, clientRC: true,
        formeJuridique: true, createdAt: true,
      },
    });
    res.json({ user });
  } catch (err) {
    console.error('Profile error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.put('/profile', async (req: Request, res: Response) => {
  try {
    const { fullName, phoneNumber, raisonSociale, clientICE, clientRC, formeJuridique } = req.body;
    const user = await prisma.user.update({
      where: { id: req.user!.userId },
      data: { fullName, phoneNumber, raisonSociale, clientICE, clientRC, formeJuridique },
      select: {
        id: true, email: true, fullName: true, role: true,
        phoneNumber: true, emailVerified: true,
        raisonSociale: true, clientICE: true, clientRC: true, formeJuridique: true,
      },
    });
    await createAuditLog(req.user!.userId, null, 'PROFILE_UPDATED', {});
    res.json({ user });
  } catch (err) {
    console.error('Profile update error:', err);
    res.status(500).json({ error: 'Erreur de mise à jour' });
  }
});

export default router;
