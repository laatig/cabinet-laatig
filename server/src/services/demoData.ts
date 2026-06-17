import { prisma } from '../config/database';
import { DocumentType } from '@prisma/client';

export async function generateDemoTransactions(projectId: string): Promise<void> {
  const now = new Date();

  const invoices: Array<{
    vendorName: string;
    documentNumber: string;
    date: Date;
    totalAmount: number;
    taxAmount: number;
    taxRate: number;
    category: string;
    description: string;
    dueDate: Date;
  }> = [
    { vendorName: 'Maroc Telecom', documentNumber: 'MT-2024-001', date: new Date('2024-01-15'), totalAmount: 2400, taxAmount: 400, taxRate: 20, category: 'Télécom', description: 'Abonnement télécom et Internet Q1 2024', dueDate: new Date('2024-02-15') },
    { vendorName: 'Maroc Telecom', documentNumber: 'MT-2024-002', date: new Date('2024-01-20'), totalAmount: 2400, taxAmount: 400, taxRate: 20, category: 'Télécom', description: 'Facture télécom doublon suspect', dueDate: new Date('2024-02-20') },
    { vendorName: 'Lydec', documentNumber: 'LYD-2024-001', date: new Date('2024-02-01'), totalAmount: 1800, taxAmount: 300, taxRate: 20, category: 'Électricité/Eau', description: 'Facture électricité et eau janvier', dueDate: new Date('2024-02-28') },
    { vendorName: 'Marjane', documentNumber: 'MAR-2024-001', date: new Date('2024-02-10'), totalAmount: 5600, taxAmount: 933.33, taxRate: 20, category: 'Fournitures', description: 'Fournitures de bureau et consommables', dueDate: new Date('2024-03-10') },
    { vendorName: 'Atlas Assurances', documentNumber: 'AA-2024-001', date: new Date('2024-03-05'), totalAmount: 498, taxAmount: 0, taxRate: 0, category: 'Assurance', description: 'Prime assurance véhicule société', dueDate: new Date('2024-04-05') },
    { vendorName: 'Cabinet Filali Consulting', documentNumber: 'CFC-2024-001', date: new Date('2024-03-15'), totalAmount: 15000, taxAmount: 2500, taxRate: 20, category: 'Consulting', description: 'Prestation conseil juridique et fiscal', dueDate: new Date('2024-04-15') },
    { vendorName: 'Wafasalaf', documentNumber: 'WF-2024-001', date: new Date('2024-04-01'), totalAmount: 8500, taxAmount: 0, taxRate: 0, category: 'Prêt', description: 'Échéance prêt professionnel avril', dueDate: new Date('2024-04-30') },
    { vendorName: 'Transport Express Souss', documentNumber: 'TES-2024-001', date: new Date('2024-04-20'), totalAmount: 3200, taxAmount: 533.33, taxRate: 20, category: 'Transport', description: 'Frais de transport marchandises', dueDate: new Date('2024-05-20') },
    { vendorName: 'Imprimerie Al Watan', documentNumber: 'IAW-2024-001', date: new Date('2024-05-01'), totalAmount: 2800, taxAmount: 466.67, taxRate: 20, category: 'Impression', description: 'Impression documents commerciaux', dueDate: new Date('2024-06-01') },
    { vendorName: 'École Privée Ibn Rochd', documentNumber: 'EPIR-2024-001', date: new Date('2024-05-10'), totalAmount: 12000, taxAmount: 0, taxRate: 0, category: 'Formation', description: 'Frais de formation inter-entreprises', dueDate: new Date('2024-06-10') },
    { vendorName: 'Marjane', documentNumber: 'MAR-2024-002', date: new Date('2024-06-01'), totalAmount: 3400, taxAmount: 566.67, taxRate: 20, category: 'Fournitures', description: 'Fournitures bureau juin', dueDate: new Date('2024-07-01') },
    { vendorName: 'Lydec', documentNumber: 'LYD-2024-002', date: new Date('2024-07-01'), totalAmount: 2100, taxAmount: 350, taxRate: 20, category: 'Électricité/Eau', description: 'Facture électricité Q2 2024', dueDate: new Date('2024-07-31') },
  ];

  const receipts: Array<{
    vendorName: string;
    documentNumber: string;
    date: Date;
    totalAmount: number;
    taxAmount: number | null;
    taxRate: number;
    category: string;
    description: string;
  }> = [
    { vendorName: 'Pharmacie Centrale', documentNumber: 'PC-2024-001', date: new Date('2024-01-25'), totalAmount: 145, taxAmount: 0, taxRate: 0, category: 'Santé', description: 'Pharmacie-achats courants' },
    { vendorName: 'Cinéma Pathé', documentNumber: 'CP-2024-001', date: new Date('2024-02-15'), totalAmount: 180, taxAmount: 30, taxRate: 20, category: 'Loisir', description: 'Cinéma-sortie d équipe' },
    { vendorName: 'Restaurant Le Détroit', documentNumber: 'RLD-2024-001', date: new Date('2024-03-01'), totalAmount: 890, taxAmount: 148.33, taxRate: 20, category: 'Restauration', description: 'Repas d affaires clients' },
    { vendorName: 'Station Service Afriquia', documentNumber: 'SSA-2024-001', date: new Date('2024-03-20'), totalAmount: 650, taxAmount: 108.33, taxRate: 20, category: 'Transport', description: 'Carburant véhicule société' },
    { vendorName: 'Librairie Al Qods', documentNumber: 'LAQ-2024-001', date: new Date('2024-04-15'), totalAmount: 320, taxAmount: 53.33, taxRate: 20, category: 'Fournitures', description: 'Livres et fournitures administratives' },
    { vendorName: 'Café La Renaissance', documentNumber: 'CLR-2024-001', date: new Date('2024-05-05'), totalAmount: 85, taxAmount: 0, taxRate: 0, category: 'Restauration', description: 'Consommation café fournisseurs' },
    { vendorName: 'Boutique Office Plus', documentNumber: 'BOP-2024-001', date: new Date('2024-06-15'), totalAmount: 1200, taxAmount: 200, taxRate: 20, category: 'Fournitures', description: 'Mobilier bureau petit équipement' },
    { vendorName: 'Coiffeur La Coupe', documentNumber: 'CLC-2024-001', date: new Date('2024-07-10'), totalAmount: 60, taxAmount: 0, taxRate: 0, category: 'Personnel', description: 'Soins personnels' },
  ];

  const bankStatements: Array<{
    vendorName: string;
    documentNumber: string;
    date: Date;
    totalAmount: number;
    taxAmount: number | null;
    taxRate: number;
    category: string;
    description: string;
  }> = [
    { vendorName: 'CIH Bank', documentNumber: 'CIH-2024-001', date: new Date('2024-01-05'), totalAmount: 12000, taxAmount: null, taxRate: 0, category: 'Revenu', description: 'Virement client prestation conseil' },
    { vendorName: 'CIH Bank', documentNumber: 'CIH-2024-002', date: new Date('2024-02-03'), totalAmount: 8500, taxAmount: null, taxRate: 0, category: 'Revenu', description: 'Virement client mission audit' },
    { vendorName: 'CIH Bank', documentNumber: 'CIH-2024-003', date: new Date('2024-02-28'), totalAmount: 3400, taxAmount: null, taxRate: 0, category: 'Charge bancaire', description: 'Prélèvement Maroc Telecom' },
    { vendorName: 'CIH Bank', documentNumber: 'CIH-2024-004', date: new Date('2024-03-15'), totalAmount: 1800, taxAmount: null, taxRate: 0, category: 'Charge bancaire', description: 'Prélèvement Lydec' },
    { vendorName: 'CIH Bank', documentNumber: 'CIH-2024-005', date: new Date('2024-03-15'), totalAmount: 5600, taxAmount: null, taxRate: 0, category: 'Charge bancaire', description: 'Prélèvement Marjane' },
    { vendorName: 'CIH Bank', documentNumber: 'CIH-2024-006', date: new Date('2024-04-01'), totalAmount: 8500, taxAmount: null, taxRate: 0, category: 'Charge bancaire', description: 'Prélèvement Wafasalaf' },
    { vendorName: 'CIH Bank', documentNumber: 'CIH-2024-007', date: new Date('2024-04-10'), totalAmount: 15000, taxAmount: null, taxRate: 0, category: 'Revenu', description: 'Virement client facture consulting' },
    { vendorName: 'CIH Bank', documentNumber: 'CIH-2024-008', date: new Date('2024-05-06'), totalAmount: 2500, taxAmount: null, taxRate: 0, category: 'Charge bancaire', description: 'Prélèvement Fournisseur inconnu - non rapproché' },
    { vendorName: 'CIH Bank', documentNumber: 'CIH-2024-009', date: new Date('2024-05-20'), totalAmount: 18000, taxAmount: null, taxRate: 0, category: 'Revenu', description: 'Virement client annuel audit' },
    { vendorName: 'CIH Bank', documentNumber: 'CIH-2024-010', date: new Date('2024-06-15'), totalAmount: 7500, taxAmount: null, taxRate: 0, category: 'Revenu', description: 'Virement honoraires expertise' },
    { vendorName: 'CIH Bank', documentNumber: 'CIH-2024-011', date: new Date('2024-07-05'), totalAmount: 3200, taxAmount: null, taxRate: 0, category: 'Charge bancaire', description: 'Prélèvement Transport Express' },
    { vendorName: 'CIH Bank', documentNumber: 'CIH-2024-012', date: new Date('2024-07-06'), totalAmount: 2800, taxAmount: null, taxRate: 0, category: 'Charge bancaire', description: 'Prélèvement Imprimerie Al Watan' },
  ];

  const document = await prisma.document.findFirst({ where: { projectId } });

  const createTransaction = async (data: any, type: DocumentType, idx: number) => {
    await prisma.transaction.create({
      data: {
        projectId,
        documentId: document?.id || null,
        documentType: type,
        vendorName: data.vendorName,
        documentNumber: data.documentNumber,
        date: data.date,
        dueDate: data.dueDate || null,
        totalAmount: data.totalAmount,
        currency: 'MAD',
        taxAmount: data.taxAmount || 0,
        taxRate: data.taxRate || null,
        description: data.description,
        category: data.category,
        status: idx % 3 === 0 ? 'VERIFIED' : 'EXTRACTED',
      },
    });
  };

  for (let i = 0; i < invoices.length; i++) {
    await createTransaction(invoices[i], 'INVOICE', i);
  }
  for (let i = 0; i < receipts.length; i++) {
    await createTransaction(receipts[i], 'RECEIPT', i);
  }
  for (let i = 0; i < bankStatements.length; i++) {
    await createTransaction(bankStatements[i], 'BANK_STATEMENT', i);
  }
}
