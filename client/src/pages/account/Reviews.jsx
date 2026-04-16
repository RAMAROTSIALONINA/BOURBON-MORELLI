import React, { useState, useEffect } from 'react';
import { Star, MessageSquare, ThumbsUp, ThumbsDown, Edit2, Trash2, Package, X } from 'lucide-react';

const Reviews = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingReview, setEditingReview] = useState(null);
  const [formData, setFormData] = useState({
    productId: '',
    productName: '',
    rating: 5,
    title: '',
    content: '',
    wouldRecommend: true
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    loadReviews();
  }, []);

  const loadReviews = async () => {
    try {
      // Simulation de chargement des avis
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Avis simulés
      const mockReviews = [
        {
          id: 1,
          productId: 1,
          productName: 'T-Shirt Premium',
          productImage: '/images/tshirt-white.jpg',
          rating: 5,
          title: 'Excellent produit !',
          content: 'T-shirt de très bonne qualité, le tissu est agréable et la coupe est parfaite. Je recommande vivement !',
          wouldRecommend: true,
          helpful: 12,
          notHelpful: 1,
          date: '2024-04-10',
          verified: true,
          canEdit: true
        },
        {
          id: 2,
          productId: 2,
          productName: 'Nappe Élégante',
          productImage: '/images/nappe-elegante.jpg',
          rating: 4,
          title: 'Belle nappe',
          content: 'La nappe est très jolie et de bonne qualité. La couleur correspond exactement à la photo. Un peu cher mais ça vaut le coup.',
          wouldRecommend: true,
          helpful: 8,
          notHelpful: 2,
          date: '2024-04-08',
          verified: true,
          canEdit: true
        },
        {
          id: 3,
          productId: 3,
          productName: 'Polo Classique',
          productImage: '/images/polo-blue.jpg',
          rating: 3,
          title: 'Correct',
          content: 'Le polo est correct mais rien d\'exceptionnel. La qualité est moyenne pour le prix. Le col a tendance à se déformer après plusieurs lavages.',
          wouldRecommend: false,
          helpful: 5,
          notHelpful: 3,
          date: '2024-04-05',
          verified: true,
          canEdit: true
        }
      ];
      
      setReviews(mockReviews);
    } catch (error) {
      console.error('Erreur chargement avis:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (rating, interactive = false, onChange = null) => {
    const stars = [];
    
    for (let i = 1; i <= 5; i++) {
      const filled = i <= rating;
      const starClass = filled 
        ? 'w-5 h-5 fill-yellow-400 text-yellow-400' 
        : 'w-5 h-5 text-gray-300';
      
      if (interactive) {
        stars.push(
          <button
            key={i}
            type="button"
            onClick={() => onChange(i)}
            className={`${starClass} hover:scale-110 transition-transform`}
          >
            <Star />
          </button>
        );
      } else {
        stars.push(<Star key={i} className={starClass} />);
      }
    }
    
    return (
      <div className="flex items-center space-x-1">
        {stars}
        <span className="ml-2 text-sm text-gray-600">({rating}.0)</span>
      </div>
    );
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.productName.trim()) newErrors.productName = 'Produit requis';
    if (!formData.title.trim()) newErrors.title = 'Titre requis';
    if (!formData.content.trim()) newErrors.content = 'Avis requis';
    if (formData.content.length < 20) newErrors.content = 'Minimum 20 caractères';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    try {
      const newReview = {
        id: Date.now(),
        productId: formData.productId || Date.now(),
        productName: formData.productName,
        productImage: '/images/placeholder.jpg',
        rating: formData.rating,
        title: formData.title,
        content: formData.content,
        wouldRecommend: formData.wouldRecommend,
        helpful: 0,
        notHelpful: 0,
        date: new Date().toISOString().split('T')[0],
        verified: true,
        canEdit: true
      };
      
      if (editingReview) {
        setReviews(prev => prev.map(review => 
          review.id === editingReview.id ? newReview : review
        ));
      } else {
        setReviews(prev => [newReview, ...prev]);
      }
      
      // Réinitialiser le formulaire
      setFormData({
        productId: '',
        productName: '',
        rating: 5,
        title: '',
        content: '',
        wouldRecommend: true
      });
      setShowAddModal(false);
      setEditingReview(null);
      setErrors({});
    } catch (error) {
      console.error('Erreur sauvegarde avis:', error);
    }
  };

  const handleEdit = (review) => {
    setEditingReview(review);
    setFormData({
      productId: review.productId,
      productName: review.productName,
      rating: review.rating,
      title: review.title,
      content: review.content,
      wouldRecommend: review.wouldRecommend
    });
    setShowAddModal(true);
    setErrors({});
  };

  const handleDelete = (reviewId) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cet avis ?')) {
      setReviews(prev => prev.filter(review => review.id !== reviewId));
    }
  };

  const handleHelpful = (reviewId, isHelpful) => {
    setReviews(prev => prev.map(review => {
      if (review.id === reviewId) {
        return {
          ...review,
          helpful: isHelpful ? review.helpful + 1 : review.helpful,
          notHelpful: !isHelpful ? review.notHelpful + 1 : review.notHelpful
        };
      }
      return review;
    }));
  };

  const handleCancel = () => {
    setShowAddModal(false);
    setEditingReview(null);
    setFormData({
      productId: '',
      productName: '',
      rating: 5,
      title: '',
      content: '',
      wouldRecommend: true
    });
    setErrors({});
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Mes avis</h2>
          <p className="text-gray-600">Partagez votre expérience avec nos produits</p>
        </div>
        
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <MessageSquare className="w-4 h-4" />
          <span>Rédiger un avis</span>
        </button>
      </div>

      {reviews.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-8 text-center">
          <MessageSquare className="mx-auto h-16 w-16 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun avis</h3>
          <p className="text-gray-600 mb-4">Vous n'avez pas encore publié d'avis.</p>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Rédiger mon premier avis
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <div key={review.id} className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-start space-x-4">
                <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Package className="w-8 h-8 text-gray-600" />
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h3 className="font-medium text-gray-900">{review.productName}</h3>
                      <div className="flex items-center space-x-2 mt-1">
                        {renderStars(review.rating)}
                        {review.verified && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                            Achat vérifié
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-500">
                        {new Date(review.date).toLocaleDateString('fr-FR')}
                      </span>
                      {review.canEdit && (
                        <div className="flex items-center space-x-1">
                          <button
                            onClick={() => handleEdit(review)}
                            className="p-1 text-gray-600 hover:text-blue-600 transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(review.id)}
                            className="p-1 text-gray-600 hover:text-red-600 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <h4 className="font-medium text-gray-900 mb-2">{review.title}</h4>
                  <p className="text-gray-700 mb-3">{review.content}</p>
                  
                  <div className="flex items-center justify-between pt-3 border-t">
                    <div className="flex items-center space-x-4">
                      <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                        review.wouldRecommend 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {review.wouldRecommend ? 'Je recommande' : 'Je ne recommande pas'}
                      </span>
                    </div>
                    
                    <div className="flex items-center space-x-4">
                      <span className="text-sm text-gray-600">Cet avis est-il utile ?</span>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleHelpful(review.id, true)}
                          className="flex items-center space-x-1 text-gray-600 hover:text-green-600 transition-colors"
                        >
                          <ThumbsUp className="w-4 h-4" />
                          <span className="text-sm">{review.helpful}</span>
                        </button>
                        <button
                          onClick={() => handleHelpful(review.id, false)}
                          className="flex items-center space-x-1 text-gray-600 hover:text-red-600 transition-colors"
                        >
                          <ThumbsDown className="w-4 h-4" />
                          <span className="text-sm">{review.notHelpful}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Ajout/Modification d'avis */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">
                  {editingReview ? 'Modifier mon avis' : 'Rédiger un avis'}
                </h3>
                <button
                  onClick={handleCancel}
                  className="p-2 text-gray-600 hover:text-gray-900"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nom du produit
                  </label>
                  <input
                    type="text"
                    name="productName"
                    value={formData.productName}
                    onChange={handleChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.productName ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Nom du produit"
                  />
                  {errors.productName && <p className="mt-1 text-sm text-red-600">{errors.productName}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Note
                  </label>
                  {renderStars(formData.rating, true, (rating) => 
                    setFormData(prev => ({ ...prev, rating }))
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Titre de l'avis
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.title ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Résumez votre expérience"
                  />
                  {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Votre avis
                  </label>
                  <textarea
                    name="content"
                    value={formData.content}
                    onChange={handleChange}
                    rows={4}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.content ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Décrivez votre expérience avec ce produit (minimum 20 caractères)"
                  />
                  {errors.content && <p className="mt-1 text-sm text-red-600">{errors.content}</p>}
                  <p className="mt-1 text-sm text-gray-500">
                    {formData.content.length}/20 caractères minimum
                  </p>
                </div>

                <div>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      name="wouldRecommend"
                      checked={formData.wouldRecommend}
                      onChange={handleChange}
                      className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="text-sm text-gray-700">
                      Je recommande ce produit
                    </span>
                  </label>
                </div>

                <div className="flex items-center space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="flex-1 py-2 px-4 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    {editingReview ? 'Modifier' : 'Publier'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reviews;
