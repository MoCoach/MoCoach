"use strict";
const ChatApp = {
  currentUser: { id: null, name: 'You', role: null, isBlocked: false, isMsgBlocked: false },
  conversations: [],
  activeChatId: null,
  isOpen: false,
  _lastSeenTimes: {},
  _pollInterval: null,

  async init() {
    if (!document.getElementById('msg-conversation-list')) {
      setTimeout(() => this.init(), 50);
      return;
    }
    this._syncCurrentUser();
    this.bindEvents();
    this.renderConversations();
    this.renderChat(null);
    this.updateMobileView();
    this._setupKeyboardHandler();
    window.addEventListener('resize', () => this.updateMobileView());
    if (this.isOpen) await this._loadConversations();
    this._startPolling();
  },

  _startPolling() {
    if (this._pollInterval) return;
    this._pollInterval = setInterval(() => this._checkForNewMessages(), 20000);
  },

  _stopPolling() {
    if (this._pollInterval) {
      clearInterval(this._pollInterval);
      this._pollInterval = null;
    }
  },

  async _checkForNewMessages() {
    const user = this._getAuthUser();
    if (!user || this.isOpen) return;
    const res = await api.getChats();
    if (!res.success || !Array.isArray(res.data)) return;
    let hasNew = false;
    for (const chat of res.data) {
      const lastSeen = this._lastSeenTimes[chat.id] || 0;
      const latest = chat.last_message_time || 0;
      if (latest > lastSeen && lastSeen > 0) {
        hasNew = true;
        break;
      }
    }
    if (hasNew) this._showBadge();
  },

  _showBadge() {
    const badge = document.getElementById('chat-unread-badge');
    if (badge) badge.classList.remove('hidden');
  },

  _hideBadge() {
    const badge = document.getElementById('chat-unread-badge');
    if (badge) badge.classList.add('hidden');
  },

  _updateLastSeenTimes() {
    for (const conv of this.conversations) {
      if (conv.lastActivity) {
        this._lastSeenTimes[conv.id] = conv.lastActivity;
      }
    }
  },

  _setupKeyboardHandler() {
    if (!window.visualViewport) return;
    const panel = document.querySelector('.messaging-panel');
    if (!panel) return;
    const onViewportChange = () => {
      const diff = window.innerHeight - window.visualViewport.height;
      if (diff > 100) {
        panel.style.height = window.visualViewport.height + 'px';
        panel.style.bottom = '0';
      } else {
        panel.style.height = '';
        panel.style.bottom = '';
      }
    };
    window.visualViewport.addEventListener('resize', onViewportChange);
    window.visualViewport.addEventListener('scroll', onViewportChange);
  },

  _syncCurrentUser() {
    const auth = this._getAuthUser();
    if (auth) {
      this.currentUser = {
        id: auth.userId,
        name: auth.username,
        role: auth.role,
        isBlocked: auth.is_blocked || false,
        isMsgBlocked: auth.is_messaging_blocked || false,
      };
    }
  },

  _getAuthUser() {
    try { return JSON.parse(sessionStorage.getItem('mocoach_auth')); } catch { return null; }
  },

  async _loadConversations() {
    const res = await api.getChats();
    if (res.success && Array.isArray(res.data)) {
      const oldIds = new Set(this.conversations.map(c => c.id));
      const newData = res.data.filter(c => !oldIds.has(c.id));
      this.conversations = res.data.map(chat => {
        const existing = this.conversations.find(c => c.id === chat.id);
        if (existing) return existing;
        return this._toConv(chat);
      });
      this.renderConversations();
      if (Object.keys(this._lastSeenTimes).length === 0) {
        this._updateLastSeenTimes();
      }
    }
  },

  _toConv(chat) {
    const other = this._otherPerson(chat);
    return {
      id: chat.id,
      otherPerson: other,
      messages: [],
      unread: 0,
      lastActivity: chat.last_message_time,
      _fetched: false,
    };
  },

  _otherPerson(chat) {
    const me = this.currentUser.id;
    const isCoach = chat.coach && chat.coach.id === me;
    const person = isCoach ? chat.customer : chat.coach;
    return {
      id: person.id,
      name: `${person.first_name || ''} ${person.last_name || ''}`.trim() || person.username || 'Unknown',
    };
  },

  _isCoach() {
    return this.currentUser.role === 'coach';
  },

  _roleLabel() {
    return this._isCoach() ? 'Client' : 'Coach';
  },

  _updatePanelHeader() {
    const headerEl = document.querySelector('#messaging-overlay .messaging-panel > .flex');
    if (!headerEl) return;
    const titleEl = headerEl.querySelector('.msg-panel-title');
    const iconEl = headerEl.querySelector('.msg-panel-icon');
    if (this._isCoach()) {
      if (titleEl) titleEl.textContent = 'Client Messages';
      if (iconEl) { iconEl.setAttribute('data-lucide', 'users'); if (window.lucide) lucide.createIcons(); }
    } else {
      if (titleEl) titleEl.textContent = 'Coach Messages';
      if (iconEl) { iconEl.setAttribute('data-lucide', 'graduation-cap'); if (window.lucide) lucide.createIcons(); }
    }
  },

  async open(coachId) {
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
        showToast("As a coach, you can't message other coaches.");
        return;
      }
      coachId = null;
    }

    if (user.is_blocked) {
      showToast('Your account has been blocked. Please contact support.');
      return;
    }

    this._syncCurrentUser();
    this._updatePanelHeader();
    this._hideBadge();

    if (this.conversations.length === 0) {
      await this._loadConversations();
    }
    this._updateLastSeenTimes();

    this.isOpen = true;
    const overlay = document.getElementById('messaging-overlay');
    overlay.classList.remove('hidden');
    document.body.classList.add('overflow-hidden');
    setTimeout(() => overlay.classList.add('open'), 10);

    if (coachId) {
      const parsedId = typeof coachId === 'number' ? coachId : parseInt(coachId, 10);
      if (isNaN(parsedId)) {
        this.renderConversations();
        return;
      }
      let conv = this.conversations.find(c => c.otherPerson && c.otherPerson.id === parsedId);
      if (conv) {
        this.selectConversation(conv.id);
      } else {
        const coachRes = await api.getCoach(parsedId);
        const coachName = coachRes.success
          ? `${coachRes.data.first_name || ''} ${coachRes.data.last_name || ''}`.trim() || coachRes.data.username || 'Coach'
          : 'Coach';
        const coachTags = coachRes.success
          ? (coachRes.data.tags || []).map(t => t.name || t)
          : [];
        const placeholderConv = {
          id: 'pending-' + parsedId,
          otherPerson: { id: parsedId, name: coachName, tags: coachTags },
          messages: [],
          unread: 0,
          lastActivity: null,
          _fetched: true,
        };
        this.conversations.unshift(placeholderConv);
        this.selectConversation(placeholderConv.id);
      }
    }

    this.renderConversations();

    if (this.conversations.length === 0) {
      await this._loadConversations();
      this.renderConversations();
    }
  },

  close() {
    this.isOpen = false;
    const overlay = document.getElementById('messaging-overlay');
    overlay.classList.remove('open');
    document.body.classList.remove('overflow-hidden');
    setTimeout(() => overlay.classList.add('hidden'), 300);
  },

  async selectConversation(id) {
    this.activeChatId = id;
    const conv = this.conversations.find(c => c.id === id);
    if (conv && !conv._fetched && typeof id === 'number') {
      const res = await api.getChatMessages(id);
      if (res.success && Array.isArray(res.data)) {
        conv.messages = res.data.map(msg => ({
          id: msg.id,
          senderId: msg.sender.id,
          text: msg.text,
          timestamp: msg.timestamp,
        }));
        conv._fetched = true;
        if (res.data.length > 0) {
          conv.lastActivity = res.data[res.data.length - 1].timestamp;
        }
      }
    }
    if (conv) conv.unread = 0;
    this.renderConversations();
    this.renderChat(conv);
    this.updateMobileView();
    this.scrollToBottom();
    document.getElementById('msg-input')?.focus();
  },

  async send() {
    const input = document.getElementById('msg-input');
    const text = input.value.trim();
    if (!text || !this.activeChatId) return;

    if (this.currentUser.isBlocked || this.currentUser.isMsgBlocked) {
      showToast('You have been blocked from sending messages');
      return;
    }

    let conv = this.conversations.find(c => c.id === this.activeChatId);
    if (!conv) return;

    const recipientId = conv.otherPerson.id;
    const isPending = typeof conv.id === 'string' && conv.id.startsWith('pending-');

    const res = await api.sendMessage(recipientId, text);
    if (res.success) {
      const msgData = res.data;
      if (isPending && msgData.chat_id) {
        conv.id = msgData.chat_id;
        conv._fetched = true;
      }
      conv.messages.push({
        id: msgData.id,
        senderId: msgData.sender.id,
        text: msgData.text,
        timestamp: msgData.timestamp,
      });
      conv.lastActivity = msgData.timestamp;
      input.value = '';
      input.style.height = 'auto';
      this.renderChat(conv);
      this.renderConversations();
      this.scrollToBottom();
    } else {
      showToast(res.error || 'Failed to send message', 'error');
    }
  },

  renderConversations() {
    const list = document.getElementById('msg-conversation-list');
    if (!list) return;

    const sorted = [...this.conversations].sort((a, b) => {
      if (!a.lastActivity) return 1;
      if (!b.lastActivity) return -1;
      return b.lastActivity - a.lastActivity;
    });

    if (sorted.length === 0) {
      const isCoach = this._isCoach();
      list.innerHTML = `
        <div class="flex flex-col items-center justify-center py-16 text-slate-600">
          <i data-lucide="inbox" class="w-12 h-12 mb-3"></i>
          <p class="text-sm font-medium text-slate-500">${isCoach ? 'No client messages yet' : 'No coach conversations yet'}</p>
          <p class="text-xs text-slate-600 mt-1">${isCoach ? 'Clients will message you here' : 'Click "Contact" on a coach card to start chatting'}</p>
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
      const isActive = conv.id === this.activeChatId;
      const roleLabel = this._roleLabel();

      return `
        <button onclick="ChatApp.selectConversation(${JSON.stringify(conv.id)})"
          class="w-full text-left px-4 py-3 flex items-center space-x-3 hover:bg-slate-900/60 transition ${isActive ? 'bg-slate-900/80 border-l-2 border-teal-500' : 'border-l-2 border-transparent'}">
          <div class="w-10 h-10 rounded-full bg-slate-800 flex-shrink-0 overflow-hidden">
            <div class="w-full h-full flex items-center justify-center text-sm font-bold text-teal-400">${escapeHtml((conv.otherPerson.name || '?').charAt(0))}</div>
          </div>
          <div class="flex-1 min-w-0">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-1.5 min-w-0">
                <span class="text-sm font-semibold text-white truncate">${escapeHtml(conv.otherPerson.name)}</span>
                <span class="text-[9px] font-bold px-1 py-0.5 rounded bg-slate-800 text-slate-400 flex-shrink-0">${roleLabel}</span>
              </div>
              <span class="text-[10px] text-slate-500 flex-shrink-0 ml-2">${conv.lastActivity ? this._formatTime(conv.lastActivity) : ''}</span>
            </div>
            <div class="flex items-center justify-between mt-0.5">
              <span class="text-xs text-slate-500 truncate">${escapeHtml(preview)}</span>
              ${conv.unread > 0
                ? `<span class="bg-teal-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0 ml-2 min-w-[18px] text-center">${conv.unread}</span>`
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
    const isBlocked = this.currentUser.isBlocked || this.currentUser.isMsgBlocked;

    if (!conv) {
      if (header) header.innerHTML = '';
      if (messagesEl) { messagesEl.innerHTML = ''; messagesEl.classList.add('hidden'); }
      if (emptyState) {
        emptyState.classList.remove('hidden');
        const isCoach = this._isCoach();
        const titleEl = emptyState.querySelector('.msg-empty-title');
        const subEl = emptyState.querySelector('.msg-empty-subtitle');
        if (titleEl) titleEl.textContent = isCoach ? 'Select a client' : 'Select a coach';
        if (subEl) subEl.textContent = isCoach ? 'Choose a conversation from the sidebar' : 'Choose a conversation from the sidebar to start messaging';
      }
      if (inputArea) inputArea.classList.add('hidden');
      return;
    }

    if (messagesEl) messagesEl.classList.remove('hidden');
    if (emptyState) emptyState.classList.add('hidden');
    if (inputArea) {
      inputArea.classList.remove('hidden');
      const msgInput = document.getElementById('msg-input');
      const sendBtn = document.getElementById('msg-send-btn');
      if (isBlocked) {
        if (msgInput) { msgInput.setAttribute('disabled', 'disabled'); msgInput.setAttribute('placeholder', 'You have been blocked from sending messages'); }
        if (sendBtn) sendBtn.setAttribute('disabled', 'disabled');
      } else {
        if (msgInput) { msgInput.removeAttribute('disabled'); msgInput.setAttribute('placeholder', 'Type a message...'); }
        if (sendBtn) sendBtn.removeAttribute('disabled');
      }
    }

    if (header) {
      const roleLabel = this._roleLabel();
      header.innerHTML = `
        <button onclick="ChatApp._goBackToList()" class="md:hidden text-slate-400 hover:text-white p-1 -ml-1" aria-label="Back to conversations">
          <i data-lucide="arrow-left" class="w-5 h-5"></i>
        </button>
        <div class="w-9 h-9 rounded-full bg-slate-800 flex-shrink-0 overflow-hidden">
          <div class="w-full h-full flex items-center justify-center text-sm font-bold text-teal-400">${escapeHtml((conv.otherPerson.name || '?').charAt(0))}</div>
        </div>
        <div class="min-w-0">
          <div class="flex items-center gap-2">
            <p class="text-sm font-semibold text-white truncate">${escapeHtml(conv.otherPerson.name)}</p>
            <span class="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-teal-500/15 text-teal-400 border border-teal-500/20 flex-shrink-0">${roleLabel}</span>
          </div>
          ${conv.otherPerson.tags && conv.otherPerson.tags.length > 0
            ? `<p class="text-[10px] text-teal-400 truncate">${escapeHtml(conv.otherPerson.tags.join(', '))}</p>`
            : ''}
        </div>
      `;
    }

    if (messagesEl) {
      if (conv.messages.length === 0) {
        messagesEl.innerHTML = '<div class="flex items-center justify-center h-full text-slate-500 text-sm">Send a message to start the conversation</div>';
      } else {
        messagesEl.innerHTML = conv.messages.map(msg => {
          const isUser = msg.senderId === this.currentUser.id;
          const time = new Date(msg.timestamp * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          const showAvatar = !isUser;
          return `
            <div class="flex ${isUser ? 'justify-end' : 'justify-start'} items-end space-x-2 group">
              ${showAvatar
                ? `<div class="w-6 h-6 rounded-full bg-slate-800 flex-shrink-0 overflow-hidden hidden sm:block">
                    <div class="w-full h-full flex items-center justify-center text-[8px] font-bold text-teal-400">${escapeHtml((conv.otherPerson.name || '?').charAt(0))}</div>
                  </div>`
                : '<div class="w-6 flex-shrink-0 hidden sm:block"></div>'}
              <div class="max-w-[85%] sm:max-w-[70%] ${isUser ? 'bg-teal-600 text-white rounded-2xl rounded-br-md' : 'bg-slate-800 text-slate-200 rounded-2xl rounded-bl-md'} px-4 py-2.5 relative">
                <p class="text-sm leading-relaxed whitespace-pre-wrap break-words">${escapeHtml(msg.text)}</p>
                <p class="text-[10px] ${isUser ? 'text-teal-200' : 'text-slate-500'} text-right mt-1 opacity-80">${time}</p>
                ${isAdmin ? `
                  <button onclick="ChatApp.adminDeleteMessage(${JSON.stringify(conv.id)}, ${JSON.stringify(msg.id)})" class="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-red-600 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition hover:bg-red-700" title="Delete message">
                    <i data-lucide="x" class="w-3 h-3"></i>
                  </button>
                ` : ''}
              </div>
            </div>
          `;
        }).join('');
      }
    }

    if (window.lucide) lucide.createIcons();
  },

  async adminDeleteMessage(convId, msgId) {
    if (!confirm('Delete this message?')) return;
    const res = await api.deleteMessage(msgId);
    if (res.success) {
      const conv = this.conversations.find(c => c.id === convId);
      if (conv) {
        conv.messages = conv.messages.filter(m => m.id !== msgId);
        this.renderChat(conv);
      }
      showToast('Message deleted');
    } else {
      showToast(res.error || 'Failed to delete message', 'error');
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
      if (this.activeChatId) {
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
    this.activeChatId = null;
    this.renderConversations();
    this.renderChat(null);
    this.updateMobileView();
  },

  _formatTime(ts) {
    const date = typeof ts === 'number' ? new Date(ts * 1000) : new Date(ts);
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
