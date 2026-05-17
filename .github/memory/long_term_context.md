# Shtil Application — Long-Term Project Memory

**Last updated:** 2026-05-17
**Repository:** https://github.com/PavelDomZvuka/Shtil-Application
**Live URL:** https://paveldomzvuka.github.io/Shtil-Application/
**Current version:** 3.0.0-premium

---

## 1. Project Overview

Shtil ("Штиль") is a Single-Page Application (SPA) for meditation, breathing exercises, and sleep stories. The name means "calm after the storm" — the app's core metaphor. Users practice meditation to grow a virtual "calm tree" and progressively unlock regions on a world map.

### Tech Stack
- Vanilla JavaScript (no framework)
- CSS3 with custom properties (CSS variables)
- Semantic HTML5
- localStorage for state persistence
- GitHub Pages for hosting

### Philosophy
- Mobile-first, PWA-ready
- Deep glassmorphism / volumetric UI (inspired by Headspace, Calm, Endel)
- Progressive unlocking as motivation mechanic
- Dark cosmic aesthetic: deep indigo backgrounds, cyan neon accents

---

## 2. Architecture

### File Structure
```
├── index.html          # Main HTML shell — 4 screens + overlays
├── css/
│   └── style.css       # ~3700 lines — complete glassmorphism design system
├── js/
│   ├── data.js         # All static data: meditations, locations, achievements, tree stages
│   ├── player.js       # Meditation timer + 4-7-8 breathing state machine
│   └── app.js          # Main SPA logic: routing, state, rendering, map mechanics
```

### State Schema (localStorage key: `shtil_state`)
```javascript
{
  totalMinutes: number,       // Cumulative practice minutes
  totalSeconds: number,       // Cumulative practice seconds
  sessions: Array<{           // Individual session log
    meditationId: string,
    duration: number,         // seconds actually practiced
    date: string,             // ISO date
    type: string              // meditation type
  }>,
  streak: {
    current: number,          // Current consecutive days
    longest: number,          // Best streak ever
    lastDate: string | null   // ISO date of last practice
  },
  achievements: string[],     // Unlocked achievement IDs
  track: string,              // User preference track: balance | focus | relax | sleep
  onboarding: boolean,        // Whether onboarding was completed
  selectedLocation: number | null,  // Currently viewing location ID
  globalRevealShown: boolean  // Whether the global map reveal animation was shown
}
```

### SPA Navigation
- 4 main screens: `home`, `map`, `sleep`, `profile`
- 2 overlay screens: `player`, `breathing`
- Bottom tab bar (Home / Map / Sleep / Profile) triggers `app.navigate(screen)`
- Screens are absolutely positioned divs; `.active` class controls visibility via CSS transitions
- All screens transition with `opacity` + `translateX(30px)` animation, 0.5s cubic-bezier

---

## 3. Phase 1: Premium Glassmorphism Design System

### Color Palette
| Token | Value | Usage |
|-------|-------|-------|
| `--deep-indigo` | `#0B0F19` | Primary background |
| `--twilight-obsidian` | `#111827` | Elevated surfaces |
| `--cosmic-slate` | `#1A2235` | Card backgrounds |
| `--cyan-neon` | `rgba(6, 182, 212, 0.8)` | Active highlights, accent glow |
| `--cyan-glow` | `rgba(6, 182, 212, 0.15)` | Glow halos |
| `--glass-white` | `rgba(255, 255, 255, 0.08)` | Glass panels |
| `--glass-border` | `rgba(255, 255, 255, 0.12)` | Glass edges |
| `--glass-highlight` | `rgba(255, 255, 255, 0.18)` | Hover glass |
| `--text-primary` | `#F0F4F8` | Primary text |
| `--text-secondary` | `#94A3B8` | Secondary text |

### Glassmorphism Pattern (reused everywhere)
```css
.glass-panel {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(24px) saturate(180%);
  -webkit-backdrop-filter: blur(24px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.12);
  box-shadow:
    0 8px 32px rgba(0, 0, 0, 0.3),
    inset 0 1px 0 0 rgba(255, 255, 255, 0.1);
  border-radius: 20px;
}
```

### Animation Standard
- All transitions: `all 0.5s cubic-bezier(0.25, 0.8, 0.25, 1)`
- Hover lifts: `translateY(-4px)` + enhanced glow
- Screen transitions: `opacity` + `translateX`
- Ambient orbs: slow floating animation (CSS keyframes)
- Breathing circle: multi-layered pulsing glow

### Ambient Background
- 4 floating orbs with slow drift animation (`@keyframes float`)
- Subtle noise texture overlay via SVG data URI
- Deep gradient base layer (radial gradients for depth)

---

## 4. Phase 2: Карта Мира (Progress Map)

### Core Concept
The world is divided into 5 fragment zones. Each zone unlocks at a specific cumulative practice threshold. When all 5 are unlocked, a celebratory "Global Reveal" animation stitches the fragments together.

### 5 Locations (LOCATIONS_V2)

| # | Name | Unlock (min) | Color | Icon |
|---|------|-------------|-------|------|
| 1 | Долина Дыхания | 0 (default) | `#06B6D4` cyan | 🌬️ |
| 2 | Морской Прибой | 15 | `#4A90B8` ocean | 🌊 |
| 3 | Озеро Фокуса | 30 | `#8B7EC8` purple | 🪞 |
| 4 | Горная Вершина | 60 | `#6B9E5A` green | ⛰️ |
| 5 | Звёздная Долина | 120 | `#D4A840` gold | ✨ |

Each location object contains:
- `theme`: primary/secondary/bg/accent colors
- `subMap`: title, subtitle, visualization type, detail description, linked meditation IDs
- `visualization`: CSS mini-map type (`valley`, `ocean`, `lake`, `mountain`, `stars`)

### Unlock Flow
1. `app.renderMap()` evaluates each location against `state.totalMinutes`
2. Unlocked locations: colored glow, checkmark badge, clickable
3. Locked locations: gray overlay, lock icon, progress bar showing remaining minutes
4. Click unlocked → opens `.sub-map-modal` with location details
5. Click locked → triggers `.shake-locked` animation + toast notification

### Lock Toast (Premium Shake)
```css
@keyframes premium-shake {
  0%, 100% { transform: translateX(0); }
  10% { transform: translateX(-6px) rotate(-0.5deg); }
  20% { transform: translateX(5px) rotate(0.5deg); }
  30% { transform: translateX(-4px) rotate(-0.3deg); }
  40% { transform: translateX(3px) rotate(0.3deg); }
  50% { transform: translateX(-2px); }
  60% { transform: translateX(1px); }
  70% { transform: translateX(-1px); }
  80%, 90% { transform: translateX(0); }
}
```
Toast message: *"Пройдите ещё X минут дыхания для открытия региона «Name»"*

### Sub-Map Modal
- Full-screen overlay with `backdrop-filter: blur(20px)`
- Glass panel with volumetric depth
- Location icon (48px) with colored glow
- Mini CSS visualization (unique per location type)
- Stats: available meditations count, total practice minutes
- CTA button: *"Практиковать здесь"* — gradient styled with location color
- Entry: `scale(0.85) opacity(0)` → `scale(1) opacity(1)`, 0.5s

### Global Reveal Trigger
When `checkGlobalReveal()` detects all 5 locations unlocked AND `!globalRevealShown`:
1. Sets `globalRevealShown = true`, saves state
2. Triggers full-screen overlay (`.global-reveal-overlay`)
3. 5 fragment divs animate from scattered positions to center grid (stitch together)
4. Title: *"Общая Карта Открыта!"* with massive glow
5. Subtitle: *"Все регионы исследованы"*
6. CSS confetti particle effect (12 animated divs)
7. Auto-dismiss after 8 seconds, or click to dismiss early

---

## 5. Meditation System

### 15 Meditations
Stored in `MEDITATIONS` array with fields: `id`, `title`, `desc`, `duration` (seconds), `type`, `difficulty`, `target`, `color`.

Types: `breathing`, `guided`, `body_scan`, `sleep`, `focus`
Targets: `energy`, `gratitude`, `focus`, `clarity`, `relaxation`, `anxiety`, `sleep`

### Player (player.js)
- Timer counts down from meditation duration
- Skip +/- 15 seconds
- Click progress bar to seek
- Complete button saves session and returns to previous screen
- Breathing circle visual with active/inactive glow states

### 4-7-8 Breathing (breathing.js)
State machine cycling through: **Inhale (4s) → Hold (7s) → Exhale (8s)**
- CSS `[data-phase]` attribute drives visual states:
  - `inhale`: circle scales to 1.3x, cyan glow
  - `hold`: stable at 1.3x, gold glow
  - `exhale`: scales to 1x, teal glow
- Requires minimum 30 seconds to save as a session

---

## 6. Achievement System

### 10 Achievements (ACHIEVEMENTS_DEF)
| ID | Title | Condition |
|----|-------|-----------|
| first | Первый шаг | First meditation completed |
| week | 7 дней | 7-day streak |
| month | 30 дней | 30-day streak |
| hour | 1 час | 60 total minutes |
| explorer | Исследователь | 3 different meditations |
| master | Мастер | 6 different meditations |
| locations2 | Путешественник | Location 2 unlocked |
| locations3 | Алхимик | Location 3 unlocked |
| locations4 | Звездочёт | Location 4 unlocked |
| locations5 | Просветлённый | ALL locations unlocked |

New achievements trigger a toast notification.

---

## 7. Tree Growth System

7 stages (TREE_STAGES), each requiring cumulative practice minutes:

| Stage | Name | Required Minutes | Icon |
|-------|------|-----------------|------|
| seed | Семя | 0 | 🌱 |
| sprout | Саженец | 10 | 🌿 |
| shoot | Росток | 30 | 🍃 |
| sapling | Молодое дерево | 90 | 🌲 |
| tree | Дерево | 240 | 🌳 |
| blooming | Цветущее дерево | 600 | 🌸 |
| wisdom | Древо мудрости | 1500 | 🌳✨ |

---

## 8. Known Technical Details

### CSS Specificity
- Mobile-first (320px+)
- Tablet adjustments at 768px+
- Safe area insets for notched devices
- `min-height: 100dvh` for dynamic viewport

### localStorage Schema Migration
The `loadState()` function merges defaults with persisted data using `Object.assign()`, ensuring backward compatibility when new fields are added (like `globalRevealShown`).

### Module Loading Order
```html
<script src="js/data.js"></script>   <!-- Globals: MEDITATIONS, LOCATIONS_V2, etc. -->
<script src="js/player.js"></script> <!-- Globals: player, breathing -->
<script src="js/app.js"></script>    <!-- Globals: app -->
```

### z-index Layers
| Layer | z-index | Element |
|-------|---------|---------|
| Screens (inactive) | 1 | `.screen` |
| Screens (active) | 10 | `.screen.active` |
| Tab bar | 100 | `#tab-bar` |
| Toast | 200 | `.toast-notification` |
| Sub-map modal | 300 | `.sub-map-modal` |
| Global reveal | 9999 | `.global-reveal-overlay` |

---

## 9. Recent Changes (v3.0.0-premium)

### What Changed
- **Complete CSS rewrite**: ~3700 lines of premium glassmorphism replacing flat design
- **New color system**: Deep cosmic palette with CSS custom properties
- **Ambient background**: Floating orbs + noise texture overlay
- **Карта мира v2**: Replaced old 3-location system with 5-location progressive map
- **LOCATIONS_V2 data model**: Rich location objects with themes, sub-maps, visualizations
- **Sub-map modal system**: Per-location detailed views with mini CSS visualizations
- **Global reveal animation**: Celebratory fragment-stitching sequence
- **Premium toast system**: Glassmorphism toasts with type variants (success/warning/error)
- **Shake animation for locked locations**: Premium multi-step shake with red glow
- **Screen z-index fix**: Added `z-index: 10` to `.screen.active` to resolve overlay stacking
- **Navigate bug fix**: Set `this.screen = null` before initial `navigate('home')` to prevent early return
- **CSS `composes` removal**: Replaced invalid CSS Module syntax with proper CSS

### What Was Preserved
- All 15 meditations (unchanged data)
- Tree growth system (7 stages, same thresholds)
- Achievement definitions (10 achievements)
- Breathing 4-7-8 state machine logic
- Session saving and streak calculation
- localStorage state schema (extended with new fields)

---

## 10. Future Work / Ideas

- [ ] Service Worker for offline support (PWA)
- [ ] Push notifications for daily reminders
- [ ] Sound generation for ambient backgrounds (Web Audio API)
- [ ] Haptic feedback on mobile
- [ ] Social sharing of achievements
- [ ] Dark/light theme toggle (currently dark only)
- [ ] Animated SVG illustrations instead of CSS shapes for island/map
- [ ] Backend for cross-device sync
- [ ] Additional breathing patterns (box breathing, 4-4-4-4)
- [ ] Weekly/monthly practice charts

---

*This file should be committed after each significant update to maintain project context.*
