import React, { useState, useEffect } from 'react';
import { 
  Save, 
  Plus, 
  Trash2, 
  Edit2, 
  Eye, 
  EyeOff, 
  Mail, 
  Phone, 
  MapPin, 
  Facebook, 
  Instagram, 
  Twitter, 
  Youtube,
  CreditCard,
  Truck,
  Shield,
  RefreshCw,
  Link,
  Type,
  Text
} from 'lucide-react';
import footerService from '../services/footerService';

const FooterManagement = () => {
  const [footerData, setFooterData] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('contact');
  const [editingItem, setEditingItem] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newItem, setNewItem] = useState({
    section: '',
    content_type: 'text',
    key_name: '',
    value: '',
    label: '',
    display_order: 0
  });
  const [tempValues, setTempValues] = useState({});

  useEffect(() => {
    loadFooterData();
  }, []);

  const loadFooterData = async () => {
    try {
      setLoading(true);
      const response = await footerService.getFooterSettings();
      if (response.success) {
        setFooterData(response.data);
      }
    } catch (error) {
      console.error('Erreur chargement footer:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateSetting = async (id, value, isActive) => {
    try {
      setSaving(true);
      await footerService.updateSetting(id, value, isActive);
      await loadFooterData();
      setEditingItem(null);
    } catch (error) {
      console.error('Erreur mise à jour:', error);
      alert('Erreur lors de la mise à jour');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSetting = async (id) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cet élément ?')) return;
    
    try {
      await footerService.deleteSetting(id);
      await loadFooterData();
    } catch (error) {
      console.error('Erreur suppression:', error);
      alert('Erreur lors de la suppression');
    }
  };

  const handleAddSetting = async () => {
    try {
      await footerService.addSetting(newItem);
      await loadFooterData();
      setShowAddModal(false);
      setNewItem({
        section: '',
        content_type: 'text',
        key_name: '',
        value: '',
        label: '',
        display_order: 0
      });
    } catch (error) {
      console.error('Erreur ajout:', error);
      alert('Erreur lors de l\'ajout');
    }
  };

  const getIconForType = (contentType, keyName) => {
    if (contentType === 'feature') {
      const icons = {
        payment: CreditCard,
        shipping: Truck,
        satisfaction: Shield,
        returns: RefreshCw
      };
      return icons[keyName] || Type;
    }
    
    if (contentType === 'link') {
      return Link;
    }
    
    const icons = {
      email: Mail,
      phone: Phone,
      address: MapPin,
      facebook: Facebook,
      instagram: Instagram,
      twitter: Twitter,
      youtube: Youtube
    };
    
    return icons[keyName] || Text;
  };

  const renderInputForType = (item, value, onChange) => {
    const { content_type } = item;
    
    if (content_type === 'textarea') {
      return (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          rows={3}
        />
      );
    }
    
    if (content_type === 'feature' && typeof value === 'object') {
      return (
        <div className="space-y-2">
          <input
            type="text"
            value={value.title || ''}
            onChange={(e) => onChange({ ...value, title: e.target.value })}
            placeholder="Titre"
            className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
          <input
            type="text"
            value={value.description || ''}
            onChange={(e) => onChange({ ...value, description: e.target.value })}
            placeholder="Description"
            className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
      );
    }
    
    return (
      <input
        type={content_type === 'link' ? 'text' : 'text'}
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={item.label}
        className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
      />
    );
  };

  const renderSectionItems = (section) => {
    const items = footerData[section] || [];
    
    return items.map((item) => {
      const Icon = getIconForType(item.content_type, item.key_name);
      const isEditing = editingItem === item.id;
      const tempValue = tempValues[item.id] || item.value;
      
      return (
        <div key={item.id} className="bg-white border border-neutral-200 rounded-lg p-4">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3 flex-1">
              <div className="flex-shrink-0">
                <Icon className="w-5 h-5 text-primary-500" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-neutral-900">{item.label}</h4>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => {
                        if (isEditing) {
                          handleUpdateSetting(item.id, tempValue, item.is_active);
                        } else {
                          setEditingItem(item.id);
                          setTempValues(prev => ({ ...prev, [item.id]: item.value }));
                        }
                      }}
                      disabled={saving}
                      className="p-1 text-neutral-600 hover:text-primary-500 transition-colors"
                    >
                      {isEditing ? <Save className="w-4 h-4" /> : <Edit2 className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => handleUpdateSetting(item.id, item.value, !item.is_active)}
                      className="p-1 text-neutral-600 hover:text-primary-500 transition-colors"
                    >
                      {item.is_active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => handleDeleteSetting(item.id)}
                      className="p-1 text-red-600 hover:text-red-700 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                
                {isEditing ? (
                  renderInputForType(item, tempValue, (value) => setTempValues(prev => ({ ...prev, [item.id]: value })))
                ) : (
                  <div>
                    {item.content_type === 'feature' && typeof item.value === 'object' ? (
                      <div>
                        <div className="font-medium text-neutral-800">{item.value.title}</div>
                        <div className="text-sm text-neutral-600">{item.value.description}</div>
                      </div>
                    ) : (
                      <div className="text-neutral-600">{item.value}</div>
                    )}
                    <div className={`text-xs mt-1 ${item.is_active ? 'text-green-600' : 'text-red-600'}`}>
                      {item.is_active ? 'Actif' : 'Inactif'}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      );
    });
  };

  const tabs = [
    { id: 'contact', label: 'Contact', icon: Mail },
    { id: 'brand', label: 'Marque', icon: Type },
    { id: 'newsletter', label: 'Newsletter', icon: Mail },
    { id: 'social', label: 'Réseaux sociaux', icon: Facebook },
    { id: 'features', label: 'Services', icon: CreditCard },
    { id: 'legal', label: 'Liens légaux', icon: Link },
    { id: 'navigation', label: 'Navigation', icon: Link },
    { id: 'copyright', label: 'Copyright', icon: Text }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Gestion du Footer</h1>
          <p className="text-neutral-600">Personnalisez le contenu du footer de votre site</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center space-x-2 bg-primary-500 text-white px-4 py-2 rounded-lg hover:bg-primary-600 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Ajouter un élément</span>
        </button>
      </div>

      {/* Onglets */}
      <div className="border-b border-neutral-200">
        <nav className="flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 py-4 border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-neutral-600 hover:text-neutral-900'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Contenu de l'onglet actif */}
      <div className="space-y-4">
        {renderSectionItems(activeTab)}
      </div>

      {/* Modal d'ajout */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Ajouter un élément</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Section</label>
                <select
                  value={newItem.section}
                  onChange={(e) => setNewItem({ ...newItem, section: e.target.value })}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="">Sélectionner une section</option>
                  {tabs.map((tab) => (
                    <option key={tab.id} value={tab.id}>{tab.label}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Type</label>
                <select
                  value={newItem.content_type}
                  onChange={(e) => setNewItem({ ...newItem, content_type: e.target.value })}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="text">Texte</option>
                  <option value="textarea">Texte long</option>
                  <option value="link">Lien</option>
                  <option value="feature">Service</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Clé</label>
                <input
                  type="text"
                  value={newItem.key_name}
                  onChange={(e) => setNewItem({ ...newItem, key_name: e.target.value })}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="ex: email, phone, facebook..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Label</label>
                <input
                  type="text"
                  value={newItem.label}
                  onChange={(e) => setNewItem({ ...newItem, label: e.target.value })}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="ex: Email, Téléphone, Facebook..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Valeur</label>
                <input
                  type="text"
                  value={newItem.value}
                  onChange={(e) => setNewItem({ ...newItem, value: e.target.value })}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="ex: contact@bourbonmorelli.com, +33 1 23 45 67 89..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Ordre d'affichage</label>
                <input
                  type="number"
                  value={newItem.display_order}
                  onChange={(e) => setNewItem({ ...newItem, display_order: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 text-neutral-600 hover:text-neutral-900 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleAddSetting}
                className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
              >
                Ajouter
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FooterManagement;
