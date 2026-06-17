import { useState } from 'react';
import Modal from '../ui/Modal';
import { useLanguage } from '../../contexts/LanguageContext';
import { t } from '../../lib/translations';

interface CsvMappingModalProps {
  open: boolean;
  onClose: () => void;
  columns: string[];
  onConfirm: (mapping: Record<string, string>) => void;
}

const TARGET_FIELDS = [
  { key: 'date', label: 'Date' },
  { key: 'documentNumber', label: 'N° Document' },
  { key: 'vendorName', label: 'Fournisseur' },
  { key: 'description', label: 'Description' },
  { key: 'amount', label: 'Montant' },
  { key: 'category', label: 'Catégorie' },
];

export default function CsvMappingModal({ open, onClose, columns, onConfirm }: CsvMappingModalProps) {
  const { lang } = useLanguage();
  const [mapping, setMapping] = useState<Record<string, string>>({});

  const handleConfirm = () => {
    onConfirm(mapping);
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t('upload.mapColumns', lang)}
      footer={
        <>
          <button className="btn btn-ghost" onClick={onClose}>{t('common.cancel', lang)}</button>
          <button className="btn btn-primary" onClick={handleConfirm}>{t('common.confirm', lang)}</button>
        </>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {TARGET_FIELDS.map((field) => (
          <div key={field.key} className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">{field.label}</label>
            <select
              className="form-input form-select"
              value={mapping[field.key] || ''}
              onChange={(e) => setMapping((prev) => ({ ...prev, [field.key]: e.target.value }))}
            >
              <option value="">— {t('common.filter', lang)} —</option>
              {columns.map((col) => (
                <option key={col} value={col}>{col}</option>
              ))}
            </select>
          </div>
        ))}
      </div>
    </Modal>
  );
}
