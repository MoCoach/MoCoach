async function loadComponent(id, url) {
    const element = document.getElementById(id);
    if (element) {
        try {
            const response = await fetch(url);
            const html = await response.text();
            element.innerHTML = html;
            if (window.lucide) {
                lucide.createIcons();
            }
            // Met à jour la photo de profil du Header dès que celui-ci est chargé
            if (id === 'header-placeholder') {
                updateHeaderProfilePic();
            }
        } catch (error) {
            console.error('Component loading error:', error);
        }
    }
}

let currentView = 'home';

function showMainView() {
    currentView = 'home';
    const main = document.querySelector('main');
    const profile = document.getElementById('profile-view');
    const footer = document.getElementById('footer-placeholder'); // Cible l'élément footer
    
    if (main) main.classList.remove('hidden');
    if (profile) profile.classList.add('hidden');
    if (footer) footer.classList.remove('hidden'); // Affiche le footer sur la page d'accueil
    
    document.body.classList.remove('overflow-hidden');
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function showProfileView() {
    currentView = 'profile';
    const main = document.querySelector('main');
    const profile = document.getElementById('profile-view');
    const footer = document.getElementById('footer-placeholder'); // Cible l'élément footer
    
    if (main) main.classList.add('hidden');
    if (profile) profile.classList.remove('hidden');
    if (footer) footer.classList.add('hidden'); // Masque le footer sur la vue profil
    
    window.scrollTo({ top: 0 });
}

window.showMainView = showMainView;
window.showProfileView = showProfileView;

// Gère le remplacement de l'icône par l'image de profil dans le Header (Accueil)
function updateHeaderProfilePic() {
    const btn = document.getElementById('profile-btn');
    const dropdown = document.getElementById('profile-dropdown');
    if (!btn) return;
    
    const savedUser = localStorage.getItem('mocoach_user');
    if (savedUser) {
        const user = JSON.parse(savedUser);
        if (user && user.avatar) {
            btn.innerHTML = `<img src="${user.avatar}" class="w-full h-full object-cover rounded-full" alt="Profile">`;
        }
        if (dropdown) {
            dropdown.innerHTML = `
                <a href="#" id="dropdown-profile-link" class="block px-4 py-2 text-sm text-slate-300 hover:bg-slate-800 hover:text-white transition font-semibold">My Profile</a>
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

// Gère le basculement des onglets de Connexion / Inscription dans la Pop-up
function switchModalTab(tab) {
    const registerForm = document.getElementById('register-form');
    const loginForm = document.getElementById('login-form');
    const regTabBtn = document.getElementById('tab-register-btn');
    const loginTabBtn = document.getElementById('tab-login-btn');
    const modalTitle = document.getElementById('modal-title');

    if (!registerForm || !loginForm) return;

    if (tab === 'register') {
        registerForm.classList.remove('hidden');
        loginForm.classList.add('hidden');
        regTabBtn.classList.add('border-blue-500', 'text-white');
        regTabBtn.classList.remove('border-transparent', 'text-slate-400');
        loginTabBtn.classList.remove('border-blue-500', 'text-white');
        loginTabBtn.classList.add('border-transparent', 'text-slate-400');
        if (modalTitle) modalTitle.textContent = "Register";
    } else {
        loginForm.classList.remove('hidden');
        registerForm.classList.add('hidden');
        loginTabBtn.classList.add('border-blue-500', 'text-white');
        loginTabBtn.classList.remove('border-transparent', 'text-slate-400');
        regTabBtn.classList.remove('border-blue-500', 'text-white');
        regTabBtn.classList.add('border-transparent', 'text-slate-400');
        if (modalTitle) modalTitle.textContent = "Login";
    }
}

const runAppInit = () => {
    if (window.lucide) {
        lucide.createIcons();
    }

    // Chargement dynamique des composants asynchrones
    loadComponent('header-placeholder', 'components/header.html');
    loadComponent('footer-placeholder', 'components/footer.html');
    loadComponent('messaging-placeholder', 'components/messaging.html');
    loadComponent('profile-placeholder', 'components/profile.html');

    // Liaison des clics d'onglets de la pop-up
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

    // Événements de clic sur le dropdown d'en-tête du Header
    document.addEventListener('click', (e) => {
        if (e.target.id === 'dropdown-profile-link') {
            e.preventDefault();
            document.getElementById('profile-dropdown')?.classList.add('hidden'); // Ferme le menu après sélection
            showProfileView();
        }
        if (e.target.id === 'dropdown-logout-link') {
            e.preventDefault();
            document.getElementById('profile-dropdown')?.classList.add('hidden');
            if (window.ProfileApp) {
                window.ProfileApp.logout();
            } else {
                localStorage.removeItem('mocoach_user');
                window.location.reload();
            }
        }
        if (e.target.id === 'dropdown-login-link') {
            e.preventDefault();
            document.getElementById('profile-dropdown')?.classList.add('hidden'); // Ferme le menu
            const modal = document.getElementById('coach-modal');
            if (modal) {
                modal.classList.remove('hidden');
                document.body.classList.add('overflow-hidden');
                switchModalTab('login');
            }
        }
    });

    // ÉCOUTEUR FORMULAIRE D'INSCRIPTION (Contrôle de mot de passe)
    document.addEventListener('submit', (e) => {
        if (e.target.id === 'register-form') {
            e.preventDefault();
            const pass = document.getElementById('reg-password').value;
            const confirmPass = document.getElementById('reg-confirm-password').value;

            if (pass !== confirmPass) {
                alert("Error: Passwords do not match! Please try again.");
                return;
            }

            // Récupération de l'image sélectionnée comme profil (Base64)
            const selectedPreview = document.querySelector('#modal-previews-container .profile-selected img');
            const avatarSrc = selectedPreview ? selectedPreview.src : 'https://images.unsplash.com/photo-1637434071656-e4ecd2567e82?q=80&w=716&auto=format&fit=crop';

            // Création de l'objet utilisateur
            const newUser = {
                nickname: document.getElementById('reg-nickname').value.trim(),
                firstName: document.getElementById('reg-firstname').value.trim(),
                lastName: document.getElementById('reg-lastname').value.trim(),
                email: document.getElementById('reg-email').value.trim(),
                city: document.getElementById('reg-city').value.trim(),
                phone: '', // Initialement vide pour être édité sur le profil
                password: pass,
                avatar: avatarSrc,
                bio: document.getElementById('reg-bio').value.trim(), // Sauvegarde bien la bio à l'inscription
                badges: [
                    {
                        id: 'b1', icon: 'flame', title: 'Unparalleled Force',
                        description: 'Completed 20 strength training sessions and achieved a new personal record in deadlifts.',
                        coachId: 'coach-9', coachName: 'Kavir D.', dateEarned: '2026-05-15',
                    }
                ],
                badgesGiven: []
            };

            // Sauvegarde dans la session locale (localStorage)
            localStorage.setItem('mocoach_user', JSON.stringify(newUser));

            // Fermeture de la pop-up et reset du formulaire
            document.getElementById('coach-modal').classList.add('hidden');
            document.body.classList.remove('overflow-hidden');
            e.target.reset();
            document.getElementById('modal-previews-container').innerHTML = '';

            // Met à jour la photo de profil du Header à l'accueil
            updateHeaderProfilePic();

            // Initialise et rafraîchit le profil de façon instantanée avec les nouvelles données
            if (window.ProfileApp) {
                window.ProfileApp.init();
            }

            showProfileView();
        }
    });

    // ÉCOUTEUR FORMULAIRE DE CONNEXION (Reconnexion par Pseudo/E-mail et mot de passe)
    document.addEventListener('submit', (e) => {
        if (e.target.id === 'login-form') {
            e.preventDefault();
            const identity = document.getElementById('login-identity').value.trim();
            const pass = document.getElementById('login-password').value;
            const errorDiv = document.getElementById('login-error-feedback');

            // Récupère l'utilisateur enregistré localement
            const savedUser = JSON.parse(localStorage.getItem('mocoach_user'));

            if (savedUser && (savedUser.nickname === identity || savedUser.email === identity) && savedUser.password === pass) {
                // Connexion réussie
                if (errorDiv) errorDiv.classList.add('hidden');
                document.getElementById('coach-modal').classList.add('hidden');
                document.body.classList.remove('overflow-hidden');
                e.target.reset();

                // On rafraîchit l'avatar dans le header à l'accueil
                updateHeaderProfilePic();

                if (window.ProfileApp) {
                    window.ProfileApp.init();
                }

                showProfileView();
            } else {
                // Erreur de connexion
                if (errorDiv) {
                    errorDiv.textContent = "Incorrect Username/Email or Password.";
                    errorDiv.classList.remove('hidden');
                }
            }
        }
    });

    // Gestion de l'opacité et de l'effet flou du Header au défilement (Glassmorphism)
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

    // Configuration et défilement du carrousel de cartes de coachs
    const carousel = document.getElementById('coach-carousel');
    const btnLeft = document.getElementById('slide-left');
    const btnRight = document.getElementById('slide-right');

    if (carousel && btnLeft && btnRight) {
        const scrollOffset = 380;
        btnLeft.addEventListener('click', () => carousel.scrollBy({ left: -scrollOffset, behavior: 'smooth' }));
        btnRight.addEventListener('click', () => carousel.scrollBy({ left: scrollOffset, behavior: 'smooth' }));
    }

    // Filtrage et recherche de coach par nom ou par discipline
    const searchInput = document.getElementById('search-input');
    const coachCards = document.querySelectorAll('.coach-card');

    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase().trim();
            coachCards.forEach(card => {
                const name = card.getAttribute('data-name').toLowerCase();
                const discipline = card.getAttribute('data-discipline').toLowerCase();
                if (name.includes(query) || discipline.includes(query)) {
                    card.style.display = 'flex';
                } else {
                    card.style.display = 'none';
                }
            });
        });
    }

    // INTERACTION AU CLIC : Bascule l'affichage du menu déroulant et fermeture si clic extérieur
    document.addEventListener('click', (e) => {
        const btn = e.target.closest('#profile-btn');
        const dropdown = document.getElementById('profile-dropdown');
        
        if (btn) {
            e.preventDefault();
            e.stopPropagation(); // Évite la fermeture immédiate par l'écouteur global
            if (dropdown) {
                dropdown.classList.toggle('hidden');
            }
        } else if (dropdown && !e.target.closest('#profile-dropdown')) {
            // Clic effectué ailleurs sur la page : ferme le menu déroulant
            dropdown.classList.add('hidden');
        }
    });

    // Bouton "Back to Home" délégué pour garantir la redirection dans tous les cas de figure
    document.addEventListener('click', (e) => {
        const btn = e.target.closest('#profile-back-btn');
        if (btn) {
            e.preventDefault();
            showMainView();
        }
    });

    // Liaison du clic sur "Register as a Coach" pour ouvrir l'onglet d'inscription d'office
    document.addEventListener('click', (e) => {
        const btn = e.target.closest('#become-coach-btn');
        if (btn) {
            e.preventDefault();
            const modal = document.getElementById('coach-modal');
            if (modal) {
                modal.classList.remove('hidden');
                document.body.classList.add('overflow-hidden');
                switchModalTab('register'); // Ouvre d'office sur l'onglet d'inscription "S'inscrire"
            }
        }
    });

    // Home nav link (delegated)
    document.addEventListener('click', (e) => {
        const link = e.target.closest('nav a[href="#"]');
        if (link && currentView === 'profile') {
            e.preventDefault();
            showMainView();
        }
    });
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', runAppInit);
} else {
    runAppInit();
}