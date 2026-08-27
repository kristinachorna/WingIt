import { api } from './client.js';

export const authApi = {
  register: (data) => api.post('/auth/register', data).then((r) => r.data),
  login: (data) => api.post('/auth/login', data).then((r) => r.data),
  me: () => api.get('/auth/me').then((r) => r.data),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }).then((r) => r.data),
  resetPassword: (token, new_password) => api.post('/auth/reset-password', { token, new_password }).then((r) => r.data),
  registerPushToken: (push_token) => api.post('/auth/push-token', { push_token }).then((r) => r.data),
};

export const friendsApi = {
  search: (q) => api.get('/friends/search', { params: { q } }).then((r) => r.data),
  // Each friend includes `stage` ('caterpillar' | 'butterfly') and `streak_days`.
  list: () => api.get('/friends').then((r) => r.data),
  requests: () => api.get('/friends/requests').then((r) => r.data),
  sendRequest: (recipient_username) =>
    api.post('/friends/requests', { recipient_username }).then((r) => r.data),
  respond: (id, action) => api.post(`/friends/requests/${id}/respond`, { action }).then((r) => r.data),
  remove: (id) => api.delete(`/friends/${id}`).then((r) => r.data),
};

export const messagesApi = {
  conversations: () => api.get('/messages').then((r) => r.data),
  thread: (userId) => api.get(`/messages/thread/${userId}`).then((r) => r.data),
  send: (formData) =>
    api.post('/messages', formData, { headers: { 'Content-Type': 'multipart/form-data' } }).then((r) => r.data),
  open: (messageId) => api.post(`/messages/${messageId}/open`).then((r) => r.data),
  photoUrl: (messageId, token) =>
    `${api.defaults.baseURL}/messages/${messageId}/photo?token=${encodeURIComponent(token)}`,
};
