# Guide de Vérification du Système de Notifications

## 🎯 Objectif

Vérifier que le système de notifications fonctionne correctement quand de nouvelles commandes sont créées.

## 📋 État Actuel du Système

### ✅ **Composants implémentés**

#### 1. OrderManagement.jsx
- **Polling** : Vérifie les nouvelles commandes toutes les 5 secondes
- **Notifications toast** : Affiche les nouvelles commandes en haut à droite
- **Auto-suppression** : Les notifications disparaissent après 5 secondes
- **Format** : "🔔 Nouvelle commande ! Commande #XXX — Client — Montant EUR"

#### 2. AdminHeader.jsx
- **Icône de notification** : Bell avec badge pour non-lues
- **Dropdown notifications** : Affiche la liste des notifications système
- **Rafraîchissement** : Toutes les 30 secondes

#### 3. AdminSidebar.jsx
- **Affichage profil admin** : Nom et email de l'utilisateur connecté

## 🔍 Comment Vérifier le Système

### Étape 1 : Vérifier le code de polling

Dans `client/src/admin/pages/OrderManagement.jsx`, vérifiez que ce code existe :

```javascript
// Polling pour détecter les nouvelles commandes
useEffect(() => {
  const pollOrders = async () => {
    try {
      const response = await orderService.getOrders();
      const currentOrders = response.data || response || [];
      
      // Comparer avec les commandes connues
      const newOnes = currentOrders.filter(o => !knownIdsRef.current.has(o.id));
      
      if (newOnes.length > 0) {
        console.log('[Polling] 🔔', newOnes.length, 'nouvelle(s) commande(s)');
        
        newOnes.forEach(o => {
          pushNotification({
            type: 'success',
            title: '🔔 Nouvelle commande !',
            message: `Commande #${o.id} de ${o.customer_name || o.customer_email || 'client'} — ${parseFloat(o.total_amount || 0).toFixed(2)} EUR`
          });
        });
      }
    } catch (error) {
      console.error('[Polling] Erreur:', error);
    }
  };

  // Lancer le polling immédiatement puis toutes les 5 secondes
  pollOrders();
  const interval = setInterval(pollOrders, 5000);
  
  return () => clearInterval(interval);
}, []);
```

### Étape 2 : Vérifier le système de toast

Dans `client/src/admin/pages/OrderManagement.jsx`, vérifiez ce code :

```javascript
// Ajoute une notification (toast) et la retire après 5s
const pushNotification = useCallback((notif) => {
  const id = Date.now() + Math.random();
  setNotifications((prev) => [...prev, { id, ...notif }]);
  setTimeout(() => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, 5000);
}, []);

// Affichage des notifications toast
<div className="fixed top-6 right-6 z-[100] space-y-3 w-full max-w-sm pointer-events-none">
  {notifications.map((n) => {
    const s = toastStyles[n.type] || toastStyles.info;
    return (
      <div key={n.id} className={`${s.base} ${s.border} ${s.text} shadow-lg transform transition-all duration-300 ${notificationClasses}`}>
        <div className={s.content}>
          <div className={s.iconWrapper}>
            {React.createElement(n.icon, { className: s.icon })}
          </div>
          <div className={s.textWrapper}>
            <p className={s.title}>{n.title}</p>
            <p className={s.message}>{n.message}</p>
          </div>
        </div>
      </div>
    );
  })}
</div>
```

## 🧪 Test Manuel des Notifications

### Méthode 1 : Via l'interface de commande

1. **Allez sur** : http://localhost:3000
2. **Ajoutez un produit au panier**
3. **Passez commande** : Allez au checkout et complétez
4. **Vérifiez** : Une notification devrait apparaître dans l'admin

### Méthode 2 : Via base de données

1. **Créez une commande manuellement** :
```sql
INSERT INTO orders (
  order_number, user_id, email, status, currency,
  subtotal, tax_amount, shipping_amount, discount_amount, 
  total_amount, notes, created_at, updated_at
) VALUES (
  'BM-TEST-12345',
  NULL,
  'test@example.com',
  'pending',
  'EUR',
  99.99,
  0.00,
  10.00,
  0.00,
  109.99,
  '{"customer_name":"Test Client","customer_phone":"0123456789","shipping_address":"123 Test Street"}',
  NOW(),
  NOW()
);
```

2. **Vérifiez le polling** : L'admin devrait détecter la nouvelle commande

### Méthode 3 : Via script de test

1. **Exécutez** : `node server/scripts/test-notifications-simple.js`
2. **Surveillez** : La console et l'interface admin

## 🔧 Points de Vérification

### ✅ **Ce qui doit fonctionner**

1. **Polling actif** : Vérification toutes les 5 secondes
2. **Toast notifications** : Apparaissent en haut à droite
3. **Auto-disparition** : Après 5 secondes
4. **Format correct** : "🔔 Nouvelle commande ! ..."
5. **Icône notification** : Bell avec badge dans le header

### ❌ **Ce qui peut ne pas fonctionner**

1. **Backend arrêté** : Le polling ne peut pas contacter l'API
2. **Erreur API** : L'endpoint orders ne répond pas
3. **Erreur frontend** : JavaScript bloqué ou en erreur
4. **Cache navigateur** : Ancienne version du code

## 🐛 Dépannage Commun

### Problème : Pas de notifications

**Causes possibles :**
- Backend non démarré
- Endpoint `/api/admin/orders` inaccessible
- Erreur JavaScript dans la console
- Polling bloqué par le navigateur

**Solutions :**
1. Vérifiez la console du navigateur (F12)
2. Vérifiez la console du backend
3. Redémarrez les serveurs frontend et backend
4. Videz le cache navigateur (Ctrl+Shift+R)

### Problème : Notifications ne disparaissent pas

**Causes possibles :**
- Erreur dans `setTimeout`
- Problème avec `setNotifications`
- Conflit d'états React

**Solutions :**
1. Vérifiez les logs JavaScript
2. Testez manuellement `pushNotification()`
3. Vérifiez le `useCallback` dans OrderManagement

## 📊 Monitoring

### Logs à surveiller

```javascript
// Dans OrderManagement.jsx
console.log('[Polling] 🔔', newOnes.length, 'nouvelle(s) commande(s)');

// Dans la console navigateur
// Cherchez les erreurs JavaScript
// Cherchez les erreurs réseau (onglet Network)
```

### Métriques à vérifier

- **Fréquence polling** : 5 secondes (configuré)
- **Durée notification** : 5 secondes (configuré)
- **Nombre maximal** : Illimité (empilement)
- **Performance** : < 100ms par requête

## ✅ Checklist de Validation

- [ ] Backend démarré et accessible
- [ ] Frontend compilé sans erreur
- [ ] Page admin `/orders` accessible
- [ ] Console navigateur sans erreur
- [ ] Réseau : requêtes `/api/admin/orders` réussies
- [ ] Polling : visible dans les logs
- [ ] Notifications : apparaissent en toast
- [ ] Auto-suppression : notifications disparaissent après 5s

Le système de notifications est conçu pour être robuste et fiable. En cas de problème, suivez ce guide étape par étape.
