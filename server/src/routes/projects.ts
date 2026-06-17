import { Router, Request, Response } from 'express';
import { prisma } from '../config/database';
import { authMiddleware } from '../middleware/auth';
import { notifyStatusChange } from '../services/notificationService';

const router = Router();

router.use(authMiddleware);

router.get('/', async (req: Request, res: Response) => {
  try {
    const projects = await prisma.project.findMany({
      where: { userId: req.user!.userId },
      include: {
        _count: { select: { documents: true, transactions: true, anomalies: true, notifications: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });
    res.json({ projects });
  } catch (err) {
    console.error('List projects error:', err);
    res.status(500).json({ error: 'Erreur lors du chargement des projets' });
  }
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const { clientName, clientAddress, clientICE, clientRC, clientTP, fiscalYearStart, fiscalYearEnd, auditType } = req.body;
    if (!clientName || !fiscalYearStart || !fiscalYearEnd || !auditType) {
      res.status(400).json({ error: 'Champs obligatoires: clientName, fiscalYearStart, fiscalYearEnd, auditType' });
      return;
    }
    const project = await prisma.project.create({
      data: {
        userId: req.user!.userId,
        clientName,
        clientAddress,
        clientICE,
        clientRC,
        clientTP,
        fiscalYearStart: new Date(fiscalYearStart),
        fiscalYearEnd: new Date(fiscalYearEnd),
        auditType,
      },
      include: { _count: { select: { documents: true, transactions: true, anomalies: true } } },
    });
    res.status(201).json({ project });
  } catch (err) {
    console.error('Create project error:', err);
    res.status(500).json({ error: 'Erreur lors de la création du projet' });
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const project = await prisma.project.findFirst({
      where: { id: req.params.id, userId: req.user!.userId },
      include: { _count: { select: { documents: true, transactions: true, anomalies: true, notifications: true } } },
    });
    if (!project) {
      res.status(404).json({ error: 'Projet introuvable' });
      return;
    }
    res.json({ project });
  } catch (err) {
    console.error('Get project error:', err);
    res.status(500).json({ error: 'Erreur lors du chargement du projet' });
  }
});

router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { clientName, clientAddress, clientICE, clientRC, clientTP, fiscalYearStart, fiscalYearEnd, auditType } = req.body;
    const existing = await prisma.project.findFirst({
      where: { id: req.params.id, userId: req.user!.userId },
    });
    if (!existing) {
      res.status(404).json({ error: 'Projet introuvable' });
      return;
    }
    const project = await prisma.project.update({
      where: { id: req.params.id },
      data: {
        ...(clientName && { clientName }),
        ...(clientAddress !== undefined && { clientAddress }),
        ...(clientICE !== undefined && { clientICE }),
        ...(clientRC !== undefined && { clientRC }),
        ...(clientTP !== undefined && { clientTP }),
        ...(fiscalYearStart && { fiscalYearStart: new Date(fiscalYearStart) }),
        ...(fiscalYearEnd && { fiscalYearEnd: new Date(fiscalYearEnd) }),
        ...(auditType && { auditType }),
      },
    });
    res.json({ project });
  } catch (err) {
    console.error('Update project error:', err);
    res.status(500).json({ error: 'Erreur lors de la mise à jour du projet' });
  }
});

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const existing = await prisma.project.findFirst({
      where: { id: req.params.id, userId: req.user!.userId },
    });
    if (!existing) {
      res.status(404).json({ error: 'Projet introuvable' });
      return;
    }
    await prisma.project.delete({ where: { id: req.params.id } });
    res.json({ message: 'Projet supprimé avec succès' });
  } catch (err) {
    console.error('Delete project error:', err);
    res.status(500).json({ error: 'Erreur lors de la suppression du projet' });
  }
});

const DOSSIER_TRANSITIONS: Record<string, string[]> = {
  DOCUMENTS_RECEIVED: ['AI_ANALYSIS'],
  AI_ANALYSIS: ['IN_REVIEW'],
  IN_REVIEW: ['VALIDATED'],
  VALIDATED: [],
};

router.put('/:id/dossier-status', async (req: Request, res: Response) => {
  try {
    const { status } = req.body;
    const project = await prisma.project.findFirst({
      where: { id: req.params.id, userId: req.user!.userId },
    });
    if (!project) {
      res.status(404).json({ error: 'Projet introuvable' });
      return;
    }
    const allowed = DOSSIER_TRANSITIONS[project.dossierStatus] || [];
    if (!allowed.includes(status)) {
      res.status(400).json({
        error: `Transition invalide de "${project.dossierStatus}" vers "${status}". Transitions autorisées: ${allowed.join(', ')}`,
      });
      return;
    }
    const updated = await prisma.project.update({
      where: { id: req.params.id },
      data: { dossierStatus: status },
    });
    await notifyStatusChange(req.params.id, project.dossierStatus, status);
    res.json({ project: updated });
  } catch (err) {
    console.error('Update dossier status error:', err);
    res.status(500).json({ error: 'Erreur lors du changement de statut' });
  }
});

router.get('/:id/stats', async (req: Request, res: Response) => {
  try {
    const project = await prisma.project.findFirst({
      where: { id: req.params.id, userId: req.user!.userId },
    });
    if (!project) {
      res.status(404).json({ error: 'Projet introuvable' });
      return;
    }

    const [
      transactions,
      anomalies,
      verifiedTransactions,
      flaggedTransactions,
      disputedTransactions,
      totalAmount,
    ] = await Promise.all([
      prisma.transaction.count({ where: { projectId: req.params.id } }),
      prisma.anomaly.count({ where: { projectId: req.params.id } }),
      prisma.transaction.count({ where: { projectId: req.params.id, status: 'VERIFIED' } }),
      prisma.transaction.count({ where: { projectId: req.params.id, status: 'FLAGGED' } }),
      prisma.transaction.count({ where: { projectId: req.params.id, status: 'DISPUTED' } }),
      prisma.transaction.aggregate({ where: { projectId: req.params.id }, _sum: { totalAmount: true } }),
    ]);

    res.json({
      stats: {
        totalTransactions: transactions,
        totalAnomalies: anomalies,
        verifiedTransactions,
        flaggedTransactions,
        disputedTransactions,
        totalAmount: totalAmount._sum.totalAmount || 0,
      },
    });
  } catch (err) {
    console.error('Stats error:', err);
    res.status(500).json({ error: 'Erreur lors du chargement des statistiques' });
  }
});

export default router;
