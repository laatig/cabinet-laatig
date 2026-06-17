import { PrismaClient, DocumentType } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Clean existing data
  await prisma.auditLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.report.deleteMany();
  await prisma.journalEntry.deleteMany();
  await prisma.anomaly.deleteMany();
  await prisma.lineItem.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.document.deleteMany();
  await prisma.project.deleteMany();
  await prisma.pcmAccount.deleteMany();
  await prisma.user.deleteMany();

  // Seed PCM Accounts
  console.log('Seeding PCM accounts...');
  const pcmAccounts = [
    // Classe 1: Comptes de financement permanent
    { accountNumber: '1011', accountName: 'Capital social', classNumber: 1, className: 'Financement permanent' },
    { accountNumber: '1061', accountName: 'Réserves légales', classNumber: 1, className: 'Financement permanent' },
    { accountNumber: '1081', accountName: 'Report à nouveau', classNumber: 1, className: 'Financement permanent' },
    { accountNumber: '1111', accountName: 'Primes d\'émission', classNumber: 1, className: 'Financement permanent' },
    { accountNumber: '1121', accountName: 'Plus-values de réévaluation', classNumber: 1, className: 'Financement permanent' },
    { accountNumber: '1311', accountName: 'Subventions d\'investissement', classNumber: 1, className: 'Financement permanent' },
    { accountNumber: '1411', accountName: 'Provisions réglementées', classNumber: 1, className: 'Financement permanent' },
    { accountNumber: '1481', accountName: 'Amortissements dérogatoires', classNumber: 1, className: 'Financement permanent' },
    { accountNumber: '1511', accountName: 'Emprunts obligataires', classNumber: 1, className: 'Financement permanent' },
    { accountNumber: '1531', accountName: 'Emprunts auprès des établissements de crédit', classNumber: 1, className: 'Financement permanent' },
    { accountNumber: '1551', accountName: 'Dépôts et cautionnements reçus', classNumber: 1, className: 'Financement permanent' },

    // Classe 2: Comptes d'actif immobilisé
    { accountNumber: '2111', accountName: 'Frais de constitution', classNumber: 2, className: 'Actif immobilisé' },
    { accountNumber: '2121', accountName: 'Frais de recherche et développement', classNumber: 2, className: 'Actif immobilisé' },
    { accountNumber: '2131', accountName: 'Brevets, licences, marques', classNumber: 2, className: 'Actif immobilisé' },
    { accountNumber: '2141', accountName: 'Fonds commercial', classNumber: 2, className: 'Actif immobilisé' },
    { accountNumber: '2211', accountName: 'Terrains nus', classNumber: 2, className: 'Actif immobilisé' },
    { accountNumber: '2221', accountName: 'Terrains aménagés', classNumber: 2, className: 'Actif immobilisé' },
    { accountNumber: '2311', accountName: 'Bâtiments industriels', classNumber: 2, className: 'Actif immobilisé' },
    { accountNumber: '2321', accountName: 'Bâtiments administratifs', classNumber: 2, className: 'Actif immobilisé' },
    { accountNumber: '2331', accountName: 'Installations techniques', classNumber: 2, className: 'Actif immobilisé' },
    { accountNumber: '2341', accountName: 'Matériel et outillage', classNumber: 2, className: 'Actif immobilisé' },
    { accountNumber: '2351', accountName: 'Matériel de transport', classNumber: 2, className: 'Actif immobilisé' },
    { accountNumber: '2361', accountName: 'Mobilier de bureau', classNumber: 2, className: 'Actif immobilisé' },
    { accountNumber: '2371', accountName: 'Matériel informatique', classNumber: 2, className: 'Actif immobilisé' },
    { accountNumber: '2381', accountName: 'Agencements et aménagements', classNumber: 2, className: 'Actif immobilisé' },
    { accountNumber: '2411', accountName: 'Titres de participation', classNumber: 2, className: 'Actif immobilisé' },
    { accountNumber: '2511', accountName: 'Prêts immobilisés', classNumber: 2, className: 'Actif immobilisé' },
    { accountNumber: '2811', accountName: 'Amortissements des immobilisations', classNumber: 2, className: 'Actif immobilisé' },

    // Classe 3: Comptes d'actif circulant (hors trésorerie)
    { accountNumber: '3111', accountName: 'Marchandises', classNumber: 3, className: 'Actif circulant (hors trésorerie)' },
    { accountNumber: '3121', accountName: 'Matières premières', classNumber: 3, className: 'Actif circulant (hors trésorerie)' },
    { accountNumber: '3131', accountName: 'Produits finis', classNumber: 3, className: 'Actif circulant (hors trésorerie)' },
    { accountNumber: '3151', accountName: 'Fournitures consommables', classNumber: 3, className: 'Actif circulant (hors trésorerie)' },
    { accountNumber: '3411', accountName: 'Fournisseurs débiteurs', classNumber: 3, className: 'Actif circulant (hors trésorerie)' },
    { accountNumber: '3421', accountName: 'Créances clients', classNumber: 3, className: 'Actif circulant (hors trésorerie)' },
    { accountNumber: '3425', accountName: 'Clients douteux', classNumber: 3, className: 'Actif circulant (hors trésorerie)' },
    { accountNumber: '3431', accountName: 'Personnel débiteur', classNumber: 3, className: 'Actif circulant (hors trésorerie)' },
    { accountNumber: '3441', accountName: 'État débiteur', classNumber: 3, className: 'Actif circulant (hors trésorerie)' },
    { accountNumber: '3451', accountName: 'Comptes de régularisation actif', classNumber: 3, className: 'Actif circulant (hors trésorerie)' },
    { accountNumber: '3481', accountName: 'Charges constatées d\'avance', classNumber: 3, className: 'Actif circulant (hors trésorerie)' },

    // Classe 4: Comptes de passif circulant (hors trésorerie)
    { accountNumber: '4411', accountName: 'Fournisseurs', classNumber: 4, className: 'Passif circulant (hors trésorerie)' },
    { accountNumber: '4421', accountName: 'Clients créditeurs', classNumber: 4, className: 'Passif circulant (hors trésorerie)' },
    { accountNumber: '4431', accountName: 'Personnel', classNumber: 4, className: 'Passif circulant (hors trésorerie)' },
    { accountNumber: '4441', accountName: 'Organismes sociaux', classNumber: 4, className: 'Passif circulant (hors trésorerie)' },
    { accountNumber: '4454', accountName: 'TVA récupérable', classNumber: 4, className: 'Passif circulant (hors trésorerie)' },
    { accountNumber: '4455', accountName: 'TVA due', classNumber: 4, className: 'Passif circulant (hors trésorerie)' },
    { accountNumber: '4456', accountName: 'TVA facturée', classNumber: 4, className: 'Passif circulant (hors trésorerie)' },
    { accountNumber: '4461', accountName: 'État impôt sur les sociétés', classNumber: 4, className: 'Passif circulant (hors trésorerie)' },
    { accountNumber: '4481', accountName: 'Produits constatés d\'avance', classNumber: 4, className: 'Passif circulant (hors trésorerie)' },

    // Classe 5: Comptes de trésorerie
    { accountNumber: '5111', accountName: 'Banque', classNumber: 5, className: 'Trésorerie' },
    { accountNumber: '5121', accountName: 'Banque (compte courant)', classNumber: 5, className: 'Trésorerie' },
    { accountNumber: '5141', accountName: 'Chèques à encaisser', classNumber: 5, className: 'Trésorerie' },
    { accountNumber: '5161', accountName: 'Caisse', classNumber: 5, className: 'Trésorerie' },
    { accountNumber: '5181', accountName: 'Règles d\'avance', classNumber: 5, className: 'Trésorerie' },

    // Classe 6: Comptes de charges
    { accountNumber: '6111', accountName: 'Achats de marchandises', classNumber: 6, className: 'Charges' },
    { accountNumber: '6121', accountName: 'Achats de matières premières', classNumber: 6, className: 'Charges' },
    { accountNumber: '6131', accountName: 'Locations et charges locatives', classNumber: 6, className: 'Charges' },
    { accountNumber: '6132', accountName: 'Énergie et fluides', classNumber: 6, className: 'Charges' },
    { accountNumber: '6135', accountName: 'Télécommunications', classNumber: 6, className: 'Charges' },
    { accountNumber: '6141', accountName: 'Transports', classNumber: 6, className: 'Charges' },
    { accountNumber: '6151', accountName: 'Entretien et réparations', classNumber: 6, className: 'Charges' },
    { accountNumber: '6161', accountName: 'Primes d\'assurances', classNumber: 6, className: 'Charges' },
    { accountNumber: '6171', accountName: 'Salaires et traitements', classNumber: 6, className: 'Charges' },
    { accountNumber: '6175', accountName: 'Formation professionnelle', classNumber: 6, className: 'Charges' },
    { accountNumber: '6181', accountName: 'Frais bancaires', classNumber: 6, className: 'Charges' },
    { accountNumber: '6191', accountName: 'Publicité et relations publiques', classNumber: 6, className: 'Charges' },
    { accountNumber: '6195', accountName: 'Fournitures de bureau', classNumber: 6, className: 'Charges' },
    { accountNumber: '6311', accountName: 'Impôts et taxes', classNumber: 6, className: 'Charges' },
    { accountNumber: '6391', accountName: 'Charges diverses', classNumber: 6, className: 'Charges' },
    { accountNumber: '6511', accountName: 'Dotations d\'exploitation', classNumber: 6, className: 'Charges' },

    // Classe 7: Comptes de produits
    { accountNumber: '7111', accountName: 'Ventes de marchandises', classNumber: 7, className: 'Produits' },
    { accountNumber: '7121', accountName: 'Prestations de services', classNumber: 7, className: 'Produits' },
    { accountNumber: '7131', accountName: 'Produits accessoires', classNumber: 7, className: 'Produits' },
    { accountNumber: '7141', accountName: 'Subventions d\'exploitation', classNumber: 7, className: 'Produits' },
    { accountNumber: '7381', accountName: 'Intérêts et produits financiers', classNumber: 7, className: 'Produits' },
    { accountNumber: '7391', accountName: 'Produits divers', classNumber: 7, className: 'Produits' },
    { accountNumber: '7511', accountName: 'Reprises d\'exploitation', classNumber: 7, className: 'Produits' },

    // Classe 8: Comptes de résultats
    { accountNumber: '8111', accountName: 'Résultat net (bénéfice)', classNumber: 8, className: 'Résultats' },
    { accountNumber: '8121', accountName: 'Résultat net (perte)', classNumber: 8, className: 'Résultats' },
  ];

  for (const account of pcmAccounts) {
    await prisma.pcmAccount.create({ data: account });
  }

  console.log(`Created ${pcmAccounts.length} PCM accounts`);

  // Create test user
  const passwordHash = await bcrypt.hash('Laatig2024!', 12);
  const user = await prisma.user.create({
    data: {
      email: 'mustapha@cabinetlaatig.ma',
      passwordHash,
      fullName: 'Mustapha Atiq',
      title: 'Expert-Comptable',
      firmName: 'Cabinet Laatig',
      phoneNumber: '+212 6 62 22 89 63',
    },
  });
  console.log(`Created user: ${user.email}`);

  // Create 2 projects
  const project1 = await prisma.project.create({
    data: {
      userId: user.id,
      clientName: 'Société Al Qods Distribution',
      clientAddress: '26 Lot Al Qods, Derb Soltan, Casablanca',
      clientICE: 'ICE001234567',
      clientRC: 'RC123456',
      clientTP: 'TP654321',
      fiscalYearStart: new Date('2024-01-01'),
      fiscalYearEnd: new Date('2024-12-31'),
      auditType: 'REVISION_CONTRACTUELLE',
    },
  });

  const project2 = await prisma.project.create({
    data: {
      userId: user.id,
      clientName: 'Marjane Holding',
      clientAddress: 'Avenue des FAR, Casablanca',
      clientICE: 'ICE009876543',
      clientRC: 'RC789012',
      clientTP: 'TP210987',
      fiscalYearStart: new Date('2024-01-01'),
      fiscalYearEnd: new Date('2024-12-31'),
      auditType: 'AUDIT_LEGAL',
    },
  });

  console.log(`Created 2 projects`);

  const now = new Date();

  // Create a document for project 1
  const doc1 = await prisma.document.create({
    data: {
      projectId: project1.id,
      fileName: 'factures_2024.pdf',
      fileType: 'pdf',
      filePath: '/uploads/factures_2024.pdf',
      pageCount: 5,
      status: 'EXTRACTED',
    },
  });

  // Mock transactions for project 1 - 30+ transactions
  const transactions1 = [
    // INVOICES (12)
    { vendorName: 'Maroc Telecom', documentNumber: 'MT-2024-001', date: new Date('2024-01-15'), totalAmount: 2400, taxAmount: 400, taxRate: 20, category: 'Télécom', description: 'Abonnement télécom et Internet Q1 2024', dueDate: new Date('2024-02-15'), status: 'VERIFIED' },
    { vendorName: 'Maroc Telecom', documentNumber: 'MT-2024-002', date: new Date('2024-01-20'), totalAmount: 2400, taxAmount: 400, taxRate: 20, category: 'Télécom', description: 'Facture télécom doublon suspect', dueDate: new Date('2024-02-20'), status: 'EXTRACTED' },
    { vendorName: 'Lydec', documentNumber: 'LYD-2024-001', date: new Date('2024-02-01'), totalAmount: 1800, taxAmount: 300, taxRate: 20, category: 'Électricité/Eau', description: 'Facture électricité et eau janvier', dueDate: new Date('2024-02-28'), status: 'VERIFIED' },
    { vendorName: 'Marjane', documentNumber: 'MAR-2024-001', date: new Date('2024-02-10'), totalAmount: 5600, taxAmount: 933.33, taxRate: 20, category: 'Fournitures', description: 'Fournitures de bureau et consommables', dueDate: new Date('2024-03-10'), status: 'VERIFIED' },
    { vendorName: 'Atlas Assurances', documentNumber: 'AA-2024-001', date: new Date('2024-03-05'), totalAmount: 498, taxAmount: 0, taxRate: 0, category: 'Assurance', description: 'Prime assurance véhicule société', dueDate: new Date('2024-04-05'), status: 'FLAGGED' },
    { vendorName: 'Cabinet Filali Consulting', documentNumber: 'CFC-2024-001', date: new Date('2024-03-15'), totalAmount: 15000, taxAmount: 2500, taxRate: 20, category: 'Consulting', description: 'Prestation conseil juridique et fiscal', dueDate: new Date('2024-04-15'), status: 'VERIFIED' },
    { vendorName: 'Wafasalaf', documentNumber: 'WF-2024-001', date: new Date('2024-04-01'), totalAmount: 8500, taxAmount: 0, taxRate: 0, category: 'Prêt', description: 'Échéance prêt professionnel avril', dueDate: new Date('2024-04-30'), status: 'VERIFIED' },
    { vendorName: 'Transport Express Souss', documentNumber: 'TES-2024-001', date: new Date('2024-04-20'), totalAmount: 3200, taxAmount: 533.33, taxRate: 20, category: 'Transport', description: 'Frais de transport marchandises', dueDate: new Date('2024-05-20'), status: 'EXTRACTED' },
    { vendorName: 'Imprimerie Al Watan', documentNumber: 'IAW-2024-001', date: new Date('2024-05-01'), totalAmount: 2800, taxAmount: 466.67, taxRate: 20, category: 'Impression', description: 'Impression documents commerciaux', dueDate: new Date('2024-06-01'), status: 'VERIFIED' },
    { vendorName: 'École Privée Ibn Rochd', documentNumber: 'EPIR-2024-001', date: new Date('2024-05-10'), totalAmount: 12000, taxAmount: 0, taxRate: 0, category: 'Formation', description: 'Frais de formation inter-entreprises', dueDate: new Date('2024-06-10'), status: 'EXTRACTED' },
    { vendorName: 'Marjane', documentNumber: 'MAR-2024-002', date: new Date('2024-06-01'), totalAmount: 3400, taxAmount: 566.67, taxRate: 20, category: 'Fournitures', description: 'Fournitures bureau juin', dueDate: new Date('2024-07-01'), status: 'EXTRACTED' },
    { vendorName: 'Lydec', documentNumber: 'LYD-2024-002', date: new Date('2024-07-01'), totalAmount: 2100, taxAmount: 350, taxRate: 20, category: 'Électricité/Eau', description: 'Facture électricité Q2 2024', dueDate: new Date('2024-07-31'), status: 'VERIFIED' },
    // RECEIPTS (8)
    { vendorName: 'Pharmacie Centrale', documentNumber: 'PC-2024-001', date: new Date('2024-01-25'), totalAmount: 145, taxAmount: 0, taxRate: 0, category: 'Santé', description: 'Pharmacie - achats courants', status: 'EXTRACTED' },
    { vendorName: 'Cinéma Pathé', documentNumber: 'CP-2024-001', date: new Date('2024-02-15'), totalAmount: 180, taxAmount: 30, taxRate: 20, category: 'Loisir', description: 'Cinéma - Sortie équipe', status: 'FLAGGED' },
    { vendorName: 'Restaurant Le Détroit', documentNumber: 'RLD-2024-001', date: new Date('2024-03-01'), totalAmount: 890, taxAmount: 148.33, taxRate: 20, category: 'Restauration', description: 'Repas d\'affaires clients', status: 'VERIFIED' },
    { vendorName: 'Station Service Afriquia', documentNumber: 'SSA-2024-001', date: new Date('2024-03-20'), totalAmount: 650, taxAmount: 108.33, taxRate: 20, category: 'Transport', description: 'Carburant véhicule société', status: 'VERIFIED' },
    { vendorName: 'Librairie Al Qods', documentNumber: 'LAQ-2024-001', date: new Date('2024-04-15'), totalAmount: 320, taxAmount: 53.33, taxRate: 20, category: 'Fournitures', description: 'Livres et fournitures administratives', status: 'EXTRACTED' },
    { vendorName: 'Café La Renaissance', documentNumber: 'CLR-2024-001', date: new Date('2024-05-05'), totalAmount: 85, taxAmount: 0, taxRate: 0, category: 'Restauration', description: 'Consommation café fournisseurs', status: 'EXTRACTED' },
    { vendorName: 'Boutique Office Plus', documentNumber: 'BOP-2024-001', date: new Date('2024-06-15'), totalAmount: 1200, taxAmount: 200, taxRate: 20, category: 'Fournitures', description: 'Mobilier bureau petit équipement', status: 'VERIFIED' },
    { vendorName: 'Coiffeur La Coupe', documentNumber: 'CLC-2024-001', date: new Date('2024-07-10'), totalAmount: 60, taxAmount: 0, taxRate: 0, category: 'Personnel', description: 'Soins personnels', status: 'FLAGGED' },
    // BANK_STATEMENTS (8+)
    { vendorName: 'CIH Bank', documentNumber: 'CIH-2024-001', date: new Date('2024-01-05'), totalAmount: 12000, taxAmount: null, taxRate: null, category: 'Revenu', description: 'Virement client prestation conseil', status: 'VERIFIED' },
    { vendorName: 'CIH Bank', documentNumber: 'CIH-2024-002', date: new Date('2024-02-03'), totalAmount: 8500, taxAmount: null, taxRate: null, category: 'Revenu', description: 'Virement client mission audit', status: 'VERIFIED' },
    { vendorName: 'CIH Bank', documentNumber: 'CIH-2024-003', date: new Date('2024-02-28'), totalAmount: 3400, taxAmount: null, taxRate: null, category: 'Charge', description: 'Prélèvement Maroc Telecom', status: 'VERIFIED' },
    { vendorName: 'CIH Bank', documentNumber: 'CIH-2024-004', date: new Date('2024-03-15'), totalAmount: 1800, taxAmount: null, taxRate: null, category: 'Charge', description: 'Prélèvement Lydec', status: 'VERIFIED' },
    { vendorName: 'CIH Bank', documentNumber: 'CIH-2024-005', date: new Date('2024-03-15'), totalAmount: 5600, taxAmount: null, taxRate: null, category: 'Charge', description: 'Prélèvement Marjane', status: 'VERIFIED' },
    { vendorName: 'CIH Bank', documentNumber: 'CIH-2024-006', date: new Date('2024-04-01'), totalAmount: 8500, taxAmount: null, taxRate: null, category: 'Charge', description: 'Prélèvement Wafasalaf', status: 'VERIFIED' },
    { vendorName: 'CIH Bank', documentNumber: 'CIH-2024-007', date: new Date('2024-04-10'), totalAmount: 15000, taxAmount: null, taxRate: null, category: 'Revenu', description: 'Virement client facture consulting', status: 'VERIFIED' },
    { vendorName: 'CIH Bank', documentNumber: 'CIH-2024-008', date: new Date('2024-05-06'), totalAmount: 2500, taxAmount: null, taxRate: null, category: 'Charge', description: 'Prélèvement Fournisseur inconnu - non rapproché', status: 'FLAGGED' },
    { vendorName: 'CIH Bank', documentNumber: 'CIH-2024-009', date: new Date('2024-05-20'), totalAmount: 18000, taxAmount: null, taxRate: null, category: 'Revenu', description: 'Virement client annuel audit', status: 'VERIFIED' },
    { vendorName: 'CIH Bank', documentNumber: 'CIH-2024-010', date: new Date('2024-06-15'), totalAmount: 7500, taxAmount: null, taxRate: null, category: 'Revenu', description: 'Virement honoraires expertise', status: 'VERIFIED' },
    { vendorName: 'CIH Bank', documentNumber: 'CIH-2024-011', date: new Date('2024-07-05'), totalAmount: 3200, taxAmount: null, taxRate: null, category: 'Charge', description: 'Prélèvement Transport Express', status: 'EXTRACTED' },
    { vendorName: 'CIH Bank', documentNumber: 'CIH-2024-012', date: new Date('2024-07-06'), totalAmount: 2800, taxAmount: null, taxRate: null, category: 'Charge', description: 'Prélèvement Imprimerie Al Watan', status: 'EXTRACTED' },
  ];

  for (const t of transactions1) {
    await prisma.transaction.create({
      data: {
        projectId: project1.id,
        documentId: doc1.id,
        documentType: t.dueDate ? 'INVOICE' : (t.vendorName === 'CIH Bank' ? 'BANK_STATEMENT' : 'RECEIPT') as DocumentType,
        vendorName: t.vendorName,
        documentNumber: t.documentNumber,
        date: t.date,
        dueDate: t.dueDate || null,
        totalAmount: t.totalAmount,
        taxAmount: t.taxAmount || 0,
        taxRate: t.taxRate || null,
        description: t.description,
        category: t.category,
        status: t.status as any,
      },
    });
  }

  // Also create a weekend transaction (Saturday) for project 1 to trigger Rule 5
  await prisma.transaction.create({
    data: {
      projectId: project1.id,
      documentId: doc1.id,
      documentType: 'INVOICE',
      vendorName: 'Maroc Telecom',
      documentNumber: 'MT-2024-003',
      date: new Date('2024-06-01'), // Saturday 2024-06-01
      dueDate: new Date('2024-07-01'),
      totalAmount: 1200,
      taxAmount: 200,
      taxRate: 20,
      description: 'Facture Telecom - Samedi',
      category: 'Télécom',
      status: 'EXTRACTED',
    },
  });

  // Create a document for project 2
  await prisma.document.create({
    data: {
      projectId: project2.id,
      fileName: 'releves_bancaires_2024.pdf',
      fileType: 'pdf',
      filePath: '/uploads/releves_bancaires_2024.pdf',
      pageCount: 3,
      status: 'UPLOADED',
    },
  });

  // Basic transactions for project 2
  for (let i = 0; i < 5; i++) {
    await prisma.transaction.create({
      data: {
        projectId: project2.id,
        documentType: 'INVOICE',
        vendorName: `Fournisseur ${i + 1}`,
        documentNumber: `F2024-${100 + i}`,
        date: new Date(2024, i, 15),
        totalAmount: (i + 1) * 5000,
        taxAmount: (i + 1) * 833.33,
        taxRate: 20,
        description: `Facture fournisseur ${i + 1}`,
        category: i % 2 === 0 ? 'Achats' : 'Services',
        status: 'EXTRACTED',
      },
    });
  }

  // Create some anomalies on project 1
  const anomalyTransaction1 = await prisma.transaction.findFirst({
    where: { projectId: project1.id, vendorName: 'Maroc Telecom', documentNumber: 'MT-2024-002' },
  });
  if (anomalyTransaction1) {
    await prisma.anomaly.create({
      data: {
        transactionId: anomalyTransaction1.id,
        projectId: project1.id,
        type: 'DUPLICATE_INVOICE',
        severity: 'CRITICAL',
        description: 'Facture en double détectée: Maroc Telecom - MT-2024-002 (2400 MAD)',
        explanation: 'Une facture similaire de Maroc Telecom pour le même montant (2400 MAD) a été trouvée avec un numéro de document différent (MT-2024-001) dans les 90 jours.',
        status: 'OPEN',
      },
    });
  }

  const anomalyTransaction2 = await prisma.transaction.findFirst({
    where: { projectId: project1.id, vendorName: 'Atlas Assurances' },
  });
  if (anomalyTransaction2) {
    await prisma.anomaly.create({
      data: {
        transactionId: anomalyTransaction2.id,
        projectId: project1.id,
        type: 'THRESHOLD_CIRCUMVENTION',
        severity: 'HIGH',
        description: 'Contournement de seuil: 498 MAD (juste en dessous de 500 MAD)',
        explanation: 'Le montant de 498 MAD se situe juste en dessous du seuil de 500 MAD, ce qui peut indiquer une tentative de contournement des contrôles.',
        status: 'OPEN',
      },
    });
  }

  const anomalyTransaction3 = await prisma.transaction.findFirst({
    where: { projectId: project1.id, vendorName: 'Cinéma Pathé' },
  });
  if (anomalyTransaction3) {
    await prisma.anomaly.create({
      data: {
        transactionId: anomalyTransaction3.id,
        projectId: project1.id,
        type: 'PERSONAL_EXPENSE',
        severity: 'HIGH',
        description: 'Dépense personnelle détectée: Cinéma - Sortie équipe',
        explanation: 'La transaction contient des indicateurs de dépense personnelle (motif: cinéma).',
        status: 'OPEN',
      },
    });
  }

  const anomalyTransaction4 = await prisma.transaction.findFirst({
    where: { projectId: project1.id, vendorName: 'CIH Bank', documentNumber: 'CIH-2024-008' },
  });
  if (anomalyTransaction4) {
    await prisma.anomaly.create({
      data: {
        transactionId: anomalyTransaction4.id,
        projectId: project1.id,
        type: 'UNMATCHED_BANK_PAYMENT',
        severity: 'HIGH',
        description: 'Paiement bancaire non rapproché: Fournisseur inconnu - 2500 MAD',
        explanation: 'Un débit bancaire de 2500 MAD n\'a pu être rapproché avec aucune facture ou reçu vérifié.',
        status: 'OPEN',
      },
    });
  }

  const anomalyTransaction5 = await prisma.transaction.findFirst({
    where: { projectId: project1.id, documentNumber: 'MT-2024-003' },
  });
  if (anomalyTransaction5) {
    await prisma.anomaly.create({
      data: {
        transactionId: anomalyTransaction5.id,
        projectId: project1.id,
        type: 'WEEKEND_TRANSACTION',
        severity: 'MEDIUM',
        description: 'Transaction le week-end: 01/06/2024',
        explanation: 'La transaction a été effectuée un samedi, ce qui est inhabituel pour une opération professionnelle.',
        status: 'OPEN',
      },
    });
  }

  // Create notifications
  await prisma.notification.create({
    data: {
      projectId: project1.id,
      type: 'STATUS_CHANGE',
      message: 'Le projet Société Al Qods Distribution a été créé',
      isRead: false,
    },
  });
  await prisma.notification.create({
    data: {
      projectId: project1.id,
      type: 'ANOMALY_DETECTED',
      message: '5 anomalies détectées lors de l\'analyse des transactions',
      isRead: false,
    },
  });
  await prisma.notification.create({
    data: {
      projectId: project2.id,
      type: 'STATUS_CHANGE',
      message: 'Le projet Marjane Holding a été créé',
      isRead: true,
    },
  });

  console.log('Created transactions, anomalies, and notifications');
  console.log('✅ Seed completed successfully!');
  console.log('');
  console.log('Test user credentials:');
  console.log('  Email: mustapha@cabinetlaatig.ma');
  console.log('  Password: Laatig2024!');
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
