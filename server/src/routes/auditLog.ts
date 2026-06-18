import { Router, Request, Response } from 'express';
import { prisma } from '../config/database';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.use(authMiddleware);

router.get('/', async (req: Request, res: Response) => {
  try {
    const where: any = {};

    if (req.query.projectId) {
      where.projectId = req.query.projectId;
    }
    if (req.query.action) {
      where.action = req.query.action;
    }
    if (req.query.userId) {
      where.userId = req.query.userId;
    }
    if (req.query.startDate) {
      where.timestamp = { ...(where.timestamp || {}), gte: new Date(req.query.startDate as string) };
    }
    if (req.query.endDate) {
      where.timestamp = { ...(where.timestamp || {}), lte: new Date(req.query.endDate as string) };
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: {
          user: { select: { fullName: true, email: true } },
          project: { select: { clientName: true } },
        },
        orderBy: { timestamp: 'desc' },
        skip,
        take: limit,
      }),
      prisma.auditLog.count({ where }),
    ]);

    res.json({ data: logs, logs, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch (err) {
    console.error('List audit logs error:', err);
    res.status(500).json({ error: 'Erreur lors du chargement des logs' });
  }
});

router.get('/export', async (req: Request, res: Response) => {
  try {
    const where: any = {};
    if (req.query.projectId) {
      where.projectId = req.query.projectId;
    }

    const logs = await prisma.auditLog.findMany({
      where,
      include: {
        user: { select: { fullName: true, email: true } },
        project: { select: { clientName: true } },
      },
      orderBy: { timestamp: 'desc' },
    });

    const header = 'Date;Utilisateur;Email;Action;Projet;Détails;IP\n';
    const rows = logs.map(l =>
      `${l.timestamp.toISOString()};${l.user?.fullName || 'N/A'};${l.user?.email || ''};${l.action};${l.project?.clientName || ''};${JSON.stringify(l.details || {})};${l.ipAddress || ''}`
    ).join('\n');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename=audit_logs.csv');
    res.send('\uFEFF' + header + rows);
  } catch (err) {
    console.error('Export audit logs error:', err);
    res.status(500).json({ error: 'Erreur lors de l\'export' });
  }
});

export default router;

export async function createAuditLog(
  userId: string | null,
  projectId: string | null,
  action: string,
  details?: any,
  ipAddress?: string
): Promise<void> {
  await prisma.auditLog.create({
    data: { userId, projectId, action, details, ipAddress },
  });
}
