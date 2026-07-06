const ProfileApp = {
  data: null,
  editing: false,
  passwordVisible: { current: false, new: false, confirm: false },

  init() {
    if (!document.getElementById('profile-header-card')) {
      setTimeout(() => this.init(), 50);
      return;
    }

    const auth = this._getAuth();
    if (!auth || auth.role !== 'customer') {
      return;
    }

    const users = JSON.parse(localStorage.getItem('mocoach_users') || '[]');
    const user = users.find(u => u.username === auth.userId);
    if (user) {
      this.data = JSON.parse(JSON.stringify(user));
    } else {
      this.data = {
        username: auth.username || '',
        email: auth.email || '',
        avatar: auth.avatar || '',
        password: '',
        role: 'customer',
      };
    }

    this.render();
    this.bindEvents();
    this.generateTwinklingStars();
  },

  _getAuth() {
    try { return JSON.parse(sessionStorage.getItem('mocoach_auth')); } catch { return null; }
  },

  _saveUserData() {
    const users = JSON.parse(localStorage.getItem('mocoach_users') || '[]');
    const idx = users.findIndex(u => u.username === this.data.username);
    if (idx >= 0) {
      users[idx] = { ...this.data };
      localStorage.setItem('mocoach_users', JSON.stringify(users));
    }
    const session = this._getAuth();
    if (session) {
      session.avatar = this.data.avatar;
      session.email = this.data.email;
      sessionStorage.setItem('mocoach_auth', JSON.stringify(session));
    }
  },

  render() {
    this.renderHeader();
    this.renderPersonalInfo();
    this.renderSecurity();
    if (window.lucide) lucide.createIcons();
  },

  generateTwinklingStars() {
    const container = document.getElementById('stars-container');
    if (!container) return;
    container.innerHTML = '';
    for (let i = 0; i < 120; i++) {
      const star = document.createElement('div');
      star.className = 'star';
      const size = Math.random() * 2 + 0.8;
      star.style.cssText = `
        position:absolute;width:${size}px;height:${size}px;
        background:#fff;border-radius:50%;top:${Math.random()*100}%;left:${Math.random()*100}%;
        animation:twinkle ${Math.random()*3+2}s ease-in-out infinite;
        animation-delay:${Math.random()*5}s;
      `;
      container.appendChild(star);
    }
  },

  logout() {
    sessionStorage.removeItem('mocoach_auth');
    window.location.reload();
  },

  renderHeader() {
    const el = document.getElementById('profile-header-card');
    if (!el) return;
    const d = this.data;

    el.innerHTML = `
      <div class="flex flex-col md:flex-row items-center md:items-start gap-6 relative z-10">
        <div class="relative flex-shrink-0 group">
          <div class="w-28 h-28 md:w-32 md:h-32 rounded-full overflow-hidden border-4 border-blue-500/30 shadow-xl">
            <img src="${this._esc(d.avatar || 'https://images.unsplash.com/photo-1637434071656-e4ecd2567e82?q=80&w=716&auto=format&fit=crop')}" alt="User avatar" class="w-full h-full object-cover" loading="lazy">
          </div>
          <div class="absolute -bottom-1 -right-1 bg-emerald-500 w-6 h-6 rounded-full border-2 border-slate-900 flex items-center justify-center">
            <i data-lucide="check" class="w-3.5 h-3.5 text-white"></i>
          </div>
          <input type="file" id="pf-avatar-input" accept="image/*" class="hidden">
          <button onclick="document.getElementById('pf-avatar-input').click()" class="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white">
            <i data-lucide="camera" class="w-6 h-6"></i>
          </button>
        </div>
        <div class="text-center md:text-left flex-1 min-w-0 flex flex-col justify-center">
          <p class="text-blue-400 text-lg sm:text-xl font-bold font-mono tracking-wider mt-4 md:mt-2">@${this._esc(d.username || 'user')}</p>
          <p class="text-slate-400 text-sm mt-1">${this._esc(d.email || '')}</p>
        </div>
        <div class="flex-shrink-0 mt-4 md:mt-0 flex items-center space-x-3">
          <button onclick="ProfileApp.toggleEdit()" class="bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold px-6 py-2.5 rounded-xl transition shadow-lg hover:shadow-blue-600/25 flex items-center space-x-2">
            <i data-lucide="edit-3" class="w-4 h-4"></i>
            <span>${this.editing ? 'Cancel' : 'Edit Profile'}</span>
          </button>
          <button onclick="ProfileApp.logout()" class="bg-red-950/40 border border-red-900/50 hover:bg-red-900/40 text-red-400 text-sm font-bold px-4 py-2.5 rounded-xl transition flex items-center space-x-2">
            <i data-lucide="log-out" class="w-4 h-4"></i>
            <span>Logout</span>
          </button>
        </div>
      </div>
    `;
  },

  toggleEdit() {
    this.editing = !this.editing;
    this.renderHeader();
    this.renderPersonalInfo();
    if (this.editing) {
      setTimeout(() => document.getElementById('pf-username')?.focus(), 100);
    }
  },

  renderPersonalInfo() {
    const el = document.getElementById('profile-personal-form');
    if (!el) return;
    const d = this.data;

    if (!this.editing) {
      el.innerHTML = `
        <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label class="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wider">Username</label>
            <p class="text-base text-white">${this._esc(d.username)}</p>
          </div>
          <div>
            <label class="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wider">Email</label>
            <p class="text-base text-white">${this._esc(d.email)}</p>
          </div>
        </div>
      `;
      return;
    }

    el.innerHTML = `
      <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <label for="pf-username" class="block text-base font-semibold text-slate-200 mb-2">Username *</label>
          <input id="pf-username" type="text" value="${this._esc(d.username)}" required
            class="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-400 placeholder-slate-500 focus:outline-none focus:border-blue-500 transition text-base">
        </div>
        <div>
          <label for="pf-email" class="block text-base font-semibold text-slate-200 mb-2">Email *</label>
          <input id="pf-email" type="email" value="${this._esc(d.email)}" required
            class="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-400 placeholder-slate-500 focus:outline-none focus:border-blue-500 transition text-base">
        </div>
      </div>
      <div class="mt-6 flex items-center justify-end space-x-3">
        <button onclick="ProfileApp.toggleEdit()" class="bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-bold px-6 py-2.5 rounded-xl transition">Cancel</button>
        <button onclick="ProfileApp.savePersonalInfo()" class="bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold px-8 py-2.5 rounded-xl transition shadow-lg flex items-center space-x-2">
          <i data-lucide="save" class="w-4 h-4"></i>
          <span>Save Changes</span>
        </button>
      </div>
    `;
  },

  savePersonalInfo() {
    const username = document.getElementById('pf-username')?.value.trim();
    const email = document.getElementById('pf-email')?.value.trim();

    if (!username || !email) {
      this.showToast('Username and Email are required', 'error');
      return;
    }

    this.data.username = username;
    this.data.email = email;
    this._saveUserData();
    this.editing = false;
    this.showToast('Profile updated successfully!', 'success');
    this.render();
    if (window.updateHeaderProfilePic) window.updateHeaderProfilePic();
  },

  renderSecurity() {
    const el = document.getElementById('profile-security-form');
    if (!el) return;

    el.innerHTML = `
      <div class="space-y-5">
        <div>
          <label for="pf-currentPw" class="block text-base font-semibold text-slate-200 mb-2">Current Password</label>
          <div class="relative">
            <input id="pf-currentPw" type="password" placeholder="Enter current password" class="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-2.5 pr-11 text-slate-400 placeholder-slate-600 focus:outline-none focus:border-blue-500 transition text-base">
            <button onclick="ProfileApp.togglePassword('pf-currentPw', 'pw-toggle-current')" type="button" class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600" tabindex="-1">
              <i id="pw-toggle-current" data-lucide="eye-off" class="w-4 h-4"></i>
            </button>
          </div>
        </div>
        <div>
          <label for="pf-newPw" class="block text-base font-semibold text-slate-200 mb-2">New Password</label>
          <div class="relative">
            <input id="pf-newPw" type="password" placeholder="Enter new password" class="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-2.5 pr-11 text-slate-400 placeholder-slate-600 focus:outline-none focus:border-blue-500 transition text-base">
            <button onclick="ProfileApp.togglePassword('pf-newPw', 'pw-toggle-new')" type="button" class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600" tabindex="-1">
              <i id="pw-toggle-new" data-lucide="eye-off" class="w-4 h-4"></i>
            </button>
          </div>
        </div>
        <div>
          <label for="pf-confirmPw" class="block text-base font-semibold text-slate-200 mb-2">Confirm New Password</label>
          <div class="relative">
            <input id="pf-confirmPw" type="password" placeholder="Confirm new password" class="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-2.5 pr-11 text-slate-400 placeholder-slate-600 focus:outline-none focus:border-blue-500 transition text-base">
            <button onclick="ProfileApp.togglePassword('pf-confirmPw', 'pw-toggle-confirm')" type="button" class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600" tabindex="-1">
              <i id="pw-toggle-confirm" data-lucide="eye-off" class="w-4 h-4"></i>
            </button>
          </div>
        </div>
      </div>
      <div class="mt-6 flex items-center justify-end">
        <button onclick="ProfileApp.changePassword()" class="bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold px-8 py-2.5 rounded-xl transition shadow-lg flex items-center space-x-2">
          <i data-lucide="lock" class="w-4 h-4"></i>
          <span>Change Password</span>
        </button>
      </div>
      <div id="pw-feedback" class="mt-3 text-sm hidden"></div>
    `;
  },

  togglePassword(inputId, iconId) {
    const input = document.getElementById(inputId);
    const icon = document.getElementById(iconId);
    if (!input || !icon) return;
    const isPassword = input.type === 'password';
    input.type = isPassword ? 'text' : 'password';
    icon.setAttribute('data-lucide', isPassword ? 'eye' : 'eye-off');
    if (window.lucide) lucide.createIcons();
  },

  changePassword() {
    const currentPw = document.getElementById('pf-currentPw')?.value;
    const newPw = document.getElementById('pf-newPw')?.value;
    const confirmPw = document.getElementById('pf-confirmPw')?.value;
    const feedback = document.getElementById('pw-feedback');

    if (!currentPw || !newPw || !confirmPw) {
      this._showPwFeedback('Please fill in all password fields', 'error');
      return;
    }

    if (this.data.password && currentPw !== this.data.password) {
      this._showPwFeedback('Current password is incorrect', 'error');
      return;
    }

    if (newPw !== confirmPw) {
      this._showPwFeedback('New passwords do not match', 'error');
      return;
    }

    if (newPw.length < 6) {
      this._showPwFeedback('New password must be at least 6 characters', 'error');
      return;
    }

    this.data.password = newPw;
    this._saveUserData();
    document.getElementById('pf-currentPw').value = '';
    document.getElementById('pf-newPw').value = '';
    document.getElementById('pf-confirmPw').value = '';
    this._showPwFeedback('Password changed successfully!', 'success');
    this.showToast('Password changed!', 'success');
  },

  _showPwFeedback(msg, type) {
    const el = document.getElementById('pw-feedback');
    if (!el) return;
    el.textContent = msg;
    el.className = `mt-3 text-sm font-medium ${type === 'success' ? 'text-emerald-400' : 'text-red-400'}`;
    el.classList.remove('hidden');
    if (type === 'success') {
      setTimeout(() => el.classList.add('hidden'), 3000);
    }
  },

  showToast(message, type) {
    const container = document.getElementById('profile-toast-container');
    if (!container) return;
    const bg = type === 'success' ? 'bg-emerald-500' : 'bg-red-500';
    const icon = type === 'success' ? 'check-circle' : 'alert-circle';
    const toast = document.createElement('div');
    toast.className = `${bg} text-white text-sm font-medium px-5 py-3 rounded-xl shadow-lg flex items-center space-x-2 animate-toast-in`;
    toast.innerHTML = `<i data-lucide="${icon}" class="w-4 h-4 flex-shrink-0"></i><span>${this._esc(message)}</span>`;
    container.appendChild(toast);
    if (window.lucide) lucide.createIcons();
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(-100%)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  },

  bindEvents() {
    document.getElementById('pf-avatar-input')?.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      compressImage(file, 800, 0.7, (dataUrl) => {
        this.data.avatar = dataUrl;
        this._saveUserData();
        this.renderHeader();
        if (window.updateHeaderProfilePic) window.updateHeaderProfilePic();
        this.showToast('Profile photo updated!', 'success');
      });
    });

    document.getElementById('profile-back-btn')?.addEventListener('click', (e) => {
      e.preventDefault();
      if (window.showMainView) window.showMainView();
    });
  },

  _esc(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  },
};

const runProfileInit = () => {
  const tryInit = () => {
    if (document.getElementById('profile-header-card')) {
      ProfileApp.init();
    } else {
      setTimeout(tryInit, 50);
    }
  };
  setTimeout(tryInit, 100);
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', runProfileInit);
} else {
    runProfileInit();
}

window.ProfileApp = ProfileApp;
