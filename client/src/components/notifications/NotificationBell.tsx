import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { t } from '../../lib/translations';
import { formatDateTime } from '../../lib/utils';
import api from '../../lib/api';
import type { Notification } from '../../types';

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifs, setNotifs] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { lang } = useLanguage();

  useEffect(() => {
    api.get('/notifications', { params: { limit: 10 } })
      .then((res) => {
        setNotifs(res.data.notifications || []);
        setUnreadCount(res.data.unreadCount || 0);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const markAllRead = async () => {
    try {
      await api.post('/notifications/mark-read');
      setNotifs((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch { /* ignore */ }
  };

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button className="notif-btn" onClick={() => setOpen((o) => !o)}>
        <Bell size={20} />
        {unreadCount > 0 && <span className="notif-count">{unreadCount > 9 ? '9+' : unreadCount}</span>}
      </button>
      {open && (
        <div className="notif-dropdown" style={{ position: 'absolute', top: 'calc(100% + 8px)', right: 0, zIndex: 200 }}>
          <div className="notif-dropdown-header">
            <span className="notif-dropdown-title">{t('notif.title', lang)}</span>
            {unreadCount > 0 && (
              <button className="btn btn-ghost btn-sm" onClick={markAllRead}>
                {t('notif.markAllRead', lang)}
              </button>
            )}
          </div>
          {notifs.length === 0 ? (
            <div style={{ padding: '24px', textAlign: 'center', fontSize: 13, color: 'var(--cl-text-muted)' }}>
              {t('notif.empty', lang)}
            </div>
          ) : (
            <>
              {notifs.map((n) => (
                <div key={n.id} className={`notif-dropdown-item ${!n.isRead ? 'unread' : ''}`}>
                  <div style={{ flex: 1 }}>
                    <div className="notif-item-title">{n.type}</div>
                    <div className="notif-item-desc">{n.message}</div>
                    <div className="notif-item-time">{formatDateTime(n.createdAt)}</div>
                  </div>
                </div>
              ))}
              <div style={{ padding: '10px 16px', textAlign: 'center', borderTop: '1px solid rgba(201,168,76,0.06)' }}>
                <button className="btn btn-ghost btn-sm" onClick={() => { setOpen(false); navigate('/notifications'); }}>
                  {t('notif.viewAll', lang)}
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
