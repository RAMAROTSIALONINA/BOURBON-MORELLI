import React, { useState, useEffect, useCallback } from 'react';
import { 
  Package, 
  Edit, 
  Trash2, 
  Search, 
  Plus,
  Box
} from 'lucide-react';
import productService from '../../services/productService';

const ProductManagement = () => {
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
    image_url: ''
  });
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

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

  // Gérer la sélection d'image
  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Vérifier le type de fichier
      if (!file.type.startsWith('image/')) {
        alert('Veuillez sélectionner une image valide');
        return;
      }
      
      // Vérifier la taille (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('L\'image ne doit pas dépasser 5MB');
        return;
      }
      
      setSelectedImage(file);
      
      // Créer un aperçu
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
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
      image_url: ''
    });
    setSelectedImage(null);
    setImagePreview(null);
  };

  // Réinitialiser uniquement les états d'image
  const resetImageStates = () => {
    setSelectedImage(null);
    setImagePreview(null);
  };

  // Ajouter un produit
  const handleAddProduct = async () => {
    try {
      // Validation
      if (!formData.name || !formData.price || !formData.category) {
        alert('Veuillez remplir les champs obligatoires');
        return;
      }

      const productData = {
        name: formData.name,
        description: formData.description,
        price: parseFloat(formData.price),
        category: formData.category,
        stock: parseInt(formData.stock) || 0,
        status: formData.status,
        image_url: formData.image_url || null
      };

      console.log('=== CRÉATION PRODUIT ===');
      console.log('Données:', JSON.stringify(productData, null, 2));

      // Si une image est sélectionnée, l'uploader
      if (selectedImage) {
        const formDataUpload = new FormData();
        formDataUpload.append('image', selectedImage);
        
        try {
          // Pour l'instant, simuler l'upload avec un aperçu
          // En production, vous devriez avoir un endpoint d'upload
          productData.image_url = imagePreview;
          console.log('Image sélectionnée pour upload:', selectedImage.name);
        } catch (uploadError) {
          console.error('Erreur lors de l\'upload de l\'image:', uploadError);
          alert('Erreur lors de l\'upload de l\'image');
          return;
        }
      }

      const response = await productService.createProduct(productData);
      console.log('Produit créé:', response);

      await loadProducts();
      setShowAddModal(false);
      resetForm();
      resetImageStates();
      alert('Produit ajouté avec succès!');
    } catch (error) {
      console.error('Erreur lors de la création du produit:', error);
      alert('Erreur lors de la création du produit');
    }
  };

  // Modifier un produit
  const handleEditProduct = async () => {
    try {
      if (!selectedProduct) return;

      const productData = {
        name: formData.name,
        description: formData.description,
        price: parseFloat(formData.price),
        category: formData.category,
        stock: parseInt(formData.stock) || 0,
        status: formData.status,
        image_url: formData.image_url || null
      };

      await productService.updateProduct(selectedProduct.id, productData);
      await loadProducts();
      setShowEditModal(false);
      setSelectedProduct(null);
      resetForm();
      resetImageStates();
      alert('Produit modifié avec succès!');
    } catch (error) {
      console.error('Erreur lors de la modification du produit:', error);
      alert('Erreur lors de la modification du produit');
    }
  };

  // Supprimer un produit
  const handleDeleteProduct = async (productId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce produit?')) {
      return;
    }

    try {
      await productService.deleteProduct(productId);
      await loadProducts();
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
      name: product.name,
      description: product.description || '',
      price: product.price.toString(),
      category: typeof product.category === 'string' ? product.category : product.category?.name || '',
      stock: product.stock?.toString() || '0',
      status: product.status || 'active',
      image_url: product.image_url || ''
    });
    // Pré-remplir l'aperçu si une image existe
    if (product.image_url) {
      setImagePreview(product.image_url);
    } else {
      setImagePreview(null);
    }
    setSelectedImage(null);
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
                        {product.image_url ? (
                          <img
                            src={product.image_url}
                            alt={product.name}
                            className="w-10 h-10 rounded-lg object-cover mr-3"
                          />
                        ) : (
                          <div className="w-10 h-10 bg-neutral-100 rounded-lg flex items-center justify-center mr-3">
                            <Package className="w-5 h-5 text-neutral-400" />
                          </div>
                        )}
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
                  <option value="Vêtements">Vêtements</option>
                  <option value="Accessoires">Accessoires</option>
                  <option value="Linge de maison">Linge de maison</option>
                  <option value="Electronique">Electronique</option>
                  <option value="Autre">Autre</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Image du produit
                </label>
                <div className="space-y-3">
                  <div className="flex items-center justify-center w-full">
                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        {imagePreview ? (
                          <img 
                            src={imagePreview} 
                            alt="Aperçu" 
                            className="w-20 h-20 object-cover rounded-lg mb-2"
                          />
                        ) : (
                          <>
                            <Package className="w-8 h-8 mb-2 text-gray-400" />
                            <p className="text-xs text-gray-500">
                              Cliquez pour uploader une image
                            </p>
                            <p className="text-xs text-gray-400">
                              PNG, JPG jusqu'à 5MB
                            </p>
                          </>
                        )}
                      </div>
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={handleImageSelect}
                      />
                    </label>
                  </div>
                  {imagePreview && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedImage(null);
                        setImagePreview(null);
                      }}
                      className="text-sm text-red-600 hover:text-red-800"
                    >
                      Supprimer l'image
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
