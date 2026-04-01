# ADMIN PANEL — LogiCrowned Asset Store
**Routes:** `/admin/login` + `/admin/dashboard`
**Access:** Single admin only — password protected via Firebase Auth
**Version:** 1.0

---

## 1. LAYOUT OVERVIEW

```
/admin/login
┌──────────────────────────────────┐
│         LOGICROWNED              │
│         Admin Access             │
│                                  │
│   Email ___________________      │
│   Password _________________     │
│                                  │
│   [ Sign In ]                    │
│                                  │
│   Error message (if any)         │
└──────────────────────────────────┘

/admin/dashboard
┌────────────────────────────────────────────────────┐
│ ADMIN HEADER                                       │
│ Logo | "Admin Panel" | [Add Asset] | [Sign Out]    │
├──────────────────┬─────────────────────────────────┤
│ SIDEBAR          │ MAIN CONTENT                    │
│ - All Assets     │ Asset Table / Add Form          │
│ - Add New        │                                 │
│ - Hidden         │                                 │
└──────────────────┴─────────────────────────────────┘
```

---

## 2. LOGIN PAGE

**File:** `app/admin/login/page.tsx`

### Structure
```tsx
<main class="login-page">
  <div class="login-box">
    <div class="login-logo">
      <span class="logo-logic">LOGIC</span>
      <span class="logo-crowned">CROWNED</span>
    </div>
    <p class="login-label">Admin Panel</p>

    <form class="login-form" onSubmit={handleLogin}>
      <div class="field-group">
        <label>Email</label>
        <input type="email" value={email} onChange={...} required />
      </div>

      <div class="field-group">
        <label>Password</label>
        <input type="password" value={password} onChange={...} required />
      </div>

      {error && <p class="login-error">{error}</p>}

      <button type="submit" class="login-submit" disabled={loading}>
        {loading ? 'Signing in...' : 'Sign In'}
      </button>
    </form>
  </div>
</main>
```

### Auth Logic
```typescript
async function handleLogin(e) {
  e.preventDefault();
  setLoading(true);
  setError('');

  try {
    const result = await signInWithEmailAndPassword(auth, email, password);

    // Double-check: only allow ADMIN_EMAIL
    if (result.user.email !== process.env.NEXT_PUBLIC_ADMIN_EMAIL) {
      await signOut(auth);
      setError('Access denied.');
      return;
    }

    // Set session cookie via API route
    const idToken = await result.user.getIdToken();
    await fetch('/api/auth/session', {
      method: 'POST',
      body: JSON.stringify({ idToken }),
      headers: { 'Content-Type': 'application/json' }
    });

    router.push('/admin/dashboard');
  } catch (err) {
    setError('Invalid credentials.');
  } finally {
    setLoading(false);
  }
}
```

### Styles
```css
.login-page {
  min-height: 100vh;
  background: var(--bg-base);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-4);
}

.login-box {
  width: 100%;
  max-width: 380px;
  background: var(--bg-surface);
  border: var(--border-card);
  padding: var(--space-10) var(--space-8);
}

.login-logo {
  font-family: var(--font-display);
  font-size: var(--text-xl);
  letter-spacing: 0.04em;
  margin-bottom: var(--space-1);
}

.logo-logic    { color: var(--text-primary); font-weight: 800; }
.logo-crowned  { color: var(--accent); font-weight: 400; }

.login-label {
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.1em;
  margin-bottom: var(--space-8);
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
}

.field-group label {
  display: block;
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--text-secondary);
  margin-bottom: var(--space-2);
}

.login-error {
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  color: #c0392b;
  border-left: 2px solid #c0392b;
  padding-left: var(--space-3);
}

.login-submit {
  width: 100%;
  background: var(--accent);
  color: var(--bg-base);
  border: none;
  font-family: var(--font-body);
  font-size: var(--text-sm);
  font-weight: var(--weight-semi);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  padding: 14px;
  cursor: pointer;
  transition: background var(--transition-fast);
}

.login-submit:hover  { background: var(--accent-dim); }
.login-submit:disabled { opacity: 0.5; cursor: not-allowed; }
```

---

## 3. DASHBOARD — ADMIN HEADER

**File:** `components/admin/AdminHeader.tsx`

```
┌──────────────────────────────────────────────────────┐
│  LOGICROWNED / Admin   [+ Add Asset]   [Sign Out]    │
└──────────────────────────────────────────────────────┘
```

```css
.admin-header {
  height: 56px;
  background: var(--bg-surface);
  border-bottom: 1px solid var(--border-default);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 var(--space-6);
  position: sticky;
  top: 0;
  z-index: 100;
}

.admin-header-left {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.admin-breadcrumb {
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.admin-header-right {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.btn-add-asset {
  background: var(--accent);
  color: var(--bg-base);
  border: none;
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  padding: 8px 16px;
  cursor: pointer;
}

.btn-signout {
  background: transparent;
  color: var(--text-muted);
  border: 1px solid var(--border-default);
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  padding: 8px 16px;
  cursor: pointer;
}
```

---

## 4. ASSET TABLE COMPONENT

**File:** `components/admin/AssetTable.tsx`

### Structure
```tsx
<div class="admin-table-wrap">
  <div class="table-toolbar">
    <span class="table-count">{total} assets</span>
    <div class="table-filters">
      <button>[All]</button>
      <button>[Visible]</button>
      <button>[Hidden]</button>
    </div>
  </div>

  <table class="asset-table">
    <thead>
      <tr>
        <th>Preview</th>
        <th>Title</th>
        <th>Format</th>
        <th>Tags</th>
        <th>Downloads</th>
        <th>Status</th>
        <th>Actions</th>
      </tr>
    </thead>
    <tbody>
      {assets.map(asset => (
        <tr key={asset.id}>
          <td><img src={asset.previewUrl} class="table-thumb" /></td>
          <td class="table-title">{asset.title}</td>
          <td><span class="format-badge">{asset.format}</span></td>
          <td class="table-tags">{asset.tags.join(', ')}</td>
          <td class="table-count">{asset.downloadCount}</td>
          <td>
            <button
              class={`status-toggle ${asset.visible ? 'visible' : 'hidden'}`}
              onClick={() => toggleVisibility(asset.id, asset.visible)}
            >
              {asset.visible ? 'Visible' : 'Hidden'}
            </button>
          </td>
          <td class="table-actions">
            <button onClick={() => openEdit(asset)}>Edit</button>
            <button onClick={() => openDelete(asset.id)} class="danger">Delete</button>
          </td>
        </tr>
      ))}
    </tbody>
  </table>
</div>
```

### Styles
```css
.admin-table-wrap {
  background: var(--bg-surface);
  border: var(--border-card);
}

.table-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-4) var(--space-5);
  border-bottom: var(--border-subtle) 1px solid;
}

.asset-table {
  width: 100%;
  border-collapse: collapse;
}

.asset-table thead th {
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--text-muted);
  padding: var(--space-3) var(--space-4);
  text-align: left;
  border-bottom: 1px solid var(--border-subtle);
}

.asset-table tbody tr {
  border-bottom: 1px solid var(--border-subtle);
  transition: background var(--transition-fast);
}

.asset-table tbody tr:hover {
  background: var(--bg-surface-2);
}

.asset-table tbody td {
  padding: var(--space-3) var(--space-4);
  font-size: var(--text-sm);
  color: var(--text-secondary);
  vertical-align: middle;
}

.table-thumb {
  width: 48px;
  height: 36px;
  object-fit: cover;
  display: block;
  background: var(--bg-surface-3);
}

.table-title {
  color: var(--text-primary) !important;
  font-weight: var(--weight-medium);
  max-width: 200px;
}

/* Status toggle */
.status-toggle {
  font-family: var(--font-mono);
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  padding: 3px 10px;
  border: none;
  cursor: pointer;
}

.status-toggle.visible {
  background: rgba(58, 125, 68, 0.15);
  color: #3A7D44;
  border: 1px solid rgba(58, 125, 68, 0.3);
}

.status-toggle.hidden {
  background: var(--bg-surface-3);
  color: var(--text-muted);
  border: 1px solid var(--border-default);
}

/* Action buttons */
.table-actions {
  display: flex;
  gap: var(--space-2);
}

.table-actions button {
  font-family: var(--font-mono);
  font-size: 10px;
  text-transform: uppercase;
  padding: 4px 10px;
  background: transparent;
  border: 1px solid var(--border-default);
  color: var(--text-secondary);
  cursor: pointer;
  transition: border-color var(--transition-fast),
              color var(--transition-fast);
}

.table-actions button:hover {
  border-color: var(--accent);
  color: var(--accent);
}

.table-actions button.danger:hover {
  border-color: var(--danger);
  color: var(--danger);
}
```

---

## 5. ASSET FORM COMPONENT (Add / Edit)

**File:** `components/admin/AssetForm.tsx`
**Used in:** Modal for Add, Modal for Edit (pre-filled)

### Fields
```
1. Title          → text input, required
2. Format         → select: PNG | JPG | SVG | PACK
3. Tags           → text input, comma-separated, parsed to array
4. Preview Image  → file upload, image only, max 2MB
5. Asset File     → file upload, any format, max 50MB
6. Visible        → toggle switch (visible from launch or hidden draft)
```

### Structure
```tsx
<form class="asset-form" onSubmit={handleSubmit}>

  <div class="field-group">
    <label>Title</label>
    <input type="text" name="title" required maxLength={100} />
  </div>

  <div class="form-row">
    <div class="field-group">
      <label>Format</label>
      <select name="format">
        <option>PNG</option>
        <option>JPG</option>
        <option>SVG</option>
        <option>PACK</option>
      </select>
    </div>

    <div class="field-group">
      <label>Visible on launch</label>
      <div class="toggle-wrap">
        <input type="checkbox" id="visible" name="visible" checked />
        <label for="visible" class="toggle-label"></label>
      </div>
    </div>
  </div>

  <div class="field-group">
    <label>Tags (comma separated)</label>
    <input type="text" name="tags" placeholder="robot, hand, png, 3d" />
  </div>

  <div class="field-group">
    <label>Preview Image</label>
    <div class="file-drop" data-type="image">
      {previewFile
        ? <img src={previewUrl} class="file-preview-thumb" />
        : <span>Click or drag image here</span>
      }
      <input type="file" accept="image/*" onChange={handlePreviewUpload} />
    </div>
    <span class="field-hint">JPG or PNG, max 2MB</span>
  </div>

  <div class="field-group">
    <label>Asset File</label>
    <div class="file-drop" data-type="asset">
      {assetFile
        ? <span class="file-name">{assetFile.name}</span>
        : <span>Click or drag file here</span>
      }
      <input type="file" onChange={handleAssetUpload} />
    </div>
    <span class="field-hint">Any format, max 50MB</span>
  </div>

  {uploadProgress > 0 && uploadProgress < 100 && (
    <div class="upload-progress">
      <div class="progress-bar" style={{ width: `${uploadProgress}%` }} />
      <span>{uploadProgress}%</span>
    </div>
  )}

  <div class="form-actions">
    <button type="button" class="btn-cancel" onClick={onClose}>Cancel</button>
    <button type="submit" class="btn-save" disabled={submitting}>
      {submitting ? 'Saving...' : (isEdit ? 'Save Changes' : 'Add Asset')}
    </button>
  </div>

</form>
```

### Upload Logic
```typescript
async function handleSubmit(e) {
  e.preventDefault();

  // 1. Upload preview image to Firebase Storage: previews/{filename}
  // 2. Upload asset file to Firebase Storage: assets/{docId}/{filename}
  // 3. Get preview public URL (previews are public)
  // 4. Store fileStoragePath (NOT signed URL) for asset file
  // 5. Write to Firestore: assets collection
  // 6. On success: close modal, refresh table

  const storageRef = ref(storage, `previews/${uuid()}_${previewFile.name}`);
  await uploadBytesResumable(storageRef, previewFile, {
    onProgress: (snapshot) =>
      setUploadProgress((snapshot.bytesTransferred / snapshot.totalBytes) * 100)
  });

  const previewUrl = await getDownloadURL(storageRef);
  // ... rest of upload + Firestore write
}
```

### File Drop Styles
```css
.file-drop {
  border: 1px dashed var(--border-strong);
  background: var(--bg-surface-2);
  padding: var(--space-6);
  text-align: center;
  position: relative;
  cursor: pointer;
  transition: border-color var(--transition-fast);
}

.file-drop:hover {
  border-color: var(--accent);
}

.file-drop input[type="file"] {
  position: absolute;
  inset: 0;
  opacity: 0;
  cursor: pointer;
}

.upload-progress {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  color: var(--accent);
}

.progress-bar {
  height: 2px;
  background: var(--accent);
  flex: 1;
  transition: width 100ms linear;
}
```

---

## 6. DELETE CONFIRM MODAL

**File:** `components/admin/DeleteConfirm.tsx`

```tsx
<div class="modal-backdrop">
  <div class="modal-container" style={{ maxWidth: '400px' }}>
    <p class="delete-warning">Delete this asset?</p>
    <p class="delete-sub">
      This will permanently remove the asset and its file from storage.
      This action cannot be undone.
    </p>
    <div class="form-actions">
      <button class="btn-cancel" onClick={onClose}>Cancel</button>
      <button class="btn-danger" onClick={handleDelete}>
        {loading ? 'Deleting...' : 'Delete'}
      </button>
    </div>
  </div>
</div>
```

```css
.delete-warning {
  font-family: var(--font-body);
  font-size: var(--text-md);
  font-weight: var(--weight-semi);
  color: var(--text-primary);
}

.delete-sub {
  font-size: var(--text-sm);
  color: var(--text-secondary);
  line-height: var(--leading-normal);
}

.btn-danger {
  background: var(--danger);
  color: #fff;
  border: none;
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  padding: 10px 20px;
  cursor: pointer;
}

.btn-danger:hover { background: var(--danger-dim); }
```

---

## 7. DELETE LOGIC

```typescript
async function handleDelete(assetId: string) {
  // 1. Get asset doc to find fileStoragePath + previewUrl
  const doc = await getDoc(assetRef);
  const { fileStoragePath, previewUrl } = doc.data();

  // 2. Delete file from Storage
  await deleteObject(ref(storage, fileStoragePath));

  // 3. Delete preview from Storage (extract path from URL)
  await deleteObject(ref(storage, getPathFromUrl(previewUrl)));

  // 4. Delete Firestore document
  await deleteDoc(assetRef);

  // 5. Refresh table
}
```

---

## 8. MOBILE ADMIN NOTES

On mobile (<768px), the dashboard table collapses to a card list view:
```
Each asset shows:
- Thumbnail (40x30)
- Title
- Format badge
- Status toggle
- Edit / Delete buttons stacked vertically
```

The Add Asset form becomes full-screen modal with scroll.

---

*File: ADMIN_PANEL.md | LogiCrowned Asset Store v1.0*
