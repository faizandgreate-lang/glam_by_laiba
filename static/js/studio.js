(() => {
  const PWD = '1234'; // studio password
  const qs = s => document.querySelector(s);
  const qsa = s => Array.from(document.querySelectorAll(s));

  const api = async (url, opts) => {
    try { const res = await fetch(url, opts); return await res.json(); }
    catch (e) { return null; }
  };

  async function applySavedSettings() {
    const cfg = await api('/api/get_settings');
    if (!cfg) return;

    // Hero
    const hero = qs('[data-setting="hero_bg"]');
    if (hero && cfg.hero_bg) hero.style.backgroundImage = `url('/uploads/${cfg.hero_bg}')`;
    const heroTitle = qs('[data-key="hero_title"]');
    if (heroTitle && cfg.hero_title) heroTitle.innerHTML = cfg.hero_title;
    const heroDesc = qs('[data-key="hero_desc"]');
    if (heroDesc && cfg.hero_desc) heroDesc.innerHTML = cfg.hero_desc;

    // Theme
    if (cfg.theme_name) document.body.className = cfg.theme_name;
  }

  function injectUnlock() {
    if (qs('#edit-unlock-btn')) return;
    const btn = document.createElement('button');
    btn.id = 'edit-unlock-btn';
    btn.innerText = '🔒 Edit';
    Object.assign(btn.style, {position:'fixed', left:'12px', top:'12px', zIndex:99999, padding:'6px 10px', borderRadius:'8px', background:'#fff', boxShadow:'0 4px 20px rgba(0,0,0,0.15)', cursor:'pointer'});
    btn.onclick = showPasswordPrompt;
    document.body.appendChild(btn);
  }

  function showPasswordPrompt() {
    const p = prompt('Enter Studio password:');
    if (!p) return;
    api('/api/login', {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({password:p})})
      .then(j => j.ok ? enterStudio() : alert('Wrong password'));
  }

  function enterStudio() {
    document.documentElement.classList.add('studio-on');
    enableEditable();
    initGallerySortable();
    injectToolbar();
  }

  function exitStudio() {
    document.documentElement.classList.remove('studio-on');
    location.reload();
  }

  function enableEditable() {
    qsa('.editable').forEach(el => {
      el.contentEditable = true;
      el.addEventListener('blur', debounce(async () => {
        const key = el.dataset.key || 'text_' + Math.random().toString(36).slice(2,8);
        await api('/api/settings', {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({[key]:el.innerHTML})});
        showSavedToast();
      }, 700));
    });

    qsa('img[data-setting]').forEach(img => {
      img.style.cursor = 'pointer';
      img.title = 'Click to replace image';
      img.addEventListener('click', async () => {
        const file = await pickFile();
        if (!file) return;
        const up = await uploadFile(file);
        if (up && up.ok) { img.src = `/uploads/${up.filename}`; await api('/api/settings', {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({[img.dataset.setting]:up.filename})}); showSavedToast(); }
      });
    });
  }

  function initGallerySortable() {
    const grid = qs('.gallery-grid');
    if (!grid || !window.Sortable) return;
    if (grid.sortableInstance) grid.sortableInstance.destroy();
    grid.sortableInstance = Sortable.create(grid, {
      animation: 160, handle: '.g-item',
      onEnd: async () => {
        const ids = Array.from(grid.querySelectorAll('.g-item')).map(el => parseInt(el.dataset.id)).filter(Boolean);
        if (ids.length) await api('/api/reorder', {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({order:ids})});
        showSavedToast();
      }
    });
  }

  function injectToolbar() {
    if (qs('#studio-toolbar')) return;
    const bar = document.createElement('div');
    bar.id = 'studio-toolbar';
    Object.assign(bar.style, {position:'fixed', right:'12px', top:'12px', zIndex:99999, display:'flex', gap:'8px', background:'rgba(255,255,255,0.97)', padding:'6px', borderRadius:'8px', boxShadow:'0 10px 30px rgba(0,0,0,0.12)'});
    bar.innerHTML = `<button id="add-media">+ Add Media</button><button id="exit-studio">Exit</button>`;
    document.body.appendChild(bar);

    qs('#add-media').onclick = async () => { const f = await pickFile(); if(!f) return; const up = await uploadFile(f); if(up && up.ok) location.reload(); else alert('Upload failed'); };
    qs('#exit-studio').onclick = exitStudio;
  }

  function pickFile() {
    return new Promise(resolve => { const i=document.createElement('input'); i.type='file'; i.accept='image/*,video/*,application/pdf'; i.onchange=()=>resolve(i.files[0]||null); i.click(); });
  }

  async function uploadFile(file) {
    const fd = new FormData();
    fd.append('file', file);
    fd.append('category','Studio');
    fd.append('ftype', file.type.startsWith('video')?'video':(file.type==='application/pdf'?'pdf':'photo'));
    try { const res = await fetch('/api/upload',{method:'POST', body:fd}); return await res.json(); } catch(e){ return null; }
  }

  function showSavedToast() {
    if(qs('#studio-saved')) { const t = qs('#studio-saved'); t.classList.add('studio-saved-show'); setTimeout(()=>t.classList.remove('studio-saved-show'),1000); return; }
    const t = document.createElement('div'); t.id='studio-saved'; t.innerText='Saved'; Object.assign(t.style,{position:'fixed', right:'18px', bottom:'18px', background:'#2ecc71', color:'#fff', padding:'8px 12px', borderRadius:'20px', zIndex:99999}); document.body.appendChild(t); setTimeout(()=>t.remove(),1200);
  }

  function debounce(fn, wait=300){ let t; return (...a)=>{ clearTimeout(t); t=setTimeout(()=>fn(...a), wait); } }

  document.addEventListener('DOMContentLoaded', async () => { await applySavedSettings(); injectUnlock(); });

  window.unlockStudio = showPasswordPrompt;
  window.exitStudioMode = exitStudio;

})();
