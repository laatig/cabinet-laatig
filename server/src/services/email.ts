import nodemailer from 'nodemailer';
import config from '../config';

let transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter | null {
  if (transporter) return transporter;
  if (!config.smtpHost) return null;
  transporter = nodemailer.createTransport({
    host: config.smtpHost,
    port: config.smtpPort,
    secure: config.smtpPort === 465,
    auth: { user: config.smtpUser, pass: config.smtpPass },
  });
  return transporter;
}

export async function sendEmail({
  to, subject, html,
}: {
  to: string;
  subject: string;
  html: string;
}): Promise<void> {
  const t = getTransporter();
  if (!t) {
    console.log(`[Email] SMTP not configured. Would send to ${to}: ${subject}`);
    return;
  }
  await t.sendMail({ from: config.emailFrom, to, subject, html });
}

export async function notifyStatusChangeEmail(
  userEmail: string,
  userName: string,
  projectName: string,
  newStatus: string,
): Promise<void> {
  const statusLabels: Record<string, string> = {
    DOCUMENTS_RECEIVED: 'Documents reçus',
    EXTRACTION_IN_PROGRESS: 'Extraction en cours',
    AI_ANALYSIS: 'Analyse IA terminée',
    IN_REVIEW: 'En cours de révision',
    AWAITING_CLIENT_CORRECTION: 'Correction demandée',
    VALIDATED: 'Validé',
    SIGNED: 'Signé',
  };
  await sendEmail({
    to: userEmail,
    subject: `Mise à jour dossier - ${projectName}`,
    html: `<p>Bonjour ${userName},</p>
<p>Le statut de votre dossier <strong>${projectName}</strong> est passé à : <strong>${statusLabels[newStatus] || newStatus}</strong>.</p>
<p><a href="${config.appUrl}">Connectez-vous à votre espace Cabinet Laatig</a> pour voir les détails.</p>`
  });
}
