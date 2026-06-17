import { Router, Request, Response } from 'express';
import { prisma } from '../config/database';
import { authMiddleware } from '../middleware/auth';
import { upload } from '../middleware/upload';
import { extractDocument } from '../services/groq';
import { notifyExtractionComplete } from '../services/notificationService';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

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

    const documents = [];
    for (const file of files) {
      const ext = path.extname(file.originalname).toLowerCase();
      const fileType = ext === '.pdf' ? 'pdf' : ext === '.csv' ? 'csv' : ext === '.xlsx' ? 'xlsx' : 'image';
      const doc = await prisma.document.create({
        data: {
          projectId: req.params.projectId,
          fileName: file.originalname,
          fileType,
          filePath: file.path,
          pageCount: 1,
        },
      });
      documents.push(doc);
    }

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
      include: { _count: { select: { transactions: true } } },
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
      include: { transactions: true, project: { select: { userId: true } } },
    });
    if (!doc || doc.project.userId !== req.user!.userId) {
      res.status(404).json({ error: 'Document introuvable' });
      return;
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
    if (!doc || doc.project.userId !== req.user!.userId) {
      res.status(404).json({ error: 'Document introuvable' });
      return;
    }

    if (doc.fileType === 'image' || doc.fileType === 'pdf') {
      await prisma.document.update({ where: { id: doc.id }, data: { status: 'PROCESSING' } });

      let base64Image = '';
      try {
        const imageBuffer = fs.readFileSync(doc.filePath);
        base64Image = imageBuffer.toString('base64');
      } catch {
        res.status(400).json({ error: 'Impossible de lire le fichier' });
        return;
      }

      const extracted = await extractDocument(base64Image);

      if (!extracted) {
        await prisma.document.update({ where: { id: doc.id }, data: { status: 'FAILED' } });
        res.status(500).json({ error: 'Échec de l\'extraction par l\'IA' });
        return;
      }

      const transaction = await prisma.transaction.create({
        data: {
          projectId: doc.projectId,
          documentId: doc.id,
          documentType: mapDocumentType(extracted.documentType),
          vendorName: extracted.vendorName || null,
          documentNumber: extracted.documentNumber || null,
          date: extracted.date ? new Date(extracted.date) : null,
          dueDate: extracted.dueDate ? new Date(extracted.dueDate) : null,
          totalAmount: extracted.totalAmount || 0,
          currency: extracted.currency || 'MAD',
          taxAmount: extracted.taxAmount || 0,
          taxRate: extracted.taxRate || null,
          description: extracted.notes || extracted.vendorName || null,
          category: extracted.category || null,
        },
      });

      await prisma.document.update({ where: { id: doc.id }, data: { status: 'EXTRACTED' } });
      await notifyExtractionComplete(doc.projectId, 1);

      res.json({ transaction, extracted });
    } else {
      res.status(400).json({ error: 'Seuls les images et PDFs peuvent être traités' });
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
          const imageBuffer = fs.readFileSync(doc.filePath);
          const base64Image = imageBuffer.toString('base64');
          const extracted = await extractDocument(base64Image);
          if (extracted) {
            await prisma.transaction.create({
              data: {
                projectId: doc.projectId,
                documentId: doc.id,
                documentType: mapDocumentType(extracted.documentType),
                vendorName: extracted.vendorName || null,
                documentNumber: extracted.documentNumber || null,
                date: extracted.date ? new Date(extracted.date) : null,
                dueDate: extracted.dueDate ? new Date(extracted.dueDate) : null,
                totalAmount: extracted.totalAmount || 0,
                currency: extracted.currency || 'MAD',
                taxAmount: extracted.taxAmount || 0,
                taxRate: extracted.taxRate || null,
                description: extracted.notes || extracted.vendorName || null,
                category: extracted.category || null,
              },
            });
            await prisma.document.update({ where: { id: doc.id }, data: { status: 'EXTRACTED' } });
            processed++;
          } else {
            await prisma.document.update({ where: { id: doc.id }, data: { status: 'FAILED' } });
            failed++;
          }
        } catch {
          await prisma.document.update({ where: { id: doc.id }, data: { status: 'FAILED' } });
          failed++;
        }
      }
    }

    await notifyExtractionComplete(req.params.projectId, processed);

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

function mapDocumentType(type: string): 'INVOICE' | 'RECEIPT' | 'BANK_STATEMENT' {
  const t = (type || '').toLowerCase();
  if (t.includes('invoice') || t === 'facture') return 'INVOICE';
  if (t.includes('receipt') || t === 'recu' || t === 'reçu') return 'RECEIPT';
  if (t.includes('bank') || t === 'relevé') return 'BANK_STATEMENT';
  return 'INVOICE';
}

export default router;
