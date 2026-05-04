import axios from 'axios';

const API_BASE_URL = 'http://localhost:5003/api/public';

const footerService = {
  // Récupérer les données du footer pour le client
  getFooterData: async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/footer`);
      return response.data;
    } catch (error) {
      console.error('Erreur récupération footer data:', error);
      // Retourner des données par défaut en cas d'erreur
      return {
        success: false,
        data: getDefaultFooterData()
      };
    }
  }
};

// Données par défaut si l'API n'est pas disponible
const getDefaultFooterData = () => {
  return {
    contact: [
      { key_name: 'email', value: 'contact@bourbonmorelli.com', label: 'Email', content_type: 'text' },
      { key_name: 'phone', value: '+33 1 23 45 67 89', label: 'Téléphone', content_type: 'text' },
      { key_name: 'address', value: 'Antananarivo, Madagascar', label: 'Adresse', content_type: 'text' }
    ],
    copyright: [
      { key_name: 'copyright_text', value: '© {year} BOURBON MORELLI. Tous droits réservés.', label: 'Texte copyright', content_type: 'text' }
    ],
    brand: [
      { key_name: 'description', value: 'Découvrez l\'élégance intemporelle de la couture Malgache avec nos créations sur mesure, alliant savoir-faire traditionnel et modernité.', label: 'Description de la marque', content_type: 'textarea' }
    ],
    newsletter: [
      { key_name: 'title', value: 'Abonnez-vous à notre newsletter', label: 'Titre newsletter', content_type: 'text' },
      { key_name: 'placeholder', value: 'Votre adresse email', label: 'Placeholder email', content_type: 'text' },
      { key_name: 'button_text', value: 'S\'abonner', label: 'Texte bouton', content_type: 'text' }
    ],
    social: [
      { key_name: 'facebook', value: '#', label: 'Facebook', content_type: 'link' },
      { key_name: 'instagram', value: '#', label: 'Instagram', content_type: 'link' },
      { key_name: 'twitter', value: '#', label: 'Twitter', content_type: 'link' },
      { key_name: 'youtube', value: '#', label: 'YouTube', content_type: 'link' }
    ],
    features: [
      { key_name: 'payment', value: { title: 'Paiement sécurisé', description: '100% sécurisé avec Stripe et PayPal' }, label: 'Paiement sécurisé', content_type: 'feature' },
      { key_name: 'shipping', value: { title: 'Livraison gratuite', description: 'À partir de 200€ d\'achat' }, label: 'Livraison gratuite', content_type: 'feature' },
      { key_name: 'satisfaction', value: { title: 'Satisfaction garantie', description: '30 jours pour retourner votre commande' }, label: 'Satisfaction garantie', content_type: 'feature' },
      { key_name: 'returns', value: { title: 'Retours faciles', description: 'Processus de retour simplifié' }, label: 'Retours faciles', content_type: 'feature' }
    ],
    legal: [
      { key_name: 'privacy', value: '/privacy', label: 'Confidentialité', content_type: 'link' },
      { key_name: 'terms', value: '/terms', label: 'CGV', content_type: 'link' },
      { key_name: 'legal', value: '/legal', label: 'Mentions légales', content_type: 'link' },
      { key_name: 'cookies', value: '/cookies', label: 'Cookies', content_type: 'link' }
    ],
    navigation: [
      { key_name: 'shop_new', value: '/new', label: 'Nouveautés', content_type: 'link' },
      { key_name: 'shop_bestsellers', value: '/bestsellers', label: 'Meilleures ventes', content_type: 'link' },
      { key_name: 'shop_sales', value: '/sales', label: 'Promotions', content_type: 'link' },
      { key_name: 'shop_collections', value: '/collections', label: 'Collections', content_type: 'link' },
      { key_name: 'customer_account', value: '/account', label: 'Mon compte', content_type: 'link' },
      { key_name: 'customer_orders', value: '/account/orders', label: 'Historique des commandes', content_type: 'link' },
      { key_name: 'customer_wishlist', value: '/account/wishlist', label: 'Favoris', content_type: 'link' },
      { key_name: 'customer_newsletter', value: '/newsletter', label: 'Newsletter', content_type: 'link' },
      { key_name: 'help_contact', value: '/contact', label: 'Contact', content_type: 'link' },
      { key_name: 'help_faq', value: '/faq', label: 'FAQ', content_type: 'link' },
      { key_name: 'help_shipping', value: '/shipping', label: 'Livraison', content_type: 'link' },
      { key_name: 'help_returns', value: '/returns', label: 'Retours', content_type: 'link' },
      { key_name: 'help_size_guide', value: '/size-guide', label: 'Guide des tailles', content_type: 'link' },
      { key_name: 'help_care', value: '/care', label: 'Entretien', content_type: 'link' },
      { key_name: 'company_about', value: '/about', label: 'À propos', content_type: 'link' },
      { key_name: 'company_story', value: '/story', label: 'Notre histoire', content_type: 'link' },
      { key_name: 'company_stores', value: '/stores', label: 'Boutiques', content_type: 'link' },
      { key_name: 'company_careers', value: '/careers', label: 'Carrières', content_type: 'link' },
      { key_name: 'company_press', value: '/press', label: 'Presse', content_type: 'link' },
      { key_name: 'company_sustainability', value: '/sustainability', label: 'Durabilité', content_type: 'link' }
    ]
  };
};

export default footerService;
