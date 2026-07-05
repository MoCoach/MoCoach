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
            }
        } catch (error) {
            console.error('Component loading error:', error);
        }
    }
}

let currentView = 'home';

const AuthService = {
    ADMIN_USERNAME: 'Admin1',
    ADMIN_PASSWORD: 'Admin123',

    login(identity, password) {
        if (identity === this.ADMIN_USERNAME && password === this.ADMIN_PASSWORD) {
            const session = { role: 'admin', username: 'Admin1', userId: 'admin-1' };
            sessionStorage.setItem('mocoach_auth', JSON.stringify(session));
            return { success: true, role: 'admin', user: session };
        }

        const coaches = JSON.parse(localStorage.getItem('mocoach_coaches') || '[]');
        const coach = coaches.find(c => (c.username === identity || c.email === identity) && c.password === password);
        if (coach) {
            const session = {
                role: 'coach', username: coach.username, userId: coach.username,
                firstName: coach.firstName, lastName: coach.lastName, email: coach.email,
                city: coach.city, avatar: coach.avatar || '', bio: coach.bio || '',
                tags: coach.tags || [], price: coach.price || '', discipline: coach.discipline || '',
                gallery: coach.gallery || [],
            };
            sessionStorage.setItem('mocoach_auth', JSON.stringify(session));
            return { success: true, role: 'coach', user: session };
        }

        const users = JSON.parse(localStorage.getItem('mocoach_users') || '[]');
        const user = users.find(u => (u.username === identity || u.email === identity) && u.password === password);
        if (user) {
            const session = { role: 'customer', username: user.username, userId: user.username, email: user.email, avatar: user.avatar || '' };
            sessionStorage.setItem('mocoach_auth', JSON.stringify(session));
            return { success: true, role: 'customer', user: session };
        }

        return { success: false };
    },

    register(data) {
        const users = JSON.parse(localStorage.getItem('mocoach_users') || '[]');
        if (users.some(u => u.username === data.username)) return { success: false, error: 'Username already taken' };
        if (users.some(u => u.email === data.email)) return { success: false, error: 'Email already registered' };
        users.push(data);
        localStorage.setItem('mocoach_users', JSON.stringify(users));
        return { success: true };
    },

    logout() {
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

    getAdminData() {
        try { return JSON.parse(localStorage.getItem('mocoach_admin_data') || '{"coaches":{},"customers":{}}'); }
        catch { return { coaches: {}, customers: {} }; }
    },

    isUserBlocked(userId, type) {
        const admin = this.getAdminData();
        if (type === 'coach') return !!(admin.coaches[userId] && admin.coaches[userId].is_blocked);
        return !!(admin.customers[userId] && admin.customers[userId].is_blocked);
    },

    isMessagingBlocked(userId, type) {
        const admin = this.getAdminData();
        if (type === 'coach') return !!(admin.coaches[userId] && admin.coaches[userId].messaging_blocked);
        return !!(admin.customers[userId] && admin.customers[userId].messaging_blocked);
    },
};

window.AuthService = AuthService;

function showMainView() {
    currentView = 'home';
    const main = document.querySelector('main');
    const profile = document.getElementById('profile-view');
    const coachView = document.getElementById('coach-profile-view');
    const footer = document.getElementById('footer-placeholder');

    if (main) main.classList.remove('hidden');
    if (profile) profile.classList.add('hidden');
    if (coachView) coachView.classList.add('hidden');
    if (footer) footer.classList.remove('hidden');

    document.body.classList.remove('overflow-hidden');
    window.scrollTo({ top: 0, behavior: 'smooth' });
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

function handleHomeNavigation() {
    if (window.location.pathname.includes('all-coaches.html')) {
        window.location.href = 'index.html';
    } else if (currentView === 'profile' || currentView === 'coach-profile') {
        showMainView();
    } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

function updateHeaderProfilePic() {
    const btn = document.getElementById('profile-btn');
    const dropdown = document.getElementById('profile-dropdown');
    if (!btn) return;

    const user = AuthService.getCurrentUser();

    if (user) {
        if (user.avatar) {
            btn.innerHTML = `<img src="${user.avatar}" class="w-full h-full object-cover rounded-full" alt="Profile">`;
        } else {
            btn.innerHTML = `<i data-lucide="user" class="w-6 h-6"></i>`;
            if (window.lucide) lucide.createIcons();
        }
        if (dropdown) {
            const roleLabel = user.role === 'admin' ? 'Admin Panel' : user.role === 'coach' ? 'My Coach Profile' : 'My Profile';
            const roleLink = user.role === 'admin' ? 'admin.html' : '#';
            dropdown.innerHTML = `
                <a href="${roleLink}" id="dropdown-profile-link" class="block px-4 py-2 text-sm text-slate-300 hover:bg-slate-800 hover:text-white transition font-semibold">${roleLabel}</a>
                <hr class="border-slate-800 my-1">
                <a href="#" id="dropdown-logout-link" class="block px-4 py-2 text-sm text-red-400 hover:bg-red-950/30 hover:text-red-300 transition font-bold">Logout</a>
            `;
        }
    } else {
        btn.innerHTML = `<i data-lucide="user" class="w-6 h-6"></i>`;
        if (window.lucide) lucide.createIcons();
        if (dropdown) {
            dropdown.innerHTML = `
                <a href="#" id="dropdown-login-link" class="block px-4 py-2 text-sm text-slate-300 hover:bg-slate-850 hover:text-white transition font-semibold">Login / Register</a>
            `;
        }
    }
}
window.updateHeaderProfilePic = updateHeaderProfilePic;

function switchModalTab(tab) {
    const registerForm = document.getElementById('register-form');
    const loginForm = document.getElementById('login-form');
    const regTabBtn = document.getElementById('tab-register-btn');
    const loginTabBtn = document.getElementById('tab-login-btn');
    const modalTitle = document.getElementById('modal-title');
    const modalSubtitle = document.getElementById('modal-subtitle');

    if (!registerForm || !loginForm) return;

    if (tab === 'register') {
        registerForm.classList.remove('hidden');
        loginForm.classList.add('hidden');
        regTabBtn.classList.add('border-blue-500', 'text-white');
        regTabBtn.classList.remove('border-transparent', 'text-slate-400');
        loginTabBtn.classList.remove('border-blue-500', 'text-white');
        loginTabBtn.classList.add('border-transparent', 'text-slate-400');
        if (modalTitle) modalTitle.innerHTML = '<span class="flex items-center gap-2"><span class="text-amber-400">✨</span> Join the Community</span>';
        if (modalSubtitle) modalSubtitle.textContent = 'Create your account and start connecting with coaches';
    } else {
        loginForm.classList.remove('hidden');
        registerForm.classList.add('hidden');
        loginTabBtn.classList.add('border-blue-500', 'text-white');
        loginTabBtn.classList.remove('border-transparent', 'text-slate-400');
        regTabBtn.classList.remove('border-blue-500', 'text-white');
        regTabBtn.classList.add('border-transparent', 'text-slate-400');
        if (modalTitle) modalTitle.textContent = 'Login';
        if (modalSubtitle) modalSubtitle.textContent = 'Welcome back — log in to connect with your coaches';
    }
}

const runAppInit = () => {
    if (window.lucide) lucide.createIcons();

    loadComponent('header-placeholder', 'components/header.html');
    loadComponent('footer-placeholder', 'components/footer.html');
    loadComponent('messaging-placeholder', 'components/messaging.html');
    loadComponent('profile-placeholder', 'components/profile.html');
    loadComponent('coach-profile-placeholder', 'components/coach-profile.html');

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

    document.addEventListener('submit', (e) => {
        if (e.target.id === 'register-form') {
            e.preventDefault();
            const pass = document.getElementById('reg-password').value;
            const confirmPass = document.getElementById('reg-confirm-password').value;

            if (pass !== confirmPass) {
                alert("Error: Passwords do not match! Please try again.");
                return;
            }

            const previewImg = document.querySelector('#modal-previews-container img');
            const avatarSrc = previewImg ? previewImg.src : '';

            const newUser = {
                username: document.getElementById('reg-nickname').value.trim(),
                email: document.getElementById('reg-email').value.trim(),
                password: pass,
                avatar: avatarSrc,
                role: 'customer',
            };

            const result = AuthService.register(newUser);
            if (!result.success) {
                alert(result.error || 'Registration failed');
                return;
            }

            document.getElementById('coach-modal').classList.add('hidden');
            document.body.classList.remove('overflow-hidden');
            e.target.reset();
            document.getElementById('modal-previews-container').innerHTML = '';

            const loginResult = AuthService.login(newUser.username, pass);
            if (loginResult.success) {
                updateHeaderProfilePic();
                if (window.ProfileApp) window.ProfileApp.init();
                showProfileView();
            }
        }
    });

    document.addEventListener('submit', (e) => {
        if (e.target.id === 'login-form') {
            e.preventDefault();
            const identity = document.getElementById('login-identity').value.trim();
            const pass = document.getElementById('login-password').value;
            const errorDiv = document.getElementById('login-error-feedback');

            const result = AuthService.login(identity, pass);

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

    if (searchInput) {
        searchInput.addEventListener('input', () => {
            const query = searchInput.value.toLowerCase().trim();
            const grid = document.querySelector('#coach-carousel') || document.querySelector('#all-coaches-grid');
            if (!grid) return;
            grid.querySelectorAll('.coach-card').forEach(card => {
                const name = (card.getAttribute('data-name') || '').toLowerCase();
                const discipline = (card.getAttribute('data-discipline') || '').toLowerCase();
                const city = (card.getAttribute('data-city') || '').toLowerCase();
                const bio = (card.getAttribute('data-bio') || '').toLowerCase();
                const tags = (card.getAttribute('data-tags') || '').toLowerCase();
                const match = name.includes(query) || discipline.includes(query) || city.includes(query) || bio.includes(query) || tags.includes(query);
                card.style.display = match ? 'flex' : 'none';
            });
        });
    }

    if (seeAllBtn) {
        seeAllBtn.addEventListener('click', () => {
            window.location.href = 'all-coaches.html';
        });
    }

    document.addEventListener('click', (e) => {
        const btn = e.target.closest('#profile-btn');
        const dropdown = document.getElementById('profile-dropdown');

        if (btn) {
            e.preventDefault();
            e.stopPropagation();
            if (dropdown) dropdown.classList.toggle('hidden');
        } else if (dropdown && !e.target.closest('#profile-dropdown')) {
            dropdown.classList.add('hidden');
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
        const card = e.target.closest('.coach-card');
        const contactBtn = e.target.closest('button[onclick*="ChatApp.open"], button.cp-contact-btn');
        if (card && !contactBtn) {
            const coachId = card.getAttribute('data-coach-id');
            if (coachId) {
                e.preventDefault();
                showCoachProfileView(coachId);
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

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', runAppInit);
} else {
    runAppInit();
}
