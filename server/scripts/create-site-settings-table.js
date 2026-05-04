const mysql = require('mysql2/promise');
require('dotenv').config();

async function run() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'bourbon_morelli',
    charset: 'utf8mb4'
  });

  try {
    const [tables] = await connection.execute("SHOW TABLES LIKE 'site_settings'");
    if (tables.length === 0) {
      console.log('Création de la table site_settings...');
      await connection.execute(`
        CREATE TABLE site_settings (
          setting_key VARCHAR(100) NOT NULL PRIMARY KEY,
          value LONGTEXT NOT NULL,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
      console.log('✅ Table site_settings créée.');
    } else {
      console.log('ℹ️  Table site_settings déjà présente.');
    }

    // Insérer la valeur par défaut pour 'about' si absente
    const [existing] = await connection.execute(
      'SELECT setting_key FROM site_settings WHERE setting_key = ?',
      ['about']
    );
    if (existing.length === 0) {
      const defaults = {
        hero: {
          title: 'Notre Histoire',
          subtitle: "L'élégance malgache rencontre le savoir-faire artisanal"
        },
        story: {
          title: "L'Essence de BOURBON MORELLI",
          paragraphs: [
            "Bourbon Morelli est une société de couture basée à Antananarivo (101 By Pass), Madagascar, créée en 2025. Spécialisée dans la confection de haute qualité, elle propose une large gamme de produits tels que des nappes de table, T-shirts, polos, pantalons et costumes.",
            "Forte de son savoir-faire, Bourbon Morelli s'inscrit dans une démarche de qualité et d'élégance, en valorisant un style unique inspiré de son histoire et de son environnement. Chaque pièce que nous créons est le fruit d'un travail méticuleux, alliant techniques traditionnelles et innovation contemporaine.",
            "Nous croyons que la véritable luxe réside dans la qualité des matériaux, la précision des détails et l'unicité de chaque création."
          ],
          image_caption: 'Atelier de création - Antananarivo'
        },
        values: [
          { icon: 'Award', title: 'Excellence', description: "Un engagement inébranlable envers la qualité et la perfection artisanale" },
          { icon: 'Heart', title: 'Passion', description: "L'amour du métier et la créativité au cœur de chaque collection" },
          { icon: 'Users', title: 'Authenticité', description: "Des créations uniques qui reflètent la personnalité de chacun" },
          { icon: 'Target', title: 'Innovation', description: "Allier tradition et modernité pour repousser les limites de la création" }
        ],
        milestones: [
          { year: '2025', title: 'Fondation', description: 'Création de Bourbon Morelli à Antananarivo, Madagascar' },
          { year: '2025', title: 'Lancement', description: 'Première collection de nappes de table et vêtements' },
          { year: '2025', title: 'Digital', description: 'Lancement de la plateforme e-commerce' },
          { year: '2025', title: 'Expansion', description: 'Développement de nouvelles gammes de produits' }
        ],
        team: [
          { name: 'Sophie Bourbon', role: 'Fondatrice & Directrice Créative', bio: "Passionnée de couture depuis son enfance, Sophie a transformé sa passion en une marque de renommée internationale." },
          { name: 'Pierre Morelli', role: 'Directeur Artistique', bio: "Avec plus de 20 ans d'expérience dans la mode haut de gamme, Pierre apporte une vision unique à chaque création." }
        ],
        testimonials: [
          { name: 'Marie L.', location: 'Paris, France', quote: "Des créations d'une qualité exceptionnelle. Le service client est à la hauteur de la réputation de la marque." },
          { name: 'James K.', location: 'New York, USA', quote: "Chaque pièce est une œuvre d'art. Je suis cliente depuis des années et je n'ai jamais été déçue." },
          { name: 'Sophie M.', location: 'Londres, UK', quote: "L'élégance française à son meilleur niveau. Des vêtements qui traversent les tendances et le temps." }
        ],
        cta: {
          title: "Rejoignez l'Aventure BOURBON MORELLI",
          subtitle: "Découvrez nos créations uniques et laissez-vous séduire par l'élégance intemporelle de la couture française."
        }
      };
      await connection.execute(
        'INSERT INTO site_settings (setting_key, value) VALUES (?, ?)',
        ['about', JSON.stringify(defaults)]
      );
      console.log("✅ Contenu par défaut 'about' inséré.");
    } else {
      console.log("ℹ️  Contenu 'about' déjà présent.");
    }
  } catch (err) {
    console.error('❌ Erreur:', err);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

run();
