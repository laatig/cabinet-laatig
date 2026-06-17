import { Router, Request, Response } from 'express';
import { prisma } from '../config/database';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.use(authMiddleware);

router.get('/', async (req: Request, res: Response) => {
  try {
    const projects = await prisma.project.findMany({
      where: { userId: req.user!.userId },
      select: { id: true },
    });
    const projectIds = projects.map(p => p.id);

    const notifications = await prisma.notification.findMany({
      where: { projectId: { in: projectIds } },
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: { project: { select: { clientName: true } } },
    });

    const unreadCount = notifications.filter(n => !n.isRead).length;

    res.json({ notifications, unreadCount });
  } catch (err) {
    console.error('List notifications error:', err);
    res.status(500).json({ error: 'Erreur lors du chargement des notifications' });
  }
});

router.post('/mark-read', async (req: Request, res: Response) => {
  try {
    const projects = await prisma.project.findMany({
      where: { userId: req.user!.userId },
      select: { id: true },
    });
    const projectIds = projects.map(p => p.id);

    await prisma.notification.updateMany({
      where: { projectId: { in: projectIds }, isRead: false },
      data: { isRead: true },
    });

    res.json({ message: 'Notifications marquées comme lues' });
  } catch (err) {
    console.error('Mark read error:', err);
    res.status(500).json({ error: 'Erreur lors du marquage' });
  }
});

router.post('/:id/mark-read', async (req: Request, res: Response) => {
  try {
    const notification = await prisma.notification.findFirst({
      where: { id: req.params.id },
      include: { project: { select: { userId: true } } },
    });
    if (!notification || notification.project.userId !== req.user!.userId) {
      res.status(404).json({ error: 'Notification introuvable' });
      return;
    }
    const updated = await prisma.notification.update({
      where: { id: req.params.id },
      data: { isRead: true },
    });
    res.json({ notification: updated });
  } catch (err) {
    console.error('Mark one read error:', err);
    res.status(500).json({ error: 'Erreur lors du marquage' });
  }
});

export default router;
