import { Router, Request, Response } from 'express';
import { prisma } from '../config/database';
import { authMiddleware } from '../middleware/auth';
import { getBilan, getCpc, getBalance, getJournal, getGrandLivre, getTva, getSIG, getLiasseFiscale } from '../services/financialService';
import * as excel from '../services/excelExport';
import path from 'path';
import fs from 'fs';
import config from '../config';

const router = Router();
router.use(authMiddleware);

async function checkOwnership(req: Request, res: Response, projectId: string): Promise<boolean> {
  const project = await prisma.project.findFirst({
    where: { id: projectId, userId: req.user!.userId },
  });
  if (!project) {
    res.status(404).json({ error: 'Projet introuvable' });
    return false;
  }
  return true;
}

function sendFile(res: Response, filePath: string, filename: string) {
  if (!fs.existsSync(filePath)) {
    res.status(500).json({ error: 'Erreur lors de la génération du fichier' });
    return;
  }
  res.download(filePath, filename, () => {
    setTimeout(() => fs.unlink(filePath, () => {}), 5000);
  });
}

router.get('/projects/:projectId/export/bilan', async (req: Request, res: Response) => {
  try {
    if (!await checkOwnership(req, res, req.params.projectId)) return;
    const data = await getBilan(req.params.projectId);
    const filePath = await excel.exportBilan(req.params.projectId, data);
    sendFile(res, filePath, `bilan_${req.params.projectId}.xlsx`);
  } catch (err) {
    console.error('Export bilan error:', err);
    res.status(500).json({ error: 'Erreur export bilan' });
  }
});

router.get('/projects/:projectId/export/cpc', async (req: Request, res: Response) => {
  try {
    if (!await checkOwnership(req, res, req.params.projectId)) return;
    const data = await getCpc(req.params.projectId);
    const filePath = await excel.exportCPC(req.params.projectId, data);
    sendFile(res, filePath, `cpc_${req.params.projectId}.xlsx`);
  } catch (err) {
    console.error('Export CPC error:', err);
    res.status(500).json({ error: 'Erreur export CPC' });
  }
});

router.get('/projects/:projectId/export/balance', async (req: Request, res: Response) => {
  try {
    if (!await checkOwnership(req, res, req.params.projectId)) return;
    const data = await getBalance(req.params.projectId);
    const filePath = await excel.exportBalance(req.params.projectId, data);
    sendFile(res, filePath, `balance_${req.params.projectId}.xlsx`);
  } catch (err) {
    console.error('Export balance error:', err);
    res.status(500).json({ error: 'Erreur export balance' });
  }
});

router.get('/projects/:projectId/export/journal', async (req: Request, res: Response) => {
  try {
    if (!await checkOwnership(req, res, req.params.projectId)) return;
    const data = await getJournal(req.params.projectId);
    const filePath = await excel.exportJournal(req.params.projectId, data);
    sendFile(res, filePath, `journal_${req.params.projectId}.xlsx`);
  } catch (err) {
    console.error('Export journal error:', err);
    res.status(500).json({ error: 'Erreur export journal' });
  }
});

router.get('/projects/:projectId/export/grand-livre', async (req: Request, res: Response) => {
  try {
    if (!await checkOwnership(req, res, req.params.projectId)) return;
    const data = await getGrandLivre(req.params.projectId);
    const filePath = await excel.exportGrandLivre(req.params.projectId, data);
    sendFile(res, filePath, `grand_livre_${req.params.projectId}.xlsx`);
  } catch (err) {
    console.error('Export grand livre error:', err);
    res.status(500).json({ error: 'Erreur export grand livre' });
  }
});

router.get('/projects/:projectId/export/tva', async (req: Request, res: Response) => {
  try {
    if (!await checkOwnership(req, res, req.params.projectId)) return;
    const now = new Date();
    const period = (req.query.period as string) || String(now.getMonth() + 1);
    const year = (req.query.year as string) || String(now.getFullYear());
    const data = await getTva(req.params.projectId, period, year);
    const filePath = await excel.exportTVA(req.params.projectId, data, period, year);
    sendFile(res, filePath, `tva_${req.params.projectId}_${period}_${year}.xlsx`);
  } catch (err) {
    console.error('Export TVA error:', err);
    res.status(500).json({ error: 'Erreur export TVA' });
  }
});

router.get('/projects/:projectId/export/sig', async (req: Request, res: Response) => {
  try {
    if (!await checkOwnership(req, res, req.params.projectId)) return;
    const data = await getSIG(req.params.projectId);
    const filePath = await excel.exportSIG(req.params.projectId, data);
    sendFile(res, filePath, `sig_${req.params.projectId}.xlsx`);
  } catch (err) {
    console.error('Export SIG error:', err);
    res.status(500).json({ error: 'Erreur export SIG' });
  }
});

router.get('/projects/:projectId/export/liasse-fiscale', async (req: Request, res: Response) => {
  try {
    if (!await checkOwnership(req, res, req.params.projectId)) return;
    const data = await getLiasseFiscale(req.params.projectId);
    const filePath = await excel.exportLiasseFiscale(req.params.projectId, data);
    sendFile(res, filePath, `liasse_fiscale_${req.params.projectId}.xlsx`);
  } catch (err) {
    console.error('Export liasse fiscale error:', err);
    res.status(500).json({ error: 'Erreur export liasse fiscale' });
  }
});

export default router;