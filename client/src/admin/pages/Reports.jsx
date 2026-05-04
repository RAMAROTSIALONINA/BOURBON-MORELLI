import React, { useState } from 'react';
import {
  DollarSign,
  ShoppingBag,
  Package,
  Users,
  Tag,
  Loader,
  FileSpreadsheet,
  File,
  Calendar
} from 'lucide-react';
import useNotificationStore from '../../services/notificationService';

const BACKEND_URL = 'http://localhost:5003';

// Définition des rapports disponibles
const REPORT_TYPES = [
  {
    id: 'sales',
    icon: ShoppingBag,
    color: 'bg-blue-50 text-blue-600',
    title: 'Rapport de ventes',
    description: 'Synthèse du CA, commandes par statut, top produits vendus et liste détaillée des commandes sur la période.',
    audience: 'Direction'
  },
  {
    id: 'financial',
    icon: DollarSign,
    color: 'bg-green-50 text-green-600',
    title: 'Rapport financier',
    description: 'Paiements encaissés, remboursements, TVA collectée et répartition par moyen de paiement.',
    audience: 'Comptable'
  },
  {
    id: 'inventory',
    icon: Package,
    color: 'bg-purple-50 text-purple-600',
    title: 'Rapport d\'inventaire',
    description: 'Stock actuel, produits en rupture, stocks faibles et valorisation totale du stock (à aujourd\'hui).',
    audience: 'Logistique',
    noDate: true
  },
  {
    id: 'customers',
    icon: Users,
    color: 'bg-gray-100 text-gray-700',
    title: 'Rapport clients',
    description: 'Top acheteurs (inscrits + invités), fréquence de commande, CA par client.',
    audience: 'Marketing'
  },
  {
    id: 'products',
    icon: Tag,
    color: 'bg-rose-50 text-rose-600',
    title: 'Rapport produits',
    description: 'Performance par produit : ventes, CA, marge brute, rotation du stock.',
    audience: 'Achats'
  }
];

// ============ CSV GENERATION ============
const generateCSV = (report) => {
  const lines = [];
  const esc = (v) => {
    if (v === null || v === undefined) return '';
    const s = String(v).replace(/"/g, '""');
    return /[,;"\n]/.test(s) ? `"${s}"` : s;
  };

  lines.push(`${report.title}`);
  lines.push(`Période;${report.period.from};${report.period.to}`);
  lines.push('');

  // Summary block
  lines.push('RÉSUMÉ');
  Object.entries(report.summary).forEach(([k, v]) => {
    lines.push(`${k};${typeof v === 'number' ? v.toFixed(2) : esc(v)}`);
  });
  lines.push('');

  // Dynamic tables per report type
  if (report.type === 'sales') {
    lines.push('COMMANDES PAR STATUT');
    lines.push('Statut;Nombre;Total');
    report.byStatus.forEach(r => lines.push(`${esc(r.status)};${r.count};${r.total.toFixed(2)}`));
    lines.push('');
    lines.push('TOP PRODUITS');
    lines.push('Produit;Unités vendues;CA');
    report.topProducts.forEach(p => lines.push(`${esc(p.name)};${p.sold};${p.revenue.toFixed(2)}`));
    lines.push('');
    lines.push('DÉTAIL DES COMMANDES');
    lines.push('N° Commande;Client;Email;Statut;Montant;Date');
    report.orders.forEach(o => lines.push(
      `${esc(o.order_number)};${esc(o.customer)};${esc(o.email)};${esc(o.status)};${o.total.toFixed(2)};${esc(o.date)}`
    ));
  }
  else if (report.type === 'financial') {
    lines.push('RÉPARTITION PAR MOYEN DE PAIEMENT');
    lines.push('Méthode;Nombre;Montant');
    report.byMethod.forEach(r => lines.push(`${esc(r.method)};${r.count};${r.total.toFixed(2)}`));
    lines.push('');
    lines.push('DÉTAIL DES PAIEMENTS');
    lines.push('ID;Transaction;Commande;Méthode;Statut;Montant;Devise;Date');
    report.payments.forEach(p => lines.push(
      `${p.id};${esc(p.transaction_id)};${esc(p.order)};${esc(p.method)};${esc(p.status)};${p.amount.toFixed(2)};${esc(p.currency)};${esc(p.date)}`
    ));
  }
  else if (report.type === 'inventory') {
    lines.push('INVENTAIRE DÉTAILLÉ');
    lines.push('ID;Nom;SKU;Catégorie;Stock;Seuil;Statut;Prix;Coût;Valeur stock');
    report.items.forEach(i => lines.push(
      `${i.id};${esc(i.name)};${esc(i.sku)};${esc(i.category)};${i.quantity};${i.threshold};${esc(i.stockStatus)};${i.price.toFixed(2)};${i.cost.toFixed(2)};${i.stockValue.toFixed(2)}`
    ));
  }
  else if (report.type === 'customers') {
    lines.push('CLIENTS INSCRITS');
    lines.push('ID;Nom;Email;Commandes;Total dépensé;Dernière commande');
    report.registered.forEach(c => lines.push(
      `${c.id};${esc(c.name)};${esc(c.email)};${c.orders};${c.total_spent.toFixed(2)};${esc(c.last_order)}`
    ));
    lines.push('');
    lines.push('CLIENTS INVITÉS');
    lines.push('Email;Commandes;Total dépensé;Dernière commande');
    report.guests.forEach(c => lines.push(
      `${esc(c.email)};${c.orders};${c.total_spent.toFixed(2)};${esc(c.last_order)}`
    ));
  }
  else if (report.type === 'products') {
    lines.push('PRODUITS DÉTAILLÉS');
    lines.push('ID;Nom;SKU;Catégorie;Statut;Prix;Coût;Marge;Marge %;Stock;Vendus;CA;Profit brut');
    report.items.forEach(i => lines.push(
      `${i.id};${esc(i.name)};${esc(i.sku)};${esc(i.category)};${esc(i.status)};${i.price.toFixed(2)};${i.cost.toFixed(2)};${i.margin.toFixed(2)};${i.marginPct.toFixed(1)};${i.stock};${i.sold};${i.revenue.toFixed(2)};${i.grossProfit.toFixed(2)}`
    ));
  }

  return '\uFEFF' + lines.join('\n');
};

const downloadFile = (content, filename, mime) => {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

// ============ HTML pour PDF (print) ============
const openPdfPrint = (report) => {
  const fmt = (n) => (typeof n === 'number' ? n.toLocaleString('fr-FR', { maximumFractionDigits: 2 }) : n);
  const date = new Date().toLocaleString('fr-FR');

  let tablesHtml = '';
  if (report.type === 'sales') {
    tablesHtml += `
      <h2>Commandes par statut</h2>
      <table><thead><tr><th>Statut</th><th>Nombre</th><th>Total €</th></tr></thead><tbody>
      ${report.byStatus.map(r => `<tr><td>${r.status}</td><td>${r.count}</td><td>${fmt(r.total)}</td></tr>`).join('')}
      </tbody></table>
      <h2>Top produits</h2>
      <table><thead><tr><th>Produit</th><th>Unités</th><th>CA €</th></tr></thead><tbody>
      ${report.topProducts.map(p => `<tr><td>${p.name}</td><td>${p.sold}</td><td>${fmt(p.revenue)}</td></tr>`).join('')}
      </tbody></table>
      <h2>Détail commandes (${report.orders.length})</h2>
      <table><thead><tr><th>N°</th><th>Client</th><th>Statut</th><th>Montant €</th><th>Date</th></tr></thead><tbody>
      ${report.orders.map(o => `<tr><td>${o.order_number}</td><td>${o.customer}</td><td>${o.status}</td><td>${fmt(o.total)}</td><td>${new Date(o.date).toLocaleDateString('fr-FR')}</td></tr>`).join('')}
      </tbody></table>`;
  }
  else if (report.type === 'financial') {
    tablesHtml += `
      <h2>Par moyen de paiement</h2>
      <table><thead><tr><th>Méthode</th><th>Nombre</th><th>Montant €</th></tr></thead><tbody>
      ${report.byMethod.map(r => `<tr><td>${r.method}</td><td>${r.count}</td><td>${fmt(r.total)}</td></tr>`).join('')}
      </tbody></table>
      <h2>Détail paiements (${report.payments.length})</h2>
      <table><thead><tr><th>ID</th><th>Transaction</th><th>Commande</th><th>Méthode</th><th>Statut</th><th>Montant €</th></tr></thead><tbody>
      ${report.payments.map(p => `<tr><td>${p.id}</td><td>${p.transaction_id || '—'}</td><td>${p.order || '—'}</td><td>${p.method}</td><td>${p.status}</td><td>${fmt(p.amount)}</td></tr>`).join('')}
      </tbody></table>`;
  }
  else if (report.type === 'inventory') {
    tablesHtml += `
      <h2>Inventaire (${report.items.length} produits)</h2>
      <table><thead><tr><th>Nom</th><th>SKU</th><th>Catégorie</th><th>Stock</th><th>Statut</th><th>Prix €</th><th>Valeur €</th></tr></thead><tbody>
      ${report.items.map(i => `<tr><td>${i.name}</td><td>${i.sku || '—'}</td><td>${i.category}</td><td>${i.quantity}</td><td class="status-${i.stockStatus}">${i.stockStatus}</td><td>${fmt(i.price)}</td><td>${fmt(i.stockValue)}</td></tr>`).join('')}
      </tbody></table>`;
  }
  else if (report.type === 'customers') {
    tablesHtml += `
      <h2>Clients inscrits (${report.registered.length})</h2>
      <table><thead><tr><th>Nom</th><th>Email</th><th>Commandes</th><th>Total €</th></tr></thead><tbody>
      ${report.registered.map(c => `<tr><td>${c.name}</td><td>${c.email}</td><td>${c.orders}</td><td>${fmt(c.total_spent)}</td></tr>`).join('')}
      </tbody></table>
      <h2>Clients invités (${report.guests.length})</h2>
      <table><thead><tr><th>Email</th><th>Commandes</th><th>Total €</th></tr></thead><tbody>
      ${report.guests.map(c => `<tr><td>${c.email}</td><td>${c.orders}</td><td>${fmt(c.total_spent)}</td></tr>`).join('')}
      </tbody></table>`;
  }
  else if (report.type === 'products') {
    tablesHtml += `
      <h2>Produits (${report.items.length})</h2>
      <table><thead><tr><th>Nom</th><th>Catégorie</th><th>Prix €</th><th>Marge %</th><th>Stock</th><th>Vendus</th><th>CA €</th><th>Profit €</th></tr></thead><tbody>
      ${report.items.map(i => `<tr><td>${i.name}</td><td>${i.category}</td><td>${fmt(i.price)}</td><td>${i.marginPct}%</td><td>${i.stock}</td><td>${i.sold}</td><td>${fmt(i.revenue)}</td><td>${fmt(i.grossProfit)}</td></tr>`).join('')}
      </tbody></table>`;
  }

  const summaryHtml = Object.entries(report.summary)
    .map(([k, v]) => `<div class="kpi"><span class="kpi-label">${k}</span><span class="kpi-value">${typeof v === 'number' ? fmt(v) : v}</span></div>`)
    .join('');

  const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>${report.title}</title>
<style>
  body { font-family: Arial, sans-serif; padding: 40px; color: #1f2937; }
  .header { border-bottom: 3px solid #2563eb; padding-bottom: 20px; margin-bottom: 30px; }
  .header h1 { margin: 0; color: #2563eb; font-size: 28px; }
  .header .meta { color: #6b7280; font-size: 13px; margin-top: 6px; }
  .brand { float: right; font-weight: bold; color: #1f2937; }
  h2 { color: #1f2937; font-size: 18px; margin-top: 30px; border-bottom: 1px solid #e5e7eb; padding-bottom: 6px; }
  .summary { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin: 20px 0; }
  .kpi { background: #f9fafb; padding: 12px; border-radius: 6px; border-left: 3px solid #2563eb; }
  .kpi-label { display: block; font-size: 11px; color: #6b7280; text-transform: uppercase; }
  .kpi-value { display: block; font-size: 18px; font-weight: bold; color: #1f2937; margin-top: 4px; }
  table { width: 100%; border-collapse: collapse; margin: 15px 0; font-size: 12px; }
  th { background: #2563eb; color: white; padding: 8px; text-align: left; }
  td { padding: 6px 8px; border-bottom: 1px solid #e5e7eb; }
  tr:nth-child(even) { background: #f9fafb; }
  .status-out { color: #dc2626; font-weight: bold; }
  .status-low { color: #f59e0b; }
  .status-ok { color: #10b981; }
  .footer { margin-top: 40px; padding-top: 15px; border-top: 1px solid #e5e7eb; font-size: 11px; color: #6b7280; text-align: center; }
  @media print { body { padding: 20px; } .no-print { display: none; } }
</style></head>
<body>
  <div class="header">
    <span class="brand">BOURBON MORELLI</span>
    <h1>${report.title}</h1>
    <div class="meta">Période : ${report.period.from} → ${report.period.to} • Généré le ${date}</div>
  </div>
  <h2>Résumé</h2>
  <div class="summary">${summaryHtml}</div>
  ${tablesHtml}
  <div class="footer">BOURBON MORELLI • Rapport généré automatiquement • ${date}</div>
  <div class="no-print" style="text-align:center; margin-top: 20px;">
    <button onclick="window.print()" style="padding: 10px 20px; background: #2563eb; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 14px;">
      📄 Imprimer / Enregistrer en PDF
    </button>
  </div>
</body></html>`;

  const w = window.open('', '_blank');
  w.document.write(html);
  w.document.close();
};

// ============ REPORT CARD ============
const ReportCard = ({ type, from, to, onGenerate }) => {
  const [loading, setLoading] = useState(null); // 'csv' | 'pdf' | null
  const Icon = type.icon;

  const handle = async (format) => {
    setLoading(format);
    try {
      await onGenerate(type.id, format);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-neutral-200 hover:shadow-md transition-shadow">
      <div className="flex items-start gap-4">
        <div className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${type.color}`}>
          <Icon className="w-6 h-6" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <h3 className="text-lg font-semibold text-neutral-900">{type.title}</h3>
            <span className="text-xs bg-neutral-100 text-neutral-600 px-2 py-1 rounded-full">{type.audience}</span>
          </div>
          <p className="text-sm text-neutral-600 mt-1 mb-4">{type.description}</p>
          <div className="flex gap-2">
            <button onClick={() => handle('csv')} disabled={loading !== null}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-neutral-300 rounded-lg text-sm text-neutral-700 hover:bg-neutral-50 disabled:opacity-50">
              {loading === 'csv' ? <Loader className="w-4 h-4 animate-spin" /> : <FileSpreadsheet className="w-4 h-4" />}
              CSV
            </button>
            <button onClick={() => handle('pdf')} disabled={loading !== null}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50">
              {loading === 'pdf' ? <Loader className="w-4 h-4 animate-spin" /> : <File className="w-4 h-4" />}
              PDF
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============ MAIN ============
const Reports = () => {
  const addNotification = useNotificationStore(s => s.addNotification);

  const today = new Date().toISOString().slice(0, 10);
  const thirtyAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  const [from, setFrom] = useState(thirtyAgo);
  const [to, setTo] = useState(today);
  const [generated, setGenerated] = useState(() => {
    try { return JSON.parse(localStorage.getItem('admin_generated_reports') || '[]'); }
    catch { return []; }
  });

  const saveHistory = (entry) => {
    const newList = [entry, ...generated].slice(0, 20);
    setGenerated(newList);
    localStorage.setItem('admin_generated_reports', JSON.stringify(newList));
  };

  const generateReport = async (typeId, format) => {
    try {
      const type = REPORT_TYPES.find(t => t.id === typeId);
      const token = localStorage.getItem('adminToken');
      const params = type.noDate ? '' : `?from=${from}&to=${to}`;

      const res = await fetch(`${BACKEND_URL}/api/admin/reports/${typeId}${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const report = await res.json();

      if (format === 'csv') {
        const csv = generateCSV(report);
        const filename = `${typeId}-${report.period.from}-${report.period.to}.csv`;
        downloadFile(csv, filename, 'text/csv;charset=utf-8');
      } else {
        openPdfPrint(report);
      }

      saveHistory({
        id: Date.now(),
        type: typeId,
        title: type.title,
        format,
        period: report.period,
        date: new Date().toISOString()
      });

      addNotification({
        type: 'success',
        category: 'Rapport',
        title: `${type.title} généré`,
        message: `Format ${format.toUpperCase()} • ${report.period.from} → ${report.period.to}`
      });
    } catch (e) {
      console.error(e);
      addNotification({
        type: 'error',
        category: 'Rapport',
        title: 'Erreur génération rapport',
        message: e.message
      });
      alert(`Erreur : ${e.message}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Filtres période */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-neutral-200">
        <div className="flex items-center gap-2 mb-3">
          <Calendar className="w-5 h-5 text-neutral-600" />
          <h2 className="text-lg font-semibold text-neutral-900">Période d'analyse</h2>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="text-sm text-neutral-600">Du</label>
            <input type="date" value={from} onChange={(e) => setFrom(e.target.value)}
              className="px-3 py-2 border border-neutral-300 rounded-lg text-sm" />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-neutral-600">Au</label>
            <input type="date" value={to} onChange={(e) => setTo(e.target.value)}
              className="px-3 py-2 border border-neutral-300 rounded-lg text-sm" />
          </div>
          <div className="flex gap-2">
            {[
              { label: '7j', days: 7 },
              { label: '30j', days: 30 },
              { label: '90j', days: 90 },
              { label: '1an', days: 365 }
            ].map(p => (
              <button key={p.label}
                onClick={() => {
                  setTo(today);
                  setFrom(new Date(Date.now() - p.days * 24 * 60 * 60 * 1000).toISOString().slice(0, 10));
                }}
                className="px-3 py-1.5 text-xs bg-neutral-100 text-neutral-700 rounded-lg hover:bg-neutral-200">
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Cartes de rapports */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {REPORT_TYPES.map(type => (
          <ReportCard key={type.id} type={type} from={from} to={to} onGenerate={generateReport} />
        ))}
      </div>

      {/* Historique */}
      {generated.length > 0 && (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-neutral-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-neutral-900">Rapports récemment générés</h2>
            <button onClick={() => { setGenerated([]); localStorage.removeItem('admin_generated_reports'); }}
              className="text-sm text-red-600 hover:text-red-700">Effacer</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-neutral-50 text-neutral-600">
                <tr>
                  <th className="text-left px-4 py-2">Date</th>
                  <th className="text-left px-4 py-2">Rapport</th>
                  <th className="text-left px-4 py-2">Période</th>
                  <th className="text-left px-4 py-2">Format</th>
                </tr>
              </thead>
              <tbody>
                {generated.map(g => (
                  <tr key={g.id} className="border-t border-neutral-100">
                    <td className="px-4 py-2 text-neutral-700">{new Date(g.date).toLocaleString('fr-FR')}</td>
                    <td className="px-4 py-2 font-medium text-neutral-900">{g.title}</td>
                    <td className="px-4 py-2 text-neutral-600">{g.period.from} → {g.period.to}</td>
                    <td className="px-4 py-2">
                      <span className={`px-2 py-0.5 text-xs rounded-full ${g.format === 'pdf' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
                        {g.format.toUpperCase()}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports;
