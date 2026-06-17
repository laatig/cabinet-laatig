import { Router, Request, Response } from 'express';
import { prisma } from '../config/database';
import { authMiddleware, ownerMiddleware } from '../middleware/auth';
import { upload } from '../middleware/upload';
import { extractDocument, createExtractionRecord } from '../services/extraction';
import { notifyExtractionComplete, notifyDocumentUploaded } from '../services/notificationService';
import { createAuditLog } from './auditLog';
import fs from 'fs';
import path from 'path';

const router = Router();

function getFileType(ext: string): string {
  const map: Record<string, string> = {
    '.pdf': 'pdf', '.csv': 'csv', '.xlsx': 'xlsx', '.xls': 'xlsx',
    '.jpg': 'image', '.jpeg': 'image', '.png': 'image', '.tiff': 'image',
  };
  return map[ext.toLowerCase()] || 'other';
}

router.use(authMiddleware);

router.post('/projects/:projectId/documents/upload', upload.array('files', 10), async (req: Request, res: Response) => {
  try {
    const project = await prisma.project.findFirst({
      where: { id: req.params.projectId, userId: req.user!.userId },
    });
    if (!project) {
      res.status(404).json({ error: 'Projet introuvable' });
      return;
    }

    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) {
      res.status(400).json({ error: 'Aucun fichier fourni' });
      return;
    }

    const category = (req.body.category || 'PIECE_JUSTIFICATIVE').toUpperCase();
    const fiscalYear = req.body.fiscalYear ? parseInt(req.body.fiscalYear) : project.fiscalYearStart.getFullYear();

    const documents = [];
    for (const file of files) {
      const ext = path.extname(file.originalname).toLowerCase();
      const fileType = getFileType(ext);
      const doc = await prisma.document.create({
        data: {
          projectId: req.params.projectId,
          fileName: file.originalname,
          fileType,
          filePath: file.path,
          pageCount: 1,
          category: category as any,
          fiscalYear,
        },
      });
      documents.push(doc);
    }

    await notifyDocumentUploaded(req.params.projectId, files.map(f => f.originalname).join(', '), req.user!.userId);
    await createAuditLog(req.user!.userId, req.params.projectId, 'DOCUMENTS_UPLOADED',
      { count: files.length, category });

    res.status(201).json({ documents });
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ error: 'Erreur lors du téléchargement' });
  }
});

router.get('/projects/:projectId/documents', async (req: Request, res: Response) => {
  try {
    const project = await prisma.project.findFirst({
      where: { id: req.params.projectId, userId: req.user!.userId },
    });
    if (!project) {
      res.status(404).json({ error: 'Projet introuvable' });
      return;
    }
    const documents = await prisma.document.findMany({
      where: { projectId: req.params.projectId },
      include: {
        _count: { select: { transactions: true } },
        extractions: { include: { fields: true }, orderBy: { processedAt: 'desc' }, take: 1 },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ documents });
  } catch (err) {
    console.error('List documents error:', err);
    res.status(500).json({ error: 'Erreur lors du chargement des documents' });
  }
});

router.get('/documents/:id', async (req: Request, res: Response) => {
  try {
    const doc = await prisma.document.findFirst({
      where: { id: req.params.id },
      include: {
        transactions: true,
        extractions: { include: { fields: true }, orderBy: { processedAt: 'desc' } },
        project: { select: { userId: true, clientName: true } },
      },
    });
    if (!doc || doc.project.userId !== req.user!.userId) {
      if (req.user!.role !== 'OWNER') {
        res.status(404).json({ error: 'Document introuvable' });
        return;
      }
    }
    res.json({ document: doc });
  } catch (err) {
    console.error('Get document error:', err);
    res.status(500).json({ error: 'Erreur lors du chargement du document' });
  }
});

router.post('/documents/:id/process', async (req: Request, res: Response) => {
  try {
    const doc = await prisma.document.findFirst({
      where: { id: req.params.id },
      include: { project: { select: { userId: true } } },
    });
    if (!doc) {
      res.status(404).json({ error: 'Document introuvable' });
      return;
    }

    if (doc.project.userId !== req.user!.userId) {
      res.status(403).json({ error: 'Accès refusé' });
      return;
    }

    if (doc.fileType !== 'image' && doc.fileType !== 'pdf') {
      res.status(400).json({ error: 'Seuls les images et PDFs peuvent être traités par l\'IA' });
      return;
    }

    await prisma.document.update({ where: { id: doc.id }, data: { status: 'PROCESSING' } });

    let text = '';
    let imageBase64: string | undefined;

    try {
      const fileBuffer = fs.readFileSync(doc.filePath);
      imageBase64 = fileBuffer.toString('base64');
      text = `Document: ${doc.fileName}, Size: ${fileBuffer.length} bytes`;
    } catch {
      await prisma.document.update({ where: { id: doc.id }, data: { status: 'FAILED' } });
      res.status(400).json({ error: 'Impossible de lire le fichier' });
      return;
    }

    try {
      const result = await extractDocument(text, doc.category, imageBase64);
      await createExtractionRecord(doc.id, result);
      await prisma.project.update({
        where: { id: doc.projectId },
        data: { dossierStatus: 'AI_ANALYSIS' },
      });
      await notifyExtractionComplete(doc.projectId, 1, req.user!.userId);
      await createAuditLog(req.user!.userId, doc.projectId, 'DOCUMENT_EXTRACTED',
        { documentId: doc.id, fileName: doc.fileName, confidence: result.confidence });

      res.json({
        documentId: doc.id,
        status: 'AWAITING_REVIEW',
        confidence: result.confidence,
        fields: result.fields.length,
      });
    } catch (err: any) {
      await prisma.document.update({ where: { id: doc.id }, data: { status: 'FAILED' } });
      res.status(500).json({ error: `Échec de l'extraction: ${err.message}` });
    }
  } catch (err) {
    console.error('Process document error:', err);
    res.status(500).json({ error: 'Erreur lors du traitement du document' });
  }
});

router.post('/projects/:projectId/documents/process-batch', async (req: Request, res: Response) => {
  try {
    const project = await prisma.project.findFirst({
      where: { id: req.params.projectId, userId: req.user!.userId },
    });
    if (!project) {
      res.status(404).json({ error: 'Projet introuvable' });
      return;
    }

    const pendingDocs = await prisma.document.findMany({
      where: { projectId: req.params.projectId, status: 'UPLOADED' },
    });

    let processed = 0;
    let failed = 0;

    for (const doc of pendingDocs) {
      if (doc.fileType === 'image' || doc.fileType === 'pdf') {
        await prisma.document.update({ where: { id: doc.id }, data: { status: 'PROCESSING' } });
        try {
          const fileBuffer = fs.readFileSync(doc.filePath);
          const imageBase64 = fileBuffer.toString('base64');
          const result = await extractDocument(
            `Document: ${doc.fileName}`,
            doc.category,
            imageBase64,
          );
          await createExtractionRecord(doc.id, result);
          processed++;
        } catch {
          await prisma.document.update({ where: { id: doc.id }, data: { status: 'FAILED' } });
          failed++;
        }
      }
    }

    await notifyExtractionComplete(req.params.projectId, processed, req.user!.userId);
    await createAuditLog(req.user!.userId, req.params.projectId, 'BATCH_EXTRACTION',
      { processed, failed, total: pendingDocs.length });

    res.json({ processed, failed, total: pendingDocs.length });
  } catch (err) {
    console.error('Batch process error:', err);
    res.status(500).json({ error: 'Erreur lors du traitement par lot' });
  }
});

router.post('/projects/:projectId/documents/import-csv', upload.single('file'), async (req: Request, res: Response) => {
  try {
    const project = await prisma.project.findFirst({
      where: { id: req.params.projectId, userId: req.user!.userId },
    });
    if (!project) {
      res.status(404).json({ error: 'Projet introuvable' });
      return;
    }

    if (!req.file) {
      res.status(400).json({ error: 'Fichier CSV requis' });
      return;
    }

    const csvContent = fs.readFileSync(req.file.path, 'utf-8');
    const lines = csvContent.split('\n').filter(l => l.trim());
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());

    const imported = [];
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      const row: Record<string, string> = {};
      headers.forEach((h, idx) => { row[h] = values[idx] || ''; });

      if (row.vendorname || row.fournisseur || row.description) {
        const transaction = await prisma.transaction.create({
          data: {
            projectId: req.params.projectId,
            documentType: (row.type || row.documenttype || 'INVOICE').toUpperCase() as any,
            vendorName: row.vendorname || row.fournisseur || null,
            documentNumber: row.documentnumber || row.facture || row.numero || null,
            date: row.date ? new Date(row.date) : null,
            totalAmount: parseFloat(row.totalamount || row.montant || row.amount || '0'),
            currency: row.currency || row.devise || 'MAD',
            taxAmount: row.taxamount || row.tva ? parseFloat(row.taxamount || row.tva) : 0,
            description: row.description || row.libelle || row.notes || null,
            category: row.category || row.categorie || null,
          },
        });
        imported.push(transaction);
      }
    }

    res.json({ imported: imported.length, transactions: imported });
  } catch (err) {
    console.error('Import CSV error:', err);
    res.status(500).json({ error: 'Erreur lors de l\'import CSV' });
  }
});

export default router;
