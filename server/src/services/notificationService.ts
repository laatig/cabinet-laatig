import { prisma } from '../config/database';
import { NotificationType } from '@prisma/client';

export async function createNotification(
  projectId: string,
  type: NotificationType,
  message: string,
  userId?: string,
): Promise<void> {
  await prisma.notification.create({
    data: { projectId, type, message, userId },
  });
}

export async function notifyStatusChange(projectId: string, oldStatus: string, newStatus: string, userId?: string): Promise<void> {
  await createNotification(projectId, 'STATUS_CHANGE',
    `Le statut du dossier est passé de "${oldStatus}" à "${newStatus}"`, userId);
}

export async function notifyAnomalyDetected(projectId: string, count: number, userId?: string): Promise<void> {
  await createNotification(projectId, 'ANOMALY_DETECTED',
    `${count} anomalie(s) détectée(s) lors de l'analyse des transactions`, userId);
}

export async function notifyReportReady(projectId: string, reportType: string, userId?: string): Promise<void> {
  await createNotification(projectId, 'REPORT_READY',
    `Le rapport "${reportType}" est prêt à être téléchargé`, userId);
}

export async function notifyReviewComplete(projectId: string, userId?: string): Promise<void> {
  await createNotification(projectId, 'REVIEW_COMPLETE',
    'La révision du dossier est terminée', userId);
}

export async function notifyExtractionComplete(projectId: string, count: number, userId?: string): Promise<void> {
  await createNotification(projectId, 'EXTRACTION_COMPLETE',
    `${count} document(s) traité(s) avec succès par l'IA`, userId);
}

export async function notifyDocumentUploaded(projectId: string, fileName: string, userId?: string): Promise<void> {
  await createNotification(projectId, 'DOCUMENT_UPLOADED',
    `Document "${fileName}" téléversé avec succès`, userId);
}
