// studio.js — Full Inline Editing + Media Upload + Theme Switcher
(() => {
  const PWD = '1234'; // Studio password
  const qs = s => document.querySelector(s);
  const qsa = s => Array.from(document.querySelectorAll(s));

  // Simple fetch wrapper
  const api = async (url, opts) => {
    try {
      const res = await fetch(url, opts);
      return await res.json();
    } catch (e) { return null; }
  };

  // Apply saved theme
  async function applySavedTheme() {
    const cfg = await api('/api/get_settings');
    if (cfg && cfg.theme_name) {
      document.body.className = cfg.theme_name;
    } else if (cfg && cfg.bg_color) {
      document.body.style.background = cfg.bg_color;
    }
  }

  // Inject Unlock Button
  function injectUnlock() {
    if (qs('#edit-unlock-btn')) return;
    const btn = document.createElement('button');
    btn.id = 'edit-unlock-btn';
    btn.innerText = '🔒 Edit';
    Object.assign(btn.style, {
      position: 'fixed', left: '12px', top: '12px', zIndex: 99999,
      padding: '6px 10px', borderRadius: '8px',
      background: '#fff', boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
      cursor: 'pointer'
    });
    btn.onclick = showPasswordPrompt;
    document.body.appendChild(btn);
  }

  // Password Prompt
  function showPasswordPrompt() {
    const p = prompt('Enter Studio password:');
    if (!p) return;
    api('/api/login', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({password: p})
    }).then(j => {
      if (j && j.ok) enterStudio();
      else alert('Wrong password');
    }).catch(() => alert('Network error'));
  }

  // Enter Studio Mode
  async function enterStudio() {
    document.documentElement.classList.add('studio-activating');
    setTimeout(() => document.documentElement.classList.add('studio-on'), 400);
    enableInlineEditable();
    initGallerySortable();
    injectThemePicker();
    injectToolbar();
  }

  // Exit Studio Mode
  function exitStudio() {
    document.documentElement.classList.remove('studio-on','studio-activating');
    location.reload();
  }

  // Enable Inline Editable
  function enableInlineEditable() {
    // Text elements
    qsa('.editable').forEach(el => {
      el.setAttribute('contenteditable', 'true');
      el.classList.add('studio-editable');
      el.addEventListener('blur', debounce(async () => {
        const key = el.getAttribute('data-key') || el.id || ('text_' + Math.random().toString(36).slice(2,8));
        const value = el.innerHTML;
        await api('/api/settings', {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({[key]: value})
        });
        showSavedToast();
      }, 700));
      el.addEventListener('keydown', ev => {
        if ((ev.ctrlKey || ev.metaKey) && ev.key.toLowerCase() === 's') {
          ev.preventDefault(); el.blur();
        }
      });
    });

    // Images
    qsa('img[data-setting]').forEach(img => {
      img.style.cursor = 'pointer';
      img.title = 'Click to replace image';
      img.addEventListener('click', async () => {
        const file = await pickFile();
        if (!file) return;
        const up = await uploadFile(file);
        if (up && up.ok) {
          img.src = `/uploads/${up.filename}`;
          const key = img.getAttribute('data-setting');
          await api('/api/settings', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({[key]: up.filename})
          });
          showSavedToast();
        } else alert('Upload failed');
      });
    });

    // Hero Background
    const hero = qs('[data-setting="hero_bg"]');
    if (hero) {
      hero.style.cursor = 'pointer';
      hero.title = 'Click to change hero background';
      hero.addEventListener('click', async () => {
        const file = await pickFile(); if (!file) return;
        const up = await uploadFile(file);
        if (up && up.ok) {
          hero.style.backgroundImage = `url('/uploads/${up.filename}')`;
          hero.style.backgroundSize = 'cover';
          hero.style.backgroundPosition = 'center';
          await api('/api/settings', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({'hero_bg': up.filename})
          });
          showSavedToast();
        } else alert('Upload failed');
      });
    }
  }

  // Gallery Sortable
  function initGallerySortable() {
    const grid = qs('.gallery-grid, .gallery-strip');
    if (!grid || !window.Sortable) return;
    if (grid.sortableInstance) grid.sortableInstance.destroy();
    grid.sortableInstance = Sortable.create(grid, {
      animation: 160,
      handle: '.g-item',
      onEnd: async () => {
        const ids = Array.from(grid.querySelectorAll('.g-item'))
          .map(el => parseInt(el.getAttribute('data-id'))).filter(Boolean);
        if (ids.length) {
          await api('/api/reorder', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({order: ids})
          });
          showSavedToast();
        }
      }
    });
  }

  // Theme Picker
  function injectThemePicker() {
    if (qs('#theme-picker')) return;
    const div = document.createElement('div');
    div.id = 'theme-picker';
    div.innerHTML = `
      <label>Layout</label>
      <select id="theme-select-inline">
        <option value="theme1">Theme 1 — Luxury Hero</option>
        <option value="theme2">Theme 2 — Split Screen</option>
        <option value="theme3">Theme 3 — Masonry</option>
        <option value="theme4">Theme 4 — Video Landing</option>
        <option value="theme5">Theme 5 — Centered Profile</option>
        <option value="theme6">Theme 6 — Sidebar Nav</option>
        <option value="theme7">Theme 7 — Dark Glam</option>
        <option value="theme8">Theme 8 — Magazine</option>
        <option value="theme9">Theme 9 — Parallax</option>
        <option value="theme10">Theme 10 — Pastel Cards</option>
      </select>
    `;
    Object.assign(div.style, {
      position:'fixed', left:'12px', top:'12px', zIndex:99999,
      background:'rgba(255,255,255,0.95)', padding:'8px',
      borderRadius:'8px', boxShadow:'0 8px 28px rgba(0,0,0,0.12)'
    });
    document.body.appendChild(div);

    const sel = qs('#theme-select-inline');
    api('/api/get_settings').then(cfg => {
      if (cfg && cfg.theme_name) sel.value = cfg.theme_name;
    });

    sel.onchange = async () => {
      const val = sel.value;
      await api('/api/settings', {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify({'theme_name': val})
      });
      document.body.className = val;
      showSavedToast();
    }
  }

  // Toolbar
  function injectToolbar() {
    if (qs('#studio-toolbar')) return;
    const bar = document.createElement('div');
    bar.id = 'studio-toolbar';
    Object.assign(bar.style, {
      position:'fixed', right:'12px', top:'12px', zIndex:99999,
      display:'flex', gap:'8px',
      background:'rgba(255,255,255,0.97)', padding:'6px',
      borderRadius:'8px', boxShadow:'0 10px 30px rgba(0,0,0,0.12)'
    });
    bar.innerHTML = `<button id="add-media">+ Add Media</button><button id="exit-studio">Exit</button>`;
    document.body.appendChild(bar);

    qs('#add-media').onclick = async () => {
      const f = await pickFile(); if(!f) return;
      const up = await uploadFile(f);
      if(up && up.ok) location.reload(); else alert('Upload failed');
    };

    qs('#exit-studio').onclick = exitStudio;
  }

  // Pick File
  function pickFile() {
    return new Promise(resolve => {
      const i = document.createElement('input');
      i.type='file';
      i.accept='image/*,video/*,application/pdf';
      i.onchange = ()=>resolve(i.files[0] || null);
      i.click();
    });
  }

  // Upload File
  async function uploadFile(file) {
    const fd = new FormData();
    fd.append('file', file);
    fd.append('category','Studio');
    fd.append('ftype', file.type.startsWith('video') ? 'video' : file.type === 'application/pdf' ? 'pdf' : 'photo');
    try {
      const res = await fetch('/api/upload', {method:'POST', body: fd});
      return await res.json();
    } catch (e) { return null; }
  }

  // Saved Toast
  function showSavedToast() {
    if(qs('#studio-saved')) {
      const t = qs('#studio-saved');
      t.classList.add('studio-saved-show');
      setTimeout(()=>t.classList.remove('studio-saved-show'), 1000);
      return;
    }
    const t = document.createElement('div');
    t.id='studio-saved';
    t.innerText='Saved';
    Object.assign(t.style, {
      position:'fixed', right:'18px', bottom:'18px',
      background:'#2ecc71', color:'#fff', padding:'8px 12px',
      borderRadius:'20px', zIndex:99999
    });
    document.body.appendChild(t);
    setTimeout(()=>t.remove(),1200);
  }

  // Debounce
  function debounce(fn, wait=300){ let t; return (...a)=>{ clearTimeout(t); t=setTimeout(()=>fn(...a), wait); } }

  // Init
  document.addEventListener('DOMContentLoaded', async () => {
    await applySavedTheme();
    injectUnlock();
  });

  // Global functions
  window.unlockStudio = showPasswordPrompt;
  window.exitStudioMode = exitStudio;

})();
