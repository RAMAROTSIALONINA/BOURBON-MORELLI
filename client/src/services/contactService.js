import axios from 'axios';

const API_BASE_URL = 'http://localhost:5003/api';

const getAuthConfig = () => {
  const token = localStorage.getItem('adminToken');
  return {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` })
    }
  };
};

const contactService = {
  listMessages: async (params = {}) => {
    const { data } = await axios.get(`${API_BASE_URL}/contact/admin`, {
      ...getAuthConfig(),
      params
    });
    return data;
  },

  getStats: async () => {
    const { data } = await axios.get(`${API_BASE_URL}/contact/admin/stats`, getAuthConfig());
    return data;
  },

  getMessage: async (id) => {
    const { data } = await axios.get(`${API_BASE_URL}/contact/admin/${id}`, getAuthConfig());
    return data;
  },

  updateMessage: async (id, payload) => {
    const { data } = await axios.patch(`${API_BASE_URL}/contact/admin/${id}`, payload, getAuthConfig());
    return data;
  },

  deleteMessage: async (id) => {
    const { data } = await axios.delete(`${API_BASE_URL}/contact/admin/${id}`, getAuthConfig());
    return data;
  }
};

export default contactService;
