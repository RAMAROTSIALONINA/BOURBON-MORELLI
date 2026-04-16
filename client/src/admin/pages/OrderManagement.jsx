import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ShoppingCart, 
  Edit, 
  Trash2, 
  Search, 
  Plus,
  Eye,
  Check,
  X,
  Clock,
  Truck,
  Package,
  DollarSign,
  User,
  Calendar,
  Filter,
  Download
} from 'lucide-react';
import orderService from '../../services/orderService';

const OrderManagement = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  console.log('=== ORDER MANAGEMENT COMPONENT MOUNTED ===');

  // Charger les commandes
  const loadOrders = useCallback(async () => {
    try {
      setLoading(true);
      const response = await orderService.getAllOrders();
      console.log('=== LOAD ORDERS RESPONSE ===');
      console.log('Response:', response);
      console.log('Response type:', typeof response);
      console.log('Is array:', Array.isArray(response));
      
      // Gérer différents formats de réponse
      let ordersData = [];
      if (Array.isArray(response)) {
        ordersData = response;
      } else if (response && Array.isArray(response.data)) {
        ordersData = response.data;
      } else if (response && response.orders && Array.isArray(response.orders)) {
        ordersData = response.orders;
      } else {
        console.warn('Format de réponse inattendu:', response);
      }
      
      console.log('Orders data:', ordersData);
      setOrders(ordersData);
    } catch (error) {
      console.error('Erreur lors du chargement des commandes:', error);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  // Filtrer les commandes
  const filteredOrders = Array.isArray(orders) ? orders.filter(order => {
    const matchesSearch = 
      (order.id && order.id.toString().includes(searchTerm.toLowerCase())) ||
      (order.customer_name && order.customer_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (order.customer_email && order.customer_email.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  }) : [];

  // Obtenir le statut avec style
  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { color: 'yellow', text: 'En attente', icon: Clock },
      processing: { color: 'blue', text: 'En traitement', icon: Package },
      shipped: { color: 'purple', text: 'Expédiée', icon: Truck },
      delivered: { color: 'green', text: 'Livrée', icon: Check },
      cancelled: { color: 'red', text: 'Annulée', icon: X }
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

  // Mettre à jour le statut d'une commande
  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      await orderService.updateOrderStatus(orderId, { status: newStatus });
      await loadOrders();
      alert('Statut de la commande mis à jour avec succès!');
    } catch (error) {
      console.error('Erreur lors de la mise à jour du statut:', error);
      alert('Erreur lors de la mise à jour du statut');
    }
  };

  // Supprimer une commande
  const deleteOrder = async (orderId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette commande?')) {
      return;
    }

    try {
      await orderService.deleteOrder(orderId);
      await loadOrders();
      alert('Commande supprimée avec succès!');
    } catch (error) {
      console.error('Erreur lors de la suppression de la commande:', error);
      alert('Erreur lors de la suppression de la commande');
    }
  };

  // Voir les détails d'une commande
  const viewOrderDetails = (order) => {
    setSelectedOrder(order);
    setShowDetailsModal(true);
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

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-neutral-900">Gestion des commandes</h2>
        <div className="flex space-x-3">
          <button className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors flex items-center">
            <Download className="w-4 h-4 mr-2" />
            Exporter
          </button>
        </div>
      </div>

      {/* Filtres */}
      <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Rechercher une commande (ID, client, email)..."
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
              <option value="shipped">Expédiée</option>
              <option value="delivered">Livrée</option>
              <option value="cancelled">Annulée</option>
            </select>
          </div>
        </div>
      </div>

      {/* Liste des commandes */}
      <div className="bg-white rounded-xl shadow-sm border border-neutral-200">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-neutral-50 border-b border-neutral-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Commande
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Client
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Total
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
                  <td colSpan="6" className="px-6 py-4 text-center text-neutral-500">
                    Chargement...
                  </td>
                </tr>
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-4 text-center text-neutral-500">
                    Aucune commande trouvée
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-neutral-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-neutral-900">
                        #{order.id}
                      </div>
                      <div className="text-sm text-neutral-500">
                        {order.items?.length || 0} article(s)
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <User className="w-4 h-4 text-neutral-400 mr-2" />
                        <div>
                          <div className="text-sm font-medium text-neutral-900">
                            {order.customer_name || 'Client inconnu'}
                          </div>
                          <div className="text-sm text-neutral-500">
                            {order.customer_email || 'Email non disponible'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-neutral-900">
                        <Calendar className="w-4 h-4 text-neutral-400 mr-2" />
                        {formatDate(order.created_at)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm font-medium text-neutral-900">
                        <DollarSign className="w-4 h-4 text-neutral-400 mr-1" />
                        {order.total_amount ? order.total_amount.toLocaleString() : '0'} EUR
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(order.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => viewOrderDetails(order)}
                          className="text-blue-600 hover:text-blue-900"
                          title="Voir les détails"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => updateOrderStatus(order.id, order.status === 'delivered' ? 'processing' : 'delivered')}
                          className="text-green-600 hover:text-green-900"
                          title="Mettre à jour le statut"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deleteOrder(order.id)}
                          className="text-red-600 hover:text-red-900"
                          title="Supprimer la commande"
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

      {/* Modal Détails Commande */}
      {showDetailsModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-neutral-900">
                Détails de la commande #{selectedOrder.id}
              </h3>
              <button
                onClick={() => {
                  setShowDetailsModal(false);
                  setSelectedOrder(null);
                }}
                className="text-neutral-400 hover:text-neutral-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-neutral-900 mb-2">Informations client</h4>
                  <div className="bg-neutral-50 p-4 rounded-lg">
                    <p><strong>Nom:</strong> {selectedOrder.customer_name || 'N/A'}</p>
                    <p><strong>Email:</strong> {selectedOrder.customer_email || 'N/A'}</p>
                    <p><strong>Téléphone:</strong> {selectedOrder.customer_phone || 'N/A'}</p>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-neutral-900 mb-2">Adresse de livraison</h4>
                  <div className="bg-neutral-50 p-4 rounded-lg">
                    <p>{selectedOrder.shipping_address || 'N/A'}</p>
                    <p>{selectedOrder.shipping_city || ''} {selectedOrder.shipping_postal_code || ''}</p>
                    <p>{selectedOrder.shipping_country || ''}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-neutral-900 mb-2">Informations commande</h4>
                  <div className="bg-neutral-50 p-4 rounded-lg">
                    <p><strong>Date:</strong> {formatDate(selectedOrder.created_at)}</p>
                    <p><strong>Statut:</strong> {getStatusBadge(selectedOrder.status)}</p>
                    <p><strong>Paiement:</strong> {selectedOrder.payment_status || 'N/A'}</p>
                    <p><strong>Total:</strong> {selectedOrder.total_amount ? selectedOrder.total_amount.toLocaleString() : '0'} EUR</p>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-neutral-900 mb-2">Actions</h4>
                  <div className="space-y-2">
                    <select
                      value={selectedOrder.status}
                      onChange={(e) => updateOrderStatus(selectedOrder.id, e.target.value)}
                      className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="pending">En attente</option>
                      <option value="processing">En traitement</option>
                      <option value="shipped">Expédiée</option>
                      <option value="delivered">Livrée</option>
                      <option value="cancelled">Annulée</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-medium text-neutral-900 mb-4">Articles commandés</h4>
              <div className="border border-neutral-200 rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-neutral-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-sm font-medium text-neutral-700">Produit</th>
                      <th className="px-4 py-2 text-left text-sm font-medium text-neutral-700">Quantité</th>
                      <th className="px-4 py-2 text-left text-sm font-medium text-neutral-700">Prix unitaire</th>
                      <th className="px-4 py-2 text-left text-sm font-medium text-neutral-700">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200">
                    {selectedOrder.items && selectedOrder.items.length > 0 ? (
                      selectedOrder.items.map((item, index) => (
                        <tr key={index}>
                          <td className="px-4 py-3">
                            <div>
                              <p className="font-medium text-neutral-900">{item.product_name}</p>
                              {item.product_image && (
                                <img 
                                  src={item.product_image} 
                                  alt={item.product_name}
                                  className="w-12 h-12 object-cover rounded mt-2"
                                />
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-neutral-900">{item.quantity}</td>
                          <td className="px-4 py-3 text-neutral-900">{item.price ? item.price.toLocaleString() : '0'} EUR</td>
                          <td className="px-4 py-3 font-medium text-neutral-900">
                            {(item.price * item.quantity).toLocaleString()} EUR
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="4" className="px-4 py-3 text-center text-neutral-500">
                          Aucun article trouvé
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowDetailsModal(false);
                  setSelectedOrder(null);
                }}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
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

export default OrderManagement;
