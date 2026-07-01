const COACH_PROFILES = {
  'coach-1': {
    id: 'coach-1', name: 'Priya S.', discipline: 'Zumba',
    price: '450 Rs/h', priceValue: 450,
    photoUrl: 'assets/img/Certified_coaches/zumba.jpg',
    avatarUrl: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=300&q=80',
    description: 'With over 8 years of experience in dance and fitness, Priya brings the energy of sega rhythms to every Zumba session. Her classes blend high-energy cardio with island-inspired moves, making fitness feel like a celebration. Whether you are a beginner or a seasoned dancer, she will have you moving, sweating, and smiling.',
    tags: ['Zumba', 'Dance Fitness', 'Sega Rhythms', 'Cardio'],
    badges: [
      { icon: 'flame', title: 'Top Energy', desc: 'Voted most energetic coach 3 months running' },
      { icon: 'music', title: 'Rhythm Master', desc: 'Expert-level choreography certification' },
    ],
  },
  'coach-2': {
    id: 'coach-2', name: 'Cedric L.', discipline: 'Boxing',
    price: '600 Rs/h', priceValue: 600,
    photoUrl: 'https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?auto=format&fit=crop&w=600&q=80',
    avatarUrl: 'https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?auto=format&fit=crop&w=300&q=80',
    description: 'Cedric is a former national boxing champion with 10 years of coaching experience. He specializes in technique-driven training that builds both skill and conditioning. His sessions focus on pad work, footwork drills, and defensive mechanics — all while pushing your physical limits in a supportive environment.',
    tags: ['Boxing', 'Kickboxing', 'Conditioning', 'Self-Defense'],
    badges: [
      { icon: 'target', title: 'Precision Coach', desc: 'Awarded for exceptional technical instruction' },
      { icon: 'shield', title: 'Safety First', desc: 'Certified in injury prevention protocols' },
    ],
  },
  'coach-3': {
    id: 'coach-3', name: 'Leana Marou', discipline: 'Yoga',
    price: '550 Rs/h', priceValue: 550,
    photoUrl: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=600&q=80',
    avatarUrl: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=300&q=80',
    description: 'Leana is a 500-RYT certified yoga instructor who blends Vinyasa flow with breathwork and meditation. She offers beachside sessions at sunrise and sunset, creating a serene environment for practitioners of all levels. Her teaching emphasizes alignment, mindfulness, and the mind-body connection.',
    tags: ['Yoga', 'Vinyasa', 'Meditation', 'Beach Yoga'],
    badges: [
      { icon: 'wind', title: 'Zen Master', desc: '500+ hours of advanced yoga instruction' },
      { icon: 'heart', title: 'Community Builder', desc: 'Led 50+ group beach yoga sessions' },
    ],
  },
  'coach-4': {
    id: 'coach-4', name: 'Sarah B.', discipline: 'Tennis',
    price: '750 Rs/h', priceValue: 750,
    photoUrl: 'https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?auto=format&fit=crop&w=600&q=80',
    avatarUrl: 'https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?auto=format&fit=crop&w=300&q=80',
    description: 'Sarah is a certified tennis professional with experience coaching players from beginners to tournament level. She focuses on serve mechanics, footwork patterns, and strategic court positioning. Her sessions at Belle Mare courts combine technical drills with live play scenarios.',
    tags: ['Tennis', 'Serve & Volley', 'Footwork', 'Match Strategy'],
    badges: [
      { icon: 'zap', title: 'Serve Specialist', desc: 'Recognized for transformative serve coaching' },
    ],
  },
  'coach-5': {
    id: 'coach-5', name: 'Mathieu R.', discipline: 'Football',
    price: '400 Rs/h', priceValue: 400,
    photoUrl: 'https://images.unsplash.com/photo-1517747614396-d21a78b850e8?auto=format&fit=crop&w=600&q=80',
    avatarUrl: 'https://images.unsplash.com/photo-1517747614396-d21a78b850e8?auto=format&fit=crop&w=300&q=80',
    description: 'Mathieu played semi-professional football in Europe before returning to Mauritius to coach. He specializes in technical skill development — dribbling, passing accuracy, and tactical awareness. His sessions are structured, high-energy, and suitable for all age groups.',
    tags: ['Football', 'Dribbling', 'Tactical Training', 'Agility'],
    badges: [
      { icon: 'trophy', title: 'Pro Background', desc: 'Semi-professional player with UEFA coaching cert' },
    ],
  },
  'coach-6': {
    id: 'coach-6', name: 'Amisha K.', discipline: 'Gymnastics',
    price: '650 Rs/h', priceValue: 650,
    photoUrl: 'https://images.unsplash.com/photo-1507652313519-d4e9174996dd?auto=format&fit=crop&w=600&q=80',
    avatarUrl: 'https://images.unsplash.com/photo-1507652313519-d4e9174996dd?auto=format&fit=crop&w=300&q=80',
    description: 'Amisha is a former national gymnast with over 12 years of coaching experience. She trains clients in floor routines, balance, flexibility, and core strength. Her progressive approach ensures safe skill development from basic rolls to advanced tumbling.',
    tags: ['Gymnastics', 'Flexibility', 'Core Strength', 'Floor Routine'],
    badges: [
      { icon: 'star', title: 'Elite Coach', desc: 'Trained 3 national-level junior gymnasts' },
    ],
  },
  'coach-7': {
    id: 'coach-7', name: 'Jean-Pierre S.', discipline: 'Water Sports',
    price: '700 Rs/h', priceValue: 700,
    photoUrl: 'https://images.unsplash.com/photo-1519315901367-f34ff9154487?auto=format&fit=crop&w=600&q=80',
    avatarUrl: 'https://images.unsplash.com/photo-1519315901367-f34ff9154487?auto=format&fit=crop&w=300&q=80',
    description: 'Jean-Pierre is a certified open-water swim coach and paddleboarding instructor. Born and raised on the Mauritian coast, he knows the waters intimately. His sessions cover stroke technique, breathing control, and open-water safety, set against the backdrop of the island\'s most beautiful lagoons.',
    tags: ['Open Water Swimming', 'Paddleboarding', 'Water Safety', 'Endurance'],
    badges: [
      { icon: 'waves', title: 'Water Safety Expert', desc: 'Lifeguard certified + 15 years ocean experience' },
      { icon: 'sun', title: 'Coastal Guide', desc: 'Led 200+ guided ocean sessions' },
    ],
  },
  'coach-8': {
    id: 'coach-8', name: 'Chloe A.', discipline: 'Jogging/Running',
    price: '350 Rs/h', priceValue: 350,
    photoUrl: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=600&q=80',
    avatarUrl: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=300&q=80',
    description: 'Chloe is a marathon runner and certified running coach who helps clients of all levels improve their pace, form, and endurance. From couch-to-5k programs to half-marathon preparation, she designs personalized running plans that fit your lifestyle and goals.',
    tags: ['Running', 'Endurance', 'Pacing', '5K / 10K Prep'],
    badges: [
      { icon: 'zap', title: 'Marathoner', desc: 'Completed 8 marathons across 3 continents' },
    ],
  },
  'coach-9': {
    id: 'coach-9', name: 'Kavir D.', discipline: 'Strength Training',
    price: '500 Rs/h', priceValue: 500,
    photoUrl: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=600&q=80',
    avatarUrl: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=300&q=80',
    description: 'Kavir is a certified strength and conditioning specialist with a background in sports science. He designs progressive programs focused on hypertrophy, postural correction, and functional strength. Every session is tailored to your body type, goals, and experience level.',
    tags: ['Strength Training', 'Hypertrophy', 'Posture', 'Progressive Overload'],
    badges: [
      { icon: 'flame', title: 'Strength Guru', desc: 'Certified by NASM as Strength & Conditioning specialist' },
      { icon: 'target', title: 'Results Driven', desc: 'Clients average 15% strength gain in 8 weeks' },
    ],
  },
  'coach-10': {
    id: 'coach-10', name: 'Arnaud G.', discipline: 'Hiking',
    price: '650 Rs/h', priceValue: 650,
    photoUrl: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=600&q=80',
    avatarUrl: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=300&q=80',
    description: 'Arnaud is an experienced mountain guide who knows every trail in Mauritius. From Le Morne Brabant to Black River Gorges, he leads guided hikes that combine physical challenge with stunning scenery. He emphasizes pacing, trail safety, and Leave No Trace principles.',
    tags: ['Hiking', 'Trail Navigation', 'Mountain Guide', 'Nature'],
    badges: [
      { icon: 'map', title: 'Trail Expert', desc: 'Certified mountain guide with 500+ ascents' },
    ],
  },
  'coach-11': {
    id: 'coach-11', name: 'Gael B.', discipline: 'Combat Sports',
    price: '550 Rs/h', priceValue: 550,
    photoUrl: 'https://images.unsplash.com/photo-1517438476312-10d79c01926d?auto=format&fit=crop&w=600&q=80',
    avatarUrl: 'https://images.unsplash.com/photo-1517438476312-10d79c01926d?auto=format&fit=crop&w=300&q=80',
    description: 'Gael has trained in martial arts for over 15 years, holding black belts in multiple disciplines. He teaches practical self-defense, kickboxing fundamentals, and mental conditioning. His training philosophy emphasizes discipline, respect, and controlled aggression.',
    tags: ['Kickboxing', 'Self-Defense', 'Muay Thai', 'MMA Conditioning'],
    badges: [
      { icon: 'shield', title: 'Black Belt', desc: '3rd degree black belt in Kickboxing' },
    ],
  },
  'coach-12': {
    id: 'coach-12', name: 'Ryan M.', discipline: 'Dance',
    price: '450 Rs/h', priceValue: 450,
    photoUrl: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&w=600&q=80',
    avatarUrl: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&w=300&q=80',
    description: 'Ryan is a professional dancer and choreographer with experience in contemporary, hip-hop, and traditional Mauritian sega. He teaches technique, musicality, and performance confidence. Whether you are preparing for a show or just want to have fun moving, Ryan makes every session electric.',
    tags: ['Hip-Hop', 'Contemporary', 'Sega', 'Choreography'],
    badges: [
      { icon: 'music', title: 'Choreographer', desc: 'Choreographed for 10+ stage productions' },
    ],
  },
  'coach-13': {
    id: 'coach-13', name: 'Nicholas W.', discipline: 'Badminton',
    price: '480 Rs/h', priceValue: 480,
    photoUrl: 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?auto=format&fit=crop&w=600&q=80',
    avatarUrl: 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?auto=format&fit=crop&w=300&q=80',
    description: 'Nicholas is a national-level badminton player with a passion for teaching. He focuses on racket technique, footwork speed, and tactical shot placement. His coaching has helped beginners reach competitive levels within months.',
    tags: ['Badminton', 'Footwork', 'Smash Technique', 'Court Coverage'],
    badges: [
      { icon: 'zap', title: 'Speed Coach', desc: 'Known for rapid footwork improvement programs' },
    ],
  },
  'coach-14': {
    id: 'coach-14', name: 'Dev M.', discipline: 'Rugby',
    price: '500 Rs/h', priceValue: 500,
    photoUrl: 'https://images.unsplash.com/photo-1533560904424-a0c61dc306fc?auto=format&fit=crop&w=600&q=80',
    avatarUrl: 'https://images.unsplash.com/photo-1533560904424-a0c61dc306fc?auto=format&fit=crop&w=300&q=80',
    description: 'Dev played rugby for the Mauritius national team and now coaches the next generation. He specializes in passing accuracy, tactical positioning, and defensive structures. His sessions are physically demanding but always focused on skill progression and team principles.',
    tags: ['Rugby', 'Tackling', 'Passing', 'Team Tactics'],
    badges: [
      { icon: 'trophy', title: 'National Player', desc: 'Former Mauritius national rugby team member' },
    ],
  },
  'coach-15': {
    id: 'coach-15', name: 'Robert T.', discipline: 'Golf',
    price: '800 Rs/h', priceValue: 800,
    photoUrl: 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?auto=format&fit=crop&w=600&q=80',
    avatarUrl: 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?auto=format&fit=crop&w=300&q=80',
    description: 'Robert is a PGA-accredited golf instructor with years of experience teaching at premier Mauritian golf courses. He covers swing mechanics, putting precision, and course management. His analytical approach uses video feedback to help you see and feel improvements in real time.',
    tags: ['Golf', 'Swing Mechanics', 'Putting', 'Course Strategy'],
    badges: [
      { icon: 'star', title: 'PGA Accredited', desc: 'Full PGA teaching certification' },
      { icon: 'target', title: 'Precision Expert', desc: 'Helped clients reduce handicap by 10+ strokes' },
    ],
  },
  'coach-16': {
    id: 'coach-16', name: 'David L.', discipline: 'Basketball',
    price: '550 Rs/h', priceValue: 550,
    photoUrl: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&w=600&q=80',
    avatarUrl: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&w=300&q=80',
    description: 'David played college basketball internationally and brings modern training methods to Mauritius. He focuses on shooting form, ball handling, vertical jump training, and basketball IQ. His sessions are high-intensity and designed to build real game skills.',
    tags: ['Basketball', 'Dribbling', 'Shooting', 'Vertical Jump'],
    badges: [
      { icon: 'zap', title: 'Vertical Coach', desc: 'Specialist in plyometric jump training' },
    ],
  },
  'coach-17': {
    id: 'coach-17', name: 'Melissa P.', discipline: 'Handball',
    price: '450 Rs/h', priceValue: 450,
    photoUrl: 'https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&w=600&q=80',
    avatarUrl: 'https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&w=300&q=80',
    description: 'Melissa is a former national handball player who now coaches youth and adult players. She emphasizes passing accuracy, rapid positioning, and defensive tracking. Her sessions build team chemistry while sharpening individual technical skills.',
    tags: ['Handball', 'Team Play', 'Defense', 'Agility'],
    badges: [
      { icon: 'heart', title: 'Team Builder', desc: 'Built 3 competitive handball teams from scratch' },
    ],
  },
  'coach-18': {
    id: 'coach-18', name: 'Alan Y.', discipline: 'Table Tennis',
    price: '400 Rs/h', priceValue: 400,
    photoUrl: 'https://images.unsplash.com/photo-1534067783941-51c9c23eccfd?auto=format&fit=crop&w=600&q=80',
    avatarUrl: 'https://images.unsplash.com/photo-1534067783941-51c9c23eccfd?auto=format&fit=crop&w=300&q=80',
    description: 'Alan is a table tennis specialist with multiple island championship titles. He coaches spin techniques, reflex training, and placement control. His fast-paced sessions improve hand-eye coordination and reaction speed, suitable for both casual and competitive players.',
    tags: ['Table Tennis', 'Spin Control', 'Reflexes', 'Placement'],
    badges: [
      { icon: 'target', title: 'Spin Master', desc: 'Island champion 3 years running' },
    ],
  },
};

const CoachProfileApp = {
  currentId: null,
  currentData: null,

  init() {
    if (!document.getElementById('coach-profile-view')) {
      setTimeout(() => this.init(), 50);
      return;
    }
    this.bindEvents();
  },

  bindEvents() {
    document.getElementById('coach-profile-back-btn')?.addEventListener('click', () => this.close());
    document.getElementById('coach-profile-contact-btn')?.addEventListener('click', () => {
      if (this.currentId && window.ChatApp) {
        this.close();
        ChatApp.open(this.currentId);
      }
    });
  },

  open(coachId) {
    const card = document.querySelector(`[data-coach-id="${coachId}"]`);
    const profile = COACH_PROFILES[coachId];

    if (!profile) {
      if (!card) return;
      const priceSpan = card.querySelector('.text-xl.font-black');
      this.currentData = {
        id: coachId,
        name: card.getAttribute('data-name'),
        discipline: card.getAttribute('data-discipline'),
        price: priceSpan ? priceSpan.textContent.trim() : '',
        photoUrl: card.querySelector('img')?.src || '',
        description: '',
        tags: [card.getAttribute('data-discipline')],
        badges: [],
      };
    } else {
      this.currentData = { ...profile };
    }

    this.currentId = coachId;
    this.render();
    this.show();
  },

  render() {
    const d = this.currentData;
    if (!d) return;

    const heroEl = document.getElementById('coach-profile-hero-img');
    if (heroEl) {
      heroEl.style.backgroundImage = `url(${this._esc(d.photoUrl)})`;
    }

    const avatarEl = document.getElementById('coach-profile-avatar');
    if (avatarEl) {
      avatarEl.style.backgroundImage = `url(${this._esc(d.avatarUrl || d.photoUrl)})`;
    }

    this._setText('coach-profile-name', d.name);
    this._setText('coach-profile-discipline', d.discipline);
    this._setText('coach-profile-price', d.price);
    this._setText('coach-profile-description', d.description || 'No description available yet.');

    const tagsEl = document.getElementById('coach-profile-tags');
    if (tagsEl) {
      tagsEl.innerHTML = (d.tags || []).map(t =>
        `<span class="inline-flex items-center px-3 py-1 rounded-full bg-blue-600/10 text-blue-400 border border-blue-500/20 text-xs font-semibold">${this._esc(t)}</span>`
      ).join('');
    }

    const badgesEl = document.getElementById('coach-profile-badges');
    if (badgesEl) {
      if (d.badges && d.badges.length > 0) {
        badgesEl.innerHTML = d.badges.map(b => `
          <div class="bg-slate-800/60 rounded-xl p-4 border border-slate-700/50 flex flex-col items-center text-center">
            <div class="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500/10 to-emerald-500/10 flex items-center justify-center mb-2 border border-slate-600/30">
              <i data-lucide="${this._esc(b.icon)}" class="w-5 h-5 text-blue-400"></i>
            </div>
            <p class="text-xs font-bold text-white">${this._esc(b.title)}</p>
            <p class="text-[10px] text-slate-400 mt-0.5 leading-tight">${this._esc(b.desc)}</p>
          </div>
        `).join('');
        document.getElementById('coach-profile-badges-section')?.classList.remove('hidden');
      } else {
        badgesEl.innerHTML = '';
        document.getElementById('coach-profile-badges-section')?.classList.add('hidden');
      }
    }

    if (window.lucide) lucide.createIcons();
  },

  show() {
    const main = document.querySelector('main');
    const profileView = document.getElementById('profile-view');
    const coachView = document.getElementById('coach-profile-view');

    if (main) main.classList.add('hidden');
    if (profileView) profileView.classList.add('hidden');
    if (coachView) coachView.classList.remove('hidden');
    document.getElementById('messaging-overlay')?.classList.add('hidden');
    window.scrollTo({ top: 0 });
  },

  close() {
    this.currentId = null;
    this.currentData = null;
    const coachView = document.getElementById('coach-profile-view');
    if (coachView) coachView.classList.add('hidden');

    const main = document.querySelector('main');
    if (main) main.classList.remove('hidden');

    window.scrollTo({ top: 0 });
  },

  _setText(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text || '';
  },

  _esc(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  },
};

document.addEventListener('DOMContentLoaded', () => {
  const tryInit = () => {
    if (document.getElementById('coach-profile-view')) {
      CoachProfileApp.init();
    } else {
      setTimeout(tryInit, 50);
    }
  };
  setTimeout(tryInit, 250);
});

window.CoachProfileApp = CoachProfileApp;
