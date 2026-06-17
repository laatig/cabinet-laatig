import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';

export function formatCurrency(amount: number): string {
  const parts = Math.abs(amount).toFixed(2).split('.');
  const intPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  const decPart = parts[1];
  const sign = amount < 0 ? '- ' : '';
  return `${sign}${intPart},${decPart} DH`;
}

export function formatDate(dateStr: string): string {
  try {
    const d = parseISO(dateStr);
    return format(d, 'dd/MM/yyyy', { locale: fr });
  } catch {
    return dateStr;
  }
}

export function formatDateTime(dateStr: string): string {
  try {
    const d = parseISO(dateStr);
    return format(d, 'dd/MM/yyyy HH:mm', { locale: fr });
  } catch {
    return dateStr;
  }
}

export function formatNumber(num: number): string {
  const parts = Math.abs(num).toFixed(2).split('.');
  const intPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  const sign = num < 0 ? '- ' : '';
  return `${sign}${intPart},${parts[1]}`;
}

export function formatPercent(num: number): string {
  return `${num.toFixed(1)}%`;
}

export function getRiskLevel(score: number): { class: string; label: string } {
  if (score >= 80) return { class: 'critical', label: 'Critique' };
  if (score >= 60) return { class: 'high', label: 'Élevé' };
  if (score >= 30) return { class: 'medium', label: 'Moyen' };
  return { class: 'low', label: 'Faible' };
}

export function getStatusClass(status: string): string {
  const map: Record<string, string> = {
    pending: 'pending',
    uploaded: 'uploaded',
    processing: 'processing',
    extracted: 'extracted',
    verified: 'verified',
    completed: 'completed',
    flagged: 'flagged',
    anomaly: 'anomaly',
    rejected: 'rejected',
    accepted: 'verified',
    draft: 'pending',
    en_cours: 'processing',
    valide: 'completed',
    signe: 'completed',
  };
  return map[status] || 'pending';
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function classNames(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ');
}
