// studio-mode.js — Inline edit + unlock + reorder + theme switching
(() => {
  const PWD = '1234'; // uses same server password; server check is used on unlock
  const qs = s => document.querySelector(s);
  const qsa = s => Array.from(document.querySelectorAll(s));
  const api = async (url, opts) => {
    const res = await fetch(url, opts);
    try { return await res.json(); } catch(e){ return null; }
  };

  // apply initial theme if server saved one
  async function applySavedTheme() {
    const cfg = await api('/api/get_settings');
    if(cfg && cfg.theme_name) {
      document.body.classList.add(cfg.theme_name);
    } else if(cfg && cfg.bg_color) {
      document.body.style.background = cfg.bg_color;
    }
  }

  // inject unlock button
  function injectUnlock() {
    if(qs('#edit-unlock-btn')) return;
    const btn = document.createElement('button');
    btn.id = 'edit-unlock-btn';
    btn.innerText = '🔒 Edit';
    btn.title = 'Enter Studio Mode';
    btn.onclick = showPasswordPrompt;
    document.body.appendChild(btn);
  }

  // password prompt
  function showPasswordPrompt() {
    const p = prompt('Enter Studio password:');
    if(!p) return;
    // verify with server
    api('/api/login', {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({password:p})})
      .then(j => {
        if(j && j.ok) enterStudio(); else alert('Wrong password');
      }).catch(()=>alert('Network error'));
  }

  // entrance animation + enable editing
  async function enterStudio() {
    // animation: add class
    document.documentElement.classList.add('studio-activating');
    setTimeout(()=>document.documentElement.classList.add('studio-on'), 420);

    // init inline editing
    enableInlineEditable();
    initGallerySortable();
    injectThemePicker();
    injectToolbar();
  }

  function exitStudio() {
    document.documentElement.classList.remove('studio-on','studio-activating');
    location.reload();
  }

  // enable editing for .editable elements
  function enableInlineEditable(){
    qsa('.editable').forEach(el=>{
      el.setAttribute('contenteditable','true');
      el.classList.add('studio-editable');
      el.addEventListener('blur', debounce(async ev=>{
        const key = el.getAttribute('data-key') || el.id || ('text_' + Math.random().toString(36).slice(2,8));
        const value = el.innerHTML;
        await api('/api/settings', {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({[key]: value})});
        showSavedToast();
      }, 700));
      // keyboard save on ctrl+s
      el.addEventListener('keydown', ev => {
        if((ev.ctrlKey || ev.metaKey) && ev.key.toLowerCase() === 's'){
          ev.preventDefault(); el.blur();
        }
      });
    });

    // images with data-setting can be clicked to upload
    qsa('img[data-setting]').forEach(img => {
      img.style.cursor = 'pointer';
      img.title = 'Click to replace image';
      img.addEventListener('click', async () => {
        const file = await pickFile();
        if(!file) return;
        const up = await uploadFile(file);
        if(up && up.ok){
          img.src = `/uploads/${up.filename}`;
          const key = img.getAttribute('data-setting');
          await api('/api/settings', {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({[key]: up.filename})});
          showSavedToast();
        } else alert('Upload failed');
      });
    });

    // hero background area if present (data-setting)
    const hero = qs('[data-setting="hero_bg"]');
    if(hero){
      hero.title = 'Click to change hero background';
      hero.style.cursor = 'pointer';
      hero.addEventListener('click', async ()=>{
        const file = await pickFile(); if(!file) return;
        const up = await uploadFile(file);
        if(up && up.ok){
          hero.style.backgroundImage = `url('/uploads/${up.filename}')`;
          await api('/api/settings', {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({'hero_bg': up.filename})});
          showSavedToast();
        } else alert('Upload failed');
      });
    }
  }

  // gallery reorder using SortableJS for .gallery-grid
  function initGallerySortable(){
    const grid = qs('.gallery-grid, .gallery-strip');
    if(!grid || !window.Sortable) return;
    if(grid.sortableInstance) grid.sortableInstance.destroy();
    grid.sortableInstance = Sortable.create(grid, {
      animation: 160,
      handle: '.g-item',
      onEnd: async () => {
        // gather order of data-id attributes
        const ids = Array.from(grid.querySelectorAll('.g-item')).map(el => parseInt(el.getAttribute('data-id'))).filter(Boolean);
        if(ids.length){
          await api('/api/reorder', {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({order: ids})});
          showSavedToast();
        }
      }
    });
  }

  // theme picker (save theme_name to server)
  function injectThemePicker(){
    if(qs('#theme-picker')) return;
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
    div.style.position='fixed'; div.style.left='12px'; div.style.top='12px'; div.style.zIndex=99999;
    div.style.background='rgba(255,255,255,0.95)'; div.style.padding='8px'; div.style.borderRadius='8px'; div.style.boxShadow='0 8px 28px rgba(0,0,0,0.12)';
    document.body.appendChild(div);
    const sel = qs('#theme-select-inline');
    // set current theme
    api('/api/get_settings').then(cfg=>{
      if(cfg && cfg.theme_name) sel.value = cfg.theme_name;
    });
    sel.onchange = async () => {
      const val = sel.value;
      // save theme_name
      await api('/api/settings', {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({'theme_name': val})});
      // apply quickly by reloading page or swapping class
      location.href = location.pathname; // simple: reload to allow server/template to set correct theme class
    }
  }

  // small toolbar for uploading gallery quick-add & exit
  function injectToolbar(){
    if(qs('#studio-toolbar')) return;
    const bar = document.createElement('div');
    bar.id = 'studio-toolbar';
    bar.style.position='fixed'; bar.style.right='12px'; bar.style.top='12px'; bar.style.zIndex=99999;
    bar.style.display='flex'; bar.style.gap='8px'; bar.style.background='rgba(255,255,255,0.97)'; bar.style.padding='6px'; bar.style.borderRadius='8px'; bar.style.boxShadow='0 10px 30px rgba(0,0,0,0.12)';
    bar.innerHTML = `<button id="add-media">+ Add Media</button><button id="exit-studio">Exit</button>`;
    document.body.appendChild(bar);
    qs('#add-media').onclick = async ()=>{
      const f = await pickFile(); if(!f) return;
      const up = await uploadFile(f);
      if(up && up.ok) location.reload(); else alert('Upload failed');
    };
    qs('#exit-studio').onclick = exitStudio;
  }

  // file picker
  function pickFile(){
    return new Promise(resolve=>{
      const i = document.createElement('input'); i.type='file'; i.accept='image/*,video/*';
      i.onchange = ()=> resolve(i.files[0] || null);
      i.click();
    });
  }

  // upload file to /api/upload
  async function uploadFile(file){
    const fd = new FormData(); fd.append('file', file); fd.append('category','Studio'); fd.append('ftype', file.type && file.type.startsWith('video') ? 'video' : 'photo');
    const res = await fetch('/api/upload', {method:'POST', body: fd});
    try { return await res.json(); } catch(e) { return null; }
  }

  function showSavedToast(){
    if(qs('#studio-saved')) {
      qs('#studio-saved').classList.add('studio-saved-show');
      setTimeout(()=>qs('#studio-saved').classList.remove('studio-saved-show'), 1000);
      return;
    }
    const t = document.createElement('div'); t.id='studio-saved'; t.innerText='Saved'; t.style.position='fixed'; t.style.right='18px'; t.style.bottom='18px';
    t.style.background='#2ecc71'; t.style.color='#fff'; t.style.padding='8px 12px'; t.style.borderRadius='20px'; t.style.zIndex=99999; document.body.appendChild(t);
    setTimeout(()=>t.remove(), 1200);
  }

  // debounce utility
  function debounce(fn,wait=300){ let t; return (...a)=>{ clearTimeout(t); t=setTimeout(()=>fn(...a), wait);} }

  // init
  document.addEventListener('DOMContentLoaded', async ()=>{
    await applySavedTheme();
    injectUnlock();
  });

  // expose small functions globally for template buttons
  window.unlockStudio = showPasswordPrompt;
  window.exitStudioMode = exitStudio;
})();
