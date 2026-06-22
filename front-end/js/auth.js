const API_BASE = window.location.origin;

let authModalVisible = false;
let postAuthRedirect = null;

function getToken() {
    return localStorage.getItem("mocoach_token");
}

function getUser() {
    const raw = localStorage.getItem("mocoach_user");
    return raw ? JSON.parse(raw) : null;
}

function setAuth(token, user) {
    localStorage.setItem("mocoach_token", token);
    localStorage.setItem("mocoach_user", JSON.stringify(user));
    updateHeaderAuth();
    closeAuthModal();
}

function clearAuth() {
    localStorage.removeItem("mocoach_token");
    localStorage.removeItem("mocoach_user");
    updateHeaderAuth();
}

function isAuthenticated() {
    return !!getToken();
}

function requireAuth(redirectAfter) {
    if (!isAuthenticated()) {
        postAuthRedirect = redirectAfter || window.location.hash || "/";
        showAuthModal();
        return false;
    }
    return true;
}

function authFetch(url, options = {}) {
    const token = getToken();
    const headers = { "Content-Type": "application/json", ...options.headers };
    if (token) {
        headers["Authorization"] = `Bearer ${token}`;
    }
    return fetch(url, { ...options, headers });
}

function showAuthModal() {
    authModalVisible = true;
    const modal = document.getElementById("auth-modal");
    if (modal) {
        modal.classList.remove("hidden");
        modal.classList.add("flex");
    }
}

function closeAuthModal() {
    authModalVisible = false;
    const modal = document.getElementById("auth-modal");
    if (modal) {
        modal.classList.add("hidden");
        modal.classList.remove("flex");
    }
}

function switchAuthTab(tab) {
    document.getElementById("auth-signin-tab").classList.toggle("active-tab", tab === "signin");
    document.getElementById("auth-signup-tab").classList.toggle("active-tab", tab === "signup");
    document.getElementById("auth-signin-form").classList.toggle("hidden", tab !== "signin");
    document.getElementById("auth-signup-form").classList.toggle("hidden", tab !== "signup");
}

async function handleLogin(event) {
    event.preventDefault();
    const form = event.target;
    const name = form.querySelector('[name="login-name"]').value.trim();
    const password = form.querySelector('[name="login-password"]').value;
    const errorEl = form.querySelector(".auth-error");

    try {
        const res = await fetch(`${API_BASE}/api/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, password }),
        });
        const data = await res.json();
        if (!res.ok) {
            errorEl.textContent = data.error || "Login failed";
            errorEl.classList.remove("hidden");
            return;
        }
        setAuth(data.token, data.user);
        if (postAuthRedirect) {
            const redirect = postAuthRedirect;
            postAuthRedirect = null;
            window.location.hash = redirect;
        }
    } catch (e) {
        errorEl.textContent = "Network error";
        errorEl.classList.remove("hidden");
    }
}

async function handleRegister(event) {
    event.preventDefault();
    const form = event.target;
    const name = form.querySelector('[name="register-name"]').value.trim();
    const password = form.querySelector('[name="register-password"]').value;
    const nickname = form.querySelector('[name="register-nickname"]').value.trim() || null;
    const email = form.querySelector('[name="register-email"]').value.trim() || null;
    const errorEl = form.querySelector(".auth-error");

    try {
        const res = await fetch(`${API_BASE}/api/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, password, nickname, email }),
        });
        const data = await res.json();
        if (!res.ok) {
            errorEl.textContent = data.error || "Registration failed";
            errorEl.classList.remove("hidden");
            return;
        }
        setAuth(data.token, data.user);
        if (postAuthRedirect) {
            const redirect = postAuthRedirect;
            postAuthRedirect = null;
            window.location.hash = redirect;
        }
    } catch (e) {
        errorEl.textContent = "Network error";
        errorEl.classList.remove("hidden");
    }
}

function updateHeaderAuth() {
    const user = getUser();
    const header = document.getElementById("header-placeholder");
    if (!header) return;

    const loginBtns = header.querySelectorAll(".auth-login-btn");
    const userMenus = header.querySelectorAll(".auth-user-menu");
    const userName = header.querySelector(".auth-user-name");

    if (user) {
        loginBtns.forEach(el => el.classList.add("hidden"));
        userMenus.forEach(el => el.classList.remove("hidden"));
        if (userName) userName.textContent = user.nickname || user.name || "User";
    } else {
        loginBtns.forEach(el => el.classList.remove("hidden"));
        userMenus.forEach(el => el.classList.add("hidden"));
    }
}

document.addEventListener("DOMContentLoaded", () => {
    document.addEventListener("click", (e) => {
        if (e.target.classList.contains("auth-modal-overlay")) {
            closeAuthModal();
        }
    });
});
