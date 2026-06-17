interface RiskBadgeProps {
  score: number;
  label?: string;
}

export default function RiskBadge({ score, label }: RiskBadgeProps) {
  const level =
    score >= 80 ? 'critical' :
    score >= 60 ? 'high' :
    score >= 30 ? 'medium' : 'low';

  const labels: Record<string, string> = {
    critical: 'Critique',
    high: 'Élevé',
    medium: 'Moyen',
    low: 'Faible',
  };

  return (
    <span className={`risk-badge ${level}`}>
      {label || labels[level]}
    </span>
  );
}
