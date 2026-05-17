/**
 * player.js — Meditation timer & 4-7-8 breathing exercise state machine
 *
 * Provides two module-level objects:
 *   - player   : Manages meditation playback (play / pause / seek / progress).
 *   - breathing: Runs the 4-7-8 breathing state machine (inhale 4s / hold 7s / exhale 8s).
 *
 * Both objects depend on `app` (defined in app.js which loads after this file).
 */

// ─────────────────────────────────────────────────────────────────────────────
//  PLAYER  — Meditation Timer / Progress Bar / Controls
// ─────────────────────────────────────────────────────────────────────────────

const player = {
  meditation: null,  // Currently active meditation object (id, title, desc, duration)
  running: false,    // Is the timer ticking?
  remaining: 0,      // Seconds left on the timer
  total: 0,          // Total duration in seconds
  interval: null,    // setInterval handle (play tick)

  /**
   * Loads a meditation into the player UI and switches to the player screen.
   * @param {Object} meditation — { id, title, desc, duration (seconds) }
   */
  start(meditation) {
    this.meditation = meditation;
    this.total      = meditation.duration;
    this.remaining  = meditation.duration;
    this.running    = false;

    document.getElementById('player-title').textContent    = meditation.title;
    document.getElementById('player-subtitle').textContent = meditation.desc;

    this.updateDisplay();
    this.updateProgress(0);
    app.navigate('player');
  },

  /** Toggles between play and pause. */
  toggle() {
    this.running ? this.pause() : this.play();
  },

  /** Starts the countdown timer. */
  play() {
    this.running = true;
    document.getElementById('play-icon').style.display  = 'none';
    document.getElementById('pause-icon').style.display = 'block';
    document.getElementById('breathing-circle').classList.add('active');

    this.interval = setInterval(() => {
      this.remaining--;
      this.updateDisplay();
      this.updateProgress(((this.total - this.remaining) / this.total) * 100);

      if (this.remaining <= 0) {
        this.complete();
      }
    }, 1000);
  },

  /** Pauses the countdown timer. */
  pause() {
    this.running = false;
    clearInterval(this.interval);
    document.getElementById('play-icon').style.display  = 'block';
    document.getElementById('pause-icon').style.display = 'none';
    document.getElementById('breathing-circle').classList.remove('active');
  },

  /**
   * Skips forward or backward by a number of seconds.
   * @param {number} seconds — Positive = forward, negative = backward.
   */
  skip(seconds) {
    this.remaining = Math.max(0, Math.min(this.total, this.remaining - seconds));
    this.updateDisplay();
    this.updateProgress(((this.total - this.remaining) / this.total) * 100);
  },

  /**
   * Seeks to a position by clicking on the progress bar.
   * @param {MouseEvent} event — Click event on the progress bar.
   */
  seek(event) {
    const bar     = event.currentTarget;
    const percent = event.offsetX / bar.offsetWidth;
    this.remaining = Math.floor(this.total * (1 - percent));
    this.updateDisplay();
    this.updateProgress(percent * 100);
  },

  /** Called automatically when remaining reaches 0. Saves session and navigates back. */
  complete() {
    this.pause();

    const completed = this.total - this.remaining;
    app.saveSession(this.meditation.id, completed);
    app.showNotification(
      'Медитация завершена! +' + Math.floor(completed / 60) + ' мин',
      'success'
    );

    setTimeout(() => app.goBack(), 2000);
  },

  /** Updates the MM:SS timer display on the player screen. */
  updateDisplay() {
    const mins = Math.floor(this.remaining / 60);
    const secs = this.remaining % 60;
    document.getElementById('timer-display').textContent =
      String(mins).padStart(2, '0') + ':' + String(secs).padStart(2, '0');
  },

  /**
   * Updates the progress bar fill width.
   * @param {number} percent — 0 to 100.
   */
  updateProgress(percent) {
    document.getElementById('progress-fill').style.width = percent + '%';
  },

  /** Hard-resets the player state (used when leaving the player screen). */
  reset() {
    this.pause();
    this.meditation = null;
    this.remaining  = 0;
    this.total      = 0;
  }
};


// ─────────────────────────────────────────────────────────────────────────────
//  BREATHING  — 4-7-8 Breathing Exercise State Machine
// ─────────────────────────────────────────────────────────────────────────────

const breathing = {
  running:     false,   // Is the breathing exercise active?
  interval:    null,    // setTimeout handle (phase tick)
  phase:       'idle',  // Current phase: 'idle' | 'inhale' | 'hold' | 'exhale'
  counter:     0,       // Seconds remaining in current phase
  startTime:   0,       // Timestamp when exercise started
  totalElapsed: 0,      // Total elapsed time in ms when stopped

  // Phase durations in milliseconds
  TIMING: { inhale: 4000, hold: 7000, exhale: 8000 },

  // Ordered list of phases for the cycle
  PHASES: ['inhale', 'hold', 'exhale'],

  // UI text for each phase
  TEXT: {
    inhale: {
      label:       'Вдохни глубоко',
      instruction: 'Медленно вдыхайте через нос, наполняя живот воздухом'
    },
    hold: {
      label:       'Задержи дыхание',
      instruction: 'Считайте про себя, сохраняя спокойствие'
    },
    exhale: {
      label:       'Выдыхай медленно',
      instruction: 'Полностью выдохните через рот, расслабляясь'
    }
  },

  // Cached DOM references (populated on start)
  $: {},

  /** Caches DOM element references for the breathing exercise UI. */
  cacheDOM() {
    this.$ = {
      visual:      document.getElementById('breathing-visual'),
      phase:       document.getElementById('breath-phase'),
      counter:     document.getElementById('breath-counter'),
      instruction: document.getElementById('breathing-instruction'),
      toggle:      document.getElementById('breathing-toggle')
    };
  },

  /** Toggles between start and stop of the breathing exercise. */
  toggle() {
    this.running ? this.stop() : this.start();
  },

  /** Starts the 4-7-8 breathing cycle. */
  start() {
    this.cacheDOM();
    this.running      = true;
    this.startTime    = Date.now();
    this.totalElapsed = 0;

    this.$.toggle.textContent = 'Завершить';
    this.$.toggle.classList.add('active');

    this.transitionTo('inhale');
  },

  /** Stops the breathing exercise, saves the session if long enough, and resets UI. */
  stop() {
    this.running = false;
    if (this.interval) clearTimeout(this.interval);

    this.totalElapsed = Date.now() - this.startTime;
    const elapsedSeconds = Math.floor(this.totalElapsed / 1000);

    // Update UI to "done" state
    this.$.visual.setAttribute('data-phase', 'idle');
    this.$.phase.textContent       = 'Готово';
    this.$.counter.textContent     = '✓';
    this.$.instruction.textContent =
      `Практика завершена (${Math.floor(elapsedSeconds / 60)}:${String(elapsedSeconds % 60).padStart(2, '0')})`;

    this.$.toggle.textContent = 'Начать';
    this.$.toggle.classList.remove('active');

    // Save session only if it lasted more than 30 seconds
    if (elapsedSeconds > 30) {
      const minutes = Math.ceil(elapsedSeconds / 60);
      app.saveBreathingSession(elapsedSeconds, minutes);
      app.showNotification(`Дыхание завершено! +${minutes} мин`, 'success');
    } else {
      app.showNotification('Слишком короткая сессия — не сохранена', 'warning');
    }
  },

  /**
   * Transitions to a new breathing phase.
   * @param {string} phaseName — 'inhale' | 'hold' | 'exhale'
   */
  transitionTo(phaseName) {
    if (!this.running) return;

    this.phase   = phaseName;
    this.counter = Math.floor(this.TIMING[phaseName] / 1000);

    // CSS transitions are driven by the data-phase attribute
    this.$.visual.setAttribute('data-phase', phaseName);

    const text = this.TEXT[phaseName];
    this.$.phase.textContent       = text.label;
    this.$.instruction.textContent = text.instruction;

    this.tickPhase(phaseName);
  },

  /**
   * Counts down within the current phase and transitions to the next phase.
   * @param {string} phaseName — Expected current phase (guards against stale timers).
   */
  tickPhase(phaseName) {
    if (!this.running || this.phase !== phaseName) return;

    this.$.counter.textContent = this.counter;

    if (this.counter > 0) {
      this.counter--;
      this.interval = setTimeout(() => this.tickPhase(phaseName), 1000);
    } else {
      // Advance to the next phase in the cycle
      const nextIndex = (this.PHASES.indexOf(phaseName) + 1) % this.PHASES.length;
      this.transitionTo(this.PHASES[nextIndex]);
    }
  }
};
