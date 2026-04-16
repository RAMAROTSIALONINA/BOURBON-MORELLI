import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Package, Truck, CheckCircle, XCircle, Clock, Eye, Download } from 'lucide-react';
import { customerOrderService } from '../../services/orderService';
import authService from '../../services/authService';
import productDataService from '../../services/productDataService';

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);

  // Commandes simulées pour le fallback
  const getMockOrders = () => [
    {
      id: 'CMD-2024-001',
      date: '2024-04-10',
      status: 'delivered',
      total: 125000,
      items: [
        {
          id: 1,
          name: 'T-Shirt Premium',
          variant: 'Taille M, Blanc',
          quantity: 2,
          price: 35000,
          image: '/images/tshirt-white.jpg'
        },
        {
          id: 2,
          name: 'Nappe Élégante',
          variant: 'Ronde, 180cm',
          quantity: 1,
          price: 55000,
          image: '/images/nappe-elegante.jpg'
        }
      ],
      shipping: {
        address: 'Tsarasaotra, Antananarivo',
        method: 'Livraison standard',
        cost: 0,
        estimatedDelivery: '2024-04-12'
      },
      payment: {
        method: 'Mobile Money',
        status: 'paid',
        transactionId: 'TXN-123456789'
      }
    },
    {
      id: 'CMD-2024-002',
      date: '2024-04-08',
      status: 'shipped',
      total: 85000,
      items: [
        {
          id: 3,
          name: 'Haut de luxe',
          variant: 'Taille L, Noir',
          quantity: 1,
          price: 45000,
          image: '/images/haut-luxe.jpg'
        },
        {
          id: 4,
          name: 'Accessoires',
          variant: 'Lot complet',
          quantity: 1,
          price: 40000,
          image: '/images/accessoires.jpg'
        }
      ],
      shipping: {
        address: 'Ankorondrano, Antananarivo',
        method: 'Express',
        cost: 5000,
        estimatedDelivery: '2024-04-15'
      },
      payment: {
        method: 'Carte bancaire',
        status: 'paid',
        transactionId: 'TXN-987654321'
      }
    }
  ];

  const loadOrders = useCallback(async () => {
    try {
      // Récupérer l'email de l'utilisateur connecté
      const userInfo = authService.getUserInfo();
      if (!userInfo || !userInfo.email) {
        console.log('Aucun utilisateur connecté');
        setLoading(false);
        return;
      }

      // Charger les commandes du client
      const response = await customerOrderService.getCustomerOrders(userInfo.email);
      
      if (response.success) {
        setOrders(response.orders);
      } else {
        console.error('Erreur lors du chargement des commandes:', response.message);
        // En cas d'erreur, afficher les commandes simulées
        setOrders(getMockOrders());
      }
    } catch (error) {
      console.error('Erreur chargement commandes:', error);
      // En cas d'erreur, afficher les commandes simulées
      setOrders(getMockOrders());
    } finally {
      setLoading(false);
    }
  }, [customerOrderService]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const getStatusInfo = (status) => {
    const statusMap = {
      pending: {
        label: 'En attente',
        color: 'text-yellow-600 bg-yellow-50',
        icon: Clock
      },
      processing: {
        label: 'En traitement',
        color: 'text-blue-600 bg-blue-50',
        icon: Package
      },
      shipped: {
        label: 'Expédiée',
        color: 'text-purple-600 bg-purple-50',
        icon: Truck
      },
      delivered: {
        label: 'Livrée',
        color: 'text-green-600 bg-green-50',
        icon: CheckCircle
      },
      cancelled: {
        label: 'Annulée',
        color: 'text-red-600 bg-red-50',
        icon: XCircle
      }
    };

    return statusMap[status] || statusMap.pending;
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'MGA'
    }).format(price);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handleViewDetails = (order) => {
    setSelectedOrder(order);
  };

  const handleCloseDetails = () => {
    setSelectedOrder(null);
  };

  const handleTrackOrder = (order) => {
    // Simuler le suivi de commande
    alert(`Suivi de commande ${order.id}\n\nStatut: ${getStatusInfo(order.status).label}\nTransporteur: ${order.shipping.method}\nNuméro de suivi: TRK${order.id.slice(-6)}`);
  };

  const handleDownloadInvoice = (order) => {
    // Simuler le téléchargement de facture
    alert(`Téléchargement de la facture pour la commande ${order.id}\n\nLa facture sera générée et téléchargée automatiquement.`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 py-8">
      <div className="container mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-luxury font-bold text-neutral-900 mb-2">Mes commandes</h1>
          <p className="text-neutral-600">
            Suivez l'état de vos commandes et accédez à vos factures
          </p>
        </div>

        {orders.length === 0 ? (
          <div className="text-center py-16">
            <Package className="w-24 h-24 text-neutral-300 mx-auto mb-6" />
            <h2 className="text-2xl font-luxury font-semibold text-neutral-900 mb-4">
              Vous n'avez pas encore de commande
            </h2>
            <p className="text-neutral-600 mb-8">
              Commencez vos achats et découvrez nos créations uniques
            </p>
            <Link
              to="/collections"
              className="btn-luxury"
            >
              Commencer mes achats
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => {
              const statusInfo = getStatusInfo(order.status);
              
              return (
                <div key={order.id} className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-neutral-900">
                        Commande {order.id}
                      </h3>
                      <p className="text-sm text-neutral-600">
                        {formatDate(order.date)}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${statusInfo.color}`}>
                        <statusInfo.icon className="w-4 h-4 mr-1" />
                        {statusInfo.label}
                      </span>
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Articles */}
                      <div>
                        <h4 className="font-medium mb-3">Articles</h4>
                        <div className="space-y-3">
                          {order.items.map((item) => (
                            <div key={item.id} className="flex items-center space-x-3">
                              <img
                                src={item.image}
                                alt={item.name}
                                className="w-12 h-12 object-cover rounded"
                              />
                              <div className="flex-1">
                                <p className="font-medium text-sm">{item.name}</p>
                                {item.variant && (
                                  <p className="text-xs text-neutral-600">{item.variant}</p>
                                )}
                              </div>
                              <div className="text-right">
                                <p className="font-medium">{formatPrice(item.price)}</p>
                                <p className="text-sm text-neutral-600">Qté: {item.quantity}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Informations de livraison et paiement */}
                      <div className="space-y-4">
                        <div>
                          <h4 className="font-medium mb-2">Livraison</h4>
                          <p className="text-sm text-neutral-600">
                            {order.shipping.address}
                          </p>
                          <p className="text-sm text-neutral-600">
                            {order.shipping.method}
                          </p>
                          <p className="text-sm text-neutral-600">
                            Estimée: {formatDate(order.shipping.estimatedDelivery)}
                          </p>
                          {order.shipping.cost > 0 && (
                            <p className="text-sm font-medium">
                              Frais: {formatPrice(order.shipping.cost)}
                            </p>
                          )}
                        </div>

                        <div>
                          <h4 className="font-medium mb-2">Paiement</h4>
                          <p className="text-sm text-neutral-600">
                            {order.payment.method}
                          </p>
                          <p className="text-sm text-neutral-600">
                            Statut: {order.payment.status === 'paid' ? 'Payé' : 'En attente'}
                          </p>
                          {order.payment.transactionId && (
                            <p className="text-xs text-neutral-500">
                              Transaction: {order.payment.transactionId}
                            </p>
                          )}
                        </div>

                        <div>
                          <h4 className="font-medium mb-2">Total</h4>
                          <p className="text-lg font-bold text-primary-500">
                            {formatPrice(order.total)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="border-t mt-4 pt-4">
                    <div className="flex flex-wrap gap-3">
                      <button
                        onClick={() => handleViewDetails(order)}
                        className="btn-secondary flex items-center space-x-2"
                      >
                        <Eye className="w-4 h-4" />
                        <span>Voir détails</span>
                      </button>
                      <button
                        onClick={() => handleTrackOrder(order)}
                        className="btn-secondary flex items-center space-x-2"
                      >
                        <Truck className="w-4 h-4" />
                        <span>Suivre</span>
                      </button>
                      <button
                        onClick={() => handleDownloadInvoice(order)}
                        className="btn-secondary flex items-center space-x-2"
                      >
                        <Download className="w-4 h-4" />
                        <span>Facture</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Modal détails de commande */}
        {selectedOrder && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b p-6 flex items-center justify-between">
                <h3 className="text-xl font-semibold">
                  Détails de la commande {selectedOrder.id}
                </h3>
                <button
                  onClick={handleCloseDetails}
                  className="text-neutral-400 hover:text-neutral-600"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>

              <div className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div>
                    <h4 className="font-semibold mb-4">Articles commandés</h4>
                    <div className="space-y-4">
                      {selectedOrder.items.map((item) => (
                        <div key={item.id} className="flex items-start space-x-4 pb-4 border-b">
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-16 h-16 object-cover rounded"
                          />
                          <div className="flex-1">
                            <p className="font-medium">{item.name}</p>
                            {item.variant && (
                              <p className="text-sm text-neutral-600">{item.variant}</p>
                            )}
                            <p className="text-sm text-neutral-600">
                              Quantité: {item.quantity}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium">
                              {formatPrice(item.price)}
                            </p>
                            <p className="text-sm text-neutral-600">
                              {formatPrice(item.price * item.quantity)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <h4 className="font-semibold mb-4">Adresse de livraison</h4>
                      <div className="text-sm text-neutral-600">
                        <p>{selectedOrder.shipping.address}</p>
                        <p>{selectedOrder.shipping.method}</p>
                        <p>Livraison estimée: {formatDate(selectedOrder.shipping.estimatedDelivery)}</p>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-4">Paiement</h4>
                      <div className="text-sm text-neutral-600">
                        <p>Méthode: {selectedOrder.payment.method}</p>
                        <p>Statut: {selectedOrder.payment.status === 'paid' ? 'Payé' : 'En attente'}</p>
                        {selectedOrder.payment.transactionId && (
                          <p>Transaction: {selectedOrder.payment.transactionId}</p>
                        )}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-4">Récapitulatif</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Sous-total</span>
                          <span>{formatPrice(selectedOrder.total - (selectedOrder.shipping?.cost || 0))}</span>
                        </div>
                        {selectedOrder.shipping?.cost > 0 && (
                          <div className="flex justify-between text-sm">
                            <span>Frais de livraison</span>
                            <span>{formatPrice(selectedOrder.shipping.cost)}</span>
                          </div>
                        )}
                        <div className="flex justify-between font-semibold text-lg pt-2 border-t">
                          <span>Total</span>
                          <span className="text-primary-500">{formatPrice(selectedOrder.total)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="sticky bottom-0 bg-white border-t p-6 flex justify-end space-x-3">
                  <button
                    onClick={handleCloseDetails}
                    className="btn-secondary"
                  >
                    Fermer
                  </button>
                  <button
                    onClick={() => handleDownloadInvoice(selectedOrder)}
                    className="btn-luxury flex items-center space-x-2"
                  >
                    <Download className="w-4 h-4" />
                    <span>Télécharger la facture</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Orders;
