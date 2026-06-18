import { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { t } from '../lib/translations';
import { formatDateTime } from '../lib/utils';
import api from '../lib/api';
import { Bell, CheckCheck } from 'lucide-react';
import type { Notification } from '../types';

export default function NotificationsPage() {
  const { lang } = useLanguage();
  const [notifs, setNotifs] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/notifications')
      .then((r) => setNotifs(r.data.notifications || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const markAllRead = async () => {
    try {
      await api.post('/notifications/mark-read');
      setNotifs((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch { /* ignore */ }
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-header-row">
          <div>
            <div className="page-title">{t('notif.title', lang)}</div>
            <div className="page-gold-rule" />
          </div>
          <button className="btn btn-outline btn-sm" onClick={markAllRead}>
            <CheckCheck size={16} /> {t('notif.markAllRead', lang)}
          </button>
        </div>
      </div>

      <div className="panel">
        <div className="panel-body" style={{ padding: 0 }}>
          {loading ? (
            <div style={{ padding: 40, textAlign: 'center' }}><div className="gold-spinner" /></div>
          ) : notifs.length === 0 ? (
            <div className="empty-state">
              <Bell size={48} />
              <div className="empty-state-title">{t('notif.empty', lang)}</div>
            </div>
          ) : (
            notifs.map((n) => (
              <div key={n.id} className={`notif-dropdown-item ${!n.isRead ? 'unread' : ''}`} style={{ padding: '14px 20px' }}>
                <div style={{ flex: 1 }}>
                  <div className="notif-item-title">{n.type}</div>
                  <div className="notif-item-desc">{n.message}</div>
                  <div className="notif-item-time">{formatDateTime(n.createdAt)}</div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
