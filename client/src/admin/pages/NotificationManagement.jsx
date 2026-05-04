import React, { useState, useEffect, useCallback } from 'react';
import {
  Bell,
  Plus,
  Trash2,
  Search,
  Send,
  Users,
  AlertCircle,
  Info,
  Check,
  X,
  Megaphone,
  Download,
  Filter,
  Calendar,
  Eye
} from 'lucide-react';

const NotificationManagement = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    type: 'info',
    target_type: 'all',
    target_ids: [],
    scheduled_at: '',
    is_active: true
  });

  console.log('=== NOTIFICATION MANAGEMENT COMPONENT MOUNTED ===');

  // Charger les notifications
  const loadNotifications = useCallback(async () => {
    try {
      setLoading(true);
      
      // Simuler des notifications système
      const mockNotifications = [
        {
          id: 1,
          title: 'Système opérationnel',
          message: 'Tous les services sont en ligne et fonctionnels. Aucune anomalie détectée.',
          type: 'system',
          target_type: 'all',
          created_at: new Date().toISOString(),
          is_active: true,
          scheduled_at: null,
          sent_at: new Date().toISOString()
        },
        {
          id: 2,
          title: 'Nouveaux utilisateurs inscrits',
          message: '3 nouveaux clients se sont inscrits aujourd\'hui. Bienvenue dans notre communauté!',
          type: 'info',
          target_type: 'admins',
          created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          is_active: true,
          scheduled_at: null,
          sent_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
        },
        {
          id: 3,
          title: 'Activité commerciale récente',
          message: '5 commandes ont été traitées avec succès dans les dernières 24 heures.',
          type: 'success',
          target_type: 'admins',
          created_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
          is_active: true,
          scheduled_at: null,
          sent_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString()
        },
        {
          id: 4,
          title: 'Maintenance prévue',
          message: 'Une maintenance système est prévue pour demain entre 2h et 4h du matin.',
          type: 'warning',
          target_type: 'all',
          created_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
          is_active: true,
          scheduled_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          sent_at: null
        },
        {
          id: 5,
          title: 'Promotion spéciale',
          message: 'Offre spéciale : -20% sur tous les produits cette semaine!',
          type: 'promotion',
          target_type: 'customers',
          created_at: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
          is_active: true,
          scheduled_at: null,
          sent_at: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString()
        }
      ];
      
      console.log('Notifications simulées chargées:', mockNotifications);
      setNotifications(mockNotifications);
    } catch (error) {
      console.error('Erreur lors du chargement des notifications:', error);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  // Filtrer les notifications
  const filteredNotifications = Array.isArray(notifications) ? notifications.filter(notification => {
    const matchesSearch = 
      (notification.title && notification.title.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (notification.message && notification.message.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesType = typeFilter === 'all' || notification.type === typeFilter;
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'active' && notification.is_active) ||
      (statusFilter === 'inactive' && !notification.is_active);
    
    return matchesSearch && matchesType && matchesStatus;
  }) : [];

  // Obtenir le type avec style
  const getTypeBadge = (type) => {
    const typeConfig = {
      info: { color: 'blue', text: 'Information', icon: Info },
      success: { color: 'green', text: 'Succès', icon: Check },
      warning: { color: 'yellow', text: 'Avertissement', icon: AlertCircle },
      error: { color: 'red', text: 'Erreur', icon: X },
      promotion: { color: 'purple', text: 'Promotion', icon: Megaphone },
      system: { color: 'gray', text: 'Système', icon: Bell }
    };
    
    const config = typeConfig[type] || typeConfig.info;
    const Icon = config.icon;
    
    return (
      <span className={`inline-flex items-center px-2 py-1 text-xs font-medium bg-${config.color}-100 text-${config.color}-800 rounded-full`}>
        <Icon className="w-3 h-3 mr-1" />
        {config.text}
      </span>
    );
  };

  // Obtenir la cible avec style
  const getTargetBadge = (targetType) => {
    const targetConfig = {
      all: { color: 'blue', text: 'Tous', icon: Users },
      customers: { color: 'green', text: 'Clients', icon: Users },
      admins: { color: 'purple', text: 'Admins', icon: Users },
      specific: { color: 'orange', text: 'Spécifique', icon: Users }
    };
    
    const config = targetConfig[targetType] || targetConfig.all;
    const Icon = config.icon;
    
    return (
      <span className={`inline-flex items-center px-2 py-1 text-xs font-medium bg-${config.color}-100 text-${config.color}-800 rounded-full`}>
        <Icon className="w-3 h-3 mr-1" />
        {config.text}
      </span>
    );
  };

  // Créer une notification
  const createNotification = async () => {
    try {
      if (!formData.title || !formData.message) {
        alert('Veuillez remplir les champs obligatoires');
        return;
      }

      const notificationData = {
        id: Date.now(), // ID temporaire
        ...formData,
        target_ids: formData.target_type === 'specific' ? formData.target_ids : [],
        created_at: new Date().toISOString(),
        sent_at: formData.scheduled_at ? null : new Date().toISOString()
      };

      // Simuler la création
      setNotifications(prev => [notificationData, ...prev]);
      setShowCreateModal(false);
      resetForm();
      alert('Notification créée avec succès!');
    } catch (error) {
      console.error('Erreur lors de la création de la notification:', error);
      alert('Erreur lors de la création de la notification');
    }
  };

  // Envoyer une notification
  const sendNotification = async (notificationId) => {
    try {
      // Simuler l'envoi
      setNotifications(prev => 
        prev.map(notif => 
          notif.id === notificationId 
            ? { ...notif, sent_at: new Date().toISOString() }
            : notif
        )
      );
      alert('Notification envoyée avec succès!');
    } catch (error) {
      console.error('Erreur lors de l\'envoi de la notification:', error);
      alert('Erreur lors de l\'envoi de la notification');
    }
  };

  // Supprimer une notification
  const deleteNotification = async (notificationId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette notification?')) {
      return;
    }

    try {
      // Simuler la suppression
      setNotifications(prev => prev.filter(notif => notif.id !== notificationId));
      alert('Notification supprimée avec succès!');
    } catch (error) {
      console.error('Erreur lors de la suppression de la notification:', error);
      alert('Erreur lors de la suppression de la notification');
    }
  };

  // Voir les détails d'une notification
  const viewNotificationDetails = (notification) => {
    setSelectedNotification(notification);
    setShowDetailsModal(true);
  };

  // Gérer les changements du formulaire
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Réinitialiser le formulaire
  const resetForm = () => {
    setFormData({
      title: '',
      message: '',
      type: 'info',
      target_type: 'all',
      target_ids: [],
      scheduled_at: '',
      is_active: true
    });
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
        <h2 className="text-2xl font-bold text-neutral-900">Gestion des notifications</h2>
        <div className="flex space-x-3">
          <button 
            onClick={() => {
              resetForm();
              setShowCreateModal(true);
            }}
            className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors flex items-center"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nouvelle notification
          </button>
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
              placeholder="Rechercher une notification..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div className="flex items-center space-x-2">
            <Filter className="w-5 h-5 text-neutral-400" />
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="flex-1 px-3 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">Tous les types</option>
              <option value="info">Information</option>
              <option value="success">Succès</option>
              <option value="warning">Avertissement</option>
              <option value="error">Erreur</option>
              <option value="promotion">Promotion</option>
              <option value="system">Système</option>
            </select>
          </div>
          <div className="flex items-center space-x-2">
            <Bell className="w-5 h-5 text-neutral-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="flex-1 px-3 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">Tous les statuts</option>
              <option value="active">Actives</option>
              <option value="inactive">Inactives</option>
            </select>
          </div>
        </div>
      </div>

      {/* Liste des notifications */}
      <div className="bg-white rounded-xl shadow-sm border border-neutral-200">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-neutral-50 border-b border-neutral-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Notification
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Cible
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Date
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
              ) : filteredNotifications.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-4 text-center text-neutral-500">
                    Aucune notification trouvée
                  </td>
                </tr>
              ) : (
                filteredNotifications.map((notification) => (
                  <tr key={notification.id} className="hover:bg-neutral-50">
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-neutral-900">
                          {notification.title}
                        </div>
                        <div className="text-sm text-neutral-500 truncate max-w-xs">
                          {notification.message}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getTypeBadge(notification.type)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getTargetBadge(notification.target_type)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-neutral-900">
                        <Calendar className="w-4 h-4 text-neutral-400 mr-2" />
                        {formatDate(notification.created_at)}
                      </div>
                      {notification.scheduled_at && (
                        <div className="text-xs text-neutral-500">
                          Planifié: {formatDate(notification.scheduled_at)}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${
                        notification.is_active 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {notification.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => viewNotificationDetails(notification)}
                          className="text-blue-600 hover:text-blue-900"
                          title="Voir les détails"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => sendNotification(notification.id)}
                          className="text-green-600 hover:text-green-900"
                          title="Envoyer"
                        >
                          <Send className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deleteNotification(notification.id)}
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

      {/* Modal Création Notification */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-neutral-900 mb-4">
              Créer une nouvelle notification
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Titre *
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
                  placeholder="Titre de la notification"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Message *
                </label>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleInputChange}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
                  placeholder="Message de la notification"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Type
                  </label>
                  <select
                    name="type"
                    value={formData.type}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
                  >
                    <option value="info">Information</option>
                    <option value="success">Succès</option>
                    <option value="warning">Avertissement</option>
                    <option value="error">Erreur</option>
                    <option value="promotion">Promotion</option>
                    <option value="system">Système</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cible
                  </label>
                  <select
                    name="target_type"
                    value={formData.target_type}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
                  >
                    <option value="all">Tous les utilisateurs</option>
                    <option value="customers">Clients uniquement</option>
                    <option value="admins">Admins uniquement</option>
                    <option value="specific">Utilisateurs spécifiques</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Planifier l'envoi
                </label>
                <input
                  type="datetime-local"
                  name="scheduled_at"
                  value={formData.scheduled_at}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Laissez vide pour un envoi immédiat
                </p>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="is_active"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={handleInputChange}
                  className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                />
                <label htmlFor="is_active" className="ml-2 text-sm text-gray-700">
                  Notification active
                </label>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  resetForm();
                }}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={createNotification}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                Créer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Détails Notification */}
      {showDetailsModal && selectedNotification && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-neutral-900">
                Détails de la notification #{selectedNotification.id}
              </h3>
              <button
                onClick={() => {
                  setShowDetailsModal(false);
                  setSelectedNotification(null);
                }}
                className="text-neutral-400 hover:text-neutral-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-neutral-900 mb-2">Informations générales</h4>
                <div className="bg-neutral-50 p-4 rounded-lg space-y-2">
                  <p><strong>Titre:</strong> {selectedNotification.title}</p>
                  <p><strong>Type:</strong> {getTypeBadge(selectedNotification.type)}</p>
                  <p><strong>Cible:</strong> {getTargetBadge(selectedNotification.target_type)}</p>
                  <p><strong>Statut:</strong> {selectedNotification.is_active ? 'Active' : 'Inactive'}</p>
                </div>
              </div>

              <div>
                <h4 className="font-medium text-neutral-900 mb-2">Message</h4>
                <div className="bg-neutral-50 p-4 rounded-lg">
                  <p className="whitespace-pre-wrap">{selectedNotification.message}</p>
                </div>
              </div>

              <div>
                <h4 className="font-medium text-neutral-900 mb-2">Informations système</h4>
                <div className="bg-neutral-50 p-4 rounded-lg space-y-2">
                  <p><strong>ID:</strong> #{selectedNotification.id}</p>
                  <p><strong>Créée le:</strong> {formatDate(selectedNotification.created_at)}</p>
                  <p><strong>Planifiée pour:</strong> {formatDate(selectedNotification.scheduled_at)}</p>
                  <p><strong>Envoyée le:</strong> {formatDate(selectedNotification.sent_at)}</p>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowDetailsModal(false);
                  setSelectedNotification(null);
                }}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Fermer
              </button>
              <button
                onClick={() => sendNotification(selectedNotification.id)}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center"
              >
                <Send className="w-4 h-4 mr-2" />
                Envoyer maintenant
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationManagement;
