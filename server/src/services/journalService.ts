import { prisma } from '../config/database';

export async function generateJournalEntries(projectId: string): Promise<void> {
  const transactions = await prisma.transaction.findMany({
    where: { projectId, status: 'VERIFIED' },
    include: { pcmAccount: true },
  });

  const existingCount = await prisma.journalEntry.count({ where: { projectId } });
  if (existingCount > 0) {
    await prisma.journalEntry.deleteMany({ where: { projectId } });
  }

  let ref = 1;

  for (const tx of transactions) {
    const date = tx.date || new Date();
    const total = Number(tx.totalAmount);
    const tax = tx.taxAmount ? Number(tx.taxAmount) : 0;
    const ht = total - tax;
    const vendor = tx.vendorName || 'Non spécifié';

    switch (tx.documentType) {
      case 'INVOICE': {
        // Debit: Class 6 expense (HT), 4454 TVA recoverable
        // Credit: 4411 Fournisseurs (TTC)
        const expenseAccount = tx.pcmAccount?.accountNumber || getExpenseAccount(tx.category);
        await prisma.journalEntry.create({
          data: {
            projectId,
            transactionId: tx.id,
            date,
            accountNumber: expenseAccount,
            description: `${vendor} - ${tx.description || 'Achat'} (HT)`,
            debit: ht,
            credit: 0,
            reference: `F${ref}`,
          },
        });
        if (tax > 0) {
          await prisma.journalEntry.create({
            data: {
              projectId,
              transactionId: tx.id,
              date,
              accountNumber: '4454',
              pcmAccountId: await getPcmAccountId('4454'),
              description: `TVA récupérable - ${vendor}`,
              debit: tax,
              credit: 0,
              reference: `F${ref}`,
            },
          });
        }
        await prisma.journalEntry.create({
          data: {
            projectId,
            transactionId: tx.id,
            date,
            accountNumber: '4411',
            pcmAccountId: await getPcmAccountId('4411'),
            description: `Fournisseur - ${vendor}`,
            debit: 0,
            credit: total,
            reference: `F${ref}`,
          },
        });
        break;
      }

      case 'RECEIPT': {
        const isCash = (tx.description || '').toLowerCase().includes('caisse') || total < 1000;
        if (isCash) {
          // Debit: Class 6 expense, Credit: 5161 Caisse
          const expenseAccount2 = tx.pcmAccount?.accountNumber || getExpenseAccount(tx.category);
          await prisma.journalEntry.create({
            data: {
              projectId,
              transactionId: tx.id,
              date,
              accountNumber: expenseAccount2,
              description: `${vendor} - ${tx.description || 'Dépense espèces'}`,
              debit: total,
              credit: 0,
              reference: `R${ref}`,
            },
          });
          await prisma.journalEntry.create({
            data: {
              projectId,
              transactionId: tx.id,
              date,
              accountNumber: '5161',
              pcmAccountId: await getPcmAccountId('5161'),
              description: `Caisse - ${vendor}`,
              debit: 0,
              credit: total,
              reference: `R${ref}`,
            },
          });
        } else {
          // Debit: Class 6 expense, Credit: 5111 Banque
          const expenseAccount3 = tx.pcmAccount?.accountNumber || getExpenseAccount(tx.category);
          await prisma.journalEntry.create({
            data: {
              projectId,
              transactionId: tx.id,
              date,
              accountNumber: expenseAccount3,
              description: `${vendor} - ${tx.description || 'Dépense bancaire'}`,
              debit: total,
              credit: 0,
              reference: `R${ref}`,
            },
          });
          await prisma.journalEntry.create({
            data: {
              projectId,
              transactionId: tx.id,
              date,
              accountNumber: '5111',
              pcmAccountId: await getPcmAccountId('5111'),
              description: `Banque - ${vendor}`,
              debit: 0,
              credit: total,
              reference: `R${ref}`,
            },
          });
        }
        break;
      }

      case 'BANK_STATEMENT': {
        // Credit entry: 5111 Banque debit, Class 7 product credit
        // Debit entry: Class 6 expense debit, 5111 Banque credit
        const isRevenue = total > 0 && tx.status === 'VERIFIED' && !tx.category?.toLowerCase().includes('charge');
        if (isRevenue) {
          const productAccount = tx.pcmAccount?.accountNumber || '7111';
          await prisma.journalEntry.create({
            data: {
              projectId,
              transactionId: tx.id,
              date,
              accountNumber: '5111',
              pcmAccountId: await getPcmAccountId('5111'),
              description: `Banque - ${vendor}`,
              debit: total,
              credit: 0,
              reference: `B${ref}`,
            },
          });
          await prisma.journalEntry.create({
            data: {
              projectId,
              transactionId: tx.id,
              date,
              accountNumber: productAccount,
              description: `${vendor} - ${tx.description || 'Produit'}`,
              debit: 0,
              credit: total,
              reference: `B${ref}`,
            },
          });
        } else {
          const expenseAccount4 = tx.pcmAccount?.accountNumber || getExpenseAccount(tx.category);
          await prisma.journalEntry.create({
            data: {
              projectId,
              transactionId: tx.id,
              date,
              accountNumber: expenseAccount4,
              description: `${vendor} - ${tx.description || 'Charge bancaire'}`,
              debit: total,
              credit: 0,
              reference: `B${ref}`,
            },
          });
          await prisma.journalEntry.create({
            data: {
              projectId,
              transactionId: tx.id,
              date,
              accountNumber: '5111',
              pcmAccountId: await getPcmAccountId('5111'),
              description: `Banque - ${vendor}`,
              debit: 0,
              credit: total,
              reference: `B${ref}`,
            },
          });
        }
        break;
      }
    }
    ref++;
  }
}

function getExpenseAccount(category?: string | null): string {
  if (!category) return '6111';
  const cat = category.toLowerCase();
  if (cat.includes('achat') || cat.includes('fourniture') || cat.includes('stock')) return '6111';
  if (cat.includes('informatique') || cat.includes('logiciel') || cat.includes('it')) return '6131';
  if (cat.includes('transport') || cat.includes('voyage') || cat.includes('déplacement')) return '6141';
  if (cat.includes('loyer') || cat.includes('location')) return '6131';
  if (cat.includes('assurance') || cat.includes('insurance')) return '6161';
  if (cat.includes('salaire') || cat.includes('paie')) return '6171';
  if (cat.includes('banque') || cat.includes('frais bancaire')) return '6181';
  if (cat.includes('publicité') || cat.includes('marketing')) return '6191';
  if (cat.includes('entretien') || cat.includes('maintenance')) return '6151';
  if (cat.includes('formation') || cat.includes('éducation')) return '6175';
  if (cat.includes('telecom') || cat.includes('télécom') || cat.includes('internet')) return '6135';
  if (cat.includes('électricité') || cat.includes('eau') || cat.includes('lydec')) return '6132';
  if (cat.includes('impression') || cat.includes('papeterie')) return '6195';
  return '6111';
}

async function getPcmAccountId(accountNumber: string): Promise<string | undefined> {
  const account = await prisma.pcmAccount.findUnique({ where: { accountNumber } });
  return account?.id;
}
