export interface User {
  id: number;
  email: string;
  name: string;
  role: string;
  createdAt: string;
}

export interface Client {
  id: number;
  name: string;
  ice: string;
  rc: string;
  tp: string;
  cnss: string;
  address: string;
  city: string;
  phone: string;
  email: string;
  fiscalYearEnd: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface Project {
  id: number;
  clientId: number;
  client: Client;
  fiscalYear: string;
  auditType: string;
  status: string;
  dossierStatus: string;
  assignedTo: number;
  assignedUser: User;
  notes: string;
  createdAt: string;
  updatedAt: string;
  documentCount?: number;
  transactionCount?: number;
  anomalyCount?: number;
}

export interface Document {
  id: number;
  projectId: number;
  originalName: string;
  storagePath: string;
  mimeType: string;
  fileSize: number;
  status: string;
  processingProgress: number;
  extractedData: string;
  errorMessage: string;
  createdAt: string;
  updatedAt: string;
}

export interface Transaction {
  id: number;
  projectId: number;
  documentId: number;
  date: string;
  documentNumber: string;
  vendorName: string;
  description: string;
  amount: number;
  category: string;
  pcmAccountCode: string;
  pcmAccountLabel: string;
  pcmConfidence: number;
  riskScore: number;
  status: string;
  flagReason: string;
  verifiedAt: string;
  verifiedBy: number;
  createdAt: string;
}

export interface Anomaly {
  id: number;
  projectId: number;
  transactionId: number;
  transaction: Transaction;
  type: string;
  severity: string;
  description: string;
  status: string;
  resolution: string;
  detectedAt: string;
  resolvedAt: string;
  resolvedBy: number;
}

export interface AuditLog {
  id: number;
  userId: number;
  user: User;
  projectId: number;
  action: string;
  details: string;
  entityType: string;
  entityId: number;
  ipAddress: string;
  createdAt: string;
}

export interface Notification {
  id: number;
  userId: number;
  title: string;
  message: string;
  type: string;
  read: boolean;
  createdAt: string;
}

export interface BilanEntry {
  code: string;
  label: string;
  brut: number;
  amort: number;
  net: number;
  type: 'actif' | 'passif';
  level: number;
  isTotal: boolean;
  isSubtotal: boolean;
}

export interface CpcEntry {
  code: string;
  label: string;
  montant: number;
  type: 'produits' | 'charges';
  level: number;
  isTotal: boolean;
  isSubtotal: boolean;
}

export interface BalanceEntry {
  code: string;
  label: string;
  classe: string;
  debit: number;
  credit: number;
  soldeDebit: number;
  soldeCredit: number;
}

export interface JournalEntry {
  date: string;
  numero: string;
  libelle: string;
  compte: string;
  debit: number;
  credit: number;
}

export interface GrandLivreEntry {
  compte: string;
  label: string;
  date: string;
  libelle: string;
  debit: number;
  credit: number;
  solde: number;
}

export interface TvaDeclaration {
  period: string;
  year: string;
  collectee: TvaSection;
  deductible: TvaSection;
  netDue: number;
  generatedAt: string;
}

export interface TvaSection {
  label: string;
  rows: TvaRow[];
  total: number;
}

export interface TvaRow {
  label: string;
  base: number;
  taux: number;
  montant: number;
}

export type ReportType =
  | 'bilan'
  | 'cpc'
  | 'journal'
  | 'grand-livre'
  | 'balance'
  | 'tva'
  | 'audit-report'
  | 'synthese'
  | 'cahier-travail';

export interface ReportStatus {
  type: ReportType;
  label: string;
  status: 'pending' | 'generating' | 'ready' | 'error';
  generatedAt?: string;
}

export interface PcmAccount {
  code: string;
  label: string;
  classe: string;
  nature: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  perPage: number;
}

export interface ApiError {
  message: string;
  statusCode: number;
}
