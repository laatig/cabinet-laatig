import { Router, Request, Response } from 'express';
import { prisma } from '../config/database';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.use(authMiddleware);

router.get('/projects/:projectId/anomalies', async (req: Request, res: Response) => {
  try {
    const project = await prisma.project.findFirst({
      where: { id: req.params.projectId, userId: req.user!.userId },
    });
    if (!project) {
      res.status(404).json({ error: 'Projet introuvable' });
      return;
    }

    const where: any = { projectId: req.params.projectId };
    if (req.query.severity) {
      where.severity = req.query.severity;
    }
    if (req.query.status) {
      where.status = req.query.status;
    }

    const anomalies = await prisma.anomaly.findMany({
      where,
      include: {
        transaction: {
          select: { id: true, vendorName: true, totalAmount: true, date: true, description: true, documentType: true, status: true },
        },
      },
      orderBy: [
        { severity: 'asc' },
        { createdAt: 'desc' },
      ],
    });

    res.json({ anomalies });
  } catch (err) {
    console.error('List anomalies error:', err);
    res.status(500).json({ error: 'Erreur lors du chargement des anomalies' });
  }
});

router.post('/anomalies/:id/accept', async (req: Request, res: Response) => {
  try {
    const anomaly = await prisma.anomaly.findFirst({
      where: { id: req.params.id },
      include: { project: { select: { userId: true } } },
    });
    if (!anomaly || anomaly.project.userId !== req.user!.userId) {
      res.status(404).json({ error: 'Anomalie introuvable' });
      return;
    }
    const updated = await prisma.anomaly.update({
      where: { id: req.params.id },
      data: { status: 'ACCEPTED' },
    });
    res.json({ anomaly: updated });
  } catch (err) {
    console.error('Accept anomaly error:', err);
    res.status(500).json({ error: 'Erreur lors de l\'acceptation' });
  }
});

router.post('/anomalies/:id/reject', async (req: Request, res: Response) => {
  try {
    const anomaly = await prisma.anomaly.findFirst({
      where: { id: req.params.id },
      include: { project: { select: { userId: true } } },
    });
    if (!anomaly || anomaly.project.userId !== req.user!.userId) {
      res.status(404).json({ error: 'Anomalie introuvable' });
      return;
    }
    const updated = await prisma.anomaly.update({
      where: { id: req.params.id },
      data: { status: 'REJECTED' },
    });
    res.json({ anomaly: updated });
  } catch (err) {
    console.error('Reject anomaly error:', err);
    res.status(500).json({ error: 'Erreur lors du rejet' });
  }
});

router.post('/anomalies/:id/comment', async (req: Request, res: Response) => {
  try {
    const { explanation } = req.body;
    const anomaly = await prisma.anomaly.findFirst({
      where: { id: req.params.id },
      include: { project: { select: { userId: true } } },
    });
    if (!anomaly || anomaly.project.userId !== req.user!.userId) {
      res.status(404).json({ error: 'Anomalie introuvable' });
      return;
    }
    const updated = await prisma.anomaly.update({
      where: { id: req.params.id },
      data: { explanation },
    });
    res.json({ anomaly: updated });
  } catch (err) {
    console.error('Comment anomaly error:', err);
    res.status(500).json({ error: 'Erreur lors de l\'ajout du commentaire' });
  }
});

export default router;
