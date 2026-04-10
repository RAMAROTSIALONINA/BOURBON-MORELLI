import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import ProductGrid from '../components/ProductGrid';
import { ArrowRight, Star, Truck, Shield, Sparkles } from 'lucide-react';

const Home = () => {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  // const [newProducts, setNewProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simuler le chargement des produits
    setTimeout(() => {
      const mockProducts = [
        {
          id: 1,
          name: 'Nappe de Table Luxe',
          slug: 'nappe-de-table-luxe',
          price: 89.99,
          compare_price: 119.99,
          description: 'Une nappe de table élégante en coton premium, parfaite pour les occasions spéciales.',
          category: { name: 'Nappes' },
          images: ['/images/Nape%20de%20table.PNG', '/images/Nape%20de%20table1.PNG', '/images/Nape%20de%20table2.PNG'],
          featured: true,
          rating: 5,
          reviews_count: 12,
          inventory_quantity: 5
        },
        {
          id: 2,
          name: 'T-shirt Premium',
          slug: 'tshirt-premium',
          price: 39.99,
          description: 'T-shirt en coton bio de haute qualité, confortable et durable.',
          category: { name: 'T-Shirts' },
          images: ['/images/T-shirts1.PNG', '/images/T-shirts2.PNG', '/images/T-shirts3.PNG'],
          featured: true,
          rating: 4,
          reviews_count: 8,
          inventory_quantity: 3
        },
        {
          id: 3,
          name: 'Polo Classique',
          slug: 'polo-classique',
          price: 49.99,
          description: 'Polo en piqué de coton avec col traditionnel, idéal pour le sport et le casual.',
          category: { name: 'Polos' },
          images: ['/images/Polos.PNG', '/images/Polos%201.PNG', '/images/Polos%202.PNG'],
          featured: false,
          rating: 4,
          reviews_count: 6,
          inventory_quantity: 15
        },
        {
          id: 4,
          name: 'Pantalon Chic',
          slug: 'pantalon-chic',
          price: 79.99,
          description: 'Pantalon élégant en laine mélangée, parfait pour le bureau et les événements.',
          category: { name: 'Pantalons' },
          images: ['/images/Pantalons.PNG', '/images/Pantalons%201.PNG', '/images/Pantalons%202.PNG'],
          featured: true,
          rating: 5,
          reviews_count: 10,
          inventory_quantity: 8,
          created_at: new Date(Date.now() - 86400000).toISOString() // Hier
        }
      ];

      setFeaturedProducts(mockProducts.filter(p => p.featured));
      // setNewProducts(mockProducts.filter(p => p.is_new));
      setLoading(false);
    }, 1000);
  }, []);

  const handleAddToCart = (product) => {
    // Ajouter au panier (simulation)
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const existingItem = cart.find(item => item.id === product.id);
    
    if (existingItem) {
      existingItem.quantity += 1;
    } else {
      cart.push({
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.images?.[0],
        quantity: 1
      });
    }
    
    localStorage.setItem('cart', JSON.stringify(cart));
    
    // Afficher une notification (à implémenter)
    console.log('Produit ajouté au panier:', product.name);
  };

  const handleAddToWishlist = (product, isAdded) => {
    console.log(isAdded ? 'Ajouté aux favoris:' : 'Retiré des favoris:', product.name);
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        {/* Background image */}
        <div className="absolute inset-0 z-0">
          <div className="w-full h-full bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900"></div>
          <div className="absolute inset-0 bg-black/30"></div>
        </div>

        {/* Content */}
        <div className="relative z-10 text-center text-white px-4">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-5xl md:text-7xl font-luxury font-bold mb-6 animate-fade-in">
              BOURBON MORELLI
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-neutral-200 animate-slide-up">
              L'élégance intemporelle de la couture française
            </p>
            <p className="text-lg md:text-xl mb-12 text-neutral-300 max-w-2xl mx-auto">
              Découvrez nos créations uniques, alliant savoir-faire traditionnel et modernité. 
              Chaque pièce est une œuvre d'art conçue pour sublimer votre style.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/collections"
                className="bg-primary-500 text-white px-8 py-4 rounded-lg font-medium hover:bg-primary-600 transition-all duration-300 transform hover:scale-105 inline-flex items-center justify-center space-x-2"
              >
                <span>Découvrir les collections</span>
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                to="/about"
                className="border-2 border-white text-white px-8 py-4 rounded-lg font-medium hover:bg-white hover:text-neutral-900 transition-all duration-300"
              >
                Notre histoire
              </Link>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 border-2 border-white rounded-full flex justify-center">
            <div className="w-1 h-3 bg-white rounded-full mt-2"></div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-8 h-8 text-primary-500" />
              </div>
              <h3 className="text-xl font-luxury font-semibold mb-2">Savoir-faire artisanal</h3>
              <p className="text-neutral-600">
                Chaque création est réalisée par nos artisans couturiers avec une attention 
                méticuleuse aux détails.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-primary-500" />
              </div>
              <h3 className="text-xl font-luxury font-semibold mb-2">Qualité premium</h3>
              <p className="text-neutral-600">
                Nous sélectionnons les meilleures matières premières pour garantir des pièces 
                durables et élégantes.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Truck className="w-8 h-8 text-primary-500" />
              </div>
              <h3 className="text-xl font-luxury font-semibold mb-2">Service client d'exception</h3>
              <p className="text-neutral-600">
                Notre équipe est à votre disposition pour vous accompagner dans votre expérience 
                BOURBON MORELLI.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-20 bg-neutral-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-luxury font-bold text-neutral-900 mb-4">
              Créations mises en avant
            </h2>
            <p className="text-lg text-neutral-600 max-w-2xl mx-auto">
              Découvrez notre sélection de pièces iconiques, véritables symboles d'élégance et de raffinement.
            </p>
          </div>
          
          <ProductGrid
            products={featuredProducts}
            loading={loading}
            onAddToCart={handleAddToCart}
            onAddToWishlist={handleAddToWishlist}
          />
        </div>
      </section>

      {/* About Preview */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-luxury font-bold text-neutral-900 mb-6">
                L'histoire BOURBON MORELLI
              </h2>
              <p className="text-lg text-neutral-600 mb-6">
                Née d'une passion pour la couture française, BOURBON MORELLI incarne 
                l'excellence et l'innovation dans le monde de la mode haut de gamme.
              </p>
              <p className="text-lg text-neutral-600 mb-8">
                Depuis notre création, nous nous engageons à créer des pièces uniques 
                qui traversent les tendances et se transmettent de génération en génération.
              </p>
              <Link
                to="/about"
                className="inline-flex items-center space-x-2 text-primary-500 hover:text-primary-600 font-medium"
              >
                <span>En savoir plus</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="relative h-96 bg-neutral-100 rounded-2xl overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-primary-500/20 to-neutral-900/20"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-neutral-400 text-lg">Image de l'atelier</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-neutral-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-luxury font-bold text-neutral-900 mb-4">
              Témoignages clients
            </h2>
            <p className="text-lg text-neutral-600">
              Découvrez ce que nos clients disent de leurs expériences BOURBON MORELLI
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                name: 'Sophie M.',
                rating: 5,
                text: 'Une qualité exceptionnelle et un service client irréprochable. Ma robe de soirée était parfaite !',
                location: 'Paris'
              },
              {
                name: 'Pierre L.',
                rating: 5,
                text: 'Le costume que j\'ai commandé dépasse toutes mes attentes. Le savoir-faire est incroyable.',
                location: 'Lyon'
              },
              {
                name: 'Marie D.',
                rating: 5,
                text: 'Des créations uniques qui font la différence. Je recommande vivement BOURBON MORELLI.',
                location: 'Marseille'
              }
            ].map((testimonial, index) => (
              <div key={index} className="bg-white p-6 rounded-xl shadow-lg">
                <div className="flex items-center mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-5 h-5 ${
                        i < testimonial.rating ? 'text-yellow-400 fill-current' : 'text-neutral-300'
                      }`}
                    />
                  ))}
                </div>
                <p className="text-neutral-600 mb-4 italic">"{testimonial.text}"</p>
                <div>
                  <p className="font-semibold text-neutral-900">{testimonial.name}</p>
                  <p className="text-sm text-neutral-500">{testimonial.location}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary-500">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-luxury font-bold text-white mb-6">
            Prêt à découvrir l'élégance BOURBON MORELLI ?
          </h2>
          <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
            Rejoignez des milliers de clients satisfaits et découvrez des créations 
            qui transformeront votre style.
          </p>
          <Link
            to="/collections"
            className="bg-white text-primary-500 px-8 py-4 rounded-lg font-medium hover:bg-neutral-100 transition-all duration-300 transform hover:scale-105 inline-flex items-center space-x-2"
          >
            <span>Explorer les collections</span>
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Home;
