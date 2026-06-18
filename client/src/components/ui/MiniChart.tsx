interface MiniChartProps {
  data: { label: string; value: number; color?: string }[];
  height?: number;
}

export default function MiniChart({ data, height = 160 }: MiniChartProps) {
  const max = Math.max(...data.map(d => Math.abs(d.value)), 1);

  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height, padding: '8px 0' }}>
      {data.map((d, i) => {
        const barHeight = (Math.abs(d.value) / max) * (height - 20);
        return (
          <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
            <div
              title={`${d.label}: ${d.value}`}
              style={{
                width: '100%',
                height: Math.max(barHeight, 2),
                background: d.color || 'var(--cl-gold)',
                borderRadius: '3px 3px 0 0',
                opacity: 0.8,
                transition: 'height 0.3s ease',
                minHeight: 2,
              }}
            />
            <span style={{ fontSize: 10, color: 'var(--cl-text-muted)', marginTop: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%' }}>
              {d.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
