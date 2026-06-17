import type { ReactNode } from 'react';

interface KpiCardProps {
  label: string;
  value: string;
  sub?: string;
  icon?: ReactNode;
}

export default function KpiCard({ label, value, sub, icon }: KpiCardProps) {
  return (
    <div className="kpi-card">
      <div className="kpi-card-header">
        <span className="kpi-label">{label}</span>
        {icon && <div className="kpi-icon">{icon}</div>}
      </div>
      <div className="kpi-value">{value}</div>
      {sub && <div className="kpi-sub">{sub}</div>}
    </div>
  );
}
