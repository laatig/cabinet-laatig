import { prisma } from '../config/database';
import { NotificationType } from '@prisma/client';

export async function createNotification(
  projectId: string,
  type: NotificationType,
  message: string
): Promise<void> {
  await prisma.notification.create({
    data: {
      projectId,
      type,
      message,
    },
  });
}

export async function notifyStatusChange(projectId: string, oldStatus: string, newStatus: string): Promise<void> {
  await createNotification(
    projectId,
    'STATUS_CHANGE',
    `Le statut du dossier est passé de "${oldStatus}" à "${newStatus}"`
  );
}

export async function notifyAnomalyDetected(projectId: string, count: number): Promise<void> {
  await createNotification(
    projectId,
    'ANOMALY_DETECTED',
    `${count} anomalie(s) détectée(s) lors de l'analyse des transactions`
  );
}

export async function notifyReportReady(projectId: string, reportType: string): Promise<void> {
  await createNotification(
    projectId,
    'REPORT_READY',
    `Le rapport "${reportType}" est prêt à être téléchargé`
  );
}

export async function notifyReviewComplete(projectId: string): Promise<void> {
  await createNotification(
    projectId,
    'REVIEW_COMPLETE',
    'La révision du dossier est terminée'
  );
}

export async function notifyExtractionComplete(projectId: string, count: number): Promise<void> {
  await createNotification(
    projectId,
    'EXTRACTION_COMPLETE',
    `${count} document(s) traité(s) avec succès par l'IA`
  );
}
