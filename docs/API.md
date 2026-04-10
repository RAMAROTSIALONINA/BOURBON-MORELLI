# Documentation API - BOURBON MORELLI

## Base URL

```
Development: http://localhost:5000/api
Production: https://votre-domaine.com/api
```

## Authentification

La plupart des endpoints nécessitent un token JWT dans l'en-tête :

```
Authorization: Bearer <votre_token_jwt>
```

## Endpoints

### Authentification

#### POST /auth/register
Inscription d'un nouvel utilisateur

**Request Body:**
```json
{
  "first_name": "Jean",
  "last_name": "Dupont",
  "email": "jean.dupont@email.com",
  "password": "password123",
  "phone": "+33612345678"
}
```

**Response:**
```json
{
  "message": "Inscription réussie",
  "user": {
    "id": 1,
    "first_name": "Jean",
    "last_name": "Dupont",
    "email": "jean.dupont@email.com",
    "role": "customer"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### POST /auth/login
Connexion d'un utilisateur

**Request Body:**
```json
{
  "email": "jean.dupont@email.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "message": "Connexion réussie",
  "user": {
    "id": 1,
    "first_name": "Jean",
    "last_name": "Dupont",
    "email": "jean.dupont@email.com",
    "role": "customer"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### GET /auth/me
Récupérer les informations de l'utilisateur connecté

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "user": {
    "id": 1,
    "first_name": "Jean",
    "last_name": "Dupont",
    "email": "jean.dupont@email.com",
    "phone": "+33612345678",
    "role": "customer",
    "addresses": [],
    "stats": {
      "total_orders": 5,
      "total_spent": 1299.99,
      "last_order_date": "2024-01-15T10:30:00Z"
    }
  }
}
```

### Produits

#### GET /products
Récupérer la liste des produits

**Query Parameters:**
- `page` (number): Page actuelle (défaut: 1)
- `limit` (number): Nombre par page (défaut: 20)
- `category` (string): Filtrer par catégorie
- `minPrice` (number): Prix minimum
- `maxPrice` (number): Prix maximum
- `search` (string): Recherche textuelle
- `sort` (string): Tri (featured, price-asc, price-desc, name-asc, name-desc, newest, rating)
- `featured` (boolean): Produits mis en avant

**Response:**
```json
{
  "products": [
    {
      "id": 1,
      "name": "Robe de Soirée Noire",
      "slug": "robe-de-soiree-noire",
      "price": 299.99,
      "compare_price": 399.99,
      "description": "Une robe de soirée élégante...",
      "category_name": "Robes",
      "images": ["/images/robe-noire-1.jpg"],
      "rating": 4.5,
      "reviews_count": 12,
      "inventory_quantity": 5,
      "featured": true
    }
  ],
  "pagination": {
    "current_page": 1,
    "per_page": 20,
    "total": 50,
    "total_pages": 3,
    "has_next": true,
    "has_prev": false
  }
}
```

#### GET /products/:slug
Récupérer les détails d'un produit

**Response:**
```json
{
  "id": 1,
  "name": "Robe de Soirée Noire",
  "slug": "robe-de-soiree-noire",
  "price": 299.99,
  "compare_price": 399.99,
  "description": "Description complète...",
  "images": [
    {
      "image_url": "/images/robe-noire-1.jpg",
      "alt_text": "Robe de soirée noire",
      "is_primary": true
    }
  ],
  "variants": [
    {
      "id": 1,
      "name": "Robe Noire Taille M",
      "sku": "RSN001-M",
      "price": 299.99,
      "inventory_quantity": 2,
      "options": [
        {"name": "Taille", "value": "M"},
        {"name": "Couleur", "value": "Noir"}
      ]
    }
  ],
  "reviews": [...],
  "similar_products": [...]
}
```

### Panier

#### GET /cart
Récupérer le contenu du panier

**Headers:** `Authorization: Bearer <token>` (optionnel)

**Response:**
```json
{
  "items": [
    {
      "id": 1,
      "product_id": 1,
      "name": "Robe de Soirée Noire",
      "price": 299.99,
      "quantity": 1,
      "image_url": "/images/robe-noire-1.jpg",
      "total": 299.99
    }
  ],
  "subtotal": 299.99,
  "total_items": 1,
  "cart_id": 123
}
```

#### POST /cart/add
Ajouter un produit au panier

**Headers:** `Authorization: Bearer <token>` (optionnel)

**Request Body:**
```json
{
  "product_id": 1,
  "quantity": 1,
  "variant_id": 1
}
```

**Response:**
```json
{
  "message": "Produit ajouté au panier avec succès",
  "cart_id": 123
}
```

#### PUT /cart/update/:itemId
Mettre à jour la quantité d'un article

**Request Body:**
```json
{
  "quantity": 2
}
```

#### DELETE /cart/remove/:itemId
Supprimer un article du panier

#### DELETE /cart/clear
Vider le panier

### Commandes

#### POST /orders
Créer une nouvelle commande

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "items": [
    {
      "product_id": 1,
      "quantity": 1,
      "variant_id": 1
    }
  ],
  "shipping_address": {
    "first_name": "Jean",
    "last_name": "Dupont",
    "street_address": "123 Rue de la Mode",
    "city": "Paris",
    "postal_code": "75001",
    "country": "France",
    "phone": "+33612345678"
  },
  "billing_address": {
    // Même structure que shipping_address
  },
  "currency": "EUR"
}
```

**Response:**
```json
{
  "message": "Commande créée avec succès",
  "order": {
    "id": 123,
    "order_number": "BM16409952000001",
    "status": "pending",
    "total_amount": 309.98,
    "items": [...]
  }
}
```

#### GET /orders
Récupérer les commandes de l'utilisateur

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `page` (number): Page actuelle
- `limit` (number): Nombre par page
- `status` (string): Filtrer par statut

#### GET /orders/:id
Récupérer les détails d'une commande

#### PUT /orders/:id/cancel
Annuler une commande

### Paiements

#### POST /payments/stripe/create-intent
Créer une intention de paiement Stripe

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "order_id": 123,
  "currency": "EUR"
}
```

**Response:**
```json
{
  "client_secret": "pi_1234567890_secret_abcdef",
  "payment_intent_id": "pi_1234567890",
  "amount": 299.99,
  "currency": "EUR"
}
```

#### POST /payments/stripe/confirm
Confirmer un paiement Stripe

**Request Body:**
```json
{
  "payment_intent_id": "pi_1234567890",
  "order_id": 123
}
```

### Catégories

#### GET /categories
Récupérer toutes les catégories

**Response:**
```json
[
  {
    "id": 1,
    "name": "Robes",
    "slug": "robes",
    "description": "Collection de robes élégantes",
    "product_count": 15,
    "subcategories": [
      {
        "id": 2,
        "name": "Robes de soirée",
        "slug": "robes-de-soiree",
        "product_count": 8
      }
    ]
  }
]
```

#### GET /categories/:slug
Récupérer une catégorie et ses produits

### Administration

#### GET /admin/dashboard
Tableau de bord administrateur

**Headers:** `Authorization: Bearer <token>` (admin requis)

**Response:**
```json
{
  "stats": {
    "total_customers": 150,
    "active_products": 45,
    "total_orders": 320,
    "pending_orders": 5,
    "total_revenue": 45678.90
  },
  "recent_orders": [...],
  "top_products": [...],
  "sales_chart": [...]
}
```

#### GET /admin/products
Gestion des produits (admin)

#### POST /admin/products
Créer un produit (admin)

#### PUT /admin/products/:id
Mettre à jour un produit (admin)

#### DELETE /admin/products/:id
Supprimer un produit (admin)

## Codes d'erreur

- `200` : Succès
- `201` : Créé avec succès
- `400` : Erreur de validation
- `401` : Non autorisé
- `403` : Accès interdit
- `404` : Ressource non trouvée
- `409` : Conflit (doublon)
- `500` : Erreur serveur

## Rate Limiting

- 100 requêtes par 15 minutes par IP
- Les endpoints d'authentification ont des limites plus strictes

## Sécurité

- Tous les mots de passe sont hashés avec bcrypt
- Les tokens JWT expirent après 7 jours
- Protection contre les attaques CSRF
- Validation stricte des entrées
- HTTPS obligatoire en production
