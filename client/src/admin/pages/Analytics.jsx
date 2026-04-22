import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  TrendingUp, TrendingDown, DollarSign, ShoppingCart, ShoppingBag,
  UserCheck, RefreshCw, Loader
} from 'lucide-react';

const BACKEND_URL = 'http://localhost:5003';
const PERIODS = [
  { value: '7d', label: '7 jours' },
  { value: '30d', label: '30 jours' },
  { value: '90d', label: '90 jours' },
  { value: '1y', label: '1 an' }
];

const resolveImageUrl = (url) => {
  if (!url) return null;
  if (url.startsWith('http') || url.startsWith('data:')) return url;
  if (url.startsWith('/uploads/')) return `${BACKEND_URL}${url}`;
  return url;
};

// ============ MINI COMPONENTS ============

const KpiCard = ({ icon: Icon, label, value, pct, format = 'number', color = 'primary' }) => {
  const isUp = pct >= 0;
  const formatted = format === 'currency'
    ? `${value.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} €`
    : format === 'percent'
      ? `${value.toFixed(1)} %`
      : value.toLocaleString('fr-FR');
  const colorMap = {
    primary: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    purple: 'bg-purple-50 text-purple-600',
    amber: 'bg-amber-50 text-amber-600'
  };
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-neutral-200">
      <div className="flex items-center justify-between mb-3">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colorMap[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
        <div className={`flex items-center text-sm font-medium ${isUp ? 'text-green-600' : 'text-red-600'}`}>
          {isUp ? <TrendingUp className="w-4 h-4 mr-1" /> : <TrendingDown className="w-4 h-4 mr-1" />}
          {isUp ? '+' : ''}{pct}%
        </div>
      </div>
      <p className="text-sm text-neutral-600">{label}</p>
      <p className="text-2xl font-bold text-neutral-900 mt-1">{formatted}</p>
    </div>
  );
};

// Line chart SVG (current vs previous)
const RevenueChart = ({ current, previous }) => {
  const width = 800;
  const height = 260;
  const padding = { top: 20, right: 20, bottom: 30, left: 60 };

  const allValues = [...current.map(p => p.revenue), ...previous.map(p => p.revenue), 0];
  const max = Math.max(...allValues) || 1;

  const maxLen = Math.max(current.length, previous.length);
  const xStep = maxLen > 1 ? (width - padding.left - padding.right) / (maxLen - 1) : 0;

  const toPath = (points) => points.map((p, i) => {
    const x = padding.left + i * xStep;
    const y = height - padding.bottom - ((p.revenue / max) * (height - padding.top - padding.bottom));
    return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
  }).join(' ');

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-neutral-200">
      <h3 className="text-lg font-semibold text-neutral-900 mb-4">Évolution du chiffre d'affaires</h3>
      <div className="flex items-center gap-4 mb-2 text-sm">
        <span className="flex items-center"><span className="w-3 h-3 bg-blue-600 rounded-full mr-2"></span>Période actuelle</span>
        <span className="flex items-center"><span className="w-3 h-3 border-2 border-neutral-400 rounded-full mr-2"></span>Période précédente</span>
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-64">
        {/* grid */}
        {[0, 0.25, 0.5, 0.75, 1].map(t => (
          <line key={t}
            x1={padding.left} x2={width - padding.right}
            y1={padding.top + t * (height - padding.top - padding.bottom)}
            y2={padding.top + t * (height - padding.top - padding.bottom)}
            stroke="#e5e7eb" strokeDasharray="2 4"
          />
        ))}
        {/* y labels */}
        {[0, 0.5, 1].map(t => (
          <text key={t}
            x={padding.left - 8}
            y={height - padding.bottom - t * (height - padding.top - padding.bottom) + 4}
            fontSize="11" fill="#6b7280" textAnchor="end"
          >{Math.round(max * t)}€</text>
        ))}
        {/* previous line */}
        {previous.length > 1 && (
          <path d={toPath(previous)} stroke="#9ca3af" strokeWidth="2"
            strokeDasharray="5 4" fill="none" />
        )}
        {/* current line + area */}
        {current.length > 1 && (
          <>
            <path d={toPath(current)} stroke="#2563eb" strokeWidth="2.5" fill="none" />
            {current.map((p, i) => {
              const x = padding.left + i * xStep;
              const y = height - padding.bottom - ((p.revenue / max) * (height - padding.top - padding.bottom));
              return <circle key={i} cx={x} cy={y} r="3" fill="#2563eb" />;
            })}
          </>
        )}
      </svg>
    </div>
  );
};

// Donut chart
const DonutChart = ({ data, title, formatValue = v => v }) => {
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#14b8a6', '#f97316', '#06b6d4'];
  let cumul = 0;
  const radius = 70;
  const cx = 90, cy = 90;

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-neutral-200">
      <h3 className="text-lg font-semibold text-neutral-900 mb-4">{title}</h3>
      {data.length === 0 ? (
        <p className="text-center text-neutral-500 py-8">Aucune donnée</p>
      ) : (
        <div className="flex items-center gap-6">
          <svg width="180" height="180" viewBox="0 0 180 180">
            {data.map((d, i) => {
              const pct = d.value / total;
              const startAngle = cumul * 2 * Math.PI - Math.PI / 2;
              const endAngle = (cumul + pct) * 2 * Math.PI - Math.PI / 2;
              cumul += pct;
              const x1 = cx + radius * Math.cos(startAngle);
              const y1 = cy + radius * Math.sin(startAngle);
              const x2 = cx + radius * Math.cos(endAngle);
              const y2 = cy + radius * Math.sin(endAngle);
              const large = pct > 0.5 ? 1 : 0;
              return (
                <path key={i}
                  d={`M ${cx} ${cy} L ${x1} ${y1} A ${radius} ${radius} 0 ${large} 1 ${x2} ${y2} Z`}
                  fill={colors[i % colors.length]}
                />
              );
            })}
            <circle cx={cx} cy={cy} r="35" fill="white" />
          </svg>
          <div className="flex-1 space-y-2">
            {data.slice(0, 6).map((d, i) => (
              <div key={i} className="flex items-center text-sm">
                <span className="w-3 h-3 rounded-full mr-2 flex-shrink-0" style={{ background: colors[i % colors.length] }}></span>
                <span className="flex-1 truncate">{d.name || d.method}</span>
                <span className="font-medium text-neutral-700 ml-2">{formatValue(d.value)}</span>
                <span className="text-neutral-500 ml-2 text-xs">{Math.round((d.value / total) * 100)}%</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Horizontal bar top products
const TopProductsBar = ({ products }) => {
  const max = Math.max(...products.map(p => p.revenue), 1);
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-neutral-200">
      <h3 className="text-lg font-semibold text-neutral-900 mb-4">Top 10 produits</h3>
      {products.length === 0 ? (
        <p className="text-center text-neutral-500 py-8">Aucune vente sur la période</p>
      ) : (
        <div className="space-y-3">
          {products.map((p, i) => (
            <div key={p.id} className="flex items-center">
              <span className="w-6 text-sm text-neutral-500">#{i + 1}</span>
              {p.image_url ? (
                <img src={resolveImageUrl(p.image_url)} alt={p.name}
                  className="w-10 h-10 rounded-lg object-cover mr-3" />
              ) : (
                <div className="w-10 h-10 bg-neutral-100 rounded-lg mr-3" />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-neutral-900 truncate">{p.name}</p>
                <div className="flex items-center mt-1">
                  <div className="flex-1 bg-neutral-100 rounded-full h-2 mr-2 max-w-xs">
                    <div className="bg-blue-500 h-2 rounded-full"
                      style={{ width: `${(p.revenue / max) * 100}%` }} />
                  </div>
                  <span className="text-xs text-neutral-600">{p.sold} vendus</span>
                </div>
              </div>
              <span className="text-sm font-semibold text-neutral-900 ml-3">
                {p.revenue.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} €
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Stacked bar customer types
const CustomerTypeChart = ({ data }) => {
  const max = Math.max(...data.map(d => d.registered + d.guests), 1);
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-neutral-200">
      <h3 className="text-lg font-semibold text-neutral-900 mb-4">Clients : Inscrits vs Invités (12 mois)</h3>
      <div className="flex items-center gap-4 mb-3 text-sm">
        <span className="flex items-center"><span className="w-3 h-3 bg-blue-600 rounded-sm mr-2"></span>Inscrits</span>
        <span className="flex items-center"><span className="w-3 h-3 bg-amber-500 rounded-sm mr-2"></span>Invités</span>
      </div>
      {data.length === 0 ? (
        <p className="text-center text-neutral-500 py-8">Aucune donnée</p>
      ) : (
        <div className="flex items-end gap-2 h-48">
          {data.map((d, i) => {
            const total = d.registered + d.guests;
            const h = (total / max) * 100;
            const regPct = total > 0 ? (d.registered / total) * 100 : 0;
            return (
              <div key={i} className="flex-1 flex flex-col items-center group relative">
                <div className="w-full bg-neutral-100 rounded-t relative" style={{ height: `${h}%` }}>
                  <div className="absolute inset-x-0 bottom-0 bg-blue-600 rounded-t"
                    style={{ height: `${regPct}%` }} />
                  <div className="absolute inset-x-0 top-0 bg-amber-500"
                    style={{ height: `${100 - regPct}%` }} />
                </div>
                <span className="text-xs text-neutral-600 mt-1">{d.month.slice(5)}</span>
                <div className="hidden group-hover:block absolute bottom-full mb-1 bg-neutral-900 text-white text-xs rounded px-2 py-1 whitespace-nowrap z-10">
                  {d.month} • {d.registered} inscrits • {d.guests} invités
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// Heatmap day × hour
const HeatmapChart = ({ data }) => {
  const DAYS = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
  const matrix = Array.from({ length: 7 }, () => Array(24).fill(0));
  let max = 0;
  data.forEach(d => {
    const dowIdx = (d.dow - 1 + 7) % 7; // MySQL DAYOFWEEK : 1=Sunday
    matrix[dowIdx][d.hour] = d.count;
    if (d.count > max) max = d.count;
  });

  const cellColor = (v) => {
    if (v === 0) return '#f3f4f6';
    const intensity = v / (max || 1);
    const g = Math.round(255 - intensity * 160);
    const b = Math.round(255 - intensity * 80);
    return `rgb(${Math.round(255 - intensity * 200)}, ${g}, ${b})`;
  };

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-neutral-200">
      <h3 className="text-lg font-semibold text-neutral-900 mb-4">Heures de pointe</h3>
      <div className="overflow-x-auto">
        <table className="text-xs">
          <thead>
            <tr>
              <th className="w-10"></th>
              {Array.from({ length: 24 }, (_, h) => (
                <th key={h} className="w-6 text-center font-normal text-neutral-500">
                  {h % 3 === 0 ? h : ''}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {DAYS.map((day, di) => (
              <tr key={di}>
                <td className="text-neutral-600 pr-2 font-medium">{day}</td>
                {matrix[di].map((v, hi) => (
                  <td key={hi} className="p-0">
                    <div className="w-6 h-6 border border-white"
                      style={{ background: cellColor(v) }}
                      title={`${day} ${hi}h : ${v} commandes`} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-neutral-500 mt-2">Heures UTC • Max : {max} commandes/créneau</p>
    </div>
  );
};

// ============ MAIN ============
const Analytics = () => {
  const [period, setPeriod] = useState('30d');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${BACKEND_URL}/api/admin/analytics?period=${period}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setData(json);
    } catch (e) {
      console.error(e);
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading && !data) {
    return <div className="flex items-center justify-center py-24"><Loader className="w-8 h-8 animate-spin text-blue-600" /></div>;
  }
  if (error) {
    return <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4">Erreur : {error}</div>;
  }
  if (!data) return null;

  return (
    <div className="space-y-6">
      {/* Header avec filtres période */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-neutral-900">Analyse détaillée</h2>
          <p className="text-sm text-neutral-600">Données sur {data.days} derniers jours</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-white rounded-lg border border-neutral-200 p-1">
            {PERIODS.map(p => (
              <button key={p.value}
                onClick={() => setPeriod(p.value)}
                className={`px-4 py-1.5 text-sm rounded-md transition-colors ${
                  period === p.value ? 'bg-blue-600 text-white' : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >{p.label}</button>
            ))}
          </div>
          <button onClick={fetchData} className="p-2 bg-white rounded-lg border border-neutral-200 hover:bg-neutral-50">
            <RefreshCw className={`w-4 h-4 text-neutral-600 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard icon={DollarSign} label="Chiffre d'affaires" value={data.kpis.revenue.current} pct={data.kpis.revenue.pct} format="currency" color="green" />
        <KpiCard icon={ShoppingCart} label="Commandes" value={data.kpis.orders.current} pct={data.kpis.orders.pct} color="primary" />
        <KpiCard icon={ShoppingBag} label="Panier moyen" value={data.kpis.avgCart.current} pct={data.kpis.avgCart.pct} format="currency" color="purple" />
        <KpiCard icon={UserCheck} label="Taux inscrits" value={data.kpis.conversion.current} pct={data.kpis.conversion.pct} format="percent" color="amber" />
      </div>

      {/* Revenue chart */}
      <RevenueChart current={data.revenueChart.current} previous={data.revenueChart.previous} />

      {/* Category + Top products */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DonutChart data={data.categoryBreakdown} title="Répartition par catégorie"
          formatValue={v => `${Math.round(v)}€`} />
        <TopProductsBar products={data.topProducts} />
      </div>

      {/* Customer types + payment methods */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CustomerTypeChart data={data.customerTypeChart} />
        <DonutChart
          data={data.paymentMethods.map(m => ({ name: m.method, value: m.count }))}
          title="Méthodes de paiement"
          formatValue={v => `${v}`}
        />
      </div>

      {/* Heatmap */}
      <HeatmapChart data={data.heatmap} />
    </div>
  );
};

export default Analytics;
