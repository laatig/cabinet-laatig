import ExcelJS from 'exceljs';
import path from 'path';
import fs from 'fs';
import config from '../config';

const headerFill: ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '1A1A2E' } };
const totalFill: ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'F0F0F0' } };

const STYLE = {
  header: { font: { bold: true, color: { argb: 'FFFFFF' }, size: 11 }, fill: headerFill },
  title: { font: { bold: true, size: 14, color: { argb: '1A1A2E' } } },
  subtitle: { font: { bold: true, size: 11, color: { argb: '2C3E50' } } },
  total: { font: { bold: true, size: 11 }, fill: totalFill },
  number: { numFmt: '#,##0.00' },
  numberRed: { numFmt: '#,##0.00', font: { color: { argb: 'E74C3C' } } },
  border: { style: 'thin' as const, color: { argb: 'D0D0D0' } },
};

function applyBorder(ws: ExcelJS.Worksheet, row: number, colStart: number, colEnd: number) {
  for (let c = colStart; c <= colEnd; c++) {
    ws.getCell(row, c).border = {
      top: STYLE.border, left: STYLE.border, bottom: STYLE.border, right: STYLE.border,
    };
  }
}

export async function exportBilan(projectId: string, data: { type: string; label: string; net: number; level: number; isTotal?: boolean; isSubtotal?: boolean }[]): Promise<string> {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('Bilan');
  ws.columns = [{ width: 8 }, { width: 50 }, { width: 18 }];

  ws.mergeCells('A1:C1'); ws.getCell('A1').value = 'BILAN (CGNC)'; ws.getCell('A1').font = STYLE.title.font;
  ws.mergeCells('A2:C2'); ws.getCell('A2').value = `Projet: ${projectId}`; ws.getCell('A2').font = { italic: true, color: { argb: '7F8C8D' } };
  ws.getCell('A3').value = 'Compte'; ws.getCell('B3').value = 'Libellé'; ws.getCell('C3').value = 'Montant Net';
  [4, 5, 6].forEach(r => { ws.getRow(r).font = STYLE.header.font; ws.getCell(r, 1).fill = headerFill; ws.getCell(r, 2).fill = headerFill; ws.getCell(r, 3).fill = headerFill; });

  let row = 4;
  for (const entry of data) {
    ws.getCell(row, 1).value = entry.type === 'actif' ? 'A' : 'P';
    ws.getCell(row, 2).value = entry.label;
    if (entry.level < 2 || entry.isTotal || entry.isSubtotal) {
      ws.getCell(row, 3).value = entry.net;
      ws.getCell(row, 3).numFmt = '#,##0.00';
    }
    if (entry.isTotal) { ws.getRow(row).font = STYLE.total.font; ws.getRow(row).fill = STYLE.total.fill; }
    else if (entry.isSubtotal) { ws.getRow(row).font = STYLE.subtitle.font; }
    applyBorder(ws, row, 1, 3);
    row++;
  }

  const filePath = path.join(config.uploadDir, 'reports', `bilan_${projectId}_${Date.now()}.xlsx`);
  await wb.xlsx.writeFile(filePath);
  return filePath;
}

export async function exportCPC(projectId: string, data: { type: string; label: string; montant: number; level: number; isTotal?: boolean; isSubtotal?: boolean }[]): Promise<string> {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('CPC');
  ws.columns = [{ width: 8 }, { width: 50 }, { width: 18 }];

  ws.mergeCells('A1:C1'); ws.getCell('A1').value = 'COMPTE DE PRODUITS ET CHARGES'; ws.getCell('A1').font = STYLE.title.font;

  let row = 3;
  for (const entry of data) {
    ws.getCell(row, 1).value = entry.type === 'produits' ? 'PDT' : 'CHG';
    ws.getCell(row, 2).value = entry.label;
    if (entry.level < 2 || entry.isTotal || entry.isSubtotal) {
      ws.getCell(row, 3).value = entry.montant;
      ws.getCell(row, 3).numFmt = '#,##0.00';
    }
    if (entry.isTotal) { ws.getRow(row).font = STYLE.total.font; ws.getRow(row).fill = STYLE.total.fill; }
    else if (entry.isSubtotal) { ws.getRow(row).font = STYLE.subtitle.font; }
    applyBorder(ws, row, 1, 3);
    row++;
  }

  const filePath = path.join(config.uploadDir, 'reports', `cpc_${projectId}_${Date.now()}.xlsx`);
  await wb.xlsx.writeFile(filePath);
  return filePath;
}

export async function exportBalance(projectId: string, data: { code: string; label: string; classe: string; debit: number; credit: number; soldeDebit: number; soldeCredit: number }[]): Promise<string> {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('Balance');
  ws.columns = [{ width: 12 }, { width: 35 }, { width: 14 }, { width: 14 }, { width: 14 }, { width: 14 }];

  ws.mergeCells('A1:F1'); ws.getCell('A1').value = 'BALANCE GÉNÉRALE'; ws.getCell('A1').font = STYLE.title.font;

  const headers = ['Code', 'Libellé', 'Débit', 'Crédit', 'Solde Débiteur', 'Solde Créditeur'];
  let row = 3;
  headers.forEach((h, i) => { ws.getCell(row, i + 1).value = h; ws.getCell(row, i + 1).font = STYLE.header.font; ws.getCell(row, i + 1).fill = STYLE.header.fill; });
  row++;

  for (const entry of data) {
    ws.getCell(row, 1).value = entry.code;
    ws.getCell(row, 2).value = entry.label;
    ws.getCell(row, 3).value = entry.debit; ws.getCell(row, 3).numFmt = '#,##0.00';
    ws.getCell(row, 4).value = entry.credit; ws.getCell(row, 4).numFmt = '#,##0.00';
    ws.getCell(row, 5).value = entry.soldeDebit; ws.getCell(row, 5).numFmt = '#,##0.00';
    ws.getCell(row, 6).value = entry.soldeCredit; ws.getCell(row, 6).numFmt = '#,##0.00';
    applyBorder(ws, row, 1, 6);
    row++;
  }

  const filePath = path.join(config.uploadDir, 'reports', `balance_${projectId}_${Date.now()}.xlsx`);
  await wb.xlsx.writeFile(filePath);
  return filePath;
}

export async function exportJournal(projectId: string, data: { id: string; date: string; numero: string; libelle: string; compte: string; debit: number; credit: number }[]): Promise<string> {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('Journal');
  ws.columns = [{ width: 14 }, { width: 14 }, { width: 40 }, { width: 35 }, { width: 14 }, { width: 14 }];

  ws.mergeCells('A1:F1'); ws.getCell('A1').value = 'JOURNAL GÉNÉRAL'; ws.getCell('A1').font = STYLE.title.font;

  const headers = ['Date', 'N° Pièce', 'Libellé', 'Compte', 'Débit', 'Crédit'];
  let row = 3;
  headers.forEach((h, i) => { ws.getCell(row, i + 1).value = h; ws.getCell(row, i + 1).font = STYLE.header.font; ws.getCell(row, i + 1).fill = STYLE.header.fill; });
  row++;

  for (const entry of data) {
    ws.getCell(row, 1).value = entry.date;
    ws.getCell(row, 2).value = entry.numero;
    ws.getCell(row, 3).value = entry.libelle;
    ws.getCell(row, 4).value = entry.compte;
    ws.getCell(row, 5).value = entry.debit; ws.getCell(row, 5).numFmt = '#,##0.00';
    ws.getCell(row, 6).value = entry.credit; ws.getCell(row, 6).numFmt = '#,##0.00';
    applyBorder(ws, row, 1, 6);
    row++;
  }

  const filePath = path.join(config.uploadDir, 'reports', `journal_${projectId}_${Date.now()}.xlsx`);
  await wb.xlsx.writeFile(filePath);
  return filePath;
}

export async function exportGrandLivre(projectId: string, data: { date: string; libelle: string; compte: string; label: string; debit: number; credit: number; solde: number }[]): Promise<string> {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('Grand Livre');
  ws.columns = [{ width: 14 }, { width: 40 }, { width: 14 }, { width: 35 }, { width: 14 }, { width: 14 }, { width: 14 }];

  ws.mergeCells('A1:G1'); ws.getCell('A1').value = 'GRAND LIVRE'; ws.getCell('A1').font = STYLE.title.font;

  const headers = ['Date', 'Libellé', 'Compte', 'Intitulé', 'Débit', 'Crédit', 'Solde'];
  let row = 3;
  headers.forEach((h, i) => { ws.getCell(row, i + 1).value = h; ws.getCell(row, i + 1).font = STYLE.header.font; ws.getCell(row, i + 1).fill = STYLE.header.fill; });
  row++;

  for (const entry of data) {
    ws.getCell(row, 1).value = entry.date;
    ws.getCell(row, 2).value = entry.libelle;
    ws.getCell(row, 3).value = entry.compte;
    ws.getCell(row, 4).value = entry.label;
    ws.getCell(row, 5).value = entry.debit; ws.getCell(row, 5).numFmt = '#,##0.00';
    ws.getCell(row, 6).value = entry.credit; ws.getCell(row, 6).numFmt = '#,##0.00';
    ws.getCell(row, 7).value = entry.solde; ws.getCell(row, 7).numFmt = '#,##0.00';
    applyBorder(ws, row, 1, 7);
    row++;
  }

  const filePath = path.join(config.uploadDir, 'reports', `grand_livre_${projectId}_${Date.now()}.xlsx`);
  await wb.xlsx.writeFile(filePath);
  return filePath;
}

export async function exportTVA(projectId: string, data: any, period: string, year: string): Promise<string> {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('TVA');
  ws.columns = [{ width: 40 }, { width: 14 }, { width: 14 }, { width: 14 }];

  ws.mergeCells('A1:D1'); ws.getCell('A1').value = `DÉCLARATION TVA - ${data.period}/${data.year}`; ws.getCell('A1').font = STYLE.title.font;

  const writeSection = (title: string, rows: any[], startRow: number): number => {
    ws.mergeCells(`A${startRow}:D${startRow}`); ws.getCell(startRow, 1).value = title; ws.getCell(startRow, 1).font = STYLE.subtitle.font;
    startRow++;
    ['Libellé', 'Base HT', 'Taux', 'Montant TVA'].forEach((h, i) => { ws.getCell(startRow, i + 1).value = h; ws.getCell(startRow, i + 1).font = STYLE.header.font; ws.getCell(startRow, i + 1).fill = STYLE.header.fill; });
    startRow++;
    for (const r of rows) {
      ws.getCell(startRow, 1).value = r.label;
      ws.getCell(startRow, 2).value = r.base; ws.getCell(startRow, 2).numFmt = '#,##0.00';
      ws.getCell(startRow, 3).value = r.taux;
      ws.getCell(startRow, 4).value = r.montant; ws.getCell(startRow, 4).numFmt = '#,##0.00';
      applyBorder(ws, startRow, 1, 4);
      startRow++;
    }
    return startRow;
  };

  let row = 3;
  row = writeSection('TVA Collectée', data.collectee?.rows || [], row);
  row++;
  row = writeSection('TVA Déductible', data.deductible?.rows || [], row);

  ws.getCell(row, 1).value = 'TVA Nette Due'; ws.getCell(row, 1).font = STYLE.total.font;
  ws.getCell(row, 4).value = data.netDue; ws.getCell(row, 4).numFmt = '#,##0.00'; ws.getCell(row, 4).font = STYLE.total.font;

  const filePath = path.join(config.uploadDir, 'reports', `tva_${projectId}_${period}_${year}_${Date.now()}.xlsx`);
  await wb.xlsx.writeFile(filePath);
  return filePath;
}

export async function exportSIG(projectId: string, data: { label: string; montant: number; level: number; isTotal?: boolean; isSubtotal?: boolean }[]): Promise<string> {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('SIG');
  ws.columns = [{ width: 50 }, { width: 18 }];

  ws.mergeCells('A1:B1'); ws.getCell('A1').value = 'SOLDES INTERMÉDIAIRES DE GESTION'; ws.getCell('A1').font = STYLE.title.font;

  let row = 3;
  for (const entry of data) {
    ws.getCell(row, 1).value = entry.label;
    ws.getCell(row, 2).value = entry.montant; ws.getCell(row, 2).numFmt = '#,##0.00';
    if (entry.isTotal) { ws.getRow(row).font = STYLE.total.font; ws.getRow(row).fill = STYLE.total.fill; }
    else if (entry.isSubtotal) { ws.getRow(row).font = STYLE.subtitle.font; }
    applyBorder(ws, row, 1, 2);
    row++;
  }

  const filePath = path.join(config.uploadDir, 'reports', `sig_${projectId}_${Date.now()}.xlsx`);
  await wb.xlsx.writeFile(filePath);
  return filePath;
}

export async function exportLiasseFiscale(projectId: string, data: { section: string; items: { label: string; valeur: string | number; format?: string }[] }[]): Promise<string> {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('Liasse Fiscale');
  ws.columns = [{ width: 8 }, { width: 45 }, { width: 20 }];

  ws.mergeCells('A1:C1'); ws.getCell('A1').value = 'LIASSE FISCALE'; ws.getCell('A1').font = STYLE.title.font;

  let row = 3;
  for (const section of data) {
    ws.mergeCells(`A${row}:C${row}`); ws.getCell(row, 1).value = section.section;
    ws.getCell(row, 1).font = { bold: true, size: 12, color: { argb: 'FFFFFF' } };
    ws.getCell(row, 1).fill = { type: 'pattern' as const, pattern: 'solid' as const, fgColor: { argb: '2C3E50' } };
    row++;

    for (const item of section.items) {
      ws.getCell(row, 2).value = item.label;
      ws.getCell(row, 3).value = typeof item.valeur === 'number' ? item.valeur : String(item.valeur);
      if (typeof item.valeur === 'number') ws.getCell(row, 3).numFmt = '#,##0.00';
      applyBorder(ws, row, 1, 3);
      row++;
    }
    row++;
  }

  const filePath = path.join(config.uploadDir, 'reports', `liasse_fiscale_${projectId}_${Date.now()}.xlsx`);
  await wb.xlsx.writeFile(filePath);
  return filePath;
}