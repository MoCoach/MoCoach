// Initialize Lucide Icons
lucide.createIcons();

// INTERACTIVE CAROUSEL SLIDE CONTROLS
const carousel = document.getElementById('coach-carousel');
const btnLeft = document.getElementById('slide-left');
const btnRight = document.getElementById('slide-right');

if (carousel && btnLeft && btnRight) {
  const scrollOffset = 380; // Card width + gap

  btnLeft.addEventListener('click', () => {
    carousel.scrollBy({
      left: -scrollOffset,
      behavior: 'smooth'
    });
  });

  btnRight.addEventListener('click', () => {
    carousel.scrollBy({
      left: scrollOffset,
      behavior: 'smooth'
    });
  });
}

// SEARCH & FILTERING LOGIC
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
