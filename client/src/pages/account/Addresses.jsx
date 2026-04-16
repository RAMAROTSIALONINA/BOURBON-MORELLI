import React, { useState, useEffect } from 'react';
import { MapPin, Plus, Edit2, Trash2, Check, X, Home, Briefcase, Map } from 'lucide-react';

const Addresses = () => {
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [formData, setFormData] = useState({
    type: 'home',
    name: '',
    phone: '',
    address: '',
    city: '',
    postalCode: '',
    country: 'Madagascar',
    isDefault: false
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    loadAddresses();
  }, []);

  const loadAddresses = async () => {
    try {
      // Simulation de chargement des adresses
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Adresses simulées
      const mockAddresses = [
        {
          id: 1,
          type: 'home',
          name: 'Fanomezantsoa Koloina',
          phone: '+261 34 22 556 62',
          address: 'Lot II M 123 Tsarasaotra',
          city: 'Antananarivo',
          postalCode: '101',
          country: 'Madagascar',
          isDefault: true
        },
        {
          id: 2,
          type: 'work',
          name: 'RASOAZANAKOLONA Koloina',
          phone: '+261 34 00 000 00',
          address: 'Immeuble Ankorondrano, 4ème étage',
          city: 'Antananarivo',
          postalCode: '101',
          country: 'Madagascar',
          isDefault: false
        }
      ];
      
      setAddresses(mockAddresses);
    } catch (error) {
      console.error('Erreur chargement adresses:', error);
    } finally {
      setLoading(false);
    }
  };

  const getAddressIcon = (type) => {
    const icons = {
      home: Home,
      work: Briefcase,
      other: Map
    };
    return icons[type] || icons.other;
  };

  const getAddressTypeName = (type) => {
    const names = {
      home: 'Domicile',
      work: 'Travail',
      other: 'Autre'
    };
    return names[type] || 'Autre';
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
    
    if (!formData.name.trim()) newErrors.name = 'Nom requis';
    if (!formData.phone.trim()) newErrors.phone = 'Téléphone requis';
    if (!formData.address.trim()) newErrors.address = 'Adresse requise';
    if (!formData.city.trim()) newErrors.city = 'Ville requise';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    try {
      if (editingAddress) {
        // Mise à jour d'une adresse existante
        setAddresses(prev => prev.map(addr => 
          addr.id === editingAddress.id 
            ? { ...formData, id: editingAddress.id }
            : formData.isDefault ? { ...addr, isDefault: false } : addr
        ));
      } else {
        // Ajout d'une nouvelle adresse
        const newAddress = {
          ...formData,
          id: Date.now()
        };
        
        // Si la nouvelle adresse est par défaut, désactiver les autres
        if (formData.isDefault) {
          setAddresses(prev => prev.map(addr => ({ ...addr, isDefault: false })));
        }
        
        setAddresses(prev => [...prev, newAddress]);
      }
      
      // Réinitialiser le formulaire
      setFormData({
        type: 'home',
        name: '',
        phone: '',
        address: '',
        city: '',
        postalCode: '',
        country: 'Madagascar',
        isDefault: false
      });
      setShowAddModal(false);
      setEditingAddress(null);
      setErrors({});
    } catch (error) {
      console.error('Erreur sauvegarde adresse:', error);
    }
  };

  const handleEdit = (address) => {
    setEditingAddress(address);
    setFormData(address);
    setShowAddModal(true);
    setErrors({});
  };

  const handleDelete = (addressId) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette adresse ?')) {
      setAddresses(prev => prev.filter(addr => addr.id !== addressId));
    }
  };

  const handleSetDefault = (addressId) => {
    setAddresses(prev => prev.map(addr => ({
      ...addr,
      isDefault: addr.id === addressId
    })));
  };

  const handleCancel = () => {
    setShowAddModal(false);
    setEditingAddress(null);
    setFormData({
      type: 'home',
      name: '',
      phone: '',
      address: '',
      city: '',
      postalCode: '',
      country: 'Madagascar',
      isDefault: false
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
          <h2 className="text-2xl font-bold text-gray-900">Mes adresses</h2>
          <p className="text-gray-600">Gérez vos adresses de livraison</p>
        </div>
        
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Ajouter une adresse</span>
        </button>
      </div>

      {addresses.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-8 text-center">
          <MapPin className="mx-auto h-16 w-16 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune adresse</h3>
          <p className="text-gray-600 mb-4">Vous n'avez pas encore ajouté d'adresse.</p>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Ajouter une adresse
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {addresses.map((address) => {
            const AddressIcon = getAddressIcon(address.type);
            
            return (
              <div key={address.id} className="bg-white rounded-lg shadow-sm p-6 relative">
                {address.isDefault && (
                  <div className="absolute top-4 right-4">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      <Check className="w-3 h-3 mr-1" />
                      Par défaut
                    </span>
                  </div>
                )}
                
                <div className="flex items-start space-x-3 mb-4">
                  <div className="p-2 bg-gray-100 rounded-lg">
                    <AddressIcon className="w-5 h-5 text-gray-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <h3 className="font-medium text-gray-900">{address.name}</h3>
                      <span className="text-sm text-gray-500">
                        ({getAddressTypeName(address.type)})
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">{address.phone}</p>
                  </div>
                </div>
                
                <div className="space-y-1 text-sm text-gray-600 mb-4">
                  <p>{address.address}</p>
                  <p>{address.postalCode} {address.city}</p>
                  <p>{address.country}</p>
                </div>
                
                <div className="flex items-center space-x-2 pt-4 border-t">
                  {!address.isDefault && (
                    <button
                      onClick={() => handleSetDefault(address.id)}
                      className="text-sm text-blue-600 hover:text-blue-700 transition-colors"
                    >
                      Définir par défaut
                    </button>
                  )}
                  
                  <div className="flex-1 flex items-center justify-end space-x-2">
                    <button
                      onClick={() => handleEdit(address)}
                      className="p-2 text-gray-600 hover:text-blue-600 transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(address.id)}
                      className="p-2 text-gray-600 hover:text-red-600 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Ajout/Modification d'adresse */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">
                  {editingAddress ? 'Modifier l\'adresse' : 'Ajouter une adresse'}
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
                    Type d'adresse
                  </label>
                  <select
                    name="type"
                    value={formData.type}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="home">Domicile</option>
                    <option value="work">Travail</option>
                    <option value="other">Autre</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nom complet
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.name ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Nom complet"
                  />
                  {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Téléphone
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.phone ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="+261 34 00 000 00"
                  />
                  {errors.phone && <p className="mt-1 text-sm text-red-600">{errors.phone}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Adresse
                  </label>
                  <textarea
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    rows={2}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.address ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Adresse complète"
                  />
                  {errors.address && <p className="mt-1 text-sm text-red-600">{errors.address}</p>}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Ville
                    </label>
                    <input
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleChange}
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.city ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="Ville"
                    />
                    {errors.city && <p className="mt-1 text-sm text-red-600">{errors.city}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Code postal
                    </label>
                    <input
                      type="text"
                      name="postalCode"
                      value={formData.postalCode}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="101"
                    />
                  </div>
                </div>

                <div>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      name="isDefault"
                      checked={formData.isDefault}
                      onChange={handleChange}
                      className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="text-sm text-gray-700">
                      Définir comme adresse par défaut
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
                    {editingAddress ? 'Modifier' : 'Ajouter'}
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

export default Addresses;
