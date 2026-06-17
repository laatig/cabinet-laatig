import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { prisma } from '../config/database';
import { uploadDir } from '../middleware/upload';

const reportsDir = path.join(uploadDir, 'reports');

function ensureReportsDir(): void {
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
  }
}

function addHeader(doc: PDFKit.PDFDocument, title: string, projectId?: string): void {
  doc.fontSize(18).font('Helvetica-Bold').text('CABINET LAATIG', { align: 'center' });
  doc.fontSize(12).font('Helvetica').text('Expert-Comptable & Commissaire aux Comptes', { align: 'center' });
  doc.fontSize(9).font('Helvetica').text('Mustapha Atiq - Expert-Comptable', { align: 'center' });
  doc.moveDown(0.5);
  doc.fontSize(14).font('Helvetica-Bold').text(title, { align: 'center' });
  doc.moveDown(0.5);
  doc.fontSize(8).font('Helvetica').text(
    `Date d'édition: ${new Date().toLocaleDateString('fr-FR')} | Page`,
    { align: 'center', continued: true }
  );
  doc.text('', { align: 'left' });
  doc.moveDown(0.3);

  doc.fontSize(7).font('Helvetica').text(
    'Cabinet Laatig - 26 Lot Al Qods, Quartier Al Qods, Derb Soltan, Casablanca - Tél: 06 62 22 89 63 - RC: 555999',
    { align: 'center' }
  );
  doc.moveDown(0.2);

  doc.lineWidth(1).moveTo(50, doc.y).lineTo(545, doc.y).stroke();
  doc.moveDown(0.5);
}

function addFooter(doc: PDFKit.PDFDocument): void {
  doc.lineWidth(1).moveTo(50, doc.y).lineTo(545, doc.y).stroke();
  doc.moveDown(0.3);
  doc.fontSize(7).font('Helvetica').text(
    'Cabinet Laatig - Expert-Comptable - Document certifié conforme aux écritures comptables. Sauf erreur ou omission.',
    { align: 'center' }
  );
}

function addCertificationPage(doc: PDFKit.PDFDocument, clientName: string, projectId: string): void {
  doc.addPage();
  doc.fontSize(18).font('Helvetica-Bold').text('CERTIFICATION', { align: 'center' });
  doc.moveDown(2);

  doc.fontSize(11).font('Helvetica').text(
    `Je soussigné, Mustapha Atiq, Expert-Comptable inscrit au tableau de l'Ordre des Experts-Comptables du Maroc,`,
    { align: 'left' }
  );
  doc.moveDown(0.5);
  doc.text(
    `Certifie que l'ensemble des documents, états de synthèse, et rapports ci-joints concernant la société`,
    { align: 'left' }
  );
  doc.moveDown(0.5);
  doc.font('Helvetica-Bold').text(`${clientName}`, { align: 'center' });
  doc.moveDown(0.5);
  doc.font('Helvetica').text(
    `pour la période allant du 1er Janvier au 31 Décembre 2024, ont été établis conformément aux dispositions`,
    { align: 'left' }
  );
  doc.moveDown(0.5);
  doc.text(
    `du Code Général de la Normalisation Comptable (CGNC) et au Plan Comptable Marocain (PCM) en vigueur.`,
    { align: 'left' }
  );
  doc.moveDown(0.5);
  doc.text(
    `Les vérifications ont été effectuées selon les normes de la profession et les diligences normales d'un`,
    { align: 'left' }
  );
  doc.moveDown(0.5);
  doc.text(
    `expert-comptable. Les anomalies signalées dans le rapport d'audit ont été portées à la connaissance`,
    { align: 'left' }
  );
  doc.moveDown(0.5);
  doc.text(`de la direction et feront l'objet d'un suivi approprié.`, { align: 'left' });
  doc.moveDown(2);

  doc.text(`Fait à Casablanca, le ${new Date().toLocaleDateString('fr-FR')}`, { align: 'right' });
  doc.moveDown(2);
  doc.text('Mustapha Atiq', { align: 'right' });
  doc.text('Expert-Comptable', { align: 'right' });
}

export async function generateBilan(projectId: string): Promise<string> {
  ensureReportsDir();
  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) throw new Error('Project not found');

  const journalEntries = await prisma.journalEntry.findMany({ where: { projectId } });

  const doc = new PDFDocument({ margin: 50, size: 'A4' });
  const filename = `bilan_${projectId}_${Date.now()}.pdf`;
  const filepath = path.join(reportsDir, filename);
  const stream = fs.createWriteStream(filepath);
  doc.pipe(stream);

  addHeader(doc, 'BILAN ACTIF / PASSIF', projectId);
  doc.fontSize(10).font('Helvetica-Bold').text(`Client: ${project.clientName}`, { align: 'left' });
  doc.text(`Exercice: ${project.fiscalYearStart.toLocaleDateString('fr-FR')} - ${project.fiscalYearEnd.toLocaleDateString('fr-FR')}`);
  doc.moveDown(0.5);

  const actifEntries = journalEntries.filter(e => ['2', '3', '4'].includes(e.accountNumber.charAt(0)));
  const passifEntries = journalEntries.filter(e => ['1', '4', '5'].includes(e.accountNumber.charAt(0)));

  const totalActif = actifEntries.reduce((s, e) => s + Number(e.debit) - Number(e.credit), 0);
  const totalPassif = passifEntries.reduce((s, e) => s + Number(e.credit) - Number(e.debit), 0);

  doc.fontSize(11).font('Helvetica-Bold').text('ACTIF', { underline: true });
  doc.moveDown(0.3);

  const actifTable = [
    ['Compte', 'Libellé', 'Montant (MAD)'],
    ...actifEntries.slice(0, 30).map(e => [e.accountNumber, e.description.substring(0, 40), `${Math.abs(Number(e.debit) - Number(e.credit)).toFixed(2)}`]),
    ['', 'TOTAL ACTIF', `${Math.abs(totalActif).toFixed(2)}`],
  ];
  actifTable.forEach((row, i) => {
    doc.fontSize(9).font(i === 0 || i === actifTable.length - 1 ? 'Helvetica-Bold' : 'Helvetica');
    doc.text(row[0].padEnd(12) + row[1].padEnd(50) + row[2], { align: 'left' });
    doc.moveDown(0.1);
  });

  doc.moveDown(0.5);
  doc.fontSize(11).font('Helvetica-Bold').text('PASSIF', { underline: true });
  doc.moveDown(0.3);

  const passifTable = [
    ['Compte', 'Libellé', 'Montant (MAD)'],
    ...passifEntries.slice(0, 30).map(e => [e.accountNumber, e.description.substring(0, 40), `${Math.abs(Number(e.credit) - Number(e.debit)).toFixed(2)}`]),
    ['', 'TOTAL PASSIF', `${Math.abs(totalPassif).toFixed(2)}`],
  ];
  passifTable.forEach((row, i) => {
    doc.fontSize(9).font(i === 0 || i === passifTable.length - 1 ? 'Helvetica-Bold' : 'Helvetica');
    doc.text(row[0].padEnd(12) + row[1].padEnd(50) + row[2], { align: 'left' });
    doc.moveDown(0.1);
  });

  doc.moveDown(0.5);
  doc.fontSize(10).font('Helvetica-Bold');
  const diff = Math.abs(totalActif - totalPassif);
  if (diff < 0.01) {
    doc.text(`✓ BILAN ÉQUILIBRÉ: ACTIF = PASSIF = ${Math.abs(totalActif).toFixed(2)} MAD`, { align: 'center' });
  } else {
    doc.text(`⚠ BILAN NON ÉQUILIBRÉ: Écart de ${diff.toFixed(2)} MAD`, { align: 'center' });
  }

  addFooter(doc);
  addCertificationPage(doc, project.clientName, projectId);
  doc.end();

  return new Promise((resolve, reject) => {
    stream.on('finish', () => resolve(filepath));
    stream.on('error', reject);
  });
}

export async function generateCpc(projectId: string): Promise<string> {
  ensureReportsDir();
  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) throw new Error('Project not found');

  const transactions = await prisma.transaction.findMany({ where: { projectId } });
  const doc = new PDFDocument({ margin: 50, size: 'A4' });
  const filename = `cpc_${projectId}_${Date.now()}.pdf`;
  const filepath = path.join(reportsDir, filename);
  const stream = fs.createWriteStream(filepath);
  doc.pipe(stream);

  addHeader(doc, 'COMPTE DE PRODUITS ET CHARGES (CPC)', projectId);
  doc.fontSize(10).font('Helvetica').text(`Client: ${project.clientName}`);
  doc.moveDown(0.5);

  const produits = transactions.filter(t => t.documentType === 'BANK_STATEMENT');
  const charges = transactions.filter(t => t.documentType === 'INVOICE' || t.documentType === 'RECEIPT');

  const totalProduits = produits.reduce((s, t) => s + Number(t.totalAmount), 0);
  const totalCharges = charges.reduce((s, t) => s + Number(t.totalAmount), 0);
  const resultat = totalProduits - totalCharges;

  doc.fontSize(11).font('Helvetica-Bold').text('PRODUITS', { underline: true });
  doc.moveDown(0.3);
  produits.slice(0, 20).forEach(t => {
    doc.fontSize(9).font('Helvetica').text(`${(t.vendorName || t.description || 'N/A').padEnd(50)} ${Number(t.totalAmount).toFixed(2)} MAD`);
    doc.moveDown(0.05);
  });
  doc.font('Helvetica-Bold').text(`${'TOTAL PRODUITS'.padEnd(50)} ${totalProduits.toFixed(2)} MAD`);
  doc.moveDown(0.5);

  doc.fontSize(11).font('Helvetica-Bold').text('CHARGES', { underline: true });
  doc.moveDown(0.3);
  charges.slice(0, 20).forEach(t => {
    doc.fontSize(9).font('Helvetica').text(`${(t.vendorName || t.description || 'N/A').padEnd(50)} ${Number(t.totalAmount).toFixed(2)} MAD`);
    doc.moveDown(0.05);
  });
  doc.font('Helvetica-Bold').text(`${'TOTAL CHARGES'.padEnd(50)} ${totalCharges.toFixed(2)} MAD`);
  doc.moveDown(0.5);

  doc.fontSize(12).font('Helvetica-Bold');
  doc.text(`${'RÉSULTAT NET'.padEnd(50)} ${resultat.toFixed(2)} MAD`, { align: 'left' });
  doc.text(resultat >= 0 ? '(BÉNÉFICE)' : '(PERTE)', { align: 'center' });

  addFooter(doc);
  addCertificationPage(doc, project.clientName, projectId);
  doc.end();

  return new Promise((resolve, reject) => {
    stream.on('finish', () => resolve(filepath));
    stream.on('error', reject);
  });
}

export async function generateJournal(projectId: string): Promise<string> {
  ensureReportsDir();
  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) throw new Error('Project not found');

  const entries = await prisma.journalEntry.findMany({
    where: { projectId },
    orderBy: [{ date: 'asc' }, { accountNumber: 'asc' }],
  });

  const doc = new PDFDocument({ margin: 50, size: 'A4' });
  const filename = `journal_${projectId}_${Date.now()}.pdf`;
  const filepath = path.join(reportsDir, filename);
  const stream = fs.createWriteStream(filepath);
  doc.pipe(stream);

  addHeader(doc, 'JOURNAL GÉNÉRAL', projectId);
  doc.fontSize(10).font('Helvetica').text(`Client: ${project.clientName}`);
  doc.moveDown(0.3);

  doc.fontSize(8).font('Helvetica-Bold');
  doc.text('Date'.padEnd(14) + 'Compte'.padEnd(10) + 'Libellé'.padEnd(50) + 'Débit'.padEnd(15) + 'Crédit'.padEnd(15) + 'Réf');
  doc.lineWidth(0.5).moveTo(50, doc.y).lineTo(545, doc.y).stroke();
  doc.moveDown(0.2);

  let totalDebit = 0;
  let totalCredit = 0;

  entries.forEach(e => {
    const date = e.date ? e.date.toLocaleDateString('fr-FR') : '';
    doc.fontSize(7).font('Helvetica');
    doc.text(
      date.padEnd(14) +
      e.accountNumber.padEnd(10) +
      e.description.substring(0, 48).padEnd(50) +
      Number(e.debit).toFixed(2).padStart(14) +
      Number(e.credit).toFixed(2).padStart(14) +
      (e.reference || '').padStart(6)
    );
    totalDebit += Number(e.debit);
    totalCredit += Number(e.credit);
  });

  doc.lineWidth(0.5).moveTo(50, doc.y).lineTo(545, doc.y).stroke();
  doc.moveDown(0.2);
  doc.font('Helvetica-Bold').fontSize(8);
  doc.text(
    ''.padEnd(24) +
    'TOTAUX'.padEnd(50) +
    totalDebit.toFixed(2).padStart(14) +
    totalCredit.toFixed(2).padStart(14)
  );

  addFooter(doc);
  addCertificationPage(doc, project.clientName, projectId);
  doc.end();

  return new Promise((resolve, reject) => {
    stream.on('finish', () => resolve(filepath));
    stream.on('error', reject);
  });
}

export async function generateGrandLivre(projectId: string): Promise<string> {
  ensureReportsDir();
  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) throw new Error('Project not found');

  const entries = await prisma.journalEntry.findMany({
    where: { projectId },
    orderBy: [{ accountNumber: 'asc' }, { date: 'asc' }],
  });

  const doc = new PDFDocument({ margin: 50, size: 'A4' });
  const filename = `grand_livre_${projectId}_${Date.now()}.pdf`;
  const filepath = path.join(reportsDir, filename);
  const stream = fs.createWriteStream(filepath);
  doc.pipe(stream);

  addHeader(doc, 'GRAND LIVRE', projectId);
  doc.fontSize(10).font('Helvetica').text(`Client: ${project.clientName}`);
  doc.moveDown(0.3);

  const grouped = entries.reduce((acc, e) => {
    if (!acc[e.accountNumber]) acc[e.accountNumber] = [];
    acc[e.accountNumber].push(e);
    return acc;
  }, {} as Record<string, typeof entries>);

  Object.entries(grouped).forEach(([accountNumber, accountEntries]) => {
    doc.fontSize(10).font('Helvetica-Bold').text(`Compte ${accountNumber}`);
    doc.moveDown(0.1);

    doc.fontSize(8).font('Helvetica-Bold');
    doc.text('Date'.padEnd(14) + 'Libellé'.padEnd(50) + 'Débit'.padEnd(15) + 'Crédit'.padEnd(15) + 'Solde');
    doc.lineWidth(0.5).moveTo(50, doc.y).lineTo(545, doc.y).stroke();
    doc.moveDown(0.1);

    let solde = 0;
    accountEntries.forEach(e => {
      const date = e.date ? e.date.toLocaleDateString('fr-FR') : '';
      solde += Number(e.debit) - Number(e.credit);
      doc.fontSize(7).font('Helvetica');
      doc.text(
        date.padEnd(14) +
        e.description.substring(0, 48).padEnd(50) +
        Number(e.debit).toFixed(2).padStart(14) +
        Number(e.credit).toFixed(2).padStart(14) +
        solde.toFixed(2).padStart(12)
      );
    });
    doc.moveDown(0.3);
  });

  addFooter(doc);
  addCertificationPage(doc, project.clientName, projectId);
  doc.end();

  return new Promise((resolve, reject) => {
    stream.on('finish', () => resolve(filepath));
    stream.on('error', reject);
  });
}

export async function generateBalance(projectId: string): Promise<string> {
  ensureReportsDir();
  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) throw new Error('Project not found');

  const entries = await prisma.journalEntry.findMany({
    where: { projectId },
    include: { pcmAccount: true },
    orderBy: { accountNumber: 'asc' },
  });

  const doc = new PDFDocument({ margin: 50, size: 'A4' });
  const filename = `balance_${projectId}_${Date.now()}.pdf`;
  const filepath = path.join(reportsDir, filename);
  const stream = fs.createWriteStream(filepath);
  doc.pipe(stream);

  addHeader(doc, 'BALANCE GÉNÉRALE', projectId);
  doc.fontSize(10).font('Helvetica').text(`Client: ${project.clientName}`);
  doc.moveDown(0.3);

  doc.fontSize(7).font('Helvetica-Bold');
  doc.text(
    'Compte'.padEnd(10) +
    'Libellé'.padEnd(30) +
    'SD (MAD)'.padEnd(14) +
    'SC (MAD)'.padEnd(14) +
    'Mvt Débit'.padEnd(14) +
    'Mvt Crédit'.padEnd(14)
  );
  doc.lineWidth(0.5).moveTo(50, doc.y).lineTo(545, doc.y).stroke();
  doc.moveDown(0.1);

  const grouped = entries.reduce((acc, e) => {
    if (!acc[e.accountNumber]) acc[e.accountNumber] = { debit: 0, credit: 0, name: e.description || e.pcmAccount?.accountName || '' };
    acc[e.accountNumber].debit += Number(e.debit);
    acc[e.accountNumber].credit += Number(e.credit);
    return acc;
  }, {} as Record<string, { debit: number; credit: number; name: string }>);

  let totalSd = 0, totalSc = 0, totalMvtD = 0, totalMvtC = 0;

  Object.entries(grouped).forEach(([accountNumber, data]) => {
    const soldeDebit = data.debit > data.credit ? data.debit - data.credit : 0;
    const soldeCredit = data.credit > data.debit ? data.credit - data.debit : 0;
    totalSd += soldeDebit;
    totalSc += soldeCredit;
    totalMvtD += data.debit;
    totalMvtC += data.credit;

    doc.fontSize(7).font('Helvetica');
    doc.text(
      accountNumber.padEnd(10) +
      data.name.substring(0, 28).padEnd(30) +
      soldeDebit.toFixed(2).padStart(13) +
      soldeCredit.toFixed(2).padStart(13) +
      data.debit.toFixed(2).padStart(13) +
      data.credit.toFixed(2).padStart(13)
    );
  });

  doc.lineWidth(0.5).moveTo(50, doc.y).lineTo(545, doc.y).stroke();
  doc.moveDown(0.1);
  doc.font('Helvetica-Bold');
  doc.text(
    'TOTAL'.padEnd(40) +
    totalSd.toFixed(2).padStart(13) +
    totalSc.toFixed(2).padStart(13) +
    totalMvtD.toFixed(2).padStart(13) +
    totalMvtC.toFixed(2).padStart(13)
  );

  if (Math.abs(totalSd - totalSc) < 0.01) {
    doc.moveDown(0.3);
    doc.text(`✓ BALANCE ÉQUILIBRÉE: Total SD = Total SC = ${totalSd.toFixed(2)} MAD`, { align: 'center' });
  }

  addFooter(doc);
  addCertificationPage(doc, project.clientName, projectId);
  doc.end();

  return new Promise((resolve, reject) => {
    stream.on('finish', () => resolve(filepath));
    stream.on('error', reject);
  });
}

export async function generateTva(projectId: string, period?: string, year?: number): Promise<string> {
  ensureReportsDir();
  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) throw new Error('Project not found');

  const transactions = await prisma.transaction.findMany({ where: { projectId } });
  const doc = new PDFDocument({ margin: 50, size: 'A4' });
  const filename = `tva_${projectId}_${Date.now()}.pdf`;
  const filepath = path.join(reportsDir, filename);
  const stream = fs.createWriteStream(filepath);
  doc.pipe(stream);

  addHeader(doc, 'DÉCLARATION DE TVA', projectId);
  doc.fontSize(10).font('Helvetica').text(`Client: ${project.clientName}`);
  doc.text(`Période: ${period || 'Annuelle'} ${year || project.fiscalYearEnd.getFullYear()}`);
  doc.moveDown(0.5);

  const withTax = transactions.filter(t => t.taxAmount && Number(t.taxAmount) > 0);
  const totalHT = withTax.reduce((s, t) => s + Number(t.totalAmount) - Number(t.taxAmount || 0), 0);
  const totalTVA = withTax.reduce((s, t) => s + Number(t.taxAmount || 0), 0);
  const totalTTC = withTax.reduce((s, t) => s + Number(t.totalAmount), 0);
  const tvaCollected = transactions.filter(t => t.documentType === 'BANK_STATEMENT')
    .reduce((s, t) => s + Number(t.taxAmount || 0), 0);
  const tvaDeductible = withTax.filter(t => t.documentType === 'INVOICE')
    .reduce((s, t) => s + Number(t.taxAmount || 0), 0);
  const tvaDue = Math.max(0, tvaCollected - tvaDeductible);
  const creditTVA = Math.max(0, tvaDeductible - tvaCollected);

  doc.fontSize(10).font('Helvetica-Bold').text('TABLEAU DE DÉCLARATION TVA', { underline: true });
  doc.moveDown(0.3);

  const rows = [
    ['Total HT des opérations imposables', `${totalHT.toFixed(2)}`],
    ['TVA facturée (Collectée)', `${tvaCollected.toFixed(2)}`],
    ['TVA déductible sur achats', `${tvaDeductible.toFixed(2)}`],
    ['TVA due au Trésor', `${tvaDue.toFixed(2)}`],
    ['Crédit de TVA', `${creditTVA.toFixed(2)}`],
    ['Total TTC', `${totalTTC.toFixed(2)}`],
  ];

  rows.forEach(([label, value]) => {
    doc.fontSize(9).font('Helvetica');
    doc.text(`${label.padEnd(60)} ${value.padStart(15)} MAD`);
  });

  addFooter(doc);
  addCertificationPage(doc, project.clientName, projectId);
  doc.end();

  return new Promise((resolve, reject) => {
    stream.on('finish', () => resolve(filepath));
    stream.on('error', reject);
  });
}

export async function generateRapportAudit(projectId: string): Promise<string> {
  ensureReportsDir();
  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) throw new Error('Project not found');

  const anomalies = await prisma.anomaly.findMany({
    where: { projectId },
    include: { transaction: { select: { vendorName: true, totalAmount: true, description: true, date: true } } },
  });

  const doc = new PDFDocument({ margin: 50, size: 'A4' });
  const filename = `audit_${projectId}_${Date.now()}.pdf`;
  const filepath = path.join(reportsDir, filename);
  const stream = fs.createWriteStream(filepath);
  doc.pipe(stream);

  addHeader(doc, "RAPPORT D'AUDIT", projectId);
  doc.fontSize(10).font('Helvetica').text(`Client: ${project.clientName}`);
  doc.moveDown(0.5);

  // Section 1
  doc.fontSize(11).font('Helvetica-Bold').text('1. Opinion sur les états financiers');
  doc.moveDown(0.2);
  doc.fontSize(9).font('Helvetica').text(
    `Nous avons effectué l'audit des états financiers de ${project.clientName} pour l'exercice clos le ${project.fiscalYearEnd.toLocaleDateString('fr-FR')}. ` +
    `À notre avis, les états financiers sont, dans tous leurs aspects significatifs, conformes au CGNC et au PCM.`
  );
  doc.moveDown(0.5);

  // Section 2
  doc.fontSize(11).font('Helvetica-Bold').text('2. Fondement de l\'opinion');
  doc.moveDown(0.2);
  doc.fontSize(9).font('Helvetica').text(
    `Nous avons effectué notre audit selon les normes de la profession au Maroc. Nous sommes indépendants de la société conformément ` +
    `aux règles d'éthique. Nous estimons que les éléments probants obtenus sont suffisants et appropriés pour fonder notre opinion.`
  );
  doc.moveDown(0.5);

  // Section 3
  doc.fontSize(11).font('Helvetica-Bold').text('3. Points clés de l\'audit');
  doc.moveDown(0.2);
  doc.fontSize(9).font('Helvetica').text(
    `Les points clés de l'audit sont ceux qui, selon notre jugement professionnel, ont été les plus importants dans l'audit des états financiers. ` +
    `Ces points ont été traités dans le contexte de notre audit et nous n'exprimons pas une opinion séparée sur ces points.`
  );
  doc.moveDown(0.5);

  // Section 4
  doc.fontSize(11).font('Helvetica-Bold').text('4. Anomalies et constatations');
  doc.moveDown(0.2);
  if (anomalies.length > 0) {
    anomalies.forEach(a => {
      doc.fontSize(8).font('Helvetica-Bold').text(`${a.type} - ${a.severity}`);
      doc.fontSize(8).font('Helvetica').text(`  ${a.description}`);
      if (a.explanation) doc.text(`  ${a.explanation}`);
      doc.moveDown(0.1);
    });
  } else {
    doc.fontSize(9).font('Helvetica').text('Aucune anomalie significative détectée.');
  }
  doc.moveDown(0.5);

  // Section 5
  doc.fontSize(11).font('Helvetica-Bold').text('5. Recommandations');
  doc.moveDown(0.2);
  doc.fontSize(9).font('Helvetica').text(
    `1. Renforcer les contrôles internes sur le traitement des factures fournisseurs.\n` +
    `2. Mettre en place un rapprochement bancaire mensuel systématique.\n` +
    `3. Assurer une séparation des tâches entre la saisie et la validation des écritures comptables.\n` +
    `4. Revoir la procédure de comptabilisation de la TVA pour assurer sa conformité.`
  );

  addFooter(doc);
  addCertificationPage(doc, project.clientName, projectId);
  doc.end();

  return new Promise((resolve, reject) => {
    stream.on('finish', () => resolve(filepath));
    stream.on('error', reject);
  });
}

export async function generateRapportSynthese(projectId: string): Promise<string> {
  ensureReportsDir();
  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) throw new Error('Project not found');

  const anomalies = await prisma.anomaly.findMany({
    where: { projectId },
    include: { transaction: { select: { vendorName: true, totalAmount: true } } },
  });
  const transactions = await prisma.transaction.findMany({ where: { projectId } });

  const doc = new PDFDocument({ margin: 50, size: 'A4' });
  const filename = `synthese_${projectId}_${Date.now()}.pdf`;
  const filepath = path.join(reportsDir, filename);
  const stream = fs.createWriteStream(filepath);
  doc.pipe(stream);

  addHeader(doc, 'RAPPORT DE SYNTHÈSE - LETTRE DE GÉRANCE', projectId);
  doc.fontSize(10).font('Helvetica').text(`À l'attention de la direction de ${project.clientName}`);
  doc.moveDown(0.5);

  const verifiedCount = transactions.filter(t => t.status === 'VERIFIED').length;
  const flaggedCount = transactions.filter(t => t.status === 'FLAGGED').length;
  const criticalCount = anomalies.filter(a => a.severity === 'CRITICAL').length;
  const highCount = anomalies.filter(a => a.severity === 'HIGH').length;
  const totalAmount = transactions.reduce((s, t) => s + Number(t.totalAmount), 0);

  doc.fontSize(11).font('Helvetica-Bold').text('Synthèse des travaux');
  doc.moveDown(0.2);
  doc.fontSize(9).font('Helvetica');
  doc.text(`- Total des transactions examinées: ${transactions.length}`);
  doc.text(`- Montant total: ${totalAmount.toFixed(2)} MAD`);
  doc.text(`- Transactions vérifiées: ${verifiedCount}`);
  doc.text(`- Transactions signalées: ${flaggedCount}`);
  doc.text(`- Anomalies critiques: ${criticalCount}`);
  doc.text(`- Anomalies hautes: ${highCount}`);
  doc.moveDown(0.5);

  doc.fontSize(11).font('Helvetica-Bold').text('Anomalies détectées');
  doc.moveDown(0.2);
  if (anomalies.length > 0) {
    anomalies.forEach(a => {
      doc.fontSize(8).font('Helvetica-Bold').text(`${a.type} [${a.severity}]`);
      doc.fontSize(8).font('Helvetica').text(`  ${a.description}`);
      doc.moveDown(0.05);
    });
  } else {
    doc.fontSize(9).font('Helvetica').text('Aucune anomalie détectée.');
  }

  addFooter(doc);
  addCertificationPage(doc, project.clientName, projectId);
  doc.end();

  return new Promise((resolve, reject) => {
    stream.on('finish', () => resolve(filepath));
    stream.on('error', reject);
  });
}

export async function generateCahierTravail(projectId: string): Promise<string> {
  ensureReportsDir();
  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) throw new Error('Project not found');

  const transactions = await prisma.transaction.findMany({ where: { projectId } });
  const entries = await prisma.journalEntry.findMany({
    where: { projectId },
    orderBy: { date: 'asc' },
  });

  const doc = new PDFDocument({ margin: 50, size: 'A4' });
  const filename = `cahier_travail_${projectId}_${Date.now()}.pdf`;
  const filepath = path.join(reportsDir, filename);
  const stream = fs.createWriteStream(filepath);
  doc.pipe(stream);

  addHeader(doc, 'CAHIER DE TRAVAIL', projectId);
  doc.fontSize(10).font('Helvetica').text(`Client: ${project.clientName}`);
  doc.moveDown(0.5);

  doc.fontSize(11).font('Helvetica-Bold').text('1. Liste des transactions');
  doc.moveDown(0.2);
  doc.fontSize(8).font('Helvetica-Bold');
  doc.text('Date'.padEnd(14) + 'Type'.padEnd(18) + 'Fournisseur'.padEnd(25) + 'Montant'.padEnd(15) + 'Statut');
  doc.lineWidth(0.5).moveTo(50, doc.y).lineTo(545, doc.y).stroke();
  doc.moveDown(0.1);

  transactions.forEach(t => {
    const date = t.date ? t.date.toLocaleDateString('fr-FR') : '';
    doc.fontSize(7).font('Helvetica');
    doc.text(
      date.padEnd(14) +
      t.documentType.padEnd(18) +
      (t.vendorName || '').substring(0, 23).padEnd(25) +
      Number(t.totalAmount).toFixed(2).padStart(14) +
      t.status.padStart(10)
    );
  });

  doc.moveDown(0.5);
  doc.fontSize(11).font('Helvetica-Bold').text('2. Écritures de journal');
  doc.moveDown(0.2);
  doc.fontSize(8).font('Helvetica-Bold');
  doc.text('Date'.padEnd(14) + 'Compte'.padEnd(10) + 'Libellé'.padEnd(45) + 'Débit'.padEnd(15) + 'Crédit');
  doc.lineWidth(0.5).moveTo(50, doc.y).lineTo(545, doc.y).stroke();
  doc.moveDown(0.1);

  entries.slice(0, 50).forEach(e => {
    const date = e.date ? e.date.toLocaleDateString('fr-FR') : '';
    doc.fontSize(7).font('Helvetica');
    doc.text(
      date.padEnd(14) +
      e.accountNumber.padEnd(10) +
      e.description.substring(0, 43).padEnd(45) +
      Number(e.debit).toFixed(2).padStart(14) +
      Number(e.credit).toFixed(2).padStart(14)
    );
  });

  addFooter(doc);
  addCertificationPage(doc, project.clientName, projectId);
  doc.end();

  return new Promise((resolve, reject) => {
    stream.on('finish', () => resolve(filepath));
    stream.on('error', reject);
  });
}

export async function generateAllReports(projectId: string): Promise<string[]> {
  const paths: string[] = [];
  paths.push(await generateBilan(projectId));
  paths.push(await generateCpc(projectId));
  paths.push(await generateJournal(projectId));
  paths.push(await generateGrandLivre(projectId));
  paths.push(await generateBalance(projectId));
  paths.push(await generateTva(projectId));
  paths.push(await generateRapportAudit(projectId));
  paths.push(await generateRapportSynthese(projectId));
  paths.push(await generateCahierTravail(projectId));

  await prisma.report.createMany({
    data: [
      { projectId, reportType: 'BILAN', filePath: paths[0] },
      { projectId, reportType: 'CPC', filePath: paths[1] },
      { projectId, reportType: 'JOURNAL', filePath: paths[2] },
      { projectId, reportType: 'GRAND_LIVRE', filePath: paths[3] },
      { projectId, reportType: 'BALANCE', filePath: paths[4] },
      { projectId, reportType: 'TVA', filePath: paths[5] },
      { projectId, reportType: 'AUDIT', filePath: paths[6] },
      { projectId, reportType: 'SYNTHESE', filePath: paths[7] },
      { projectId, reportType: 'CAHIER_TRAVAIL', filePath: paths[8] },
    ],
  });

  return paths;
}
