import { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { t } from '../../lib/translations';
import api from '../../lib/api';
import type { PcmAccount } from '../../types';

interface PcmSelectorProps {
  value: string;
  onChange: (code: string, label: string) => void;
  confidence?: number;
}

export default function PcmSelector({ value, onChange, confidence }: PcmSelectorProps) {
  const { lang } = useLanguage();
  const [query, setQuery] = useState(value || '');
  const [results, setResults] = useState<PcmAccount[]>([]);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (query.length < 1) { setResults([]); return; }
    const timer = setTimeout(() => {
      api.get('/pcm/search', { params: { q: query } })
        .then((res) => setResults(res.data.data || res.data))
        .catch(() => setResults([]));
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div className="pcm-selector" ref={ref}>
      <input
        className="form-input"
        value={query}
        onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        placeholder={t('pcm.placeholder', lang)}
        style={{ paddingRight: confidence != null ? '70px' : '12px', fontSize: 12 }}
      />
      {confidence != null && (
        <span style={{
          position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
          fontSize: 10, color: confidence > 80 ? 'var(--cl-success)' : 'var(--cl-gold)',
          background: 'var(--cl-navy)', padding: '0 4px',
        }}>
          {t('pcm.confidence', lang)}: {confidence}%
        </span>
      )}
      {open && results.length > 0 && (
        <div className="pcm-dropdown">
          {results.map((acc) => (
            <div
              key={acc.code}
              className={`pcm-option ${value === acc.code ? 'active' : ''}`}
              onClick={() => {
                setQuery(`${acc.code} - ${acc.label}`);
                onChange(acc.code, acc.label);
                setOpen(false);
              }}
            >
              <span className="pcm-option-code">{acc.code}</span>
              {acc.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
