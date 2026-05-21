import axios from 'axios';
import toast from 'react-hot-toast';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || '/api',
  timeout: 30000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const message = err.response?.data?.message || 'Something went wrong.';
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    } else if (err.response?.status !== 422 && err.response?.status !== 409) {
      toast.error(message);
    }
    return Promise.reject(err);
  }
);

export default api;

// Auth
export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  forgotPassword: (data) => api.post('/auth/forgot-password', data),
  resetPassword: (data) => api.post('/auth/reset-password', data),
  getMe: () => api.get('/auth/me'),
  changePassword: (data) => api.put('/auth/change-password', data),
};

// Complaints
export const complaintAPI = {
  getAll: (params) => api.get('/complaints', { params }),
  getMy: (params) => api.get('/complaints/my', { params }),
  getById: (id) => api.get(`/complaints/${id}`),
  getHistory: (id) => api.get(`/complaints/${id}/history`),
  create: (data) => api.post('/complaints', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  assign: (id, data) => api.put(`/complaints/${id}/assign`, data),
  updateStatus: (id, data) => api.put(`/complaints/${id}/status`, data),
  resolve: (id, data) => api.put(`/complaints/${id}/resolve`, data),
  escalate: (id, data) => api.put(`/complaints/${id}/escalate`, data),
  reopen: (id, data) => api.put(`/complaints/${id}/reopen`, data),
  close: (id) => api.put(`/complaints/${id}/close`),
  addComment: (id, data) => api.post(`/complaints/${id}/comments`, data),
};

// Users
export const userAPI = {
  getAll: (params) => api.get('/users', { params }),
  getAgents: () => api.get('/users/agents'),
  getById: (id) => api.get(`/users/${id}`),
  create: (data) => api.post('/users', data),
  update: (id, data) => api.put(`/users/${id}`, data),
  toggleStatus: (id) => api.put(`/users/${id}/toggle-status`),
  delete: (id) => api.delete(`/users/${id}`),
};

// Categories
export const categoryAPI = {
  getAll: () => api.get('/categories'),
  create: (data) => api.post('/categories', data),
  update: (id, data) => api.put(`/categories/${id}`, data),
  delete: (id) => api.delete(`/categories/${id}`),
};

// Dashboard
export const dashboardAPI = {
  getStats: () => api.get('/dashboard/stats'),
  getSLABreaches: () => api.get('/dashboard/sla-breaches'),
  getAgentPerformance: () => api.get('/dashboard/agent-performance'),
  getCategoryAnalysis: () => api.get('/dashboard/category-analysis'),
  getMonthlyTrends: () => api.get('/dashboard/monthly-trends'),
  getPriorityDistribution: () => api.get('/dashboard/priority-distribution'),
  getResolutionTime: () => api.get('/dashboard/resolution-time'),
  // ETL analytics (populated by Python ETL pipeline)
  getEtlSummary: () => api.get('/dashboard/etl-summary'),
  getEtlAgentPerformance: () => api.get('/dashboard/etl-agent-performance'),
  getEtlCategoryTrends: () => api.get('/dashboard/etl-category-trends'),
  getEtlMonthlyTrends: () => api.get('/dashboard/etl-monthly-trends'),
  getEtlPriorityAnalysis: () => api.get('/dashboard/etl-priority-analysis'),
};

// Feedback
export const feedbackAPI = {
  getAll: (params) => api.get('/feedback', { params }),
  getByComplaint: (id) => api.get(`/feedback/complaint/${id}`),
  submit: (id, data) => api.post(`/feedback/complaint/${id}`, data),
  getAnalytics: () => api.get('/feedback/analytics'),
};

// Notifications
export const notificationAPI = {
  getAll: (params) => api.get('/notifications', { params }),
  getUnreadCount: () => api.get('/notifications/unread-count'),
  markAsRead: (id) => api.put(`/notifications/${id}/read`),
  markAllAsRead: () => api.put('/notifications/mark-all-read'),
  delete: (id) => api.delete(`/notifications/${id}`),
};
