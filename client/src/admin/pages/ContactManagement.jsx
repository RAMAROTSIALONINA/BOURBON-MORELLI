import React, { useEffect, useState, useCallback } from 'react';
import {
  Mail, Search, Trash2, Eye, X, Reply, Archive, Inbox,
  CheckCircle, Clock, AlertCircle, Send, User, RefreshCw, Loader2
} from 'lucide-react';
import axios from 'axios';
import contactService from '../../services/contactService';
import useNotificationStore from '../../services/notificationService';

const BACKEND_URL = 'http://localhost:5003';

const STATUS_CONFIG = {
  new:      { label: 'Nouveau',  color: 'bg-blue-100 text-blue-700 border-blue-200',     icon: AlertCircle },
  read:     { label: 'Lu',       color: 'bg-neutral-100 text-neutral-700 border-neutral-200', icon: Eye },
  replied:  { label: 'Répondu',  color: 'bg-green-100 text-green-700 border-green-200',  icon: CheckCircle },
  archived: { label: 'Archivé',  color: 'bg-gray-100 text-gray-700 border-gray-200',  icon: Archive }
};

const SUBJECT_LABELS = {
  order: 'Question sur une commande',
  product: 'Information sur un produit',
  return: 'Retour ou échange',
  partnership: 'Partenariat',
  other: 'Autre'
};

const formatDate = (iso) => {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

const StatCard = ({ label, value, icon: Icon, color }) => (
  <div className="bg-white rounded-xl border border-neutral-200 p-5 flex items-center gap-4">
    <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${color}`}>
      <Icon className="w-6 h-6" />
    </div>
    <div>
      <div className="text-2xl font-bold text-neutral-900">{value ?? 0}</div>
      <div className="text-sm text-neutral-500">{label}</div>
    </div>
  </div>
);

const ContactManagement = () => {
  const addNotification = useNotificationStore((s) => s.addNotification);
  const [messages, setMessages] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, total_pages: 1 });
  const [selected, setSelected] = useState(null);
  const [notesDraft, setNotesDraft] = useState('');
  const [replyModal, setReplyModal] = useState(null); // message object or null
  const [replyText, setReplyText] = useState('');
  const [replySending, setReplySending] = useState(false);
  const [replyError, setReplyError] = useState('');

  const fetchStats = useCallback(async () => {
    try {
      const { stats } = await contactService.getStats();
      setStats(stats || {});
    } catch (e) { console.error(e); }
  }, []);

  const fetchMessages = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = { page, limit: 20 };
      if (search.trim()) params.search = search.trim();
      if (statusFilter !== 'all') params.status = statusFilter;
      const { messages: incoming, pagination } = await contactService.listMessages(params);
      setMessages((prev) => {
        // Détecter les nouveaux IDs apparus entre deux refresh (status = new uniquement)
        const prevIds = new Set(prev.map((m) => m.id));
        const freshNew = (incoming || []).filter((m) => m.status === 'new' && !prevIds.has(m.id));
        if (prev.length > 0 && freshNew.length > 0) {
          freshNew.forEach((m) => {
            addNotification({
              type: 'info',
              category: 'Contact',
              title: 'Nouveau message de contact',
              message: `${m.name} — ${m.subject}`,
              link: '/admin/contact'
            });
          });
        }
        return incoming || [];
      });
      setPagination(pagination || { total: 0, total_pages: 1 });
    } catch (e) {
      setError(e.response?.data?.message || 'Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter, addNotification]);

  useEffect(() => { fetchMessages(); fetchStats(); }, [fetchMessages, fetchStats]);

  // Auto-refresh toutes les 30 secondes
  useEffect(() => {
    const id = setInterval(() => { fetchMessages(); fetchStats(); }, 30000);
    return () => clearInterval(id);
  }, [fetchMessages, fetchStats]);

  const handleRefresh = () => { fetchMessages(); fetchStats(); };

  const openMessage = async (id) => {
    try {
      const { message } = await contactService.getMessage(id);
      setSelected(message);
      setNotesDraft(message.admin_notes || '');
      fetchMessages();
      fetchStats();
    } catch (e) {
      setError(e.response?.data?.message || 'Impossible de charger le message');
    }
  };

  const updateStatus = async (id, status) => {
    try {
      await contactService.updateMessage(id, { status });
      if (selected?.id === id) setSelected({ ...selected, status });
      fetchMessages();
      fetchStats();
    } catch (e) {
      setError(e.response?.data?.message || 'Impossible de modifier le statut');
    }
  };

  const saveNotes = async () => {
    if (!selected) return;
    try {
      await contactService.updateMessage(selected.id, { admin_notes: notesDraft });
      setSelected({ ...selected, admin_notes: notesDraft });
    } catch (e) {
      setError(e.response?.data?.message || 'Impossible de sauvegarder les notes');
    }
  };

  const deleteMessage = async (id) => {
    if (!window.confirm('Supprimer définitivement ce message ?')) return;
    try {
      await contactService.deleteMessage(id);
      if (selected?.id === id) setSelected(null);
      fetchMessages();
      fetchStats();
    } catch (e) {
      setError(e.response?.data?.message || 'Impossible de supprimer');
    }
  };

  const openReplyModal = (msg) => {
    setReplyModal(msg);
    setReplyText('');
    setReplyError('');
  };

  const sendReply = async () => {
    if (!replyModal || !replyText.trim()) return;
    setReplySending(true);
    setReplyError('');
    try {
      const token = localStorage.getItem('adminToken') || localStorage.getItem('token');
      await axios.post(
        `${BACKEND_URL}/api/contact/admin/${replyModal.id}/reply`,
        { replyText: replyText.trim() },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (selected?.id === replyModal.id) setSelected({ ...selected, status: 'replied' });
      setReplyModal(null);
      addNotification({ type: 'success', title: 'Réponse envoyée', message: `Email envoyé à ${replyModal.email}` });
      fetchMessages();
      fetchStats();
    } catch (err) {
      setReplyError(err.response?.data?.message || 'Impossible d\'envoyer la réponse');
    } finally {
      setReplySending(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total messages" value={stats.total} icon={Inbox} color="bg-neutral-100 text-neutral-700" />
        <StatCard label="Nouveaux" value={stats.new_count} icon={AlertCircle} color="bg-blue-100 text-blue-700" />
        <StatCard label="Répondus" value={stats.replied_count} icon={CheckCircle} color="bg-green-100 text-green-700" />
        <StatCard label="Aujourd'hui" value={stats.today_count} icon={Clock} color="bg-gray-100 text-gray-700" />
      </div>

      {/* Filtres */}
      <div className="bg-white rounded-xl border border-neutral-200 p-4 flex flex-col md:flex-row gap-3 md:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <input
            type="text"
            placeholder="Rechercher (nom, email, sujet, message)"
            value={search}
            onChange={(e) => { setPage(1); setSearch(e.target.value); }}
            className="w-full pl-9 pr-3 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:border-primary-500"
          />
        </div>
        <div className="flex gap-2 flex-wrap items-center">
          {['all', 'new', 'read', 'replied', 'archived'].map(s => (
            <button
              key={s}
              onClick={() => { setPage(1); setStatusFilter(s); }}
              className={`px-3 py-2 text-sm rounded-lg border transition ${
                statusFilter === s
                  ? 'bg-primary-600 text-white border-primary-600'
                  : 'bg-white text-neutral-700 border-neutral-200 hover:bg-neutral-50'
              }`}
            >
              {s === 'all' ? 'Tous' : STATUS_CONFIG[s].label}
            </button>
          ))}
          <button
            onClick={handleRefresh}
            disabled={loading}
            title="Actualiser"
            className="px-3 py-2 text-sm rounded-lg border border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50 inline-flex items-center gap-1 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Actualiser
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm">{error}</div>
      )}

      {/* Tableau */}
      <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-neutral-50 border-b border-neutral-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">Statut</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">Expéditeur</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">Sujet</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">Aperçu</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">Date</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-neutral-600 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {loading ? (
                <tr><td colSpan="6" className="px-4 py-12 text-center text-neutral-500">Chargement…</td></tr>
              ) : messages.length === 0 ? (
                <tr><td colSpan="6" className="px-4 py-12 text-center text-neutral-500">
                  <Mail className="w-10 h-10 mx-auto mb-2 text-neutral-300" />
                  Aucun message
                </td></tr>
              ) : messages.map(m => {
                const cfg = STATUS_CONFIG[m.status] || STATUS_CONFIG.new;
                const StatusIcon = cfg.icon;
                return (
                  <tr key={m.id} className={`hover:bg-neutral-50 cursor-pointer ${m.status === 'new' ? 'font-medium' : ''}`}>
                    <td className="px-4 py-3" onClick={() => openMessage(m.id)}>
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs border ${cfg.color}`}>
                        <StatusIcon className="w-3 h-3" />
                        {cfg.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-neutral-900" onClick={() => openMessage(m.id)}>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                          <User className="w-4 h-4 text-primary-600" />
                        </div>
                        <div>
                          <div>{m.name}</div>
                          <div className="text-xs text-neutral-500">{m.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-neutral-700" onClick={() => openMessage(m.id)}>
                      {SUBJECT_LABELS[m.subject] || m.subject}
                    </td>
                    <td className="px-4 py-3 text-sm text-neutral-600 max-w-xs truncate" onClick={() => openMessage(m.id)}>
                      {m.message}
                    </td>
                    <td className="px-4 py-3 text-xs text-neutral-500 whitespace-nowrap" onClick={() => openMessage(m.id)}>
                      {formatDate(m.created_at)}
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <button onClick={() => openMessage(m.id)} className="p-1.5 text-neutral-600 hover:text-primary-600" title="Voir">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button onClick={() => openReplyModal(m)} className="p-1.5 text-neutral-600 hover:text-green-600" title="Répondre">
                        <Reply className="w-4 h-4" />
                      </button>
                      <button onClick={() => deleteMessage(m.id)} className="p-1.5 text-neutral-600 hover:text-red-600" title="Supprimer">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.total_pages > 1 && (
          <div className="px-4 py-3 border-t border-neutral-200 flex items-center justify-between text-sm">
            <span className="text-neutral-500">
              {pagination.total} messages
            </span>
            <div className="flex gap-2">
              <button disabled={!pagination.has_prev} onClick={() => setPage(p => p - 1)}
                className="px-3 py-1 border border-neutral-200 rounded disabled:opacity-40 hover:bg-neutral-50">
                Précédent
              </button>
              <span className="px-3 py-1">Page {pagination.current_page} / {pagination.total_pages}</span>
              <button disabled={!pagination.has_next} onClick={() => setPage(p => p + 1)}
                className="px-3 py-1 border border-neutral-200 rounded disabled:opacity-40 hover:bg-neutral-50">
                Suivant
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal réponse email */}
      {replyModal && (
        <div className="fixed inset-0 z-[60] bg-black/60 flex items-center justify-center p-4" onClick={() => setReplyModal(null)}>
          <div className="bg-white rounded-xl max-w-lg w-full shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between p-6 border-b border-neutral-200">
              <div>
                <h3 className="text-lg font-bold text-neutral-900">Répondre à {replyModal.name}</h3>
                <p className="text-sm text-neutral-500 mt-0.5">{replyModal.email}</p>
              </div>
              <button onClick={() => setReplyModal(null)} className="p-1 hover:bg-neutral-100 rounded">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              {/* Message original */}
              <div>
                <div className="text-xs font-semibold text-neutral-500 uppercase mb-1">Message original</div>
                <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-3 text-sm text-neutral-700 max-h-32 overflow-y-auto whitespace-pre-wrap">
                  {replyModal.message}
                </div>
              </div>
              {/* Réponse */}
              <div>
                <label className="text-xs font-semibold text-neutral-500 uppercase mb-1 block">Votre réponse</label>
                <textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  rows={6}
                  placeholder="Écrivez votre réponse ici…"
                  className="w-full border border-neutral-200 rounded-lg p-3 text-sm focus:outline-none focus:border-primary-500 resize-none"
                  autoFocus
                />
              </div>
              {replyError && (
                <p className="text-sm text-red-600">{replyError}</p>
              )}
            </div>
            <div className="p-6 border-t border-neutral-200 flex justify-end gap-3">
              <button onClick={() => setReplyModal(null)} className="px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-100 rounded-lg">
                Annuler
              </button>
              <button
                onClick={sendReply}
                disabled={replySending || !replyText.trim()}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
              >
                {replySending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                {replySending ? 'Envoi…' : 'Envoyer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal détail */}
      {selected && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setSelected(null)}>
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-start justify-between p-6 border-b border-neutral-200">
              <div>
                <h2 className="text-xl font-bold text-neutral-900 mb-1">
                  {SUBJECT_LABELS[selected.subject] || selected.subject}
                </h2>
                <div className="flex items-center gap-2 text-sm text-neutral-500">
                  <Mail className="w-4 h-4" />
                  {selected.email}
                </div>
              </div>
              <button onClick={() => setSelected(null)} className="p-1 hover:bg-neutral-100 rounded">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-neutral-500 mb-1">Expéditeur</div>
                  <div className="font-medium">{selected.name}</div>
                </div>
                <div>
                  <div className="text-neutral-500 mb-1">Reçu le</div>
                  <div className="font-medium">{formatDate(selected.created_at)}</div>
                </div>
              </div>

              <div>
                <div className="text-sm text-neutral-500 mb-2">Message</div>
                <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-4 text-neutral-800 whitespace-pre-wrap">
                  {selected.message}
                </div>
              </div>

              <div>
                <div className="text-sm text-neutral-500 mb-2">Notes internes</div>
                <textarea
                  value={notesDraft}
                  onChange={(e) => setNotesDraft(e.target.value)}
                  rows={3}
                  className="w-full border border-neutral-200 rounded-lg p-3 text-sm focus:outline-none focus:border-primary-500"
                  placeholder="Ajoutez des notes internes sur ce message…"
                />
                <div className="flex justify-end mt-2">
                  <button onClick={saveNotes} className="px-3 py-1.5 text-sm bg-neutral-100 hover:bg-neutral-200 rounded-lg">
                    Enregistrer les notes
                  </button>
                </div>
              </div>

              <div>
                <div className="text-sm text-neutral-500 mb-2">Statut</div>
                <div className="flex gap-2 flex-wrap">
                  {Object.entries(STATUS_CONFIG).map(([key, cfg]) => {
                    const Icon = cfg.icon;
                    const active = selected.status === key;
                    return (
                      <button
                        key={key}
                        onClick={() => updateStatus(selected.id, key)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm transition ${
                          active ? cfg.color + ' border-current font-medium' : 'bg-white border-neutral-200 hover:bg-neutral-50'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        {cfg.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-neutral-200 flex justify-between">
              <button
                onClick={() => deleteMessage(selected.id)}
                className="inline-flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg"
              >
                <Trash2 className="w-4 h-4" /> Supprimer
              </button>
              <button
                onClick={() => openReplyModal(selected)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
              >
                <Reply className="w-4 h-4" /> Répondre par email
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContactManagement;
