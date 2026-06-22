let uploadedPhotos = [];

document.addEventListener("DOMContentLoaded", () => {
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

    const dropzone = document.getElementById("photo-dropzone");
    const photoInput = document.getElementById("photo-input");

    dropzone.addEventListener("click", () => photoInput.click());

    dropzone.addEventListener("dragover", (e) => {
        e.preventDefault();
        dropzone.classList.add("border-blue-500");
    });
    dropzone.addEventListener("dragleave", () => {
        dropzone.classList.remove("border-blue-500");
    });
    dropzone.addEventListener("drop", (e) => {
        e.preventDefault();
        dropzone.classList.remove("border-blue-500");
        handleFiles(e.dataTransfer.files);
    });
    photoInput.addEventListener("change", (e) => {
        handleFiles(e.target.files);
    });

    function handleFiles(files) {
        const remaining = 10 - uploadedPhotos.length;
        if (files.length > remaining) {
            alert(`You can only upload ${remaining} more photo(s).`);
            return;
        }
        for (const file of files) {
            uploadedPhotos.push({ file, url: null, preview: null });
            const reader = new FileReader();
            reader.onload = (e) => {
                const idx = uploadedPhotos.findIndex(p => p.preview === null && p.file === file);
                if (idx !== -1) uploadedPhotos[idx].preview = e.target.result;
                renderPreviews();
            };
            reader.readAsDataURL(file);
        }
        renderPreviews();
    }

    function renderPreviews() {
        const container = document.getElementById("photo-previews");
        container.innerHTML = uploadedPhotos.map((p, i) => `
            <div class="relative group">
                <img src="${p.preview || ''}" class="w-full h-24 object-cover rounded-xl border ${i === 0 ? 'border-blue-500 ring-2 ring-blue-500/30' : 'border-slate-700'}">
                ${i === 0 ? '<span class="absolute top-1 left-1 bg-blue-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">PROFILE</span>' : ''}
                <button type="button" class="absolute top-1 right-1 bg-red-600/80 text-white w-5 h-5 rounded-full text-xs leading-none opacity-0 group-hover:opacity-100 transition" data-remove="${i}">&times;</button>
            </div>
        `).join("");

        container.querySelectorAll("[data-remove]").forEach(btn => {
            btn.addEventListener("click", () => {
                const idx = parseInt(btn.dataset.remove);
                uploadedPhotos.splice(idx, 1);
                renderPreviews();
            });
        });
    }

    applyForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const errorEl = applyForm.querySelector(".apply-error");
        const successEl = applyForm.querySelector(".apply-success");
        errorEl.classList.add("hidden");
        successEl.classList.add("hidden");

        const fd = new FormData(applyForm);
        const password = fd.get("password");
        const confirm = fd.get("confirm_password");
        if (password !== confirm) {
            errorEl.textContent = "Passwords do not match";
            errorEl.classList.remove("hidden");
            return;
        }

        const checkedTags = [];
        applyForm.querySelectorAll('input[name="tags"]:checked').forEach(cb => checkedTags.push(cb.value));
        if (checkedTags.length === 0) {
            errorEl.textContent = "Select at least one service tag";
            errorEl.classList.remove("hidden");
            return;
        }

        let photoUrls = [];
        if (uploadedPhotos.length > 0) {
            for (const p of uploadedPhotos) {
                const formData = new FormData();
                formData.append("file", p.file);
                try {
                    const res = await fetch("/api/upload", { method: "POST", body: formData });
                    if (res.ok) {
                        const data = await res.json();
                        photoUrls.push(data.url);
                    }
                } catch (e) {}
            }
        }

        const data = {
            email: fd.get("email"),
            password: password,
            is_coach: true,
            first_name: fd.get("first_name"),
            last_name: fd.get("last_name"),
            zip_code: fd.get("zip_code"),
            description: fd.get("description") || "Coach",
            tags: checkedTags,
            profile_photo: photoUrls.length > 0 ? photoUrls[0] : null,
            photos: photoUrls,
        };

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
            successEl.textContent = "Application submitted! Welcome to MoCoach.";
            successEl.classList.remove("hidden");
            setTimeout(() => navigateTo("home"), 2000);
        } catch (e) {
            errorEl.textContent = "Network error";
            errorEl.classList.remove("hidden");
        }
    });
});
