import { useState, useRef, type DragEvent } from 'react';
import { Upload, File, X } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { t } from '../../lib/translations';
import api from '../../lib/api';

interface UploadZoneProps {
  projectId: string;
  onUploadComplete: () => void;
}

const ACCEPTED = '.pdf,.csv,.xlsx';

export default function UploadZone({ projectId, onUploadComplete }: UploadZoneProps) {
  const { lang } = useLanguage();
  const [dragActive, setDragActive] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<Record<string, number>>({});
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
    else if (e.type === 'dragleave') setDragActive(false);
  };

  const addFiles = (fileList: FileList) => {
    const newFiles = Array.from(fileList).filter((f) =>
      ['.pdf', '.csv', '.xlsx'].some((ext) => f.name.toLowerCase().endsWith(ext))
    );
    setFiles((prev) => [...prev, ...newFiles]);
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files) addFiles(e.dataTransfer.files);
  };

  const removeFile = (idx: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  const uploadFiles = async () => {
    setUploading(true);
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const formData = new FormData();
      formData.append('file', file);
      try {
        await api.post(`/projects/${projectId}/documents`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
          onUploadProgress: (progressEvent) => {
            const total = progressEvent.total ?? 1;
            setProgress((prev) => ({ ...prev, [file.name]: Math.round((progressEvent.loaded * 100) / total) }));
          },
        });
        setProgress((prev) => ({ ...prev, [file.name]: 100 }));
      } catch { /* ignore */ }
    }
    onUploadComplete();
    setTimeout(() => {
      setFiles([]);
      setProgress({});
      setUploading(false);
    }, 1000);
  };

  return (
    <div>
      <div
        className={`upload-zone ${dragActive ? 'drag-active' : ''}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
      >
        <Upload size={40} />
        <div className="upload-zone-title">{t('upload.title', lang)}</div>
        <div className="upload-zone-desc">
          {t('upload.drag', lang)} {t('upload.or', lang)} <strong>{t('upload.browse', lang)}</strong>
        </div>
        <div className="upload-zone-types">{t('upload.accepted', lang)}</div>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={ACCEPTED}
          style={{ display: 'none' }}
          onChange={(e) => e.target.files && addFiles(e.target.files)}
        />
      </div>

      {files.length > 0 && (
        <div style={{ marginTop: 16 }}>
          {files.map((file, idx) => (
            <div key={idx} style={{
              display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px',
              background: 'var(--cl-navy)', borderRadius: 'var(--radius-sm)',
              border: '1px solid rgba(201,168,76,0.06)', marginBottom: 6,
            }}>
              <File size={18} style={{ color: 'var(--cl-gold)', flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, color: 'var(--cl-text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {file.name}
                </div>
                <div style={{ fontSize: 11, color: 'var(--cl-text-muted)' }}>
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </div>
                {progress[file.name] != null && (
                  <div className="progress-bar" style={{ margin: '6px 0 0' }}>
                    <div className="progress-bar-fill" style={{ width: `${progress[file.name]}%` }} />
                  </div>
                )}
              </div>
              {!uploading && (
                <button className="btn btn-ghost btn-sm" onClick={() => removeFile(idx)}>
                  <X size={16} />
                </button>
              )}
            </div>
          ))}
          {!uploading && (
            <div style={{ marginTop: 12 }}>
              <button className="btn btn-primary" onClick={uploadFiles}>
                {t('upload.progress', lang)} ({files.length})
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
