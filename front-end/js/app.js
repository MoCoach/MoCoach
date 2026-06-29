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
    if (main) main.classList.remove('hidden');
    if (profile) profile.classList.add('hidden');
    document.body.classList.remove('overflow-hidden');
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function showProfileView() {
    currentView = 'profile';
    const main = document.querySelector('main');
    const profile = document.getElementById('profile-view');
    if (main) main.classList.add('hidden');
    if (profile) profile.classList.remove('hidden');
    window.scrollTo({ top: 0 });
}

window.showMainView = showMainView;
window.showProfileView = showProfileView;

document.addEventListener('DOMContentLoaded', () => {
    if (window.lucide) {
        lucide.createIcons();
    }

    // Loading asynchronous components
    loadComponent('header-placeholder', 'components/header.html');
    loadComponent('footer-placeholder', 'components/footer.html');
    loadComponent('messaging-placeholder', 'components/messaging.html');
    loadComponent('profile-placeholder', 'components/profile.html');

    // Dynamic header transparency management on scroll
    window.addEventListener('scroll', () => {
        const header = document.querySelector('header');
        if (header) {
            if (window.scrollY > 20) {
                // Scroll effect (Glassmorphism: transparent blue/slate background with blur)
                header.classList.remove('bg-slate-950', 'border-slate-900/20');
                header.classList.add('bg-slate-950/70', 'backdrop-blur-md', 'border-slate-900/40', 'shadow-lg');
            } else {
                // Initial state at the very top of the page (Opaque and solid)
                header.classList.remove('bg-slate-950/70', 'backdrop-blur-md', 'border-slate-900/40', 'shadow-lg');
                header.classList.add('bg-slate-950', 'border-slate-900/20');
            }
        }
    });

    // Carousel
    const carousel = document.getElementById('coach-carousel');
    const btnLeft = document.getElementById('slide-left');
    const btnRight = document.getElementById('slide-right');

    if (carousel && btnLeft && btnRight) {
        const scrollOffset = 380;
        btnLeft.addEventListener('click', () => carousel.scrollBy({ left: -scrollOffset, behavior: 'smooth' }));
        btnRight.addEventListener('click', () => carousel.scrollBy({ left: scrollOffset, behavior: 'smooth' }));
    }

    // Search
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

    // Profile button (delegated because header loads async)
    document.addEventListener('click', (e) => {
        const btn = e.target.closest('#profile-btn');
        if (btn) {
            e.preventDefault();
            showProfileView();
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
});
