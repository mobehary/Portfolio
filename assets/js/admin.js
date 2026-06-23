/* =========================================
   Admin Dashboard – Manage projects
   - Loads assets/data/projects.json
   - Auto-saves edits to localStorage
   - Save to file via File System Access API (Chrome/Edge)
   - Download as JSON fallback
   ========================================= */
(function () {
  'use strict';

  const STORAGE_KEY = 'pf_projects_v1';
  const FILE_HANDLE_KEY = 'pf_file_handle_v1'; // not directly storable but kept for ref
  const JSON_PATH = 'assets/data/projects.json';

  // ---------- State ----------
  let projects = [];
  let originalProjects = [];
  let editingId = null;
  let pendingDeleteId = null;
  let fileHandle = null; // FileSystem Access API handle
  let dragId = null;

  // ---------- DOM ----------
  const $ = id => document.getElementById(id);
  const form = $('projectForm');
  const list = $('projectsList');
  const countEl = $('projectsCount');
  const search = $('searchInput');
  const statusEl = $('adminStatus');
  const toast = $('adminToast');
  const confirmModal = new bootstrap.Modal($('confirmDeleteModal'));

  // ---------- Toast ----------
  let toastTimer;
  function showToast(msg, type = 'success', ms = 2400) {
    clearTimeout(toastTimer);
    toast.className = 'admin-toast ' + type;
    toast.innerHTML = `<i class="fa-solid ${type === 'success' ? 'fa-circle-check' : type === 'error' ? 'fa-circle-xmark' : 'fa-circle-info'} me-2"></i> ${msg}`;
    requestAnimationFrame(() => toast.classList.add('show'));
    toastTimer = setTimeout(() => toast.classList.remove('show'), ms);
  }

  function setStatus(text, kind) {
    statusEl.innerHTML = `<i class="fa-solid fa-circle"></i> ${text}`;
    statusEl.className = 'admin-status ' + (kind || '');
  }

  // ---------- Storage ----------
  function loadLocal() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (e) { return null; }
  }
  function saveLocal() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
      setStatus('Saved locally', 'is-saved');
    } catch (e) {
      showToast('Could not save locally: ' + e.message, 'error');
    }
  }

  // ---------- Init ----------
  async function init() {
    setStatus('Loading…');
    try {
      const res = await fetch(JSON_PATH + '?t=' + Date.now());
      originalProjects = await res.json();
    } catch (e) {
      originalProjects = [];
      showToast('Failed to load projects.json — starting empty.', 'warning', 3500);
    }

    const local = loadLocal();
    projects = local && Array.isArray(local) ? local : [...originalProjects];

    render();
    setStatus(local ? 'Local changes loaded' : 'Loaded from file', local ? 'is-dirty' : 'is-ok');

    // Auto-dismiss banner if previously closed
    if (localStorage.getItem('pf_banner_dismissed')) {
      $('adminBanner').style.display = 'none';
    }
  }

  // ---------- Render list ----------
  function render() {
    countEl.textContent = projects.length;
    const q = (search.value || '').trim().toLowerCase();
    const filtered = q
      ? projects.filter(p =>
        (p.title || '').toLowerCase().includes(q) ||
        (p.tools || '').toLowerCase().includes(q) ||
        (p.company || '').toLowerCase().includes(q))
      : projects;

    if (!filtered.length) {
      list.innerHTML = `<div class="admin-empty"><i class="fa-regular fa-folder-open"></i>${q ? 'No matches for &quot;' + escapeHtml(q) + '&quot;.' : 'No projects yet — add your first one!'}</div>`;
      return;
    }

    // Render most-recent first (matches public site behavior)
    const ordered = [...filtered].reverse();
    list.innerHTML = ordered.map(p => {
      const cat = p.category === 'support' ? 'support' : 'development';
      const catLabel = cat === 'support'
        ? '<span class="cat-pill cat-support"><i class="fa-solid fa-headset"></i> Support</span>'
        : '<span class="cat-pill cat-dev"><i class="fa-solid fa-code"></i> Built</span>';
      return `
      <div class="admin-row ${editingId === p.id ? 'editing' : ''}" data-id="${p.id}" draggable="true">
        <div class="admin-row-thumb" style="background-color:${p.mainColor || '#fff'}; background-image:url(${escapeAttr(p.image)});"></div>
        <div class="admin-row-info">
          <h4>${escapeHtml(p.title || 'Untitled')}</h4>
          <div class="admin-row-meta">
            ${catLabel}
            <span><i class="fa-regular fa-calendar"></i> ${escapeHtml(p.startDate || '—')}</span>
            <span><i class="fa-solid fa-building"></i> ${escapeHtml(p.company && p.company !== '#' ? p.company : 'Freelance')}</span>
          </div>
        </div>
        <div class="admin-row-actions">
          <button class="btn-edit" data-act="edit" title="Edit"><i class="fa-solid fa-pen"></i></button>
          <button class="btn-del" data-act="del" title="Delete"><i class="fa-solid fa-trash"></i></button>
        </div>
      </div>
    `;
    }).join('');
  }

  // ---------- Form helpers ----------
  function resetForm() {
    form.reset();
    editingId = null;
    $('fId').value = '';
    $('fMainColorPicker').value = '#ffffff';
    $('imagePreview').style.display = 'none';
    $('formTitle').innerHTML = '<i class="fa-solid fa-plus"></i> Add new project';
    $('submitText').textContent = 'Add project';
    render();
  }

  function fillForm(p) {
    editingId = p.id;
    $('fId').value = p.id;
    $('fTitle').value = p.title || '';
    $('fDescription').value = p.description || '';
    $('fStartDate').value = p.startDate || '';
    $('fLink').value = p.link && p.link !== '#' ? p.link : '';
    $('fTools').value = p.tools || '';
    $('fCompany').value = p.company || '';
    $('fCompanyLogo').value = p.companyLogo || '';
    $('fImage').value = p.image || '';
    $('fCategory').value = p.category === 'support' ? 'support' : 'development';
    $('fMainColor').value = p.mainColor || '';
    if (p.mainColor && /^#[0-9a-f]{6}$/i.test(p.mainColor)) {
      $('fMainColorPicker').value = p.mainColor;
    } else {
      $('fMainColorPicker').value = '#ffffff';
    }
    updatePreview(p.image);
    $('formTitle').innerHTML = '<i class="fa-solid fa-pen-to-square"></i> Edit project';
    $('submitText').textContent = 'Update project';
    render();
    $('fTitle').focus();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function readForm() {
    return {
      id: editingId || nextId(),
      title: $('fTitle').value.trim(),
      image: $('fImage').value.trim(),
      company: $('fCompany').value.trim() || '#',
      companyLogo: $('fCompanyLogo').value || 'assets/images/company/freelance.png',
      mainColor: $('fMainColor').value.trim() || undefined,
      link: $('fLink').value.trim() || '#',
      description: $('fDescription').value.trim(),
      tools: $('fTools').value.trim(),
      startDate: $('fStartDate').value.trim(),
      category: $('fCategory').value === 'support' ? 'support' : 'development'
    };
  }

  function nextId() {
    return projects.reduce((max, p) => Math.max(max, p.id || 0), 0) + 1;
  }

  function updatePreview(path) {
    const wrap = $('imagePreview');
    const img = $('imagePreviewImg');
    if (!path) { wrap.style.display = 'none'; return; }
    img.onerror = () => { wrap.style.display = 'none'; };
    img.onload = () => { wrap.style.display = 'grid'; };
    img.src = path;
  }

  // ---------- Submit ----------
  form.addEventListener('submit', e => {
    e.preventDefault();
    const data = readForm();
    if (!data.title || !data.description || !data.image || !data.tools || !data.startDate) {
      showToast('Please fill all required fields', 'error');
      return;
    }
    if (!data.mainColor) delete data.mainColor;

    if (editingId) {
      const idx = projects.findIndex(p => p.id === editingId);
      if (idx >= 0) projects[idx] = data;
      showToast('Project updated', 'success');
    } else {
      projects.push(data);
      showToast('Project added', 'success');
    }
    saveLocal();
    resetForm();
  });

  // ---------- Cancel / New ----------
  $('btnCancel').addEventListener('click', resetForm);
  $('btnNew').addEventListener('click', resetForm);

  // ---------- List interactions ----------
  list.addEventListener('click', e => {
    const btn = e.target.closest('button[data-act]');
    if (!btn) return;
    const row = btn.closest('.admin-row');
    const id = parseInt(row.dataset.id, 10);
    const project = projects.find(p => p.id === id);
    if (!project) return;

    if (btn.dataset.act === 'edit') {
      fillForm(project);
    } else if (btn.dataset.act === 'del') {
      pendingDeleteId = id;
      $('deleteName').textContent = project.title || 'Untitled';
      confirmModal.show();
    }
  });

  $('confirmDeleteBtn').addEventListener('click', () => {
    if (pendingDeleteId == null) return;
    projects = projects.filter(p => p.id !== pendingDeleteId);
    if (editingId === pendingDeleteId) resetForm();
    pendingDeleteId = null;
    saveLocal();
    render();
    confirmModal.hide();
    showToast('Project deleted', 'success');
  });

  // ---------- Drag-to-reorder ----------
  list.addEventListener('dragstart', e => {
    const row = e.target.closest('.admin-row');
    if (!row) return;
    dragId = parseInt(row.dataset.id, 10);
    row.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
  });
  list.addEventListener('dragend', e => {
    const row = e.target.closest('.admin-row');
    if (row) row.classList.remove('dragging');
    list.querySelectorAll('.drop-target').forEach(r => r.classList.remove('drop-target'));
    dragId = null;
  });
  list.addEventListener('dragover', e => {
    e.preventDefault();
    const row = e.target.closest('.admin-row');
    if (!row) return;
    list.querySelectorAll('.drop-target').forEach(r => r.classList.remove('drop-target'));
    row.classList.add('drop-target');
  });
  list.addEventListener('drop', e => {
    e.preventDefault();
    const row = e.target.closest('.admin-row');
    if (!row || dragId == null) return;
    const targetId = parseInt(row.dataset.id, 10);
    if (targetId === dragId) return;

    const fromIdx = projects.findIndex(p => p.id === dragId);
    const toIdx = projects.findIndex(p => p.id === targetId);
    if (fromIdx < 0 || toIdx < 0) return;

    // Public list shows reversed; reflect intuitive drop (drop above target)
    const [moved] = projects.splice(fromIdx, 1);
    projects.splice(toIdx, 0, moved);
    saveLocal();
    render();
    showToast('Reordered', 'success', 1600);
  });

  // ---------- Search ----------
  search.addEventListener('input', () => render());

  // ---------- Color sync ----------
  $('fMainColorPicker').addEventListener('input', e => {
    $('fMainColor').value = e.target.value.toUpperCase();
  });
  $('fMainColor').addEventListener('input', e => {
    if (/^#[0-9a-f]{6}$/i.test(e.target.value)) $('fMainColorPicker').value = e.target.value;
  });
  $('btnClearColor').addEventListener('click', () => {
    $('fMainColor').value = '';
    $('fMainColorPicker').value = '#ffffff';
  });

  // ---------- Image picker ----------
  $('fImageFile').addEventListener('change', e => {
    const file = e.target.files[0];
    if (!file) return;
    const path = 'assets/images/project/' + file.name;
    $('fImage').value = path;
    // Show preview from blob URL
    const blobUrl = URL.createObjectURL(file);
    const wrap = $('imagePreview');
    const img = $('imagePreviewImg');
    img.src = blobUrl;
    wrap.style.display = 'grid';
    showToast('Path set. Drop the file into assets/images/project/ to make it live.', 'warning', 4200);
  });
  $('fImage').addEventListener('input', e => updatePreview(e.target.value));

  // ---------- Banner dismiss ----------
  $('bannerClose').addEventListener('click', () => {
    $('adminBanner').style.display = 'none';
    localStorage.setItem('pf_banner_dismissed', '1');
  });

  // ---------- Reset ----------
  $('btnReset').addEventListener('click', async () => {
    if (!confirm('Discard all local changes and reload from projects.json?')) return;
    localStorage.removeItem(STORAGE_KEY);
    fileHandle = null;
    await init();
    showToast('Reset to file version', 'success');
  });

  // ---------- Download ----------
  $('btnDownload').addEventListener('click', () => {
    const blob = new Blob([JSON.stringify(projects, null, 4)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'projects.json';
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
    showToast('projects.json downloaded — replace the file in assets/data/', 'success', 3500);
  });

  // ---------- Import ----------
  $('btnImport').addEventListener('click', () => $('fileImport').click());
  $('fileImport').addEventListener('change', e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result);
        if (!Array.isArray(data)) throw new Error('Not a JSON array');
        if (!confirm(`Import ${data.length} project(s) and replace current list?`)) return;
        projects = data;
        saveLocal();
        render();
        showToast('Imported successfully', 'success');
      } catch (err) {
        showToast('Invalid file: ' + err.message, 'error');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  });

  // ---------- Save to file (File System Access API) ----------
  $('btnSave').addEventListener('click', async () => {
    if (!window.showSaveFilePicker && !window.showOpenFilePicker) {
      showToast('Direct save not supported in this browser. Use Download.', 'warning', 3500);
      $('btnDownload').click();
      return;
    }

    try {
      // Prompt user to pick the projects.json file (once); we keep the handle
      if (!fileHandle) {
        fileHandle = await window.showSaveFilePicker({
          suggestedName: 'projects.json',
          types: [{ description: 'JSON file', accept: { 'application/json': ['.json'] } }]
        });
      }
      const perm = await fileHandle.queryPermission({ mode: 'readwrite' });
      if (perm !== 'granted') {
        const req = await fileHandle.requestPermission({ mode: 'readwrite' });
        if (req !== 'granted') {
          showToast('Permission denied', 'error');
          return;
        }
      }
      const writable = await fileHandle.createWritable();
      await writable.write(JSON.stringify(projects, null, 4));
      await writable.close();
      setStatus('Saved to file ✓', 'is-ok');
      showToast('Saved to projects.json successfully', 'success', 3500);
    } catch (err) {
      if (err.name === 'AbortError') return;
      showToast('Save failed: ' + err.message, 'error', 3500);
    }
  });

  // ---------- Utilities ----------
  function escapeHtml(s) {
    return String(s || '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }
  function escapeAttr(s) {
    return String(s || '').replace(/"/g, '&quot;');
  }

  // ---------- Go ----------
  init();
})();
