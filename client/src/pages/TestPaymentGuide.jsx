import React from 'react';
import { Link } from 'react-router-dom';
import { CreditCard, Wallet, Smartphone, CheckCircle, Play, ArrowRight } from 'lucide-react';

const TestPaymentGuide = () => {
  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-luxury font-bold text-neutral-900 mb-4">
            Guide de Test des Paiements
          </h1>
          <p className="text-neutral-600 max-w-2xl mx-auto">
            Instructions complètes pour tester toutes les méthodes de paiement : 
            Carte de crédit, PayPal et Mobile Money
          </p>
        </div>

        {/* Étapes de test */}
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <Play className="w-5 h-5 mr-2 text-primary-500" />
              Étapes de Test
            </h2>
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-primary-600 font-semibold text-sm">1</span>
                </div>
                <div>
                  <p className="font-medium">Ajouter des produits au panier</p>
                  <p className="text-sm text-neutral-600">Allez sur <Link to="/collections" className="text-primary-500 hover:underline">Collections</Link> et cliquez sur les boutons "Ajouter au panier"</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-primary-600 font-semibold text-sm">2</span>
                </div>
                <div>
                  <p className="font-medium">Aller au panier</p>
                  <p className="text-sm text-neutral-600">Cliquez sur l'icône du panier dans le header, puis "Commander"</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-primary-600 font-semibold text-sm">3</span>
                </div>
                <div>
                  <p className="font-medium">Remplir les informations de livraison</p>
                  <p className="text-sm text-neutral-600">Étape 1 : Adresse de livraison (utilisez des données de test)</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-primary-600 font-semibold text-sm">4</span>
                </div>
                <div>
                  <p className="font-medium">Choisir et tester une méthode de paiement</p>
                  <p className="text-sm text-neutral-600">Étape 2 : Utilisez les données de test ci-dessous</p>
                </div>
              </div>
            </div>
          </div>

          {/* Carte de crédit */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <CreditCard className="w-5 h-5 mr-2 text-blue-600" />
              1. Carte de Crédit (Visa/Mastercard/American Express)
            </h3>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium mb-3">Données de Test</h4>
                <div className="bg-neutral-50 p-4 rounded-lg space-y-2">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="font-medium text-neutral-700">Type:</span>
                      <p className="text-neutral-600">Visa/Mastercard/Amex</p>
                    </div>
                    <div>
                      <span className="font-medium text-neutral-700">Numéro:</span>
                      <p className="text-neutral-600">4242 4242 4242 4242</p>
                    </div>
                    <div>
                      <span className="font-medium text-neutral-700">Titulaire:</span>
                      <p className="text-neutral-600">Jean Test</p>
                    </div>
                    <div>
                      <span className="font-medium text-neutral-700">Expiration:</span>
                      <p className="text-neutral-600">12/25</p>
                    </div>
                    <div>
                      <span className="font-medium text-neutral-700">CVV:</span>
                      <p className="text-neutral-600">123</p>
                    </div>
                    <div>
                      <span className="font-medium text-neutral-700">Sauvegarder:</span>
                      <p className="text-neutral-600">Oui/Non</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium mb-3">Résultat Attendu</h4>
                <div className="bg-blue-50 p-4 rounded-lg space-y-2">
                  <div className="flex items-center text-sm text-blue-800">
                    <CheckCircle className="w-4 h-4 mr-2" />
                    <span>Alert de confirmation avec détails</span>
                  </div>
                  <div className="flex items-center text-sm text-blue-800">
                    <CheckCircle className="w-4 h-4 mr-2" />
                    <span>Logs dans la console F12</span>
                  </div>
                  <div className="flex items-center text-sm text-blue-800">
                    <CheckCircle className="w-4 h-4 mr-2" />
                    <span>Redirection vers page de confirmation</span>
                  </div>
                  <div className="flex items-center text-sm text-blue-800">
                    <CheckCircle className="w-4 h-4 mr-2" />
                    <span>Commande créée et panier vidé</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* PayPal */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <Wallet className="w-5 h-5 mr-2 text-blue-500" />
              2. PayPal (Paiement sécurisé)
            </h3>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium mb-3">Données de Test</h4>
                <div className="bg-neutral-50 p-4 rounded-lg space-y-2">
                  <div className="grid grid-cols-1 gap-2 text-sm">
                    <div>
                      <span className="font-medium text-neutral-700">Email PayPal:</span>
                      <p className="text-neutral-600">test@paypal.com</p>
                    </div>
                    <div>
                      <span className="font-medium text-neutral-700">Mot de passe:</span>
                      <p className="text-neutral-600">password123</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium mb-3">Résultat Attendu</h4>
                <div className="bg-blue-50 p-4 rounded-lg space-y-2">
                  <div className="flex items-center text-sm text-blue-800">
                    <CheckCircle className="w-4 h-4 mr-2" />
                    <span>Alert de redirection PayPal</span>
                  </div>
                  <div className="flex items-center text-sm text-blue-800">
                    <CheckCircle className="w-4 h-4 mr-2" />
                    <span>Validation de l'email (@)</span>
                  </div>
                  <div className="flex items-center text-sm text-blue-800">
                    <CheckCircle className="w-4 h-4 mr-2" />
                    <span>Simulation après 2 secondes</span>
                  </div>
                  <div className="flex items-center text-sm text-blue-800">
                    <CheckCircle className="w-4 h-4 mr-2" />
                    <span>Page de confirmation PayPal</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Mobile Money */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <Smartphone className="w-5 h-5 mr-2 text-green-600" />
              3. Mobile Money (MVola/Orange Money/Airtel Money)
            </h3>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium mb-3">Données de Test</h4>
                <div className="bg-neutral-50 p-4 rounded-lg space-y-2">
                  <div className="grid grid-cols-1 gap-2 text-sm">
                    <div>
                      <span className="font-medium text-neutral-700">Opérateur:</span>
                      <p className="text-neutral-600">MVola / Orange Money / Airtel Money</p>
                    </div>
                    <div>
                      <span className="font-medium text-neutral-700">Téléphone:</span>
                      <p className="text-neutral-600">034 12 345 67</p>
                    </div>
                    <div>
                      <span className="font-medium text-neutral-700">Nom:</span>
                      <p className="text-neutral-600">Jean Test</p>
                    </div>
                    <div>
                      <span className="font-medium text-neutral-700">Code:</span>
                      <p className="text-neutral-600">123456</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium mb-3">Résultat Attendu</h4>
                <div className="bg-blue-50 p-4 rounded-lg space-y-2">
                  <div className="flex items-center text-sm text-blue-800">
                    <CheckCircle className="w-4 h-4 mr-2" />
                    <span>Interface visuelle des opérateurs</span>
                  </div>
                  <div className="flex items-center text-sm text-blue-800">
                    <CheckCircle className="w-4 h-4 mr-2" />
                    <span>Instructions spécifiques par opérateur</span>
                  </div>
                  <div className="flex items-center text-sm text-blue-800">
                    <CheckCircle className="w-4 h-4 mr-2" />
                    <span>Validation de tous les champs</span>
                  </div>
                  <div className="flex items-center text-sm text-blue-800">
                    <CheckCircle className="w-4 h-4 mr-2" />
                    <span>Alert de traitement Mobile Money</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Outils de débogage */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h3 className="text-lg font-semibold mb-4">Outils de Débogage</h3>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium mb-3">Console (F12)</h4>
                <div className="bg-neutral-50 p-4 rounded-lg">
                  <p className="text-sm text-neutral-600 mb-2">Ouvrez la console du navigateur (F12) pour voir:</p>
                  <ul className="text-sm text-neutral-600 space-y-1">
                    <li>=== TEST PAIEMENT [MÉTHODE] ===</li>
                    <li>Détails des données saisies</li>
                    <li>Validation des champs</li>
                    <li>Messages de succès/erreur</li>
                    <li>Création de la commande</li>
                  </ul>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium mb-3">LocalStorage</h4>
                <div className="bg-neutral-50 p-4 rounded-lg">
                  <p className="text-sm text-neutral-600 mb-2">Dans F12 &gt; Application &gt; LocalStorage:</p>
                  <ul className="text-sm text-neutral-600 space-y-1">
                    <li><code className="bg-neutral-200 px-1">cart</code> - Articles du panier</li>
                    <li><code className="bg-neutral-200 px-1">wishlist</code> - Articles favoris</li>
                    <li><code className="bg-neutral-200 px-1">userOrders</code> - Commandes créées</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="text-center space-y-4">
            <Link
              to="/collections"
              className="btn-luxury"
            >
              Commencer les Tests
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
            
            <div className="text-sm text-neutral-600">
              <p>Conseil: Testez chaque méthode de paiement séparément</p>
              <p>Videz le panier entre chaque test pour une expérience propre</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestPaymentGuide;
