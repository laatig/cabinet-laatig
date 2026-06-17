import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { formatNumber } from '../lib/utils';
import api from '../lib/api';
import { Download, ArrowLeft, FileText, Printer } from 'lucide-react';
import type { LiasseSection } from '../types';

const sectionIcons: Record<string, string> = {
  IDENTIFICATION: ' ID',
  'CAHIER DE GESTION': 'CG',
  'DÉCLARATION IR / IS': 'IR',
  'DÉCLARATION CNSS': 'CN',
  'RATIOS DE GESTION': 'RG',
};

const sectionGradients: Record<string, string> = {
  IDENTIFICATION: 'linear-gradient(135deg, #1a5276, #2980b9)',
  'CAHIER DE GESTION': 'linear-gradient(135deg, #1e8449, #27ae60)',
  'DÉCLARATION IR / IS': 'linear-gradient(135deg, #b7950b, #f39c12)',
  'DÉCLARATION CNSS': 'linear-gradient(135deg, #c0392b, #e74c3c)',
  'RATIOS DE GESTION': 'linear-gradient(135deg, #6c3483, #8e44ad)',
};

export default function LiasseFiscalePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [sections, setSections] = useState<LiasseSection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/projects/${id}/liasse-fiscale`)
      .then((r) => setSections(r.data.data || r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  const formatValue = (item: LiasseSection['items'][0]) => {
    if (item.format === 'number' || typeof item.valeur === 'number') {
      return `${formatNumber(Number(item.valeur))} DH`;
    }
    return String(item.valeur);
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-header-row">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate(-1)}>
              <ArrowLeft size={16} />
            </button>
            <div>
              <div className="page-title">Liasse Fiscale</div>
              <div className="page-gold-rule" />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-outline">
              <Printer size={16} /> Imprimer
            </button>
            <button className="btn btn-primary">
              <Download size={16} /> Télécharger (PDF)
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: 40, textAlign: 'center' }}>
          <div className="gold-spinner" />
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {sections.map((section) => (
            <div key={section.section} className="panel" style={{ border: 'none', overflow: 'hidden' }}>
              <div
                className="panel-header"
                style={{
                  background: sectionGradients[section.section] || 'var(--cl-primary)',
                  color: '#fff',
                  padding: '14px 20px',
                }}
              >
                <span className="panel-title" style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#fff' }}>
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    width: 32, height: 32, borderRadius: 6, background: 'rgba(255,255,255,0.2)',
                    fontWeight: 700, fontSize: 12,
                  }}>
                    {sectionIcons[section.section] || <FileText size={16} />}
                  </span>
                  {section.section}
                </span>
              </div>
              <div className="panel-body" style={{ padding: 0 }}>
                {section.items.map((item, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex', justifyContent: 'space-between',
                      padding: '10px 20px',
                      borderBottom: idx < section.items.length - 1 ? '1px solid var(--border-color)' : 'none',
                      background: idx % 2 === 0 ? 'var(--bg-secondary)' : 'transparent',
                    }}
                  >
                    <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                      {item.label}
                    </span>
                    <span style={{
                      fontSize: 14, fontWeight: 600,
                      color: typeof item.valeur === 'number' && item.valeur < 0 ? '#e74c3c' : 'var(--text-primary)',
                    }}>
                      {formatValue(item)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}