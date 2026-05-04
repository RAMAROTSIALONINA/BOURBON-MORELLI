import axios from 'axios';

const API = 'http://localhost:5003/api';

const authHeaders = () => {
  const token = localStorage.getItem('userToken') || localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// ============ ADDRESSES ============
export const addressService = {
  async list() {
    const { data } = await axios.get(`${API}/users/addresses`, { headers: authHeaders() });
    return data?.addresses || [];
  },
  async create(payload) {
    const { data } = await axios.post(`${API}/users/addresses`, payload, { headers: authHeaders() });
    return data?.address;
  },
  async update(id, payload) {
    const { data } = await axios.put(`${API}/users/addresses/${id}`, payload, { headers: authHeaders() });
    return data?.address;
  },
  async remove(id) {
    await axios.delete(`${API}/users/addresses/${id}`, { headers: authHeaders() });
  }
};

// ============ REVIEWS ============
export const reviewService = {
  async list({ page = 1, limit = 20 } = {}) {
    const { data } = await axios.get(`${API}/users/reviews`, {
      params: { page, limit },
      headers: authHeaders()
    });
    return data?.reviews || [];
  },
  async create(payload) {
    const { data } = await axios.post(`${API}/users/reviews`, payload, { headers: authHeaders() });
    return data?.review;
  },
  async update(id, payload) {
    const { data } = await axios.put(`${API}/users/reviews/${id}`, payload, { headers: authHeaders() });
    return data?.review;
  },
  async remove(id) {
    await axios.delete(`${API}/users/reviews/${id}`, { headers: authHeaders() });
  }
};

// ============ WISHLIST ============
export const wishlistService = {
  async list() {
    const { data } = await axios.get(`${API}/wishlist`, { headers: authHeaders() });
    return data?.items || [];
  },
  async add(productId) {
    await axios.post(`${API}/wishlist`, { product_id: productId }, { headers: authHeaders() });
  },
  async remove(productId) {
    await axios.delete(`${API}/wishlist/${productId}`, { headers: authHeaders() });
  },
  async clear() {
    await axios.delete(`${API}/wishlist`, { headers: authHeaders() });
  }
};

const accountService = { addressService, reviewService, wishlistService };
export default accountService;
