import { Router, Request, Response } from 'express';
import { prisma } from '../config/database';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.use(authMiddleware);

router.get('/', async (_req: Request, res: Response) => {
  try {
    const accounts = await prisma.pcmAccount.findMany({
      orderBy: [{ classNumber: 'asc' }, { accountNumber: 'asc' }],
    });
    res.json({ accounts });
  } catch (err) {
    console.error('List PCM accounts error:', err);
    res.status(500).json({ error: 'Erreur lors du chargement des comptes PCM' });
  }
});

router.get('/search', async (req: Request, res: Response) => {
  try {
    const { q, class: classNum } = req.query;
    const where: any = {};

    if (q) {
      where.OR = [
        { accountNumber: { contains: q as string, mode: 'insensitive' } },
        { accountName: { contains: q as string, mode: 'insensitive' } },
      ];
    }
    if (classNum) {
      where.classNumber = parseInt(classNum as string);
    }

    const accounts = await prisma.pcmAccount.findMany({
      where,
      orderBy: [{ classNumber: 'asc' }, { accountNumber: 'asc' }],
      take: 50,
    });
    res.json({ accounts });
  } catch (err) {
    console.error('Search PCM error:', err);
    res.status(500).json({ error: 'Erreur lors de la recherche' });
  }
});

export default router;
