import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { t } from '../lib/translations';
import api from '../lib/api';
import { ClipboardList, ChevronRight } from 'lucide-react';

const PCM_CLASSES = [
  { code: '1', label: 'Classe 1 — Comptes de Financement Permanent' },
  { code: '2', label: 'Classe 2 — Comptes d\'Actif Immobilisé' },
  { code: '3', label: 'Classe 3 — Comptes de Stock' },
  { code: '4', label: 'Classe 4 — Comptes de Tiers' },
  { code: '5', label: 'Classe 5 — Comptes de Trésorerie' },
];

export default function CahierTravailPage() {
  const { id } = useParams();
  const { lang } = useLanguage();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div>
      <div className="page-header">
        <div className="page-title">{t('cahier.title', lang)}</div>
        <div className="page-gold-rule" />
      </div>

      {loading ? (
        <div style={{ padding: 40, textAlign: 'center' }}><div className="gold-spinner" /></div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {PCM_CLASSES.map((cls) => (
            <div key={cls.code} className="project-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 'var(--radius-sm)',
                  background: 'rgba(201,168,76,0.06)', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', color: 'var(--cl-gold)', fontWeight: 700,
                  fontFamily: "'Cormorant Garamond', serif", fontSize: 16,
                }}>
                  {cls.code}
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--cl-text-primary)' }}>{cls.label}</div>
                </div>
              </div>
              <ChevronRight size={18} style={{ color: 'var(--cl-text-muted)' }} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
