const COACH_PROFILES = {
  'coach-1': {
    id: 'coach-1', name: 'Priya S.', discipline: 'Zumba',
    price: '450 Rs/h', priceValue: 450, city: 'Grand Baie',
    photoUrl: 'assets/img/Certified_coaches/zumba.jpg',
    avatarUrl: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=300&q=80',
    description: 'With over 8 years of experience in dance and fitness, Priya brings the energy of sega rhythms to every Zumba session. Her classes blend high-energy cardio with island-inspired moves, making fitness feel like a celebration.',
    tags: ['Zumba', 'Dance Fitness', 'Sega Rhythms', 'Cardio'],
    gallery: [],
  },
  'coach-2': {
    id: 'coach-2', name: 'Cedric L.', discipline: 'Boxing',
    price: '600 Rs/h', priceValue: 600, city: 'Port Louis',
    photoUrl: 'https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?auto=format&fit=crop&w=600&q=80',
    avatarUrl: 'https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?auto=format&fit=crop&w=300&q=80',
    description: 'Cedric is a former national boxing champion with 10 years of coaching experience.',
    tags: ['Boxing', 'Kickboxing', 'Conditioning', 'Self-Defense'],
    gallery: [],
  },
  'coach-3': {
    id: 'coach-3', name: 'Leana Marou', discipline: 'Yoga',
    price: '550 Rs/h', priceValue: 550, city: 'Pereybere',
    photoUrl: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=600&q=80',
    avatarUrl: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=300&q=80',
    description: 'Leana is a 500-RYT certified yoga instructor who blends Vinyasa flow with breathwork and meditation.',
    tags: ['Yoga', 'Vinyasa', 'Meditation', 'Beach Yoga'],
    gallery: [],
  },
  'coach-4': {
    id: 'coach-4', name: 'Sarah B.', discipline: 'Tennis',
    price: '750 Rs/h', priceValue: 750, city: 'Belle Mare',
    photoUrl: 'https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?auto=format&fit=crop&w=600&q=80',
    avatarUrl: 'https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?auto=format&fit=crop&w=300&q=80',
    description: 'Sarah is a certified tennis professional with experience coaching players from beginners to tournament level.',
    tags: ['Tennis', 'Serve & Volley', 'Footwork', 'Match Strategy'],
    gallery: [],
  },
  'coach-5': {
    id: 'coach-5', name: 'Mathieu R.', discipline: 'Football',
    price: '400 Rs/h', priceValue: 400, city: 'Curepipe',
    photoUrl: 'https://images.unsplash.com/photo-1517747614396-d21a78b850e8?auto=format&fit=crop&w=600&q=80',
    avatarUrl: 'https://images.unsplash.com/photo-1517747614396-d21a78b850e8?auto=format&fit=crop&w=300&q=80',
    description: 'Mathieu played semi-professional football in Europe before returning to Mauritius to coach.',
    tags: ['Football', 'Dribbling', 'Tactical Training', 'Agility'],
    gallery: [],
  },
  'coach-6': {
    id: 'coach-6', name: 'Amisha K.', discipline: 'Gymnastics',
    price: '650 Rs/h', priceValue: 650, city: 'Quatre Bornes',
    photoUrl: 'https://images.unsplash.com/photo-1507652313519-d4e9174996dd?auto=format&fit=crop&w=600&q=80',
    avatarUrl: 'https://images.unsplash.com/photo-1507652313519-d4e9174996dd?auto=format&fit=crop&w=300&q=80',
    description: 'Amisha is a former national gymnast with over 12 years of coaching experience.',
    tags: ['Gymnastics', 'Flexibility', 'Core Strength', 'Floor Routine'],
    gallery: [],
  },
  'coach-7': {
    id: 'coach-7', name: 'Jean-Pierre S.', discipline: 'Water Sports',
    price: '700 Rs/h', priceValue: 700, city: 'Flic en Flac',
    photoUrl: 'https://images.unsplash.com/photo-1519315901367-f34ff9154487?auto=format&fit=crop&w=600&q=80',
    avatarUrl: 'https://images.unsplash.com/photo-1519315901367-f34ff9154487?auto=format&fit=crop&w=300&q=80',
    description: 'Jean-Pierre is a certified open-water swim coach and paddleboarding instructor.',
    tags: ['Open Water Swimming', 'Paddleboarding', 'Water Safety', 'Endurance'],
    gallery: [],
  },
  'coach-8': {
    id: 'coach-8', name: 'Chloe A.', discipline: 'Jogging/Running',
    price: '350 Rs/h', priceValue: 350, city: 'Tamarin',
    photoUrl: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=600&q=80',
    avatarUrl: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=300&q=80',
    description: 'Chloe is a marathon runner and certified running coach who helps clients of all levels.',
    tags: ['Running', 'Endurance', 'Pacing', '5K / 10K Prep'],
    gallery: [],
  },
  'coach-9': {
    id: 'coach-9', name: 'Kavir D.', discipline: 'Strength Training',
    price: '500 Rs/h', priceValue: 500, city: 'Moka',
    photoUrl: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=600&q=80',
    avatarUrl: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=300&q=80',
    description: 'Kavir is a certified strength and conditioning specialist with a background in sports science.',
    tags: ['Strength Training', 'Hypertrophy', 'Posture', 'Progressive Overload'],
    gallery: [],
  },
  'coach-10': {
    id: 'coach-10', name: 'Arnaud G.', discipline: 'Hiking',
    price: '650 Rs/h', priceValue: 650, city: 'Black River',
    photoUrl: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=600&q=80',
    avatarUrl: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=300&q=80',
    description: 'Arnaud is an experienced mountain guide who knows every trail in Mauritius.',
    tags: ['Hiking', 'Trail Navigation', 'Mountain Guide', 'Nature'],
    gallery: [],
  },
  'coach-11': {
    id: 'coach-11', name: 'Gael B.', discipline: 'Combat Sports',
    price: '550 Rs/h', priceValue: 550, city: 'Port Louis',
    photoUrl: 'https://images.unsplash.com/photo-1517438476312-10d79c01926d?auto=format&fit=crop&w=600&q=80',
    avatarUrl: 'https://images.unsplash.com/photo-1517438476312-10d79c01926d?auto=format&fit=crop&w=300&q=80',
    description: 'Gael has trained in martial arts for over 15 years, holding black belts in multiple disciplines.',
    tags: ['Kickboxing', 'Self-Defense', 'Muay Thai', 'MMA Conditioning'],
    gallery: [],
  },
  'coach-12': {
    id: 'coach-12', name: 'Ryan M.', discipline: 'Dance',
    price: '450 Rs/h', priceValue: 450, city: 'Grand Baie',
    photoUrl: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&w=600&q=80',
    avatarUrl: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&w=300&q=80',
    description: 'Ryan is a professional dancer and choreographer with experience in contemporary, hip-hop, and sega.',
    tags: ['Hip-Hop', 'Contemporary', 'Sega', 'Choreography'],
    gallery: [],
  },
  'coach-13': {
    id: 'coach-13', name: 'Nicholas W.', discipline: 'Badminton',
    price: '480 Rs/h', priceValue: 480, city: 'Rose Hill',
    photoUrl: 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?auto=format&fit=crop&w=600&q=80',
    avatarUrl: 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?auto=format&fit=crop&w=300&q=80',
    description: 'Nicholas is a national-level badminton player with a passion for teaching.',
    tags: ['Badminton', 'Footwork', 'Smash Technique', 'Court Coverage'],
    gallery: [],
  },
  'coach-14': {
    id: 'coach-14', name: 'Dev M.', discipline: 'Rugby',
    price: '500 Rs/h', priceValue: 500, city: 'Curepipe',
    photoUrl: 'https://images.unsplash.com/photo-1533560904424-a0c61dc306fc?auto=format&fit=crop&w=600&q=80',
    avatarUrl: 'https://images.unsplash.com/photo-1533560904424-a0c61dc306fc?auto=format&fit=crop&w=300&q=80',
    description: 'Dev played rugby for the Mauritius national team and now coaches the next generation.',
    tags: ['Rugby', 'Tackling', 'Passing', 'Team Tactics'],
    gallery: [],
  },
  'coach-15': {
    id: 'coach-15', name: 'Robert T.', discipline: 'Golf',
    price: '800 Rs/h', priceValue: 800, city: 'Belle Mare',
    photoUrl: 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?auto=format&fit=crop&w=600&q=80',
    avatarUrl: 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?auto=format&fit=crop&w=300&q=80',
    description: 'Robert is a PGA-accredited golf instructor with years of experience teaching at premier Mauritian golf courses.',
    tags: ['Golf', 'Swing Mechanics', 'Putting', 'Course Strategy'],
    gallery: [],
  },
  'coach-16': {
    id: 'coach-16', name: 'David L.', discipline: 'Basketball',
    price: '550 Rs/h', priceValue: 550, city: 'Port Louis',
    photoUrl: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&w=600&q=80',
    avatarUrl: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&w=300&q=80',
    description: 'David played college basketball internationally and brings modern training methods to Mauritius.',
    tags: ['Basketball', 'Dribbling', 'Shooting', 'Vertical Jump'],
    gallery: [],
  },
  'coach-17': {
    id: 'coach-17', name: 'Melissa P.', discipline: 'Handball',
    price: '450 Rs/h', priceValue: 450, city: 'Quatre Bornes',
    photoUrl: 'https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&w=600&q=80',
    avatarUrl: 'https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&w=300&q=80',
    description: 'Melissa is a former national handball player who now coaches youth and adult players.',
    tags: ['Handball', 'Team Play', 'Defense', 'Agility'],
    gallery: [],
  },
  'coach-18': {
    id: 'coach-18', name: 'Alan Y.', discipline: 'Table Tennis',
    price: '400 Rs/h', priceValue: 400, city: 'Rose Hill',
    photoUrl: 'https://images.unsplash.com/photo-1534067783941-51c9c23eccfd?auto=format&fit=crop&w=600&q=80',
    avatarUrl: 'https://images.unsplash.com/photo-1534067783941-51c9c23eccfd?auto=format&fit=crop&w=300&q=80',
    description: 'Alan is a table tennis specialist with multiple island championship titles.',
    tags: ['Table Tennis', 'Spin Control', 'Reflexes', 'Placement'],
    gallery: [],
  },
};

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

    const profile = COACH_PROFILES[coachId];
    if (profile) {
      this.currentData = { ...profile };
      const saved = this._getSavedCoach(coachId);
      if (saved) {
        this.currentData.description = saved.description || profile.description;
        this.currentData.tags = saved.tags || profile.tags;
        this.currentData.gallery = saved.gallery || profile.gallery || [];
        this.currentData.price = saved.price || profile.price;
        this.currentData.avatarUrl = saved.avatar || profile.avatarUrl;
        this.currentData.city = saved.city || profile.city;
      } else {
        this.currentData.gallery = profile.gallery || [];
      }
    } else {
      this.currentData = {
        id: coachId, name: coachId, discipline: '', price: '', city: '',
        photoUrl: '', avatarUrl: '', description: '', tags: [], gallery: [],
      };
    }

    if (this.isOwnProfile) {
      Object.assign(this.currentData, {
        name: user.firstName ? `${user.firstName} ${user.lastName}`.trim() : user.username,
        discipline: user.discipline || this.currentData.discipline,
        price: user.price ? `Rs ${user.price} per session` : this.currentData.price,
        city: user.city || this.currentData.city,
        description: user.bio || this.currentData.description,
        tags: user.tags || this.currentData.tags,
        gallery: user.gallery || this.currentData.gallery || [],
        avatarUrl: user.avatar || this.currentData.avatarUrl,
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
window.COACH_PROFILES = COACH_PROFILES;
