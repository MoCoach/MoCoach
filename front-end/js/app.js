let coachNameMap = {};
let currentCoachViewId = null;

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

async function loadCoachMap() {
    try {
        const res = await fetch('/api/coaches');
        const coaches = await res.json();
        coaches.forEach(c => {
            coachNameMap[c.name.toLowerCase()] = c.id;
        });
    } catch (e) {
        console.error('Failed to load coach map:', e);
    }
}

async function loadCoachView(coachId) {
    currentCoachViewId = coachId;
    const container = document.getElementById("coach-view-content");
    if (!container) return;
    try {
        const res = await fetch(`/api/coaches/${coachId}`);
        if (!res.ok) {
            container.innerHTML = "<p class='text-red-400 text-center py-8'>Coach not found.</p>";
            return;
        }
        const coach = await res.json();
        container.innerHTML = `
            <div class="flex flex-col md:flex-row gap-8">
                <div class="md:w-1/3">
                    ${coach.profile_photo
                        ? `<img src="${coach.profile_photo}" alt="${coach.name}" class="w-full rounded-2xl object-cover h-64">`
                        : `<div class="w-full h-64 rounded-2xl bg-slate-800 flex items-center justify-center text-slate-500"><i data-lucide="user" class="w-16 h-16"></i></div>`
                    }
                </div>
                <div class="md:w-2/3">
                    <div class="flex items-center space-x-3 mb-2">
                        <h2 class="text-3xl font-extrabold text-white">${coach.name}</h2>
                        <span class="inline-flex items-center px-2 py-1 rounded bg-blue-600/10 text-blue-400 border border-blue-500/20 text-xs font-bold">VERIFIED</span>
                    </div>
                    ${coach.nickname ? `<p class="text-slate-400 text-sm mb-1">@${coach.nickname}</p>` : ""}
                    <p class="text-emerald-400 font-bold text-lg mb-4">Rs ${coach.coach?.price_per_hour || "—"}/hr</p>
                    <p class="text-slate-300 leading-relaxed mb-6">${coach.coach?.description || "No bio available."}</p>
                    <div class="flex flex-wrap gap-2 mb-6">
                        ${(coach.coach?.tags || []).map(t => `
                            <span class="bg-slate-800 text-slate-300 text-xs font-bold px-3 py-1.5 rounded-full">${t.name}</span>
                        `).join("")}
                    </div>
                    <button onclick="startChatWithCoach(${coach.id})" class="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-bold transition flex items-center space-x-2">
                        <i data-lucide="message-square" class="w-5 h-5"></i>
                        <span>Contact</span>
                    </button>
                </div>
            </div>
            <div class="mt-8 pt-8 border-t border-slate-800">
                <h3 class="text-xl font-bold text-white mb-4">Badges</h3>
                <div id="coach-badges"><div class="text-slate-400 text-sm">Loading badges...</div></div>
            </div>
        `;
        const badgesRes = await fetch(`/api/badges/user/${coachId}`);
        if (badgesRes.ok) {
            const badges = await badgesRes.json();
            const badgesEl = document.getElementById("coach-badges");
            if (badges.length === 0) {
                badgesEl.innerHTML = "<p class='text-slate-400 text-sm'>No badges yet.</p>";
            } else {
                badgesEl.innerHTML = `<div class="flex flex-wrap gap-3">${badges.map(b => `
                    <div class="bg-slate-950 rounded-xl p-3 border border-slate-800 text-center min-w-[100px]">
                        <div class="text-xl mb-1">${b.icon || "🏅"}</div>
                        <div class="text-white font-bold text-xs">${b.name}</div>
                    </div>
                `).join("")}</div>`;
            }
        }
        if (window.lucide) lucide.createIcons();
    } catch (e) {
        container.innerHTML = "<p class='text-red-400 text-center py-8'>Error loading coach profile.</p>";
    }
}

async function startChatWithCoach(coachId) {
    if (!isAuthenticated()) {
        requireAuth(`#coach/${coachId}`);
        return;
    }
    try {
        const res = await authFetch("/api/chats", {
            method: "POST",
            body: JSON.stringify({ coach_id: coachId }),
        });
        if (res.ok) {
            navigateTo("inbox");
        }
    } catch (e) {}
}

async function findCoachIdByName(name) {
    const key = name.toLowerCase();
    if (coachNameMap[key]) return coachNameMap[key];
    await loadCoachMap();
    return coachNameMap[key] || null;
}

document.addEventListener('DOMContentLoaded', () => {
    if (window.lucide) {
        lucide.createIcons();
    }

    loadComponent('header-placeholder', 'components/header.html').then(() => {
        updateHeaderAuth();
        if (window.lucide) lucide.createIcons();
    });
    loadComponent('footer-placeholder', 'components/footer.html');

    loadComponent('auth-modal-placeholder', 'components/modals/auth.html').then(() => {
        if (window.lucide) lucide.createIcons();
    });

    loadComponent('page-profile-placeholder', 'components/pages/profile.html');
    loadComponent('page-inbox-placeholder', 'components/pages/inbox.html');
    loadComponent('page-apply-placeholder', 'components/pages/apply.html');
    loadComponent('page-coach-view-placeholder', 'components/pages/coach-view.html');

    loadCoachMap();
    initRouter();

    const carousel = document.getElementById('coach-carousel');
    const btnLeft = document.getElementById('slide-left');
    const btnRight = document.getElementById('slide-right');

    if (carousel && btnLeft && btnRight) {
        const scrollOffset = 380;
        btnLeft.addEventListener('click', () => carousel.scrollBy({ left: -scrollOffset, behavior: 'smooth' }));
        btnRight.addEventListener('click', () => carousel.scrollBy({ left: scrollOffset, behavior: 'smooth' }));
    }

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

    document.querySelectorAll('.scroll-to-explore').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            navigateTo('home');
            setTimeout(() => {
                document.getElementById('explore')?.scrollIntoView({ behavior: 'smooth' });
            }, 100);
        });
    });

    document.addEventListener('click', async (e) => {
        const btn = e.target.closest('.contact-coach-btn');
        if (!btn) return;
        e.preventDefault();
        const card = btn.closest('.coach-card');
        if (!card) return;
        const name = card.getAttribute('data-name');
        const coachId = await findCoachIdByName(name);
        if (!coachId) {
            console.error('Coach not found:', name);
            return;
        }
        if (!isAuthenticated()) {
            requireAuth(`#coach/${coachId}`);
        } else {
            if (typeof startChatWithCoach === 'function') {
                startChatWithCoach(coachId);
            }
        }
    });

    document.querySelectorAll('.become-coach-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            navigateTo('apply');
        });
    });
});
