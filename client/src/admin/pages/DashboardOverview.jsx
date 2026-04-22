import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import {
  ShoppingBag,
  DollarSign,
  Users,
  Package,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  ShoppingCart,
  RefreshCw,
  ArrowRight,
  ChevronRight
} from 'lucide-react';

const BACKEND_URL = 'http://localhost:5003';

const resolveImageUrl = (url) => {
  if (!url) return null;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  if (url.startsWith('/uploads/') || url.startsWith('uploads/')) {
    return `${BACKEND_URL}/${url.replace(/^\//, '')}`;
  }
  return url;
};

const formatPrice = (v) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(v || 0);

const DAY_LABELS = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

const DashboardOverview = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [hoveredIdx, setHoveredIdx] = useState(null);

  const loadStats = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setRefreshing(true);
    try {
      let token = localStorage.getItem('adminToken');
      if (!token) {
        const t = await axios.get(`${BACKEND_URL}/api/users/admin/temp-token`);
        token = t.data.token;
        localStorage.setItem('adminToken', token);
      }
      const response = await axios.get(`${BACKEND_URL}/api/admin/dashboard-stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStats(response.data);
      setError(null);
    } catch (err) {
      console.error('Erreur dashboard:', err);
      setError(err.response?.data?.message || 'Impossible de charger les statistiques');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadStats();
    const interval = setInterval(() => loadStats(true), 60000);
    return () => clearInterval(interval);
  }, [loadStats]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <RefreshCw className="w-10 h-10 text-neutral-400 mx-auto mb-3 animate-spin" />
          <p className="text-neutral-500">Chargement du tableau de bord...</p>
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
        <AlertTriangle className="w-10 h-10 text-red-500 mx-auto mb-3" />
        <p className="text-red-700 font-medium">{error}</p>
        <button
          onClick={() => loadStats()}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
        >
          Réessayer
        </button>
      </div>
    );
  }

  const { kpis, alerts, salesChart, topProducts } = stats;
  const totalAlerts = alerts.pendingOver24h + alerts.lowStock + alerts.outOfStock;
  const weekTotal = salesChart.reduce((s, d) => s + d.revenue, 0);
  const weekOrders = salesChart.reduce((s, d) => s + d.orders, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-neutral-500">
            Données en temps réel • Rafraîchissement auto toutes les 60 secondes
          </p>
        </div>
        <button
          onClick={() => loadStats()}
          disabled={refreshing}
          className="flex items-center gap-2 px-3 py-1.5 text-sm border border-neutral-200 rounded-lg bg-white hover:bg-neutral-50 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          Rafraîchir
        </button>
      </div>

      {/* KPIs principaux */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          icon={DollarSign}
          iconBg="bg-green-100"
          iconColor="text-green-600"
          label="Revenus aujourd'hui"
          value={formatPrice(kpis.todayRevenue)}
          change={kpis.revenueChange}
          changeLabel="vs hier"
        />
        <KpiCard
          icon={ShoppingCart}
          iconBg="bg-blue-100"
          iconColor="text-blue-600"
          label="Commandes aujourd'hui"
          value={kpis.todayOrders}
          change={kpis.ordersChange}
          changeLabel="vs hier"
        />
        <KpiCard
          icon={Users}
          iconBg="bg-indigo-100"
          iconColor="text-indigo-600"
          label="Nouveaux clients"
          value={kpis.newCustomersWeek}
          subtitle="cette semaine"
        />
        <KpiCard
          icon={ShoppingBag}
          iconBg="bg-purple-100"
          iconColor="text-purple-600"
          label="Panier moyen"
          value={formatPrice(kpis.avgCart)}
          subtitle="30 derniers jours"
        />
      </div>

      {/* Actions requises */}
      {totalAlerts > 0 && (
        <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-neutral-100 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            <h3 className="font-semibold text-neutral-900">Actions requises</h3>
            <span className="ml-auto text-xs px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full font-medium">
              {totalAlerts}
            </span>
          </div>
          <div className="divide-y divide-neutral-100">
            {alerts.pendingOver24h > 0 && (
              <AlertRow
                dotColor="bg-red-500"
                text={<><strong>{alerts.pendingOver24h}</strong> commande(s) en attente depuis plus de 24h</>}
                link="/admin/orders"
              />
            )}
            {alerts.outOfStock > 0 && (
              <AlertRow
                dotColor="bg-red-500"
                text={<><strong>{alerts.outOfStock}</strong> produit(s) en rupture de stock</>}
                link="/admin/products"
              />
            )}
            {alerts.lowStock > 0 && (
              <AlertRow
                dotColor="bg-amber-500"
                text={<><strong>{alerts.lowStock}</strong> produit(s) en stock faible</>}
                link="/admin/products"
              />
            )}
          </div>
        </div>
      )}

      {/* Graphique ventes 7 jours — version line + area */}
      <SalesLineChart
        data={salesChart}
        weekTotal={weekTotal}
        weekOrders={weekOrders}
        hoveredIdx={hoveredIdx}
        setHoveredIdx={setHoveredIdx}
      />

      {/* Top produits — pleine largeur */}
      <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-neutral-100 flex items-center justify-between">
          <h3 className="font-semibold text-neutral-900">Top produits (30j)</h3>
          <Link to="/admin/products" className="text-xs text-neutral-600 hover:text-neutral-900 flex items-center gap-1">
            Tout voir <ChevronRight className="w-3 h-3" />
          </Link>
        </div>
        <div className="divide-y divide-neutral-100">
          {topProducts.length === 0 ? (
            <p className="px-6 py-8 text-center text-sm text-neutral-400">Aucun produit</p>
          ) : (
            topProducts.map((product, idx) => {
              const img = resolveImageUrl(product.image_url);
              return (
                <div key={product.id} className="flex items-center gap-3 px-6 py-3 hover:bg-neutral-50 transition-colors">
                  <div className="text-xs font-bold text-neutral-400 w-4">#{idx + 1}</div>
                  <div className="w-10 h-10 rounded-lg bg-neutral-100 flex-shrink-0 overflow-hidden">
                    {img ? (
                      <img src={img} alt={product.name} className="w-full h-full object-cover" onError={(e) => { e.target.style.display = 'none'; }} />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="w-5 h-5 text-neutral-400" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-neutral-900 truncate">{product.name}</p>
                    <p className="text-xs text-neutral-500">{formatPrice(product.price)}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-semibold text-neutral-900">{product.total_sold}</p>
                    <p className="text-[10px] text-neutral-400">vendus</p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Totaux secondaires */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MiniStat label="CA total" value={formatPrice(kpis.totalRevenue)} />
        <MiniStat label="Commandes total" value={kpis.totalOrders.toLocaleString('fr-FR')} />
        <MiniStat label="Clients" value={kpis.totalCustomers.toLocaleString('fr-FR')} />
        <MiniStat label="Produits actifs" value={kpis.totalProducts.toLocaleString('fr-FR')} />
      </div>
    </div>
  );
};

// ========== Sales line chart avec area + points + grille ==========
const SalesLineChart = ({ data, weekTotal, weekOrders, hoveredIdx, setHoveredIdx }) => {
  const width = 900;
  const height = 280;
  const padding = { top: 30, right: 30, bottom: 50, left: 60 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  const maxRev = Math.max(...data.map(d => d.revenue), 1);
  // Arrondi au supérieur pour les labels Y
  const niceMax = Math.ceil(maxRev / 10) * 10 || 1;

  const xStep = data.length > 1 ? chartW / (data.length - 1) : 0;
  const xFor = (i) => padding.left + i * xStep;
  const yFor = (v) => padding.top + chartH - (v / niceMax) * chartH;

  // Path area (fill) + line
  const linePath = data.map((d, i) => `${i === 0 ? 'M' : 'L'} ${xFor(i)} ${yFor(d.revenue)}`).join(' ');
  const areaPath = data.length > 0
    ? `${linePath} L ${xFor(data.length - 1)} ${padding.top + chartH} L ${xFor(0)} ${padding.top + chartH} Z`
    : '';

  return (
    <div className="bg-white rounded-xl border border-neutral-200 p-6">
      <div className="flex items-center justify-between mb-1">
        <div>
          <h3 className="font-semibold text-neutral-900">Ventes des 7 derniers jours</h3>
          <p className="text-xs text-neutral-500 mt-0.5">Chiffre d'affaires quotidien</p>
        </div>
        <div className="flex items-center gap-6 text-xs">
          <div>
            <p className="text-neutral-500">Total semaine</p>
            <p className="text-lg font-bold text-neutral-900">{formatPrice(weekTotal)}</p>
          </div>
          <div>
            <p className="text-neutral-500">Commandes</p>
            <p className="text-lg font-bold text-neutral-900">{weekOrders}</p>
          </div>
        </div>
      </div>

      {data.length === 0 ? (
        <p className="text-center text-neutral-400 py-12 text-sm">Aucune vente cette semaine</p>
      ) : (
        <div className="relative mt-4">
          <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-72">
            <defs>
              <linearGradient id="area-gradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#2563eb" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#2563eb" stopOpacity="0" />
              </linearGradient>
            </defs>

            {/* Gridlines Y + labels */}
            {[0, 0.25, 0.5, 0.75, 1].map((t, i) => {
              const y = padding.top + chartH - t * chartH;
              const val = niceMax * t;
              return (
                <g key={i}>
                  <line x1={padding.left} x2={width - padding.right} y1={y} y2={y}
                    stroke="#e5e7eb" strokeDasharray="3 4" />
                  <text x={padding.left - 10} y={y + 4} fontSize="11"
                    fill="#9ca3af" textAnchor="end">
                    {Math.round(val)}€
                  </text>
                </g>
              );
            })}

            {/* Area + line */}
            <path d={areaPath} fill="url(#area-gradient)" />
            <path d={linePath} fill="none" stroke="#2563eb" strokeWidth="2.5"
              strokeLinecap="round" strokeLinejoin="round" />

            {/* Points + hover zones */}
            {data.map((d, i) => {
              const cx = xFor(i);
              const cy = yFor(d.revenue);
              const isHover = hoveredIdx === i;
              const date = new Date(d.day);
              return (
                <g key={i}>
                  {/* X label */}
                  <text x={cx} y={height - padding.bottom + 20}
                    fontSize="12" fill="#374151" textAnchor="middle" fontWeight="500">
                    {DAY_LABELS[date.getDay()]}
                  </text>
                  <text x={cx} y={height - padding.bottom + 35}
                    fontSize="10" fill="#9ca3af" textAnchor="middle">
                    {date.getDate()}/{date.getMonth() + 1}
                  </text>

                  {/* Point */}
                  <circle cx={cx} cy={cy} r={isHover ? 6 : 4}
                    fill="white" stroke="#2563eb" strokeWidth="2.5" />

                  {/* Vertical hover line */}
                  {isHover && (
                    <line x1={cx} x2={cx} y1={padding.top} y2={padding.top + chartH}
                      stroke="#2563eb" strokeDasharray="3 3" strokeWidth="1" opacity="0.5" />
                  )}

                  {/* Hover target (invisible large circle) */}
                  <circle cx={cx} cy={cy} r={Math.max(xStep / 2, 20)}
                    fill="transparent"
                    onMouseEnter={() => setHoveredIdx(i)}
                    onMouseLeave={() => setHoveredIdx(null)}
                    style={{ cursor: 'pointer' }} />
                </g>
              );
            })}
          </svg>

          {/* Tooltip */}
          {hoveredIdx !== null && data[hoveredIdx] && (
            <div
              className="absolute pointer-events-none bg-neutral-900 text-white rounded-lg shadow-lg px-3 py-2 text-xs whitespace-nowrap z-10"
              style={{
                left: `${(xFor(hoveredIdx) / width) * 100}%`,
                top: `${(yFor(data[hoveredIdx].revenue) / height) * 100}%`,
                transform: 'translate(-50%, -120%)'
              }}
            >
              <p className="font-semibold text-sm">{formatPrice(data[hoveredIdx].revenue)}</p>
              <p className="text-neutral-300">{data[hoveredIdx].orders} commande(s)</p>
              <p className="text-neutral-400 text-[10px] mt-0.5">
                {new Date(data[hoveredIdx].day).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Composants auxiliaires
const KpiCard = ({ icon: Icon, iconBg, iconColor, label, value, change, changeLabel, subtitle }) => (
  <div className="bg-white p-5 rounded-xl border border-neutral-200">
    <div className="flex items-start justify-between">
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide">{label}</p>
        <p className="text-2xl font-bold text-neutral-900 mt-1 truncate">{value}</p>
      </div>
      <div className={`w-10 h-10 ${iconBg} rounded-lg flex items-center justify-center flex-shrink-0 ml-2`}>
        <Icon className={`w-5 h-5 ${iconColor}`} />
      </div>
    </div>
    {change !== undefined ? (
      <div className="mt-3 flex items-center text-xs">
        {change >= 0 ? (
          <TrendingUp className="w-3 h-3 text-green-600" />
        ) : (
          <TrendingDown className="w-3 h-3 text-red-600" />
        )}
        <span className={`ml-1 font-medium ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
          {change >= 0 ? '+' : ''}{change}%
        </span>
        <span className="text-neutral-500 ml-2">{changeLabel}</span>
      </div>
    ) : subtitle ? (
      <p className="mt-3 text-xs text-neutral-500">{subtitle}</p>
    ) : null}
  </div>
);

const AlertRow = ({ dotColor, text, link }) => (
  <Link to={link} className="flex items-center gap-3 px-6 py-3 hover:bg-neutral-50 transition-colors">
    <span className={`w-2 h-2 rounded-full ${dotColor} animate-pulse flex-shrink-0`} />
    <p className="text-sm text-neutral-700 flex-1">{text}</p>
    <ArrowRight className="w-4 h-4 text-neutral-400" />
  </Link>
);

const MiniStat = ({ label, value }) => (
  <div className="bg-white p-4 rounded-lg border border-neutral-200">
    <p className="text-xs text-neutral-500">{label}</p>
    <p className="text-lg font-bold text-neutral-900 mt-1 truncate">{value}</p>
  </div>
);

export default DashboardOverview;
