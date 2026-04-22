import { create } from 'zustand';

// Clés localStorage
const NOTIF_STORAGE_KEY = 'admin_notifications';
const HISTORY_STORAGE_KEY = 'admin_activity_history';
const MAX_NOTIFICATIONS = 50;
const MAX_HISTORY = 500;

// Helpers localStorage
const loadFromStorage = (key, fallback = []) => {
  try {
    const data = JSON.parse(localStorage.getItem(key) || 'null');
    return Array.isArray(data) ? data : fallback;
  } catch (e) {
    return fallback;
  }
};

const saveToStorage = (key, data) => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.error('Erreur sauvegarde:', e);
  }
};

const initialNotifs = loadFromStorage(NOTIF_STORAGE_KEY, []);
const initialHistory = loadFromStorage(HISTORY_STORAGE_KEY, []);

// Service global de notifications + historique d'activité
const useNotificationStore = create((set, get) => ({
  notifications: initialNotifs,
  unreadCount: initialNotifs.filter(n => !n.read).length,
  history: initialHistory,

  // Ajouter une notification (persistée)
  addNotification: (notification) => {
    const id = Date.now() + Math.random();
    const newNotification = {
      id,
      read: false,
      timestamp: new Date().toISOString(),
      time: new Date().toLocaleString('fr-FR'),
      ...notification
    };

    set((state) => {
      const updated = [...state.notifications, newNotification].slice(-MAX_NOTIFICATIONS);
      saveToStorage(NOTIF_STORAGE_KEY, updated);
      return {
        notifications: updated,
        unreadCount: updated.filter(n => !n.read).length
      };
    });

    // Également ajouter à l'historique d'activité
    get().addActivity({
      type: notification.type || 'notification',
      title: notification.title,
      message: notification.message,
      link: notification.link,
      category: notification.category || 'Notification'
    });
  },

  // Ajouter une activité à l'historique (tracking général)
  addActivity: (activity) => {
    const entry = {
      id: Date.now() + Math.random(),
      timestamp: new Date().toISOString(),
      time: new Date().toLocaleString('fr-FR'),
      ...activity
    };
    set((state) => {
      const updated = [...state.history, entry].slice(-MAX_HISTORY);
      saveToStorage(HISTORY_STORAGE_KEY, updated);
      return { history: updated };
    });
  },

  // Marquer une notification comme lue
  markAsRead: (notificationId) => {
    set((state) => {
      const updated = state.notifications.map(n =>
        n.id === notificationId ? { ...n, read: true } : n
      );
      saveToStorage(NOTIF_STORAGE_KEY, updated);
      return {
        notifications: updated,
        unreadCount: updated.filter(n => !n.read).length
      };
    });
  },

  // Marquer toutes comme lues
  markAllAsRead: () => {
    set((state) => {
      const updated = state.notifications.map(n => ({ ...n, read: true }));
      saveToStorage(NOTIF_STORAGE_KEY, updated);
      return { notifications: updated, unreadCount: 0 };
    });
  },

  // Supprimer une notification
  removeNotification: (notificationId) => {
    set((state) => {
      const updated = state.notifications.filter(n => n.id !== notificationId);
      saveToStorage(NOTIF_STORAGE_KEY, updated);
      return {
        notifications: updated,
        unreadCount: updated.filter(n => !n.read).length
      };
    });
  },

  // Vider toutes les notifications
  clearNotifications: () => {
    saveToStorage(NOTIF_STORAGE_KEY, []);
    set({ notifications: [], unreadCount: 0 });
  },

  // Vider l'historique d'activité
  clearHistory: () => {
    saveToStorage(HISTORY_STORAGE_KEY, []);
    set({ history: [] });
  }
}));

export default useNotificationStore;
