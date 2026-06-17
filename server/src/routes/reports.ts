import { Router, Request, Response } from 'express';
import { prisma } from '../config/database';
import { authMiddleware } from '../middleware/auth';
import {
  generateBilan,
  generateCpc,
  generateJournal,
  generateGrandLivre,
  generateBalance,
  generateTva,
  generateRapportAudit,
  generateRapportSynthese,
  generateCahierTravail,
  generateAllReports,
} from '../services/pdfGenerator';
import { exportFiscalZip } from '../services/zipService';
import { notifyReportReady } from '../services/notificationService';
import fs from 'fs';

const router = Router();

router.use(authMiddleware);

const REPORT_GENERATORS: Record<string, (projectId: string) => Promise<string>> = {
  bilan: generateBilan,
  cpc: generateCpc,
  journal: generateJournal,
  grand_livre: generateGrandLivre,
  balance: generateBalance,
  tva: (projectId: string) => generateTva(projectId),
  audit: generateRapportAudit,
  synthese: generateRapportSynthese,
  cahier_travail: generateCahierTravail,
};

const REPORT_TYPES: Record<string, string> = {
  bilan: 'BILAN',
  cpc: 'CPC',
  journal: 'JOURNAL',
  grand_livre: 'GRAND_LIVRE',
  balance: 'BALANCE',
  tva: 'TVA',
  audit: 'AUDIT',
  synthese: 'SYNTHESE',
  cahier_travail: 'CAHIER_TRAVAIL',
};

router.post('/projects/:projectId/reports/generate/:type', async (req: Request, res: Response) => {
  try {
    const project = await prisma.project.findFirst({
      where: { id: req.params.projectId, userId: req.user!.userId },
    });
    if (!project) {
      res.status(404).json({ error: 'Projet introuvable' });
      return;
    }

    const type = req.params.type.toLowerCase();
    const generator = REPORT_GENERATORS[type];
    if (!generator) {
      res.status(400).json({ error: `Type de rapport invalide. Types: ${Object.keys(REPORT_GENERATORS).join(', ')}` });
      return;
    }

    const filePath = await generator(req.params.projectId);
    const reportType = REPORT_TYPES[type];

    const report = await prisma.report.create({
      data: {
        projectId: req.params.projectId,
        reportType: reportType as any,
        filePath,
      },
    });

    await notifyReportReady(req.params.projectId, type);

    res.json({ report });
  } catch (err) {
    console.error('Generate report error:', err);
    res.status(500).json({ error: 'Erreur lors de la génération du rapport' });
  }
});

router.post('/projects/:projectId/reports/generate-all', async (req: Request, res: Response) => {
  try {
    const project = await prisma.project.findFirst({
      where: { id: req.params.projectId, userId: req.user!.userId },
    });
    if (!project) {
      res.status(404).json({ error: 'Projet introuvable' });
      return;
    }

    const filePaths = await generateAllReports(req.params.projectId);

    res.json({ message: 'Tous les rapports générés', reports: filePaths });
  } catch (err) {
    console.error('Generate all error:', err);
    res.status(500).json({ error: 'Erreur lors de la génération des rapports' });
  }
});

router.post('/projects/:projectId/reports/export-zip', async (req: Request, res: Response) => {
  try {
    const project = await prisma.project.findFirst({
      where: { id: req.params.projectId, userId: req.user!.userId },
    });
    if (!project) {
      res.status(404).json({ error: 'Projet introuvable' });
      return;
    }

    const zipPath = await exportFiscalZip(req.params.projectId);
    const zipFilename = path.basename(zipPath);

    res.json({ downloadUrl: `/api/reports/download/${zipFilename}`, filePath: zipPath });
  } catch (err: any) {
    console.error('Export ZIP error:', err);
    res.status(500).json({ error: err.message || 'Erreur lors de l\'export ZIP' });
  }
});

import path from 'path';
import config from '../config';

router.get('/reports/download/:filename', async (req: Request, res: Response) => {
  try {
    const reportsDir = path.resolve(config.uploadDir, 'reports');
    const filePath = path.resolve(reportsDir, req.params.filename);

    if (!filePath.startsWith(reportsDir)) {
      res.status(403).json({ error: 'Accès refusé' });
      return;
    }

    const report = await prisma.report.findFirst({ where: { filePath } });
    if (report) {
      const project = await prisma.project.findFirst({
        where: { id: report.projectId, userId: req.user!.userId },
      });
      if (!project) {
        res.status(403).json({ error: 'Accès refusé' });
        return;
      }
    }

    if (!fs.existsSync(filePath)) {
      res.status(404).json({ error: 'Fichier introuvable' });
      return;
    }

    res.download(filePath);
  } catch (err) {
    console.error('Download error:', err);
    res.status(500).json({ error: 'Erreur lors du téléchargement' });
  }
});

export default router;
