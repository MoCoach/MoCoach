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
            console.error('Erreur de chargement du composant:', error);
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    if (window.lucide) {
        lucide.createIcons();
    }

    loadComponent('header-placeholder', 'components/header.html');
    loadComponent('footer-placeholder', 'components/footer.html');

    // Carrousel
    const carousel = document.getElementById('coach-carousel');
    const btnLeft = document.getElementById('slide-left');
    const btnRight = document.getElementById('slide-right');

    if (carousel && btnLeft && btnRight) {
        const scrollOffset = 380;
        btnLeft.addEventListener('click', () => carousel.scrollBy({ left: -scrollOffset, behavior: 'smooth' }));
        btnRight.addEventListener('click', () => carousel.scrollBy({ left: scrollOffset, behavior: 'smooth' }));
    }

    // Recherche
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
});
