import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Users, 
  Plus, 
  Edit, 
  Trash2, 
  Search, 
  Filter,
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  Check,
  X,
  UserPlus,
  Shield,
  Mail,
  Phone,
  Calendar,
  MapPin,
  Briefcase
} from 'lucide-react';
import userService, { getAuthConfig } from '../../services/userService';

const UserManagement = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showPassword, setShowPassword] = useState(false);

  // Formulaire pour ajouter/modifier un utilisateur
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    role: 'client',
    status: 'active',
    address: '',
    city: '',
    postalCode: '',
    country: '',
    password: '',
    confirmPassword: ''
  });

  // Charger les données depuis l'API
  const loadUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Essayer d'abord avec la vraie API (mode production)
      console.log('Tentative de connexion à la base de données...');
      try {
        const response = await userService.getUsers();
        
        // Transformer les données pour correspondre au format attendu
        const transformedUsers = response.users.map(user => ({
          id: user.id,
          firstName: user.first_name,
          lastName: user.last_name,
          email: user.email,
          phone: user.phone || '',
          role: user.role,
          status: user.status,
          address: '', // Sera chargé séparément si nécessaire
          city: '',
          postalCode: '',
          country: '',
          joinDate: user.created_at,
          lastLogin: null, // Sera ajouté si nécessaire
          totalOrders: user.order_count || 0,
          totalSpent: user.total_spent || 0
        }));

        setUsers(transformedUsers);
        setTotalPages(response.pagination.total_pages);
        setTotalUsers(response.pagination.total);
        
        console.log('Succès: Données chargées depuis la base de données MySQL');
      } catch (error) {
        console.log('Erreur avec l\'API, utilisation du mode développement:', error.message);
        
        // En cas d'erreur, utiliser le mode développement
        console.log('Fallback vers le mode développement...');
        const response = await userService.getDevelopmentUsers();
        
        const transformedUsers = response.users.map(user => ({
          id: user.id,
          firstName: user.first_name,
          lastName: user.last_name,
          email: user.email,
          phone: user.phone || '',
          role: user.role,
          status: user.status,
          address: '', 
          city: '',
          postalCode: '',
          country: '',
          joinDate: user.created_at,
          lastLogin: null,
          totalOrders: user.order_count || 0,
          totalSpent: user.total_spent || 0
        }));

        setUsers(transformedUsers);
        setTotalPages(response.pagination.total_pages);
        setTotalUsers(response.pagination.total);
        
        console.log('Mode développement: Données mockées chargées');
      }
    } catch (error) {
      console.error('Erreur lors du chargement des utilisateurs:', error);
      setError(error.message || 'Impossible de charger les utilisateurs');
    } finally {
      setLoading(false);
    }
  };

  // Charger les statistiques
  const loadStats = async () => {
    try {
      // Mode développement - utiliser le contournement sans authentification
      console.log('Mode développement: Utilisation des statistiques de contournement');
      const response = await userService.getDevelopmentStats();
      setStats(response.stats);
    } catch (error) {
      console.error('Erreur lors du chargement des statistiques:', error);
    }
  };

  useEffect(() => {
    loadUsers();
    loadStats();
  }, []); // Mode développement - pas de dépendances pour éviter les rechargements infinis

  // Les utilisateurs sont déjà filtrés et paginés par l'API
  const paginatedUsers = users;

  // Gestion du formulaire
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Ajouter un utilisateur
  const handleAddUser = async () => {
    try {
      // Validation
      if (!formData.firstName || !formData.lastName || !formData.email) {
        alert('Veuillez remplir les champs obligatoires');
        return;
      }

      if (formData.password !== formData.confirmPassword) {
        alert('Les mots de passe ne correspondent pas');
        return;
      }

      // Préparer les données pour l'API
      const userData = {
        first_name: formData.firstName,
        last_name: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
        role: formData.role,
        status: formData.status,
        address: formData.address,
        city: formData.city,
        postal_code: formData.postalCode,
        country: formData.country
      };

      // Mode développement - utilisation directe des fonctions de simulation
      console.log('Mode développement: Simulation d\'ajout d\'utilisateur (pas de base de données)');
      const result = await userService.createDevelopmentUser(userData);
      
      // Mettre à jour l'état local pour voir les changements dans l'interface
      const newUser = {
        id: result.id,
        firstName: result.first_name,
        lastName: result.last_name,
        email: result.email,
        phone: result.phone,
        role: result.role,
        status: result.status,
        address: formData.address,
        city: formData.city,
        postalCode: formData.postalCode,
        country: formData.country,
        joinDate: result.created_at,
        lastLogin: null,
        totalOrders: 0,
        totalSpent: 0
      };
      
      // Ajouter l'utilisateur à l'état local pour voir le changement immédiatement
      setUsers(prev => [...prev, newUser]);
      
      // Mettre à jour les statistiques
      setStats(prev => ({
        ...prev,
        total: prev.total + 1,
        active: result.status === 'active' ? prev.active + 1 : prev.active,
        admin: result.role === 'admin' ? prev.admin + 1 : prev.admin,
        inactive: result.status === 'inactive' ? prev.inactive + 1 : prev.inactive
      }));
      
      setShowAddModal(false);
      resetForm();
      
      alert(`Utilisateur ajouté avec succès (mode développement):\n\nID: ${result.id}\nNom: ${result.first_name} ${result.last_name}\nEmail: ${result.email}\n\nNote: Les changements ne sont pas sauvegardés en base de données.`);
    } catch (error) {
      console.error('Erreur lors de la création de l\'utilisateur:', error);
      alert(error.message || 'Impossible de créer l\'utilisateur');
    }
  };

  // Modifier un utilisateur
  const handleEditUser = async () => {
    try {
      if (!formData.firstName || !formData.lastName || !formData.email) {
        alert('Veuillez remplir les champs obligatoires');
        return;
      }

      if (formData.password && formData.password !== formData.confirmPassword) {
        alert('Les mots de passe ne correspondent pas');
        return;
      }

      // Préparer les données pour l'API
      const userData = {
        first_name: formData.firstName,
        last_name: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        role: formData.role,
        status: formData.status,
        address: formData.address,
        city: formData.city,
        postal_code: formData.postalCode,
        country: formData.country
      };

      // Ajouter le mot de passe seulement s'il est fourni
      if (formData.password) {
        userData.password = formData.password;
      }

      // Essayer d'abord avec authentification (mode production)
      console.log('Tentative de connexion à la base de données...');
      try {
        const config = await getAuthConfig();
        const response = await userService.updateUser(selectedUser.id, userData);
        
        // Mettre à jour l'état local pour voir les changements immédiatement
        setUsers(prev => prev.map(user => 
          user.id === selectedUser.id 
            ? {
                ...user,
                firstName: response.user.first_name,
                lastName: response.user.last_name,
                email: response.user.email,
                phone: response.user.phone,
                role: response.user.role,
                status: response.user.status,
                address: formData.address,
                city: formData.city,
                postal_code: formData.postalCode,
                country: formData.country,
                updated_at: response.user.updated_at
              }
            : user
        ));
        
        // Mettre à jour les statistiques si le rôle ou statut a changé
        const oldUser = users.find(u => u.id === selectedUser.id);
        if (oldUser) {
          setStats(prev => ({
            ...prev,
            active: prev.active - (oldUser.status === 'active' ? 1 : 0) + (response.user.status === 'active' ? 1 : 0),
            admin: prev.admin - (oldUser.role === 'admin' ? 1 : 0) + (response.user.role === 'admin' ? 1 : 0),
            inactive: prev.inactive - (oldUser.status === 'inactive' ? 1 : 0) + (response.user.status === 'inactive' ? 1 : 0)
          }));
        }
        
        setShowEditModal(false);
        resetForm();
        
        alert(`Utilisateur modifié avec succès!\n\nID: ${response.user.id}\nNom: ${response.user.first_name} ${response.user.last_name}\nEmail: ${response.user.email}\n\nNote: Changements sauvegardés en base de données!`);
      } catch (error) {
        console.log('Erreur avec authentification, utilisation du mode développement:', error.message);
        
        // En cas d'erreur, utiliser le mode développement
        console.log('Fallback vers le mode développement...');
        const result = await userService.updateDevelopmentUser(selectedUser.id, userData);
        
        // Mettre à jour l'état local pour voir les changements immédiatement
        setUsers(prev => prev.map(user => 
          user.id === selectedUser.id 
            ? {
                ...user,
                firstName: result.first_name,
                lastName: result.last_name,
                email: result.email,
                phone: result.phone,
                role: result.role,
                status: result.status,
                address: formData.address,
                city: formData.city,
                postal_code: formData.postalCode,
                country: formData.country,
                updated_at: result.updated_at
              }
            : user
        ));
        
        // Mettre à jour les statistiques si le rôle ou statut a changé
        const oldUser = users.find(u => u.id === selectedUser.id);
        if (oldUser) {
          setStats(prev => ({
            ...prev,
            active: prev.active - (oldUser.status === 'active' ? 1 : 0) + (result.status === 'active' ? 1 : 0),
            admin: prev.admin - (oldUser.role === 'admin' ? 1 : 0) + (result.role === 'admin' ? 1 : 0),
            inactive: prev.inactive - (oldUser.status === 'inactive' ? 1 : 0) + (result.status === 'inactive' ? 1 : 0)
          }));
        }
        
        setShowEditModal(false);
        resetForm();
        
        alert(`Utilisateur modifié (mode développement):\n\nID: ${result.id}\nNom: ${result.first_name} ${result.last_name}\nEmail: ${result.email}\n\nNote: Les changements ne sont pas sauvegardés en base de données.`);
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour de l\'utilisateur:', error);
      alert(error.message || 'Impossible de mettre à jour l\'utilisateur');
    }
  };

  // Supprimer un utilisateur
  const handleDeleteUser = async () => {
    try {
      // Essayer d'abord avec authentification (mode production)
      console.log('Tentative de connexion à la base de données...');
      try {
        const config = await getAuthConfig();
        const response = await userService.deleteUser(selectedUser.id);
        
        // Supprimer l'utilisateur de l'état local pour voir le changement immédiatement
        setUsers(prev => prev.filter(user => user.id !== selectedUser.id));
        
        // Mettre à jour les statistiques
        const deletedUser = users.find(u => u.id === selectedUser.id);
        if (deletedUser) {
          setStats(prev => ({
            ...prev,
            total: prev.total - 1,
            active: deletedUser.status === 'active' ? prev.active - 1 : prev.active,
            admin: deletedUser.role === 'admin' ? prev.admin - 1 : prev.admin,
            inactive: deletedUser.status === 'inactive' ? prev.inactive - 1 : prev.inactive
          }));
        }
        
        setShowDeleteModal(false);
        setSelectedUser(null);
        
        alert(`Utilisateur supprimé avec succès!\n\nID: ${response.deletedUserId}\nNom: ${selectedUser.firstName} ${selectedUser.lastName}\nEmail: ${selectedUser.email}\n\nNote: Changement sauvegardé en base de données MySQL!`);
      } catch (error) {
        console.log('Erreur avec authentification, utilisation du mode développement:', error.message);
        
        // En cas d'erreur, utiliser le mode développement
        console.log('Fallback vers le mode développement...');
        const result = await userService.deleteDevelopmentUser(selectedUser.id);
        
        // Supprimer l'utilisateur de l'état local pour voir le changement immédiatement
        setUsers(prev => prev.filter(user => user.id !== selectedUser.id));
        
        // Mettre à jour les statistiques
        const deletedUser = users.find(u => u.id === selectedUser.id);
        if (deletedUser) {
          setStats(prev => ({
            ...prev,
            total: prev.total - 1,
            active: deletedUser.status === 'active' ? prev.active - 1 : prev.active,
            admin: deletedUser.role === 'admin' ? prev.admin - 1 : prev.admin,
            inactive: deletedUser.status === 'inactive' ? prev.inactive - 1 : prev.inactive
          }));
        }
        
        setShowDeleteModal(false);
        setSelectedUser(null);
        
        alert(`Utilisateur supprimé (mode développement):\n\nID: ${result.deletedUserId}\nNom: ${selectedUser.firstName} ${selectedUser.lastName}\nEmail: ${selectedUser.email}\n\nNote: Les changements ne sont pas sauvegardés en base de données.`);
      }
    } catch (error) {
      console.error('Erreur lors de la suppression de l\'utilisateur:', error);
      alert(error.message || 'Impossible de supprimer l\'utilisateur');
    }
  };

  // Réinitialiser le formulaire
  const resetForm = () => {
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      role: 'client',
      status: 'active',
      address: '',
      city: '',
      postalCode: '',
      country: '',
      password: '',
      confirmPassword: ''
    });
    setSelectedUser(null);
  };

  // Ouvrir le modal d'édition
  const openEditModal = (user) => {
    setSelectedUser(user);
    setFormData({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone,
      role: user.role,
      status: user.status,
      address: user.address,
      city: user.city,
      postalCode: user.postalCode,
      country: user.country,
      password: '',
      confirmPassword: ''
    });
    setShowEditModal(true);
  };

  // Ouvrir le modal de suppression
  const openDeleteModal = (user) => {
    setSelectedUser(user);
    setShowDeleteModal(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement des utilisateurs...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <X className="h-6 w-6 text-red-600" />
          </div>
          <p className="text-red-600 font-medium mb-2">Erreur de chargement</p>
          <p className="text-gray-600 text-sm mb-4">{error}</p>
          <div className="flex flex-col sm:flex-row gap-2 justify-center">
            <button
              onClick={loadUsers}
              className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800"
            >
              Réessayer
            </button>
            <button
              onClick={async () => {
                try {
                  await userService.forceRefreshToken();
                  await loadUsers();
                } catch (tokenError) {
                  console.error('Erreur lors du forçage du token:', tokenError);
                }
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Rafraîchir le token
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Gestion des Utilisateurs</h1>
            <p className="text-gray-600 mt-1">Gérez les comptes utilisateurs et leurs permissions</p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800"
          >
            <UserPlus className="h-5 w-5" />
            <span>Ajouter un utilisateur</span>
          </button>
        </div>
        
        {/* Indicateur Mode Développement */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-6">
          <div className="flex items-center">
            <div className="w-2 h-2 bg-yellow-400 rounded-full mr-3 animate-pulse"></div>
            <div className="flex-1">
              <p className="text-sm font-medium text-yellow-800">
                Mode Développement Actif
              </p>
              <p className="text-xs text-yellow-600 mt-1">
                Utilisation de données mockées et contournement d'authentification. Les modifications ne seront pas sauvegardées.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Utilisateurs</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.total || 0}</p>
            </div>
            <Users className="h-8 w-8 text-gray-400" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Utilisateurs Actifs</p>
              <p className="text-2xl font-bold text-green-600">
                {stats?.active || 0}
              </p>
            </div>
            <Check className="h-8 w-8 text-green-400" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Administrateurs</p>
              <p className="text-2xl font-bold text-blue-600">
                {stats?.admin || 0}
              </p>
            </div>
            <Shield className="h-8 w-8 text-blue-400" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Inactifs</p>
              <p className="text-2xl font-bold text-red-600">
                {stats?.inactive || 0}
              </p>
            </div>
            <X className="h-8 w-8 text-red-400" />
          </div>
        </div>
      </div>

      {/* Filtres et recherche */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher par nom, email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
              />
            </div>
          </div>
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
          >
            <option value="all">Tous les rôles</option>
            <option value="admin">Administrateurs</option>
            <option value="client">Clients</option>
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
          >
            <option value="all">Tous les statuts</option>
            <option value="active">Actifs</option>
            <option value="inactive">Inactifs</option>
          </select>
        </div>
      </div>

      {/* Tableau des utilisateurs */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Utilisateur
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rôle
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Statut
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Commandes
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-10 w-10 flex-shrink-0">
                        <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                          <span className="text-gray-600 font-medium">
                            {user.firstName.charAt(0)}{user.lastName.charAt(0)}
                          </span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {user.firstName} {user.lastName}
                        </div>
                        <div className="text-sm text-gray-500">
                          Membre depuis {new Date(user.joinDate).toLocaleDateString('fr-FR')}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{user.email}</div>
                    <div className="text-sm text-gray-500">{user.phone}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      user.role === 'admin' 
                        ? 'bg-blue-100 text-blue-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {user.role === 'admin' ? 'Administrateur' : 'Client'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      user.status === 'active' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {user.status === 'active' ? 'Actif' : 'Inactif'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div>{user.totalOrders} commandes</div>
                    <div className="text-gray-500">{user.totalSpent.toFixed(2)} EUR</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => openEditModal(user)}
                        className="text-gray-600 hover:text-gray-900"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => openDeleteModal(user)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Affichage de {((currentPage - 1) * 10) + 1} à {Math.min(currentPage * 10, totalUsers)} sur {totalUsers} utilisateurs
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="px-3 py-1 text-sm text-gray-700">
                Page {currentPage} sur {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal Ajouter/Modifier Utilisateur */}
      {(showAddModal || showEditModal) && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75" onClick={() => {
              setShowAddModal(false);
              setShowEditModal(false);
              resetForm();
            }} />
            <div className="relative bg-white rounded-lg max-w-2xl w-full p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">
                {showAddModal ? 'Ajouter un utilisateur' : 'Modifier un utilisateur'}
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Prénom *
                  </label>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nom *
                  </label>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email *
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Téléphone
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Rôle
                  </label>
                  <select
                    name="role"
                    value={formData.role}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
                  >
                    <option value="client">Client</option>
                    <option value="admin">Administrateur</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Statut
                  </label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
                  >
                    <option value="active">Actif</option>
                    <option value="inactive">Inactif</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mot de passe {showAddModal ? '*' : '(laisser vide pour ne pas changer)'}
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
                      required={showAddModal}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Confirmer le mot de passe {showAddModal ? '*' : ''}
                  </label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
                    required={showAddModal}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Adresse
                  </label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ville
                  </label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Code Postal
                  </label>
                  <input
                    type="text"
                    name="postalCode"
                    value={formData.postalCode}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Pays
                  </label>
                  <input
                    type="text"
                    name="country"
                    value={formData.country}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    setShowEditModal(false);
                    resetForm();
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Annuler
                </button>
                <button
                  onClick={showAddModal ? handleAddUser : handleEditUser}
                  className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800"
                >
                  {showAddModal ? 'Ajouter' : 'Modifier'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Suppression */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75" onClick={() => {
              setShowDeleteModal(false);
              setSelectedUser(null);
            }} />
            <div className="relative bg-white rounded-lg max-w-md w-full p-6">
              <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full mb-4">
                <Trash2 className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 text-center mb-2">
                Supprimer l'utilisateur
              </h3>
              <p className="text-gray-600 text-center mb-6">
                Êtes-vous sûr de vouloir supprimer l'utilisateur "{selectedUser?.firstName} {selectedUser?.lastName}" ? Cette action est irréversible.
              </p>
              <div className="flex justify-center space-x-3">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setSelectedUser(null);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Annuler
                </button>
                <button
                  onClick={handleDeleteUser}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  Supprimer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
