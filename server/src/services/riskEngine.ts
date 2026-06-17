import { prisma } from '../config/database';
import { Severity } from '@prisma/client';

interface AnomalyInput {
  transactionId: string;
  projectId: string;
  type: string;
  severity: Severity;
  description: string;
  explanation?: string;
}

async function createAnomaly(data: AnomalyInput): Promise<void> {
  const existing = await prisma.anomaly.findFirst({
    where: {
      transactionId: data.transactionId,
      type: data.type,
      status: 'OPEN',
    },
  });
  if (!existing) {
    await prisma.anomaly.create({ data });
  }
}

export async function runRiskEngine(projectId: string): Promise<any[]> {
  const anomalies: any[] = [];
  const transactions = await prisma.transaction.findMany({
    where: { projectId },
    include: { lineItems: true },
  });

  for (const tx of transactions) {
    const total = Number(tx.totalAmount);
    const tax = tx.taxAmount ? Number(tx.taxAmount) : 0;
    const rate = tx.taxRate ? Number(tx.taxRate) : 0;
    const date = tx.date ? new Date(tx.date) : null;

    // Rule 1: Duplicate Invoice
    if (tx.documentType === 'INVOICE' && tx.vendorName && tx.totalAmount && tx.documentNumber && date) {
      const duplicates = transactions.filter(t =>
        t.id !== tx.id &&
        t.documentType === 'INVOICE' &&
        t.vendorName === tx.vendorName &&
        Number(t.totalAmount) === Number(tx.totalAmount) &&
        t.documentNumber !== tx.documentNumber &&
        t.date &&
        Math.abs(new Date(t.date).getTime() - date.getTime()) <= 90 * 24 * 60 * 60 * 1000
      );
      if (duplicates.length > 0) {
        await createAnomaly({
          transactionId: tx.id,
          projectId,
          type: 'DUPLICATE_INVOICE',
          severity: 'CRITICAL',
          description: `Facture en double détectée: ${tx.vendorName} - ${tx.documentNumber} (${Number(tx.totalAmount)} MAD)`,
          explanation: `Une facture similaire de ${tx.vendorName} pour le même montant (${Number(tx.totalAmount)} MAD) a été trouvée avec un numéro de document différent dans les 90 jours.`,
        });
      }
    }

    // Rule 2: Threshold Circumvention
    if (total >= 490 && total <= 499.99) {
      await createAnomaly({
        transactionId: tx.id,
        projectId,
        type: 'THRESHOLD_CIRCUMVENTION',
        severity: 'HIGH',
        description: `Contournement de seuil: ${Number(tx.totalAmount)} MAD (juste en dessous de 500 MAD)`,
        explanation: `Le montant de ${Number(tx.totalAmount)} MAD se situe juste en dessous du seuil de 500 MAD, ce qui peut indiquer une tentative de contournement des contrôles.`,
      });
    }

    // Rule 3: Personal Expense
    const personalKeywords = ['cinéma', 'restaurant', 'voyage personnel', 'cadeau', 'vêtement', 'sport', 'loisir', 'coiffeur', 'bijou', 'jouet', 'personal', 'gift', 'entertainment'];
    const descAndCat = `${tx.description || ''} ${tx.category || ''}`.toLowerCase();
    if (personalKeywords.some(kw => descAndCat.includes(kw))) {
      await createAnomaly({
        transactionId: tx.id,
        projectId,
        type: 'PERSONAL_EXPENSE',
        severity: 'HIGH',
        description: `Dépense personnelle détectée: ${tx.description || tx.category}`,
        explanation: `La transaction contient des indicateurs de dépense personnelle (motif: ${personalKeywords.find(kw => descAndCat.includes(kw))}).`,
      });
    }

    // Rule 4: Unmatched Bank Payment
    if (tx.documentType === 'BANK_STATEMENT' && !tx.isDuplicate) {
      const debitAmount = Number(tx.totalAmount);
      if (debitAmount > 0) {
        const matchingTx = transactions.find(t =>
          t.id !== tx.id &&
          t.vendorName === tx.vendorName &&
          Math.abs(Number(t.totalAmount) - debitAmount) < 0.01 &&
          (t.documentType === 'INVOICE' || t.documentType === 'RECEIPT') &&
          t.status === 'VERIFIED'
        );
        if (!matchingTx) {
          await createAnomaly({
            transactionId: tx.id,
            projectId,
            type: 'UNMATCHED_BANK_PAYMENT',
            severity: 'HIGH',
            description: `Paiement bancaire non rapproché: ${tx.vendorName || 'Inconnu'} - ${debitAmount} MAD`,
            explanation: `Un débit bancaire de ${debitAmount} MAD n'a pu être rapproché avec aucune facture ou reçu vérifié.`,
          });
        }
      }
    }

    // Rule 5: Weekend Transaction
    if (date) {
      const dayOfWeek = date.getDay();
      if (dayOfWeek === 0 || dayOfWeek === 6) {
        await createAnomaly({
          transactionId: tx.id,
          projectId,
          type: 'WEEKEND_TRANSACTION',
          severity: 'MEDIUM',
          description: `Transaction le week-end: ${date.toLocaleDateString('fr-FR')}`,
          explanation: `La transaction a été effectuée un ${dayOfWeek === 0 ? 'dimanche' : 'samedi'}, ce qui est inhabituel pour une opération professionnelle.`,
        });
      }
    }

    // Rule 6: Unusually High Amount
    if (tx.category) {
      const categoryTxs = transactions.filter(t => t.category === tx.category && t.id !== tx.id);
      if (categoryTxs.length > 0) {
        const categoryAvg = categoryTxs.reduce((sum, t) => sum + Number(t.totalAmount), 0) / categoryTxs.length;
        if (total > categoryAvg * 3) {
          await createAnomaly({
            transactionId: tx.id,
            projectId,
            type: 'UNUSUALLY_HIGH_AMOUNT',
            severity: 'HIGH',
            description: `Montant anormalement élevé: ${total} MAD (moyenne catégorie: ${categoryAvg.toFixed(2)} MAD)`,
            explanation: `Le montant de ${total} MAD dépasse de plus de 3 fois la moyenne de la catégorie "${tx.category}" (${categoryAvg.toFixed(2)} MAD).`,
          });
        }
      }
    }

    // Rule 7: Missing VAT
    const zeroRatedCategories = ['salaire', 'salary', 'loan', 'prêt', 'insurance', 'assurance', 'bank', 'banque', 'charge'];
    const isZeroRated = zeroRatedCategories.some(zc => descAndCat.includes(zc));
    if (tax === 0 && !rate && !isZeroRated && tx.documentType !== 'BANK_STATEMENT') {
      await createAnomaly({
        transactionId: tx.id,
        projectId,
        type: 'MISSING_VAT',
        severity: 'MEDIUM',
        description: `TVA manquante: ${tx.vendorName || 'Inconnu'} - ${total} MAD`,
        explanation: `La transaction ne comporte pas de TVA alors que la catégorie "${tx.category || 'Non spécifiée'}" n'est pas exonérée.`,
      });
    }
  }

  const result = await prisma.anomaly.findMany({
    where: { projectId, status: 'OPEN' },
    include: {
      transaction: {
        select: { vendorName: true, totalAmount: true, date: true, description: true, documentType: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return result;
}
