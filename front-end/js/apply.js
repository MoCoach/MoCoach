document.addEventListener('DOMContentLoaded', () => {
    const applyForm = document.getElementById("apply-coach-form");
    if (!applyForm) return;

    fetch("/api/tags")
        .then(r => r.json())
        .then(tags => {
            const container = document.getElementById("apply-tags-container");
            if (!container) return;
            container.innerHTML = tags.map(t => `
                <label class="flex items-center space-x-2 bg-slate-950 rounded-lg px-3 py-2 border border-slate-800 cursor-pointer hover:border-blue-500/50 transition">
                    <input type="checkbox" name="tags" value="${t.name}" class="accent-blue-600">
                    <span class="text-sm text-slate-200">${t.name}</span>
                </label>
            `).join("");
        });

    applyForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const fd = new FormData(applyForm);
        const checkedTags = [];
        applyForm.querySelectorAll('input[name="tags"]:checked').forEach(cb => checkedTags.push(cb.value));

        const data = {
            name: fd.get("name"),
            password: fd.get("password"),
            is_coach: true,
            first_name: fd.get("first_name"),
            last_name: fd.get("last_name"),
            email: fd.get("email") || null,
            zip_code: fd.get("zip_code") || null,
            profile_photo: fd.get("profile_photo") || null,
            description: fd.get("description") || "Coach",
            tags: checkedTags,
        };

        const errorEl = applyForm.querySelector(".apply-error");
        const successEl = applyForm.querySelector(".apply-success");
        errorEl.classList.add("hidden");
        successEl.classList.add("hidden");

        try {
            const res = await fetch("/api/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });
            const result = await res.json();
            if (!res.ok) {
                errorEl.textContent = result.error || "Application failed";
                errorEl.classList.remove("hidden");
                return;
            }

            setAuth(result.token, result.user);

            if (result.user && result.user.id) {
                const price = parseFloat(fd.get("price_per_hour"));
                if (price) {
                    await authFetch("/api/profile", {
                        method: "PUT",
                        body: JSON.stringify({ price_per_hour: price }),
                    });
                }
            }

            successEl.textContent = "Application submitted! Welcome to MoCoach.";
            successEl.classList.remove("hidden");
            setTimeout(() => navigateTo("home"), 2000);
        } catch (e) {
            errorEl.textContent = "Network error";
            errorEl.classList.remove("hidden");
        }
    });
});
