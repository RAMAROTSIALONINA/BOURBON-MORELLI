const mysql = require('mysql2/promise');
require('dotenv').config();

async function createFooterTable() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'bourbon_morelli',
      charset: 'utf8mb4'
    });

    console.log('=== CRÉATION DE LA TABLE FOOTER ===\n');

    // Créer la table footer_settings
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS footer_settings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        section VARCHAR(50) NOT NULL,
        content_type VARCHAR(20) NOT NULL,
        key_name VARCHAR(100) NOT NULL,
        value TEXT,
        label VARCHAR(200),
        display_order INT DEFAULT 0,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY unique_section_key (section, key_name),
        INDEX idx_section (section),
        INDEX idx_content_type (content_type)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;

    await connection.execute(createTableQuery);
    console.log('✅ Table footer_settings créée avec succès');

    // Insérer les données par défaut
    const defaultData = [
      // Informations de contact
      { section: 'contact', content_type: 'text', key_name: 'email', value: 'contact@bourbonmorelli.com', label: 'Email', display_order: 1 },
      { section: 'contact', content_type: 'text', key_name: 'phone', value: '+33 1 23 45 67 89', label: 'Téléphone', display_order: 2 },
      { section: 'contact', content_type: 'text', key_name: 'address', value: 'Antananarivo, Madagascar', label: 'Adresse', display_order: 3 },

      // Copyright
      { section: 'copyright', content_type: 'text', key_name: 'copyright_text', value: '© {year} BOURBON MORELLI. Tous droits réservés.', label: 'Texte copyright', display_order: 1 },

      // Description de la marque
      { section: 'brand', content_type: 'textarea', key_name: 'description', value: 'Découvrez l\'élégance intemporelle de la couture Malgache avec nos créations sur mesure, alliant savoir-faire traditionnel et modernité.', label: 'Description de la marque', display_order: 1 },

      // Newsletter
      { section: 'newsletter', content_type: 'text', key_name: 'title', value: 'Abonnez-vous à notre newsletter', label: 'Titre newsletter', display_order: 1 },
      { section: 'newsletter', content_type: 'text', key_name: 'placeholder', value: 'Votre adresse email', label: 'Placeholder email', display_order: 2 },
      { section: 'newsletter', content_type: 'text', key_name: 'button_text', value: 'S\'abonner', label: 'Texte bouton', display_order: 3 },

      // Liens sociaux
      { section: 'social', content_type: 'link', key_name: 'facebook', value: '#', label: 'Facebook', display_order: 1 },
      { section: 'social', content_type: 'link', key_name: 'instagram', value: '#', label: 'Instagram', display_order: 2 },
      { section: 'social', content_type: 'link', key_name: 'twitter', value: '#', label: 'Twitter', display_order: 3 },
      { section: 'social', content_type: 'link', key_name: 'youtube', value: '#', label: 'YouTube', display_order: 4 },

      // Features
      { section: 'features', content_type: 'feature', key_name: 'payment', value: '{"title":"Paiement sécurisé","description":"100% sécurisé avec Stripe et PayPal"}', label: 'Paiement sécurisé', display_order: 1 },
      { section: 'features', content_type: 'feature', key_name: 'shipping', value: '{"title":"Livraison gratuite","description":"À partir de 200€ d\'achat"}', label: 'Livraison gratuite', display_order: 2 },
      { section: 'features', content_type: 'feature', key_name: 'satisfaction', value: '{"title":"Satisfaction garantie","description":"30 jours pour retourner votre commande"}', label: 'Satisfaction garantie', display_order: 3 },
      { section: 'features', content_type: 'feature', key_name: 'returns', value: '{"title":"Retours faciles","description":"Processus de retour simplifié"}', label: 'Retours faciles', display_order: 4 },

      // Liens légaux
      { section: 'legal', content_type: 'link', key_name: 'privacy', value: '/privacy', label: 'Confidentialité', display_order: 1 },
      { section: 'legal', content_type: 'link', key_name: 'terms', value: '/terms', label: 'CGV', display_order: 2 },
      { section: 'legal', content_type: 'link', key_name: 'legal', value: '/legal', label: 'Mentions légales', display_order: 3 },
      { section: 'legal', content_type: 'link', key_name: 'cookies', value: '/cookies', label: 'Cookies', display_order: 4 },

      // Liens de navigation - Boutique
      { section: 'navigation', content_type: 'link', key_name: 'shop_new', value: '/new', label: 'Nouveautés', display_order: 1 },
      { section: 'navigation', content_type: 'link', key_name: 'shop_bestsellers', value: '/bestsellers', label: 'Meilleures ventes', display_order: 2 },
      { section: 'navigation', content_type: 'link', key_name: 'shop_sales', value: '/sales', label: 'Promotions', display_order: 3 },
      { section: 'navigation', content_type: 'link', key_name: 'shop_collections', value: '/collections', label: 'Collections', display_order: 4 },

      // Liens de navigation - Service client
      { section: 'navigation', content_type: 'link', key_name: 'customer_account', value: '/account', label: 'Mon compte', display_order: 5 },
      { section: 'navigation', content_type: 'link', key_name: 'customer_orders', value: '/account/orders', label: 'Historique des commandes', display_order: 6 },
      { section: 'navigation', content_type: 'link', key_name: 'customer_wishlist', value: '/account/wishlist', label: 'Favoris', display_order: 7 },
      { section: 'navigation', content_type: 'link', key_name: 'customer_newsletter', value: '/newsletter', label: 'Newsletter', display_order: 8 },

      // Liens de navigation - Aide
      { section: 'navigation', content_type: 'link', key_name: 'help_contact', value: '/contact', label: 'Contact', display_order: 9 },
      { section: 'navigation', content_type: 'link', key_name: 'help_faq', value: '/faq', label: 'FAQ', display_order: 10 },
      { section: 'navigation', content_type: 'link', key_name: 'help_shipping', value: '/shipping', label: 'Livraison', display_order: 11 },
      { section: 'navigation', content_type: 'link', key_name: 'help_returns', value: '/returns', label: 'Retours', display_order: 12 },
      { section: 'navigation', content_type: 'link', key_name: 'help_size_guide', value: '/size-guide', label: 'Guide des tailles', display_order: 13 },
      { section: 'navigation', content_type: 'link', key_name: 'help_care', value: '/care', label: 'Entretien', display_order: 14 },

      // Liens de navigation - Entreprise
      { section: 'navigation', content_type: 'link', key_name: 'company_about', value: '/about', label: 'À propos', display_order: 15 },
      { section: 'navigation', content_type: 'link', key_name: 'company_story', value: '/story', label: 'Notre histoire', display_order: 16 },
      { section: 'navigation', content_type: 'link', key_name: 'company_stores', value: '/stores', label: 'Boutiques', display_order: 17 },
      { section: 'navigation', content_type: 'link', key_name: 'company_careers', value: '/careers', label: 'Carrières', display_order: 18 },
      { section: 'navigation', content_type: 'link', key_name: 'company_press', value: '/press', label: 'Presse', display_order: 19 },
      { section: 'navigation', content_type: 'link', key_name: 'company_sustainability', value: '/sustainability', label: 'Durabilité', display_order: 20 }
    ];

    console.log('\n=== INSERTION DES DONNÉES PAR DÉFAUT ===\n');

    for (const data of defaultData) {
      try {
        await connection.execute(
          'INSERT IGNORE INTO footer_settings (section, content_type, key_name, value, label, display_order) VALUES (?, ?, ?, ?, ?, ?)',
          [data.section, data.content_type, data.key_name, data.value, data.label, data.display_order]
        );
        console.log(`✅ ${data.label} inséré`);
      } catch (error) {
        if (error.code !== 'ER_DUP_ENTRY') {
          console.log(`❌ Erreur insertion ${data.label}:`, error.message);
        }
      }
    }

    // Vérifier les données insérées
    const [rows] = await connection.execute('SELECT COUNT(*) as total FROM footer_settings');
    console.log(`\n📊 Total d'enregistrements dans footer_settings: ${rows[0].total}`);

    await connection.end();
    console.log('\n🎉 Table footer_settings créée et initialisée avec succès !');

  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
}

createFooterTable();
