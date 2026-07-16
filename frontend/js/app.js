"use strict";
function fallbackImg(img) {
    img.onerror = null;
    img.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"%3E%3Crect fill="%231e293b" width="100" height="100"/%3E%3Ccircle cx="50" cy="36" r="22" fill="%23334155"/%3E%3Cpath d="M14 94Q50 68 86 94" fill="%23334155"/%3E%3C/svg%3E';
}

const SEARCH_SUGGESTIONS = [
    'Yoga',
    'Pilates',
    'Meditation',
    'HIIT',
    'Cardio',
    'Strength training',
    'Personal training',
    'Swimming',
    'Running',
    'Tennis',
    'Martial arts',
    'Prenatal fitness',
    'Outdoor hiking',
    'Beach workouts',
    'Nutrition coaching',
    'Weight loss'
];

function getSearchSuggestions(query) {
    const value = (query || '').trim().toLowerCase();
    if (!value) return [];
    const matches = [];
    SEARCH_SUGGESTIONS.forEach(item => {
        const lower = item.toLowerCase();
        if (lower.startsWith(value) || lower.includes(value)) {
            matches.push(item);
        }
    });
    return matches.slice(0, 6);
}

function closeSearchSuggestions(menu) {
    menu.classList.add('hidden');
    menu.querySelectorAll('.search-suggestion-item.active').forEach(item => item.classList.remove('active'));
}

function setActiveSuggestion(items, index) {
    if (!items.length) return null;
    items.forEach(item => item.classList.remove('active'));
    const targetIndex = Math.max(0, Math.min(index, items.length - 1));
    const item = items[targetIndex];
    if (item) {
        item.classList.add('active');
        item.scrollIntoView({ block: 'nearest' });
    }
    return item;
}

function updateSearchSuggestionMenu(input, menu) {
    const suggestions = getSearchSuggestions(input.value);
    if (!suggestions.length) {
        menu.innerHTML = '';
        menu.classList.add('hidden');
        menu.style.display = 'none';
        return;
    }
    menu.innerHTML = suggestions.map(item => '<button type="button" class="search-suggestion-item">' + escapeHtml(item) + '</button>').join('');
    menu.classList.remove('hidden');
    menu.style.display = 'block';
}

function attachSearchAutocomplete(inputId) {
    const input = document.getElementById(inputId);
    if (!input) return;
    input.setAttribute('autocomplete', 'off');
    const wrapper = input.parentElement || input.closest('.relative') || document.body;
    if (wrapper && getComputedStyle(wrapper).position === 'static') {
        wrapper.style.position = 'relative';
    }
    let menu = wrapper ? wrapper.querySelector('.search-suggestions') : null;
    if (!menu) {
        menu = document.createElement('div');
        menu.className = 'search-suggestions hidden';
        menu.setAttribute('aria-live', 'polite');
        wrapper.appendChild(menu);
    }
    input.addEventListener('input', () => updateSearchSuggestionMenu(input, menu));
    input.addEventListener('keydown', (e) => {
        const items = Array.from(menu.querySelectorAll('.search-suggestion-item'));
        if (!items.length) return;
        const active = menu.querySelector('.search-suggestion-item.active');
        const currentIndex = active ? items.indexOf(active) : -1;
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setActiveSuggestion(items, currentIndex + 1);
            return;
        }
        if (e.key === 'ArrowUp') {
            e.preventDefault();
            setActiveSuggestion(items, currentIndex - 1);
            return;
        }
        if (e.key === 'Enter') {
            const chosen = active || items[0];
            if (chosen) {
                e.preventDefault();
                input.value = chosen.textContent || '';
                input.dispatchEvent(new Event('input'));
                closeSearchSuggestions(menu);
            }
        }
        if (e.key === 'Escape') {
            closeSearchSuggestions(menu);
        }
    });
    input.addEventListener('focus', () => {
        if (input.value.trim().length > 0) updateSearchSuggestionMenu(input, menu);
    });
    input.addEventListener('blur', () => {
        setTimeout(() => closeSearchSuggestions(menu), 150);
    });
    menu.addEventListener('click', (e) => {
        const button = e.target.closest('.search-suggestion-item');
        if (!button) return;
        input.value = button.textContent || '';
        input.dispatchEvent(new Event('input'));
        input.focus();
        closeSearchSuggestions(menu);
    });
}

async function loadComponent(id, url) {
    const element = document.getElementById(id);
    if (element) {
        try {
            const response = await fetch(url);
            const html = await response.text();
            element.innerHTML = html;
            if (window.lucide) lucide.createIcons();
            if (id === 'header-placeholder') {
                updateHeaderProfilePic();
                initMobileMenu();
            }
            if (id === 'mobile-tab-bar-placeholder') {
                initMobileTabBar();
            }
        } catch (error) {
            console.error('Component loading error:', error);
        }
    }
}

let currentView = 'home';

const AuthService = {
    async login(identity, password) {
        const res = await api.login(identity, password);
        if (!res.success) return { success: false, error: res.error };

        const u = res.data.user;
        const session = {
            token: api.getToken(),
            user: u,
            role: u.is_admin ? 'admin' : (u.is_coach ? 'coach' : 'customer'),
            userId: u.id,
            username: u.username,
            email: u.email,
            avatar: u.profile_pic || '',
            firstName: u.first_name || '',
            lastName: u.last_name || '',
        };
        if (u.coach) {
            session.city = u.coach.city || '';
            session.bio = u.coach.description || '';
            session.tags = (u.coach.tags || []).map(t => t.name || t);
            session.price = u.coach.price || '';
            session.gallery = u.coach.pictures || [];
            session.discipline = (u.coach.tags && u.coach.tags[0]) ? u.coach.tags[0].name || u.coach.tags[0] : '';
        }
        sessionStorage.setItem('mocoach_auth', JSON.stringify(session));
        return { success: true, role: session.role, user: session };
    },

    async register(data) {
        const res = await api.register(data);
        if (!res.success) return res;
        return { success: true };
    },

    logout() {
        api.clearToken();
        sessionStorage.removeItem('mocoach_auth');
        window.location.reload();
    },

    getCurrentUser() {
        try { return JSON.parse(sessionStorage.getItem('mocoach_auth')); }
        catch { return null; }
    },

    isLoggedIn() {
        return !!this.getCurrentUser();
    },

    getRole() {
        const user = this.getCurrentUser();
        return user ? user.role : null;
    },
};

window.AuthService = AuthService;

function showMainView() {
    currentView = 'home';
    const main = document.querySelector('main');
    const profile = document.getElementById('profile-view');
    const coachView = document.getElementById('coach-profile-view');

    if (main) main.classList.remove('hidden');
    if (profile) profile.classList.add('hidden');
    if (coachView) coachView.classList.add('hidden');

    document.body.classList.remove('overflow-hidden');
    window.scrollTo({ top: 0, behavior: 'smooth' });

    if (window.innerWidth <= 768) {
        switchMobileView('home');
        setActiveTab('home');
    }
}

function showProfileView() {
    const user = AuthService.getCurrentUser();
    if (!user) {
        showLoginModal();
        return;
    }

    if (user.role === 'admin') {
        window.location.href = 'admin.html';
        return;
    }

    if (user.role === 'coach') {
        showCoachProfileView(user.userId);
        return;
    }

    currentView = 'profile';
    const main = document.querySelector('main');
    const profile = document.getElementById('profile-view');
    const coachView = document.getElementById('coach-profile-view');
    const footer = document.getElementById('footer-placeholder');

    if (main) main.classList.add('hidden');
    if (coachView) coachView.classList.add('hidden');
    if (profile && profile.classList.contains('hidden')) profile.classList.remove('hidden');
    if (footer) footer.classList.add('hidden');

    window.scrollTo({ top: 0 });
}

function showLoginModal() {
    const modal = document.getElementById('coach-modal');
    if (modal) {
        modal.classList.remove('hidden');
        document.body.classList.add('overflow-hidden');
        if (window.switchModalTab) switchModalTab('login');
    }
}

function showRegisterModal() {
    const modal = document.getElementById('coach-modal');
    if (modal) {
        modal.classList.remove('hidden');
        document.body.classList.add('overflow-hidden');
        if (window.switchModalTab) switchModalTab('register');
    }
}

function showCoachProfileView(coachId) {
    currentView = 'coach-profile';
    const main = document.querySelector('main');
    const profile = document.getElementById('profile-view');
    const coachView = document.getElementById('coach-profile-view');
    const footer = document.getElementById('footer-placeholder');

    if (main) main.classList.add('hidden');
    if (profile) profile.classList.add('hidden');
    if (footer) footer.classList.add('hidden');
    if (coachView) coachView.classList.remove('hidden');

    if (window.CoachProfileApp) {
        if (coachId) {
            CoachProfileApp.open(coachId);
        } else {
            const user = AuthService.getCurrentUser();
            if (user && user.role === 'coach') {
                CoachProfileApp.open(user.userId);
            }
        }
    }

    window.scrollTo({ top: 0 });
}

window.showCoachProfileView = showCoachProfileView;
window.showMainView = showMainView;
window.showProfileView = showProfileView;

function showToast(msg) {
    const existing = document.getElementById('toast-msg');
    if (existing) existing.remove();
    const toast = document.createElement('div');
    toast.id = 'toast-msg';
    toast.textContent = msg;
    Object.assign(toast.style, {
        position: 'fixed', bottom: '24px', left: '50%', transform: 'translateX(-50%)',
        background: '#1e293b', color: '#e2e8f0', padding: '10px 24px',
        borderRadius: '12px', fontSize: '14px', fontWeight: '600',
        boxShadow: '0 8px 32px rgba(0,0,0,0.5)', zIndex: '9999',
        border: '1px solid #334155', transition: 'opacity 0.3s'
    });
    document.body.appendChild(toast);
    setTimeout(() => { toast.style.opacity = '0'; setTimeout(() => toast.remove(), 300); }, 2500);
}

function closeAuthModal() {
    var modal = document.getElementById('coach-modal');
    if (modal && !modal.classList.contains('hidden')) {
        modal.classList.add('hidden');
        document.body.classList.remove('overflow-hidden');
    }
}

function handleHomeNavigation() {
    closeAuthModal();
    var path = window.location.pathname.split('/').pop();
    if (path === '' || path === 'index.html') {
        showMainView();
    } else {
        window.location.href = 'index.html';
    }
}

function updateHeaderProfilePic() {
    const btn = document.getElementById('profile-btn');
    const dropdown = document.getElementById('profile-dropdown');
    if (!btn) return;

    const user = AuthService.getCurrentUser();

    if (user) {
        const avatarUrl = user.avatar || '';
        if (avatarUrl) {
            btn.innerHTML = `<img src="${sanitizeUrl(avatarUrl)}" class="w-full h-full object-cover rounded-full" alt="Profile">`;
        } else {
            btn.innerHTML = `<i data-lucide="user" class="w-6 h-6"></i>`;
            if (window.lucide) lucide.createIcons();
        }
        if (dropdown) {
            const roleLabel = user.role === 'admin' ? 'Admin Panel' : user.role === 'coach' ? 'My Coach Profile' : 'My Profile';
            const roleLink = user.role === 'admin' ? 'admin.html' : '#';
            dropdown.innerHTML = `
                <a href="${escapeHtml(roleLink)}" id="dropdown-profile-link" class="block px-4 py-2 text-sm text-slate-300 hover:bg-slate-800 hover:text-white transition font-semibold">${escapeHtml(roleLabel)}</a>
                <hr class="border-slate-800 my-1">
                <a href="#" id="dropdown-logout-link" class="block px-4 py-2 text-sm text-red-400 hover:bg-red-950/30 hover:text-red-300 transition font-bold">Logout</a>
            `;
        }
        var mobileLogout = document.getElementById('mobile-menu-logout');
        if (mobileLogout) mobileLogout.classList.remove('hidden');
    } else {
        btn.innerHTML = `<i data-lucide="user" class="w-6 h-6"></i>`;
        if (window.lucide) lucide.createIcons();
        if (dropdown) {
            dropdown.innerHTML = `
                <a href="#" id="dropdown-login-link" class="block px-4 py-2 text-sm text-slate-300 hover:bg-slate-850 hover:text-white transition font-semibold">Login / Register</a>
            `;
        }
        var mobileLogout = document.getElementById('mobile-menu-logout');
        if (mobileLogout) mobileLogout.classList.add('hidden');
    }
    updateMobileTabBarProfile();
}
window.updateHeaderProfilePic = updateHeaderProfilePic;

function initMobileMenu() {
    const btn = document.getElementById('mobile-menu-btn');
    const overlay = document.getElementById('mobile-menu-overlay');
    const panel = document.getElementById('mobile-menu-panel');
    const backdrop = document.getElementById('mobile-menu-backdrop');
    const closeBtn = document.getElementById('mobile-menu-close');
    const icon = btn?.querySelector('i[data-lucide]');
    if (!btn || !overlay || !panel) return;

    function openMenu() {
        overlay.classList.remove('hidden');
        requestAnimationFrame(() => {
            overlay.classList.add('open');
        });
        document.body.classList.add('menu-open');
        btn.setAttribute('aria-expanded', 'true');
        if (icon) {
            icon.setAttribute('data-lucide', 'x');
            if (window.lucide) lucide.createIcons();
        }
    }

    function closeMenu() {
        overlay.classList.remove('open');
        document.body.classList.remove('menu-open');
        btn.setAttribute('aria-expanded', 'false');
        if (icon) {
            icon.setAttribute('data-lucide', 'menu');
            if (window.lucide) lucide.createIcons();
        }
        setTimeout(() => {
            if (!overlay.classList.contains('open')) {
                overlay.classList.add('hidden');
            }
        }, 300);
    }

    btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const isOpen = overlay.classList.contains('open');
        if (isOpen) {
            closeMenu();
        } else {
            openMenu();
        }
    });

    if (backdrop) backdrop.addEventListener('click', closeMenu);
    if (closeBtn) closeBtn.addEventListener('click', closeMenu);

    overlay.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', closeMenu);
    });

    overlay.querySelectorAll('[data-overlay]').forEach(tile => {
        tile.addEventListener('click', () => {
            closeMenu();
            const target = tile.getAttribute('data-overlay');
            setTimeout(() => openMobileOverlay(target), 350);
        });
    });

    var paramsTile = overlay.querySelector('.mobile-menu-tile:nth-child(3)');
    if (paramsTile) {
        paramsTile.addEventListener('click', () => {
            closeMenu();
            setTimeout(() => showToast('Parameters coming soon!'), 350);
        });
    }

    var mobileLogoutBtn = document.getElementById('mobile-menu-logout');
    if (mobileLogoutBtn) {
        mobileLogoutBtn.addEventListener('click', () => {
            closeMenu();
            AuthService.logout();
        });
    }
}

// ── Mobile View Switching (app-like, no scroll) ──

function switchMobileView(viewName) {
    var isMobile = window.innerWidth <= 768;
    if (!isMobile) return;

    var isIndexPage = window.location.pathname.split('/').pop() === '' ||
                      window.location.pathname.split('/').pop() === 'index.html';
    if (!isIndexPage) return;

    document.querySelectorAll('.mobile-view').forEach(function(v) {
        v.classList.remove('view-active');
    });

    var target = document.getElementById('view-' + viewName);
    if (target) {
        target.classList.add('view-active');
        var main = document.querySelector('main');
        if (main) main.scrollTo(0, 0);
    }
}

// ── Mobile Tab Bar ──

function isOnIndexPage() {
    var path = window.location.pathname.split('/').pop();
    return path === '' || path === 'index.html';
}

function initMobileTabBar() {
    const tabBar = document.getElementById('mobile-tab-bar');
    if (!tabBar) return;

    updateMobileTabBarProfile();

    const homeBtn = document.getElementById('tab-bar-home');
    const exploreBtn = document.getElementById('tab-bar-explore');
    const chatBtn = document.getElementById('tab-bar-chat');
    const profileBtn = document.getElementById('tab-bar-profile');

    if (homeBtn) {
        homeBtn.addEventListener('click', () => {
            setActiveTab('home');
            handleHomeNavigation();
        });
    }

    if (exploreBtn) {
        exploreBtn.addEventListener('click', () => {
            setActiveTab('explore');
            if (currentView === 'coach-profile' || currentView === 'profile') {
                var main = document.querySelector('main');
                var coachView = document.getElementById('coach-profile-view');
                var profileView = document.getElementById('profile-view');
                if (main) main.classList.remove('hidden');
                if (coachView) coachView.classList.add('hidden');
                if (profileView) profileView.classList.add('hidden');
            }
            var isMobile = window.innerWidth <= 768;
            if (isMobile) {
                if (isOnIndexPage()) {
                    switchMobileView('explore');
                } else {
                    window.location.href = 'index.html?view=explore';
                }
            } else {
                if (isOnIndexPage()) {
                    var el = document.getElementById('explore');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                } else {
                    window.location.href = 'index.html#explore';
                }
            }
        });
    }

    if (chatBtn) {
        chatBtn.addEventListener('click', () => {
            setActiveTab('chat');
            var user = AuthService.getCurrentUser();
            if (user) {
                if (window.ChatApp) ChatApp.open();
            } else {
                showLoginModal();
            }
        });
    }

    if (profileBtn) {
        profileBtn.addEventListener('click', () => {
            setActiveTab('profile');
            var user = AuthService.getCurrentUser();
            if (user) {
                showProfileView();
            } else {
                showLoginModal();
            }
        });
    }
}

function setActiveTab(tab) {
    document.querySelectorAll('.tab-bar-item').forEach(item => {
        item.classList.remove('active');
        item.classList.add('text-slate-500');
        item.classList.remove('text-teal-400');
    });
    var btn = document.getElementById('tab-bar-' + tab);
    if (btn) {
        btn.classList.add('active');
        btn.classList.remove('text-slate-500');
        btn.classList.add('text-teal-400');
    }
}

function updateMobileTabBarProfile() {
    var avatarEl = document.getElementById('tab-bar-avatar');
    var nameEl = document.getElementById('tab-bar-username');
    if (!avatarEl || !nameEl) return;

    var user = AuthService.getCurrentUser();
    if (user) {
        var avatarUrl = user.avatar || '';
        if (avatarUrl) {
            avatarEl.innerHTML = '<img src="' + sanitizeUrl(avatarUrl) + '" alt="Profile">';
        } else {
            avatarEl.innerHTML = '<i data-lucide="user" class="w-4 h-4"></i>';
            if (window.lucide) lucide.createIcons();
        }
        nameEl.textContent = user.username || 'Profile';
        nameEl.classList.add('text-teal-400');
        nameEl.classList.remove('text-slate-500');
    } else {
        avatarEl.innerHTML = '<i data-lucide="user" class="w-4 h-4"></i>';
        if (window.lucide) lucide.createIcons();
        nameEl.textContent = 'Profile';
    }
}

// ── Mobile Overlays ──

function openMobileOverlay(name) {
    var overlay = document.getElementById('mobile-overlay-' + name);
    if (!overlay) return;
    overlay.classList.remove('hidden');
    document.body.classList.add('overlay-open');
    if (window.lucide) lucide.createIcons();
}

function closeMobileOverlay(name) {
    var overlay = document.getElementById('mobile-overlay-' + name);
    if (!overlay) return;
    overlay.classList.add('hidden');
    document.body.classList.remove('overlay-open');
}

// ── Toast ──

function switchModalTab(tab) {
    const registerForm = document.getElementById('register-form');
    const loginForm = document.getElementById('login-form');
    const regTabBtn = document.getElementById('tab-register-btn');
    const loginTabBtn = document.getElementById('tab-login-btn');
    const modalTitle = document.getElementById('modal-title');
    const modalSubtitle = document.getElementById('modal-subtitle');

    if (!registerForm || !loginForm) return;

    hideRegError();

    if (tab === 'register') {
        registerForm.classList.remove('hidden');
        loginForm.classList.add('hidden');
        regTabBtn.classList.add('border-teal-500', 'text-white');
        regTabBtn.classList.remove('border-transparent', 'text-slate-400');
        loginTabBtn.classList.remove('border-teal-500', 'text-white');
        loginTabBtn.classList.add('border-transparent', 'text-slate-400');
        regTabBtn.setAttribute('aria-selected', 'true');
        loginTabBtn.setAttribute('aria-selected', 'false');
        if (modalTitle) modalTitle.innerHTML = '<span class="flex items-center gap-2"><span class="text-amber-400">✨</span> Join the Community</span>';
        if (modalSubtitle) modalSubtitle.textContent = 'Create your account and start connecting with coaches';
    } else {
        loginForm.classList.remove('hidden');
        registerForm.classList.add('hidden');
        loginTabBtn.classList.add('border-teal-500', 'text-white');
        loginTabBtn.classList.remove('border-transparent', 'text-slate-400');
        regTabBtn.classList.remove('border-teal-500', 'text-white');
        regTabBtn.classList.add('border-transparent', 'text-slate-400');
        loginTabBtn.setAttribute('aria-selected', 'true');
        regTabBtn.setAttribute('aria-selected', 'false');
        if (modalTitle) modalTitle.textContent = 'Login';
        if (modalSubtitle) modalSubtitle.textContent = 'Welcome back — log in to connect with your coaches';
    }
}

function showRegError(msg) {
    var el = document.getElementById('reg-error-feedback');
    if (el) { el.textContent = msg; el.classList.remove('hidden'); }
}
function hideRegError() {
    var el = document.getElementById('reg-error-feedback');
    if (el) { el.classList.add('hidden'); el.textContent = ''; }
}

function compressImage(file, maxDimension, quality, callback) {
    var reader = new FileReader();
    reader.onload = function(e) {
        var img = new Image();
        img.onload = function() {
            var canvas = document.createElement('canvas');
            var w = img.width, h = img.height;
            if (w > maxDimension || h > maxDimension) {
                var ratio = Math.min(maxDimension / w, maxDimension / h);
                w *= ratio; h *= ratio;
            }
            canvas.width = w; canvas.height = h;
            var ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, w, h);
            callback(canvas.toDataURL('image/jpeg', quality));
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

const runAppInit = () => {
    document.body.classList.add('loaded');
    if (window.lucide) lucide.createIcons();

    loadComponent('header-placeholder', 'components/header.html');
    loadComponent('footer-placeholder', 'components/footer.html');
    loadComponent('mobile-tab-bar-placeholder', 'components/mobile-tab-bar.html');
    loadComponent('messaging-placeholder', 'components/messaging.html');
    loadComponent('profile-placeholder', 'components/profile.html');
    loadComponent('coach-profile-placeholder', 'components/coach-profile.html');

    var urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('view') === 'explore') {
        window.history.replaceState({}, '', window.location.pathname);
        setTimeout(() => { switchMobileView('explore'); setActiveTab('explore'); }, 500);
    }
    if (urlParams.get('modal') === 'login') {
        window.history.replaceState({}, '', window.location.pathname);
        setTimeout(() => { showLoginModal(); }, 500);
    }

    document.addEventListener('click', (e) => {
        if (e.target.id === 'tab-register-btn') {
            e.preventDefault();
            switchModalTab('register');
        }
        if (e.target.id === 'tab-login-btn') {
            e.preventDefault();
            switchModalTab('login');
        }
    });

    document.addEventListener('click', (e) => {
        if (e.target.id === 'dropdown-profile-link') {
            e.preventDefault();
            document.getElementById('profile-dropdown')?.classList.add('hidden');
            showProfileView();
        }
        if (e.target.id === 'dropdown-logout-link') {
            e.preventDefault();
            document.getElementById('profile-dropdown')?.classList.add('hidden');
            AuthService.logout();
        }
        if (e.target.id === 'dropdown-login-link') {
            e.preventDefault();
            document.getElementById('profile-dropdown')?.classList.add('hidden');
            const modal = document.getElementById('coach-modal');
            if (modal) {
                modal.classList.remove('hidden');
                document.body.classList.add('overflow-hidden');
                switchModalTab('login');
            }
        }
    });

    document.addEventListener('submit', async (e) => {
        if (e.target.id === 'register-form') {
            e.preventDefault();
            hideRegError();

            var pass = document.getElementById('reg-password').value;
            var confirmPass = document.getElementById('reg-confirm-password').value;

            if (pass !== confirmPass) {
                showRegError('Passwords do not match.');
                return;
            }

            var nickname = document.getElementById('reg-nickname').value.trim();
            var email = document.getElementById('reg-email').value.trim();

            if (!nickname) { showRegError('Username is required.'); return; }
            if (!email) { showRegError('Email is required.'); return; }
            if (!pass) { showRegError('Password is required.'); return; }
            if (pass.length < 8) { showRegError('Password must be at least 8 characters.'); return; }

            var previewImg = document.querySelector('#modal-previews-container img');
            var avatarSrc = previewImg ? previewImg.src : '';
            var avatarBlob = null;

            var regData = {
                username: nickname,
                email: email,
                password: pass,
                is_coach: false,
            };

            if (avatarSrc && avatarSrc.startsWith('data:')) {
                avatarBlob = dataURItoBlob(avatarSrc);
            }

            try {
                var result = await AuthService.register(regData);
                if (!result || !result.success) {
                    showRegError((result && result.error) || 'Registration failed');
                    return;
                }
            } catch (err) {
                console.error('Customer registration error:', err);
                showRegError('Registration error. Please try again.');
                return;
            }

            document.getElementById('coach-modal').classList.add('hidden');
            document.body.classList.remove('overflow-hidden');
            e.target.reset();
            var pc = document.getElementById('modal-previews-container');
            if (pc) pc.innerHTML = '';

            try {
                var loginResult = await AuthService.login(nickname, pass);
                if (loginResult && loginResult.success) {
                    if (avatarBlob) {
                        var picRes = await api.uploadProfilePicture(avatarBlob);
                        if (picRes.success) {
                            var auth = JSON.parse(sessionStorage.getItem('mocoach_auth'));
                            auth.avatar = picRes.data.profile_pic || '';
                            sessionStorage.setItem('mocoach_auth', JSON.stringify(auth));
                        }
                    }
                    updateHeaderProfilePic();
                    if (window.ProfileApp) window.ProfileApp.init();
                    showProfileView();
                }
            } catch (err) {
                console.error('Auto-login after registration error:', err);
            }
        }
    });

    document.addEventListener('submit', async (e) => {
        if (e.target.id === 'login-form') {
            e.preventDefault();
            const identity = document.getElementById('login-identity').value.trim();
            const pass = document.getElementById('login-password').value;
            const errorDiv = document.getElementById('login-error-feedback');

            const result = await AuthService.login(identity, pass);

            if (result.success) {
                if (errorDiv) errorDiv.classList.add('hidden');
                document.getElementById('coach-modal').classList.add('hidden');
                document.body.classList.remove('overflow-hidden');
                e.target.reset();

                updateHeaderProfilePic();

                if (result.role === 'admin') {
                    window.location.href = 'admin.html';
                    return;
                }

                if (result.role === 'coach') {
                    if (window.CoachProfileApp) {
                        showCoachProfileView(result.user.userId);
                    } else {
                        showProfileView();
                    }
                } else {
                    if (window.ProfileApp) window.ProfileApp.init();
                    showProfileView();
                }

                const pending = window.__pendingCoachId;
                if (pending) {
                    window.__pendingCoachId = null;
                    if (window.ChatApp) ChatApp.open(pending);
                }
            } else {
                if (errorDiv) {
                    errorDiv.textContent = "Incorrect Username/Email or Password.";
                    errorDiv.classList.remove('hidden');
                }
            }
        }
    });

    window.addEventListener('scroll', () => {
        const header = document.querySelector('header');
        if (header) {
            if (window.scrollY > 20) {
                header.classList.remove('bg-slate-950', 'border-slate-900/20');
                header.classList.add('bg-slate-950/70', 'backdrop-blur-md', 'border-slate-900/40', 'shadow-lg');
            } else {
                header.classList.remove('bg-slate-950/70', 'backdrop-blur-md', 'border-slate-900/40', 'shadow-lg');
                header.classList.add('bg-slate-950', 'border-slate-900/20');
            }
        }
    });

    const seeAllBtn = document.getElementById('see-all-coaches');
    const searchInput = document.getElementById('search-input');

    attachSearchAutocomplete('hero-search-input');
    attachSearchAutocomplete('search-input');

    if (searchInput) {
        searchInput.addEventListener('input', () => {
            const raw = searchInput.value.toLowerCase().trim();
            if (typeof categoryPrefill !== 'undefined' && categoryPrefill) {
                categoryPrefill = false;
            } else if (raw.length > 0 && typeof activeCategoryFilter !== 'undefined') {
                activeCategoryFilter = '';
            }
            const categoryKws = (typeof activeCategoryFilter !== 'undefined' && activeCategoryFilter) ? activeCategoryFilter : '';
            const keywords = categoryKws.length > 0
                ? categoryKws.split(/,\s*/).filter(Boolean)
                : (raw.length > 0 ? raw.split(/,\s*/).filter(Boolean) : []);
            const grid = document.querySelector('#coach-carousel') || document.querySelector('#all-coaches-grid');
            if (!grid) return;
            var visibleCount = 0;
            grid.querySelectorAll('.coach-card').forEach(card => {
                const name = (card.getAttribute('data-name') || '').toLowerCase();
                const discipline = (card.getAttribute('data-discipline') || '').toLowerCase();
                const city = (card.getAttribute('data-city') || '').toLowerCase();
                const bio = (card.getAttribute('data-bio') || '').toLowerCase();
                const tags = (card.getAttribute('data-tags') || '').toLowerCase();
                const match = keywords.length === 0 || keywords.some(function(kw) {
                    return name.includes(kw) || discipline.includes(kw) || city.includes(kw) || bio.includes(kw) || tags.includes(kw);
                });
                card.style.display = match ? 'flex' : 'none';
                if (match) visibleCount++;
            });
            var noResults = document.getElementById('no-results');
            if (noResults) {
                noResults.classList.toggle('visible', keywords.length > 0 && visibleCount === 0);
                noResults.classList.toggle('hidden', !(keywords.length > 0 && visibleCount === 0));
            }
        });

        searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                const query = searchInput.value.trim();
                if (!query) return;
                if (!window.location.pathname.includes('all-coaches.html')) {
                    e.preventDefault();
                    window.location.href = 'all-coaches.html?q=' + encodeURIComponent(query);
                }
            }
        });
    }

    if (seeAllBtn) {
        seeAllBtn.addEventListener('click', () => {
            const searchInput = document.getElementById('search-input');
            const query = searchInput ? searchInput.value.trim() : '';
            if (query) {
                window.location.href = 'all-coaches.html?q=' + encodeURIComponent(query);
            } else {
                window.location.href = 'all-coaches.html';
            }
        });
    }

    var backToTop = document.getElementById('back-to-top');
    if (backToTop) {
        window.addEventListener('scroll', function() {
            backToTop.classList.toggle('visible', window.scrollY > 400);
        });
        backToTop.addEventListener('click', function() {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    document.addEventListener('click', (e) => {
        const btn = e.target.closest('#profile-btn');
        const dropdown = document.getElementById('profile-dropdown');

        if (btn) {
            e.preventDefault();
            e.stopPropagation();
            if (dropdown) {
                var isOpen = !dropdown.classList.contains('hidden');
                dropdown.classList.toggle('hidden');
                btn.setAttribute('aria-expanded', !isOpen);
            }
        } else if (dropdown && !e.target.closest('#profile-dropdown')) {
            dropdown.classList.add('hidden');
            var pb = document.getElementById('profile-btn');
            if (pb) pb.setAttribute('aria-expanded', 'false');
        }
    });

    document.addEventListener('click', (e) => {
        const btn = e.target.closest('#profile-back-btn');
        if (btn) {
            e.preventDefault();
            showMainView();
        }
    });

    document.addEventListener('click', (e) => {
        const btn = e.target.closest('#become-coach-btn');
        if (btn) {
            e.preventDefault();
            window.location.href = 'coach-register.html';
        }
    });

    document.addEventListener('click', (e) => {
        const toggle = e.target.closest('.role-toggle-btn');
        if (toggle) {
            e.preventDefault();
            var group = toggle.closest('.role-group');
            var menu = group.querySelector('.role-submenu');
            var chevron = toggle.querySelector('[data-lucide="chevron-down"]');
            var isOpen = !menu.classList.contains('hidden');

            document.querySelectorAll('.role-submenu').forEach(function(m) {
                if (m !== menu) m.classList.add('hidden');
            });
            document.querySelectorAll('.role-toggle-btn').forEach(function(b) {
                var c = b.querySelector('[data-lucide="chevron-down"]');
                if (c && c !== chevron) c.style.transform = '';
                b.setAttribute('aria-expanded', 'false');
            });

            if (isOpen) {
                menu.classList.add('hidden');
                if (chevron) chevron.style.transform = '';
                toggle.setAttribute('aria-expanded', 'false');
            } else {
                menu.classList.remove('hidden');
                if (chevron) chevron.style.transform = 'rotate(180deg)';
                toggle.setAttribute('aria-expanded', 'true');
            }
        }
    });

    document.addEventListener('click', function(e) {
        var option = e.target.closest('.sub-option');
        if (!option) return;
        e.preventDefault();

        var action = option.getAttribute('data-action');

        document.querySelectorAll('.role-submenu').forEach(function(m) { m.classList.add('hidden'); });
        document.querySelectorAll('.role-toggle-btn').forEach(function(b) {
            var c = b.querySelector('[data-lucide="chevron-down"]');
            if (c) c.style.transform = '';
            b.setAttribute('aria-expanded', 'false');
        });

        if (action === 'explore') {
            var isMobile = window.innerWidth <= 768;
            if (isMobile && typeof switchMobileView === 'function') {
                switchMobileView('explore');
            } else {
                var el = document.getElementById('explore');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
            }
        } else if (action === 'register') {
            showRegisterModal();
        } else if (action === 'how-it-works') {
            window.location.href = 'coach-landing.html';
        } else if (action === 'coach-register') {
            window.location.href = 'coach-register.html';
        }
    });

    document.addEventListener('click', function(e) {
        if (!e.target.closest('.role-group')) {
            document.querySelectorAll('.role-submenu').forEach(function(m) { m.classList.add('hidden'); });
            document.querySelectorAll('.role-toggle-btn').forEach(function(b) {
                var c = b.querySelector('[data-lucide="chevron-down"]');
                if (c) c.style.transform = '';
                b.setAttribute('aria-expanded', 'false');
            });
        }
    });

    document.addEventListener('click', (e) => {
        const card = e.target.closest('.coach-card');
        const contactBtn = e.target.closest('button[onclick*="ChatApp.open"], button.cp-contact-btn');
        if (card && !contactBtn) {
            const coachId = card.getAttribute('data-coach-id');
            if (coachId) {
                e.preventDefault();
                showCoachProfileView(parseInt(coachId));
            }
        }
    });

    document.addEventListener('click', (e) => {
        const closeBtn = e.target.closest('.mobile-overlay-close');
        if (closeBtn) {
            const overlay = closeBtn.closest('[id^="mobile-overlay-"]');
            if (overlay) {
                var name = overlay.id.replace('mobile-overlay-', '');
                closeMobileOverlay(name);
            }
        }
    });

    document.addEventListener('click', (e) => {
        const link = e.target.closest('a[href]');
        if (!link) return;
        const href = link.getAttribute('href');

        if (href === '#' && link.closest('header') && !link.closest('nav') && link.querySelector('img')) {
            e.preventDefault();
            handleHomeNavigation();
            return;
        }

        if (href === '#' && link.closest('nav')) {
            e.preventDefault();
            handleHomeNavigation();
            return;
        }

        if (href && href.startsWith('#') && href.length > 1 && link.closest('nav')) {
            if (window.location.pathname.includes('all-coaches.html')) {
                e.preventDefault();
                window.location.href = 'index.html' + href;
            }
            return;
        }

        if (href === '#' && link.closest('footer')) {
            e.preventDefault();
            showToast('Coming soon');
        }
    });
};

function dataURItoBlob(dataURI) {
    var byteString = atob(dataURI.split(',')[1]);
    var mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];
    var ab = new ArrayBuffer(byteString.length);
    var ia = new Uint8Array(ab);
    for (var i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
    }
    return new Blob([ab], { type: mimeString });
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', runAppInit);
} else {
    runAppInit();
}
