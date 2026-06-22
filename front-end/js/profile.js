async function loadProfile() {
    const container = document.getElementById("page-profile");
    if (!container) return;

    try {
        const res = await authFetch("/api/profile");
        if (!res.ok) {
            container.innerHTML = "<p class='text-red-400 p-8'>Failed to load profile.</p>";
            return;
        }
        const user = await res.json();

        const badgesReceived = user.badges_received || [];
        const badgesGiven = user.badges_given || [];

        container.innerHTML = `
            <div class="max-w-4xl mx-auto px-8 py-12">
                <h2 class="text-3xl font-extrabold text-white mb-8">My Profile</h2>

                <div class="bg-slate-900/60 rounded-2xl p-8 border border-slate-800 mb-8">
                    <h3 class="text-xl font-bold text-white mb-6">Personal Info</h3>
                    <form id="profile-form" class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label class="block text-sm text-slate-400 mb-1">Nickname</label>
                            <input name="nickname" value="${user.nickname || ""}" class="w-full rounded-xl border border-slate-800 bg-slate-950 py-3 px-4 text-sm text-slate-200 focus:border-blue-500 focus:outline-none">
                        </div>
                        <div>
                            <label class="block text-sm text-slate-400 mb-1">Name</label>
                            <input name="name" value="${user.name || ""}" class="w-full rounded-xl border border-slate-800 bg-slate-950 py-3 px-4 text-sm text-slate-200 focus:border-blue-500 focus:outline-none">
                        </div>
                        <div>
                            <label class="block text-sm text-slate-400 mb-1">First Name</label>
                            <input name="first_name" value="${user.first_name || ""}" class="w-full rounded-xl border border-slate-800 bg-slate-950 py-3 px-4 text-sm text-slate-200 focus:border-blue-500 focus:outline-none">
                        </div>
                        <div>
                            <label class="block text-sm text-slate-400 mb-1">Last Name</label>
                            <input name="last_name" value="${user.last_name || ""}" class="w-full rounded-xl border border-slate-800 bg-slate-950 py-3 px-4 text-sm text-slate-200 focus:border-blue-500 focus:outline-none">
                        </div>
                        <div>
                            <label class="block text-sm text-slate-400 mb-1">Email</label>
                            <input name="email" type="email" value="${user.email || ""}" class="w-full rounded-xl border border-slate-800 bg-slate-950 py-3 px-4 text-sm text-slate-200 focus:border-blue-500 focus:outline-none">
                        </div>
                        <div>
                            <label class="block text-sm text-slate-400 mb-1">Zip Code</label>
                            <input name="zip_code" value="${user.zip_code || ""}" class="w-full rounded-xl border border-slate-800 bg-slate-950 py-3 px-4 text-sm text-slate-200 focus:border-blue-500 focus:outline-none">
                        </div>
                        <div>
                            <label class="block text-sm text-slate-400 mb-1">Phone</label>
                            <input name="phone" value="${user.phone || ""}" class="w-full rounded-xl border border-slate-800 bg-slate-950 py-3 px-4 text-sm text-slate-200 focus:border-blue-500 focus:outline-none">
                        </div>
                        <div>
                            <label class="block text-sm text-slate-400 mb-1">Profile Photo URL</label>
                            <input name="profile_photo" value="${user.profile_photo || ""}" class="w-full rounded-xl border border-slate-800 bg-slate-950 py-3 px-4 text-sm text-slate-200 focus:border-blue-500 focus:outline-none">
                        </div>
                        <div class="md:col-span-2">
                            <button type="submit" class="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-bold transition">
                                Save Changes
                            </button>
                            <span id="profile-save-msg" class="ml-4 text-sm text-emerald-400 hidden">Saved!</span>
                        </div>
                    </form>
                </div>

                <div class="bg-slate-900/60 rounded-2xl p-8 border border-slate-800 mb-8">
                    <h3 class="text-xl font-bold text-white mb-6">Badges Received (${badgesReceived.length})</h3>
                    <div class="flex flex-wrap gap-4">
                        ${badgesReceived.length === 0 ? '<p class="text-slate-400">No badges yet.</p>' :
                            badgesReceived.map(b => `
                                <div class="bg-slate-950 rounded-xl p-4 border border-slate-800 text-center min-w-[120px]">
                                    <div class="text-2xl mb-1">${b.icon || "🏅"}</div>
                                    <div class="text-white font-bold text-sm">${b.name}</div>
                                    ${b.description ? `<div class="text-slate-400 text-xs mt-1">${b.description}</div>` : ""}
                                </div>
                            `).join("")
                        }
                    </div>
                </div>

                <div class="bg-slate-900/60 rounded-2xl p-8 border border-slate-800">
                    <h3 class="text-xl font-bold text-white mb-4">Messages</h3>
                    <a href="#inbox" class="text-blue-400 hover:text-blue-300 transition flex items-center space-x-2">
                        <i data-lucide="message-square" class="w-5 h-5"></i>
                        <span>Go to Inbox</span>
                    </a>
                </div>
            </div>
        `;

        const form = document.getElementById("profile-form");
        form.addEventListener("submit", async (e) => {
            e.preventDefault();
            const fd = new FormData(form);
            const data = {};
            fd.forEach((v, k) => { if (v) data[k] = v; });
            try {
                const res = await authFetch("/api/profile", {
                    method: "PUT",
                    body: JSON.stringify(data),
                });
                if (res.ok) {
                    const updated = await res.json();
                    localStorage.setItem("mocoach_user", JSON.stringify(updated));
                    const msg = document.getElementById("profile-save-msg");
                    msg.classList.remove("hidden");
                    setTimeout(() => msg.classList.add("hidden"), 3000);
                }
            } catch (e) {}
        });

        if (window.lucide) lucide.createIcons();
    } catch (e) {
        container.innerHTML = "<p class='text-red-400 p-8'>Error loading profile.</p>";
    }
}
