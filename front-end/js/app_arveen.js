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
    const coachProfile = document.getElementById('coach-profile-view');
    const footer = document.getElementById('footer-placeholder');
    if (main) main.classList.remove('hidden');
    if (profile) profile.classList.add('hidden');
    if (coachProfile) coachProfile.classList.add('hidden');
    if (footer) footer.classList.remove('hidden');
    document.body.classList.remove('overflow-hidden');
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function showProfileView() {
    currentView = 'profile';
    const main = document.querySelector('main');
    const profile = document.getElementById('profile-view');
    const coachProfile = document.getElementById('coach-profile-view');
    const footer = document.getElementById('footer-placeholder');
    if (main) main.classList.add('hidden');
    if (profile) profile.classList.remove('hidden');
    if (coachProfile) coachProfile.classList.add('hidden');
    if (footer) footer.classList.add('hidden');
    window.scrollTo({ top: 0 });
}

window.showMainView = showMainView;
window.showProfileView = showProfileView;

function showCoachProfileView(coachId) {
    currentView = 'coach-profile';
    if (window.CoachProfileApp) {
        CoachProfileApp.open(coachId);
    }
}

window.showCoachProfileView = showCoachProfileView;

document.addEventListener('DOMContentLoaded', () => {
    if (window.lucide) {
        lucide.createIcons();
    }

    // Chargement dynamique des composants asynchrones
    loadComponent('header-placeholder', 'components/header.html');
    loadComponent('footer-placeholder', 'components/footer.html');
    loadComponent('messaging-placeholder', 'components/messaging.html');
    loadComponent('profile-placeholder', 'components/profile.html');
    loadComponent('coach-profile-placeholder', 'components/coach-profile.html');

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

    // Gestion déléguée du clic sur le bouton profil
    document.addEventListener('click', (e) => {
        const btn = e.target.closest('#profile-btn');
        if (btn) {
            e.preventDefault();
            showProfileView();
        }
    });

    // Gestion déléguée du lien d'accueil de la navigation
    document.addEventListener('click', (e) => {
        const link = e.target.closest('nav a[href="#"]');
        if (link && currentView === 'profile') {
            e.preventDefault();
            showMainView();
        }
    });

    // Coach card click (delegated) - open coach profile unless Contact button was clicked
    document.addEventListener('click', (e) => {
        const card = e.target.closest('.coach-card');
        const contactBtn = e.target.closest('button[onclick*="ChatApp.open"]');
        if (card && !contactBtn) {
            const coachId = card.getAttribute('data-coach-id');
            if (coachId) {
                e.preventDefault();
                showCoachProfileView(coachId);
            }
        }
    });

    // Re-delegate home link for coach-profile view
    document.addEventListener('click', (e) => {
        const link = e.target.closest('nav a[href="#"]');
        if (link && currentView === 'coach-profile') {
            e.preventDefault();
            showMainView();
        }
    });
});
