import { Router, Request, Response } from 'express';
import { prisma } from '../config/database';
import { authMiddleware } from '../middleware/auth';
import { suggestPcmAccount } from '../services/groq';
import { Prisma } from '@prisma/client';

const router = Router();

router.use(authMiddleware);

function buildWhere(projectId: string, query: any): Prisma.TransactionWhereInput {
  const where: Prisma.TransactionWhereInput = { projectId };

  if (query.status) {
    where.status = query.status;
  }
  if (query.documentType) {
    where.documentType = query.documentType;
  }
  if (query.category) {
    where.category = query.category;
  }
  if (query.startDate) {
    where.date = { ...(where.date as any || {}), gte: new Date(query.startDate) };
  }
  if (query.endDate) {
    where.date = { ...(where.date as any || {}), lte: new Date(query.endDate) };
  }
  if (query.minAmount) {
    where.totalAmount = { ...(where.totalAmount as any || {}), gte: parseFloat(query.minAmount) };
  }
  if (query.maxAmount) {
    where.totalAmount = { ...(where.totalAmount as any || {}), lte: parseFloat(query.maxAmount) };
  }
  if (query.search) {
    const s = query.search;
    where.OR = [
      { vendorName: { contains: s, mode: 'insensitive' } },
      { description: { contains: s, mode: 'insensitive' } },
      { documentNumber: { contains: s, mode: 'insensitive' } },
      { category: { contains: s, mode: 'insensitive' } },
    ];
  }
  if (query.riskScore) {
    where.riskScore = { gte: parseInt(query.riskScore) };
  }

  return where;
}

router.get('/projects/:projectId/transactions', async (req: Request, res: Response) => {
  try {
    const project = await prisma.project.findFirst({
      where: { id: req.params.projectId, userId: req.user!.userId },
    });
    if (!project) {
      res.status(404).json({ error: 'Projet introuvable' });
      return;
    }

    const where = buildWhere(req.params.projectId, req.query);
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const skip = (page - 1) * limit;

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        include: {
          pcmAccount: true,
          anomalies: { where: { status: 'OPEN' } },
          document: { select: { fileName: true, fileType: true } },
        },
        orderBy: { date: 'desc' },
        skip,
        take: limit,
      }),
      prisma.transaction.count({ where }),
    ]);

    res.json({ transactions, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch (err) {
    console.error('List transactions error:', err);
    res.status(500).json({ error: 'Erreur lors du chargement des transactions' });
  }
});

router.put('/transactions/:id', async (req: Request, res: Response) => {
  try {
    const tx = await prisma.transaction.findFirst({
      where: { id: req.params.id },
      include: { project: { select: { userId: true } } },
    });
    if (!tx || tx.project.userId !== req.user!.userId) {
      res.status(404).json({ error: 'Transaction introuvable' });
      return;
    }

    const { vendorName, documentNumber, date, dueDate, totalAmount, currency, taxAmount, taxRate, description, category, notes, pcmAccountId } = req.body;

    const updated = await prisma.transaction.update({
      where: { id: req.params.id },
      data: {
        ...(vendorName !== undefined && { vendorName }),
        ...(documentNumber !== undefined && { documentNumber }),
        ...(date !== undefined && { date: date ? new Date(date) : null }),
        ...(dueDate !== undefined && { dueDate: dueDate ? new Date(dueDate) : null }),
        ...(totalAmount !== undefined && { totalAmount }),
        ...(currency !== undefined && { currency }),
        ...(taxAmount !== undefined && { taxAmount }),
        ...(taxRate !== undefined && { taxRate }),
        ...(description !== undefined && { description }),
        ...(category !== undefined && { category }),
        ...(notes !== undefined && { notes }),
        ...(pcmAccountId !== undefined && { pcmAccountId }),
      },
      include: { pcmAccount: true, anomalies: true },
    });
    res.json({ transaction: updated });
  } catch (err) {
    console.error('Update transaction error:', err);
    res.status(500).json({ error: 'Erreur lors de la mise à jour' });
  }
});

router.post('/transactions/:id/verify', async (req: Request, res: Response) => {
  try {
    const tx = await prisma.transaction.findFirst({
      where: { id: req.params.id },
      include: { project: { select: { userId: true } } },
    });
    if (!tx || tx.project.userId !== req.user!.userId) {
      res.status(404).json({ error: 'Transaction introuvable' });
      return;
    }
    const updated = await prisma.transaction.update({
      where: { id: req.params.id },
      data: { status: 'VERIFIED' },
    });
    res.json({ transaction: updated });
  } catch (err) {
    console.error('Verify error:', err);
    res.status(500).json({ error: 'Erreur lors de la vérification' });
  }
});

router.post('/transactions/:id/flag', async (req: Request, res: Response) => {
  try {
    const tx = await prisma.transaction.findFirst({
      where: { id: req.params.id },
      include: { project: { select: { userId: true } } },
    });
    if (!tx || tx.project.userId !== req.user!.userId) {
      res.status(404).json({ error: 'Transaction introuvable' });
      return;
    }
    const updated = await prisma.transaction.update({
      where: { id: req.params.id },
      data: { status: 'FLAGGED' },
    });
    res.json({ transaction: updated });
  } catch (err) {
    console.error('Flag error:', err);
    res.status(500).json({ error: 'Erreur lors du signalement' });
  }
});

router.post('/transactions/:id/dispute', async (req: Request, res: Response) => {
  try {
    const tx = await prisma.transaction.findFirst({
      where: { id: req.params.id },
      include: { project: { select: { userId: true } } },
    });
    if (!tx || tx.project.userId !== req.user!.userId) {
      res.status(404).json({ error: 'Transaction introuvable' });
      return;
    }
    const updated = await prisma.transaction.update({
      where: { id: req.params.id },
      data: { status: 'DISPUTED' },
    });
    res.json({ transaction: updated });
  } catch (err) {
    console.error('Dispute error:', err);
    res.status(500).json({ error: 'Erreur lors du litige' });
  }
});

router.post('/transactions/:id/delete', async (req: Request, res: Response) => {
  try {
    const tx = await prisma.transaction.findFirst({
      where: { id: req.params.id },
      include: { project: { select: { userId: true } } },
    });
    if (!tx || tx.project.userId !== req.user!.userId) {
      res.status(404).json({ error: 'Transaction introuvable' });
      return;
    }
    await prisma.transaction.delete({ where: { id: req.params.id } });
    res.json({ message: 'Transaction supprimée' });
  } catch (err) {
    console.error('Delete error:', err);
    res.status(500).json({ error: 'Erreur lors de la suppression' });
  }
});

router.post('/transactions/bulk', async (req: Request, res: Response) => {
  try {
    const { ids, action } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0 || !action) {
      res.status(400).json({ error: 'IDs et action requis' });
      return;
    }

    const validActions = ['VERIFIED', 'FLAGGED', 'DISPUTED', 'DELETE'];
    if (!validActions.includes(action)) {
      res.status(400).json({ error: `Action invalide. Actions: ${validActions.join(', ')}` });
      return;
    }

    if (action === 'DELETE') {
      await prisma.transaction.deleteMany({ where: { id: { in: ids } } });
    } else {
      await prisma.transaction.updateMany({
        where: { id: { in: ids } },
        data: { status: action as any },
      });
    }

    res.json({ message: `${ids.length} transaction(s) mise(s) à jour` });
  } catch (err) {
    console.error('Bulk error:', err);
    res.status(500).json({ error: 'Erreur lors de l\'action groupée' });
  }
});

router.post('/transactions/:id/assign-pcm', async (req: Request, res: Response) => {
  try {
    const { pcmAccountId } = req.body;
    if (!pcmAccountId) {
      res.status(400).json({ error: 'pcmAccountId requis' });
      return;
    }
    const tx = await prisma.transaction.findFirst({
      where: { id: req.params.id },
      include: { project: { select: { userId: true } } },
    });
    if (!tx || tx.project.userId !== req.user!.userId) {
      res.status(404).json({ error: 'Transaction introuvable' });
      return;
    }
    const updated = await prisma.transaction.update({
      where: { id: req.params.id },
      data: { pcmAccountId },
      include: { pcmAccount: true },
    });
    res.json({ transaction: updated });
  } catch (err) {
    console.error('Assign PCM error:', err);
    res.status(500).json({ error: 'Erreur lors de l\'assignation du compte PCM' });
  }
});

router.post('/transactions/:id/suggest-pcm', async (req: Request, res: Response) => {
  try {
    const tx = await prisma.transaction.findFirst({
      where: { id: req.params.id },
      include: { project: { select: { userId: true } } },
    });
    if (!tx || tx.project.userId !== req.user!.userId) {
      res.status(404).json({ error: 'Transaction introuvable' });
      return;
    }

    const suggestion = await suggestPcmAccount(
      tx.description || '',
      tx.vendorName || '',
      Number(tx.totalAmount),
      tx.documentType,
      tx.category || undefined
    );

    if (!suggestion) {
      res.status(500).json({ error: 'Impossible de suggérer un compte PCM' });
      return;
    }

    const pcmAccount = await prisma.pcmAccount.findUnique({
      where: { accountNumber: suggestion.accountNumber },
    });

    res.json({ suggestion: { ...suggestion, pcmAccount } });
  } catch (err) {
    console.error('Suggest PCM error:', err);
    res.status(500).json({ error: 'Erreur lors de la suggestion PCM' });
  }
});

export default router;
