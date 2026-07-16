"use strict";
const BADGE_CATEGORIES = [
  { key: 'technical_coach', label: 'Technical Coach', image: 'assets/img/badges/technical-coach.png', desc: 'Deep expertise in their discipline' },
  { key: 'flexibility_adaptability', label: 'Flexibility & Adaptability', image: 'assets/img/badges/flexibility-adaptability.png', desc: 'Adjusts sessions to individual needs' },
  { key: 'motivator', label: 'Motivator', image: 'assets/img/badges/motivator.png', desc: 'Inspires and pushes clients to excel' },
  { key: 'champion_builder', label: 'Champion Builder', image: 'assets/img/badges/champion-builder.png', desc: 'Helps clients achieve real results' },
];

const BADGE_NAMES = {
  technical_coach: 'Technical Coach',
  flexibility_adaptability: 'Flexibility & Adaptability',
  motivator: 'Motivator',
  champion_builder: 'Champion Builder',
};

const TAG_COLORS = [
  'bg-teal-500/10 text-teal-400 border-teal-500/20',
  'bg-amber-500/10 text-amber-400 border-amber-500/20',
  'bg-purple-500/10 text-purple-400 border-purple-500/20',
  'bg-amber-500/10 text-amber-400 border-amber-500/20',
  'bg-rose-500/10 text-rose-400 border-rose-500/20',
  'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
];

const TAG_GROUPS = {
  'Sports': [
    'Football', 'Swimming', 'Hiking', 'Running', 'Yoga', 'Padel', 'Tennis',
    'Cycling', 'Mountain Biking', 'Trail Running', 'Scuba Diving', 'Snorkeling',
    'Freediving', 'Surfing', 'Kitesurfing', 'Stand Up Paddle', 'Kayaking',
    'Sailing', 'Golf', 'Boxing', 'Kickboxing', 'Muay Thai', 'MMA',
    'Brazilian Jiu-Jitsu', 'Karate', 'Taekwondo', 'Judo', 'Beach Volleyball',
    'Basketball', 'Volleyball', 'Badminton', 'Table Tennis', 'Cricket', 'Rugby',
    'Horse Riding', 'Fishing', 'Spearfishing', 'Canyoning', 'Rock Climbing',
    'Paragliding', 'Open Water Swimming'
  ],
  'Fitness & Activities': [
    'Fitness', 'Gym', 'Personal Training', 'CrossFit', 'Calisthenics',
    'Pilates', 'Zumba', 'Dance Fitness', 'Outdoor Adventure'
  ],
  'Health & Goals': [
    'Lose Weight', 'Build Muscle', 'Stay Fit', 'Improve Health',
    'Improve Endurance', 'Get Stronger', 'Improve Flexibility',
    'Improve Mobility', 'Improve Balance', 'Increase Energy',
    'Sports Performance', 'Competition Preparation', 'Beginner Friendly',
    'Learn a New Sport', 'Master a Skill', 'Rehabilitation',
    'Recover from Injury', 'Stress Relief', 'Mental Wellbeing',
    'Weight Management', 'Body Transformation', 'Toning',
    'Cardio Fitness', 'Functional Fitness', 'Core Strength',
    'Posture Improvement', 'Self Defense'
  ],
  'Coaching & Lessons': [
    'Train for a Marathon', 'Train for a Triathlon', 'Trail Running Preparation',
    'Swimming Lessons', 'Learn to Dive', 'Learn to Surf', 'Learn Tennis',
    'Learn Padel', 'Kids Coaching', 'Senior Fitness', 'Prenatal Fitness',
    'Postnatal Fitness', 'Corporate Wellness'
  ]
};

const CITIES = [
  'Port Louis', 'Beau Bassin', 'Rose Hill', 'Quatre Bornes', 'Vacoas',
  'Phoenix', 'Curepipe', 'Ebene', 'Moka', 'Trianon', 'Pailles',
  'Coromandel', 'Albion', 'Flic en Flac', 'Tamarin', 'Black River',
  'Bambous', 'Cascavelle', 'Rivi\u00e8re Noire', 'Grand Baie',
  'Pereybere', 'Cap Malheureux', 'Trou aux Biches',
  'Pointe aux Canonniers', 'Mont Choisy', 'Goodlands', 'Grand Gaube',
  'Pamplemousses', 'Triolet', 'Terre Rouge', 'Arsenal',
  'Flacq (Centre de Flacq)', 'Belle Mare', 'Poste de Flacq',
  "Trou d'Eau Douce", 'Mah\u00e9bourg', 'Blue Bay', "Pointe d'Esny",
  'Plaine Magnien', 'Souillac', 'Chemin Grenier',
  'Rivi\u00e8re des Anguilles', 'Bel Ombre', 'Chamarel'
];

const CoachProfileApp = {
  currentId: null,
  currentData: null,
  editing: false,
  isOwnProfile: false,
  MAX_GALLERY: 7,
  _badgeMap: {},
  _badgeCache: null,

  async init() {
    if (!document.getElementById('coach-profile-view')) {
      setTimeout(() => this.init(), 50);
      return;
    }
    await this._loadBadgeMap();
    this.bindEvents();
  },

  showDeleteConfirm() {
    var el = document.getElementById('cp-delete-confirm');
    if (el) el.classList.remove('hidden');
  },

  hideDeleteConfirm() {
    var el = document.getElementById('cp-delete-confirm');
    if (el) el.classList.add('hidden');
    var err = document.getElementById('cp-delete-error');
    if (err) { err.classList.add('hidden'); err.textContent = ''; }
    var pw = document.getElementById('cp-delete-password');
    if (pw) pw.value = '';
  },

  async deleteProfile() {
    var pw = document.getElementById('cp-delete-password');
    var err = document.getElementById('cp-delete-error');
    var password = pw ? pw.value.trim() : '';
    if (!password) {
      if (err) { err.textContent = 'Please enter your password.'; err.classList.remove('hidden'); }
      return;
    }
    var res = await api.deleteOwnProfile(password);
    if (!res.success) {
      if (err) { err.textContent = res.error || 'Deletion failed.'; err.classList.remove('hidden'); }
      return;
    }
    sessionStorage.removeItem('mocoach_auth');
    window.location.href = 'index.html';
  },

  async _loadBadgeMap() {
    const res = await api.getAllBadges();
    if (res.success) {
      this._badgeCache = res.data;
      const map = {};
      (res.data || []).forEach(b => {
        for (const [key, name] of Object.entries(BADGE_NAMES)) {
          if (b.name === name) {
            map[key] = b.id;
          }
        }
      });
      this._badgeMap = map;
    }
  },

  async open(coachId) {
    const user = this._getAuthUser();
    this.isOwnProfile = user && user.role === 'coach' && user.userId === coachId;

    const res = await api.getCoach(coachId);
    if (!res.success) {
      this.showToast('Coach not found', 'error');
      return;
    }
    const d = res.data;

    var fullName = `${d.first_name || ''} ${d.last_name || ''}`.trim() || d.username;
    var galleryItems = (d.pictures || []).map(src => ({ type: 'image', src }));
    var avatarSrc = d.profile_pic || (galleryItems.length > 0 ? galleryItems.shift().src : '');

    this.currentData = {
      id: d.id,
      name: fullName,
      firstName: d.first_name || '',
      lastName: d.last_name || '',
      username: d.username || '',
      email: d.email || '',
      discipline: (d.tags && d.tags[0]) ? d.tags[0].name || '' : '',
      rawPrice: d.price ? String(d.price) : '',
      price: d.price ? `Rs ${d.price} per session` : '',
      city: d.city || '',
      photoUrl: avatarSrc,
      avatarUrl: avatarSrc,
      description: d.description || '',
      tags: (d.tags || []).map(t => t.name || t),
      gallery: galleryItems,
      thumbsUp: d.thumbs_up || 0,
      thumbsDown: d.thumbs_down || 0,
      my_vote: d.my_vote,
    };

    this._coachData = d;

    const citySelect = document.getElementById('cp-city-edit');
    if (citySelect && citySelect.options.length === 0) {
      const citiesRes = await api.getCities();
      const cities = citiesRes.success ? citiesRes.data : CITIES;
      cities.forEach(city => {
        const name = typeof city === 'string' ? city : (city.name || city);
        const opt = document.createElement('option');
        opt.value = name;
        opt.textContent = name;
        if (typeof city === 'object' && city.id != null) {
          opt.dataset.cityId = city.id;
        }
        citySelect.appendChild(opt);
      });
    }

    this.currentId = coachId;
    this.editing = false;
    this.render();
    this.show();
  },

  _getAuthUser() {
    try { return JSON.parse(sessionStorage.getItem('mocoach_auth')); } catch { return null; }
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
      avatarEl.style.backgroundImage = `url(${escapeHtml(d.avatarUrl || (d.gallery && d.gallery.length > 0 ? d.gallery[0].src : ''))})`;
    }

    this._setText('cp-name', d.name);
    const discEl = document.getElementById('cp-discipline');
    if (discEl) {
      if (d.discipline) {
        discEl.textContent = d.discipline;
        discEl.classList.remove('hidden');
      } else {
        discEl.classList.add('hidden');
      }
    }

    const priceView = document.getElementById('cp-price-view');
    const priceEdit = document.getElementById('cp-price-edit');
    const priceWrapper = document.getElementById('cp-price-edit-wrapper');
    if (priceView && priceEdit && priceWrapper) {
      if (this.editing) {
        priceView.classList.add('hidden');
        priceWrapper.classList.remove('hidden');
        priceEdit.value = d.rawPrice;
      } else {
        priceView.classList.remove('hidden');
        priceWrapper.classList.add('hidden');
        priceView.textContent = d.price;
      }
    }

    const cityView = document.getElementById('cp-city-view');
    const cityEdit = document.getElementById('cp-city-edit');
    const basicEdit = document.getElementById('cp-basic-edit');
    if (cityView && cityEdit) {
      if (this.editing) {
        cityView.classList.add('hidden');
        if (basicEdit) basicEdit.classList.remove('hidden');
        if (document.getElementById('cp-firstname-edit')) document.getElementById('cp-firstname-edit').value = d.firstName || '';
        if (document.getElementById('cp-lastname-edit')) document.getElementById('cp-lastname-edit').value = d.lastName || '';
        if (document.getElementById('cp-username-edit')) document.getElementById('cp-username-edit').value = d.username || '';
        if (document.getElementById('cp-email-edit')) document.getElementById('cp-email-edit').value = d.email || '';
        cityEdit.value = d.city;
      } else {
        cityView.classList.remove('hidden');
        cityView.textContent = d.city ? `📍 ${d.city}` : '';
        if (basicEdit) basicEdit.classList.add('hidden');
      }
    }

    const avatarEdit = document.getElementById('cp-avatar-edit');
    if (avatarEdit) {
      if (this.editing) {
        avatarEdit.classList.remove('hidden');
      } else {
        avatarEdit.classList.add('hidden');
      }
    }

    const contactBtn = document.getElementById('cp-contact-btn');
    if (contactBtn) {
      contactBtn.classList.toggle('hidden', this.isOwnProfile);
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

    var accountSection = document.getElementById('cp-account-section');
    if (accountSection) accountSection.classList.toggle('hidden', !this.isOwnProfile);
  },

  renderGallery() {
    const grid = document.getElementById('cp-gallery-grid');
    const upload = document.getElementById('cp-gallery-upload');
    if (!grid) return;

    const gallery = this.currentData.gallery || [];
    const subtitle = document.getElementById('cp-gallery-subtitle');

    if (this.editing) {
      if (upload) upload.classList.remove('hidden');
      if (subtitle) subtitle.textContent = `Photos & videos (${gallery.length} / ${this.MAX_GALLERY})`;
      const count = document.getElementById('cp-gallery-count');
      if (count) count.textContent = `${gallery.length} / ${this.MAX_GALLERY}`;
    } else {
      if (upload) upload.classList.add('hidden');
      if (subtitle) subtitle.textContent = 'Photos & videos';
    }

    if (gallery.length === 0 && !this.editing) {
      grid.innerHTML = '<p class="text-slate-500 text-sm col-span-full text-center py-8">No gallery items yet.</p>';
      return;
    }

    grid.innerHTML = gallery.length === 0 ? '<p class="text-slate-500 text-sm col-span-full text-center py-4">No gallery items yet. Add photos below.</p>' : '';

    gallery.forEach((item, i) => {
      const itemObj = typeof item === 'string' ? { type: 'image', src: item } : item;
      const div = document.createElement('div');
      div.className = 'relative group rounded-2xl overflow-hidden aspect-[4/3] border border-slate-800/80';
      const isVideo = itemObj.type === 'video';

      if (isVideo) {
        const vid = document.createElement('video');
        vid.src = itemObj.src;
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
        img.src = itemObj.src;
        img.className = 'w-full h-full object-cover';
        img.loading = 'lazy';
        div.appendChild(img);
      }

      if (this.editing) {
        const delBtn = document.createElement('button');
        delBtn.type = 'button';
        delBtn.className = 'absolute top-2 right-2 w-7 h-7 rounded-full bg-red-600/90 text-white flex items-center justify-center shadow-md hover:bg-red-700 z-10';
        delBtn.innerHTML = '<i data-lucide="trash-2" class="w-3.5 h-3.5"></i>';
        delBtn.addEventListener('click', (e) => { e.stopPropagation(); this.deleteMedia(i); });
        div.appendChild(delBtn);
      }

      grid.appendChild(div);
    });

    if (window.lucide) lucide.createIcons();
  },

  async handleGalleryUpload(e) {
    const files = Array.from(e.target.files);
    if (!Array.isArray(this.currentData.gallery)) this.currentData.gallery = [];
    const gallery = this.currentData.gallery;
    const available = this.MAX_GALLERY - gallery.length;

    if (files.length > available) {
      alert(`You can only add up to ${available} more file(s). Maximum is ${this.MAX_GALLERY}.`);
      e.target.value = '';
      return;
    }

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const slot = gallery.length + i + 1;
      const res = await api.uploadCoachPicture(slot, file);
      if (res.success) {
        gallery.push({ type: 'image', src: res.data.picture || '' });
      } else {
        this.showToast(res.error || 'Failed to upload gallery photo', 'error');
      }
    }

    this._syncAndRender();
    e.target.value = '';
  },

  async deleteMedia(index) {
    if (!this.currentData.gallery) return;
    this.currentData.gallery.splice(index, 1);
    this._syncAndRender();
    if (this.currentId) {
      const res = await api.getCoach(this.currentId);
      if (res.success) this._coachData = res.data;
    }
    this.showToast('Media removed', 'success');
  },

  async handleAvatarUpload(e) {
    try {
      const file = e.target.files[0];
      if (!file || !file.type.startsWith('image/')) return;
      const res = await api.uploadProfilePicture(file);
      if (res.success) {
        this.currentData.avatarUrl = res.data.profile_pic || '';
        this._syncAndRender();
        const avatarEl = document.getElementById('cp-avatar');
        if (avatarEl) {
          avatarEl.style.backgroundImage = `url(${escapeHtml(res.data.profile_pic || '')})`;
        }
        if (window.updateHeaderProfilePic) window.updateHeaderProfilePic();
        this.showToast('Profile photo updated!', 'success');
      } else {
        this.showToast(res.error || 'Failed to update profile photo', 'error');
      }
    } catch (err) {
      this.showToast('Failed to read file', 'error');
    } finally {
      e.target.value = '';
    }
  },

  _syncAndRender() {
    this.renderGallery();
    this.renderHeader();
  },

  renderInfo() {
    const d = this.currentData;
    if (!d) return;

    const view = document.getElementById('cp-description-view');
    const edit = document.getElementById('cp-description-edit');
    const bioWrapper = document.getElementById('cp-bio-edit-wrapper');
    const tagsEl = document.getElementById('cp-tags');
    const tagsEdit = document.getElementById('cp-tags-edit');

    if (this.editing) {
      view.classList.add('hidden');
      if (bioWrapper) bioWrapper.classList.remove('hidden');
      edit.classList.remove('hidden');
      edit.value = d.description || '';
      if (tagsEl) tagsEl.classList.add('hidden');
      if (tagsEdit) tagsEdit.classList.remove('hidden');
      this.renderTagCheckboxes();
    } else {
      view.classList.remove('hidden');
      if (bioWrapper) bioWrapper.classList.add('hidden');
      view.innerHTML = d.description
        ? escapeHtml(d.description).replace(/\n/g, '<br>')
        : '<span class="text-slate-500 italic">No description available.</span>';
      if (tagsEl) tagsEl.classList.remove('hidden');
      if (tagsEdit) tagsEdit.classList.add('hidden');
      if (tagsEl) {
        const tags = d.tags || [];
        if (tags.length === 0) {
          tagsEl.innerHTML = '<span class="text-slate-500 italic text-sm">No specialties listed.</span>';
        } else {
          tagsEl.innerHTML = tags.map((t, i) =>
            `<span class="inline-flex items-center px-3 py-1 rounded-full ${TAG_COLORS[i % TAG_COLORS.length]} border text-xs font-semibold">${escapeHtml(t)}</span>`
          ).join('');
        }
      }
    }
  },

  renderTagCheckboxes() {
    const checklist = document.getElementById('cp-tag-checklist');
    const search = document.getElementById('cp-tag-search');
    const count = document.getElementById('cp-tag-count');
    if (!checklist) return;

    const selected = new Set(this.currentData.tags || []);

    function render(filter) {
      checklist.innerHTML = '';
      const lower = (filter || '').toLowerCase();
      Object.entries(TAG_GROUPS).forEach(([group, tags]) => {
        const filtered = tags.filter(t => t.toLowerCase().includes(lower));
        if (filtered.length === 0) return;
        const block = document.createElement('div');
        const heading = document.createElement('p');
        heading.className = 'text-xs font-semibold text-slate-500 uppercase tracking-wider mt-3 first:mt-0 mb-1.5';
        heading.textContent = group;
        block.appendChild(heading);
        filtered.forEach(tag => {
          const label = document.createElement('label');
          label.className = 'flex items-center space-x-2.5 py-1 px-2 rounded-lg hover:bg-slate-900 cursor-pointer transition';
          const cb = document.createElement('input');
          cb.type = 'checkbox';
          cb.value = tag;
          cb.checked = selected.has(tag);
          cb.className = 'w-4 h-4 rounded border-slate-700 bg-slate-900 text-amber-500 focus:ring-amber-500/50 cursor-pointer';
          cb.addEventListener('change', () => {
            if (cb.checked) {
              if (selected.size >= 3) {
                cb.checked = false;
                alert('You can select a maximum of 3 tags.');
                return;
              }
              selected.add(tag);
            } else {
              selected.delete(tag);
            }
            if (count) count.textContent = `${selected.size} of 3 selected`;
          });
          const span = document.createElement('span');
          span.className = 'text-sm text-slate-300';
          span.textContent = tag;
          label.appendChild(cb);
          label.appendChild(span);
          block.appendChild(label);
        });
        checklist.appendChild(block);
      });
    }

    render('');
    if (count) count.textContent = `${selected.size} of 3 selected`;

    if (search) {
      search.value = '';
      search.oninput = (e) => render(e.target.value);
    }
  },

  async renderBadges() {
    const grid = document.getElementById('cp-badges-grid');
    if (!grid) return;

    const user = this._getAuthUser();
    const viewerIsCustomer = user && user.role === 'customer';

    let badgeCounts = {};
    if (this.currentId) {
      const res = await api.getUserBadgeSummary(this.currentId);
      if (res.success) {
        badgeCounts = res.data;
      }
    }

    const totalBadges = Object.values(badgeCounts).reduce((sum, v) => Array.isArray(v) ? sum + v.length : sum, 0);

    if (totalBadges === 0 && !viewerIsCustomer) {
      grid.innerHTML = '<p class="text-slate-500 text-sm col-span-full text-center py-8">No badges awarded yet.</p>';
      if (window.lucide) lucide.createIcons();
      return;
    }

    grid.innerHTML = BADGE_CATEGORIES.map(cat => {
      const bid = this._badgeMap[cat.key];
      const givers = bid && badgeCounts[bid] ? badgeCounts[bid] : [];
      const count = Array.isArray(givers) ? givers.length : 0;
      const isActive = count > 0;
      const viewerHasVoted = viewerIsCustomer && Array.isArray(givers) && givers.some(g => g.giver_id === user.userId);
      return `
        <div class="bg-slate-800/60 rounded-xl overflow-hidden border border-slate-700/50 flex flex-col transition ${isActive ? 'badge-active' : 'opacity-50'} cursor-pointer hover:border-amber-500/50 hover:bg-slate-800/80"
             onclick="CoachProfileApp._handleBadgeClick('${cat.key}')">
          <div class="aspect-[3/4] overflow-hidden">
            <img src="${cat.image}" alt="${cat.label}" class="w-full h-full object-cover" loading="lazy" onerror="this.style.display='none'">
          </div>
          <div class="p-2 flex items-center justify-between gap-1">
            <p class="text-xs font-bold text-white truncate">${cat.label}</p>
            <div class="flex items-center gap-1 flex-shrink-0">
              <div class="w-6 h-6 rounded-full ${isActive ? 'bg-amber-400/20 text-amber-400' : 'bg-slate-800 text-slate-600'} flex items-center justify-center text-xs font-bold">${count}</div>
              ${viewerHasVoted ? '<span class="text-[10px] text-amber-400 font-bold">✓</span>' : ''}
            </div>
          </div>
        </div>
      `;
    }).join('');

    if (window.lucide) lucide.createIcons();
  },

  renderRatings() {
    const container = document.getElementById('cp-ratings');
    if (!container) return;

    const d = this.currentData;
    let upCount = d.thumbsUp || 0, downCount = d.thumbsDown || 0;

    const user = this._getAuthUser();
    const viewerIsCustomer = user && user.role === 'customer';

    container.innerHTML = `
      <div class="flex items-center space-x-3 mb-4">
        <div class="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-400 flex items-center justify-center">
          <i data-lucide="thumbs-up" class="w-5 h-5"></i>
        </div>
        <div>
          <h2 class="text-lg sm:text-xl font-extrabold text-white">Ratings</h2>
          <p class="text-sm text-slate-300 font-medium mt-0.5">Thumbs up/down from customers</p>
        </div>
      </div>
      <div class="flex items-center justify-center gap-8 py-4">
        <button onclick="CoachProfileApp.vote('up')" class="flex flex-col items-center gap-2 px-6 py-4 rounded-2xl transition bg-slate-800/60 hover:bg-slate-800/80 border border-slate-700/50 ${viewerIsCustomer ? 'cursor-pointer' : 'opacity-60'}">
          <i data-lucide="thumbs-up" class="w-8 h-8 text-slate-400"></i>
          <span class="text-2xl font-black text-white">${upCount}</span>
          <span class="text-xs text-slate-500 font-medium">Up</span>
        </button>
        <button onclick="CoachProfileApp.vote('down')" class="flex flex-col items-center gap-2 px-6 py-4 rounded-2xl transition bg-slate-800/60 hover:bg-slate-800/80 border border-slate-700/50 ${viewerIsCustomer ? 'cursor-pointer' : 'opacity-60'}">
          <i data-lucide="thumbs-down" class="w-8 h-8 text-slate-400"></i>
          <span class="text-2xl font-black text-white">${downCount}</span>
          <span class="text-xs text-slate-500 font-medium">Down</span>
        </button>
      </div>
    `;

    if (window.lucide) lucide.createIcons();
  },

  async vote(type) {
    const user = this._getAuthUser();
    if (!user || user.role !== 'customer') {
      this.showToast('Only customers can vote', 'error');
      return;
    }
    if (!this.currentId) return;

    const newVote = type === 'up' ? true : false;
    const currentVote = this.currentData.my_vote;
    const body = (currentVote === newVote) ? null : newVote;

    const res = await api.rateCoach(this.currentId, body);
    if (res.success) {
      await this._refreshCoachData();
      if (body === null) {
        this.showToast('Vote removed', 'success');
      } else {
        this.showToast(type === 'up' ? 'Thumbs up!' : 'Thumbs down', 'success');
      }
    } else {
      this.showToast(res.error || 'Failed to rate', 'error');
    }
  },

  _handleBadgeClick(categoryKey) {
    const user = this._getAuthUser();
    if (!user) {
      this.showToast('Please log in to award badges', 'error');
      return;
    }
    if (user.role !== 'customer') {
      this.showToast('Only customers can award badges', 'error');
      return;
    }
    this.toggleBadge(categoryKey);
  },

  async toggleBadge(categoryKey) {
    const user = this._getAuthUser();
    if (!user || user.role !== 'customer') {
      this.showToast('Only customers can award badges', 'error');
      return;
    }
    if (!this.currentId) return;

    const badgeId = this._badgeMap[categoryKey];
    if (!badgeId) {
      this.showToast('Badge not configured', 'error');
      return;
    }

    const res = await api.toggleBadge(this.currentId, badgeId);
    if (res.success) {
      const msg = res.data.active ? 'Badge awarded!' : 'Badge removed';
      this.showToast(msg, 'success');
      await this.renderBadges();
    } else {
      this.showToast(res.error || 'Failed', 'error');
    }
  },

  async _refreshCoachData() {
    if (!this.currentId) return;
    const res = await api.getCoach(this.currentId);
    if (res.success) {
      this.currentData.thumbsUp = res.data.thumbs_up || 0;
      this.currentData.thumbsDown = res.data.thumbs_down || 0;
      this.currentData.my_vote = res.data.my_vote;
      this.renderRatings();
    }
  },

  startEdit() {
    this.editing = true;
    const d = this.currentData;
    const descEdit = document.getElementById('cp-description-edit');
    if (descEdit) descEdit.value = d.description || '';
    const priceEdit = document.getElementById('cp-price-edit');
    if (priceEdit) priceEdit.value = d.rawPrice;
    const cityEdit = document.getElementById('cp-city-edit');
    if (cityEdit) cityEdit.value = d.city;
    const curPw = document.getElementById('cp-current-password-edit');
    if (curPw) curPw.value = '';
    const pw = document.getElementById('cp-password-edit');
    if (pw) pw.value = '';
    const cpw = document.getElementById('cp-confirm-password-edit');
    if (cpw) cpw.value = '';
    this.render();
  },

  cancelEdit() {
    this.editing = false;
    this.open(this.currentId);
  },

  async save() {
    const user = this._getAuthUser();
    if (!user || user.role !== 'coach') return;

    var errors = [];
    var firstNameVal = (document.getElementById('cp-firstname-edit')?.value || '').trim();
    var lastNameVal = (document.getElementById('cp-lastname-edit')?.value || '').trim();
    var usernameVal = (document.getElementById('cp-username-edit')?.value || '').trim();
    var emailVal = (document.getElementById('cp-email-edit')?.value || '').trim();
    var cityVal = document.getElementById('cp-city-edit')?.value || '';
    var citySelect = document.getElementById('cp-city-edit');
    var cityOpt = citySelect ? citySelect.options[citySelect.selectedIndex] : null;
    var cityId = cityOpt ? parseInt(cityOpt.dataset.cityId) || null : null;
    var priceVal = document.getElementById('cp-price-edit')?.value || '';
    var bioVal = (document.getElementById('cp-description-edit')?.value || '').trim();
    var password = document.getElementById('cp-password-edit')?.value || '';
    var confirmPassword = document.getElementById('cp-confirm-password-edit')?.value || '';
    var currentPassword = document.getElementById('cp-current-password-edit')?.value || '';

    if (!firstNameVal) errors.push('First Name is required');
    if (!lastNameVal) errors.push('Last Name is required');
    if (!usernameVal) errors.push('Username is required');
    if (!emailVal) errors.push('Email is required');
    if (!cityVal) errors.push('Location is required');
    if (!priceVal) errors.push('Price per session is required');
    if (!bioVal) errors.push('Bio is required');
    if (password && !currentPassword) errors.push('Current password is required to set a new password');
    if (password && password !== confirmPassword) errors.push('Passwords do not match');

    var checkedTags = document.querySelectorAll('#cp-tag-checklist input[type="checkbox"]:checked');
    if (checkedTags.length < 1) errors.push('Select at least 1 tag / specialty');
    if (checkedTags.length > 3) errors.push('Maximum 3 tags allowed');

    if (errors.length > 0) {
      this.showToast(errors[0], 'error');
      return;
    }

    const checkedTagValues = [...checkedTags].map(cb => cb.value);
    var payload = {
      first_name: firstNameVal,
      last_name: lastNameVal,
      username: usernameVal,
      email: emailVal,
      price: parseInt(priceVal) || 0,
      description: bioVal,
      tags: checkedTagValues,
    };

    if (cityId) payload.city_id = cityId;

    const res = await api.updateProfile(payload);
    if (!res.success) {
      this.showToast(res.error || 'Failed to save profile', 'error');
      return;
    }

    if (password) {
      const pwRes = await api.changePassword(currentPassword, password);
      if (!pwRes.success) {
        this.showToast(pwRes.error || 'Profile saved but password change failed', 'warning');
      }
    }

    var fullName = (firstNameVal + ' ' + lastNameVal).trim() || usernameVal;
    this.currentData.firstName = firstNameVal;
    this.currentData.lastName = lastNameVal;
    this.currentData.username = usernameVal;
    this.currentData.email = emailVal;
    this.currentData.city = cityVal;
    this.currentData.rawPrice = priceVal;
    this.currentData.price = priceVal ? `Rs ${priceVal} per session` : '';
    this.currentData.description = bioVal;
    this.currentData.tags = checkedTagValues;
    this.currentData.name = fullName;

    const session = this._getAuthUser();
    if (session) {
      session.firstName = firstNameVal;
      session.lastName = lastNameVal;
      session.username = usernameVal;
      session.email = emailVal;
      session.bio = bioVal;
      session.tags = checkedTagValues;
      session.price = priceVal;
      session.city = cityVal;
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
    const starCount = window.matchMedia('(max-width: 768px)').matches ? 15 : 30;
    for (let i = 0; i < starCount; i++) {
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
        const coachId = this.currentId;
        this.close();
        ChatApp.open(coachId);
      }
    });

    document.getElementById('cp-chat-btn')?.addEventListener('click', () => {
      if (window.ChatApp) {
        const user = this._getAuthUser();
        ChatApp.open(user ? user.userId : null);
      }
    });

    document.getElementById('cp-edit-btn')?.addEventListener('click', () => this.startEdit());
    document.getElementById('cp-save-btn')?.addEventListener('click', () => this.save());
    document.getElementById('cp-cancel-btn')?.addEventListener('click', () => this.cancelEdit());

    document.getElementById('cp-gallery-input')?.addEventListener('change', (e) => this.handleGalleryUpload(e));
    document.getElementById('cp-avatar-input')?.addEventListener('change', (e) => this.handleAvatarUpload(e));
    document.getElementById('cp-avatar-edit')?.addEventListener('click', (e) => {
      document.getElementById('cp-avatar-input')?.click();
    });
  },

  showToast(message, type) {
    const container = document.getElementById('cp-toast-container');
    if (!container) return;
    const bg = type === 'success' ? 'bg-amber-500' : 'bg-red-500';
    const icon = type === 'success' ? 'check-circle' : 'alert-circle';
    const toast = document.createElement('div');
    toast.className = `${bg} text-white text-sm font-medium px-5 py-3 rounded-xl shadow-lg flex items-center space-x-2 animate-toast-in`;
    toast.innerHTML = `<i data-lucide="${icon}" class="w-4 h-4 flex-shrink-0"></i><span>${escapeHtml(message)}</span>`;
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
