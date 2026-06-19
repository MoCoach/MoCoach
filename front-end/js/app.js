// 1. Fonction pour charger les composants HTML (Header/Footer)
async function loadComponent(id, url) {
    const element = document.getElementById(id);
    if (element) {
        try {
            const response = await fetch(url);
            const html = await response.text();
            element.innerHTML = html;
            
            // On recharge les icônes Lucide car de nouveaux éléments HTML viennent d'arriver
            if (window.lucide) {
                lucide.createIcons();
            }
        } catch (error) {
            console.error('Erreur lors du chargement du composant:', error);
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    // 2. Initialisation des icônes de la page principale
    if (window.lucide) {
        lucide.createIcons();
    }

    // 3. Charger le Header et le Footer dynamiquement
    loadComponent('header-placeholder', 'components/header.html');
    loadComponent('footer-placeholder', 'components/footer.html');

    // 4. Logique du Carrousel
    const carousel = document.getElementById('coach-carousel');
    const btnLeft = document.getElementById('slide-left');
    const btnRight = document.getElementById('slide-right');

    if (carousel && btnLeft && btnRight) {
        const scrollOffset = 380;
        btnLeft.addEventListener('click', () => carousel.scrollBy({ left: -scrollOffset, behavior: 'smooth' }));
        btnRight.addEventListener('click', () => carousel.scrollBy({ left: scrollOffset, behavior: 'smooth' }));
    }

    // 5. Logique de Recherche
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
