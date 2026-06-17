export interface User {
  id: string;
  email: string;
  fullName: string;
  role: 'CLIENT' | 'OWNER';
  firmName?: string;
  title?: string;
  phoneNumber?: string;
  emailVerified: boolean;
  raisonSociale?: string;
  clientICE?: string;
  clientRC?: string;
  formeJuridique?: string;
  createdAt: string;
}

export interface Project {
  id: string;
  userId: string;
  clientName: string;
  clientAddress?: string;
  clientICE?: string;
  clientRC?: string;
  clientTP?: string;
  fiscalYearStart: string;
  fiscalYearEnd: string;
  auditType: string;
  status: ProjectStatus;
  dossierStatus: DossierStatus;
  createdAt: string;
  updatedAt: string;
  _count?: {
    documents: number;
    transactions: number;
    anomalies: number;
    notifications?: number;
  };
  user?: { id: string; email: string; fullName: string; raisonSociale?: string };
}

export type ProjectStatus = 'IN_PROGRESS' | 'REVIEW' | 'COMPLETED';
export type DossierStatus =
  | 'DOCUMENTS_RECEIVED'
  | 'EXTRACTION_IN_PROGRESS'
  | 'AI_ANALYSIS'
  | 'IN_REVIEW'
  | 'AWAITING_CLIENT_CORRECTION'
  | 'VALIDATED'
  | 'SIGNED';

export type FinancialDocumentCategory =
  | 'BILAN' | 'CPC' | 'BALANCE' | 'ESG'
  | 'TABLEAU_FINANCEMENT' | 'ETIC' | 'PIECE_JUSTIFICATIVE';

export interface Document {
  id: string;
  projectId: string;
  fileName: string;
  fileType: string;
  filePath: string;
  pageCount: number;
  category: FinancialDocumentCategory;
  fiscalYear?: number;
  version: number;
  status: DocumentStatus;
  createdAt: string;
  updatedAt: string;
  _count?: { transactions: number };
  extractions?: Extraction[];
}

export type DocumentStatus = 'UPLOADED' | 'PROCESSING' | 'EXTRACTED' | 'AWAITING_REVIEW' | 'REVIEWED' | 'FAILED';

export interface Extraction {
  id: string;
  documentId: string;
  status: string;
  confidence: number;
  modelUsed: string;
  processedAt: string;
  reviewedAt?: string;
  reviewerNotes?: string;
  fields: ExtractionField[];
}

export interface ExtractionField {
  id: string;
  extractionId: string;
  fieldName: string;
  fieldValue: string;
  fieldType: string;
  confidence: number;
  originalValue?: string;
  correctedValue?: string;
  isCorrected: boolean;
  section?: string;
}

export interface Signature {
  id: string;
  userId: string;
  projectId: string;
  signatureData: string;
  fullName: string;
  title: string;
  signedAt: string;
}

export interface Transaction {
  id: string;
  projectId: string;
  documentId?: string;
  pcmAccountId?: string;
  pcmAccount?: PcmAccount;
  documentType: string;
  vendorName?: string;
  documentNumber?: string;
  date?: string;
  dueDate?: string;
  totalAmount: number;
  currency: string;
  taxAmount?: number;
  description?: string;
  category?: string;
  riskScore: number;
  status: string;
  notes?: string;
  createdAt: string;
}

export interface Anomaly {
  id: string;
  transactionId: string;
  projectId: string;
  type: string;
  severity: string;
  description: string;
  explanation?: string;
  status: string;
  createdAt: string;
  transaction?: Transaction;
}

export interface PcmAccount {
  id: string;
  accountNumber: string;
  accountName: string;
  classNumber: number;
  className: string;
  isActive: boolean;
}

export interface Notification {
  id: string;
  projectId: string;
  userId?: string;
  type: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  project?: { clientName: string };
}

export interface AuditLog {
  id: string;
  userId?: string;
  user?: { fullName: string; email: string };
  projectId?: string;
  action: string;
  details?: any;
  ipAddress?: string;
  timestamp: string;
}

export interface Report {
  id: string;
  projectId: string;
  reportType: string;
  filePath: string;
  generatedAt: string;
}

export interface DashboardStats {
  totalClients: number;
  totalProjects: number;
  pendingReviews: number;
  signedProjects: number;
}
