// COACH_PROFILES removed — data now loads from localStorage mocoach_coaches

const BADGE_CATEGORIES = [
  { key: 'technical_coach', label: 'Technical Coach', icon: 'book-open', desc: 'Deep expertise in their discipline' },
  { key: 'flexibility_adaptability', label: 'Flexibility & Adaptability', icon: 'shuffle', desc: 'Adjusts sessions to individual needs' },
  { key: 'motivator', label: 'Motivator', icon: 'heart', desc: 'Inspires and pushes clients to excel' },
  { key: 'champion_builder', label: 'Champion Builder', icon: 'trophy', desc: 'Helps clients achieve real results' },
];

const CoachProfileApp = {
  currentId: null,
  currentData: null,
  editing: false,
  isOwnProfile: false,
  MAX_GALLERY: 7,

  init() {
    if (!document.getElementById('coach-profile-view')) {
      setTimeout(() => this.init(), 50);
      return;
    }
    this.bindEvents();
  },

  open(coachId) {
    const user = this._getAuthUser();
    this.isOwnProfile = user && user.role === 'coach' && user.userId === coachId;

    const saved = this._getSavedCoach(coachId);
    if (saved) {
      const fullName = `${saved.firstName || ''} ${saved.lastName || ''}`.trim() || saved.username;
      this.currentData = {
        id: coachId,
        name: fullName,
        discipline: saved.discipline || '',
        price: saved.price ? `Rs ${saved.price} per session` : '',
        city: saved.city || '',
        photoUrl: saved.avatar || '',
        avatarUrl: saved.avatar || '',
        description: saved.bio || '',
        tags: saved.tags || [],
        gallery: saved.gallery || [],
      };
    } else {
      this.currentData = {
        id: coachId, name: coachId, discipline: '', price: '', city: '',
        photoUrl: '', avatarUrl: '', description: '', tags: [], gallery: [],
      };
    }

    this.currentId = coachId;
    this.editing = false;
    this.render();
    this.show();
  },

  _getAuthUser() {
    try { return JSON.parse(sessionStorage.getItem('mocoach_auth')); } catch { return null; }
  },

  _getSavedCoach(coachId) {
    const coaches = JSON.parse(localStorage.getItem('mocoach_coaches') || '[]');
    return coaches.find(c => c.username === coachId) || null;
  },

  render() {
    this.renderHeader();
    this.renderGallery();
    this.renderInfo();
    this.renderBadges();
    this.renderRatings();
    this.generateTwinklingStars();
    if (window.lucide) lucide.createIcons();
  },

  renderHeader() {
    const d = this.currentData;
    if (!d) return;

    const avatarEl = document.getElementById('cp-avatar');
    if (avatarEl) {
      avatarEl.style.backgroundImage = `url(${this._esc(d.gallery && d.gallery.length > 0 ? d.gallery[0].src : (d.avatarUrl || d.photoUrl))})`;
    }

    this._setText('cp-name', d.name);
    this._setText('cp-discipline', d.discipline);
    this._setText('cp-price', d.price);
    this._setText('cp-city', d.city ? `📍 ${d.city}` : '');

    const contactBtn = document.getElementById('cp-contact-btn');
    if (contactBtn) {
      if (this.isOwnProfile) {
        contactBtn.classList.add('hidden');
      } else {
        contactBtn.classList.remove('hidden');
      }
    }

    const chatBtn = document.getElementById('cp-chat-btn');
    const editBtn = document.getElementById('cp-edit-btn');
    const saveBtn = document.getElementById('cp-save-btn');
    const cancelBtn = document.getElementById('cp-cancel-btn');

    if (this.isOwnProfile) {
      chatBtn.classList.remove('hidden');
      editBtn.classList.remove('hidden');
      if (this.editing) {
        editBtn.classList.add('hidden');
        saveBtn.classList.remove('hidden');
        cancelBtn.classList.remove('hidden');
      } else {
        editBtn.classList.remove('hidden');
        saveBtn.classList.add('hidden');
        cancelBtn.classList.add('hidden');
      }
    } else {
      chatBtn.classList.add('hidden');
      editBtn.classList.add('hidden');
      saveBtn.classList.add('hidden');
      cancelBtn.classList.add('hidden');
    }
  },

  renderGallery() {
    const grid = document.getElementById('cp-gallery-grid');
    const upload = document.getElementById('cp-gallery-upload');
    if (!grid) return;

    const gallery = this.currentData.gallery || [];
    const subtitle = document.getElementById('cp-gallery-subtitle');

    if (this.editing) {
      upload.classList.remove('hidden');
      if (subtitle) subtitle.textContent = `Photos & videos (${gallery.length} / ${this.MAX_GALLERY})`;
      const count = document.getElementById('cp-gallery-count');
      if (count) count.textContent = `${gallery.length} / ${this.MAX_GALLERY}`;
    } else {
      upload.classList.add('hidden');
      if (subtitle) subtitle.textContent = 'Photos & videos';
    }

    if (gallery.length === 0 && !this.editing) {
      grid.innerHTML = '<p class="text-slate-500 text-sm col-span-full text-center py-8">No gallery items yet.</p>';
      return;
    }

    grid.innerHTML = '';

    gallery.forEach((item, i) => {
      const div = document.createElement('div');
      div.className = 'relative group rounded-2xl overflow-hidden aspect-[4/3] border border-slate-800/80';
      const isVideo = item.type === 'video';

      if (i === 0) {
        const badge = document.createElement('span');
        badge.className = 'absolute top-2 left-2 bg-blue-600 text-white text-[9px] font-bold px-2 py-0.5 rounded z-10';
        badge.textContent = 'PROFILE';
        div.appendChild(badge);
      }

      if (isVideo) {
        const vid = document.createElement('video');
        vid.src = item.src;
        vid.className = 'w-full h-full object-cover';
        vid.muted = true;
        vid.loop = true;
        vid.preload = 'metadata';
        div.appendChild(vid);
        const playIcon = document.createElement('div');
        playIcon.className = 'absolute inset-0 flex items-center justify-center bg-black/20 pointer-events-none';
        playIcon.innerHTML = '<i data-lucide="play" class="w-8 h-8 text-white/80"></i>';
        div.appendChild(playIcon);
      } else {
        const img = document.createElement('img');
        img.src = item.src;
        img.className = 'w-full h-full object-cover';
        img.loading = 'lazy';
        div.appendChild(img);
      }

      if (this.editing) {
        const delBtn = document.createElement('button');
        delBtn.type = 'button';
        delBtn.className = 'absolute top-2 right-2 w-7 h-7 rounded-full bg-red-600/90 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition shadow-md hover:bg-red-700 z-10';
        delBtn.innerHTML = '<i data-lucide="trash-2" class="w-3.5 h-3.5"></i>';
        delBtn.addEventListener('click', (e) => { e.stopPropagation(); this.deleteMedia(i); });
        div.appendChild(delBtn);
      }

      grid.appendChild(div);
    });

    if (window.lucide) lucide.createIcons();
  },

  handleGalleryUpload(e) {
    const files = Array.from(e.target.files);
    const gallery = this.currentData.gallery || [];
    const available = this.MAX_GALLERY - gallery.length;

    if (files.length > available) {
      alert(`You can only add up to ${available} more file(s). Maximum is ${this.MAX_GALLERY}.`);
      e.target.value = '';
      return;
    }

    let processed = 0;
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const type = file.type.startsWith('video/') ? 'video' : 'image';
        let src = ev.target.result;
        if (type === 'image') {
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement('canvas');
            const maxWidth = 800;
            const scale = maxWidth / img.width;
            canvas.width = maxWidth;
            canvas.height = img.height * scale;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            src = canvas.toDataURL('image/jpeg', 0.7);
            this.currentData.gallery.push({ type: 'image', src });
            processed++;
            if (processed === files.length) this._syncAndRender();
          };
          img.src = src;
        } else {
          this.currentData.gallery.push({ type: 'video', src });
          processed++;
          if (processed === files.length) this._syncAndRender();
        }
      };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  },

  deleteMedia(index) {
    if (!this.currentData.gallery) return;
    this.currentData.gallery.splice(index, 1);
    this._syncAndRender();
    this.showToast('Media removed', 'success');
  },

  _syncAndRender() {
    const user = this._getAuthUser();
    if (user && user.role === 'coach') {
      const coaches = JSON.parse(localStorage.getItem('mocoach_coaches') || '[]');
      const idx = coaches.findIndex(c => c.username === user.userId);
      if (idx >= 0) {
        coaches[idx].gallery = this.currentData.gallery;
        coaches[idx].avatar = this.currentData.gallery.length > 0 ? this.currentData.gallery[0].src : coaches[idx].avatar;
        coaches[idx].bio = this.currentData.description;
        coaches[idx].tags = this.currentData.tags;
        localStorage.setItem('mocoach_coaches', JSON.stringify(coaches));

        const session = JSON.parse(sessionStorage.getItem('mocoach_auth') || '{}');
        session.gallery = coaches[idx].gallery;
        session.avatar = coaches[idx].avatar;
        session.bio = coaches[idx].bio;
        session.tags = coaches[idx].tags;
        sessionStorage.setItem('mocoach_auth', JSON.stringify(session));
      }
    }
    this.renderGallery();
    this.renderHeader();
  },

  renderInfo() {
    const d = this.currentData;
    if (!d) return;

    const view = document.getElementById('cp-description-view');
    const edit = document.getElementById('cp-description-edit');
    const tagsEl = document.getElementById('cp-tags');

    if (this.editing) {
      view.classList.add('hidden');
      edit.classList.remove('hidden');
      edit.value = d.description || '';
    } else {
      view.classList.remove('hidden');
      edit.classList.add('hidden');
      view.innerHTML = d.description
        ? d.description.replace(/\n/g, '<br>')
        : '<span class="text-slate-500 italic">No description available.</span>';
    }

    if (tagsEl) {
      tagsEl.innerHTML = (d.tags || []).map(t =>
        `<span class="inline-flex items-center px-3 py-1 rounded-full bg-blue-600/10 text-blue-400 border border-blue-500/20 text-xs font-semibold">${this._esc(t)}</span>`
      ).join('');
    }
  },

  renderBadges() {
    const grid = document.getElementById('cp-badges-grid');
    if (!grid) return;

    const badgeVotes = this._getBadgeVotes();
    const coachVotes = badgeVotes[this.currentId] || {};

    const user = this._getAuthUser();
    const viewerIsCustomer = user && user.role === 'customer';

    grid.innerHTML = BADGE_CATEGORIES.map(cat => {
      const count = coachVotes[cat.key] || 0;
      const isActive = count > 0;
      const viewerHasVoted = viewerIsCustomer && !!(coachVotes[cat.key] && coachVotes[cat.key] > 0 && coachVotes[cat.key + '_voters'] && coachVotes[cat.key + '_voters'].includes(user.userId));
      return `
        <div class="bg-slate-800/60 rounded-xl p-4 border border-slate-700/50 flex flex-col items-center text-center transition ${isActive ? 'badge-active' : 'opacity-50'} ${viewerIsCustomer ? 'cursor-pointer hover:border-amber-500/50 hover:bg-slate-800/80' : ''}"
             ${viewerIsCustomer ? `onclick="CoachProfileApp.toggleBadge('${cat.key}')"` : ''}>
          <div class="w-12 h-12 rounded-xl ${isActive ? 'bg-gradient-to-br from-amber-400/20 to-orange-500/20 border-amber-500/30' : 'bg-slate-800/80 border-slate-700/50'} flex items-center justify-center mb-2 border">
            <i data-lucide="${cat.icon}" class="w-6 h-6 ${isActive ? 'text-amber-400' : 'text-slate-600'}"></i>
          </div>
          <p class="text-xs font-bold text-white">${cat.label}</p>
          <p class="text-[10px] text-slate-400 mt-0.5 leading-tight">${cat.desc}</p>
          <div class="mt-2 w-7 h-7 rounded-full ${isActive ? 'bg-amber-400/20 text-amber-400' : 'bg-slate-800 text-slate-600'} flex items-center justify-center text-xs font-bold">${count}</div>
          ${viewerHasVoted ? '<span class="text-[10px] text-emerald-400 font-bold mt-1">✓ You awarded this</span>' : ''}
        </div>
      `;
    }).join('');

    if (window.lucide) lucide.createIcons();
  },

  renderRatings() {
    const container = document.getElementById('cp-ratings');
    if (!container) return;

    const ratings = this._getRatings();
    const coachRatings = ratings[this.currentId] || {};
    let upCount = 0, downCount = 0;
    Object.values(coachRatings).forEach(v => {
      if (v === 'up') upCount++;
      if (v === 'down') downCount++;
    });

    const user = this._getAuthUser();
    const viewerIsCustomer = user && user.role === 'customer';
    const userVote = viewerIsCustomer ? (coachRatings[user.userId] || null) : null;

    container.innerHTML = `
      <div class="flex items-center space-x-3 mb-4">
        <div class="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
          <i data-lucide="thumbs-up" class="w-5 h-5"></i>
        </div>
        <div>
          <h2 class="text-xl font-extrabold text-white">Ratings</h2>
          <p class="text-sm text-slate-300 font-medium mt-0.5">Thumbs up/down from customers</p>
        </div>
      </div>
      <div class="flex items-center justify-center gap-8 py-4">
        <button onclick="CoachProfileApp.vote('up')" ${viewerIsCustomer ? '' : 'disabled'} class="flex flex-col items-center gap-2 px-6 py-4 rounded-2xl transition ${userVote === 'up' ? 'bg-emerald-500/20 border-emerald-500/50 border' : viewerIsCustomer ? 'bg-slate-800/60 hover:bg-slate-800/80 border border-slate-700/50 cursor-pointer' : 'bg-slate-800/40 border border-slate-700/30 opacity-60'}">
          <i data-lucide="thumbs-up" class="w-8 h-8 ${userVote === 'up' ? 'text-emerald-400' : 'text-slate-400'}"></i>
          <span class="text-2xl font-black ${userVote === 'up' ? 'text-emerald-400' : 'text-white'}">${upCount}</span>
          <span class="text-xs text-slate-500 font-medium">Up</span>
        </button>
        <button onclick="CoachProfileApp.vote('down')" ${viewerIsCustomer ? '' : 'disabled'} class="flex flex-col items-center gap-2 px-6 py-4 rounded-2xl transition ${userVote === 'down' ? 'bg-red-500/20 border-red-500/50 border' : viewerIsCustomer ? 'bg-slate-800/60 hover:bg-slate-800/80 border border-slate-700/50 cursor-pointer' : 'bg-slate-800/40 border border-slate-700/30 opacity-60'}">
          <i data-lucide="thumbs-down" class="w-8 h-8 ${userVote === 'down' ? 'text-red-400' : 'text-slate-400'}"></i>
          <span class="text-2xl font-black ${userVote === 'down' ? 'text-red-400' : 'text-white'}">${downCount}</span>
          <span class="text-xs text-slate-500 font-medium">Down</span>
        </button>
      </div>
      ${userVote ? `<p class="text-center text-xs text-slate-500">Click again to remove your vote</p>` : ''}
    `;

    if (window.lucide) lucide.createIcons();
  },

  vote(type) {
    const user = this._getAuthUser();
    if (!user || user.role !== 'customer') {
      this.showToast('Only customers can vote', 'error');
      return;
    }
    if (!this.currentId) return;

    const ratings = this._getRatings();
    if (!ratings[this.currentId]) ratings[this.currentId] = {};

    const currentVote = ratings[this.currentId][user.userId];

    if (currentVote === type) {
      delete ratings[this.currentId][user.userId];
      this.showToast('Vote removed', 'success');
    } else {
      ratings[this.currentId][user.userId] = type;
      this.showToast(type === 'up' ? 'Thumbs up! 👍' : 'Thumbs down 👎', 'success');
    }

    localStorage.setItem('mocoach_ratings', JSON.stringify(ratings));
    this.renderRatings();
  },

  toggleBadge(categoryKey) {
    const user = this._getAuthUser();
    if (!user || user.role !== 'customer') {
      this.showToast('Only customers can award badges', 'error');
      return;
    }
    if (!this.currentId) return;

    const badgeVotes = this._getBadgeVotes();
    if (!badgeVotes[this.currentId]) badgeVotes[this.currentId] = {};

    const coachBadges = badgeVotes[this.currentId];
    const voterKey = categoryKey + '_voters';
    if (!coachBadges[voterKey]) coachBadges[voterKey] = [];

    const alreadyVoted = coachBadges[voterKey].includes(user.userId);

    if (alreadyVoted) {
      coachBadges[categoryKey] = Math.max(0, (coachBadges[categoryKey] || 0) - 1);
      coachBadges[voterKey] = coachBadges[voterKey].filter(id => id !== user.userId);
      this.showToast('Badge removed', 'success');
    } else {
      coachBadges[categoryKey] = (coachBadges[categoryKey] || 0) + 1;
      coachBadges[voterKey].push(user.userId);
      this.showToast('Badge awarded! ⭐', 'success');
    }

    localStorage.setItem('mocoach_badge_votes', JSON.stringify(badgeVotes));
    this.renderBadges();
  },

  _getRatings() {
    try { return JSON.parse(localStorage.getItem('mocoach_ratings') || '{}'); }
    catch { return {}; }
  },

  _getBadgeVotes() {
    try { return JSON.parse(localStorage.getItem('mocoach_badge_votes') || '{}'); }
    catch { return {}; }
  },

  startEdit() {
    this.editing = true;
    this.render();
  },

  cancelEdit() {
    this.editing = false;
    this.open(this.currentId);
  },

  save() {
    const user = this._getAuthUser();
    if (!user || user.role !== 'coach') return;

    const descEdit = document.getElementById('cp-description-edit');
    if (descEdit) {
      this.currentData.description = descEdit.value.trim();
    }

    this.currentData.tags = this.currentData.tags;
    this.currentData.gallery = this.currentData.gallery;
    this.currentData.avatarUrl = this.currentData.gallery.length > 0 ? this.currentData.gallery[0].src : this.currentData.avatarUrl;

    const coaches = JSON.parse(localStorage.getItem('mocoach_coaches') || '[]');
    const idx = coaches.findIndex(c => c.username === user.userId);
    if (idx >= 0) {
      coaches[idx].bio = this.currentData.description;
      coaches[idx].tags = this.currentData.tags;
      coaches[idx].gallery = this.currentData.gallery;
      coaches[idx].avatar = this.currentData.avatarUrl;
      localStorage.setItem('mocoach_coaches', JSON.stringify(coaches));

      const session = JSON.parse(sessionStorage.getItem('mocoach_auth') || '{}');
      session.bio = coaches[idx].bio;
      session.tags = coaches[idx].tags;
      session.gallery = coaches[idx].gallery;
      session.avatar = coaches[idx].avatar;
      sessionStorage.setItem('mocoach_auth', JSON.stringify(session));
    }

    this.editing = false;
    this.showToast('Profile saved!', 'success');
    this.render();
  },

  show() {
    const main = document.querySelector('main');
    const profileView = document.getElementById('profile-view');
    const coachView = document.getElementById('coach-profile-view');
    const footer = document.getElementById('footer-placeholder');

    if (main) main.classList.add('hidden');
    if (profileView) profileView.classList.add('hidden');
    if (footer) footer.classList.add('hidden');
    if (coachView) coachView.classList.remove('hidden');
    document.getElementById('messaging-overlay')?.classList.add('hidden');
    window.scrollTo({ top: 0 });
  },

  close() {
    this.currentId = null;
    this.currentData = null;
    this.editing = false;
    this.isOwnProfile = false;
    const coachView = document.getElementById('coach-profile-view');
    if (coachView) coachView.classList.add('hidden');

    const main = document.querySelector('main');
    if (main) main.classList.remove('hidden');
    const footer = document.getElementById('footer-placeholder');
    if (footer) footer.classList.remove('hidden');

    window.scrollTo({ top: 0 });
  },

  closeAndReturn() {
    const user = this._getAuthUser();
    if (user && user.role === 'coach' && this.isOwnProfile) {
      this.close();
      const coachView = document.getElementById('coach-profile-view');
      if (coachView) coachView.classList.remove('hidden');
      this.open(user.userId);
    } else {
      this.close();
    }
  },

  generateTwinklingStars() {
    const container = document.getElementById('cp-stars-container');
    if (!container) return;
    container.innerHTML = '';
    for (let i = 0; i < 120; i++) {
      const star = document.createElement('div');
      star.className = 'star';
      star.style.cssText = `
        position:absolute;width:${Math.random()*2+0.8}px;height:${Math.random()*2+0.8}px;
        background:#fff;border-radius:50%;top:${Math.random()*100}%;left:${Math.random()*100}%;
        animation:twinkle ${Math.random()*3+2}s ease-in-out infinite;
        animation-delay:${Math.random()*5}s;
      `;
      container.appendChild(star);
    }
  },

  bindEvents() {
    document.getElementById('coach-profile-back-btn')?.addEventListener('click', (e) => {
      e.preventDefault();
      this.close();
    });

    document.getElementById('cp-contact-btn')?.addEventListener('click', () => {
      if (this.currentId && window.ChatApp) {
        this.close();
        ChatApp.open(this.currentId);
      }
    });

    document.getElementById('cp-chat-btn')?.addEventListener('click', () => {
      if (window.ChatApp) {
        ChatApp.open();
      }
    });

    document.getElementById('cp-edit-btn')?.addEventListener('click', () => this.startEdit());
    document.getElementById('cp-save-btn')?.addEventListener('click', () => this.save());
    document.getElementById('cp-cancel-btn')?.addEventListener('click', () => this.cancelEdit());

    document.getElementById('cp-gallery-input')?.addEventListener('change', (e) => this.handleGalleryUpload(e));
  },

  showToast(message, type) {
    const container = document.getElementById('cp-toast-container');
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

  _setText(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text || '';
  },

  _esc(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  },
};

const runCoachProfileInit = () => {
  const tryInit = () => {
    if (document.getElementById('coach-profile-view')) {
      CoachProfileApp.init();
    } else {
      setTimeout(tryInit, 50);
    }
  };
  setTimeout(tryInit, 200);
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', runCoachProfileInit);
} else {
  runCoachProfileInit();
}

window.CoachProfileApp = CoachProfileApp;
