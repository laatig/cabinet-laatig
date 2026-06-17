import { Router, Request, Response } from 'express';
import { prisma } from '../config/database';
import { authMiddleware } from '../middleware/auth';
import { generateDemoTransactions } from '../services/demoData';
import { runRiskEngine } from '../services/riskEngine';
import { generateJournalEntries } from '../services/journalService';
import { notifyAnomalyDetected } from '../services/notificationService';

const router = Router();

router.use(authMiddleware);

router.post('/activate', async (req: Request, res: Response) => {
  try {
    const { projectId } = req.body;
    if (!projectId) {
      res.status(400).json({ error: 'projectId requis' });
      return;
    }

    const project = await prisma.project.findFirst({
      where: { id: projectId, userId: req.user!.userId },
    });
    if (!project) {
      res.status(404).json({ error: 'Projet introuvable' });
      return;
    }

    const existingDemo = await prisma.transaction.count({ where: { projectId } });
    if (existingDemo > 0) {
      await prisma.transaction.deleteMany({ where: { projectId } });
      await prisma.anomaly.deleteMany({ where: { projectId } });
      await prisma.journalEntry.deleteMany({ where: { projectId } });
    }

    await generateDemoTransactions(projectId);

    const anomalies = await runRiskEngine(projectId);
    await notifyAnomalyDetected(projectId, anomalies.length);

    await generateJournalEntries(projectId);

    const transactionCount = await prisma.transaction.count({ where: { projectId } });

    res.json({
      message: 'Mode démo activé avec succès',
      transactionsCreated: transactionCount,
      anomaliesDetected: anomalies.length,
    });
  } catch (err) {
    console.error('Demo activate error:', err);
    res.status(500).json({ error: 'Erreur lors de l\'activation du mode démo' });
  }
});

router.get('/status', async (req: Request, res: Response) => {
  try {
    const projects = await prisma.project.findMany({
      where: { userId: req.user!.userId },
      select: { id: true, clientName: true },
    });

    const projectStatuses = await Promise.all(
      projects.map(async (p) => {
        const count = await prisma.transaction.count({ where: { projectId: p.id } });
        return { projectId: p.id, clientName: p.clientName, isDemo: count > 0, transactionCount: count };
      })
    );

    res.json({ projects: projectStatuses });
  } catch (err) {
    console.error('Demo status error:', err);
    res.status(500).json({ error: 'Erreur lors de la vérification du statut' });
  }
});

export default router;
