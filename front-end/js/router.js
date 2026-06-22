const PAGES = {
    "": "home",
    "#": "home",
    "#home": "home",
    "#profile": "profile",
    "#inbox": "inbox",
    "#apply": "apply",
};

const PAGE_IDS = {
    home: "page-home",
    profile: "page-profile",
    inbox: "page-inbox",
    apply: "page-apply",
};

function navigateTo(hash) {
    window.location.hash = hash;
}

function getCurrentPage() {
    const hash = window.location.hash.toLowerCase();
    return PAGES[hash] || "home";
}

function showPage(pageName) {
    document.querySelectorAll(".page-section").forEach(el => {
        el.classList.add("hidden");
    });
    const target = document.getElementById(PAGE_IDS[pageName]);
    if (target) {
        target.classList.remove("hidden");
    }
    const coachView = document.getElementById("page-coach-view");
    if (coachView) {
        coachView.classList.add("hidden");
    }
    document.documentElement.scrollTop = 0;
}

function showCoachView(coachId) {
    document.querySelectorAll(".page-section").forEach(el => {
        el.classList.add("hidden");
    });
    const coachView = document.getElementById("page-coach-view");
    if (coachView) {
        coachView.classList.remove("hidden");
        coachView.dataset.coachId = coachId;
        if (typeof loadCoachView === "function") {
            loadCoachView(coachId);
        }
    }
    document.documentElement.scrollTop = 0;
}

function handleRouteChange() {
    const page = getCurrentPage();
    const hash = window.location.hash;

    const coachMatch = hash.match(/^#coach\/(\d+)$/);
    if (coachMatch) {
        showCoachView(parseInt(coachMatch[1]));
        return;
    }

    if (PAGES[hash] === "profile" || PAGES[hash] === "inbox") {
        if (!isAuthenticated()) {
            requireAuth(hash);
            showPage("home");
            return;
        }
    }

    showPage(page);

    if (page === "profile" && typeof loadProfile === "function") {
        loadProfile();
    }
    if (page === "inbox" && typeof loadInbox === "function") {
        loadInbox();
    }
    if (page === "apply" && typeof initApplyPage === "function") {
        initApplyPage();
    }
}

function initRouter() {
    window.addEventListener("hashchange", handleRouteChange);
    handleRouteChange();
}

document.addEventListener("DOMContentLoaded", () => {
    if (typeof authScriptLoaded === "undefined") {
        const script = document.createElement("script");
        script.src = "js/auth.js";
        document.head.appendChild(script);
    }
});
