import React, { useState, useMemo } from 'react';
import {
  History as HistoryIcon,
  Search,
  Filter,
  Trash2,
  Download,
  ShoppingBag,
  Package,
  User,
  Settings,
  Bell,
  AlertCircle,
  CheckCircle,
  Edit,
  LogIn,
  Plus,
  X,
  Shield,
  CreditCard,
  BarChart3,
  FileText
} from 'lucide-react';
import useNotificationStore from '../../services/notificationService';

// Mapping catégorie → icône + couleur
const CATEGORY_CONFIG = {
  'Commande': { icon: ShoppingBag, color: 'text-blue-600', bg: 'bg-blue-50' },
  'Produit': { icon: Package, color: 'text-purple-600', bg: 'bg-purple-50' },
  'Client': { icon: User, color: 'text-green-600', bg: 'bg-green-50' },
  'Utilisateur': { icon: Shield, color: 'text-rose-600', bg: 'bg-rose-50' },
  'Paiement': { icon: CreditCard, color: 'text-cyan-600', bg: 'bg-cyan-50' },
  'Analytics': { icon: BarChart3, color: 'text-sky-600', bg: 'bg-sky-50' },
  'Rapport': { icon: FileText, color: 'text-slate-600', bg: 'bg-slate-50' },
  'Auth': { icon: LogIn, color: 'text-amber-600', bg: 'bg-amber-50' },
  'Paramètre': { icon: Settings, color: 'text-gray-600', bg: 'bg-gray-50' },
  'Notification': { icon: Bell, color: 'text-indigo-600', bg: 'bg-indigo-50' },
  'Erreur': { icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-50' },
  'Succès': { icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  'Modification': { icon: Edit, color: 'text-orange-600', bg: 'bg-orange-50' },
  'Création': { icon: Plus, color: 'text-teal-600', bg: 'bg-teal-50' }
};

const DEFAULT_CONFIG = { icon: HistoryIcon, color: 'text-neutral-600', bg: 'bg-neutral-50' };

const ActivityHistory = () => {
  const { history, clearHistory } = useNotificationStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [showConfirmClear, setShowConfirmClear] = useState(false);

  // Catégories disponibles
  const categories = useMemo(() => {
    const cats = new Set(history.map(h => h.category).filter(Boolean));
    return ['all', ...Array.from(cats)];
  }, [history]);

  // Filtrage + recherche
  const filteredHistory = useMemo(() => {
    let result = [...history].reverse(); // plus récent en premier

    if (filterCategory !== 'all') {
      result = result.filter(h => h.category === filterCategory);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(h =>
        (h.title || '').toLowerCase().includes(q) ||
        (h.message || '').toLowerCase().includes(q) ||
        (h.category || '').toLowerCase().includes(q)
      );
    }

    return result;
  }, [history, searchQuery, filterCategory]);

  // Export CSV
  const handleExportCSV = () => {
    const rows = [
      ['Date', 'Catégorie', 'Titre', 'Message', 'Type'],
      ...filteredHistory.map(h => [
        h.time || '',
        h.category || '',
        h.title || '',
        (h.message || '').replace(/[\n\r,]/g, ' '),
        h.type || ''
      ])
    ];
    const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `historique-activite-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Statistiques
  const stats = useMemo(() => {
    const today = new Date().toDateString();
    const todayCount = history.filter(h => new Date(h.timestamp).toDateString() === today).length;
    return {
      total: history.length,
      today: todayCount,
      categories: new Set(history.map(h => h.category)).size
    };
  }, [history]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-neutral-900 flex items-center gap-2">
            <HistoryIcon className="w-7 h-7" />
            Historique d'activité
          </h2>
          <p className="text-sm text-neutral-500 mt-1">
            Toutes les actions et événements du site
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            disabled={filteredHistory.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-neutral-200 rounded-lg text-sm font-medium hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="w-4 h-4" />
            Exporter CSV
          </button>
          <button
            onClick={() => setShowConfirmClear(true)}
            disabled={history.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 border border-red-200 rounded-lg text-sm font-medium hover:bg-red-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Trash2 className="w-4 h-4" />
            Tout effacer
          </button>
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-neutral-200">
          <p className="text-sm text-neutral-500">Total événements</p>
          <p className="text-2xl font-bold text-neutral-900 mt-1">{stats.total}</p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-neutral-200">
          <p className="text-sm text-neutral-500">Aujourd'hui</p>
          <p className="text-2xl font-bold text-neutral-900 mt-1">{stats.today}</p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-neutral-200">
          <p className="text-sm text-neutral-500">Catégories</p>
          <p className="text-2xl font-bold text-neutral-900 mt-1">{stats.categories}</p>
        </div>
      </div>

      {/* Filtres */}
      <div className="bg-white p-4 rounded-xl border border-neutral-200 flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher dans l'historique..."
            className="w-full pl-10 pr-4 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900"
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="pl-10 pr-8 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900 bg-white"
          >
            {categories.map(cat => (
              <option key={cat} value={cat}>
                {cat === 'all' ? 'Toutes catégories' : cat}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Liste historique */}
      <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
        {filteredHistory.length === 0 ? (
          <div className="px-4 py-16 text-center">
            <HistoryIcon className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
            <p className="text-neutral-600 font-medium">Aucune activité</p>
            <p className="text-sm text-neutral-400 mt-1">
              {history.length === 0
                ? "L'historique se remplira automatiquement avec les actions du site"
                : "Aucun résultat pour ces filtres"}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-neutral-100">
            {filteredHistory.map((entry) => {
              const config = CATEGORY_CONFIG[entry.category] || DEFAULT_CONFIG;
              const Icon = config.icon;
              return (
                <div key={entry.id} className="px-4 py-3 hover:bg-neutral-50 transition-colors">
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-lg ${config.bg} ${config.color} flex items-center justify-center flex-shrink-0`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-sm font-medium text-neutral-900">
                              {entry.title || 'Événement'}
                            </p>
                            {entry.category && (
                              <span className={`text-[10px] px-2 py-0.5 rounded-full ${config.bg} ${config.color} font-medium`}>
                                {entry.category}
                              </span>
                            )}
                          </div>
                          {entry.message && (
                            <p className="text-xs text-neutral-600 mt-1">{entry.message}</p>
                          )}
                        </div>
                        <span className="text-[11px] text-neutral-400 flex-shrink-0 whitespace-nowrap">
                          {entry.time}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {filteredHistory.length > 0 && (
          <div className="px-4 py-3 border-t border-neutral-100 bg-neutral-50 text-xs text-neutral-500">
            {filteredHistory.length} événement(s) affiché(s) sur {history.length} au total
          </div>
        )}
      </div>

      {/* Modal confirmation suppression */}
      {showConfirmClear && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center flex-shrink-0">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-neutral-900">Effacer tout l'historique ?</h3>
                <p className="text-sm text-neutral-600 mt-1">
                  Cette action est irréversible. {history.length} événement(s) seront supprimés.
                </p>
              </div>
              <button onClick={() => setShowConfirmClear(false)} className="text-neutral-400 hover:text-neutral-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex gap-2 mt-6">
              <button
                onClick={() => setShowConfirmClear(false)}
                className="flex-1 px-4 py-2 border border-neutral-200 rounded-lg text-sm font-medium hover:bg-neutral-50"
              >
                Annuler
              </button>
              <button
                onClick={() => {
                  clearHistory();
                  setShowConfirmClear(false);
                }}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700"
              >
                Confirmer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ActivityHistory;
