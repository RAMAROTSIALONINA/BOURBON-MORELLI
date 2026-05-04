import { useEffect } from 'react';
import useNotificationStore from '../../services/notificationService';
import contactService from '../../services/contactService';

const LAST_SEEN_KEY = 'admin_contact_last_seen_id';
const POLL_INTERVAL = 15000; // 15 s

/**
 * Poller global : interroge l'API de contact toutes les 15 s
 * et déclenche une notification pour chaque nouveau message.
 * Monté dans AdminLayout — actif sur toutes les pages admin.
 */
const ContactNotifier = () => {
  const addNotification = useNotificationStore((s) => s.addNotification);

  useEffect(() => {
    let active = true;

    const getLastSeen = () => {
      const v = parseInt(localStorage.getItem(LAST_SEEN_KEY) || '0', 10);
      return Number.isFinite(v) ? v : 0;
    };
    const setLastSeen = (id) => localStorage.setItem(LAST_SEEN_KEY, String(id));

    const poll = async () => {
      // Pas de polling si pas de token admin
      if (!localStorage.getItem('adminToken')) return;

      try {
        const { messages = [] } = await contactService.listMessages({
          page: 1,
          limit: 50,
          status: 'new'
        });
        if (!active || messages.length === 0) return;

        const lastSeen = getLastSeen();
        const fresh = messages
          .filter((m) => m.id > lastSeen)
          .sort((a, b) => a.id - b.id);

        if (fresh.length === 0) return;

        for (const m of fresh) {
          addNotification({
            type: 'info',
            category: 'Contact',
            title: 'Nouveau message de contact',
            message: `${m.name} — ${m.subject}`,
            link: '/admin/contact'
          });
        }

        const maxId = Math.max(...fresh.map((m) => m.id));
        setLastSeen(maxId);
      } catch (err) {
        // Silencieux (401, 429, pas connecté, etc.) — on retente au prochain tick.
      }
    };

    poll();
    const intervalId = setInterval(poll, POLL_INTERVAL);

    return () => {
      active = false;
      clearInterval(intervalId);
    };
  }, [addNotification]);

  return null;
};

export default ContactNotifier;
