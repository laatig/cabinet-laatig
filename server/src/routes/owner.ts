import { Router, Request, Response } from 'express';
import { prisma } from '../config/database';
import config from '../config';
import { authMiddleware, ownerMiddleware } from '../middleware/auth';
import { sendEmail } from '../services/email';
import { createAuditLog } from './auditLog';

const router = Router();

router.use(authMiddleware, ownerMiddleware);

router.get('/clients', async (_req: Request, res: Response) => {
  try {
    const clients = await prisma.user.findMany({
      where: { role: 'CLIENT' },
      select: {
        id: true, email: true, fullName: true, emailVerified: true,
        raisonSociale: true, clientICE: true, clientRC: true, formeJuridique: true,
        phoneNumber: true, createdAt: true,
        _count: { select: { projects: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ clients });
  } catch (err) {
    console.error('Owner clients error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.get('/dashboard', async (_req: Request, res: Response) => {
  try {
    const [totalClients, totalProjects, pendingReviews, signedProjects] = await Promise.all([
      prisma.user.count({ where: { role: 'CLIENT' } }),
      prisma.project.count(),
      prisma.document.count({ where: { status: 'AWAITING_REVIEW' } }),
      prisma.project.count({ where: { dossierStatus: 'SIGNED' } }),
    ]);
    res.json({ totalClients, totalProjects, pendingReviews, signedProjects });
  } catch (err) {
    console.error('Owner dashboard error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.get('/projects', async (_req: Request, res: Response) => {
  try {
    const projects = await prisma.project.findMany({
      include: {
        user: { select: { id: true, email: true, fullName: true, raisonSociale: true } },
        _count: { select: { documents: true, transactions: true, anomalies: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });
    res.json({ projects });
  } catch (err) {
    console.error('Owner projects error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.get('/validation-queue', async (_req: Request, res: Response) => {
  try {
    const documents = await prisma.document.findMany({
      where: { status: 'AWAITING_REVIEW' },
      include: {
        project: {
          select: { id: true, clientName: true, dossierStatus: true, user: { select: { fullName: true, email: true } } },
        },
        extractions: {
          include: { fields: true },
          orderBy: { processedAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { updatedAt: 'asc' },
    });
    res.json({ documents });
  } catch (err) {
    console.error('Validation queue error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.post('/documents/:id/approve', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;

    const doc = await prisma.document.findUnique({
      where: { id },
      include: { project: true, extractions: { take: 1, orderBy: { processedAt: 'desc' } } },
    });
    if (!doc) {
      res.status(404).json({ error: 'Document introuvable' });
      return;
    }

    await prisma.document.update({
      where: { id },
      data: { status: 'REVIEWED' },
    });

    if (doc.extractions[0]) {
      await prisma.extraction.update({
        where: { id: doc.extractions[0].id },
        data: { status: 'REVIEWED', reviewedAt: new Date(), reviewedBy: req.user!.userId, reviewerNotes: notes },
      });
    }

    await prisma.notification.create({
      data: {
        projectId: doc.projectId,
        userId: doc.project.userId,
        type: 'REVIEW_COMPLETE',
        message: `Le document "${doc.fileName}" a été approuvé.`,
      },
    });

    await createAuditLog(req.user!.userId, doc.projectId, 'DOCUMENT_APPROVED',
      { documentId: id, fileName: doc.fileName });

    res.json({ message: 'Document approuvé' });
  } catch (err) {
    console.error('Approve error:', err);
    res.status(500).json({ error: 'Erreur lors de l\'approbation' });
  }
});

router.post('/documents/:id/reject', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { comment } = req.body;

    if (!comment) {
      res.status(400).json({ error: 'Commentaire requis pour le rejet' });
      return;
    }

    const doc = await prisma.document.findUnique({
      where: { id },
      include: { project: true, extractions: { take: 1, orderBy: { processedAt: 'desc' } } },
    });
    if (!doc) {
      res.status(404).json({ error: 'Document introuvable' });
      return;
    }

    await prisma.document.update({
      where: { id },
      data: { status: 'UPLOADED' },
    });

    await prisma.project.update({
      where: { id: doc.projectId },
      data: { dossierStatus: 'AWAITING_CLIENT_CORRECTION' },
    });

    if (doc.extractions[0]) {
      await prisma.extraction.update({
        where: { id: doc.extractions[0].id },
        data: { status: 'FAILED', reviewedAt: new Date(), reviewedBy: req.user!.userId, reviewerNotes: comment },
      });
    }

    await prisma.notification.create({
      data: {
        projectId: doc.projectId,
        userId: doc.project.userId,
        type: 'DOCUMENT_REJECTED',
        message: `Le document "${doc.fileName}" nécessite des corrections : ${comment}`,
      },
    });

    const clientUser = await prisma.user.findUnique({ where: { id: doc.project.userId } });
    if (clientUser && clientUser.emailVerified) {
      sendEmail({
        to: clientUser.email,
        subject: `Correction demandée - ${doc.fileName}`,
        html: `<p>Bonjour ${clientUser.fullName},</p>
<p>Le document "${doc.fileName}" nécessite des corrections :</p>
<p><em>${comment}</em></p>
<p><a href="${config.appUrl}">Connectez-vous à votre espace</a> pour soumettre une version corrigée.</p>`
      }).catch(() => {});
    }

    await createAuditLog(req.user!.userId, doc.projectId, 'DOCUMENT_REJECTED',
      { documentId: id, fileName: doc.fileName, reason: comment });

    res.json({ message: 'Document rejeté', comment });
  } catch (err) {
    console.error('Reject error:', err);
    res.status(500).json({ error: 'Erreur lors du rejet' });
  }
});

router.put('/extractions/:id/fields/:fieldId', async (req: Request, res: Response) => {
  try {
    const { id, fieldId } = req.params;
    const { correctedValue } = req.body;

    const field = await prisma.extractionField.findFirst({
      where: { id: fieldId, extractionId: id },
    });
    if (!field) {
      res.status(404).json({ error: 'Champ introuvable' });
      return;
    }

    await prisma.extractionField.update({
      where: { id: fieldId },
      data: { correctedValue, isCorrected: true },
    });

    res.json({ message: 'Champ corrigé' });
  } catch (err) {
    console.error('Field update error:', err);
    res.status(500).json({ error: 'Erreur lors de la correction' });
  }
});

router.post('/projects/:id/sign', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { signatureData } = req.body;

    if (!signatureData) {
      res.status(400).json({ error: 'Signature requise' });
      return;
    }

    const user = await prisma.user.findUnique({ where: { id: req.user!.userId } });
    if (!user) {
      res.status(404).json({ error: 'Utilisateur introuvable' });
      return;
    }

    const project = await prisma.project.findUnique({ where: { id } });
    if (!project) {
      res.status(404).json({ error: 'Projet introuvable' });
      return;
    }

    await prisma.signature.create({
      data: {
        userId: user.id,
        projectId: id,
        signatureData,
        fullName: user.fullName,
        title: user.title || 'Expert-Comptable',
        ipAddress: req.ip,
      },
    });

    await prisma.project.update({
      where: { id },
      data: { dossierStatus: 'SIGNED', status: 'COMPLETED' },
    });

    await prisma.notification.create({
      data: {
        projectId: id,
        userId: project.userId,
        type: 'SIGNATURE_REQUEST',
        message: `Le dossier "${project.clientName}" a été signé et clôturé.`,
      },
    });

    const clientUser = await prisma.user.findUnique({ where: { id: project.userId } });
    if (clientUser) {
      sendEmail({
        to: clientUser.email,
        subject: `Dossier signé - ${project.clientName}`,
        html: `<p>Bonjour ${clientUser.fullName},</p>
<p>Le dossier "${project.clientName}" pour l'exercice ${project.fiscalYearStart.getFullYear()} a été signé et clôturé.</p>
<p>Les rapports sont disponibles dans votre espace Cabinet Laatig.</p>`
      }).catch(() => {});
    }

    await createAuditLog(req.user!.userId, id, 'PROJECT_SIGNED',
      { projectName: project.clientName, signatory: user.fullName });

    res.json({ message: 'Dossier signé avec succès' });
  } catch (err) {
    console.error('Sign error:', err);
    res.status(500).json({ error: 'Erreur lors de la signature' });
  }
});

router.get('/signatures', async (_req: Request, res: Response) => {
  try {
    const signatures = await prisma.signature.findMany({
      include: {
        project: { select: { id: true, clientName: true, fiscalYearStart: true } },
        user: { select: { fullName: true } },
      },
      orderBy: { signedAt: 'desc' },
    });
    res.json({ signatures });
  } catch (err) {
    console.error('Signatures error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

export default router;
