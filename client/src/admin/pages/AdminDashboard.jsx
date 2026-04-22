import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Users,
  ShoppingBag,
  Package,
  Eye,
  Edit,
  Trash2,
  DollarSign
} from 'lucide-react';
import ProductManagement from './ProductManagement';
import OrderManagement from './OrderManagement';
import CustomerManagement from './CustomerManagement';
import PaymentManagement from './PaymentManagement';
import NotificationManagement from './NotificationManagement';
import CategoryManagement from './CategoryManagement';
import ActivityHistory from './ActivityHistory';
import DashboardOverview from './DashboardOverview';
import Analytics from './Analytics';
import Reports from './Reports';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  // const [adminUser, setAdminUser] = useState(null);

  useEffect(() => {
    // Vérifier l'authentification
    let token = localStorage.getItem('adminToken');
    // let user = localStorage.getItem('adminUser');
    
    // Rediriger vers login si non authentifié
    if (!token) {
      navigate('/admin/login');
      return;
    }
    
    // if (user) {
    //   setAdminUser(JSON.parse(user));
    // }
  }, [navigate]);

  // Données mockées pour le dashboard
  const stats = {
    totalOrders: 1247,
    totalRevenue: 45678,
    totalCustomers: 892,
    totalProducts: 24,
    todayOrders: 23,
    todayRevenue: 1234,
    pendingOrders: 8,
    lowStock: 3
  };

  const recentOrders = [
    { id: 1, customer: 'Jean Dupont', amount: 89.99, status: 'delivered', date: '2024-01-15' },
    { id: 2, customer: 'Marie Martin', amount: 129.99, status: 'processing', date: '2024-01-15' },
    { id: 3, customer: 'Pierre Bernard', amount: 59.99, status: 'pending', date: '2024-01-14' },
    { id: 4, customer: 'Sophie Petit', amount: 199.99, status: 'shipped', date: '2024-01-14' },
    { id: 5, customer: 'Lucas Leroy', amount: 79.99, status: 'delivered', date: '2024-01-13' }
  ];

  const topProducts = [
    { id: 1, name: 'Nappe de Table Luxe', price: 89.99, stock: 15, sold: 45 },
    { id: 2, name: 'T-shirt Premium', price: 39.99, stock: 32, sold: 67 },
    { id: 3, name: 'Polo Classique', price: 49.99, stock: 8, sold: 34 },
    { id: 4, name: 'Pantalon Chic', price: 79.99, stock: 21, sold: 28 }
  ];

  // Déterminer la section active basée sur l'URL
  const getActiveSection = () => {
    const path = location.pathname;
    console.log('=== ACTIVE SECTION CHECK ===');
    console.log('Current path:', path);
    
    let section = 'overview';
    if (path.includes('/products')) section = 'products';
    else if (path.includes('/orders')) section = 'orders';
    else if (path.includes('/customers')) section = 'customers';
    else if (path.includes('/payments')) section = 'payments';
    else if (path.includes('/notifications')) section = 'notifications';
    else if (path.includes('/history')) section = 'history';
    else if (path.includes('/analytics')) section = 'analytics';
    else if (path.includes('/reports')) section = 'reports';
    else if (path.includes('/settings')) section = 'settings';
    
    console.log('Determined section:', section);
    return section;
  };

  const activeSection = getActiveSection();
  console.log('=== RENDERING ADMIN DASHBOARD ===');
  console.log('Active section:', activeSection);

  const renderContent = () => {
    switch (activeSection) {
      case 'overview':
        return <DashboardOverview />;

      case 'overview_old_DISABLED':
        return (
          <div className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white p-6 rounded-xl shadow-sm border border-neutral-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-neutral-600">Commandes totales</p>
                    <p className="text-2xl font-bold text-neutral-900">{stats.totalOrders}</p>
                  </div>
                  <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                    <ShoppingBag className="w-6 h-6 text-primary-600" />
                  </div>
                </div>
                <div className="mt-4 flex items-center text-sm">
                  <span className="text-green-600">+12%</span>
                  <span className="text-neutral-600 ml-2">vs mois dernier</span>
                </div>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-sm border border-neutral-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-neutral-600">Revenus totaux</p>
                    <p className="text-2xl font-bold text-neutral-900">{stats.totalRevenue.toLocaleString()} EUR</p>
                  </div>
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <DollarSign className="w-6 h-6 text-green-600" />
                  </div>
                </div>
                <div className="mt-4 flex items-center text-sm">
                  <span className="text-green-600">+8%</span>
                  <span className="text-neutral-600 ml-2">vs mois dernier</span>
                </div>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-sm border border-neutral-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-neutral-600">Clients</p>
                    <p className="text-2xl font-bold text-neutral-900">{stats.totalCustomers}</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Users className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
                <div className="mt-4 flex items-center text-sm">
                  <span className="text-green-600">+15%</span>
                  <span className="text-neutral-600 ml-2">vs mois dernier</span>
                </div>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-sm border border-neutral-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-neutral-600">Produits</p>
                    <p className="text-2xl font-bold text-neutral-900">{stats.totalProducts}</p>
                  </div>
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Package className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
                <div className="mt-4 flex items-center text-sm">
                  <span className="text-neutral-600">+2 nouveaux</span>
                  <span className="text-neutral-600 ml-2">ce mois</span>
                </div>
              </div>
            </div>

            {/* Recent Orders */}
            <div className="bg-white rounded-xl shadow-sm border border-neutral-200">
              <div className="p-6 border-b border-neutral-200">
                <h3 className="text-lg font-semibold text-neutral-900">Commandes récentes</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-neutral-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Commande</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Client</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Montant</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Statut</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-neutral-200">
                    {recentOrders.map((order) => (
                      <tr key={order.id} className="hover:bg-neutral-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-neutral-900">#{order.id}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-600">{order.customer}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900">{order.amount} EUR</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                            order.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                            order.status === 'shipped' ? 'bg-purple-100 text-purple-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {order.status === 'delivered' ? 'Livrée' :
                             order.status === 'processing' ? 'En traitement' :
                             order.status === 'shipped' ? 'Expédiée' : 'En attente'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-600">{order.date}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button className="text-primary-600 hover:text-primary-900 mr-3">
                            <Eye className="w-4 h-4" />
                          </button>
                          <button className="text-neutral-600 hover:text-neutral-900">
                            <Edit className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Top Products */}
            <div className="bg-white rounded-xl shadow-sm border border-neutral-200">
              <div className="p-6 border-b border-neutral-200">
                <h3 className="text-lg font-semibold text-neutral-900">Produits populaires</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-neutral-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Produit</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Prix</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Stock</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Vendus</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-neutral-200">
                    {topProducts.map((product) => (
                      <tr key={product.id} className="hover:bg-neutral-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-10 h-10 bg-neutral-200 rounded-lg flex-shrink-0"></div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-neutral-900">{product.name}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900">{product.price} EUR</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            product.stock < 10 ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                          }`}>
                            {product.stock}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900">{product.sold}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button className="text-primary-600 hover:text-primary-900 mr-3">
                            <Edit className="w-4 h-4" />
                          </button>
                          <button className="text-red-600 hover:text-red-900">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );

      case 'orders':
        return <OrderManagement />;

      case 'products':
        console.log('=== RENDERING PRODUCT MANAGEMENT ===');
        return <ProductManagement />;

      case 'customers':
        return <CustomerManagement />;

      case 'payments':
        return <PaymentManagement />;

      case 'notifications':
        return <NotificationManagement />;

      case 'history':
        return <ActivityHistory />;

      case 'analytics':
        return <Analytics />;

      case 'reports':
        return <Reports />;

      case 'settings':
        return (
          <div className="space-y-8">
            <CategoryManagement />
          </div>
        );

      default:
        return (
          <div className="text-center py-12">
            <p className="text-neutral-600">Section non trouvée</p>
          </div>
        );
    }
  };

  return (
    <div className="px-6">
      {/* Page Title */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          {activeSection === 'overview' && 'Tableau de bord'}
          {activeSection === 'orders' && 'Commandes'}
          {activeSection === 'products' && 'Produits'}
          {activeSection === 'customers' && 'Clients'}
          {activeSection === 'payments' && 'Paiements'}
          {activeSection === 'analytics' && 'Analytics'}
          {activeSection === 'reports' && 'Rapports'}
          {activeSection === 'history' && 'Historique'}
          {activeSection === 'settings' && 'Paramètres'}
        </h1>
        <p className="text-gray-600 text-sm mt-1">
          Bienvenue dans le panel administratif BOURBON MORELLI
        </p>
      </div>

      {/* Content */}
      <div className="pb-8">
        {renderContent()}
      </div>
    </div>
  );
};

export default AdminDashboard;
