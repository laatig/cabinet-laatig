import { prisma } from '../config/database';

function toNumber(val: unknown): number {
  if (val === null || val === undefined) return 0;
  return Number(val);
}

interface BilanEntry {
  type: 'actif' | 'passif';
  label: string;
  net: number;
  level: number;
  isTotal?: boolean;
  isSubtotal?: boolean;
}

interface CpcEntry {
  type: 'produits' | 'charges';
  label: string;
  montant: number;
  level: number;
  isTotal?: boolean;
  isSubtotal?: boolean;
}

interface BalanceEntry {
  code: string;
  label: string;
  classe: string;
  debit: number;
  credit: number;
  soldeDebit: number;
  soldeCredit: number;
}

interface JournalEntryOut {
  id: string;
  date: string;
  numero: string;
  libelle: string;
  compte: string;
  debit: number;
  credit: number;
}

interface GrandLivreEntry {
  date: string;
  libelle: string;
  compte: string;
  label: string;
  debit: number;
  credit: number;
  solde: number;
}

interface TvaRow {
  label: string;
  base: number;
  taux: number;
  montant: number;
}

interface TvaSection {
  rows: TvaRow[];
  total: number;
}

interface TvaDeclaration {
  id: string;
  period: string;
  year: string;
  declarationType: string;
  status: string;
  totalHT: number;
  totalTVA: number;
  totalTTC: number;
  collectee: TvaSection;
  deductible: TvaSection;
  netDue: number;
  dueDate: string;
  createdAt: string;
}

type AccountMap = Map<string, { label: string; classNumber: number; className: string; debit: number; credit: number }>;

async function buildAccountMap(projectId: string): Promise<AccountMap> {
  const entries = await prisma.journalEntry.findMany({
    where: { projectId },
    include: { pcmAccount: true },
    orderBy: [{ accountNumber: 'asc' }, { date: 'asc' }],
  });

  const map: AccountMap = new Map();
  for (const e of entries) {
    const key = e.accountNumber;
    const existing = map.get(key) || {
      label: e.pcmAccount?.accountName || '',
      classNumber: e.pcmAccount?.classNumber ?? 0,
      className: e.pcmAccount?.className || '',
      debit: 0,
      credit: 0,
    };
    existing.debit += toNumber(e.debit);
    existing.credit += toNumber(e.credit);
    if (!existing.label && e.pcmAccount?.accountName) existing.label = e.pcmAccount.accountName;
    map.set(key, existing);
  }
  return map;
}

function formatDate(d: Date): string {
  return d.toISOString().split('T')[0];
}

/* ============================
   1. BILAN (Balance Sheet)
   ============================ */
export async function getBilan(projectId: string): Promise<BilanEntry[]> {
  const acctMap = await buildAccountMap(projectId);
  const sorted = Array.from(acctMap.entries()).sort(([a], [b]) => a.localeCompare(b));

  const actif2: BilanEntry[] = [];
  const actif3: BilanEntry[] = [];
  const actif4: BilanEntry[] = [];
  const actif5: BilanEntry[] = [];
  const passif1: BilanEntry[] = [];

  for (const [code, a] of sorted) {
    const net = toNumber((a.debit - a.credit).toFixed(2));
    if (a.classNumber === 2) {
      actif2.push({ type: 'actif', label: `${code} - ${a.label}`, net: Math.abs(net), level: 1 });
    } else if (a.classNumber === 3) {
      actif3.push({ type: 'actif', label: `${code} - ${a.label}`, net: Math.abs(net), level: 1 });
    } else if (a.classNumber === 4) {
      actif4.push({ type: 'actif', label: `${code} - ${a.label}`, net: Math.abs(net), level: 1 });
    } else if (a.classNumber === 5) {
      actif5.push({ type: 'actif', label: `${code} - ${a.label}`, net: Math.abs(net), level: 1 });
    } else if (a.classNumber === 1) {
      passif1.push({ type: 'passif', label: `${code} - ${a.label}`, net: Math.abs(net), level: 1 });
    }
  }

  const result: BilanEntry[] = [];

  // --- ACTIF ---
  result.push({ type: 'actif', label: 'ACTIF', net: 0, level: 0, isTotal: true });

  if (actif2.length > 0) {
    result.push({ type: 'actif', label: 'Actif Immobilisé', net: 0, level: 0, isSubtotal: true });
    result.push(...actif2);
    const s2 = actif2.reduce((s, e) => s + e.net, 0);
    result.push({ type: 'actif', label: 'Total Actif Immobilisé', net: s2, level: 0, isSubtotal: true });
  }

  if (actif3.length > 0) {
    result.push({ type: 'actif', label: 'Actif Circulant', net: 0, level: 0, isSubtotal: true });
    result.push(...actif3);
    const s3 = actif3.reduce((s, e) => s + e.net, 0);
    result.push({ type: 'actif', label: 'Total Actif Circulant', net: s3, level: 0, isSubtotal: true });
  }

  if (actif4.length > 0) {
    result.push({ type: 'actif', label: 'Comptes de Régularisation', net: 0, level: 0, isSubtotal: true });
    result.push(...actif4);
    const s4 = actif4.reduce((s, e) => s + e.net, 0);
    result.push({ type: 'actif', label: 'Total Comptes de Régularisation', net: s4, level: 0, isSubtotal: true });
  }

  if (actif5.length > 0) {
    result.push({ type: 'actif', label: 'Trésorerie', net: 0, level: 0, isSubtotal: true });
    result.push(...actif5);
    const s5 = actif5.reduce((s, e) => s + e.net, 0);
    result.push({ type: 'actif', label: 'Total Trésorerie', net: s5, level: 0, isSubtotal: true });
  }

  const totalActif = [...actif2, ...actif3, ...actif4, ...actif5].reduce((s, e) => s + e.net, 0);
  result.push({ type: 'actif', label: 'TOTAL ACTIF', net: totalActif, level: 0, isTotal: true });

  // --- PASSIF ---
  result.push({ type: 'passif', label: 'PASSIF', net: 0, level: 0, isTotal: true });

  if (passif1.length > 0) {
    result.push({ type: 'passif', label: 'Financement Permanent', net: 0, level: 0, isSubtotal: true });
    result.push(...passif1);
    const s1 = passif1.reduce((s, e) => s + e.net, 0);
    result.push({ type: 'passif', label: 'Total Financement Permanent', net: s1, level: 0, isSubtotal: true });
  }

  const totalPassif = passif1.reduce((s, e) => s + e.net, 0);
  result.push({ type: 'passif', label: 'TOTAL PASSIF', net: totalPassif, level: 0, isTotal: true });

  return result;
}

/* ============================
   2. CPC (Income Statement)
   ============================ */
export async function getCpc(projectId: string): Promise<CpcEntry[]> {
  const entries = await prisma.journalEntry.findMany({
    where: { projectId },
    include: { pcmAccount: true },
    orderBy: [{ accountNumber: 'asc' }, { date: 'asc' }],
  });

  const chargeEntries: { label: string; prefix: string; montant: number }[] = [];
  const productEntries: { label: string; prefix: string; montant: number }[] = [];

  for (const e of entries) {
    if (!e.pcmAccount) continue;
    const cn = e.pcmAccount.classNumber;
    const prefix = e.accountNumber.substring(0, 2);
    const label = `${e.accountNumber} - ${e.pcmAccount.accountName}`;

    if (cn === 6) {
      chargeEntries.push({ label, prefix, montant: toNumber(e.debit) });
    } else if (cn === 7) {
      productEntries.push({ label, prefix, montant: toNumber(e.credit) });
    }
  }

  const result: CpcEntry[] = [];

  // --- PRODUITS ---
  result.push({ type: 'produits', label: 'PRODUITS', montant: 0, level: 0, isTotal: true });

  const produitsExploitation = productEntries.filter(p => ['71', '72', '73', '74', '75'].includes(p.prefix));
  if (produitsExploitation.length > 0) {
    result.push({ type: 'produits', label: 'I - Produits d\'Exploitation', montant: 0, level: 1, isSubtotal: true });
    const grouped = groupByPrefix(produitsExploitation);
    for (const g of grouped) {
      result.push({ type: 'produits', label: g.label, montant: g.total, level: 2 });
    }
    const totalPE = produitsExploitation.reduce((s, p) => s + p.montant, 0);
    result.push({ type: 'produits', label: 'Total Produits d\'Exploitation', montant: totalPE, level: 1, isSubtotal: true });
  }

  const produitsFinanciers = productEntries.filter(p => p.prefix === '76');
  if (produitsFinanciers.length > 0) {
    result.push({ type: 'produits', label: 'IV - Produits Financiers', montant: 0, level: 1, isSubtotal: true });
    for (const p of produitsFinanciers) {
      result.push({ type: 'produits', label: p.label, montant: p.montant, level: 2 });
    }
    const totalPF = produitsFinanciers.reduce((s, p) => s + p.montant, 0);
    result.push({ type: 'produits', label: 'Total Produits Financiers', montant: totalPF, level: 1, isSubtotal: true });
  }

  const produitsNonCourants = productEntries.filter(p => p.prefix === '77');
  if (produitsNonCourants.length > 0) {
    result.push({ type: 'produits', label: 'VIII - Produits Non Courants', montant: 0, level: 1, isSubtotal: true });
    for (const p of produitsNonCourants) {
      result.push({ type: 'produits', label: p.label, montant: p.montant, level: 2 });
    }
    const totalPNC = produitsNonCourants.reduce((s, p) => s + p.montant, 0);
    result.push({ type: 'produits', label: 'Total Produits Non Courants', montant: totalPNC, level: 1, isSubtotal: true });
  }

  const totalProduits = productEntries.reduce((s, p) => s + p.montant, 0);
  result.push({ type: 'produits', label: 'TOTAL PRODUITS', montant: totalProduits, level: 0, isTotal: true });

  // --- CHARGES ---
  result.push({ type: 'charges', label: 'CHARGES', montant: 0, level: 0, isTotal: true });

  const chargesExploitation = chargeEntries.filter(c => ['61', '62', '63', '64', '65', '68'].includes(c.prefix));
  if (chargesExploitation.length > 0) {
    result.push({ type: 'charges', label: 'II - Charges d\'Exploitation', montant: 0, level: 1, isSubtotal: true });
    const grouped = groupByPrefix(chargesExploitation);
    for (const g of grouped) {
      result.push({ type: 'charges', label: g.label, montant: g.total, level: 2 });
    }
    const totalCE = chargesExploitation.reduce((s, c) => s + c.montant, 0);
    result.push({ type: 'charges', label: 'Total Charges d\'Exploitation', montant: totalCE, level: 1, isSubtotal: true });
  }

  const chargesFinancieres = chargeEntries.filter(c => c.prefix === '66');
  if (chargesFinancieres.length > 0) {
    result.push({ type: 'charges', label: 'V - Charges Financières', montant: 0, level: 1, isSubtotal: true });
    for (const c of chargesFinancieres) {
      result.push({ type: 'charges', label: c.label, montant: c.montant, level: 2 });
    }
    const totalCF = chargesFinancieres.reduce((s, c) => s + c.montant, 0);
    result.push({ type: 'charges', label: 'Total Charges Financières', montant: totalCF, level: 1, isSubtotal: true });
  }

  const chargesNonCourantes = chargeEntries.filter(c => c.prefix === '67');
  if (chargesNonCourantes.length > 0) {
    result.push({ type: 'charges', label: 'IX - Charges Non Courantes', montant: 0, level: 1, isSubtotal: true });
    for (const c of chargesNonCourantes) {
      result.push({ type: 'charges', label: c.label, montant: c.montant, level: 2 });
    }
    const totalCNC = chargesNonCourantes.reduce((s, c) => s + c.montant, 0);
    result.push({ type: 'charges', label: 'Total Charges Non Courantes', montant: totalCNC, level: 1, isSubtotal: true });
  }

  const totalCharges = chargeEntries.reduce((s, c) => s + c.montant, 0);
  result.push({ type: 'charges', label: 'TOTAL CHARGES', montant: totalCharges, level: 0, isTotal: true });

  // Résultat net
  const resultat = totalProduits - totalCharges;
  result.push({
    type: resultat >= 0 ? 'produits' : 'charges',
    label: 'RÉSULTAT NET',
    montant: Math.abs(resultat),
    level: 0,
    isTotal: true,
  });

  return result;
}

function groupByPrefix(items: { label: string; prefix: string; montant: number }[]): { label: string; total: number }[] {
  const groups = new Map<string, { label: string; total: number }>();
  for (const item of items) {
    const existing = groups.get(item.prefix) || { label: '', total: 0 };
    existing.total += item.montant;
    existing.label = `Comptes ${item.prefix}xx`;
    groups.set(item.prefix, existing);
  }
  return Array.from(groups.values());
}

/* ============================
   3. BALANCE (Trial Balance)
   ============================ */
export async function getBalance(projectId: string): Promise<BalanceEntry[]> {
  const acctMap = await buildAccountMap(projectId);
  const sorted = Array.from(acctMap.entries()).sort(([a], [b]) => a.localeCompare(b));

  const result: BalanceEntry[] = [];
  for (const [code, a] of sorted) {
    const debit = toNumber(a.debit.toFixed(2));
    const credit = toNumber(a.credit.toFixed(2));
    const solde = debit - credit;
    result.push({
      code,
      label: a.label || code,
      classe: a.className || `Classe ${a.classNumber}`,
      debit,
      credit,
      soldeDebit: solde > 0 ? solde : 0,
      soldeCredit: solde < 0 ? Math.abs(solde) : 0,
    });
  }
  return result;
}

/* ============================
   4. JOURNAL (Journal Entries)
   ============================ */
export async function getJournal(projectId: string): Promise<JournalEntryOut[]> {
  const entries = await prisma.journalEntry.findMany({
    where: { projectId },
    include: { pcmAccount: true },
    orderBy: [{ date: 'asc' }, { accountNumber: 'asc' }],
  });

  return entries.map(e => ({
    id: e.id,
    date: formatDate(e.date),
    numero: e.reference || '',
    libelle: e.description,
    compte: `${e.accountNumber} - ${e.pcmAccount?.accountName || ''}`,
    debit: toNumber(e.debit),
    credit: toNumber(e.credit),
  }));
}

/* ============================
   5. GRAND LIVRE (General Ledger)
   ============================ */
export async function getGrandLivre(projectId: string): Promise<GrandLivreEntry[]> {
  const entries = await prisma.journalEntry.findMany({
    where: { projectId },
    include: { pcmAccount: true },
    orderBy: [{ accountNumber: 'asc' }, { date: 'asc' }],
  });

  const result: GrandLivreEntry[] = [];
  let currentAccount = '';
  let runningBalance = 0;

  for (const e of entries) {
    if (e.accountNumber !== currentAccount) {
      runningBalance = 0;
      currentAccount = e.accountNumber;
    }
    const debit = toNumber(e.debit);
    const credit = toNumber(e.credit);
    runningBalance += debit - credit;
    result.push({
      date: formatDate(e.date),
      libelle: e.description,
      compte: e.accountNumber,
      label: e.pcmAccount?.accountName || '',
      debit,
      credit,
      solde: toNumber(runningBalance.toFixed(2)),
    });
  }
  return result;
}

/* ============================
   6. TVA Declaration
   ============================ */
export async function getTva(projectId: string, period: string, year: string): Promise<TvaDeclaration> {
  const month = parseInt(period, 10);
  const y = parseInt(year, 10);

  const startDate = new Date(y, month - 1, 1);
  const endDate = new Date(y, month, 0, 23, 59, 59, 999);

  const transactions = await prisma.transaction.findMany({
    where: {
      projectId,
      date: { gte: startDate, lte: endDate },
    },
  });

  const collecteeRows: TvaRow[] = [];
  const deductibleRows: TvaRow[] = [];
  let totalHT = 0;
  let totalTVA = 0;
  let totalTTC = 0;

  for (const tx of transactions) {
    const total = toNumber(tx.totalAmount);
    const tax = toNumber(tx.taxAmount);
    const taxRate = toNumber(tx.taxRate);
    const ht = total - tax;

    totalHT += ht;
    totalTVA += tax;
    totalTTC += total;

    const base = taxRate > 0 ? toNumber((tax / (taxRate / 100)).toFixed(2)) : ht;

    const cat = (tx.category || '').toLowerCase();
    const isIncome = cat.includes('vente') || cat.includes('prestation') || cat.includes('honoraire')
      || cat.includes('commission') || cat.includes('produit') || cat.includes('subvention')
      || cat.includes('location') || cat.includes('intérêt') || (!cat.includes('charge') && !cat.includes('achat')
        && !cat.includes('frais') && !cat.includes('fourniture') && tx.documentType === 'BANK_STATEMENT');

    if (isIncome) {
      collecteeRows.push({
        label: `${tx.documentType === 'INVOICE' ? 'Ventes' : 'Produits'} - ${tx.vendorName || 'Non spécifié'}${tx.description ? ` (${tx.description})` : ''}`,
        base,
        taux: taxRate,
        montant: tax,
      });
    } else {
      deductibleRows.push({
        label: `${tx.documentType === 'BANK_STATEMENT' ? 'Charges bancaires' : 'Achats'} - ${tx.vendorName || 'Non spécifié'}${tx.description ? ` (${tx.description})` : ''}`,
        base,
        taux: taxRate,
        montant: tax,
      });
    }
  }

  const totalCollectee = collecteeRows.reduce((s, r) => s + r.montant, 0);
  const totalDeductible = deductibleRows.reduce((s, r) => s + r.montant, 0);
  const netDue = totalCollectee - totalDeductible;

  const dueDate = new Date(y, month, 20);
  if (dueDate.getDay() === 6) dueDate.setDate(dueDate.getDate() + 2);
  else if (dueDate.getDay() === 0) dueDate.setDate(dueDate.getDate() + 1);

  return {
    id: `tva-${projectId}-${year}-${period}`,
    period,
    year,
    declarationType: 'Mensuelle',
    status: 'Calculée',
    totalHT: toNumber(totalHT.toFixed(2)),
    totalTVA: toNumber(totalTVA.toFixed(2)),
    totalTTC: toNumber(totalTTC.toFixed(2)),
    collectee: {
      rows: collecteeRows.map(r => ({
        ...r,
        base: toNumber(r.base.toFixed(2)),
        montant: toNumber(r.montant.toFixed(2)),
      })),
      total: toNumber(totalCollectee.toFixed(2)),
    },
    deductible: {
      rows: deductibleRows.map(r => ({
        ...r,
        base: toNumber(r.base.toFixed(2)),
        montant: toNumber(r.montant.toFixed(2)),
      })),
      total: toNumber(totalDeductible.toFixed(2)),
    },
    netDue: toNumber(netDue.toFixed(2)),
    dueDate: formatDate(dueDate),
    createdAt: new Date().toISOString(),
  };
}

export const computeTvaGeneral = getTva;
