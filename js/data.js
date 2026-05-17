/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║                    ШТИЛЬ (Shtil) — Data Layer v3.0.0                        ║
 * ║              Premium Meditation App — Core Data Definitions                 ║
 * ╠══════════════════════════════════════════════════════════════════════════════╣
 * ║  This module defines the complete static data layer for the Shtil           ║
 * ║  meditation application. All configuration, content, and metadata          ║
 * ║  is declared here as immutable constants.                                  ║
 * ║                                                                             ║
 * ║  Data categories:                                                           ║
 * ║    1. MEDITATIONS     — 15 guided meditation sessions                      ║
 * ║    2. LOCATIONS_V2    — 5 progressive world locations                      ║
 * ║    3. ACHIEVEMENTS_DEF— 10 unlockable achievements                         ║
 * ║    4. TREE_STAGES     — 7 growth stages for the personal tree              ║
 * ║    5. APP_VERSION     — Semantic version string                            ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 */

'use strict';

/* ──────────────────────────────────────────────────────────────────────────────
 *  APP VERSION
 *  ──────────────────────────────────────────────────────────────────────────── */

/** Semantic version string — used for cache-busting, update prompts, etc. */
const APP_VERSION = '3.0.0-premium';

/* ──────────────────────────────────────────────────────────────────────────────
 *  PREMIUM COLOR PALETTE (Dark-Theme Compatible)
 *  ════════════════════════════════════════════════════════════════════════════
 *  These colors are carefully chosen for premium dark UI backgrounds.
 *  Each hue has sufficient contrast against dark surfaces (#0A0A0A–#1A1A2E)
 *  while maintaining a calming, non-intrusive aesthetic.
 *
 *    Cyan    #06B6D4  — Breath, clarity, focus
 *    Teal    #5BA89C  — Balance, calm, nature
 *    Gold    #E8A838  — Gratitude, warmth, enlightenment
 *    Purple  #8B7EC8  — Sleep, depth, spirituality
 *    Green   #6B9E5A  — Growth, vitality, mountain energy
 *    Rose    #D480A0  — Compassion, anxiety relief, love
 *    Amber   #D4A840  — Energy, urgency, SOS moments
 *  ──────────────────────────────────────────────────────────────────────────── */

/** Premium dark-theme color palette for meditation categories. */
const COLORS = {
  cyan:   '#06B6D4',
  teal:   '#5BA89C',
  gold:   '#E8A838',
  purple: '#8B7EC8',
  green:  '#6B9E5A',
  rose:   '#D480A0',
  amber:  '#D4A840',
};

/* ──────────────────────────────────────────────────────────────────────────────
 *  MEDITATIONS
 *  ════════════════════════════════════════════════════════════════════════════
 *  15 guided meditation sessions covering breathing, body scan, guided
 *  visualisation, and sleep stories. Each meditation maps to a progressive
 *  path location (chill → balance → path).
 *
 *  Schema: { id, title, desc, duration, track, type, difficulty, target, color }
 *  ──────────────────────────────────────────────────────────────────────────── */

/** @type {Array<Object>} — Complete collection of 15 meditation sessions. */
const MEDITATIONS = [
  /* ── Location 1: Долина Дыхания (Valley of Breath) ─────────────────────── */
  {
    id: 'm1',
    title: 'Дыхание 4-7-8',
    desc: 'Древняя техника дыхания для мгновенного расслабления. Вдох на 4 счета, задержка на 7, выдох на 8. Снимает тревогу и готовит к сну.',
    duration: 300,              // 5 minutes
    track: 'breathe_478',
    type: 'breathing',
    difficulty: 'beginner',
    target: 'relaxation',
    color: COLORS.cyan,         // Cyan — clarity of breath
  },
  {
    id: 'm2',
    title: 'Утренняя энергия',
    desc: 'Мягкое пробуждение тела и разума. Начните день с осознанности и лёгкой энергии, наполняющей каждую клетку.',
    duration: 600,              // 10 minutes
    track: 'morning_energy',
    type: 'guided',
    difficulty: 'beginner',
    target: 'energy',
    color: COLORS.teal,         // Teal — fresh morning energy
  },
  {
    id: 'm4',
    title: 'Снятие тревоги',
    desc: 'Глубокая практика для освобождения от беспокойства. Позвольте тревоге раствориться, как дымка под утренним солнцем.',
    duration: 480,              // 8 minutes
    track: 'anxiety_release',
    type: 'guided',
    difficulty: 'beginner',
    target: 'anxiety',
    color: COLORS.rose,         // Rose — gentle anxiety relief
  },
  {
    id: 'm5',
    title: 'Момент благодарности',
    desc: 'Пауза для осознания того, что уже есть. Благодарность открывает сердце и меняет восприятие всего вокруг.',
    duration: 360,              // 6 minutes
    track: 'gratitude_moment',
    type: 'guided',
    difficulty: 'beginner',
    target: 'gratitude',
    color: COLORS.gold,         // Gold — warmth of gratitude
  },

  /* ── Location 2: Морской Прибой (Sea Surf) ──────────────────────────────── */
  {
    id: 'm6',
    title: 'Перезагрузка фокуса',
    desc: 'Быстрая перезагрузка внимания посреди рабочего дня. Верните ясность мышления за считанные минуты.',
    duration: 300,              // 5 minutes
    track: 'focus_reboot',
    type: 'guided',
    difficulty: 'beginner',
    target: 'focus',
    color: COLORS.cyan,         // Cyan — mental clarity
  },
  {
    id: 'm7',
    title: 'Обеденное спокойствие',
    desc: 'Мини-перерыв для восстановления сил. Отпустите утреннюю напряжённость и наберитесь энергии для второй половины дня.',
    duration: 600,              // 10 minutes
    track: 'midday_calm',
    type: 'guided',
    difficulty: 'beginner',
    target: 'relaxation',
    color: COLORS.teal,         // Teal — midday balance
  },
  {
    id: 'm8',
    title: 'Вечернее расслабление',
    desc: 'Плавное погружение в вечернее спокойствие. Смойте напряжение дня и подготовьтесь к отдыху.',
    duration: 720,              // 12 minutes
    track: 'evening_relax',
    type: 'guided',
    difficulty: 'intermediate',
    target: 'relaxation',
    color: COLORS.amber,        // Amber — warm evening glow
  },

  /* ── Location 3: Озеро Фокуса (Focus Lake) ─────────────────────────────── */
  {
    id: 'm9',
    title: 'Медитация ходьбы',
    desc: 'Осознанная ходьба — медитация в движении. Каждый шаг становится якорем для присутствия здесь и сейчас.',
    duration: 600,              // 10 minutes
    track: 'walking_meditation',
    type: 'guided',
    difficulty: 'intermediate',
    target: 'mindfulness',
    color: COLORS.green,        // Green — movement in nature
  },
  {
    id: 'm10',
    title: 'Медитация любящей доброты',
    desc: 'Метта — распространение тёплых чувств к себе и всем существам. Раскройте сердце бескондициональной любви.',
    duration: 480,              // 8 minutes
    track: 'loving_kindness',
    type: 'guided',
    difficulty: 'intermediate',
    target: 'compassion',
    color: COLORS.rose,         // Rose — love and compassion
  },
  {
    id: 'm13',
    title: 'Горная визуализация',
    desc: 'Путешествие к величественной горной вершине. С каждым шагом выше — новый взгляд на свою жизнь и мир.',
    duration: 780,              // 13 minutes
    track: 'mountain_visual',
    type: 'guided',
    difficulty: 'intermediate',
    target: 'clarity',
    color: COLORS.purple,       // Purple — elevated awareness
  },

  /* ── Location 4: Горная Вершина (Mountain Peak) ─────────────────────────── */
  {
    id: 'm11',
    title: 'Глубокое погружение',
    desc: 'Продолжительная медитация для опытных практиков. Глубокое погружение в тишину, за которой открывается ясность.',
    duration: 1200,             // 20 minutes
    track: 'deep_dive',
    type: 'guided',
    difficulty: 'advanced',
    target: 'insight',
    color: COLORS.purple,       // Purple — depth and spirituality
  },
  {
    id: 'm14',
    title: 'Баланс чакр',
    desc: 'Путешествие по семи энергетическим центрам. Восстановление гармонии и единства тела, разума и духа.',
    duration: 600,              // 10 minutes
    track: 'chakra_balance',
    type: 'guided',
    difficulty: 'advanced',
    target: 'energy',
    color: COLORS.gold,         // Gold — spiritual energy
  },

  /* ── Location 5: Звёздная Долина (Star Valley) ─────────────────────────── */
  {
    id: 'm3',
    title: 'Сканирование тела для сна',
    desc: 'Медленное путешествие внимания по каждой части тела. Расслабление от макушки до кончиков пальцев для глубокого засыпания.',
    duration: 900,              // 15 minutes
    track: 'body_scan_sleep',
    type: 'body_scan',
    difficulty: 'beginner',
    target: 'sleep',
    color: COLORS.purple,       // Purple — deep sleep state
  },
  {
    id: 'm12',
    title: 'Сказка: Домик у озера',
    desc: 'Успокаивающая сказка-визуализация. Представьте себе уютный домик у тихого озера и позвольте сказке убаюкать вас.',
    duration: 900,              // 15 minutes
    track: 'story_lakehouse',
    type: 'sleep',
    difficulty: 'beginner',
    target: 'sleep',
    color: COLORS.cyan,         // Cyan — dreamy lake waters
  },
  {
    id: 'm15',
    title: 'SOS Спокойствие',
    desc: 'Экспресс-практика для критических моментов. Всего минута — и вы вернёте контроль, ясность и внутренний покой.',
    duration: 60,               // 1 minute
    track: 'sos_calm',
    type: 'breathing',
    difficulty: 'beginner',
    target: 'calm',
    color: COLORS.amber,        // Amber — urgent yet calming
  },
];

/* ──────────────────────────────────────────────────────────────────────────────
 *  LOCATIONS_V2 — THE 5-LOCATION PROGRESSIVE SYSTEM
 *  ════════════════════════════════════════════════════════════════════════════
 *  Five themed locations form a progression path. Each location unlocks after
 *  accumulating a required number of meditation minutes. Locations 2–5 start
 *  locked and reveal themselves as the user practices.
 *
 *  Schema per location:
 *    { id, name, nameEn, desc, shortDesc, requiredMinutes, unlocked, icon,
 *      color, glowColor, bgColor, theme, subMap }
 *
 *  subMap Schema:
 *    { title, subtitle, visualization, detailDesc, meditationIds }
 *  ──────────────────────────────────────────────────────────────────────────── */

/** @type {Array<Object>} — Five progressive world locations. */
const LOCATIONS_V2 = [
  {
    id: 1,
    name: 'Долина Дыхания',
    nameEn: 'Valley of Breath',
    desc: 'Тихая долина, где каждый вдох наполняет покоем. Здесь начинается путь внутрь себя.',
    shortDesc: 'Начало пути — свободное дыхание',
    requiredMinutes: 0,
    unlocked: true,
    icon: '\uD83C\uDF2C\uFE0F',  // 🌬️
    color: '#06B6D4',           // Cyan
    glowColor: 'rgba(6, 182, 212, 0.4)',
    bgColor: '#0B1F2A',
    theme: {
      primary:   '#06B6D4',
      secondary: '#22D3EE',
      bg:        '#0B1F2A',
      accent:    '#67E8F9',
    },
    subMap: {
      title:        'Долина Дыхания',
      subtitle:     '1/5 Общей Карты',
      visualization: 'valley',   // CSS renders valley shapes
      detailDesc:   'Долина Дыхания — сердце мира Штиль. Здесь ветер шепчет древние мантры, а каждый вдох открывает новые грани осознанности. Практикуйте дыхание, чтобы раскрыть силу этой земли.',
      meditationIds: ['m1', 'm2', 'm4', 'm5'],
    },
  },
  {
    id: 2,
    name: 'Морской Прибой',
    nameEn: 'Sea Surf',
    desc: 'Волны шепчут о вечном. Откройте умение слышать тишину между волнами.',
    shortDesc: 'Сила океана в ваших руках',
    requiredMinutes: 15,
    unlocked: false,
    icon: '\uD83C\uDF0A',  // 🌊
    color: '#4A90B8',     // Ocean blue
    glowColor: 'rgba(74, 144, 184, 0.4)',
    bgColor: '#0A1A2A',
    theme: {
      primary:   '#4A90B8',
      secondary: '#5BA8C8',
      bg:        '#0A1A2A',
      accent:    '#90C8E8',
    },
    subMap: {
      title:        'Морской Прибой',
      subtitle:     '2/5 Общей Карты',
      visualization: 'ocean',   // CSS renders ocean waves
      detailDesc:   'Бескрайний океан Штиля хранит тайны глубин. Каждая волна несёт очищение, каждый прибой — приглашение к внутреннему покою. Слышите шёпот воды?',
      meditationIds: ['m6', 'm7', 'm8'],
    },
  },
  {
    id: 3,
    name: 'Озеро Фокуса',
    nameEn: 'Focus Lake',
    desc: 'Зеркальная гладь воды отражает вашу ясность. Здесь рождается концентрация.',
    shortDesc: 'Ясность и концентрация',
    requiredMinutes: 30,
    unlocked: false,
    icon: '\uD83E\uDEAE',  // 🪞
    color: '#8B7EC8',     // Purple
    glowColor: 'rgba(139, 126, 200, 0.4)',
    bgColor: '#1A1530',
    theme: {
      primary:   '#8B7EC8',
      secondary: '#A89BDC',
      bg:        '#1A1530',
      accent:    '#C4B8F0',
    },
    subMap: {
      title:        'Озеро Фокуса',
      subtitle:     '3/5 Общей Карты',
      visualization: 'lake',    // CSS renders mirror-like lake
      detailDesc:   'Озеро Фокуса — зеркало разума. Его безмятежная гладь отражает истинную природу мыслей. Практикуя здесь, вы обретаете несокрушимую концентрацию.',
      meditationIds: ['m9', 'm10', 'm13'],
    },
  },
  {
    id: 4,
    name: 'Горная Вершина',
    nameEn: 'Mountain Peak',
    desc: 'Над облаками — ясность. Над ясностью — покой. Восходите выше.',
    shortDesc: 'Высота духовного роста',
    requiredMinutes: 60,
    unlocked: false,
    icon: '\u26F0\uFE0F',  // ⛰️
    color: '#6B9E5A',     // Green
    glowColor: 'rgba(107, 158, 90, 0.4)',
    bgColor: '#0F1F12',
    theme: {
      primary:   '#6B9E5A',
      secondary: '#7DA868',
      bg:        '#0F1F12',
      accent:    '#A8D890',
    },
    subMap: {
      title:        'Горная Вершина',
      subtitle:     '4/5 Общей Карты',
      visualization: 'mountain', // CSS renders mountain silhouettes
      detailDesc:   'Горная Вершина — место силы и просветления. Высоко над облаками воздух наполнен кристальной ясностью. Каждый шаг вверх — шаг к внутренней свободе.',
      meditationIds: ['m11', 'm14'],
    },
  },
  {
    id: 5,
    name: 'Звёздная Долина',
    nameEn: 'Star Valley',
    desc: 'Когда темнеет — зажигаются звёзды. И внутри тоже. Космическое пробуждение.',
    shortDesc: 'Просветление среди звёзд',
    requiredMinutes: 120,
    unlocked: false,
    icon: '\u2728',       // ✨
    color: '#D4A840',     // Gold
    glowColor: 'rgba(212, 168, 64, 0.4)',
    bgColor: '#1A1520',
    theme: {
      primary:   '#D4A840',
      secondary: '#E8C060',
      bg:        '#1A1520',
      accent:    '#F0D888',
    },
    subMap: {
      title:        'Звёздная Долина',
      subtitle:     '5/5 Общей Карты',
      visualization: 'stars',   // CSS renders starfield constellation
      detailDesc:   'Звёздная Долина — венец мира Штиль. Здесь земля касается небес, а каждая звезда — это мгновение осознанности. Полное собрание всех практик в космической гармонии.',
      meditationIds: ['m3', 'm12', 'm15'],
    },
  },
];

/* ──────────────────────────────────────────────────────────────────────────────
 *  ACHIEVEMENTS_DEF
 *  ════════════════════════════════════════════════════════════════════════════
 *  10 unlockable achievements tracking meditation streaks, total time,
 *  variety of practice, and location exploration progress.
 *
 *  Schema: { id, title, desc, icon, condition, unlocked }
 *  ──────────────────────────────────────────────────────────────────────────── */

/** @type {Array<Object>} — Ten unlockable achievements. */
const ACHIEVEMENTS_DEF = [
  {
    id: 'first',
    title: 'Первый шаг',
    desc: 'Завершите первую медитацию. Каждое великое путешествие начинается с одного шага.',
    icon: '\uD83C\uDF31',  // 🌱
    condition: { type: 'meditation_count', value: 1 },
    unlocked: false,
  },
  {
    id: 'week',
    title: '7 дней',
    desc: 'Поддерживайте ежедневную практику 7 дней подряд. Огонь дисциплины горит ярко.',
    icon: '\uD83D\uDD25',  // 🔥
    condition: { type: 'streak_days', value: 7 },
    unlocked: false,
  },
  {
    id: 'month',
    title: '30 дней',
    desc: 'Целый месяц ежедневной медитации. Алмазная дисциплина закалена временем.',
    icon: '\uD83D\uDC8E',  // 💎
    condition: { type: 'streak_days', value: 30 },
    unlocked: false,
  },
  {
    id: 'hour',
    title: '1 час',
    desc: 'Накопите 60 минут медитации. Каждая минута — инвестиция в себя.',
    icon: '\u23F1\uFE0F',  // ⏱️
    condition: { type: 'total_minutes', value: 60 },
    unlocked: false,
  },
  {
    id: 'explorer',
    title: 'Исследователь',
    desc: 'Попробуйте 3 разные медитации. Мир Штиля полон открытий.',
    icon: '\uD83D\uDDFA\uFE0F',  // 🗺️
    condition: { type: 'unique_meditations', value: 3 },
    unlocked: false,
  },
  {
    id: 'master',
    title: 'Мастер',
    desc: 'Попробуйте 6 разных медитаций. Разнообразие — путь к мастерству.',
    icon: '\uD83E\uDDD8',  // 🧘
    condition: { type: 'unique_meditations', value: 6 },
    unlocked: false,
  },
  {
    id: 'locations2',
    title: 'Путешественник',
    desc: 'Откройте Локацию 2 — Морской Прибой. Новые берега ждут смелых.',
    icon: '\uD83E\uDDED',  // 🧭
    condition: { type: 'location_unlocked', value: 2 },
    unlocked: false,
  },
  {
    id: 'locations3',
    title: 'Алхимик',
    desc: 'Откройте Локацию 3 — Озеро Фокуса. Ясность — величайшее золото.',
    icon: '\uD83D\uDD2E',  // 🔮
    condition: { type: 'location_unlocked', value: 3 },
    unlocked: false,
  },
  {
    id: 'locations4',
    title: 'Звездочёт',
    desc: 'Откройте Локацию 4 — Горную Вершину. Выше облаков — звёзды ярче.',
    icon: '\u2B50',       // ⭐
    condition: { type: 'location_unlocked', value: 4 },
    unlocked: false,
  },
  {
    id: 'locations5',
    title: 'Просветлённый',
    desc: 'Откройте все 5 локаций мира Штиль. Путь завершён — но это лишь начало.',
    icon: '\u2600\uFE0F',  // ☀️
    condition: { type: 'location_unlocked', value: 5 },
    unlocked: false,
  },
];

/* ──────────────────────────────────────────────────────────────────────────────
 *  TREE_STAGES
 *  ════════════════════════════════════════════════════════════════════════════
 *  Seven growth stages for the personal tree visualization. Total meditation
 *  minutes determine the current stage. Cumulative thresholds ensure
 *  progressive, visible growth.
 *
 *  Schema: { id, name, nameEn, requiredMinutes, description }
 *  ──────────────────────────────────────────────────────────────────────────── */

/** @type {Array<Object>} — Seven tree growth stages linked to practice time. */
const TREE_STAGES = [
  {
    id: 'seed',
    name: 'Семя',
    nameEn: 'Seed',
    requiredMinutes: 0,
    description: 'Крошечное семя покоя заложено в почву. Скоро оно прорастёт.',
  },
  {
    id: 'sprout',
    name: 'Саженец',
    nameEn: 'Sprout',
    requiredMinutes: 10,
    description: 'Первый росток пробился к свету. Нежное начало большого пути.',
  },
  {
    id: 'shoot',
    name: 'Росток',
    nameEn: 'Shoot',
    requiredMinutes: 30,
    description: 'Стебель крепчает, первые листья раскрываются. Растение учится солнцу.',
  },
  {
    id: 'young_tree',
    name: 'Молодое дерево',
    nameEn: 'Young Tree',
    requiredMinutes: 90,
    description: 'Молодое дерево растёт уверенно. Его тень уже даёт укрытие.',
  },
  {
    id: 'tree',
    name: 'Дерево',
    nameEn: 'Tree',
    requiredMinutes: 240,
    description: 'Зрелое дерево с могучим стволом и раскидистыми ветвями. Корни уходят глубоко.',
  },
  {
    id: 'blooming',
    name: 'Цветущее дерево',
    nameEn: 'Blooming Tree',
    requiredMinutes: 600,
    description: 'Волшебное цветение — награда за упорство. Аромат медитации наполняет мир.',
  },
  {
    id: 'wisdom',
    name: 'Древо мудрости',
    nameEn: 'Tree of Wisdom',
    requiredMinutes: 1500,
    description: 'Древо мудрости — символ просветлённого разума. Его листья шепчут истины бытия.',
  },
];

/* ──────────────────────────────────────────────────────────────────────────────
 *  DERIVED HELPERS (non-enumerable data accessors)
 *  ════════════════════════════════════════════════════════════════════════════
 *  Convenience functions for the rest of the app to query data efficiently.
 *  These are pure — they only read from the const arrays above.
 *  ──────────────────────────────────────────────────────────────────────────── */

/**
 * Get a single meditation by its ID.
 * @param {string} id — Meditation ID (e.g. 'm1').
 * @returns {Object|undefined}
 */
function getMeditationById(id) {
  return MEDITATIONS.find((m) => m.id === id);
}

/**
 * Get a single location by its numeric ID.
 * @param {number} id — Location ID (1–5).
 * @returns {Object|undefined}
 */
function getLocationById(id) {
  return LOCATIONS_V2.find((l) => l.id === id);
}

/**
 * Get all meditations assigned to a specific location.
 * @param {number} locationId — Location ID (1–5).
 * @returns {Array<Object>}
 */
function getMeditationsForLocation(locationId) {
  const loc = getLocationById(locationId);
  if (!loc || !loc.subMap || !loc.subMap.meditationIds) return [];
  return loc.subMap.meditationIds
    .map((mid) => getMeditationById(mid))
    .filter(Boolean);
}

/**
 * Get the current tree stage based on total minutes practiced.
 * @param {number} totalMinutes — Cumulative meditation time.
 * @returns {Object}
 */
function getTreeStage(totalMinutes) {
  let current = TREE_STAGES[0];
  for (const stage of TREE_STAGES) {
    if (totalMinutes >= stage.requiredMinutes) {
      current = stage;
    } else {
      break;
    }
  }
  return current;
}

/**
 * Get the next tree stage (for progress calculation).
 * Returns `null` if already at the final stage.
 * @param {number} totalMinutes — Cumulative meditation time.
 * @returns {Object|null}
 */
function getNextTreeStage(totalMinutes) {
  const current = getTreeStage(totalMinutes);
  const idx = TREE_STAGES.indexOf(current);
  return TREE_STAGES[idx + 1] || null;
}

/**
 * Calculate progress percentage toward the next tree stage.
 * @param {number} totalMinutes — Cumulative meditation time.
 * @returns {number} — 0–100 percentage.
 */
function getTreeProgress(totalMinutes) {
  const current = getTreeStage(totalMinutes);
  const next = getNextTreeStage(totalMinutes);
  if (!next) return 100;
  const range = next.requiredMinutes - current.requiredMinutes;
  const progress = totalMinutes - current.requiredMinutes;
  return Math.min(100, Math.max(0, Math.round((progress / range) * 100)));
}

/**
 * Check if a specific location should be unlocked based on total minutes.
 * @param {number} locationId — Location ID (1–5).
 * @param {number} totalMinutes — Cumulative meditation time.
 * @returns {boolean}
 */
function isLocationUnlocked(locationId, totalMinutes) {
  const loc = getLocationById(locationId);
  if (!loc) return false;
  if (loc.id === 1) return true; // Valley of Breath is always unlocked
  return totalMinutes >= loc.requiredMinutes;
}

/**
 * Check which achievements are newly unlocked based on current stats.
 * @param {Object} stats — { meditationCount, streakDays, totalMinutes, uniqueMeditations, highestLocation }
 * @returns {Array<string>} — Array of newly unlocked achievement IDs.
 */
function checkAchievements(stats) {
  const newlyUnlocked = [];
  for (const ach of ACHIEVEMENTS_DEF) {
    if (ach.unlocked) continue;
    let achieved = false;
    switch (ach.condition.type) {
      case 'meditation_count':
        achieved = stats.meditationCount >= ach.condition.value;
        break;
      case 'streak_days':
        achieved = stats.streakDays >= ach.condition.value;
        break;
      case 'total_minutes':
        achieved = stats.totalMinutes >= ach.condition.value;
        break;
      case 'unique_meditations':
        achieved = stats.uniqueMeditations >= ach.condition.value;
        break;
      case 'location_unlocked':
        achieved = stats.highestLocation >= ach.condition.value;
        break;
    }
    if (achieved) newlyUnlocked.push(ach.id);
  }
  return newlyUnlocked;
}

/* ──────────────────────────────────────────────────────────────────────────────
 *  MODULE EXPORTS (UMD-style for maximum compatibility)
 *  ──────────────────────────────────────────────────────────────────────────── */

if (typeof module !== 'undefined' && module.exports) {
  // Node.js / CommonJS
  module.exports = {
    APP_VERSION,
    COLORS,
    MEDITATIONS,
    LOCATIONS_V2,
    ACHIEVEMENTS_DEF,
    TREE_STAGES,
    getMeditationById,
    getLocationById,
    getMeditationsForLocation,
    getTreeStage,
    getNextTreeStage,
    getTreeProgress,
    isLocationUnlocked,
    checkAchievements,
  };
} else if (typeof window !== 'undefined') {
  // Browser — attach to global Shtil namespace
  window.Shtil = window.Shtil || {};
  window.Shtil.Data = {
    APP_VERSION,
    COLORS,
    MEDITATIONS,
    LOCATIONS_V2,
    ACHIEVEMENTS_DEF,
    TREE_STAGES,
    getMeditationById,
    getLocationById,
    getMeditationsForLocation,
    getTreeStage,
    getNextTreeStage,
    getTreeProgress,
    isLocationUnlocked,
    checkAchievements,
  };
  // Also expose directly as globals for backward compatibility
  window.APP_VERSION = APP_VERSION;
  window.COLORS = COLORS;
  window.MEDITATIONS = MEDITATIONS;
  window.LOCATIONS_V2 = LOCATIONS_V2;
  window.ACHIEVEMENTS_DEF = ACHIEVEMENTS_DEF;
  window.TREE_STAGES = TREE_STAGES;
}
