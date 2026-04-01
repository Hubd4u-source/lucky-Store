# DESIGN SYSTEM — LogiCrowned Asset Store
**Theme:** Dark & Creative — Video Editors / Designers
**Accent:** Steel Blue #4A90D9
**Version:** 1.0

---

## 1. COLOR PALETTE

```
/* Core */
--bg-base:        #080808;   /* Page background */
--bg-surface:     #0F0F0F;   /* Cards, panels */
--bg-surface-2:   #161616;   /* Inputs, hover states */
--bg-surface-3:   #1E1E1E;   /* Active states, selected */

/* Borders */
--border-subtle:  #1F1F1F;   /* Dividers */
--border-default: #2C2C2C;   /* Card borders */
--border-strong:  #3A3A3A;   /* Focus rings */

/* Text */
--text-primary:   #EDEDED;   /* Headlines, labels */
--text-secondary: #888888;   /* Descriptions, metadata */
--text-muted:     #4A4A4A;   /* Placeholders */

/* Accent — Steel Blue */
--accent:         #4A90D9;   /* Primary CTA, active filters */
--accent-dim:     #2E6AAD;   /* Hover on accent */
--accent-ghost:   rgba(74, 144, 217, 0.08); /* Subtle bg tint */
--accent-border:  rgba(74, 144, 217, 0.25); /* Accent-tinted border */

/* Status */
--success:        #3A7D44;
--danger:         #8B2020;
--danger-dim:     #6B1818;
--warning:        #8B6914;
```

---

## 2. TYPOGRAPHY

```css
/* Import */
@import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500&family=JetBrains+Mono:wght@400;500&display=swap');

/* Scale */
--font-display:   'Syne', sans-serif;      /* Logo, section headers */
--font-body:      'DM Sans', sans-serif;   /* All body text, UI */
--font-mono:      'JetBrains Mono', mono;  /* Tags, badges, metadata */

/* Sizes */
--text-xs:    11px;
--text-sm:    13px;
--text-base:  15px;
--text-md:    17px;
--text-lg:    20px;
--text-xl:    24px;
--text-2xl:   32px;
--text-3xl:   44px;

/* Weights */
--weight-regular: 400;
--weight-medium:  500;
--weight-semi:    600;
--weight-bold:    700;
--weight-black:   800;

/* Line Heights */
--leading-tight:  1.2;
--leading-normal: 1.5;
--leading-loose:  1.7;
```

---

## 3. SPACING SYSTEM

Base unit: **8px**

```
--space-1:   4px
--space-2:   8px
--space-3:   12px
--space-4:   16px
--space-5:   20px
--space-6:   24px
--space-8:   32px
--space-10:  40px
--space-12:  48px
--space-16:  64px
--space-20:  80px
--space-24:  96px
```

---

## 4. BORDER SYSTEM

```css
/* NO border-radius ANYWHERE — zero exceptions */
--radius: 0px;

/* Border styles */
--border-card:   1px solid var(--border-default);
--border-input:  1px solid var(--border-strong);
--border-accent: 1px solid var(--accent-border);
```

---

## 5. GRID SYSTEM

```css
/* Desktop (≥1024px) */
--grid-cols-store:  3;
--grid-gap:         20px;
--container-max:    1280px;
--container-pad:    40px;

/* Tablet (768px–1023px) */
--grid-cols-tablet: 2;
--container-pad-md: 24px;

/* Mobile (<768px) */
--grid-cols-mobile: 1;
--container-pad-sm: 16px;
```

---

## 6. COMPONENT RULES

### Asset Card
```
Background:       var(--bg-surface)
Border:           var(--border-card)
Border-radius:    0px — NONE
Padding:          0px (image bleeds to edges)
Image area:       aspect-ratio 4/3, object-fit cover
Content padding:  var(--space-4)
Title:            font-body, weight-medium, text-base, text-primary
Format badge:     font-mono, text-xs, uppercase, accent-ghost bg
Download button:  full width, accent bg, weight-semi, text-sm
Hover state:      border-color → accent-border, NO scale/transform
```

### Download Button
```
Background:       var(--accent)
Hover:            var(--accent-dim)
Text:             var(--bg-base) — dark text on blue
Font:             font-body, weight-semi, text-sm, uppercase, letter-spacing 0.08em
Padding:          12px 0
Width:            100% within card
Border-radius:    0px
Border:           none
Transition:       background 150ms ease
```

### Filter Button (inactive)
```
Background:       var(--bg-surface-2)
Border:           var(--border-default)
Text:             var(--text-secondary)
Font:             font-mono, text-xs, uppercase
Padding:          8px 16px
Border-radius:    0px
```

### Filter Button (active)
```
Background:       var(--accent-ghost)
Border:           var(--accent-border)
Text:             var(--accent)
```

### Input / Search
```
Background:       var(--bg-surface-2)
Border:           var(--border-input)
Text:             var(--text-primary)
Placeholder:      var(--text-muted)
Font:             font-body, text-base
Padding:          12px 16px
Border-radius:    0px
Focus border:     var(--accent)
Outline:          none
```

### Admin Form Field
```
Same as Input
Label:            font-mono, text-xs, uppercase, text-secondary, letter-spacing 0.1em
Margin-bottom:    var(--space-6)
```

### Admin Table Row
```
Border-bottom:    var(--border-subtle)
Padding:          12px 16px
Hover:            bg-surface-2
Status dot:       6px square (NOT circle) — green #3A7D44 or grey #4A4A4A
```

### Badge
```
Font:             font-mono, text-xs, uppercase
Padding:          3px 8px
Border-radius:    0px
PNG badge:        bg #1A2A1A, text #3A7D44, border 1px solid #2A3A2A
JPG badge:        bg #1A1F2A, text #4A90D9, border 1px solid #2A2F3A
```

### Modal
```
Backdrop:         rgba(0,0,0,0.85)
Container:        bg-surface, border-default, NO radius
Max-width:        480px mobile / 560px desktop
Padding:          var(--space-8)
Close button:     top-right, text-secondary, 24x24
```

---

## 7. MOTION RULES

Minimal animation only. No flashy effects.

```css
/* Allowed transitions */
--transition-fast:   150ms ease;    /* Hover colors */
--transition-base:   200ms ease;    /* Modals, dropdowns */
--transition-slow:   300ms ease;    /* Page-level */

/* NO: */
/* - Keyframe bounce animations */
/* - Scale transforms on hover */
/* - Parallax */
/* - Entrance animations on grid cards */
/* - Any animation that delays content */

/* Allowed: */
/* - opacity fade on modal open */
/* - color/border transitions on hover */
/* - translateY(-2px) on download button hover ONLY */
```

---

## 8. ICONOGRAPHY

- **Library:** Lucide Icons (stroke-based, consistent weight)
- **Size:** 16px default, 20px for nav
- **Color:** Inherits text color
- **NO filled icons**
- **NO emoji in UI** (emoji only allowed in asset titles if user adds them)

---

## 9. SCROLLBAR

```css
::-webkit-scrollbar { width: 4px; }
::-webkit-scrollbar-track { background: var(--bg-base); }
::-webkit-scrollbar-thumb { background: var(--border-strong); }
::-webkit-scrollbar-thumb:hover { background: var(--accent); }
```

---

## 10. RESPONSIVE BREAKPOINTS

```css
--bp-sm:  480px
--bp-md:  768px
--bp-lg:  1024px
--bp-xl:  1280px
--bp-2xl: 1536px
```

---

*File: DESIGN_SYSTEM.md | LogiCrowned Asset Store v1.0*
