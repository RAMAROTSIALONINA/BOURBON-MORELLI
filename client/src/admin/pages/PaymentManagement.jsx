import React, { useState, useEffect, useCallback } from 'react';
import {
  CreditCard,
  DollarSign,
  Search,
  Filter,
  Eye,
  Clock,
  Check,
  X,
  TrendingDown,
  Download,
  Calendar,
  Trash2,
  RefreshCw,
  History,
  List
} from 'lucide-react';
import paymentService from '../../services/paymentService';
import useNotificationStore from '../../services/notificationService';
import TransactionHistory from './TransactionHistory';

const PaymentManagement = () => {
  const addNotification = useNotificationStore(s => s.addNotification);
  const [activeTab, setActiveTab] = useState('payments');
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [methodFilter, setMethodFilter] = useState('all');
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [refundAmount, setRefundAmount] = useState('');
  const [refundReason, setRefundReason] = useState('');

  // Charger les paiements
  const loadPayments = useCallback(async () => {
    try {
      setLoading(true);
      const response = await paymentService.getAllPayments();
      console.log('=== LOAD PAYMENTS RESPONSE ===');
      console.log('Response:', response);
      console.log('Response type:', typeof response);
      console.log('Is array:', Array.isArray(response));
      
      // Gérer différents formats de réponse
      let paymentsData = [];
      if (Array.isArray(response)) {
        paymentsData = response;
      } else if (response && Array.isArray(response.data)) {
        paymentsData = response.data;
      } else if (response && response.payments && Array.isArray(response.payments)) {
        paymentsData = response.payments;
      } else {
        console.warn('Format de réponse inattendu:', response);
      }
      
      console.log('Payments data:', paymentsData);
      setPayments(paymentsData);
    } catch (error) {
      console.error('Erreur lors du chargement des paiements:', error);
      setPayments([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPayments();
  }, [loadPayments]);

  // Filtrer les paiements
  const filteredPayments = Array.isArray(payments) ? payments.filter(payment => {
    const matchesSearch = 
      (payment.id && payment.id.toString().includes(searchTerm.toLowerCase())) ||
      (payment.order_id && payment.order_id.toString().includes(searchTerm.toLowerCase())) ||
      (payment.customer_email && payment.customer_email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (payment.transaction_id && payment.transaction_id.toLowerCase().includes(searchTerm));
    
    const matchesStatus = statusFilter === 'all' || payment.status === statusFilter;
    const matchesMethod = methodFilter === 'all' || payment.method === methodFilter;
    
    return matchesSearch && matchesStatus && matchesMethod;
  }) : [];

  // Obtenir le statut avec style
  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { color: 'yellow', text: 'En attente', icon: Clock },
      processing: { color: 'blue', text: 'En traitement', icon: RefreshCw },
      completed: { color: 'green', text: 'Complété', icon: Check },
      failed: { color: 'red', text: 'Échoué', icon: X },
      refunded: { color: 'purple', text: 'Remboursé', icon: TrendingDown },
      cancelled: { color: 'gray', text: 'Annulé', icon: X }
    };
    
    const config = statusConfig[status] || statusConfig.pending;
    const Icon = config.icon;
    
    return (
      <span className={`inline-flex items-center px-2 py-1 text-xs font-medium bg-${config.color}-100 text-${config.color}-800 rounded-full`}>
        <Icon className="w-3 h-3 mr-1" />
        {config.text}
      </span>
    );
  };

  // Obtenir la méthode avec style
  const getMethodBadge = (method) => {
    const methodConfig = {
      credit_card: { color: 'blue', text: 'Carte de crédit', icon: CreditCard },
      paypal: { color: 'indigo', text: 'PayPal', icon: CreditCard },
      stripe: { color: 'purple', text: 'Stripe', icon: CreditCard },
      bank_transfer: { color: 'green', text: 'Virement bancaire', icon: DollarSign },
      cash: { color: 'gray', text: 'Espèces', icon: DollarSign }
    };
    
    const config = methodConfig[method] || methodConfig.credit_card;
    const Icon = config.icon;
    
    return (
      <span className={`inline-flex items-center px-2 py-1 text-xs font-medium bg-${config.color}-100 text-${config.color}-800 rounded-full`}>
        <Icon className="w-3 h-3 mr-1" />
        {config.text}
      </span>
    );
  };

  // Traiter un remboursement
  const processRefund = async () => {
    try {
      if (!selectedPayment || !refundAmount || parseFloat(refundAmount) <= 0) {
        alert('Veuillez entrer un montant de remboursement valide');
        return;
      }

      if (parseFloat(refundAmount) > parseFloat(selectedPayment.amount)) {
        alert('Le montant de remboursement ne peut pas dépasser le montant original');
        return;
      }

      const refundData = {
        amount: parseFloat(refundAmount),
        reason: refundReason || 'Remboursement demandé par le client'
      };

      await paymentService.processRefund(selectedPayment.id, refundData);
      await loadPayments();
      setShowRefundModal(false);
      addNotification({
        type: 'warning',
        category: 'Paiement',
        title: 'Remboursement traité',
        message: `${refundData.amount} EUR remboursés sur paiement #${selectedPayment.id} (${refundData.reason})`
      });
      setSelectedPayment(null);
      setRefundAmount('');
      setRefundReason('');
      alert('Remboursement traité avec succès!');
    } catch (error) {
      console.error('Erreur lors du traitement du remboursement:', error);
      alert('Erreur lors du traitement du remboursement');
    }
  };

  // Mettre à jour le statut d'un paiement
  const updatePaymentStatus = async (paymentId, newStatus) => {
    try {
      await paymentService.updatePaymentStatus(paymentId, { status: newStatus });
      await loadPayments();
      addNotification({
        type: 'info',
        category: 'Paiement',
        title: 'Statut paiement modifié',
        message: `Paiement #${paymentId} → ${newStatus}`
      });
      alert('Statut du paiement mis à jour avec succès!');
    } catch (error) {
      console.error('Erreur lors de la mise à jour du statut:', error);
      alert('Erreur lors de la mise à jour du statut');
    }
  };

  // Supprimer un paiement
  const deletePayment = async (paymentId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce paiement?')) {
      return;
    }

    try {
      const pay = payments.find(p => p.id === paymentId);
      await paymentService.deletePayment(paymentId);
      await loadPayments();
      addNotification({
        type: 'warning',
        category: 'Paiement',
        title: 'Paiement supprimé',
        message: `Paiement #${paymentId}${pay ? ' (' + pay.amount + ' EUR)' : ''} supprimé`
      });
      alert('Paiement supprimé avec succès!');
    } catch (error) {
      console.error('Erreur lors de la suppression du paiement:', error);
      alert('Erreur lors de la suppression du paiement');
    }
  };

  // Voir les détails d'un paiement
  const viewPaymentDetails = (payment) => {
    setSelectedPayment(payment);
    setShowDetailsModal(true);
  };

  // Ouvrir le modal de remboursement
  const openRefundModal = (payment) => {
    setSelectedPayment(payment);
    setRefundAmount('');
    setRefundReason('');
    setShowRefundModal(true);
  };

  // Formater la date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Calculer le total des paiements filtrés
  const totalAmount = filteredPayments.reduce((sum, payment) => {
    return sum + (payment.status === 'completed' ? parseFloat(payment.amount) || 0 : 0);
  }, 0);

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-neutral-200">
        <button
          onClick={() => setActiveTab('payments')}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors -mb-px ${
            activeTab === 'payments'
              ? 'border-primary-600 text-primary-700'
              : 'border-transparent text-neutral-500 hover:text-neutral-700'
          }`}
        >
          <List className="w-4 h-4" />
          Paiements
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors -mb-px ${
            activeTab === 'history'
              ? 'border-primary-600 text-primary-700'
              : 'border-transparent text-neutral-500 hover:text-neutral-700'
          }`}
        >
          <History className="w-4 h-4" />
          Historique des transactions
        </button>
      </div>

      {/* Tab : Historique des transactions */}
      {activeTab === 'history' && <TransactionHistory />}

      {/* Tab : Paiements */}
      {activeTab === 'payments' && <>

      {/* En-tête avec statistiques */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-neutral-900">Gestion des paiements</h2>
        <div className="flex items-center space-x-4">
          <div className="text-right">
            <p className="text-sm text-neutral-500">Total des paiements complétés</p>
            <p className="text-xl font-bold text-green-600">{totalAmount.toLocaleString()} EUR</p>
          </div>
          <button className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors flex items-center">
            <Download className="w-4 h-4 mr-2" />
            Exporter
          </button>
        </div>
      </div>

      {/* Filtres */}
      <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Rechercher (ID, commande, email, transaction)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div className="flex items-center space-x-2">
            <Filter className="w-5 h-5 text-neutral-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="flex-1 px-3 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">Tous les statuts</option>
              <option value="pending">En attente</option>
              <option value="processing">En traitement</option>
              <option value="completed">Complété</option>
              <option value="failed">Échoué</option>
              <option value="refunded">Remboursé</option>
              <option value="cancelled">Annulé</option>
            </select>
          </div>
          <div className="flex items-center space-x-2">
            <CreditCard className="w-5 h-5 text-neutral-400" />
            <select
              value={methodFilter}
              onChange={(e) => setMethodFilter(e.target.value)}
              className="flex-1 px-3 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">Toutes les méthodes</option>
              <option value="credit_card">Carte de crédit</option>
              <option value="paypal">PayPal</option>
              <option value="stripe">Stripe</option>
              <option value="bank_transfer">Virement bancaire</option>
              <option value="cash">Espèces</option>
            </select>
          </div>
        </div>
      </div>

      {/* Liste des paiements */}
      <div className="bg-white rounded-xl shadow-sm border border-neutral-200">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-neutral-50 border-b border-neutral-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Paiement
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Client
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Montant
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Méthode
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Statut
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-neutral-200">
              {loading ? (
                <tr>
                  <td colSpan="7" className="px-6 py-4 text-center text-neutral-500">
                    Chargement...
                  </td>
                </tr>
              ) : filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-4 text-center text-neutral-500">
                    Aucun paiement trouvé
                  </td>
                </tr>
              ) : (
                filteredPayments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-neutral-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-neutral-900">
                        #{payment.id}
                      </div>
                      <div className="text-sm text-neutral-500">
                        Commande #{payment.order_id}
                      </div>
                      {payment.transaction_id && (
                        <div className="text-xs text-neutral-400">
                          Trans: {payment.transaction_id}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-neutral-900">
                        {payment.customer_name || 'Client inconnu'}
                      </div>
                      <div className="text-sm text-neutral-500">
                        {payment.customer_email || 'Email non disponible'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-neutral-900">
                        <Calendar className="w-4 h-4 text-neutral-400 mr-2" />
                        {formatDate(payment.created_at)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm font-medium text-neutral-900">
                        <DollarSign className="w-4 h-4 text-neutral-400 mr-1" />
                        {payment.amount ? parseFloat(payment.amount).toLocaleString() : '0'} EUR
                      </div>
                      {payment.refunded_amount && parseFloat(payment.refunded_amount) > 0 && (
                        <div className="text-xs text-red-600">
                          Remboursé: {parseFloat(payment.refunded_amount).toLocaleString()} EUR
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getMethodBadge(payment.method)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(payment.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => viewPaymentDetails(payment)}
                          className="text-blue-600 hover:text-blue-900"
                          title="Voir les détails"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {payment.status === 'completed' && (
                          <button
                            onClick={() => openRefundModal(payment)}
                            className="text-purple-600 hover:text-purple-900"
                            title="Rembourser"
                          >
                            <TrendingDown className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => updatePaymentStatus(payment.id, payment.status === 'completed' ? 'pending' : 'completed')}
                          className="text-green-600 hover:text-green-900"
                          title="Mettre à jour le statut"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deletePayment(payment.id)}
                          className="text-red-600 hover:text-red-900"
                          title="Supprimer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Détails Paiement */}
      {showDetailsModal && selectedPayment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-neutral-900">
                Détails du paiement #{selectedPayment.id}
              </h3>
              <button
                onClick={() => {
                  setShowDetailsModal(false);
                  setSelectedPayment(null);
                }}
                className="text-neutral-400 hover:text-neutral-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-neutral-900 mb-2">Informations paiement</h4>
                  <div className="bg-neutral-50 p-4 rounded-lg space-y-2">
                    <p><strong>ID:</strong> #{selectedPayment.id}</p>
                    <p><strong>ID Transaction:</strong> {selectedPayment.transaction_id || 'N/A'}</p>
                    <p><strong>Commande:</strong> #{selectedPayment.order_id}</p>
                    <p><strong>Date:</strong> {formatDate(selectedPayment.created_at)}</p>
                    <p><strong>Statut:</strong> {getStatusBadge(selectedPayment.status)}</p>
                    <p><strong>Méthode:</strong> {getMethodBadge(selectedPayment.method)}</p>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-neutral-900 mb-2">Montants</h4>
                  <div className="bg-neutral-50 p-4 rounded-lg space-y-2">
                    <p><strong>Montant original:</strong> {selectedPayment.amount ? parseFloat(selectedPayment.amount).toLocaleString() : '0'} EUR</p>
                    {selectedPayment.refunded_amount && parseFloat(selectedPayment.refunded_amount) > 0 && (
                      <p><strong>Montant remboursé:</strong> {parseFloat(selectedPayment.refunded_amount).toLocaleString()} EUR</p>
                    )}
                    <p><strong>Montant net:</strong> {
                      (selectedPayment.amount ? parseFloat(selectedPayment.amount) : 0) - 
                      (selectedPayment.refunded_amount ? parseFloat(selectedPayment.refunded_amount) : 0)
                    } EUR</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-neutral-900 mb-2">Informations client</h4>
                  <div className="bg-neutral-50 p-4 rounded-lg space-y-2">
                    <p><strong>Nom:</strong> {selectedPayment.customer_name || 'N/A'}</p>
                    <p><strong>Email:</strong> {selectedPayment.customer_email || 'N/A'}</p>
                    <p><strong>Téléphone:</strong> {selectedPayment.customer_phone || 'N/A'}</p>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-neutral-900 mb-2">Actions</h4>
                  <div className="space-y-2">
                    {selectedPayment.status === 'completed' && (
                      <button
                        onClick={() => {
                          setShowDetailsModal(false);
                          openRefundModal(selectedPayment);
                        }}
                        className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center"
                      >
                        <TrendingDown className="w-4 h-4 mr-2" />
                        Traiter un remboursement
                      </button>
                    )}
                    <select
                      value={selectedPayment.status}
                      onChange={(e) => updatePaymentStatus(selectedPayment.id, e.target.value)}
                      className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="pending">En attente</option>
                      <option value="processing">En traitement</option>
                      <option value="completed">Complété</option>
                      <option value="failed">Échoué</option>
                      <option value="cancelled">Annulé</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowDetailsModal(false);
                  setSelectedPayment(null);
                }}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Fin du tab Paiements */}
      </>}

      {/* Modal Remboursement */}
      {showRefundModal && selectedPayment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-neutral-900 mb-4">
              Rembourser le paiement #{selectedPayment.id}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Montant à rembourser (EUR)
                </label>
                <input
                  type="number"
                  value={refundAmount}
                  onChange={(e) => setRefundAmount(e.target.value)}
                  max={selectedPayment.amount}
                  step="0.01"
                  min="0.01"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
                  placeholder="0.00"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Montant maximum: {selectedPayment.amount ? parseFloat(selectedPayment.amount).toLocaleString() : '0'} EUR
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Raison du remboursement
                </label>
                <textarea
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
                  placeholder="Raison du remboursement..."
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowRefundModal(false);
                  setSelectedPayment(null);
                  setRefundAmount('');
                  setRefundReason('');
                }}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={processRefund}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                Confirmer le remboursement
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentManagement;
