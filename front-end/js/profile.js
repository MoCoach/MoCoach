const PROFILE_DATA = {
  nickname: 'pseudo',
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  city: '',
  bio: '',
  aboutMeImages: [], // Commence vide par défaut
  avatar: 'https://images.unsplash.com/photo-1637434071656-e4ecd2567e82?q=80&w=716&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
  badges: [
    {
      id: 'b1', icon: 'flame', title: 'Unparalleled Force',
      description: 'Completed 20 strength training sessions and achieved a new personal record in deadlifts.',
      coachId: 'coach-9', coachName: 'Kavir D.', dateEarned: '2026-05-15',
    },
    {
      id: 'b2', icon: 'music', title: 'Rhythm & Elegance',
      description: 'Mastered advanced Zumba choreography and demonstrated exceptional rhythm across 15 sessions.',
      coachId: 'coach-1', coachName: 'Priya S.', dateEarned: '2026-04-28',
    },
    {
      id: 'b3', icon: 'zap', title: 'Elite Runner',
      description: 'Achieved a sub-25 minute 5K run and maintained consistent pacing across all training sessions.',
      coachId: 'coach-8', coachName: 'Chloe A.', dateEarned: '2026-06-10',
    },
    {
      id: 'b4', icon: 'waves', title: 'Elite Swimmer',
      description: 'Completed 15 open water swimming sessions and improved lap time by 30%.',
      coachId: 'coach-7', coachName: 'Jean-Pierre S.', dateEarned: '2026-03-22',
    },
    {
      id: 'b5', icon: 'heart', title: 'Improved Endurance',
      description: 'Demonstrated remarkable improvement in cardiovascular endurance over 3 months of consistent training.',
      coachId: 'coach-2', coachName: 'Cedric L.', dateEarned: '2026-06-01',
    },
  ],
  badgesGiven: [
    {
      id: 'bg1', icon: 'star', title: 'Most Inspiring Coach',
      description: 'Your energy and dedication made every session unforgettable.',
      coachId: 'coach-1', coachName: 'Priya S.', dateGiven: '2026-04-20',
    },
    {
      id: 'bg2', icon: 'heart', title: 'Best Communicator',
      description: 'Clear instructions and exceptional patience throughout every training session.',
      coachId: 'coach-2', coachName: 'Cedric L.', dateGiven: '2026-05-10',
    },
    {
      id: 'bg3', icon: 'thumbs-up', title: 'Top Motivator',
      description: 'Pushed me beyond my limits with unwavering positivity and encouragement.',
      coachId: 'coach-7', coachName: 'Jean-Pierre S.', dateGiven: '2026-06-05',
    },
    {
      id: 'bg4', icon: 'target', title: 'Precision Coach',
      description: 'Flawless technique correction and personalized drill planning.',
      coachId: 'coach-8', coachName: 'Chloe A.', dateGiven: '2026-06-15',
    },
  ],
};

const ProfileApp = {
  data: null,
  editing: false,
  passwordVisible: { current: false, new: false, confirm: false },

  init() {
    if (!document.getElementById('profile-header-card')) {
      setTimeout(() => this.init(), 50);
      return;
    }

    // Récupération dynamique sécurisée des données de session
    try {
      const savedUser = localStorage.getItem('mocoach_user');
      if (savedUser) {
          this.data = JSON.parse(savedUser);
      } else {
          this.data = JSON.parse(JSON.stringify(PROFILE_DATA));
      }
    } catch (err) {
      console.error("Session parse error, resetting data.", err);
      this.data = JSON.parse(JSON.stringify(PROFILE_DATA));
    }

    if (!this.data || typeof this.data !== 'object') {
      this.data = JSON.parse(JSON.stringify(PROFILE_DATA));
    }

    // Assure la présence du tableau d'images "About Me"
    if (!this.data.aboutMeImages) {
      this.data.aboutMeImages = [];
    }

    this.render();
    this.bindEvents();
    this.generateTwinklingStars(); // Génère les 220 étoiles scintillantes
  },

  render() {
    this.renderHeader();
    this.renderAboutMe(); // Nouveau rendu pour la galerie de séances
    this.renderPersonalInfo();
    this.renderSecurity();
    this.renderBadges();
    if (window.lucide) lucide.createIcons();
  },

  generateTwinklingStars() {
    const container = document.getElementById('stars-container');
    if (!container) return;

    container.innerHTML = ''; // Nettoyage préalable

    const starCount = 220; // Quantité d'étoiles scintillantes élevée
    for (let i = 0; i < starCount; i++) {
      const star = document.createElement('div');
      star.className = 'star';

      const size = Math.random() * 2 + 0.8; // Tailles variées
      star.style.width = `${size}px`;
      star.style.height = `${size}px`;

      star.style.top = `${Math.random() * 100}%`;
      star.style.left = `${Math.random() * 100}%`;

      const duration = Math.random() * 3 + 2; 
      const delay = Math.random() * 5;
      star.style.animation = `twinkle ${duration}s ease-in-out infinite`;
      star.style.animationDelay = `${delay}s`;

      container.appendChild(star);
    }
  },

  logout() {
    // Suppression de la session locale et rechargement de l'application
    localStorage.removeItem('mocoach_user');
    window.location.reload();
  },

  renderHeader() {
    const el = document.getElementById('profile-header-card');
    if (!el) return;
    const d = this.data;

    el.innerHTML = `
      <div class="flex flex-col md:flex-row items-center md:items-start gap-6 relative z-10">
        <div class="relative flex-shrink-0">
          <div class="w-28 h-28 md:w-32 md:h-32 rounded-full overflow-hidden border-4 border-blue-500/30 shadow-xl">
            <img src="${this._esc(d.avatar || PROFILE_DATA.avatar)}" alt="User avatar" class="w-full h-full object-cover" loading="lazy">
          </div>
          <div class="absolute -bottom-1 -right-1 bg-emerald-500 w-6 h-6 rounded-full border-2 border-slate-900 flex items-center justify-center">
            <i data-lucide="check" class="w-3.5 h-3.5 text-white"></i>
          </div>
        </div>
        <div class="text-center md:text-left flex-1 min-w-0 flex flex-col justify-center">
          <p class="text-blue-400 text-lg sm:text-xl font-bold font-mono tracking-wider mt-4 md:mt-2">@${this._esc(d.nickname || 'pseudo')}</p>
          <p class="text-slate-300 text-sm mt-2.5 leading-relaxed italic max-w-xl break-words">${this._esc(d.bio || 'No bio written yet.')}</p>
        </div>
        <div class="flex-shrink-0 mt-4 md:mt-0 flex items-center space-x-3">
          <button onclick="ProfileApp.scrollToPersonal()" class="bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold px-6 py-2.5 rounded-xl transition shadow-lg hover:shadow-blue-600/25 flex items-center space-x-2">
            <i data-lucide="edit-3" class="w-4 h-4"></i>
            <span>Edit Profile</span>
          </button>
          <button onclick="ProfileApp.logout()" class="bg-red-950/40 border border-red-900/50 hover:bg-red-900/40 text-red-400 text-sm font-bold px-4 py-2.5 rounded-xl transition flex items-center space-x-2">
            <i data-lucide="log-out" class="w-4 h-4"></i>
            <span>Logout</span>
          </button>
        </div>
      </div>
    `;
  },

  renderAboutMe() {
    const container = document.getElementById('aboutme-images-container');
    if (!container) return;

    const images = this.data.aboutMeImages || [];
    let html = '';

    // 1. Rendu des miniatures ajoutées (Affiche 4 par écran grâce à la largeur de 25%)
    html += images.map((img, index) => `
      <div class="relative group rounded-2xl overflow-hidden min-w-[200px] sm:min-w-[calc(25%-12px)] max-w-[calc(25%-12px)] aspect-[16/10] snap-start flex-shrink-0 shadow-lg border border-slate-800/80">
        <img src="${this._esc(img)}" class="w-full h-full object-cover transition duration-300 group-hover:scale-105" loading="lazy">
        <div class="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition duration-300 flex items-center justify-center">
          <button onclick="ProfileApp.deleteAboutMeImage(${index})" class="w-10 h-10 rounded-xl bg-red-650/90 text-white flex items-center justify-center transition hover:bg-red-700 shadow-md">
            <i data-lucide="trash-2" class="w-5 h-5"></i>
          </button>
        </div>
      </div>
    `).join('');

    // 2. Rendu de la case d'ajout dynamique s'il reste de la place (< 7 photos)
    if (images.length < 7) {
        html += `
          <div onclick="document.getElementById('aboutme-file-input').click()" 
            class="relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-800 hover:border-blue-500/50 bg-slate-950/40 min-w-[200px] sm:min-w-[calc(25%-12px)] max-w-[calc(25%-12px)] aspect-[16/10] snap-start flex-shrink-0 cursor-pointer transition duration-300 text-slate-500 hover:text-blue-400 group">
            <i data-lucide="plus-circle" class="w-8 h-8 transition-transform group-hover:scale-110"></i>
            <span class="text-xs font-semibold mt-2">Add Photo (${images.length}/7)</span>
          </div>
        `;
    }

    container.innerHTML = html;
  },

  deleteAboutMeImage(index) {
    if (!this.data.aboutMeImages) return;
    this.data.aboutMeImages.splice(index, 1);
    localStorage.setItem('mocoach_user', JSON.stringify(this.data));
    this.renderAboutMe();
    if (window.lucide) lucide.createIcons();
    this.showToast('Photo removed successfully!', 'success');
  },

  compressAndAddImage(file) {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        // Redimensionnement et compression de l'image (pour rester robuste vis-à-vis du localStorage)
        const canvas = document.createElement('canvas');
        const max_width = 800; // Résolution optimale pour paysage de carrousel
        const scale = max_width / img.width;
        canvas.width = max_width;
        canvas.height = img.height * scale;
        
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        
        // Exportation en JPEG compressé à 70% de qualité
        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);
        
        if (!this.data.aboutMeImages) this.data.aboutMeImages = [];
        if (this.data.aboutMeImages.length < 7) {
          this.data.aboutMeImages.push(compressedBase64);
          localStorage.setItem('mocoach_user', JSON.stringify(this.data));
          this.renderAboutMe();
        }
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  },

  handleAboutMeUpload(e) {
    const files = e.target.files;
    if (!files.length) return;

    const currentCount = (this.data.aboutMeImages || []).length;
    const availableSlots = 7 - currentCount;

    if (files.length > availableSlots) {
      alert(`You can only add up to ${availableSlots} more photo(s). (Maximum is 7).`);
      return;
    }

    for (let i = 0; i < files.length; i++) {
      this.compressAndAddImage(files[i]);
    }
  },

  renderPersonalInfo() {
    const el = document.getElementById('profile-personal-form');
    if (!el) return;
    const d = this.data;
    const fields = [
      { id: 'pf-nickname', label: 'Pseudo', value: d.nickname || '', placeholder: 'ex: pseudo', type: 'text', required: true, colSpan: false },
      { id: 'pf-firstName', label: 'First Name', value: d.firstName || '', placeholder: 'ex: yourname', type: 'text', required: true, colSpan: false },
      { id: 'pf-lastName', label: 'Last Name', value: d.lastName || '', placeholder: 'ex: yourlastname', type: 'text', required: true, colSpan: false },
      { id: 'pf-email', label: 'Email', value: d.email || '', placeholder: 'ex: @example.com', type: 'email', required: true, colSpan: false },
      { id: 'pf-phone', label: 'Phone Number', value: d.phone || '', placeholder: 'ex: +230 5000 0000', type: 'tel', required: false, colSpan: false },
      { id: 'pf-city', label: 'City', value: d.city || '', placeholder: 'ex: Grand Baie', type: 'text', required: true, colSpan: false },
      { id: 'pf-bio', label: 'Bio', value: d.bio || '', placeholder: 'Describe your coaching background...', type: 'textarea', required: false, colSpan: true },
    ];

    el.innerHTML = `
      <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
        ${fields.map(f => {
          const inputHtml = f.type === 'textarea'
            ? `<textarea id="${f.id}" rows="3" placeholder="${this._esc(f.placeholder)}"
                 class="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-400 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition text-base resize-none">${this._esc(f.value)}</textarea>`
            : `<input id="${f.id}" type="${f.type}" value="${this._esc(f.value)}"
                 placeholder="${this._esc(f.placeholder)}"
                 ${f.required ? 'required' : ''}
                 class="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-400 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition text-base">`;

          return `
            <div class="${f.colSpan ? 'md:col-span-2' : ''}">
              <label for="${f.id}" class="block text-base font-semibold text-slate-200 mb-2">
                ${this._esc(f.label)} ${f.required ? '<span class="text-red-500">*</span>' : ''}
              </label>
              ${inputHtml}
              <p id="${f.id}-error" class="text-red-500 text-xs mt-1 hidden"></p>
            </div>
          `;
        }).join('')}
      </div>
      <div class="mt-6 flex items-center justify-between">
        <p id="pf-status" class="text-sm text-slate-500"></p>
        <button onclick="ProfileApp.savePersonalInfo()" class="bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold px-8 py-2.5 rounded-xl transition shadow-lg hover:shadow-blue-600/25 flex items-center space-x-2">
          <i data-lucide="save" class="w-4 h-4"></i>
          <span>Save Changes</span>
        </button>
      </div>
    `;
  },

  savePersonalInfo() {
    const fields = ['nickname', 'firstName', 'lastName', 'email', 'phone', 'city', 'bio'];
    const fieldIds = {
      nickname: 'pf-nickname', firstName: 'pf-firstName', lastName: 'pf-lastName',
      email: 'pf-email', phone: 'pf-phone', city: 'pf-city', bio: 'pf-bio'
    };
    const validators = {
      nickname: (v) => {
        if (!v) return 'Pseudo is required';
        if (v.length < 3 || v.length > 20) return 'Must be 3–20 characters';
        if (!/^[a-zA-Z0-9_]+$/.test(v)) return 'Letters, numbers, and underscores only';
        return '';
      },
      firstName: (v) => {
        if (!v) return 'First name is required';
        if (v.length < 2 || v.length > 50) return 'Must be 2–50 characters';
        if (!/^[a-zA-Z\s'-]+$/.test(v)) return 'Letters only';
        return '';
      },
      lastName: (v) => {
        if (!v) return 'Last name is required';
        if (v.length < 2 || v.length > 50) return 'Must be 2–50 characters';
        if (!/^[a-zA-Z\s'-]+$/.test(v)) return 'Letters only';
        return '';
      },
      email: (v) => {
        if (!v) return 'Email is required';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return 'Invalid email format';
        return '';
      },
      phone: (v) => {
        if (!v) return '';
        if (!/^\+?[\d\s-]{7,15}$/.test(v)) return 'Invalid phone number';
        return '';
      },
      city: (v) => {
        if (!v) return 'City is required';
        if (v.length < 2 || v.length > 50) return 'Must be 2–50 characters';
        if (!/^[a-zA-Z\s'-,]+$/.test(v)) return 'Letters, spaces, and commas only';
        return '';
      },
      bio: (v) => {
        if (v.length > 500) return 'Bio must be under 500 characters';
        return '';
      }
    };

    let hasError = false;
    const values = {};
    fields.forEach(f => {
      const input = document.getElementById(fieldIds[f]);
      const errorEl = document.getElementById(fieldIds[f] + '-error');
      if (!input) return;
      const val = input.value.trim();
      values[f] = val;
      const err = validators[f](val);
      if (err) {
        hasError = true;
        input.className = input.className.replace('border-slate-800', 'border-red-400') + ' border-red-400';
        if (errorEl) { errorEl.textContent = err; errorEl.classList.remove('hidden'); }
      } else {
        input.className = input.className.replace('border-red-400', 'border-slate-800');
        if (errorEl) { errorEl.textContent = ''; errorEl.classList.add('hidden'); }
      }
    });

    if (hasError) {
      this.showToast('Please fix the errors before saving', 'error');
      return;
    }

    Object.assign(this.data, values);
    localStorage.setItem('mocoach_user', JSON.stringify(this.data)); // Enregistre les changements dans la session locale
    
    // Met à jour dynamiquement la photo de profil du Header d'accueil après modification
    if (window.updateHeaderProfilePic) {
        window.updateHeaderProfilePic();
    }
    
    this.showToast('Profile updated successfully!', 'success');
    this.renderHeader();
  },

  renderSecurity() {
    const el = document.getElementById('profile-security-form');
    if (!el) return;

    el.innerHTML = `
      <div class="space-y-5">
        <div>
          <label for="pf-currentPw" class="block text-base font-semibold text-slate-700 mb-2">Current Password</label>
          <div class="relative">
            <input id="pf-currentPw" type="password" placeholder="Enter current password" class="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-2.5 pr-11 text-slate-400 placeholder-slate-600 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition text-base">
            <button onclick="ProfileApp.togglePassword('pf-currentPw', 'pw-toggle-current')" type="button" class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600" tabindex="-1">
              <i id="pw-toggle-current" data-lucide="eye-off" class="w-4 h-4"></i>
            </button>
          </div>
        </div>
        <div>
          <label for="pf-newPw" class="block text-base font-semibold text-slate-700 mb-2">New Password</label>
          <div class="relative">
            <input id="pf-newPw" type="password" placeholder="Enter new password" class="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-2.5 pr-11 text-slate-400 placeholder-slate-600 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition text-base">
            <button onclick="ProfileApp.togglePassword('pf-newPw', 'pw-toggle-new')" type="button" class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600" tabindex="-1">
              <i id="pw-toggle-new" data-lucide="eye-off" class="w-4 h-4"></i>
            </button>
          </div>
          <div id="pw-strength-bar" class="mt-2 h-1.5 rounded-full bg-slate-850 overflow-hidden">
            <div id="pw-strength-fill" class="h-full rounded-full transition-all duration-300" style="width:0%"></div>
          </div>
          <div id="pw-strength-label" class="text-sm text-slate-300 font-semibold mt-1"></div>
          <ul id="pw-criteria" class="mt-2 space-y-1">
            <li id="pw-criteria-length" class="text-sm text-slate-400 flex items-center space-x-1.5"><i data-lucide="circle" class="w-2.5 h-2.5"></i><span>At least 8 characters</span></li>
            <li id="pw-criteria-upper" class="text-sm text-slate-400 flex items-center space-x-1.5"><i data-lucide="circle" class="w-2.5 h-2.5"></i><span>One uppercase letter</span></li>
            <li id="pw-criteria-number" class="text-sm text-slate-400 flex items-center space-x-1.5"><i data-lucide="circle" class="w-2.5 h-2.5"></i><span>One number</span></li>
            <li id="pw-criteria-special" class="text-sm text-slate-400 flex items-center space-x-1.5"><i data-lucide="circle" class="w-2.5 h-2.5"></i><span>One special character</span></li>
          </ul>
        </div>
        <div>
          <label for="pf-confirmPw" class="block text-base font-semibold text-slate-700 mb-2">Confirm New Password</label>
          <div class="relative">
            <input id="pf-confirmPw" type="password" placeholder="Confirm new password" class="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-2.5 pr-11 text-slate-400 placeholder-slate-600 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition text-base">
            <button onclick="ProfileApp.togglePassword('pf-confirmPw', 'pw-toggle-confirm')" type="button" class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600" tabindex="-1">
              <i id="pw-toggle-confirm" data-lucide="eye-off" class="w-4 h-4"></i>
            </button>
          </div>
          <p id="pf-confirmPw-error" class="text-red-500 text-xs mt-1 hidden"></p>
        </div>
      </div>
      <div class="mt-6 flex items-center justify-between">
        <p id="pw-status" class="text-sm text-slate-500"></p>
        <button onclick="ProfileApp.changePassword()" class="bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold px-8 py-2.5 rounded-xl transition shadow-lg hover:shadow-blue-600/25 flex items-center space-x-2">
          <i data-lucide="lock" class="w-4 h-4"></i>
          <span>Change Password</span>
        </button>
      </div>
    `;

    document.getElementById('pf-newPw')?.addEventListener('input', (e) => this.checkPasswordStrength(e.target.value));
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

  checkPasswordStrength(password) {
    const hasLength = password.length >= 8;
    const hasUpper = /[A-Z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecial = /[^a-zA-Z0-9]/.test(password);

    const criteria = [
      { id: 'pw-criteria-length', pass: hasLength },
      { id: 'pw-criteria-upper', pass: hasUpper },
      { id: 'pw-criteria-number', pass: hasNumber },
      { id: 'pw-criteria-special', pass: hasSpecial },
    ];

    criteria.forEach(({ id, pass }) => {
      const el = document.getElementById(id);
      if (!el) return;
      el.className = `text-sm flex items-center space-x-1.5 ${pass ? 'text-emerald-400 font-bold' : 'text-slate-500'}`;
      const icon = el.querySelector('i');
      if (icon) {
        icon.setAttribute('data-lucide', pass ? 'check-circle' : 'circle');
        icon.className = pass ? 'w-3 h-3' : 'w-3 h-3';
      }
    });

    if (window.lucide) lucide.createIcons();

    const score = [hasLength, hasUpper, hasNumber, hasSpecial].filter(Boolean).length;
    const fill = document.getElementById('pw-strength-fill');
    const label = document.getElementById('pw-strength-label');
    if (!fill || !label) return;

    if (password.length === 0) {
      fill.style.width = '0%';
      label.textContent = '';
      return;
    }

    if (score <= 1) {
      fill.style.width = '25%';
      fill.className = 'h-full rounded-full bg-red-400 transition-all duration-300';
      label.textContent = 'Weak';
      label.className = 'text-sm text-red-500 font-bold mt-1';
    } else if (score === 2) {
      fill.style.width = '50%';
      fill.className = 'h-full rounded-full bg-amber-400 transition-all duration-300';
      label.textContent = 'Fair';
      label.className = 'text-sm text-amber-500 font-bold mt-1';
    } else if (score === 3) {
      fill.style.width = '75%';
      fill.className = 'h-full rounded-full bg-blue-500 transition-all duration-300';
      label.textContent = 'Good';
      label.className = 'text-sm text-blue-500 font-bold mt-1';
    } else {
      fill.style.width = '100%';
      fill.className = 'h-full rounded-full bg-emerald-500 transition-all duration-300';
      label.textContent = 'Strong';
      label.className = 'text-sm text-emerald-600 font-bold mt-1';
    }
  },

  renderBadges() {
    const el = document.getElementById('profile-badges-grid');
    if (!el) return;
    const received = this.data.badges || [];
    const given = this.data.badgesGiven || [];

    const renderBadgeCell = (b, isReceived) => {
      const dateKey = isReceived ? 'dateEarned' : 'dateGiven';
      return `
        <div class="relative badge-cell group flex items-center justify-center">
          <div class="w-12 h-12 md:w-14 md:h-14 rounded-xl bg-gradient-to-br from-blue-500/10 to-emerald-500/10 flex items-center justify-center border border-slate-800/80 bg-slate-950/40 group-hover:border-blue-500/50 group-hover:shadow-md group-hover:scale-110 transition-all duration-200 cursor-default">
            <i data-lucide="${this._esc(b.icon)}" class="w-5 h-5 md:w-6 md:h-6 text-blue-400"></i>
          </div>
          <div class="badge-tooltip">
            <div class="badge-tooltip-inner">
              <p class="text-xs font-bold text-white whitespace-nowrap">${this._esc(b.title)}</p>
              <p class="text-[10px] text-blue-200 mt-0.5">
                <span onclick="window.ChatApp && ChatApp.open('${this._esc(b.coachId)}')" class="cursor-pointer hover:text-white hover:underline">${this._esc(b.coachName)}</span>
              </p>
              <p class="text-[10px] text-slate-400 mt-0.5">${this._formatDate(b[dateKey])}</p>
            </div>
            <div class="badge-tooltip-arrow"></div>
          </div>
        </div>
      `;
    };

    if (received.length === 0 && given.length === 0) {
      el.innerHTML = `
        <div class="flex flex-col items-center justify-center py-12 text-slate-500">
          <i data-lucide="award" class="w-12 h-12 mb-3 text-slate-400"></i>
          <p class="text-sm font-semibold text-slate-500">No badges yet</p>
          <p class="text-xs text-slate-400 mt-1">Complete sessions with coaches to earn achievements!</p>
        </div>
      `;
      return;
    }

    const renderGrid = (items, isReceived) => `
      <div class="grid grid-cols-5 gap-3 md:gap-4">
        ${items.map(b => renderBadgeCell(b, isReceived)).join('')}
      </div>
    `;

    let html = '';

    if (received.length > 0) {
      html += `
        <div class="mb-8 relative z-10">
          <div class="flex items-center space-x-2 mb-4">
            <i data-lucide="download" class="w-4 h-4 text-emerald-400"></i>
            <h3 class="text-base font-bold text-slate-300">Badges from Coaches</h3>
            <span class="text-[10px] text-slate-400 font-bold bg-slate-800 px-2 py-0.5 rounded-full">${received.length}</span>
          </div>
          ${renderGrid(received, true)}
        </div>
      `;
    }

    if (given.length > 0) {
      html += `
        <div class="relative z-10">
          <div class="flex items-center space-x-2 mb-4">
            <i data-lucide="upload" class="w-4 h-4 text-blue-600"></i>
            <h3 class="text-base font-bold text-slate-300">Badges You've Given</h3>
            <span class="text-[10px] text-slate-400 font-bold bg-slate-800 px-2 py-0.5 rounded-full">${given.length}</span>
          </div>
          ${renderGrid(given, false)}
        </div>
      `;
    }

    el.innerHTML = html;
  },

  scrollToPersonal() {
    const el = document.getElementById('profile-personal-card');
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    const input = document.getElementById('pf-nickname');
    if (input) setTimeout(() => input.focus(), 500);
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
    // Écouteur pour l'importation de photos "About Me"
    document.getElementById('aboutme-file-input')?.addEventListener('change', (e) => this.handleAboutMeUpload(e));

    // Liaison des clics pour faire défiler le carrousel About Me de gauche à droite
    const aboutmeContainer = document.getElementById('aboutme-images-container');
    const slideLeftBtn = document.getElementById('aboutme-slide-left');
    const slideRightBtn = document.getElementById('aboutme-slide-right');

    if (aboutmeContainer && slideLeftBtn && slideRightBtn) {
        const offset = 260; // Distance de défilement horizontal en pixels
        slideLeftBtn.addEventListener('click', () => {
            aboutmeContainer.scrollBy({ left: -offset, behavior: 'smooth' });
        });
        slideRightBtn.addEventListener('click', () => {
            aboutmeContainer.scrollBy({ left: offset, behavior: 'smooth' });
        });
    }

    document.getElementById('profile-back-btn')?.addEventListener('click', (e) => {
      e.preventDefault();
      if (window.showMainView) window.showMainView();
    });
  },

  _formatDate(iso) {
    const d = new Date(iso);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  },

  _esc(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  },
};

// BUG FIX : Système de démarrage robuste pour éviter tout conflit asynchrone avec DOMContentLoaded
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