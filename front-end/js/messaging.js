const ChatApp = {
  currentUser: { id: 'user', name: 'You' },
  conversations: [],

  activeId: null,
  isOpen: false,

  init() {
    if (!document.getElementById('msg-conversation-list')) {
      setTimeout(() => this.init(), 50);
      return;
    }
    this._syncCurrentUser();
    this._syncFromStorage();
    this.bindEvents();
    this.renderConversations();
    this.renderChat(null);
    this.updateMobileView();
    window.addEventListener('resize', () => this.updateMobileView());
  },

  _syncCurrentUser() {
    const auth = this._getAuthUser();
    if (auth) {
      this.currentUser = {
        id: auth.userId,
        name: auth.username,
        avatar: auth.avatar || '',
      };
    }
  },

  _syncFromStorage() {
    const stored = localStorage.getItem('mocoach_chats');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          this.conversations = parsed;
        }
      } catch (e) {}
    }
  },

  _saveToStorage() {
    localStorage.setItem('mocoach_chats', JSON.stringify(this.conversations));
  },

  _getAuthUser() {
    try { return JSON.parse(sessionStorage.getItem('mocoach_auth')); } catch { return null; }
  },

  _getAdminData() {
    try { return JSON.parse(localStorage.getItem('mocoach_admin_data') || '{"coaches":{},"customers":{}}'); }
    catch { return { coaches: {}, customers: {} }; }
  },

  _isBlocked() {
    const user = this._getAuthUser();
    if (!user) return false;
    const admin = this._getAdminData();
    if (user.role === 'coach') {
      return !!(admin.coaches[user.userId] && admin.coaches[user.userId].messaging_blocked);
    }
    if (user.role === 'customer') {
      return !!(admin.customers[user.userId] && admin.customers[user.userId].messaging_blocked);
    }
    return false;
  },

  _isFullyBlocked() {
    const user = this._getAuthUser();
    if (!user) return false;
    const admin = this._getAdminData();
    if (user.role === 'coach') {
      return !!(admin.coaches[user.userId] && admin.coaches[user.userId].is_blocked);
    }
    if (user.role === 'customer') {
      return !!(admin.customers[user.userId] && admin.customers[user.userId].is_blocked);
    }
    return false;
  },

  bindEvents() {
    const $ = (id) => document.getElementById(id);

    $('msg-close-btn')?.addEventListener('click', () => this.close());

    document.querySelector('.messaging-backdrop')?.addEventListener('click', (e) => {
      if (e.target === document.querySelector('.messaging-backdrop')) this.close();
    });

    $('msg-send-btn')?.addEventListener('click', () => this.send());
    $('msg-input')?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.send();
      }
    });

    $('msg-search')?.addEventListener('input', (e) => this.filterConversations(e.target.value));

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen) this.close();
    });
  },

  open(coachId) {
    const user = this._getAuthUser();

    if (!user) {
      window.__pendingCoachId = coachId || null;
      const modal = document.getElementById('coach-modal');
      if (modal) {
        modal.classList.remove('hidden');
        document.body.classList.add('overflow-hidden');
        if (window.switchModalTab) switchModalTab('login');
      }
      return;
    }

    if (user.role === 'coach') {
      if (coachId && coachId !== user.userId) {
        showToast("As a coach, you can't message other coaches. This feature is for customers looking for a coach.");
        return;
      }
      if (!coachId) {
        showToast("As a coach, you can't message other coaches. This feature is for customers looking for a coach.");
        return;
      }
      if (coachId && coachId === user.userId) {
        this._syncCurrentUser();
        this.isOpen = true;
        const overlay = document.getElementById('messaging-overlay');
        overlay.classList.remove('hidden');
        document.body.classList.add('overflow-hidden');
        setTimeout(() => overlay.classList.add('open'), 10);
        this.renderConversations();
        return;
      }
    }

    if (this._isFullyBlocked()) {
      showToast('Your account has been blocked. Please contact support.');
      return;
    }

    this._syncCurrentUser();
    this.isOpen = true;
    const overlay = document.getElementById('messaging-overlay');
    overlay.classList.remove('hidden');
    document.body.classList.add('overflow-hidden');

    setTimeout(() => overlay.classList.add('open'), 10);

    if (coachId) {
      let conv = this.conversations.find(c => c.coach.id === coachId);
      if (!conv) {
        const coaches = JSON.parse(localStorage.getItem('mocoach_coaches') || '[]');
        const coachData = coaches.find(c => c.username === coachId);
        if (coachData) {
          conv = {
            id: 'conv-' + coachId,
            coach: {
              id: coachId,
              name: `${coachData.firstName || ''} ${coachData.lastName || ''}`.trim() || coachData.username,
              discipline: coachData.discipline || '',
              avatar: coachData.avatar || '',
            },
            messages: [],
            unread: 0,
            lastActivity: new Date().toISOString(),
          };
          this.conversations.unshift(conv);
        }
      }
      if (conv) {
        this.selectConversation(conv.id);
      }
    }

    this.renderConversations();
    this._saveToStorage();
  },

  close() {
    this.isOpen = false;
    const overlay = document.getElementById('messaging-overlay');
    overlay.classList.remove('open');
    document.body.classList.remove('overflow-hidden');
    setTimeout(() => overlay.classList.add('hidden'), 300);
  },

  selectConversation(id) {
    this.activeId = id;
    const conv = this.conversations.find(c => c.id === id);
    if (conv) {
      conv.unread = 0;
      this.renderConversations();
      this.renderChat(conv);
      this.updateMobileView();
      this.scrollToBottom();
      document.getElementById('msg-input')?.focus();
    }
  },

  send() {
    const input = document.getElementById('msg-input');
    const text = input.value.trim();
    if (!text || !this.activeId) return;

    if (this._isBlocked() || this._isFullyBlocked()) {
      showToast('You have been blocked from sending messages');
      return;
    }

    const conv = this.conversations.find(c => c.id === this.activeId);
    if (!conv) return;

    const msg = {
      id: this._id(),
      senderId: this.currentUser.id,
      text,
      timestamp: new Date().toISOString(),
    };
    conv.messages.push(msg);
    conv.lastActivity = msg.timestamp;
    input.value = '';
    input.style.height = 'auto';

    this.renderChat(conv);
    this.renderConversations();
    this._saveToStorage();
    this.scrollToBottom();
  },

  renderConversations() {
    const list = document.getElementById('msg-conversation-list');
    if (!list) return;

    const sorted = [...this.conversations].sort((a, b) =>
      new Date(b.lastActivity) - new Date(a.lastActivity)
    );

    if (sorted.length === 0) {
      list.innerHTML = `
        <div class="flex flex-col items-center justify-center py-16 text-slate-600">
          <i data-lucide="inbox" class="w-12 h-12 mb-3"></i>
          <p class="text-sm font-medium text-slate-500">No conversations yet</p>
          <p class="text-xs text-slate-600 mt-1">Click "Contact" on a coach card to start chatting</p>
        </div>
      `;
      if (window.lucide) lucide.createIcons();
      return;
    }

    list.innerHTML = sorted.map(conv => {
      const lastMsg = conv.messages[conv.messages.length - 1];
      const preview = lastMsg
        ? (lastMsg.senderId === this.currentUser.id ? 'You: ' : '') +
          lastMsg.text.substring(0, 55) + (lastMsg.text.length > 55 ? '...' : '')
        : '';
      const isActive = conv.id === this.activeId;

      return `
        <button onclick="ChatApp.selectConversation('${conv.id}')"
          class="w-full text-left px-4 py-3 flex items-center space-x-3 hover:bg-slate-900/60 transition ${isActive ? 'bg-slate-900/80 border-l-2 border-blue-500' : 'border-l-2 border-transparent'}">
          <div class="w-10 h-10 rounded-full bg-slate-800 flex-shrink-0 overflow-hidden">
            ${conv.coach.avatar
              ? `<img src="${this._esc(conv.coach.avatar)}" class="w-full h-full object-cover" loading="lazy">`
              : `<div class="w-full h-full flex items-center justify-center text-sm font-bold text-blue-400">${conv.coach.name.charAt(0)}</div>`}
          </div>
          <div class="flex-1 min-w-0">
            <div class="flex items-center justify-between">
              <span class="text-sm font-semibold text-white truncate">${this._esc(conv.coach.name)}</span>
              <span class="text-[10px] text-slate-500 flex-shrink-0 ml-2">${this._formatTime(conv.lastActivity)}</span>
            </div>
            <div class="flex items-center justify-between mt-0.5">
              <span class="text-xs text-slate-500 truncate">${this._esc(preview)}</span>
              ${conv.unread > 0
                ? `<span class="bg-blue-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0 ml-2 min-w-[18px] text-center">${conv.unread}</span>`
                : ''}
            </div>
          </div>
        </button>
      `;
    }).join('');

    if (window.lucide) lucide.createIcons();
  },

  renderChat(conv) {
    const header = document.getElementById('msg-chat-header');
    const messagesEl = document.getElementById('msg-messages');
    const emptyState = document.getElementById('msg-empty-state');
    const inputArea = document.getElementById('msg-input-area');
    const user = this._getAuthUser();
    const isAdmin = user && user.role === 'admin';
    const isBlocked = this._isBlocked() || this._isFullyBlocked();

    if (!conv) {
      if (header) header.innerHTML = '';
      if (messagesEl) { messagesEl.innerHTML = ''; messagesEl.classList.add('hidden'); }
      if (emptyState) emptyState.classList.remove('hidden');
      if (inputArea) inputArea.classList.add('hidden');
      return;
    }

    if (messagesEl) messagesEl.classList.remove('hidden');
    if (emptyState) emptyState.classList.add('hidden');
    if (inputArea) {
      if (isBlocked) {
        inputArea.classList.remove('hidden');
        document.getElementById('msg-input')?.setAttribute('disabled', 'disabled');
        document.getElementById('msg-input')?.setAttribute('placeholder', 'You have been blocked from sending messages');
        document.getElementById('msg-send-btn')?.setAttribute('disabled', 'disabled');
      } else {
        inputArea.classList.remove('hidden');
        document.getElementById('msg-input')?.removeAttribute('disabled');
        document.getElementById('msg-input')?.setAttribute('placeholder', 'Type a message...');
        document.getElementById('msg-send-btn')?.removeAttribute('disabled');
      }
    }

    if (header) {
      header.innerHTML = `
        <button onclick="ChatApp._goBackToList()" class="md:hidden text-slate-400 hover:text-white p-1 -ml-1" aria-label="Back to conversations">
          <i data-lucide="arrow-left" class="w-5 h-5"></i>
        </button>
        <div class="w-9 h-9 rounded-full bg-slate-800 flex-shrink-0 overflow-hidden">
          ${conv.coach.avatar
            ? `<img src="${this._esc(conv.coach.avatar)}" class="w-full h-full object-cover" loading="lazy">`
            : `<div class="w-full h-full flex items-center justify-center text-sm font-bold text-blue-400">${conv.coach.name.charAt(0)}</div>`}
        </div>
        <div class="min-w-0">
          <p class="text-sm font-semibold text-white truncate">${this._esc(conv.coach.name)}</p>
          <p class="text-[10px] text-emerald-400 truncate">${this._esc(conv.coach.discipline)}</p>
        </div>
      `;
    }

    if (messagesEl) {
      messagesEl.innerHTML = conv.messages.map(msg => {
        const isUser = msg.senderId === this.currentUser.id;
        const time = new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const showAvatar = !isUser;
        return `
          <div class="flex ${isUser ? 'justify-end' : 'justify-start'} items-end space-x-2 group">
            ${showAvatar
              ? `<div class="w-6 h-6 rounded-full bg-slate-800 flex-shrink-0 overflow-hidden hidden sm:block">
                  ${conv.coach.avatar
                    ? `<img src="${this._esc(conv.coach.avatar)}" class="w-full h-full object-cover">`
                    : `<div class="w-full h-full flex items-center justify-center text-[8px] font-bold text-blue-400">${conv.coach.name.charAt(0)}</div>`}
                </div>`
              : '<div class="w-6 flex-shrink-0 hidden sm:block"></div>'}
            <div class="max-w-[85%] sm:max-w-[70%] ${isUser ? 'bg-blue-600 text-white rounded-2xl rounded-br-md' : 'bg-slate-800 text-slate-200 rounded-2xl rounded-bl-md'} px-4 py-2.5 relative">
              <p class="text-sm leading-relaxed whitespace-pre-wrap break-words">${this._esc(msg.text)}</p>
              <p class="text-[10px] ${isUser ? 'text-blue-200' : 'text-slate-500'} text-right mt-1 opacity-80">${time}</p>
              ${isAdmin ? `
                <button onclick="ChatApp.adminDeleteMessage('${conv.id}', '${msg.id}')" class="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-red-600 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition hover:bg-red-700" title="Delete message">
                  <i data-lucide="x" class="w-3 h-3"></i>
                </button>
              ` : ''}
            </div>
          </div>
        `;
      }).join('');
    }

    if (window.lucide) lucide.createIcons();
  },

  adminDeleteMessage(convId, msgId) {
    if (!confirm('Delete this message?')) return;
    const conv = this.conversations.find(c => c.id === convId);
    if (conv) {
      conv.messages = conv.messages.filter(m => m.id !== msgId);
      this._saveToStorage();
      this.renderChat(conv);
      showToast('Message deleted by admin');
    }
  },

  scrollToBottom() {
    const el = document.getElementById('msg-messages');
    if (el) {
      requestAnimationFrame(() => {
        el.scrollTop = el.scrollHeight;
      });
    }
  },

  updateMobileView() {
    const sidebar = document.getElementById('msg-sidebar');
    const chatPanel = document.getElementById('msg-chat-panel');
    const isMobile = window.innerWidth < 768;

    if (!sidebar || !chatPanel) return;

    if (isMobile) {
      if (this.activeId) {
        sidebar.classList.add('hidden');
        chatPanel.classList.remove('hidden');
        chatPanel.classList.add('flex');
      } else {
        sidebar.classList.remove('hidden');
        chatPanel.classList.add('hidden');
        chatPanel.classList.remove('flex');
      }
    } else {
      sidebar.classList.remove('hidden');
      chatPanel.classList.remove('hidden');
      chatPanel.classList.add('flex');
    }
  },

  filterConversations(query) {
    const buttons = document.querySelectorAll('#msg-conversation-list > button');
    const q = query.toLowerCase().trim();
    buttons.forEach(btn => {
      const nameEl = btn.querySelector('.text-white');
      const name = nameEl?.textContent?.toLowerCase() || '';
      btn.style.display = (!q || name.includes(q)) ? '' : 'none';
    });
  },

  _goBackToList() {
    this.activeId = null;
    this.renderConversations();
    this.renderChat(null);
    this.updateMobileView();
  },

  _formatTime(iso) {
    const date = new Date(iso);
    const now = new Date();
    const diff = now - date;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (days === 1) {
      return 'Yesterday';
    } else if (days < 7) {
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  },

  _id() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 6);
  },

  _esc(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  },
};

document.addEventListener('DOMContentLoaded', () => {
  const tryInit = () => {
    if (document.getElementById('msg-conversation-list')) {
      ChatApp.init();
    } else {
      setTimeout(tryInit, 50);
    }
  };
  setTimeout(tryInit, 200);
});

window.ChatApp = ChatApp;
