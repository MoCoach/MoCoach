const API_BASE = window.location.origin;

const api = {
  _token: null,
  _user: null,

  getToken() {
    if (!this._token) {
      const auth = this._getAuth();
      if (auth && auth.token) this._token = auth.token;
    }
    return this._token;
  },

  setToken(token) {
    this._token = token;
  },

  setUser(user) {
    this._user = user;
    const auth = this._getAuth();
    if (auth) {
      auth.user = user;
      sessionStorage.setItem('mocoach_auth', JSON.stringify(auth));
    }
  },

  getCurrentUser() {
    if (this._user) return this._user;
    const auth = this._getAuth();
    if (auth && auth.user) {
      this._user = auth.user;
      return this._user;
    }
    return null;
  },

  clearToken() {
    this._token = null;
    this._user = null;
  },

  _getAuth() {
    try { return JSON.parse(sessionStorage.getItem('mocoach_auth')); }
    catch { return null; }
  },

  async _fetch(method, path, body, isFormData) {
    const url = `${API_BASE}/api/v1${path}`;
    const headers = {};
    const token = this.getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
    if (body && !isFormData) headers['Content-Type'] = 'application/json';

    const opts = { method, headers };
    if (body) {
      opts.body = isFormData ? body : JSON.stringify(body);
    }

    let res;
    try {
      res = await fetch(url, opts);
    } catch (err) {
      return { success: false, error: 'Network error — is the server running?', status: 0 };
    }

    let data;
    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      try { data = await res.json(); } catch { data = null; }
    } else {
      const text = await res.text();
      data = text || null;
    }

    if (!res.ok) {
      const msg = (data && data.msg) ? data.msg : `Request failed (${res.status})`;
      return { success: false, error: msg, status: res.status, data };
    }

    return { success: true, data, status: res.status };
  },

  get(path) {
    return this._fetch('GET', path);
  },

  post(path, body) {
    return this._fetch('POST', path, body);
  },

  put(path, body) {
    return this._fetch('PUT', path, body);
  },

  del(path, body) {
    return this._fetch('DELETE', path, body);
  },

  upload(method, path, formData) {
    return this._fetch(method, path, formData, true);
  },

  async checkUsername(username) {
    return this.get(`/check-username/${encodeURIComponent(username)}`);
  },

  async checkEmail(email) {
    return this.get(`/check-email/${encodeURIComponent(email)}`);
  },

  async login(identity, password) {
    const res = await this.post('/login', { login: identity, password });
    if (!res.success) return res;
    this.setToken(res.data.access_token);
    if (res.data.user) {
      this.setUser(res.data.user);
    }
    return res;
  },

  async getMe() {
    const res = await this.get('/me');
    if (res.success) {
      this.setUser(res.data);
    }
    return res;
  },

  async register(data) {
    const res = await this.post('/register', data);
    if (!res.success) return res;
    return res;
  },

  async getProfile(userId) {
    return this.get(`/profile/${userId}`);
  },

  async updateProfile(data) {
    return this.put('/profile', data);
  },

  async changePassword(oldPassword, newPassword) {
    return this.put('/password', { old_password: oldPassword, new_password: newPassword });
  },

  async getCoaches() {
    return this.get('/coach');
  },

  async getCoach(coachId) {
    return this.get(`/coach/${coachId}`);
  },

  async searchCoaches(query) {
    return this.get(`/coach/search?q=${encodeURIComponent(query)}`);
  },

  async getCoachesByTag(tagName) {
    return this.get(`/coach/tag/${encodeURIComponent(tagName)}`);
  },

  async rateCoach(coachId, rating) {
    return this.post(`/coach/${coachId}/rate`, { rating });
  },

  async getChats() {
    return this.get('/chat');
  },

  async getChatMessages(chatId) {
    return this.get(`/chat/${chatId}`);
  },

  async sendMessage(recipientId, text) {
    return this.post('/message', { recipient_id: recipientId, text });
  },

  async hideMessage(messageId) {
    return this.put(`/message/${messageId}/hide`);
  },

  async deleteMessage(messageId) {
    return this.del(`/message/${messageId}`);
  },

  async getTags() {
    return this.get('/tag');
  },

  async getCities() {
    return this.get('/city');
  },

  async getAllBadges() {
    return this.get('/badge/all');
  },

  async getUserBadgeSummary(userId) {
    return this.get(`/user/${userId}/badges`);
  },

  async giveBadge(userId, badgeId) {
    return this.post('/badge/give', { user_id: userId, badge_id: badgeId });
  },

  async toggleBadge(userId, badgeId) {
    return this.post(`/badge/${badgeId}/toggle`, { user_id: userId });
  },

  async uploadProfilePicture(file) {
    const fd = new FormData();
    fd.append('file', file);
    return this.upload('POST', '/profile/picture', fd);
  },

  async uploadCoachPicture(numero, file) {
    const fd = new FormData();
    fd.append('file', file);
    return this.upload('POST', `/coach/picture/${numero}`, fd);
  },

  async getUsers() {
    return this.get('/users');
  },

  async deleteUser(userId) {
    return this.del(`/user/${userId}`);
  },

  async promoteUser(userId) {
    return this.put(`/user/${userId}/promote`);
  },

  async getUserChats(userId) {
    return this.get(`/user/${userId}/chats`);
  },

  async blockUser(userId, data) {
    return this.put(`/user/${userId}/block`, data);
  },

  async flagUser(userId, data) {
    return this.put(`/user/${userId}/flag`, data);
  },

  async deleteUserPictures(userId) {
    return this.del(`/user/${userId}/pictures`);
  },
};

window.api = api;
