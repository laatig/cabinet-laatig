import { Router, Request, Response } from 'express';
import { prisma } from '../config/database';
import { authMiddleware } from '../middleware/auth';
import {
  getBilan,
  getCpc,
  getBalance,
  getJournal,
  getGrandLivre,
  getTva,
} from '../services/financialService';

const router = Router();

router.use(authMiddleware);

router.get('/projects/:projectId/bilan', async (req: Request, res: Response) => {
  try {
    const project = await prisma.project.findFirst({
      where: { id: req.params.projectId, userId: req.user!.userId },
    });
    if (!project) {
      res.status(404).json({ error: 'Projet introuvable' });
      return;
    }
    const data = await getBilan(req.params.projectId);
    res.json({ data });
  } catch (err) {
    console.error('Bilan error:', err);
    res.status(500).json({ error: 'Erreur lors de la récupération du bilan' });
  }
});

router.get('/projects/:projectId/cpc', async (req: Request, res: Response) => {
  try {
    const project = await prisma.project.findFirst({
      where: { id: req.params.projectId, userId: req.user!.userId },
    });
    if (!project) {
      res.status(404).json({ error: 'Projet introuvable' });
      return;
    }
    const data = await getCpc(req.params.projectId);
    res.json({ data });
  } catch (err) {
    console.error('CPC error:', err);
    res.status(500).json({ error: 'Erreur lors de la récupération du compte de résultat' });
  }
});

router.get('/projects/:projectId/balance', async (req: Request, res: Response) => {
  try {
    const project = await prisma.project.findFirst({
      where: { id: req.params.projectId, userId: req.user!.userId },
    });
    if (!project) {
      res.status(404).json({ error: 'Projet introuvable' });
      return;
    }
    const data = await getBalance(req.params.projectId);
    res.json({ data });
  } catch (err) {
    console.error('Balance error:', err);
    res.status(500).json({ error: 'Erreur lors de la récupération de la balance' });
  }
});

router.get('/projects/:projectId/journal', async (req: Request, res: Response) => {
  try {
    const project = await prisma.project.findFirst({
      where: { id: req.params.projectId, userId: req.user!.userId },
    });
    if (!project) {
      res.status(404).json({ error: 'Projet introuvable' });
      return;
    }
    const data = await getJournal(req.params.projectId);
    res.json({ data });
  } catch (err) {
    console.error('Journal error:', err);
    res.status(500).json({ error: 'Erreur lors de la récupération du journal' });
  }
});

router.get('/projects/:projectId/grand-livre', async (req: Request, res: Response) => {
  try {
    const project = await prisma.project.findFirst({
      where: { id: req.params.projectId, userId: req.user!.userId },
    });
    if (!project) {
      res.status(404).json({ error: 'Projet introuvable' });
      return;
    }
    const data = await getGrandLivre(req.params.projectId);
    res.json({ data });
  } catch (err) {
    console.error('Grand livre error:', err);
    res.status(500).json({ error: 'Erreur lors de la récupération du grand livre' });
  }
});

router.get('/projects/:projectId/tva', async (req: Request, res: Response) => {
  try {
    const project = await prisma.project.findFirst({
      where: { id: req.params.projectId, userId: req.user!.userId },
    });
    if (!project) {
      res.status(404).json({ error: 'Projet introuvable' });
      return;
    }
    const now = new Date();
    const period = (req.query.period as string) || String(now.getMonth() + 1);
    const year = (req.query.year as string) || String(now.getFullYear());
    const data = await getTva(req.params.projectId, period, year);
    res.json(data);
  } catch (err) {
    console.error('TVA error:', err);
    res.status(500).json({ error: 'Erreur lors de la récupération de la déclaration TVA' });
  }
});

export default router;
