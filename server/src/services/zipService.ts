import archiver from 'archiver';
import fs from 'fs';
import path from 'path';
import { prisma } from '../config/database';
import { uploadDir } from '../middleware/upload';

const reportsDir = path.join(uploadDir, 'reports');

const REPORT_MAP: Record<string, string> = {
  BILAN: '01_Bilan.pdf',
  CPC: '02_CPC.pdf',
  JOURNAL: '03_Journal_General.pdf',
  GRAND_LIVRE: '04_Grand_Livre.pdf',
  BALANCE: '05_Balance_Generale.pdf',
  TVA: '06_Declaration_TVA.pdf',
  AUDIT: '07_Rapport_Audit.pdf',
  SYNTHESE: '08_Rapport_Synthese.pdf',
};

export async function exportFiscalZip(projectId: string): Promise<string> {
  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) throw new Error('Projet introuvable');

  const reports = await prisma.report.findMany({ where: { projectId } });
  if (reports.length === 0) {
    throw new Error('Aucun rapport généré. Veuillez d\'abord générer les rapports.');
  }

  const dateStr = new Date().toISOString().split('T')[0];
  const clientName = project.clientName.replace(/[^a-zA-Z0-9]/g, '_');
  const zipFilename = `Dossier_Fiscal_Certifie_${clientName}_${dateStr}_CabinetLaatig.zip`;
  const zipPath = path.join(reportsDir, zipFilename);

  const output = fs.createWriteStream(zipPath);
  const archive = archiver('zip', { zlib: { level: 9 } });

  return new Promise((resolve, reject) => {
    output.on('close', () => resolve(zipPath));
    archive.on('error', reject);

    archive.pipe(output);

    for (const report of reports) {
      const zipName = REPORT_MAP[report.reportType];
      if (zipName && fs.existsSync(report.filePath)) {
        archive.file(report.filePath, { name: zipName });
      }
    }

    archive.finalize();
  });
}
