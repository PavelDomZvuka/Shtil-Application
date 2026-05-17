/**
 * ============================================================================
 * SHTIL - Meditation SPA Main Application Logic
 * ============================================================================
 * Handles all application state, navigation, rendering, session management,
 * streaks, achievements, the 5-location map system (LOCATIONS_V2), global
 * reveal flow, and enhanced toast notifications.
 *
 * Dependencies: data.js (MEDITATIONS, LOCATIONS_V2, ACHIEVEMENTS_DEF,
 *               TREE_STAGES, APP_VERSION), player.js (player, breathing)
 * ============================================================================
 */

const app = {
  // ---------------------------------------------------------------------------
  // App State
  // ---------------------------------------------------------------------------
  screen: 'home',
  prevScreen: null,
  state: null,
  currentTheme: null,
  currentRec: null,
  selectedLocationId: null,

  // Track the last played meditation for the player
  currentMeditation: null,

  // ---------------------------------------------------------------------------
  // Initialization
  // ---------------------------------------------------------------------------

  /**
   * Initialize the application. Called once on DOMContentLoaded.
   * Loads persisted state, sets up navigation, renders the initial screen.
   */
  init() {
    this.loadState();
    this.setupTabs();
    this.screen = null; // Force navigate to not bail early
    this.navigate('home');
    this.updateGreeting();
    this.updateAIRecommendation();

    // Close sub-map modal on backdrop click
    const subMapModal = document.getElementById('sub-map-modal');
    if (subMapModal) {
      subMapModal.addEventListener('click', (e) => {
        if (e.target === subMapModal) {
          this.closeSubMap();
        }
      });
    }

    // Global reveal overlay click to dismiss early
    const revealOverlay = document.getElementById('global-reveal-overlay');
    if (revealOverlay) {
      revealOverlay.addEventListener('click', () => {
        this.dismissGlobalReveal();
      });
    }

    // Breathing complete listener
    document.addEventListener('breathing:complete', (e) => {
      const detail = e.detail || {};
      this.saveBreathingSession(detail.elapsed || 0, detail.minutes || 0);
    });

    // Meditation complete listener
    document.addEventListener('meditation:complete', (e) => {
      const detail = e.detail || {};
      if (detail.meditationId && detail.duration) {
        this.saveSession(detail.meditationId, detail.duration);
      }
    });

    // Keyboard: Escape closes modals
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.closeSubMap();
        this.dismissGlobalReveal();
      }
    });
  },

  // ---------------------------------------------------------------------------
  // State Persistence
  // ---------------------------------------------------------------------------

  /**
   * Load application state from localStorage.
   * Merges defaults with persisted data to handle schema upgrades.
   */
  loadState() {
    const defaults = {
      totalMinutes: 0,
      totalSeconds: 0,
      sessions: [],
      streak: { current: 0, longest: 0, lastDate: null },
      achievements: [],
      track: 'balance',
      onboarding: false,
      selectedLocation: null,
      globalRevealShown: false
    };

    try {
      const raw = localStorage.getItem('shtil_state');
      if (raw) {
        const parsed = JSON.parse(raw);
        this.state = Object.assign({}, defaults, parsed);
        // Ensure nested streak object is complete
        if (!this.state.streak || typeof this.state.streak !== 'object') {
          this.state.streak = { current: 0, longest: 0, lastDate: null };
        }
        if (typeof this.state.globalRevealShown !== 'boolean') {
          this.state.globalRevealShown = false;
        }
      } else {
        this.state = Object.assign({}, defaults);
      }
    } catch (err) {
      console.warn('[Shtil] Failed to load state, using defaults:', err);
      this.state = Object.assign({}, defaults);
    }
  },

  /**
   * Persist current application state to localStorage.
   */
  saveState() {
    try {
      localStorage.setItem('shtil_state', JSON.stringify(this.state));
    } catch (err) {
      console.error('[Shtil] Failed to save state:', err);
    }
  },

  // ---------------------------------------------------------------------------
  // Navigation
  // ---------------------------------------------------------------------------

  /**
   * Navigate to a named screen. Manages prevScreen for goBack support.
   * @param {string} screen - 'home' | 'map' | 'sleep' | 'profile' | 'player' | 'breathing'
   */
  navigate(screen) {
    if (screen === this.screen) return;

    this.prevScreen = this.screen;
    this.screen = screen;

    // Hide all screens
    const screens = document.querySelectorAll('.screen');
    screens.forEach((el) => el.classList.remove('active'));

    // Show target screen
    const target = document.getElementById(`screen-${screen}`);
    if (target) {
      target.classList.add('active');
    }

    // Update tab bar active state
    const tabs = document.querySelectorAll('.tab-btn');
    tabs.forEach((tab) => {
      const tabScreen = tab.getAttribute('data-screen');
      if (tabScreen === screen) {
        tab.classList.add('active');
      } else {
        tab.classList.remove('active');
      }
    });

    // Update the back button visibility
    const backBtn = document.getElementById('back-btn');
    if (backBtn) {
      if (screen === 'player' || screen === 'breathing') {
        backBtn.classList.remove('hidden');
      } else {
        backBtn.classList.add('hidden');
      }
    }

    // Screen-specific renderers
    if (screen === 'home') {
      this.updateGreeting();
      this.updateAIRecommendation();
      this.renderHome();
    } else if (screen === 'map') {
      this.renderMap();
    } else if (screen === 'sleep') {
      this.renderSleep();
    } else if (screen === 'profile') {
      this.renderProfile();
    } else if (screen === 'player') {
      // Player screen renders via player.js
    } else if (screen === 'breathing') {
      // Breathing screen renders via player.js
    }

    // Scroll to top
    window.scrollTo(0, 0);
  },

  /**
   * Navigate back to the previous screen.
   */
  goBack() {
    if (this.prevScreen) {
      // Stop any active playback when going back
      if (this.screen === 'player' && typeof player !== 'undefined') {
        player.pause();
      }
      if (this.screen === 'breathing' && typeof breathing !== 'undefined') {
        breathing.stop();
      }
      this.navigate(this.prevScreen);
    } else {
      this.navigate('home');
    }
  },

  /**
   * Set up bottom tab bar click handlers.
   */
  setupTabs() {
    const tabs = document.querySelectorAll('.tab-btn');
    tabs.forEach((tab) => {
      tab.addEventListener('click', () => {
        const screen = tab.getAttribute('data-screen');
        if (screen) {
          this.navigate(screen);
        }
      });
    });

    // Back button handler
    const backBtn = document.getElementById('back-btn');
    if (backBtn) {
      backBtn.addEventListener('click', () => this.goBack());
    }
  },

  // ---------------------------------------------------------------------------
  // Greeting & AI Recommendation
  // ---------------------------------------------------------------------------

  /**
   * Update the greeting message based on time of day.
   */
  updateGreeting() {
    const hour = new Date().getHours();
    const el = document.getElementById('greeting');
    if (!el) return;

    let greeting = '';
    if (hour >= 5 && hour < 12) {
      greeting = 'Доброе утро';
    } else if (hour >= 12 && hour < 17) {
      greeting = 'Добрый день';
    } else if (hour >= 17 && hour < 22) {
      greeting = 'Добрый вечер';
    } else {
      greeting = 'Доброй ночи';
    }

    // Append streak context
    const streak = this.state.streak.current;
    if (streak > 0) {
      greeting += ` — ${streak} дн. серии`;
    }

    el.textContent = greeting;
  },

  /**
   * Update the AI-powered recommendation section on the home screen.
   * Selects a meditation based on time of day, past sessions, and track preference.
   */
  updateAIRecommendation() {
    const recEl = document.getElementById('ai-recommendation');
    const recTitle = document.getElementById('rec-title');
    const recDesc = document.getElementById('rec-desc');
    if (!recEl || !recTitle || !recDesc) return;

    const hour = new Date().getHours();
    let candidates = [];

    // Time-of-day filtering
    if (hour >= 5 && hour < 12) {
      candidates = MEDITATIONS.filter(m => m.target === 'energy' || m.target === 'gratitude');
    } else if (hour >= 12 && hour < 18) {
      candidates = MEDITATIONS.filter(m => m.target === 'focus' || m.target === 'clarity');
    } else if (hour >= 18 && hour < 22) {
      candidates = MEDITATIONS.filter(m => m.target === 'relaxation' || m.target === 'anxiety');
    } else {
      candidates = MEDITATIONS.filter(m => m.type === 'body_scan' || m.target === 'sleep');
    }

    // Fall back to all meditations if no time-based candidates
    if (candidates.length === 0) {
      candidates = [...MEDITATIONS];
    }

    // Prefer the user's selected track
    const trackFiltered = candidates.filter(m => m.track === this.state.track);
    if (trackFiltered.length > 0) {
      candidates = trackFiltered;
    }

    // Pick one: least-recently played, or random if no history
    const playedIds = this.state.sessions.map(s => s.meditationId);
    const unplayed = candidates.filter(m => !playedIds.includes(m.id));
    let chosen;
    if (unplayed.length > 0) {
      chosen = unplayed[Math.floor(Math.random() * unplayed.length)];
    } else {
      chosen = candidates[Math.floor(Math.random() * candidates.length)];
    }

    this.currentRec = chosen;

    recTitle.textContent = chosen.title;
    recDesc.textContent = chosen.shortDesc || chosen.desc || 'Рекомендовано для вас';

    // Play button handler is inline in HTML via onclick="app.playRecommended()"
    this.currentRec = chosen.id;
  },

  // ---------------------------------------------------------------------------
  // Playing
  // ---------------------------------------------------------------------------

  /**
   * Play the currently recommended meditation.
   */
  playRecommended() {
    if (!this.currentRec) {
      this.updateAIRecommendation();
    }
    if (this.currentRec) {
      this.startMeditation(this.currentRec.id);
    }
  },

  /**
   * Play a meditation filtered by type/tag.
   * @param {string} type - e.g. 'focus', 'relax', 'sleep', 'sos'
   */
  playByType(type) {
    const candidates = MEDITATIONS.filter(m => m.type === type);

    if (candidates.length === 0) {
      this.showNotification('Медитаций этого типа пока нет', 'warning');
      return;
    }

    // Pick least-recently played or random
    const playedIds = this.state.sessions.map(s => s.meditationId);
    const unplayed = candidates.filter(m => !playedIds.includes(m.id));
    const chosen = unplayed.length > 0
      ? unplayed[Math.floor(Math.random() * unplayed.length)]
      : candidates[Math.floor(Math.random() * candidates.length)];

    this.startMeditation(chosen.id);
  },

  /**
   * Activate SOS mode: start a short calming meditation immediately.
   */
  sosMode() {
    const sosMeds = MEDITATIONS.filter(m => m.id === 'm15');
    if (sosMeds.length > 0) {
      const chosen = sosMeds[Math.floor(Math.random() * sosMeds.length)];
      this.startMeditation(chosen.id);
      this.showNotification('SOS-режим активирован — дышите вместе с нами', 'info');
    } else {
      // Fallback to shortest meditation
      const shortest = [...MEDITATIONS].sort((a, b) => (a.duration || 0) - (b.duration || 0))[0];
      if (shortest) {
        this.startMeditation(shortest.id);
        this.showNotification('SOS-режим активирован', 'info');
      }
    }
  },

  /**
   * Start a specific meditation by ID. Transitions to the player screen.
   * @param {number} medId - meditation ID
   */
  startMeditation(medId) {
    const meditation = MEDITATIONS.find(m => m.id === medId);
    if (!meditation) {
      this.showNotification('Медитация не найдена', 'error');
      return;
    }

    this.currentMeditation = meditation;

    // Initialize player
    if (typeof player !== 'undefined' && player.start) {
      player.start(meditation);
    }

    this.navigate('player');
  },

  // ---------------------------------------------------------------------------
  // Session Management
  // ---------------------------------------------------------------------------

  /**
   * Save a completed meditation session.
   * @param {number} medId - meditation ID
   * @param {number} dur - duration in seconds
   */
  saveSession(medId, dur) {
    const meditation = MEDITATIONS.find(m => m.id === medId);
    const mins = Math.round(dur / 60);

    // Update totals
    this.state.totalSeconds = (this.state.totalSeconds || 0) + dur;
    this.state.totalMinutes = (this.state.totalMinutes || 0) + mins;

    // Add session record
    this.state.sessions.push({
      meditationId: medId,
      duration: dur,
      date: new Date().toISOString(),
      type: meditation ? (meditation.type || 'meditation') : 'meditation'
    });

    // Update streak
    this.updateStreak();

    // Check achievements
    this.checkAchievements();

    // Persist
    this.saveState();

    // Refresh relevant screens
    this.renderProfile();
    this.renderMap();

    // Notification
    this.showNotification(`Отлично! +${mins} мин. практики`, 'success');

    // Dispatch custom event for other modules
    document.dispatchEvent(new CustomEvent('shtil:sessionSaved', {
      detail: { medId, duration: dur, minutes: mins }
    }));
  },

  /**
   * Save a completed breathing session.
   * @param {number} elapsed - elapsed time in seconds
   * @param {number} mins - duration in minutes (rounded)
   */
  saveBreathingSession(elapsed, mins) {
    const dur = Math.round(elapsed);

    // Update totals
    this.state.totalSeconds = (this.state.totalSeconds || 0) + dur;
    this.state.totalMinutes = (this.state.totalMinutes || 0) + mins;

    // Add session record
    this.state.sessions.push({
      meditationId: null,
      duration: dur,
      date: new Date().toISOString(),
      type: 'breathing'
    });

    // Update streak
    this.updateStreak();

    // Check achievements
    this.checkAchievements();

    // Persist
    this.saveState();

    // Refresh relevant screens
    this.renderProfile();
    this.renderMap();

    // Notification
    this.showNotification(`Дыхание завершено! +${mins} мин.`, 'success');

    // Dispatch custom event
    document.dispatchEvent(new CustomEvent('shtil:sessionSaved', {
      detail: { meditationId: null, duration: dur, minutes: mins, type: 'breathing' }
    }));
  },

  /**
   * Update the daily streak. Handles same-day sessions, consecutive days,
   * and broken streaks.
   */
  updateStreak() {
    const today = new Date();
    const todayStr = this._dateKey(today);

    const last = this.state.streak.lastDate;

    if (!last) {
      // First session ever
      this.state.streak.current = 1;
      this.state.streak.longest = 1;
      this.state.streak.lastDate = todayStr;
      return;
    }

    const lastDate = this._parseDateKey(last);
    const lastStr = this._dateKey(lastDate);
    const diffDays = this._daysBetween(lastDate, today);

    if (lastStr === todayStr) {
      // Already practiced today — streak unchanged, just update lastDate
      this.state.streak.lastDate = todayStr;
    } else if (diffDays === 1) {
      // Consecutive day — increment streak
      this.state.streak.current += 1;
      this.state.streak.lastDate = todayStr;
      if (this.state.streak.current > this.state.streak.longest) {
        this.state.streak.longest = this.state.streak.current;
      }
    } else if (diffDays > 1) {
      // Streak broken — reset
      this.state.streak.current = 1;
      this.state.streak.lastDate = todayStr;
    }
  },

  /**
   * Check all achievement conditions and unlock new ones.
   * Shows a notification for each newly unlocked achievement.
   */
  checkAchievements() {
    if (!ACHIEVEMENTS_DEF || !Array.isArray(ACHIEVEMENTS_DEF)) return;

    const newlyUnlocked = [];

    ACHIEVEMENTS_DEF.forEach((ach) => {
      if (this.state.achievements.includes(ach.id)) return; // already unlocked

      let unlocked = false;

      switch (ach.condition.type) {
        case 'sessions_count':
          unlocked = this.state.sessions.length >= ach.condition.value;
          break;

        case 'total_minutes':
          unlocked = this.state.totalMinutes >= ach.condition.value;
          break;

        case 'streak_days':
          unlocked = this.state.streak.current >= ach.condition.value;
          break;

        case 'first_session':
          unlocked = this.state.sessions.length >= 1;
          break;

        case 'locations_unlocked':
          if (LOCATIONS_V2 && Array.isArray(LOCATIONS_V2)) {
            const unlockedCount = LOCATIONS_V2.filter(loc =>
              this.state.totalMinutes >= loc.requiredMinutes
            ).length;
            unlocked = unlockedCount >= ach.condition.value;
          }
          break;

        case 'all_locations':
          if (LOCATIONS_V2 && Array.isArray(LOCATIONS_V2)) {
            unlocked = LOCATIONS_V2.every(loc =>
              this.state.totalMinutes >= loc.requiredMinutes
            );
          }
          break;

        case 'breathing_sessions':
          unlocked = this.state.sessions.filter(s => s.type === 'breathing').length >= ach.condition.value;
          break;

        case 'meditation_types':
          {
            const types = new Set(this.state.sessions.map(s => s.type));
            unlocked = types.size >= ach.condition.value;
          }
          break;

        default:
          unlocked = false;
      }

      if (unlocked) {
        this.state.achievements.push(ach.id);
        newlyUnlocked.push(ach);
      }
    });

    // Show notifications for new achievements (staggered)
    newlyUnlocked.forEach((ach, index) => {
      setTimeout(() => {
        this.showNotification(
          `Достижение: ${ach.title} — ${ach.desc}`,
          'success'
        );
      }, index * 1200);
    });

    // Save if any were unlocked
    if (newlyUnlocked.length > 0) {
      this.saveState();
    }
  },

  // ---------------------------------------------------------------------------
  // Renderers
  // ---------------------------------------------------------------------------

  /**
   * Render the Home screen.
   * Shows meditation carousel cards with track badges.
   */
  renderHome() {
    const container = document.getElementById('home-carousel');
    if (!container) return;

    const trackLabels = {
      balance: 'Баланс',
      focus: 'Фокус',
      relax: 'Расслабление',
      sleep: 'Сон'
    };

    const trackColors = {
      balance: '#4ECDC4',
      focus: '#FF6B6B',
      relax: '#96CEB4',
      sleep: '#9B59B6'
    };

    container.innerHTML = MEDITATIONS.map((med) => {
      const trackLabel = trackLabels[med.track] || 'Общая';
      const trackColor = trackColors[med.track] || '#4ECDC4';
      const durationMin = med.duration ? Math.round(med.duration / 60) : med.durationMin || '—';

      return `
        <div class="meditation-card glass-panel" onclick="app.startMeditation(${med.id})">
          <div class="med-card-visual" style="background: linear-gradient(135deg, ${trackColor}22, ${trackColor}11);">
            <div class="med-card-icon" style="color: ${trackColor};">${med.icon || '🧘'}</div>
          </div>
          <div class="med-card-content">
            <div class="med-card-header">
              <div class="med-card-title">${med.title}</div>
              <span class="track-badge" style="background: ${trackColor}22; color: ${trackColor};">${trackLabel}</span>
            </div>
            <div class="med-card-desc">${med.shortDesc || med.desc || ''}</div>
            <div class="med-card-meta">
              <span class="med-card-duration">${durationMin} мин</span>
              ${med.rating ? `<span class="med-card-rating">${'★'.repeat(Math.round(med.rating))}${'☆'.repeat(5 - Math.round(med.rating))}</span>` : ''}
            </div>
          </div>
        </div>
      `;
    }).join('');
  },

  /**
   * Render the Map screen.
   * CRITICAL: Uses the LOCATIONS_V2 5-location system with progress bars,
   * lock states, and unlock progress tracking.
   */
  renderMap() {
    const totalMins = this.state.totalMinutes;
    let unlockedCount = 0;

    LOCATIONS_V2.forEach((loc) => {
      loc.unlocked = totalMins >= loc.requiredMinutes;
      if (loc.unlocked) unlockedCount++;
    });

    // Update progress header
    const progressEl = document.getElementById('map-progress');
    if (progressEl) {
      progressEl.textContent = `${unlockedCount} / ${LOCATIONS_V2.length} локаций`;
    }

    // Render location cards
    const container = document.getElementById('map-container');
    if (!container) return;

    container.innerHTML = LOCATIONS_V2.map((loc) => {
      const minsNeeded = Math.max(0, loc.requiredMinutes - totalMins);
      const progressPercent = loc.requiredMinutes > 0
        ? Math.min(100, (totalMins / loc.requiredMinutes) * 100)
        : 100;

      return `
        <div class="location-card-v2 ${loc.unlocked ? 'unlocked' : 'locked'}"
             onclick="app.handleLocationClick(${loc.id})"
             style="--loc-color: ${loc.color}; --loc-glow: ${loc.glowColor};">
          <div class="location-icon" style="background: ${loc.color}20; color: ${loc.color};">
            ${loc.unlocked ? loc.icon : '🔒'}
          </div>
          <div class="location-info">
            <div class="location-name">${loc.name}</div>
            <div class="location-desc">${loc.desc}</div>
            ${!loc.unlocked ? `
              <div class="location-progress-bar">
                <div class="location-progress-fill" style="width: ${progressPercent}%; background: ${loc.color};"></div>
              </div>
              <div class="location-need">Ещё ${minsNeeded} мин</div>
            ` : ''}
          </div>
          <div class="location-status-badge ${loc.unlocked ? 'unlocked' : 'locked'}">
            ${loc.unlocked ? '✓ Открыто' : '🔒 ' + loc.requiredMinutes + ' мин'}
          </div>
        </div>
      `;
    }).join('');

    // Check for global reveal
    this.checkGlobalReveal();
  },

  /**
   * Render the Sleep screen.
   * Shows sleep story cards filtered by sleep tag.
   */
  renderSleep() {
    const container = document.getElementById('sleep-stories');
    if (!container) return;

    const sleepMeds = MEDITATIONS.filter(m => m.type === 'sleep' || m.target === 'sleep');

    if (sleepMeds.length === 0) {
      container.innerHTML = `
        <div class="empty-state glass-panel">
          <div class="empty-icon">🌙</div>
          <div class="empty-title">Истории для сна появятся скоро</div>
          <div class="empty-desc">А пока попробуйте медитации из других разделов</div>
        </div>
      `;
      return;
    }

    container.innerHTML = sleepMeds.map((med) => {
      const durationMin = med.duration ? Math.round(med.duration / 60) : med.durationMin || '—';

      return `
        <div class="sleep-card glass-panel" onclick="app.startMeditation(${med.id})">
          <div class="sleep-card-bg" style="background: linear-gradient(180deg, #1a1a3e 0%, #16213e 50%, #0f3460 100%);">
            <div class="sleep-card-moon">🌙</div>
            <div class="sleep-card-stars">
              ${this._renderStars(5)}
            </div>
          </div>
          <div class="sleep-card-content">
            <div class="sleep-card-title">${med.title}</div>
            <div class="sleep-card-desc">${med.shortDesc || med.desc || ''}</div>
            <div class="sleep-card-meta">
              <span class="sleep-card-duration">${durationMin} мин</span>
              <span class="sleep-card-play">▶ Слушать</span>
            </div>
          </div>
        </div>
      `;
    }).join('');
  },

  /**
   * Render the Profile screen.
   * Shows stats (total minutes, sessions, streak), tree stage, achievements grid,
   * app version, and reset button.
   */
  renderProfile() {
    // --- Stats Panel ---
    const statsEl = document.getElementById('profile-stats');
    if (statsEl) {
      const currentTree = this._getCurrentTreeStage();
      const nextTree = this._getNextTreeStage();
      const treeProgress = nextTree
        ? Math.min(100, ((this.state.totalMinutes - currentTree.requiredMinutes) /
            (nextTree.requiredMinutes - currentTree.requiredMinutes)) * 100)
        : 100;
      const treeIcons = { 'seed':'🌱', 'sprout':'🌿', 'shoot':'🍃', 'sapling':'🌲', 'tree':'🌳', 'blooming':'🌸', 'wisdom':'🌳✨' };
      statsEl.innerHTML = `
        <div class="profile-stat-card glass-panel">
          <div class="stat-icon">⏱️</div>
          <div class="stat-value">${this.state.totalMinutes}</div>
          <div class="stat-label">Минут практики</div>
        </div>
        <div class="profile-stat-card glass-panel">
          <div class="stat-icon">🧘</div>
          <div class="stat-value">${this.state.sessions.length}</div>
          <div class="stat-label">Сессий</div>
        </div>
        <div class="profile-stat-card glass-panel">
          <div class="stat-icon">🔥</div>
          <div class="stat-value">${this.state.streak.current}</div>
          <div class="stat-label">Текущая серия</div>
        </div>
        <div class="profile-stat-card glass-panel">
          <div class="stat-icon">🏆</div>
          <div class="stat-value">${this.state.streak.longest}</div>
          <div class="stat-label">Лучшая серия</div>
        </div>
        <div class="profile-tree-card glass-panel">
          <div class="tree-icon-large">${treeIcons[currentTree.id] || '🌱'}</div>
          <div class="tree-name">${currentTree.name}</div>
          ${nextTree ? `
            <div class="tree-progress-bar"><div class="tree-progress-fill" style="width:${treeProgress}%"></div></div>
            <div class="tree-next">До «${nextTree.name}»: ${nextTree.requiredMinutes - this.state.totalMinutes} мин</div>
          ` : '<div class="tree-max">Максимальная стадия! 🎉</div>'}
        </div>
      `;
    }

    // --- Streak Panel ---
    const streakEl = document.getElementById('profile-streak');
    if (streakEl) {
      streakEl.innerHTML = `
        <div class="streak-display ${this.state.streak.current > 0 ? 'active' : ''}">
          <div class="streak-flame">${this.state.streak.current > 0 ? '🔥' : '⚡'}</div>
          <div class="streak-count">${this.state.streak.current} дн.</div>
          <div class="streak-label">${this.state.streak.current > 0 ? 'Серия активна' : 'Начните серию сегодня'}</div>
        </div>
      `;
    }

    // --- Achievements ---
    const achievementsEl = document.getElementById('profile-achievements');
    if (achievementsEl) {
      achievementsEl.innerHTML = ACHIEVEMENTS_DEF.map((ach) => {
        const unlocked = this.state.achievements.includes(ach.id);
        return `
          <div class="achievement-card ${unlocked ? 'unlocked' : 'locked'} glass-panel" title="${ach.desc}">
            <div class="achievement-icon" style="opacity: ${unlocked ? 1 : 0.3};">${ach.icon || '🏆'}</div>
            <div class="achievement-title">${ach.title}</div>
            ${!unlocked ? '<div class="achievement-lock">🔒</div>' : ''}
          </div>
        `;
      }).join('');
    }

    // --- Settings Panel ---
    const settingsEl = document.getElementById('profile-settings');
    if (settingsEl) {
      const tracks = [
        { id: 'balance', name: 'Баланс', color: '#5BA89C' },
        { id: 'focus', name: 'Фокус', color: '#E8A838' },
        { id: 'relax', name: 'Расслабление', color: '#8B7EC8' },
        { id: 'sleep', name: 'Сон', color: '#7B6BA8' }
      ];
      settingsEl.innerHTML = `
        <div class="settings-section">
          <h4 class="settings-title">Предпочтения</h4>
          <div class="track-selector">
            ${tracks.map(t => `
              <button class="track-btn ${this.state.track === t.id ? 'active' : ''} glass-panel"
                      onclick="app.setTrack('${t.id}')"
                      style="${this.state.track === t.id ? `--track-color: ${t.color}` : ''}">
                ${t.name}
              </button>
            `).join('')}
          </div>
        </div>
        <div class="settings-section">
          <h4 class="settings-title">Приложение</h4>
          <div class="app-version">Shtil v${typeof APP_VERSION !== 'undefined' ? APP_VERSION : '3.0.0'}</div>
          <button class="reset-btn glass-panel" onclick="app._confirmReset()">Сбросить прогресс</button>
        </div>
      `;
    }
  },

  // ---------------------------------------------------------------------------
  // Map System — NEW / ENHANCED
  // ---------------------------------------------------------------------------

  /**
   * Handle a click on a location card.
   * Opens the sub-map if unlocked, shows a locked toast with shake animation otherwise.
   * @param {number} locId - location ID
   */
  handleLocationClick(locId) {
    const loc = LOCATIONS_V2.find(l => l.id === locId);
    if (!loc) return;

    if (loc.unlocked) {
      this.openSubMap(loc);
    } else {
      // Find the card index within the container to add shake animation
      const cards = document.querySelectorAll('.location-card-v2');
      let cardIndex = -1;
      cards.forEach((card, idx) => {
        const onclickAttr = card.getAttribute('onclick');
        if (onclickAttr && onclickAttr.includes(`handleLocationClick(${locId})`)) {
          cardIndex = idx;
        }
      });

      if (cardIndex >= 0 && cards[cardIndex]) {
        cards[cardIndex].classList.add('shake-locked');
        setTimeout(() => {
          if (cards[cardIndex]) {
            cards[cardIndex].classList.remove('shake-locked');
          }
        }, 600);
      }

      this.showLockedToast(loc);
    }
  },

  /**
   * Open the sub-map modal for an unlocked location.
   * @param {object} loc - location object from LOCATIONS_V2
   */
  openSubMap(loc) {
    this.selectedLocationId = loc.id;

    const modal = document.getElementById('sub-map-modal');
    const icon = document.getElementById('sub-map-icon');
    const name = document.getElementById('sub-map-name');
    const desc = document.getElementById('sub-map-desc');
    const viz = document.getElementById('sub-map-visualization');
    const stats = document.getElementById('sub-map-stats');
    const cta = document.getElementById('sub-map-cta');

    if (!modal || !icon || !name || !desc || !viz || !stats || !cta) return;

    // Set icon
    icon.textContent = loc.icon;
    icon.style.background = loc.color + '20';
    icon.style.color = loc.color;
    icon.style.boxShadow = `0 0 40px ${loc.glowColor}`;

    // Set title and description
    name.textContent = loc.subMap ? loc.subMap.title : loc.name;
    name.style.color = loc.color;
    desc.textContent = loc.subMap ? loc.subMap.detailDesc : loc.desc;

    // Mini visualization
    const vizType = loc.subMap ? loc.subMap.visualization : 'valley';
    viz.innerHTML = this.renderSubMapVisualization(vizType, loc.color);

    // Stats
    const meditationIds = loc.subMap ? loc.subMap.meditationIds : [];
    const relatedMeds = MEDITATIONS.filter(m => meditationIds.includes(m.id));

    stats.innerHTML = `
      <div class="sub-map-stat glass-panel">
        <div class="stat-value">${relatedMeds.length}</div>
        <div class="stat-label">Практик доступно</div>
      </div>
      <div class="sub-map-stat glass-panel">
        <div class="stat-value">${this.state.totalMinutes}</div>
        <div class="stat-label">Минут практики</div>
      </div>
    `;

    // CTA button
    const secondaryColor = loc.theme ? loc.theme.secondary : loc.color;
    cta.style.background = `linear-gradient(135deg, ${loc.color}, ${secondaryColor})`;
    cta.textContent = 'Практиковать здесь';
    cta.onclick = () => this.startLocationMeditation();

    // Show modal
    modal.classList.add('active');

    // Apply location theme
    this.applyLocationTheme(loc);
  },

  /**
   * Close the sub-map modal and reset the location theme.
   */
  closeSubMap() {
    const modal = document.getElementById('sub-map-modal');
    if (modal) {
      modal.classList.remove('active');
    }
    this.selectedLocationId = null;
    this.applyLocationTheme(null);
  },

  /**
   * Start a meditation from the currently open sub-map.
   * Picks a random meditation from the location's available meditations.
   */
  startLocationMeditation() {
    if (!this.selectedLocationId) return;

    const loc = LOCATIONS_V2.find(l => l.id === this.selectedLocationId);
    if (!loc || !loc.subMap) return;

    const meditationIds = loc.subMap.meditationIds;
    if (!meditationIds || meditationIds.length === 0) {
      this.showNotification('В этой локации пока нет практик', 'warning');
      return;
    }

    // Pick a meditation
    const playedIds = this.state.sessions.map(s => s.meditationId);
    const unplayedIds = meditationIds.filter(id => !playedIds.includes(id));
    const chosenId = unplayedIds.length > 0
      ? unplayedIds[Math.floor(Math.random() * unplayedIds.length)]
      : meditationIds[Math.floor(Math.random() * meditationIds.length)];

    this.closeSubMap();
    this.startMeditation(chosenId);
  },

  /**
   * Show a toast notification for a locked location.
   * @param {object} loc - locked location object
   */
  showLockedToast(loc) {
    const need = loc.requiredMinutes - this.state.totalMinutes;
    this.showNotification(
      `Пройдите ещё ${need} минут дыхания для открытия региона «${loc.name}»`,
      'warning'
    );
  },

  /**
   * Check if all locations are unlocked and trigger the global reveal
   * if it hasn't been shown yet.
   */
  checkGlobalReveal() {
    if (!LOCATIONS_V2 || !Array.isArray(LOCATIONS_V2)) return;

    const allUnlocked = LOCATIONS_V2.every(loc => loc.unlocked);
    if (allUnlocked && !this.state.globalRevealShown) {
      this.state.globalRevealShown = true;
      this.saveState();
      setTimeout(() => this.triggerGlobalReveal(), 500);
    }
  },

  /**
   * Trigger the global reveal overlay celebrating all locations unlocked.
   */
  triggerGlobalReveal() {
    const overlay = document.getElementById('global-reveal-overlay');
    if (!overlay) return;

    overlay.classList.add('active');

    // Populate fragment data
    const fragments = overlay.querySelectorAll('.reveal-fragment');
    LOCATIONS_V2.forEach((loc, i) => {
      if (fragments[i]) {
        fragments[i].textContent = loc.icon;
        fragments[i].style.color = loc.color;
        fragments[i].style.textShadow = `0 0 30px ${loc.glowColor}`;
      }
    });

    // Auto-dismiss after 8 seconds
    setTimeout(() => this.dismissGlobalReveal(), 8000);
  },

  /**
   * Dismiss the global reveal overlay.
   */
  dismissGlobalReveal() {
    const overlay = document.getElementById('global-reveal-overlay');
    if (overlay) {
      overlay.classList.remove('active');
    }
  },

  // ---------------------------------------------------------------------------
  // Sub-Map Visualization
  // ---------------------------------------------------------------------------

  /**
   * Render a CSS-based mini map visualization.
   * @param {string} type - 'valley' | 'ocean' | 'lake' | 'mountain' | 'stars'
   * @param {string} color - primary color for the visualization
   * @returns {string} HTML string
   */
  renderSubMapVisualization(type, color) {
    const rgba = this._hexToRgba(color, 0.3);
    const rgbaStrong = this._hexToRgba(color, 0.6);

    switch (type) {
      case 'valley':
        return `
          <div class="sub-viz" style="position: relative; width: 100%; height: 200px; overflow: hidden; border-radius: 16px; background: linear-gradient(180deg, #87CEEB 0%, #E0F6FF 40%, #90EE90 40%, #228B22 100%);">
            <div style="position: absolute; bottom: 30px; left: 0; width: 100%; height: 60px; background: linear-gradient(180deg, transparent 0%, ${rgba} 100%); border-radius: 50% 50% 0 0;"></div>
            <div style="position: absolute; bottom: 20px; left: 10%; width: 30%; height: 50px; background: linear-gradient(180deg, ${rgba} 0%, ${color} 100%); border-radius: 50% 50% 0 0; opacity: 0.7;"></div>
            <div style="position: absolute; bottom: 10px; right: 15%; width: 40%; height: 70px; background: linear-gradient(180deg, ${rgbaStrong} 0%, ${color} 100%); border-radius: 50% 50% 0 0; opacity: 0.8;"></div>
            <div class="winding-path" style="position: absolute; bottom: 0; left: 20%; width: 60%; height: 100px; border: 3px dashed rgba(255,255,255,0.5); border-radius: 0 50% 0 50%; border-left: none; border-bottom: none;"></div>
            <div style="position: absolute; top: 15px; right: 20px; font-size: 24px;">☀️</div>
            <div style="position: absolute; top: 10px; left: 15px; width: 60px; height: 30px; background: rgba(255,255,255,0.4); border-radius: 50px;"></div>
          </div>
        `;

      case 'ocean':
        return `
          <div class="sub-viz" style="position: relative; width: 100%; height: 200px; overflow: hidden; border-radius: 16px; background: linear-gradient(180deg, #87CEEB 0%, #4682B4 50%, #191970 100%);">
            <div style="position: absolute; top: 25%; left: 0; width: 100%; height: 3px; background: rgba(255,255,255,0.3);"></div>
            <div style="position: absolute; top: 45%; left: 0; width: 100%; height: 4px; background: rgba(255,255,255,0.2);"></div>
            <div style="position: absolute; top: 65%; left: 0; width: 100%; height: 5px; background: rgba(255,255,255,0.15);"></div>
            <div class="wave" style="position: absolute; bottom: 40px; left: -10%; width: 120%; height: 20px; background: repeating-linear-gradient(90deg, ${rgba} 0px, ${rgba} 20px, transparent 20px, transparent 40px); opacity: 0.6; animation: waveMove 3s linear infinite;"></div>
            <div class="wave" style="position: absolute; bottom: 20px; left: -5%; width: 110%; height: 25px; background: repeating-linear-gradient(90deg, ${rgbaStrong} 0px, ${rgbaStrong} 25px, transparent 25px, transparent 50px); opacity: 0.5; animation: waveMove 4s linear infinite reverse;"></div>
            <div style="position: absolute; top: 10px; right: 15px; font-size: 28px;">🌅</div>
            <div style="position: absolute; top: 30%; left: 10%; font-size: 18px; opacity: 0.6;">🌊</div>
          </div>
          <style>@keyframes waveMove { from { transform: translateX(0); } to { transform: translateX(-40px); } }</style>
        `;

      case 'lake':
        return `
          <div class="sub-viz" style="position: relative; width: 100%; height: 200px; overflow: hidden; border-radius: 16px; background: linear-gradient(180deg, #E0F6FF 0%, #B0E0E6 50%, ${rgba} 100%);">
            <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 120px; height: 120px; border-radius: 50%; background: radial-gradient(circle, ${rgbaStrong} 0%, ${color} 40%, transparent 70%); opacity: 0.8;"></div>
            <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 120px; height: 60px; border-radius: 50%; background: linear-gradient(180deg, ${rgba} 0%, transparent 100%); opacity: 0.4;"></div>
            <div style="position: absolute; top: 20px; left: 15px; font-size: 22px; opacity: 0.8;">🏔️</div>
            <div style="position: absolute; top: 35px; right: 25px; font-size: 18px; opacity: 0.7;">🌲</div>
            <div style="position: absolute; bottom: 30px; left: 20px; font-size: 16px; opacity: 0.5;">🦆</div>
            <div style="position: absolute; top: 10px; right: 10px; width: 40px; height: 40px; border-radius: 50%; background: radial-gradient(circle, rgba(255,255,200,0.6) 0%, transparent 70%);"></div>
          </div>
        `;

      case 'mountain':
        return `
          <div class="sub-viz" style="position: relative; width: 100%; height: 200px; overflow: hidden; border-radius: 16px; background: linear-gradient(180deg, #4A5568 0%, #2D3748 60%, #1A202C 100%);">
            <div style="position: absolute; bottom: 0; left: 5%; width: 0; height: 0; border-left: 60px solid transparent; border-right: 60px solid transparent; border-bottom: 120px solid ${rgba};"></div>
            <div style="position: absolute; bottom: 0; left: 30%; width: 0; height: 0; border-left: 80px solid transparent; border-right: 80px solid transparent; border-bottom: 160px solid ${rgbaStrong};"></div>
            <div style="position: absolute; bottom: 0; right: 10%; width: 0; height: 0; border-left: 70px solid transparent; border-right: 70px solid transparent; border-bottom: 140px solid ${rgba};"></div>
            <div style="position: absolute; bottom: 120px; left: 37%; width: 0; height: 0; border-left: 20px solid transparent; border-right: 20px solid transparent; border-bottom: 40px solid rgba(255,255,255,0.8);"></div>
            <div style="position: absolute; bottom: 160px; left: 43%; width: 0; height: 0; border-left: 15px solid transparent; border-right: 15px solid transparent; border-bottom: 25px solid rgba(255,255,255,0.9);"></div>
            <div style="position: absolute; bottom: 140px; right: 22%; width: 0; height: 0; border-left: 18px solid transparent; border-right: 18px solid transparent; border-bottom: 30px solid rgba(255,255,255,0.7);"></div>
            <div style="position: absolute; top: 15px; right: 20px; font-size: 20px; opacity: 0.6;">☁️</div>
            <div style="position: absolute; top: 25px; left: 20px; font-size: 16px; opacity: 0.4;">☁️</div>
          </div>
        `;

      case 'stars':
        return `
          <div class="sub-viz" style="position: relative; width: 100%; height: 200px; overflow: hidden; border-radius: 16px; background: linear-gradient(180deg, #0B0B2B 0%, #1A1A3E 50%, #2D1B69 100%);">
            ${Array.from({ length: 20 }, (_, i) => {
              const x = Math.random() * 90 + 5;
              const y = Math.random() * 80 + 5;
              const size = Math.random() * 3 + 1;
              return `<div style="position: absolute; left: ${x}%; top: ${y}%; width: ${size}px; height: ${size}px; border-radius: 50%; background: ${i % 3 === 0 ? color : 'rgba(255,255,255,0.8)'}; opacity: ${Math.random() * 0.6 + 0.4};"></div>`;
            }).join('')}
            <div style="position: absolute; top: 25%; left: 15%; width: 30%; height: 2px; background: linear-gradient(90deg, transparent, ${rgbaStrong}, transparent); transform: rotate(-15deg);"></div>
            <div style="position: absolute; top: 40%; left: 50%; width: 25%; height: 2px; background: linear-gradient(90deg, transparent, ${rgba}, transparent); transform: rotate(25deg);"></div>
            <div style="position: absolute; top: 60%; left: 30%; width: 20%; height: 2px; background: linear-gradient(90deg, transparent, ${rgbaStrong}, transparent); transform: rotate(-30deg);"></div>
            <div style="position: absolute; top: 20%; right: 20%; font-size: 24px; opacity: 0.7;">🌙</div>
            <div style="position: absolute; bottom: 15px; left: 50%; transform: translateX(-50%); width: 60px; height: 20px; border-radius: 50%; background: ${rgba}; opacity: 0.3; filter: blur(8px);"></div>
          </div>
        `;

      default:
        return `
          <div class="sub-viz" style="width: 100%; height: 200px; border-radius: 16px; background: linear-gradient(135deg, ${rgba}, ${rgbaStrong}); display: flex; align-items: center; justify-content: center;">
            <span style="font-size: 48px; opacity: 0.5;">🧘</span>
          </div>
        `;
    }
  },

  // ---------------------------------------------------------------------------
  // Enhanced Notifications
  // ---------------------------------------------------------------------------

  /**
   * Show an enhanced toast notification.
   * @param {string} msg - message text
   * @param {string} type - 'success' | 'warning' | 'error' | 'info'
   */
  showNotification(msg, type = 'success') {
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      container.style.cssText = 'position: fixed; top: 20px; left: 50%; transform: translateX(-50%); z-index: 9999; display: flex; flex-direction: column; align-items: center; gap: 8px; pointer-events: none;';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast-notification ${type}`;
    toast.style.cssText = `
      display: flex; align-items: center; gap: 12px;
      padding: 14px 20px; border-radius: 12px;
      background: rgba(30, 30, 50, 0.95);
      backdrop-filter: blur(20px);
      border: 1px solid rgba(255,255,255,0.1);
      box-shadow: 0 8px 32px rgba(0,0,0,0.3);
      color: #fff; font-size: 14px; max-width: 320px;
      opacity: 0; transform: translateY(-20px);
      transition: opacity 0.3s ease, transform 0.3s ease;
      pointer-events: auto;
    `;

    const icons = {
      success: '✓',
      warning: '⚠',
      error: '✕',
      info: 'ℹ'
    };
    const icon = icons[type] || icons.info;

    const iconColors = {
      success: '#4ECDC4',
      warning: '#FFD93D',
      error: '#FF6B6B',
      info: '#74B9FF'
    };

    toast.innerHTML = `
      <div class="toast-icon" style="width: 28px; height: 28px; border-radius: 50%; background: ${iconColors[type] || iconColors.info}22; color: ${iconColors[type] || iconColors.info}; display: flex; align-items: center; justify-content: center; font-size: 14px; flex-shrink: 0;">${icon}</div>
      <div class="toast-message" style="line-height: 1.4;">${msg}</div>
    `;

    container.appendChild(toast);

    // Animate in
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        toast.style.opacity = '1';
        toast.style.transform = 'translateY(0)';
      });
    });

    // Remove after 3s
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(-20px)';
      setTimeout(() => {
        if (toast.parentNode) {
          toast.remove();
        }
      }, 300);
    }, 3000);
  },

  // ---------------------------------------------------------------------------
  // Location Theming
  // ---------------------------------------------------------------------------

  /**
   * Apply CSS custom properties for location-based theming.
   * @param {object|null} loc - location object or null to reset
   */
  applyLocationTheme(loc) {
    const root = document.documentElement;
    if (!loc) {
      root.style.removeProperty('--theme-primary');
      root.style.removeProperty('--theme-secondary');
      root.style.removeProperty('--theme-glow');
      root.style.removeProperty('--theme-bg-gradient');
      this.currentTheme = null;
      return;
    }

    const primary = loc.color;
    const secondary = loc.theme ? loc.theme.secondary : loc.color;
    const glow = loc.glowColor;

    root.style.setProperty('--theme-primary', primary);
    root.style.setProperty('--theme-secondary', secondary);
    root.style.setProperty('--theme-glow', glow);
    root.style.setProperty('--theme-bg-gradient', `radial-gradient(ellipse at center, ${glow}22 0%, transparent 70%)`);

    this.currentTheme = { primary, secondary, glow };
  },

  // =========================================================================
  // PRIVATE HELPERS
  // =========================================================================

  /**
   * Render the tree growth stage on the profile screen.
   */
  _renderTreeStage() {
    const container = document.getElementById('profile-stats');
    if (!container) return;

    if (!TREE_STAGES || !Array.isArray(TREE_STAGES) || TREE_STAGES.length === 0) {
      container.innerHTML = `
        <div class="tree-display">
          <div class="tree-icon">🌱</div>
          <div class="tree-label">Начните практику, чтобы вырастить дерево</div>
        </div>
      `;
      return;
    }

    // Find current stage based on total minutes
    let currentStage = TREE_STAGES[0];
    for (let i = TREE_STAGES.length - 1; i >= 0; i--) {
      if (this.state.totalMinutes >= TREE_STAGES[i].requiredMinutes) {
        currentStage = TREE_STAGES[i];
        break;
      }
    }

    // Progress to next stage
    const stageIndex = TREE_STAGES.indexOf(currentStage);
    const nextStage = TREE_STAGES[stageIndex + 1];
    const progressPercent = nextStage
      ? Math.min(100, ((this.state.totalMinutes - currentStage.requiredMinutes) /
          (nextStage.requiredMinutes - currentStage.requiredMinutes)) * 100)
      : 100;

    container.innerHTML = `
      <div class="tree-display">
        <div class="tree-icon" style="font-size: 48px; filter: drop-shadow(0 0 20px ${currentStage.glowColor || '#4ECDC4'}44);">${currentStage.icon || '🌱'}</div>
        <div class="tree-label">${currentStage.name || 'Саженец'}</div>
        <div class="tree-desc">${currentStage.desc || 'Продолжайте практику!'}</div>
        ${nextStage ? `
          <div class="tree-progress-bar" style="width: 100%; height: 6px; background: rgba(255,255,255,0.1); border-radius: 3px; margin-top: 8px; overflow: hidden;">
            <div class="tree-progress-fill" style="width: ${progressPercent}%; height: 100%; background: linear-gradient(90deg, #4ECDC4, #96CEB4); border-radius: 3px; transition: width 0.5s ease;"></div>
          </div>
          <div class="tree-next">До следующей стадии: ${nextStage.requiredMinutes - this.state.totalMinutes} мин</div>
        ` : '<div class="tree-max">Максимальная стадия достигнута! 🎉</div>'}
      </div>
    `;
  },

  /**
   * Render the achievements grid on the profile screen.
   */
  _renderAchievements() {
    const container = document.getElementById('profile-achievements');
    if (!container) return;

    if (!ACHIEVEMENTS_DEF || !Array.isArray(ACHIEVEMENTS_DEF)) {
      container.innerHTML = '';
      return;
    }

    container.innerHTML = ACHIEVEMENTS_DEF.map((ach) => {
      const unlocked = this.state.achievements.includes(ach.id);
      return `
        <div class="achievement-card ${unlocked ? 'unlocked' : 'locked'} glass-panel" title="${ach.desc}">
          <div class="achievement-icon" style="opacity: ${unlocked ? 1 : 0.3};">${ach.icon || '🏆'}</div>
          <div class="achievement-title">${ach.title}</div>
          ${!unlocked ? '<div class="achievement-lock">🔒</div>' : ''}
        </div>
      `;
    }).join('');
  },

  /**
   * Render the track selector on the profile screen.
   */
  _renderTrackSelector() {
    const container = document.getElementById('profile-settings');
    if (!container) return;

    const tracks = [
      { id: 'balance', name: 'Баланс', color: '#4ECDC4' },
      { id: 'focus', name: 'Фокус', color: '#FF6B6B' },
      { id: 'relax', name: 'Расслабление', color: '#96CEB4' },
      { id: 'sleep', name: 'Сон', color: '#9B59B6' }
    ];

    container.innerHTML = tracks.map((track) => `
      <button class="track-option ${this.state.track === track.id ? 'active' : ''}"
              onclick="app.setTrack('${track.id}')"
              style="--track-color: ${track.color};">
        ${track.name}
      </button>
    `).join('');
  },

  /**
   * Set the user's preferred track.
   * @param {string} trackId
   */
  setTrack(trackId) {
    this.state.track = trackId;
    this.saveState();
    this._renderTrackSelector();
    this.updateAIRecommendation();
    this.showNotification('Предпочтение обновлено', 'success');
  },

  /**
   * Show a confirmation dialog and reset all user progress.
   */
  _confirmReset() {
    if (confirm('Вы уверены, что хотите сбросить весь прогресс? Это действие нельзя отменить.')) {
      this.resetProgress();
    }
  },

  /**
   * Reset all user progress to defaults.
   */
  resetProgress() {
    this.state = {
      totalMinutes: 0,
      totalSeconds: 0,
      sessions: [],
      streak: { current: 0, longest: 0, lastDate: null },
      achievements: [],
      track: 'balance',
      onboarding: false,
      selectedLocation: null,
      globalRevealShown: false
    };

    this.saveState();
    this.renderProfile();
    this.renderMap();
    this.updateGreeting();
    this.updateAIRecommendation();
    this.showNotification('Весь прогресс сброшен', 'info');
  },

  /**
   * Render decorative stars for sleep cards.
   * @param {number} count
   * @returns {string}
   */
  _renderStars(count) {
    return Array.from({ length: count }, () => {
      const x = Math.random() * 80 + 10;
      const y = Math.random() * 60 + 10;
      const size = Math.random() * 2 + 1;
      const opacity = Math.random() * 0.5 + 0.3;
      return `<div style="position: absolute; left: ${x}%; top: ${y}%; width: ${size}px; height: ${size}px; background: rgba(255,255,255,${opacity}); border-radius: 50%;"></div>`;
    }).join('');
  },

  /**
   * Get the current tree stage based on total minutes.
   * @returns {object}
   */
  _getCurrentTreeStage() {
    if (!TREE_STAGES || !Array.isArray(TREE_STAGES)) return { id: 'seed', name: 'Семя', requiredMinutes: 0 };
    let stage = TREE_STAGES[0];
    for (let i = 0; i < TREE_STAGES.length; i++) {
      if (this.state.totalMinutes >= TREE_STAGES[i].requiredMinutes) {
        stage = TREE_STAGES[i];
      }
    }
    return stage;
  },

  /**
   * Get the next tree stage after current.
   * @returns {object|null}
   */
  _getNextTreeStage() {
    if (!TREE_STAGES || !Array.isArray(TREE_STAGES)) return null;
    for (let i = 0; i < TREE_STAGES.length; i++) {
      if (this.state.totalMinutes < TREE_STAGES[i].requiredMinutes) {
        return TREE_STAGES[i];
      }
    }
    return null;
  },

  /**
   * Convert hex color to rgba string.
   * @param {string} hex
   * @param {number} alpha
   * @returns {string}
   */
  _hexToRgba(hex, alpha) {
    let c = hex.replace('#', '');
    if (c.length === 3) {
      c = c.split('').map(ch => ch + ch).join('');
    }
    const num = parseInt(c, 16);
    const r = (num >> 16) & 255;
    const g = (num >> 8) & 255;
    const b = num & 255;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  },

  /**
   * Get a date key string (YYYY-MM-DD) from a Date object.
   * @param {Date} date
   * @returns {string}
   */
  _dateKey(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  },

  /**
   * Parse a date key string back into a Date object.
   * @param {string} key
   * @returns {Date}
   */
  _parseDateKey(key) {
    const [y, m, d] = key.split('-').map(Number);
    return new Date(y, m - 1, d);
  },

  /**
   * Calculate the number of days between two Date objects.
   * @param {Date} d1
   * @param {Date} d2
   * @returns {number}
   */
  _daysBetween(d1, d2) {
    const msPerDay = 86400000;
    const t1 = Date.UTC(d1.getFullYear(), d1.getMonth(), d1.getDate());
    const t2 = Date.UTC(d2.getFullYear(), d2.getMonth(), d2.getDate());
    return Math.floor((t2 - t1) / msPerDay);
  }
};

// =============================================================================
// Boot
// =============================================================================
document.addEventListener('DOMContentLoaded', () => app.init());