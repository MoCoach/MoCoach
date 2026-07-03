const MOCK_COACHES = [
  { id: 'coach-1', name: 'Priya S.', discipline: 'Zumba', avatar: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=150&q=80' },
  { id: 'coach-2', name: 'Cedric L.', discipline: 'Boxing', avatar: 'https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?auto=format&fit=crop&w=150&q=80' },
  { id: 'coach-3', name: 'Leana Marou', discipline: 'Yoga', avatar: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=150&q=80' },
  { id: 'coach-4', name: 'Sarah B.', discipline: 'Tennis', avatar: 'https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?auto=format&fit=crop&w=150&q=80' },
  { id: 'coach-7', name: 'Jean-Pierre S.', discipline: 'Water Sports', avatar: 'https://images.unsplash.com/photo-1519315901367-f34ff9154487?auto=format&fit=crop&w=150&q=80' },
];

const ChatApp = {
  currentUser: { id: 'user', name: 'You' },
  conversations: [
    {
      id: 'conv-coach-1',
      coach: MOCK_COACHES[0],
      messages: [
        { id: 'm1', senderId: 'coach-1', text: "Hey there! I saw you're interested in Zumba. I have morning classes at 7 AM and evening sessions at 5:30 PM. Would either work for you?", timestamp: '2026-06-24T09:15:00' },
        { id: 'm2', senderId: 'user', text: 'Hi Priya! The evening session at 5:30 PM would be perfect. Do you have availability on weekdays?', timestamp: '2026-06-24T09:20:00' },
        { id: 'm3', senderId: 'coach-1', text: 'Great choice! I have Monday, Wednesday, and Friday open at 5:30 PM this week. Would you like to start with a trial session?', timestamp: '2026-06-24T09:25:00' },
        { id: 'm4', senderId: 'user', text: "Monday works for me! Let's do the trial session. What do I need to bring?", timestamp: '2026-06-24T09:30:00' },
        { id: 'm5', senderId: 'coach-1', text: "Perfect! Just bring comfortable clothes, a water bottle, and a towel. I'll have the music ready! See you Monday at 5:30 PM at the Grand Baie community center.", timestamp: '2026-06-24T09:35:00' },
      ],
      unread: 0,
      lastActivity: '2026-06-24T09:35:00',
    },
    {
      id: 'conv-coach-2',
      coach: MOCK_COACHES[1],
      messages: [
        { id: 'm6', senderId: 'coach-2', text: "Yo! Ready to train? My boxing sessions are intense but rewarding. What's your experience level?", timestamp: '2026-06-23T14:00:00' },
        { id: 'm7', senderId: 'user', text: "Hi Cedric! I'm a complete beginner but I've always wanted to learn boxing for fitness.", timestamp: '2026-06-23T14:10:00' },
        { id: 'm8', senderId: 'coach-2', text: "No worries at all! I love training beginners. We'll start with the basics — stance, footwork, and technique. Safety first, always. I have a slot this Saturday at 10 AM. Interested?", timestamp: '2026-06-23T14:15:00' },
      ],
      unread: 2,
      lastActivity: '2026-06-23T14:15:00',
    },
    {
      id: 'conv-coach-3',
      coach: MOCK_COACHES[2],
      messages: [
        { id: 'm9', senderId: 'coach-3', text: 'Namaste! Welcome to my yoga page. I specialize in Vinyasa flow and beachside sessions. How can I support your practice?', timestamp: '2026-06-22T08:00:00' },
        { id: 'm10', senderId: 'user', text: 'Hi Leana! I\'m looking to improve my flexibility and reduce stress. Do you offer beginner-friendly sessions?', timestamp: '2026-06-22T08:30:00' },
        { id: 'm11', senderId: 'coach-3', text: 'Absolutely! My classes are designed for all levels. We focus on breath work, gentle flow, and relaxation. I offer sessions at the beach in Pereybere or online via Zoom. Which do you prefer?', timestamp: '2026-06-22T08:45:00' },
      ],
      unread: 1,
      lastActivity: '2026-06-22T08:45:00',
    },
    {
      id: 'conv-coach-4',
      coach: MOCK_COACHES[3],
      messages: [
        { id: 'm12', senderId: 'coach-4', text: "Hi there! Ready to improve your tennis game? I offer coaching for all skill levels on the beautiful courts at Belle Mare.", timestamp: '2026-06-20T16:00:00' },
        { id: 'm13', senderId: 'user', text: "Hi Sarah! I'd love to book a session. What's your rate and availability for this weekend?", timestamp: '2026-06-20T16:30:00' },
        { id: 'm14', senderId: 'coach-4', text: "I charge 750 Rs per hour and have openings Saturday at 8 AM and Sunday at 4 PM. I provide rackets if you don't have your own!", timestamp: '2026-06-20T17:00:00' },
        { id: 'm15', senderId: 'user', text: 'Sunday at 4 PM works perfectly! See you there.', timestamp: '2026-06-20T17:15:00' },
      ],
      unread: 0,
      lastActivity: '2026-06-20T17:15:00',
    },
  ],

  activeId: null,
  isOpen: false,

  init() {
    if (!document.getElementById('msg-conversation-list')) {
      setTimeout(() => this.init(), 50);
      return;
    }
    this.bindEvents();
    this.renderConversations();
    this.renderChat(null);
    this.updateMobileView();
    window.addEventListener('resize', () => this.updateMobileView());
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
    // Auth check: must be logged in as customer to contact coach
    const raw = localStorage.getItem('mocoach_user');
    if (!raw) {
      window.__pendingCoachId = coachId || null;
      const modal = document.getElementById('coach-modal');
      if (modal) {
        modal.classList.remove('hidden');
        document.body.classList.add('overflow-hidden');
        if (window.switchModalTab) switchModalTab('login');
      }
      return;
    }
    const user = JSON.parse(raw);
    if (user.role === 'coach') {
      if (window.showToast) {
        showToast('Coaches cannot contact other coaches during MVP');
      }
      return;
    }

    this.isOpen = true;
    const overlay = document.getElementById('messaging-overlay');
    overlay.classList.remove('hidden');
    document.body.classList.add('overflow-hidden');

    setTimeout(() => overlay.classList.add('open'), 10);

    if (coachId) {
      let conv = this.conversations.find(c => c.coach.id === coachId);
      if (!conv) {
        const card = document.querySelector(`[data-coach-id="${coachId}"]`);
        if (card) {
          const img = card.querySelector('img');
          conv = {
            id: 'conv-' + coachId,
            coach: {
              id: coachId,
              name: card.getAttribute('data-name'),
              discipline: card.getAttribute('data-discipline'),
              avatar: img ? img.src : '',
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

    if (!conv) {
      if (header) header.innerHTML = '';
      if (messagesEl) { messagesEl.innerHTML = ''; messagesEl.classList.add('hidden'); }
      if (emptyState) emptyState.classList.remove('hidden');
      if (inputArea) inputArea.classList.add('hidden');
      return;
    }

    if (messagesEl) messagesEl.classList.remove('hidden');
    if (emptyState) emptyState.classList.add('hidden');
    if (inputArea) inputArea.classList.remove('hidden');

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
          <div class="flex ${isUser ? 'justify-end' : 'justify-start'} items-end space-x-2">
            ${showAvatar
              ? `<div class="w-6 h-6 rounded-full bg-slate-800 flex-shrink-0 overflow-hidden hidden sm:block">
                  ${conv.coach.avatar
                    ? `<img src="${this._esc(conv.coach.avatar)}" class="w-full h-full object-cover">`
                    : `<div class="w-full h-full flex items-center justify-center text-[8px] font-bold text-blue-400">${conv.coach.name.charAt(0)}</div>`}
                </div>`
              : '<div class="w-6 flex-shrink-0 hidden sm:block"></div>'}
            <div class="max-w-[85%] sm:max-w-[70%] ${isUser ? 'bg-blue-600 text-white rounded-2xl rounded-br-md' : 'bg-slate-800 text-slate-200 rounded-2xl rounded-bl-md'} px-4 py-2.5">
              <p class="text-sm leading-relaxed whitespace-pre-wrap break-words">${this._esc(msg.text)}</p>
              <p class="text-[10px] ${isUser ? 'text-blue-200' : 'text-slate-500'} text-right mt-1 opacity-80">${time}</p>
            </div>
          </div>
        `;
      }).join('');
    }

    if (window.lucide) lucide.createIcons();
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

  _autoReply() {
    const replies = [
      "Thanks for your message! I'd be happy to help you with your fitness journey.",
      "Great question! I have availability this week. Let me know what time works for you.",
      "I appreciate your interest! Let me send you some more details about my coaching packages.",
      "Absolutely! I specialize in helping clients achieve their goals. When would you like to start?",
      "Thanks for reaching out! I have several time slots available. What's your preferred schedule?",
      "That sounds great! Let me check my calendar and get back to you with available slots.",
      "Wonderful! I'm excited to work with you. Let me know if you have any questions before we start.",
    ];
    return replies[Math.floor(Math.random() * replies.length)];
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
