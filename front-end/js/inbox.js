let currentChatId = null;

async function loadInbox() {
    const container = document.getElementById("page-inbox");
    if (!container) return;

    container.innerHTML = `
        <div class="max-w-6xl mx-auto px-8 py-12">
            <h2 class="text-3xl font-extrabold text-white mb-8">Inbox</h2>
            <div class="flex flex-col md:flex-row gap-6 h-[600px]">
                <div class="w-full md:w-80 bg-slate-900/60 rounded-2xl border border-slate-800 overflow-hidden flex flex-col">
                    <div class="p-4 border-b border-slate-800">
                        <h3 class="font-bold text-white">Conversations</h3>
                    </div>
                    <div id="chat-list" class="flex-1 overflow-y-auto p-2">
                        <div class="text-slate-400 text-center py-8">Loading...</div>
                    </div>
                </div>
                <div class="flex-1 bg-slate-900/60 rounded-2xl border border-slate-800 overflow-hidden flex flex-col">
                    <div id="chat-header" class="p-4 border-b border-slate-800">
                        <h3 class="font-bold text-white">Select a conversation</h3>
                    </div>
                    <div id="chat-messages" class="flex-1 overflow-y-auto p-4 space-y-4">
                        <div class="text-slate-400 text-center py-8">No conversation selected.</div>
                    </div>
                    <div id="chat-input-area" class="p-4 border-t border-slate-800 hidden">
                        <form id="chat-send-form" class="flex space-x-3">
                            <input type="text" placeholder="Type your message..." class="flex-1 rounded-xl border border-slate-800 bg-slate-950 py-3 px-4 text-sm text-slate-200 focus:border-blue-500 focus:outline-none">
                            <button type="submit" class="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold transition flex items-center space-x-2">
                                <i data-lucide="send" class="w-4 h-4"></i>
                                <span>Send</span>
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    `;

    await loadChatList();

    if (window.lucide) lucide.createIcons();
}

async function loadChatList() {
    const chatList = document.getElementById("chat-list");
    try {
        const res = await authFetch("/api/chats");
        if (!res.ok) {
            chatList.innerHTML = "<div class='text-red-400 text-center py-8'>Failed to load chats.</div>";
            return;
        }
        const chats = await res.json();
        if (chats.length === 0) {
            chatList.innerHTML = "<div class='text-slate-400 text-center py-8'>No conversations yet. Contact a coach to start one.</div>";
            return;
        }
        chatList.innerHTML = chats.map(c => {
            const user = getUser();
            const otherName = user && user.id === c.coach?.id ? (c.customer?.name || "User") : (c.coach?.name || "Coach");
            const lastMsg = c.last_message?.text || "No messages yet";
            return `
                <div class="chat-list-item p-3 rounded-xl hover:bg-slate-800/50 cursor-pointer transition border border-transparent hover:border-slate-700 mb-1 ${currentChatId === c.id ? 'bg-slate-800/50 border-slate-700' : ''}"
                     data-chat-id="${c.id}" data-other-name="${otherName}">
                    <div class="font-bold text-white text-sm truncate">${otherName}</div>
                    <div class="text-slate-400 text-xs truncate">${lastMsg}</div>
                </div>
            `;
        }).join("");

        document.querySelectorAll(".chat-list-item").forEach(el => {
            el.addEventListener("click", () => {
                currentChatId = parseInt(el.dataset.chatId);
                loadChatMessages(currentChatId, el.dataset.otherName);
                document.querySelectorAll(".chat-list-item").forEach(i => {
                    i.classList.remove("bg-slate-800/50", "border-slate-700");
                });
                el.classList.add("bg-slate-800/50", "border-slate-700");
            });
        });

        if (chats.length > 0 && !currentChatId) {
            currentChatId = chats[0].id;
            const first = document.querySelector(".chat-list-item");
            if (first) {
                first.classList.add("bg-slate-800/50", "border-slate-700");
                loadChatMessages(currentChatId, first.dataset.otherName);
            }
        }
    } catch (e) {
        chatList.innerHTML = "<div class='text-red-400 text-center py-8'>Error loading chats.</div>";
    }
}

async function loadChatMessages(chatId, otherName) {
    const header = document.getElementById("chat-header");
    const messages = document.getElementById("chat-messages");
    const inputArea = document.getElementById("chat-input-area");

    header.innerHTML = `<h3 class="font-bold text-white">${otherName}</h3>`;
    messages.innerHTML = "<div class='text-slate-400 text-center py-8'>Loading...</div>";
    inputArea.classList.remove("hidden");

    try {
        const res = await authFetch(`/api/chats/${chatId}/messages`);
        if (!res.ok) {
            messages.innerHTML = "<div class='text-red-400 text-center py-8'>Failed to load messages.</div>";
            return;
        }
        const msgs = await res.json();
        const user = getUser();

        if (msgs.length === 0) {
            messages.innerHTML = "<div class='text-slate-400 text-center py-8'>No messages yet. Start the conversation!</div>";
        } else {
            messages.innerHTML = msgs.map(m => {
                const isMine = user && m.sender_id === user.id;
                return `
                    <div class="flex ${isMine ? 'justify-end' : 'justify-start'}">
                        <div class="max-w-[70%] ${isMine ? 'bg-blue-600' : 'bg-slate-800'} rounded-2xl px-4 py-3">
                            <div class="text-white text-sm">${m.text}</div>
                            <div class="text-xs ${isMine ? 'text-blue-200' : 'text-slate-400'} mt-1">${new Date(m.timestamp * 1000).toLocaleString()}</div>
                        </div>
                    </div>
                `;
            }).join("");
        }

        setTimeout(() => {
            messages.scrollTop = messages.scrollHeight;
        }, 100);

        const form = document.getElementById("chat-send-form");
        form.onsubmit = async (e) => {
            e.preventDefault();
            const input = form.querySelector("input");
            const text = input.value.trim();
            if (!text) return;

            try {
                const res = await authFetch(`/api/chats/${chatId}/messages`, {
                    method: "POST",
                    body: JSON.stringify({ text }),
                });
                if (res.ok) {
                    input.value = "";
                    await loadChatMessages(chatId, otherName);
                    await loadChatList();
                }
            } catch (e) {}
        };
    } catch (e) {
        messages.innerHTML = "<div class='text-red-400 text-center py-8'>Error loading messages.</div>";
    }
}
