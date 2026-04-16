// Service centralisé pour la gestion du panier
// Assure la synchronisation entre tous les composants

class CartService {
  constructor() {
    this.listeners = [];
    this.cart = this.loadCart();
  }

  // Charger le panier depuis localStorage
  loadCart() {
    try {
      const savedCart = localStorage.getItem('cart');
      return savedCart ? JSON.parse(savedCart) : [];
    } catch (error) {
      console.error('Erreur chargement panier:', error);
      return [];
    }
  }

  // Sauvegarder le panier dans localStorage
  saveCart(cart) {
    try {
      localStorage.setItem('cart', JSON.stringify(cart));
      this.cart = cart;
      this.notifyListeners();
      return true;
    } catch (error) {
      console.error('Erreur sauvegarde panier:', error);
      return false;
    }
  }

  // Ajouter un produit au panier
  addToCart(product) {
    const cart = this.loadCart();
    const existingItem = cart.find(item => item.id === product.id);
    
    if (existingItem) {
      existingItem.quantity += 1;
    } else {
      cart.push({
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.image_url || product.images?.[0] || '/images/placeholder-product.jpg',
        image_url: product.image_url || product.images?.[0] || '/images/placeholder-product.jpg',
        images: product.images || [product.image_url] || ['/images/placeholder-product.jpg'],
        quantity: 1,
        slug: product.slug
      });
    }
    
    const success = this.saveCart(cart);
    if (success) {
      console.log(`"${product.name}" ajouté au panier`);
      this.notifyCartUpdate();
    }
    
    return success;
  }

  // Mettre à jour la quantité d'un produit
  updateQuantity(productId, newQuantity) {
    if (newQuantity < 1) return false;
    
    const cart = this.loadCart();
    const item = cart.find(item => item.id === productId);
    
    if (item) {
      item.quantity = newQuantity;
      const success = this.saveCart(cart);
      if (success) {
        console.log(`Quantité mise à jour: ${newQuantity}`);
        this.notifyCartUpdate();
      }
      return success;
    }
    
    return false;
  }

  // Retirer un produit du panier
  removeFromCart(productId) {
    const cart = this.loadCart();
    const updatedCart = cart.filter(item => item.id !== productId);
    const success = this.saveCart(updatedCart);
    
    if (success) {
      console.log(`Produit ${productId} retiré du panier`);
      this.notifyCartUpdate();
    }
    
    return success;
  }

  // Vider le panier
  clearCart() {
    const success = this.saveCart([]);
    
    if (success) {
      console.log('Panier vidé');
      this.notifyCartUpdate();
    }
    
    return success;
  }

  // Obtenir le nombre total d'articles
  getCartCount() {
    return this.cart.reduce((total, item) => total + item.quantity, 0);
  }

  // Obtenir le total du panier
  getCartTotal() {
    return this.cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  }

  // Obtenir les articles du panier avec détails
  getCartItems() {
    return this.cart.map(item => ({
      ...item,
      total: item.price * item.quantity,
      images: item.images || [item.image] || ['/images/placeholder-product.jpg'],
      category: { name: 'Produits' }
    }));
  }

  // Obtenir le panier complet (compatibilité)
  getCart() {
    return {
      items: this.getCartItems(),
      count: this.getCartCount(),
      total: this.getCartTotal()
    };
  }

  // S'abonner aux changements du panier
  subscribe(listener) {
    this.listeners.push(listener);
    
    // Retourner la fonction de désabonnement
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  // Notifier tous les listeners
  notifyListeners() {
    this.listeners.forEach(listener => {
      try {
        listener(this.cart);
      } catch (error) {
        console.error('Erreur listener panier:', error);
      }
    });
  }

  // Notifier les mises à jour du panier (pour le compteur)
  notifyCartUpdate() {
    // Émettre un événement custom pour les autres composants
    window.dispatchEvent(new CustomEvent('cartUpdate', {
      detail: {
        count: this.getCartCount(),
        cart: this.cart
      }
    }));
  }
}

// Créer une instance singleton
const cartService = new CartService();

export default cartService;
