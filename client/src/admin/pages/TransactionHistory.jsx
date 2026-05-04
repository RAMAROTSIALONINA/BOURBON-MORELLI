import React, { useState, useEffect, useCallback } from 'react';
import {
  History,
  Search,
  Filter,
  Download,
  Eye,
  Calendar,
  CreditCard,
  Smartphone,
  AlertCircle,
  CheckCircle,
  Clock,
  RotateCcw,
  XCircle,
  TrendingDown,
  DollarSign,
  X
} from 'lucide-react';
import paymentService from '../../services/paymentService';

const TransactionHistory = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [methodFilter, setMethodFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedTx, setSelectedTx] = useState(null);

  const loadHistory = useCallback(async () => {
    try {
      setLoading(true);
      const data = await paymentService.getTransactionHistory();
      setTransactions(Array.isArray(data.transactions) ? data.transactions : []);
    } catch {
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadHistory(); }, [loadHistory]);

  const filteredTx = transactions.filter(tx => {
    const search = searchTerm.toLowerCase();
    const matchSearch =
      !search ||
      (tx.customer_name  && tx.customer_name.toLowerCase().includes(search)) ||
      (tx.customer_email && tx.customer_email.toLowerCase().includes(search)) ||
      (tx.transaction_id && tx.transaction_id.toLowerCase().includes(search)) ||
      (tx.order_id       && tx.order_id.toString().includes(search));

    const matchStatus = statusFilter === 'all' || tx.status === statusFilter;
    const matchMethod = methodFilter === 'all' || tx.gateway === methodFilter;

    const txDate = tx.created_at ? new Date(tx.created_at) : null;
    const matchFrom = !dateFrom || (txDate && txDate >= new Date(dateFrom));
    const matchTo   = !dateTo   || (txDate && txDate <= new Date(dateTo + 'T23:59:59'));

    return matchSearch && matchStatus && matchMethod && matchFrom && matchTo;
  });

  // Normalise le statut (payments table → 'paid'/'completed', payment_transactions → 'completed'/'failed'…)
  const normalizeStatus = (s) => {
    if (!s) return 'pending';
    if (s === 'paid') return 'completed';
    return s;
  };

  // Statistiques
  const stats = {
    totalCollected: filteredTx
      .filter(t => normalizeStatus(t.status) === 'completed')
      .reduce((s, t) => s + t.amount, 0),
    totalRefunded: filteredTx
      .filter(t => normalizeStatus(t.status) === 'refunded')
      .reduce((s, t) => s + t.amount, 0),
    totalFailed: filteredTx.filter(t => normalizeStatus(t.status) === 'failed').length,
    count: filteredTx.length
  };

  const formatDate = (d) => {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('fr-FR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  const formatAmount = (amount, currency = 'EUR') =>
    `${parseFloat(amount || 0).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency}`;

  const getStatusBadge = (rawStatus) => {
    const status = normalizeStatus(rawStatus);
    const map = {
      completed:  { color: 'green',  Icon: CheckCircle,  label: 'Complété'    },
      paid:       { color: 'green',  Icon: CheckCircle,  label: 'Payé'        },
      pending:    { color: 'yellow', Icon: Clock,        label: 'En attente'  },
      processing: { color: 'blue',   Icon: RotateCcw,    label: 'En cours'    },
      failed:     { color: 'red',    Icon: XCircle,      label: 'Échoué'      },
      refunded:   { color: 'purple', Icon: TrendingDown, label: 'Remboursé'   },
      cancelled:  { color: 'gray',   Icon: XCircle,      label: 'Annulé'      }
    };
    const cfg = map[status] || { color: 'gray', Icon: Clock, label: status || 'Inconnu' };
    const { color, Icon, label } = cfg;
    return (
      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-${color}-100 text-${color}-800`}>
        <Icon className="w-3 h-3" />
        {label}
      </span>
    );
  };

  const getMethodBadge = (gateway) => {
    // Tous les noms sont normalisés par le backend : stripe / mobile / paypal
    if (gateway === 'mobile' || gateway === 'mobile_money') return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
        <Smartphone className="w-3 h-3" /> Mobile Money
      </span>
    );
    if (gateway === 'paypal') return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
        <CreditCard className="w-3 h-3" /> PayPal
      </span>
    );
    // stripe / credit_card / tout le reste → Stripe / Carte
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
        <CreditCard className="w-3 h-3" /> Stripe / Carte
      </span>
    );
  };

  // Label lisible pour l'export CSV
  const gatewayLabel = (g) => {
    if (g === 'mobile' || g === 'mobile_money') return 'Mobile Money';
    if (g === 'paypal') return 'PayPal';
    return 'Stripe / Carte';
  };

  const exportCSV = () => {
    const headers = ['ID','Montant','Devise','Méthode','Description','Client','Email','Date','Date remboursement','Motif refus','Statut'];
    const rows = filteredTx.map(tx => [
      tx.id,
      tx.amount,
      tx.currency,
      gatewayLabel(tx.gateway),
      tx.description,
      tx.customer_name,
      tx.customer_email,
      formatDate(tx.created_at),
      formatDate(tx.refunded_at),
      tx.failure_reason || '',
      tx.status
    ]);
    const csv = [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transactions_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
            <History className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-neutral-900">Historique des transactions</h2>
            <p className="text-sm text-neutral-500">{filteredTx.length} transaction{filteredTx.length !== 1 ? 's' : ''}</p>
          </div>
        </div>
        <button
          onClick={exportCSV}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
        >
          <Download className="w-4 h-4" />
          Exporter CSV
        </button>
      </div>

      {/* Cartes statistiques */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-neutral-200 p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-neutral-500">Encaissé</span>
            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
              <DollarSign className="w-4 h-4 text-green-600" />
            </div>
          </div>
          <p className="text-xl font-bold text-green-700">{formatAmount(stats.totalCollected)}</p>
          <p className="text-xs text-neutral-400 mt-1">{filteredTx.filter(t=>t.status==='completed').length} transaction(s)</p>
        </div>

        <div className="bg-white rounded-xl border border-neutral-200 p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-neutral-500">Remboursé</span>
            <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
              <TrendingDown className="w-4 h-4 text-purple-600" />
            </div>
          </div>
          <p className="text-xl font-bold text-purple-700">{formatAmount(stats.totalRefunded)}</p>
          <p className="text-xs text-neutral-400 mt-1">{filteredTx.filter(t=>t.status==='refunded').length} transaction(s)</p>
        </div>

        <div className="bg-white rounded-xl border border-neutral-200 p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-neutral-500">Échoués</span>
            <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
              <AlertCircle className="w-4 h-4 text-red-600" />
            </div>
          </div>
          <p className="text-xl font-bold text-red-700">{stats.totalFailed}</p>
          <p className="text-xs text-neutral-400 mt-1">transaction(s) échouée(s)</p>
        </div>

        <div className="bg-white rounded-xl border border-neutral-200 p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-neutral-500">Total</span>
            <div className="w-8 h-8 bg-neutral-100 rounded-lg flex items-center justify-center">
              <History className="w-4 h-4 text-neutral-600" />
            </div>
          </div>
          <p className="text-xl font-bold text-neutral-900">{stats.count}</p>
          <p className="text-xs text-neutral-400 mt-1">toutes transactions</p>
        </div>
      </div>

      {/* Filtres */}
      <div className="bg-white rounded-xl border border-neutral-200 p-4 shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <div className="relative lg:col-span-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input
              type="text"
              placeholder="Client, email, transaction, commande..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-neutral-400 flex-shrink-0" />
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="flex-1 px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">Tous les statuts</option>
              <option value="completed">Complété</option>
              <option value="pending">En attente</option>
              <option value="failed">Échoué</option>
              <option value="refunded">Remboursé</option>
              <option value="cancelled">Annulé</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-neutral-400 flex-shrink-0" />
            <select
              value={methodFilter}
              onChange={e => setMethodFilter(e.target.value)}
              className="flex-1 px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">Toutes méthodes</option>
              <option value="stripe">Stripe / Carte</option>
              <option value="paypal">PayPal</option>
              <option value="mobile">Mobile Money</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-neutral-400 flex-shrink-0" />
            <input
              type="date"
              value={dateFrom}
              onChange={e => setDateFrom(e.target.value)}
              className="flex-1 px-2 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              title="Date de début"
            />
            <input
              type="date"
              value={dateTo}
              onChange={e => setDateTo(e.target.value)}
              className="flex-1 px-2 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              title="Date de fin"
            />
          </div>
        </div>
      </div>

      {/* Tableau */}
      <div className="bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px]">
            <thead className="bg-neutral-50 border-b border-neutral-200">
              <tr>
                {['Montant','Moyen de paiement','Description','Client','Date','Date du remboursement','Motif du refus','Statut',''].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {loading ? (
                <tr>
                  <td colSpan="9" className="px-4 py-10 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500 mx-auto mb-3" />
                    <p className="text-sm text-neutral-500">Chargement de l'historique...</p>
                  </td>
                </tr>
              ) : filteredTx.length === 0 ? (
                <tr>
                  <td colSpan="9" className="px-4 py-12 text-center">
                    <History className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
                    <p className="text-neutral-500 font-medium">Aucune transaction trouvée</p>
                    <p className="text-sm text-neutral-400 mt-1">Modifiez vos filtres ou attendez de nouvelles transactions</p>
                  </td>
                </tr>
              ) : (
                filteredTx.map(tx => (
                  <tr key={tx.id} className="hover:bg-neutral-50 transition-colors">
                    {/* Montant */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`text-sm font-semibold ${
                        tx.status === 'failed' ? 'text-red-600' :
                        tx.status === 'refunded' ? 'text-purple-600' :
                        'text-neutral-900'
                      }`}>
                        {formatAmount(tx.amount, tx.currency)}
                      </span>
                      <div className="text-xs text-neutral-400">#{tx.id}</div>
                    </td>

                    {/* Moyen de paiement */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      {getMethodBadge(tx.gateway)}
                    </td>

                    {/* Description */}
                    <td className="px-4 py-3">
                      <div className="text-sm text-neutral-900">{tx.description}</div>
                      {tx.transaction_id && (
                        <div className="text-xs text-neutral-400 font-mono truncate max-w-[140px]" title={tx.transaction_id}>
                          {tx.transaction_id.slice(0, 20)}…
                        </div>
                      )}
                    </td>

                    {/* Client */}
                    <td className="px-4 py-3">
                      <div className="text-sm font-medium text-neutral-900">{tx.customer_name}</div>
                      <div className="text-xs text-neutral-500">{tx.customer_email || '—'}</div>
                    </td>

                    {/* Date */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-1 text-sm text-neutral-700">
                        <Calendar className="w-3.5 h-3.5 text-neutral-400" />
                        {formatDate(tx.created_at)}
                      </div>
                    </td>

                    {/* Date du remboursement */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      {tx.refunded_at ? (
                        <div className="text-sm text-purple-700 flex items-center gap-1">
                          <TrendingDown className="w-3.5 h-3.5" />
                          {formatDate(tx.refunded_at)}
                        </div>
                      ) : (
                        <span className="text-sm text-neutral-400">—</span>
                      )}
                    </td>

                    {/* Motif du refus */}
                    <td className="px-4 py-3 max-w-[180px]">
                      {tx.failure_reason ? (
                        <div className="flex items-start gap-1">
                          <AlertCircle className="w-3.5 h-3.5 text-red-500 flex-shrink-0 mt-0.5" />
                          <span className="text-xs text-red-700 line-clamp-2">{tx.failure_reason}</span>
                        </div>
                      ) : (
                        <span className="text-sm text-neutral-400">—</span>
                      )}
                    </td>

                    {/* Statut */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      {getStatusBadge(tx.status)}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <button
                        onClick={() => setSelectedTx(tx)}
                        className="text-indigo-600 hover:text-indigo-900 transition-colors"
                        title="Voir les détails"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal détails */}
      {selectedTx && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-neutral-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
                  <History className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-neutral-900">Détails de la transaction</h3>
                  <p className="text-sm text-neutral-500">#{selectedTx.id}</p>
                </div>
              </div>
              <button onClick={() => setSelectedTx(null)} className="text-neutral-400 hover:text-neutral-600">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                {/* Montant */}
                <div className="bg-neutral-50 rounded-xl p-4">
                  <p className="text-xs text-neutral-500 mb-1 uppercase tracking-wider">Montant</p>
                  <p className="text-2xl font-bold text-neutral-900">{formatAmount(selectedTx.amount, selectedTx.currency)}</p>
                  <div className="mt-2">{getStatusBadge(selectedTx.status)}</div>
                </div>

                {/* Moyen de paiement */}
                <div className="bg-neutral-50 rounded-xl p-4">
                  <p className="text-xs text-neutral-500 mb-1 uppercase tracking-wider">Moyen de paiement</p>
                  <div className="mt-1">{getMethodBadge(selectedTx.gateway)}</div>
                  {selectedTx.transaction_id && (
                    <p className="text-xs text-neutral-400 mt-2 font-mono break-all">{selectedTx.transaction_id}</p>
                  )}
                </div>
              </div>

              {/* Description */}
              <div>
                <p className="text-xs text-neutral-500 mb-1 uppercase tracking-wider">Description</p>
                <p className="text-sm font-medium text-neutral-900">{selectedTx.description}</p>
              </div>

              {/* Client */}
              <div>
                <p className="text-xs text-neutral-500 mb-2 uppercase tracking-wider">Client</p>
                <div className="bg-neutral-50 rounded-xl p-4">
                  <p className="font-medium text-neutral-900">{selectedTx.customer_name}</p>
                  <p className="text-sm text-neutral-600">{selectedTx.customer_email || '—'}</p>
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-neutral-500 mb-1 uppercase tracking-wider">Date de transaction</p>
                  <p className="text-sm text-neutral-900">{formatDate(selectedTx.created_at)}</p>
                </div>
                <div>
                  <p className="text-xs text-neutral-500 mb-1 uppercase tracking-wider">Date du remboursement</p>
                  <p className={`text-sm ${selectedTx.refunded_at ? 'text-purple-700 font-medium' : 'text-neutral-400'}`}>
                    {selectedTx.refunded_at ? formatDate(selectedTx.refunded_at) : '—'}
                  </p>
                </div>
              </div>

              {/* Motif du refus */}
              {selectedTx.failure_reason && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <AlertCircle className="w-4 h-4 text-red-600" />
                    <p className="text-xs font-semibold text-red-700 uppercase tracking-wider">Motif du refus de paiement</p>
                  </div>
                  <p className="text-sm text-red-800">{selectedTx.failure_reason}</p>
                </div>
              )}

              {/* Motif du remboursement */}
              {selectedTx.refund_reason && (
                <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <TrendingDown className="w-4 h-4 text-purple-600" />
                    <p className="text-xs font-semibold text-purple-700 uppercase tracking-wider">Motif du remboursement</p>
                  </div>
                  <p className="text-sm text-purple-800">{selectedTx.refund_reason}</p>
                </div>
              )}
            </div>

            <div className="px-6 pb-6">
              <button
                onClick={() => setSelectedTx(null)}
                className="w-full py-2.5 bg-neutral-100 text-neutral-700 rounded-xl hover:bg-neutral-200 transition-colors text-sm font-medium"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TransactionHistory;
