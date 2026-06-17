import { Router, Request, Response } from 'express';
import { prisma } from '../config/database';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.use(authMiddleware);

router.get('/', async (req: Request, res: Response) => {
  try {
    const notifications = await prisma.notification.findMany({
      where: {
        OR: [
          { userId: req.user!.userId },
          { project: { userId: req.user!.userId } },
        ],
      },
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
    await prisma.notification.updateMany({
      where: {
        OR: [
          { userId: req.user!.userId, isRead: false },
          { project: { userId: req.user!.userId }, isRead: false },
        ],
      },
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
    if (!notification) {
      res.status(404).json({ error: 'Notification introuvable' });
      return;
    }
    if (notification.project.userId !== req.user!.userId && notification.userId !== req.user!.userId) {
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
