# Guide d'Installation - BOURBON MORELLI

## Prérequis

- Node.js (v16 ou supérieur)
- MySQL (v8.0 ou supérieur)
- npm ou yarn
- Git

## Installation

### 1. Cloner le projet

```bash
git clone <repository-url>
cd bourbon-morelli
```

### 2. Installation des dépendances

```bash
# Installer toutes les dépendances (racine, client et serveur)
npm run install-all

# Ou manuellement :
npm install
cd client && npm install
cd ../server && npm install
```

### 3. Configuration de la base de données

1. Créer une base de données MySQL :
```sql
CREATE DATABASE bourbon_morelli CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

2. Importer le schéma :
```bash
mysql -u votre_utilisateur -p bourbon_morelli < database/schema.sql
```

3. Configurer la connexion à la base de données :
```bash
cd server
cp .env.example .env
```

Éditez le fichier `.env` avec vos informations :
```env
DB_HOST=localhost
DB_USER=votre_utilisateur_mysql
DB_PASSWORD=votre_mot_de_passe_mysql
DB_NAME=bourbon_morelli
```

### 4. Configuration des variables d'environnement

Dans `server/.env`, configurez également :

```env
# JWT
JWT_SECRET=votre_jwt_secret_tres_long_et_securise
JWT_EXPIRES_IN=7d

# Stripe (pour les paiements)
STRIPE_PUBLIC_KEY=pk_test_votre_cle_publique_stripe
STRIPE_SECRET_KEY=sk_test_votre_cle_secrete_stripe

# PayPal (pour les paiements)
PAYPAL_MODE=sandbox
PAYPAL_CLIENT_ID=votre_client_id_paypal
PAYPAL_CLIENT_SECRET=votre_client_secret_paypal

# Email
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=votre_email@gmail.com
EMAIL_PASS=votre_mot_de_passe_email

# URL du frontend
FRONTEND_URL=http://localhost:3000
```

### 5. Démarrer l'application

#### Mode développement

```bash
# Depuis la racine du projet
npm run dev
```

Cela démarrera :
- Le frontend sur http://localhost:3000
- Le backend sur http://localhost:5000

#### Mode production

```bash
# Construire le frontend
cd client && npm run build

# Démarrer le serveur en mode production
cd ../server && npm start
```

## Structure du projet

```
bourbon-morelli/
├── client/                 # Frontend React
│   ├── public/            # Fichiers statiques
│   ├── src/
│   │   ├── components/    # Composants React
│   │   ├── pages/        # Pages de l'application
│   │   ├── hooks/        # Hooks personnalisés
│   │   ├── services/     # Services API
│   │   └── styles/       # Styles CSS/Tailwind
│   └── package.json
├── server/                # Backend Node.js
│   ├── controllers/       # Contrôleurs API
│   ├── models/           # Modèles de données
│   ├── routes/           # Routes API
│   ├── middleware/       # Middleware
│   ├── config/           # Configuration
│   └── package.json
├── database/             # Scripts SQL
└── docs/                # Documentation
```

## Fonctionnalités

### Client (React)
- 🛍️ Catalogue produits avec filtres avancés
- 🛒 Panier d'achat intelligent
- 👤 Compte utilisateur personnalisé
- 💳 Intégration Stripe et PayPal
- 📱 Design responsive
- 🎨 Interface moderne avec TailwindCSS

### Serveur (Node.js)
- 🔐 Authentification JWT sécurisée
- 📊 API REST complète
- 💾 Base de données MySQL robuste
- 🛡️ Sécurité avancée (Helmet, Rate Limiting)
- 📧 Notifications email
- 📈 Analytics et statistiques

## Configuration des paiements

### Stripe

1. Créez un compte Stripe : https://dashboard.stripe.com/register
2. Récupérez vos clés API depuis le dashboard
3. Configurez les webhooks pour recevoir les notifications de paiement

### PayPal

1. Créez un compte développeur PayPal : https://developer.paypal.com/
2. Créez une application et récupérez vos identifiants
3. Configurez les URLs de retour et d'annulation

## Déploiement

### Heroku

1. Installez Heroku CLI
2. Créez une application Heroku
3. Configurez les variables d'environnement
4. Déployez avec Git

### VPS (Ubuntu/Debian)

1. Installez Node.js, MySQL, Nginx
2. Configurez Nginx comme reverse proxy
3. Utilisez PM2 pour la gestion des processus
4. Configurez SSL avec Let's Encrypt

## Dépannage

### Problèmes courants

**Erreur de connexion à la base de données**
- Vérifiez que MySQL est en cours d'exécution
- Vérifiez les identifiants dans `.env`
- Assurez-vous que la base de données existe

**Problèmes de dépendances**
- Supprimez `node_modules` et `package-lock.json`
- Réinstallez avec `npm install`

**Port déjà utilisé**
- Changez le port dans `.env` ou dans les scripts
- Vérifiez qu'aucun autre processus n'utilise le port

### Logs

- Logs du serveur : `server/logs/`
- Logs de la base de données : `/var/log/mysql/`

## Support

Pour toute question ou problème, contactez :
- Email : support@bourbonmorelli.com
- Documentation : https://docs.bourbonmorelli.com
