// Service centralisé pour les données produits
// Assure la cohérence entre Collections, Commandes et Favoris

const PRODUCTS_DATABASE = [
  {
    id: 1,
    name: 'Nappe de Table Élégante',
    slug: 'nappe-de-table-elegante',
    price: 89.99,
    compare_price: 119.99,
    description: 'Une nappe de table élégante en coton premium',
    category: { name: 'Nappes' },
    images: ['/images/Nape%20de%20table.PNG', '/images/Nape%20de%20table1.PNG', '/images/Nape%20de%20table2.PNG'],
    featured: true,
    rating: 5,
    reviews_count: 12,
    inventory_quantity: 5,
    stock: 5,
    reviews: 12,
    sizes: ['120x180cm', '140x200cm', '160x240cm']
  },
  {
    id: 2,
    name: 'T-shirt Premium',
    slug: 'tshirt-premium',
    price: 39.99,
    compare_price: null,
    description: 'T-shirt en coton bio de haute qualité',
    category: { name: 'T-Shirts' },
    images: ['/images/T-shirts1.PNG', '/images/T-shirts2.PNG', '/images/T-shirts3.PNG'],
    featured: true,
    rating: 4,
    reviews_count: 8,
    inventory_quantity: 3,
    stock: 3,
    reviews: 8,
    sizes: ['S', 'M', 'L', 'XL']
  },
  {
    id: 3,
    name: 'Polo Classique',
    slug: 'polo-classique',
    price: 49.99,
    compare_price: null,
    description: 'Polo en piqué de coton avec col traditionnel',
    category: { name: 'Polos' },
    images: ['/images/Polos.PNG', '/images/Polos%201.PNG', '/images/Polos%202.PNG'],
    featured: false,
    rating: 4,
    reviews_count: 6,
    inventory_quantity: 15,
    stock: 15,
    reviews: 6,
    sizes: ['S', 'M', 'L', 'XL', 'XXL']
  },
  {
    id: 4,
    name: 'Pantalon Chic',
    slug: 'pantalon-chic',
    price: 79.99,
    compare_price: null,
    description: 'Pantalon élégant en laine mélangée',
    category: { name: 'Pantalons' },
    images: ['/images/Pantalons.PNG', '/images/Pantalons%201.PNG', '/images/Pantalons%202.PNG'],
    featured: false,
    rating: 4,
    reviews_count: 10,
    inventory_quantity: 8,
    stock: 8,
    reviews: 10,
    sizes: ['30', '32', '34', '36', '38', '40']
  }
];

const productDataService = {
  // Obtenir tous les produits
  getAllProducts: () => {
    return PRODUCTS_DATABASE;
  },

  // Obtenir un produit par ID
  getProductById: (id) => {
    return PRODUCTS_DATABASE.find(product => product.id === id);
  },

  // Obtenir un produit par slug
  getProductBySlug: (slug) => {
    return PRODUCTS_DATABASE.find(product => product.slug === slug);
  },

  // Obtenir les produits par catégorie
  getProductsByCategory: (categoryName) => {
    return PRODUCTS_DATABASE.filter(product => 
      product.category.name.toLowerCase() === categoryName.toLowerCase()
    );
  },

  // Obtenir les produits mis en avant
  getFeaturedProducts: () => {
    return PRODUCTS_DATABASE.filter(product => product.featured);
  },

  // Formater un produit pour les favoris
  formatForWishlist: (product) => {
    return {
      id: product.id,
      name: product.name,
      slug: product.slug,
      price: product.price,
      originalPrice: product.compare_price,
      image: product.images?.[0] || '/images/placeholder.jpg',
      category: product.category?.name || 'Non catégorisé',
      rating: product.rating || 0,
      reviews: product.reviews_count || product.reviews || 0,
      inStock: product.stock > 0 || product.inventory_quantity > 0,
      addedDate: new Date().toISOString().split('T')[0]
    };
  },

  // Formater un produit pour les commandes
  formatForOrder: (product, variant = '', quantity = 1) => {
    return {
      id: product.id,
      name: product.name,
      variant: variant || `Taille unique, ${product.category?.name || 'Standard'}`,
      quantity: quantity,
      price: product.price,
      image: product.images?.[0] || '/images/placeholder.jpg'
    };
  },

  // Obtenir les produits de test pour les favoris
  getTestWishlistProducts: () => {
    return PRODUCTS_DATABASE.slice(0, 3).map(product => 
      productDataService.formatForWishlist(product)
    );
  },

  // Obtenir les produits de test pour les commandes
  getTestOrderProducts: () => {
    return [
      productDataService.formatForOrder(PRODUCTS_DATABASE[1], 'Taille M, Blanc', 2), // T-shirt
      productDataService.formatForOrder(PRODUCTS_DATABASE[0], '200x300cm', 1) // Nappe
    ];
  },

  // Obtenir les produits de test pour la deuxième commande
  getTestOrderProducts2: () => {
    return [
      productDataService.formatForOrder(PRODUCTS_DATABASE[2], 'Taille L, Bleu', 1), // Polo
      productDataService.formatForOrder(PRODUCTS_DATABASE[3], 'Taille 42, Beige', 1) // Pantalon
    ];
  }
};

export default productDataService;
