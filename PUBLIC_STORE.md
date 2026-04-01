# PUBLIC STORE — LogiCrowned Asset Store
**Route:** `/`
**File:** `app/page.tsx`
**Version:** 1.0

---

## 1. PAGE LAYOUT

```
┌─────────────────────────────────────────────────┐
│  HEADER                                         │
│  Logo | Search Bar | Nav Links                  │
├─────────────────────────────────────────────────┤
│  FILTER BAR                                     │
│  [All] [PNG] [JPG] [SVG] [PACK]  |  Sort ▾     │
├─────────────────────────────────────────────────┤
│                                                 │
│  ASSET GRID (3col desktop / 2col tablet         │
│              / 1col mobile)                     │
│  ┌──────┐ ┌──────┐ ┌──────┐                    │
│  │ Card │ │ Card │ │ Card │                    │
│  └──────┘ └──────┘ └──────┘                    │
│  ┌──────┐ ┌──────┐ ┌──────┐                    │
│  │ Card │ │ Card │ │ Card │                    │
│  └──────┘ └──────┘ └──────┘                    │
│                                                 │
│  [Load More]                                    │
├─────────────────────────────────────────────────┤
│  FOOTER                                         │
└─────────────────────────────────────────────────┘
```

---

## 2. HEADER COMPONENT

**File:** `components/store/Header.tsx`

### Structure
```
<header>
  ├── .header-left
  │   └── Logo (text: "LOGIC" + "CROWNED" in display font, two weights)
  ├── .header-center
  │   └── SearchBar (input with search icon)
  └── .header-right (desktop)
      ├── Nav link: Store (active)
      ├── Nav link: Blog → links to main Blogger site
      └── [Mobile] Hamburger → off-canvas menu
```

### Styles
```css
header {
  position: sticky;
  top: 0;
  z-index: 100;
  background: var(--bg-base);
  border-bottom: 1px solid var(--border-subtle);
  height: 64px;
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: var(--space-6);
  padding: 0 var(--container-pad);
}

/* Mobile */
@media (max-width: 768px) {
  header {
    grid-template-columns: auto 1fr auto;
    padding: 0 var(--space-4);
  }
  .header-center { display: none; }  /* Search moves below header on mobile */
}
```

### Logo Rules
```
Font:       Syne 800 (display)
"LOGIC":    color var(--text-primary), weight 800
"CROWNED":  color var(--accent), weight 400
Size:       text-xl desktop / text-lg mobile
Letter-spacing: 0.04em
NO logo image — text only (fast, sharp, memorable)
```

### Search Bar
```
Width:          100% of header-center column
Max-width:      480px
Icon:           Lucide Search, 16px, left-padded inside input
Placeholder:    "Search assets..."
Input style:    See DESIGN_SYSTEM.md → Input
On mobile:      Full-width bar below header, always visible
```

---

## 3. FILTER BAR COMPONENT

**File:** `components/store/FilterBar.tsx`

### Structure
```
<section class="filter-bar">
  ├── .filter-group (format filters)
  │   ├── [All]
  │   ├── [PNG]
  │   ├── [JPG]
  │   ├── [SVG]
  │   └── [PACK]
  └── .sort-group
      └── Sort dropdown: [Relevance | Latest | Random]
```

### Styles
```css
.filter-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-4) var(--container-pad);
  border-bottom: 1px solid var(--border-subtle);
  background: var(--bg-base);
  gap: var(--space-4);
}

.filter-group {
  display: flex;
  gap: var(--space-2);
  flex-wrap: wrap;
}

/* Mobile scroll */
@media (max-width: 768px) {
  .filter-bar {
    padding: var(--space-3) var(--space-4);
    flex-direction: column;
    align-items: flex-start;
  }
  .filter-group {
    overflow-x: auto;
    flex-wrap: nowrap;
    width: 100%;
    padding-bottom: var(--space-2);
    /* Hide scrollbar */
    scrollbar-width: none;
  }
}
```

### Filter Button States
```
Default:  bg-surface-2, border-default, text-secondary, font-mono text-xs uppercase
Active:   accent-ghost bg, accent-border, text-accent
Hover:    bg-surface-3, border-strong
```

### Sort Dropdown
```
Trigger:  "Sort: Latest ▾" — font-mono text-xs uppercase
Menu:     bg-surface, border-default, NO radius
Options:  Latest | Relevance | Random
Width:    160px
Position: absolute, below trigger, right-aligned
```

---

## 4. ASSET GRID COMPONENT

**File:** `components/store/AssetGrid.tsx`

### Structure
```tsx
<main class="asset-grid-container">
  <div class="asset-grid">
    {assets.map(asset => <AssetCard key={asset.id} {...asset} />)}
  </div>

  {hasMore && (
    <div class="load-more-row">
      <button class="load-more-btn">Load More</button>
    </div>
  )}

  {assets.length === 0 && <EmptyState />}
</main>
```

### Styles
```css
.asset-grid-container {
  padding: var(--space-8) var(--container-pad);
  max-width: var(--container-max);
  margin: 0 auto;
}

.asset-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
}

@media (max-width: 1024px) {
  .asset-grid { grid-template-columns: repeat(2, 1fr); }
}

@media (max-width: 600px) {
  .asset-grid { grid-template-columns: 1fr; }
  .asset-grid-container { padding: var(--space-4) var(--space-4); }
}

.load-more-row {
  display: flex;
  justify-content: center;
  padding-top: var(--space-10);
}

.load-more-btn {
  background: transparent;
  border: 1px solid var(--border-strong);
  color: var(--text-secondary);
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  text-transform: uppercase;
  letter-spacing: 0.1em;
  padding: 10px 32px;
  cursor: pointer;
  transition: border-color var(--transition-fast),
              color var(--transition-fast);
}

.load-more-btn:hover {
  border-color: var(--accent);
  color: var(--accent);
}
```

### Data Fetching
```typescript
// Pagination: 12 assets per page
// Order: by createdAt desc (default)
// Filter: where visible == true (always enforced)
// Client-side filter: format type (PNG/JPG/etc)
// Client-side sort: Latest / Random (shuffle array)

const ASSETS_PER_PAGE = 12;

// Initial load: SSR via Next.js
// Load More: client-side Firestore query with startAfter cursor
```

---

## 5. ASSET CARD COMPONENT

**File:** `components/store/AssetCard.tsx`

### Structure
```tsx
<article class="asset-card">
  <div class="card-image-wrap">
    <img src={previewUrl} alt={title} loading="lazy" />
    <span class="format-badge">{format}</span>
  </div>
  <div class="card-body">
    <h3 class="card-title">{title}</h3>
    <div class="card-tags">
      {tags.slice(0, 3).map(tag => <span class="tag">{tag}</span>)}
    </div>
    <button
      class="download-btn"
      onClick={() => openDownloadModal(id)}
    >
      Download
    </button>
  </div>
</article>
```

### Styles
```css
.asset-card {
  background: var(--bg-surface);
  border: var(--border-card);
  display: flex;
  flex-direction: column;
  transition: border-color var(--transition-fast);
}

.asset-card:hover {
  border-color: var(--accent-border);
}

.card-image-wrap {
  position: relative;
  aspect-ratio: 4 / 3;
  overflow: hidden;
  background: var(--bg-surface-2);
}

.card-image-wrap img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  transition: opacity var(--transition-base);
}

/* Loading skeleton */
.card-image-wrap img[data-loading] {
  opacity: 0;
}

.format-badge {
  position: absolute;
  top: var(--space-2);
  left: var(--space-2);
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  font-weight: var(--weight-medium);
  text-transform: uppercase;
  padding: 3px 8px;
  /* Badge color set by data-format attribute — see DESIGN_SYSTEM.md */
}

.card-body {
  padding: var(--space-4);
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  flex: 1;
}

.card-title {
  font-family: var(--font-body);
  font-size: var(--text-base);
  font-weight: var(--weight-medium);
  color: var(--text-primary);
  line-height: var(--leading-tight);
  margin: 0;
  /* Truncate at 2 lines */
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.card-tags {
  display: flex;
  gap: var(--space-1);
  flex-wrap: wrap;
}

.tag {
  font-family: var(--font-mono);
  font-size: 10px;
  color: var(--text-muted);
  background: var(--bg-surface-3);
  padding: 2px 6px;
  text-transform: lowercase;
}

.download-btn {
  width: 100%;
  background: var(--accent);
  color: var(--bg-base);
  border: none;
  font-family: var(--font-body);
  font-size: var(--text-sm);
  font-weight: var(--weight-semi);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  padding: 12px 0;
  cursor: pointer;
  margin-top: auto;
  transition: background var(--transition-fast),
              transform var(--transition-fast);
}

.download-btn:hover {
  background: var(--accent-dim);
  transform: translateY(-1px);
}

.download-btn:active {
  transform: translateY(0);
}
```

---

## 6. DOWNLOAD MODAL COMPONENT

**File:** `components/store/DownloadModal.tsx`

### Structure
```tsx
<div class="modal-backdrop" onClick={closeOnBackdrop}>
  <div class="modal-container" role="dialog">
    <button class="modal-close">✕</button>
    <div class="modal-preview">
      <img src={previewUrl} alt={title} />
    </div>
    <div class="modal-info">
      <h2>{title}</h2>
      <div class="modal-meta">
        <span class="format-badge">{format}</span>
        <span class="download-count">{downloadCount} downloads</span>
      </div>
      <div class="modal-tags">
        {tags.map(tag => <span class="tag">{tag}</span>)}
      </div>
    </div>
    <button class="modal-download-btn" onClick={handleDownload}>
      {loading ? 'Preparing...' : 'Download'}
    </button>
  </div>
</div>
```

### Behavior
```
1. User clicks Download on card
2. Modal opens with opacity fade (200ms)
3. User clicks Download inside modal
4. Button text → "Preparing..."
5. POST /api/download { assetId }
6. On success: window.open(signedUrl, '_blank')
7. Button text → "Downloaded ✓"
8. Modal can be dismissed after
```

### Styles
```css
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.85);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-4);
  animation: fadeIn 200ms ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to   { opacity: 1; }
}

.modal-container {
  background: var(--bg-surface);
  border: var(--border-card);
  width: 100%;
  max-width: 480px;
  padding: var(--space-8);
  position: relative;
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
}

.modal-preview img {
  width: 100%;
  max-height: 240px;
  object-fit: contain;
  background: var(--bg-surface-2);
}

.modal-download-btn {
  /* Same as .download-btn — full width */
}

.modal-close {
  position: absolute;
  top: var(--space-4);
  right: var(--space-4);
  background: none;
  border: none;
  color: var(--text-secondary);
  font-size: var(--text-md);
  cursor: pointer;
  padding: 0;
  line-height: 1;
}
```

---

## 7. EMPTY STATE COMPONENT

**File:** `components/store/EmptyState.tsx`

```tsx
<div class="empty-state">
  <div class="empty-icon">[ ]</div>
  <p class="empty-title">No assets found</p>
  <p class="empty-sub">Try a different search term or filter</p>
</div>
```

```css
.empty-state {
  grid-column: 1 / -1;
  text-align: center;
  padding: var(--space-20) 0;
}

.empty-icon {
  font-family: var(--font-mono);
  font-size: 40px;
  color: var(--border-strong);
  margin-bottom: var(--space-4);
}

.empty-title {
  font-family: var(--font-body);
  font-size: var(--text-lg);
  color: var(--text-secondary);
  margin-bottom: var(--space-2);
}

.empty-sub {
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.08em;
}
```

---

## 8. FOOTER COMPONENT

```
┌─────────────────────────────────────────────────┐
│  LOGICROWNED          © 2025 All rights reserved│
│  Assets for creators  Privacy | Terms | Blog    │
└─────────────────────────────────────────────────┘
```

```css
footer {
  border-top: 1px solid var(--border-subtle);
  padding: var(--space-8) var(--container-pad);
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--space-4);
}

@media (max-width: 600px) {
  footer {
    flex-direction: column;
    text-align: center;
    padding: var(--space-6) var(--space-4);
  }
}
```

---

*File: PUBLIC_STORE.md | LogiCrowned Asset Store v1.0*
