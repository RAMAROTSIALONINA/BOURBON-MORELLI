import React, { useState, useEffect, useCallback } from 'react';
import {
  Package,
  Edit,
  Trash2,
  Search,
  Plus,
  Box,
  X
} from 'lucide-react';
import productService from '../../services/productService';
import useNotificationStore from '../../services/notificationService';

// Base URL du backend (pour servir les images en bypassant le proxy React)
const BACKEND_URL = 'http://localhost:5003';

// Transforme "/uploads/products/xxx.png" → "http://localhost:5003/uploads/products/xxx.png"
// Laisse inchangé les URLs absolues (http://...) et les chemins /images/... du seed
const resolveImageUrl = (url) => {
  if (!url) return null;
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) return url;
  if (url.startsWith('/uploads/')) return `${BACKEND_URL}${url}`;
  return url;
};

const ProductManagement = () => {
  const addNotification = useNotificationStore(s => s.addNotification);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  console.log('=== PRODUCT MANAGEMENT COMPONENT MOUNTED ===');
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    stock: '',
    status: 'active',
    images: [],
    sizes: []
  });
  const AVAILABLE_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
  const [selectedImages, setSelectedImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [categories, setCategories] = useState([]);

  // Charger les catégories dynamiquement depuis la BDD
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/api/categories`);
        const data = await res.json();
        const list = Array.isArray(data) ? data : (data.categories || data.data || []);
        // Toutes les catégories actives (dynamiques depuis les Paramètres)
        setCategories(list);
      } catch (err) {
        console.error('Erreur chargement catégories:', err);
        // Fallback : les catégories utilisées sur Collections
        setCategories([
          { id: 1, name: 'Nappes' },
          { id: 2, name: 'T-Shirts' },
          { id: 3, name: 'Polos' },
          { id: 4, name: 'Pantalons' },
        ]);
      }
    };
    loadCategories();
  }, []);

  // Charger les produits
  const loadProducts = useCallback(async () => {
    try {
      setLoading(true);
      const response = await productService.getAllProducts();
      console.log('=== LOAD PRODUCTS RESPONSE ===');
      console.log('Response:', response);
      console.log('Response type:', typeof response);
      console.log('Is array:', Array.isArray(response));
      
      // Gérer différents formats de réponse
      let productsData = [];
      if (Array.isArray(response)) {
        productsData = response;
      } else if (response && Array.isArray(response.data)) {
        productsData = response.data;
      } else if (response && response.products && Array.isArray(response.products)) {
        productsData = response.products;
      } else {
        console.warn('Format de réponse inattendu:', response);
      }
      
      console.log('Products data:', productsData);
      setProducts(productsData);
    } catch (error) {
      console.error('Erreur lors du chargement des produits:', error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  // Gérer les changements du formulaire
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Gérer le changement d'images (illimité)
  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    
    if (files.length === 0) return;
    
    // Pas de limitation - autoriser autant d'images que nécessaire
    const filesToProcess = files;
    
    const newImages = [];
    const newPreviews = [];
    
    filesToProcess.forEach(file => {
      // Vérifier le type
      if (!file.type.startsWith('image/')) {
        alert(`Le fichier ${file.name} n'est pas une image`);
        return;
      }
      
      // Vérifier la taille (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert(`L'image ${file.name} ne doit pas dépasser 5MB`);
        return;
      }
      
      newImages.push(file);
      
      // Créer un aperçu
      const reader = new FileReader();
      reader.onloadend = () => {
        newPreviews.push(reader.result);
        
        // Mettre à jour les états quand toutes les previews sont prêtes
        if (newPreviews.length === filesToProcess.length) {
          setSelectedImages(prev => [...prev, ...newImages]);
          setImagePreviews(prev => [...prev, ...newPreviews]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  // Réinitialiser le formulaire
  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: '',
      category: '',
      stock: '',
      status: 'active',
      images: [],
      sizes: []
    });
    setSelectedImages([]);
    setImagePreviews([]);
  };

  // Réinitialiser uniquement les états d'image
  const resetImageStates = () => {
    setSelectedImages([]);
    setImagePreviews([]);
  };

  // Supprimer une image spécifique
  const removeImage = (index) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  // Rafraîchir le token admin
  const refreshAdminToken = async () => {
    try {
      const currentToken = localStorage.getItem('adminToken');
      if (!currentToken) {
        throw new Error('Aucun token trouvé');
      }

      // Vérifier si le token est valide en faisant une requête simple
      const testResponse = await fetch('http://localhost:5003/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${currentToken}`
        }
      });

      if (testResponse.ok) {
        return currentToken; // Token encore valide
      }

      // Si le token est expiré, essayer de se reconnecter avec les identifiants stockés
      const adminCredentials = localStorage.getItem('adminCredentials');
      if (!adminCredentials) {
        throw new Error('Veuillez vous reconnecter');
      }

      const { email, password } = JSON.parse(adminCredentials);
      const loginResponse = await fetch('http://localhost:5003/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });

      if (!loginResponse.ok) {
        throw new Error('Session expirée. Veuillez vous reconnecter.');
      }

      const loginData = await loginResponse.json();
      const newToken = loginData.token;
      
      localStorage.setItem('adminToken', newToken);
      return newToken;

    } catch (error) {
      console.error('Erreur rafraîchissement token:', error);
      // Rediriger vers la page de login
      window.location.href = '/admin/login';
      throw error;
    }
  };

  // Upload une image sur le serveur
  const uploadProductImage = async (file) => {
    if (!file) return null;

    const formData = new FormData();
    formData.append('image', file);

    try {
      // Obtenir un token valide
      let token = localStorage.getItem('adminToken');
      if (!token) {
        throw new Error('Token admin requis');
      }

      // Essayer avec le token actuel
      let response = await fetch('http://localhost:5003/api/upload/image', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      // Si 401, essayer de rafraîchir le token
      if (response.status === 401) {
        console.log('Token expiré, tentative de rafraîchissement...');
        try {
          token = await refreshAdminToken();
          
          // Réessayer avec le nouveau token
          response = await fetch('http://localhost:5003/api/upload/image', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`
            },
            body: formData
          });
        } catch (refreshError) {
          throw new Error('Session expirée. Veuillez vous reconnecter.');
        }
      }

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erreur lors de l\'upload');
      }

      const result = await response.json();
      console.log('Image uploadée:', result.url);
      return result.url;

    } catch (error) {
      console.error('Erreur upload image:', error);
      throw error;
    }
  };

  // Ajouter un produit
  const handleAddProduct = async () => {
    try {
      if (!formData.name || !formData.price || !formData.category) {
        alert('Veuillez remplir les champs obligatoires');
        return;
      }

      // Upload réel des images AVANT de créer le produit
      const uploadedImages = [];
      for (const image of selectedImages) {
        try {
          const imageUrl = await uploadProductImage(image);
          uploadedImages.push(imageUrl);
          console.log('Image uploadée :', imageUrl);
        } catch (uploadError) {
          console.error('Erreur upload image:', uploadError);
          alert(`Erreur upload image : ${uploadError.response?.data?.message || uploadError.message}`);
          return;
        }
      }

      const productData = {
        name        : formData.name,
        description : formData.description,
        price       : parseFloat(formData.price),
        category    : formData.category,
        stock       : parseInt(formData.stock) || 0,
        status      : formData.status,
        images      : uploadedImages,   // Tableau d'URLs -> ["/uploads/products/xxx.png", ...]
        sizes       : formData.sizes || []
      };

      await productService.createProduct(productData);
      await loadProducts();
      setShowAddModal(false);
      resetForm();
      resetImageStates();
      addNotification({
        type: 'success',
        category: 'Produit',
        title: 'Produit créé',
        message: `"${productData.name}" ajouté au catalogue (${productData.price} EUR)`
      });
      alert('Produit ajouté avec succès !');
    } catch (error) {
      console.error('Erreur création produit:', error);
      alert(`Erreur : ${error.message || 'Impossible de créer le produit'}`);
    }
  };

  // Modifier un produit
  const handleEditProduct = async () => {
    try {
      if (!selectedProduct) return;

      // ── Upload réel des images si de nouvelles sont sélectionnées
      const uploadedImages = [];
      if (selectedImages.length > 0) {
        for (const image of selectedImages) {
          try {
            const imageUrl = await uploadProductImage(image);
            uploadedImages.push(imageUrl);
            console.log('Image uploadée :', imageUrl);
          } catch (uploadError) {
            console.error('Erreur upload image:', uploadError);
            alert(`Erreur upload image : ${uploadError.response?.data?.message || uploadError.message}`);
            return;
          }
        }
      }

      const productData = {
        name        : formData.name,
        description : formData.description,
        price       : parseFloat(formData.price),
        category    : formData.category,
        stock       : parseInt(formData.stock) || 0,
        status      : formData.status,
        images      : uploadedImages.length > 0 ? uploadedImages : formData.images,
        sizes       : formData.sizes || []
      };

      await productService.updateProduct(selectedProduct.id, productData);
      await loadProducts();
      setShowEditModal(false);
      addNotification({
        type: 'info',
        category: 'Produit',
        title: 'Produit modifié',
        message: `"${productData.name}" (ID #${selectedProduct.id}) a été mis à jour`
      });
      setSelectedProduct(null);
      resetForm();
      resetImageStates();
      alert('Produit modifié avec succès !');
    } catch (error) {
      console.error('Erreur modification produit:', error);
      alert(`Erreur : ${error.message || 'Impossible de modifier le produit'}`);
    }
  };

  // Supprimer un produit
  const handleDeleteProduct = async (productId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce produit?')) {
      return;
    }

    try {
      const prod = products.find(p => p.id === productId);
      await productService.deleteProduct(productId);
      await loadProducts();
      addNotification({
        type: 'warning',
        category: 'Produit',
        title: 'Produit supprimé',
        message: `"${prod?.name || 'Produit #' + productId}" retiré du catalogue`
      });
      alert('Produit supprimé avec succès!');
    } catch (error) {
      console.error('Erreur lors de la suppression du produit:', error);
      alert('Erreur lors de la suppression du produit');
    }
  };

  // Ouvrir le modal de modification
  const openEditModal = (product) => {
    setSelectedProduct(product);

    setFormData({
      name        : product.name,
      description : product.description || '',
      price       : product.price.toString(),
      category    : typeof product.category === 'string' ? product.category : product.category?.name || '',
      stock       : product.stock?.toString() || '0',
      status      : product.status || 'active',
      images      : product.images || [],
      sizes       : Array.isArray(product.sizes) ? product.sizes : []
    });

    // Pré-remplir les aperçus avec les images actuelles
    setImagePreviews(product.images || []);
    setSelectedImages([]);
    setShowEditModal(true);
  };

  // Filtrer les produits
  const filteredProducts = Array.isArray(products) ? products.filter(product => {
    const categoryName = typeof product.category === 'string' 
      ? product.category 
      : product.category?.name || '';
    
    return (
      (product.name && product.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (categoryName && categoryName.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }) : [];

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-neutral-900">Gestion des produits</h2>
        <button
          onClick={() => {
            resetImageStates();
            setShowAddModal(true);
          }}
          className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors flex items-center"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nouveau produit
        </button>
      </div>

      {/* Barre de recherche */}
      <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Rechercher un produit..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
      </div>

      {/* Liste des produits */}
      <div className="bg-white rounded-xl shadow-sm border border-neutral-200">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-neutral-50 border-b border-neutral-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Produit
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Catégorie
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Prix
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Stock
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Statut
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-neutral-200">
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-4 text-center text-neutral-500">
                    Chargement...
                  </td>
                </tr>
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-4 text-center text-neutral-500">
                    Aucun produit trouvé
                  </td>
                </tr>
              ) : (
                filteredProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-neutral-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="relative w-10 h-10 mr-3">
                          {product.images && product.images.length > 0 && (
                            <img
                              src={resolveImageUrl(product.images[0])}
                              alt={product.name}
                              className="absolute inset-0 w-10 h-10 rounded-lg object-cover z-10"
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.style.display = 'none';
                              }}
                            />
                          )}
                          <div className="w-10 h-10 bg-neutral-100 rounded-lg flex items-center justify-center">
                            <Package className="w-5 h-5 text-neutral-400" />
                          </div>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-neutral-900">
                            {product.name}
                          </div>
                          {product.description && (
                            <div className="text-sm text-neutral-500 truncate max-w-xs">
                              {product.description}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 text-xs font-medium bg-purple-100 text-purple-800 rounded-full">
                        {typeof product.category === 'string' ? product.category : product.category?.name || 'Non catégorisé'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-neutral-900">
                        {product.price.toLocaleString()} EUR
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Box className="w-4 h-4 text-neutral-400 mr-1" />
                        <span className="text-sm text-neutral-900">{product.stock || 0}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        product.status === 'active' 
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {product.status === 'active' ? 'Actif' : 'Inactif'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => openEditModal(product)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(product.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Ajouter/Modifier */}
      {(showAddModal || showEditModal) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-neutral-900 mb-4">
              {showAddModal ? 'Ajouter un produit' : 'Modifier le produit'}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nom du produit *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Prix (EUR) *
                  </label>
                  <input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleInputChange}
                    step="0.01"
                    min="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Stock
                  </label>
                  <input
                    type="number"
                    name="stock"
                    value={formData.stock}
                    onChange={handleInputChange}
                    min="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Catégorie *
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
                  required
                >
                  <option value="">Sélectionner une catégorie</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.name}>{cat.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tailles disponibles
                </label>
                <div className="flex flex-wrap gap-2">
                  {AVAILABLE_SIZES.map((size) => {
                    const selected = (formData.sizes || []).includes(size);
                    return (
                      <button
                        key={size}
                        type="button"
                        onClick={() => {
                          setFormData((prev) => {
                            const current = prev.sizes || [];
                            return {
                              ...prev,
                              sizes: current.includes(size)
                                ? current.filter((s) => s !== size)
                                : [...current, size]
                            };
                          });
                        }}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                          selected
                            ? 'bg-gray-900 text-white border-gray-900'
                            : 'bg-white text-gray-700 border-gray-300 hover:border-gray-900'
                        }`}
                      >
                        {size}
                      </button>
                    );
                  })}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Cliquez pour ajouter/retirer une taille. Affichée dans la description publique.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Images du produit ({imagePreviews.length} image{imagePreviews.length > 1 ? 's' : ''})
                </label>
                <div className="space-y-3">
                  {/* Aperçus des images */}
                  {imagePreviews.length > 0 && (
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2">
                      {imagePreviews.map((preview, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={resolveImageUrl(preview)}
                            alt={`Aperçu ${index + 1}`}
                            className="w-full h-20 object-cover rounded-lg border border-gray-200"
                          />
                          <button
                            type="button"
                            onClick={() => removeImage(index)}
                            className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="w-3 h-3" />
                          </button>
                          <div className="absolute bottom-1 left-1 bg-black bg-opacity-50 text-white text-xs px-1 rounded">
                            {index + 1}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Zone d'upload */}
                  <div className="flex items-center justify-center w-full">
                    <label className="flex flex-col items-center justify-center w-full h-20 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                      <div className="flex flex-col items-center justify-center">
                        <Package className="w-6 h-6 mb-1 text-gray-400" />
                        <p className="text-xs text-gray-500">
                          {imagePreviews.length === 0 
                            ? "Cliquez pour uploader des images" 
                            : "Ajouter d'autres images"
                          }
                        </p>
                        <p className="text-xs text-gray-400">
                          PNG, JPG jusqu'à 5MB (multiple autorisé)
                        </p>
                      </div>
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*"
                        multiple
                        onChange={handleImageChange}
                      />
                    </label>
                  </div>

                  {/* Bouton pour tout supprimer */}
                  {imagePreviews.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedImages([]);
                        setImagePreviews([]);
                      }}
                      className="text-sm text-red-600 hover:text-red-800"
                    >
                      Supprimer toutes les images
                    </button>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Statut
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
                >
                  <option value="active">Actif</option>
                  <option value="inactive">Inactif</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setShowEditModal(false);
                  resetForm();
                  resetImageStates();
                  setSelectedProduct(null);
                }}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={showAddModal ? handleAddProduct : handleEditProduct}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                {showAddModal ? 'Ajouter' : 'Modifier'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductManagement;
