// static/js/studio.js
// Glam Studio Mode - inline editing + upload + reorder + theme switcher
// Requires: Quill (already included), SortableJS (already included)

(() => {
  const ADMIN_PWD = '1234'; // same as server
  const ANIM_DURATION = 450;

  // helpers
  const qs = s => document.querySelector(s);
  const qsa = s => Array.from(document.querySelectorAll(s));
  const api = (u, opts) => fetch(u, opts).then(r => r.json());

  // create secret button (bottom-left)
  function injectSecretButton() {
    if (qs('#studio-dot')) return;
    const btn = document.createElement('div');
    btn.id = 'studio-dot';
    btn.title = 'Studio Mode';
    btn.innerHTML = '✦';
    document.body.appendChild(btn);
    btn.addEventListener('click', openPasswordModal);
  }

  // password modal
  function injectPasswordModal() {
    if (qs('#studio-modal')) return;
    const html = `
      <div id="studio-modal" class="studio-modal" style="display:none">
        <div class="studio-modal-box">
          <h3>Enter Studio Password</h3>
          <input id="studio-pwd" type="password" placeholder="Password" />
          <div style="margin-top:10px;">
            <button id="studio-pwd-ok">Unlock</button>
            <button id="studio-pwd-cancel">Cancel</button>
          </div>
          <p id="studio-pwd-error" class="studio-error"></p>
        </div>
      </div>
    `;
    document.body.insertAdjacentHTML('beforeend', html);
    qs('#studio-pwd-cancel').onclick = () => qs('#studio-modal').style.display = 'none';
    qs('#studio-pwd-ok').onclick = tryUnlock;
  }

  function openPasswordModal() {
    qs('#studio-modal').style.display = 'flex';
    qs('#studio-pwd').value = '';
    qs('#studio-pwd-error').innerText = '';
    qs('#studio-pwd').focus();
  }

  async function tryUnlock() {
    const pwd = qs('#studio-pwd').value || '';
    // use server login for safety
    try {
      const res = await api('/api/login', {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({password: pwd})
      });
      if (res.ok) {
        qs('#studio-modal').style.display = 'none';
        startStudioMode();
      } else {
        qs('#studio-pwd-error').innerText = 'Wrong password';
      }
    } catch(e) {
      qs('#studio-pwd-error').innerText = 'Network error';
    }
  }

  // ---------- Studio Mode core ----------
  let quillMap = {};
  let sortableInstance = null;

  async function startStudioMode() {
    // animate bloom
    document.documentElement.classList.add('studio-activating');
    setTimeout(()=>document.documentElement.classList.add('studio-on'), ANIM_DURATION);

    // load settings & initialize editors
    const settings = await api('/api/get_settings');
    enableInlineEditing(settings);
    initGallerySortable();
    injectStudioControls(settings);
  }

  // make editable elements interactive
  function enableInlineEditing(settings) {
    // Make common fields editable: site title, tagline
    const editableMap = [
      {sel:'#site-title', key:'site_title'},
      {sel:'#site-tagline', key:'tagline'}
    ];

    editableMap.forEach(it => {
      const el = qs(it.sel);
      if(!el) return;
      el.classList.add('studio-editable'); 
      el.setAttribute('data-setting', it.key);
      el.setAttribute('contenteditable','true');
      // on blur -> save
      el.addEventListener('blur', debounce(async (ev) => {
        await saveSetting(it.key, ev.target.innerText.trim());
      }, 700));
      // show tooltip
      el.title = 'Double-click or edit text. Changes save automatically.';
    });

    // Quill editors for long sections: home_desc, portfolio_desc, prices_desc
    const longSections = [
      {id:'quill-home-preview', key:'home_desc'},
      {id:'quill-portfolio-preview', key:'portfolio_desc'},
      {id:'quill-prices-preview', key:'prices_desc'}
    ];

    longSections.forEach(s => {
      const box = qs(`#${s.id}`);
      if(!box) return;
      box.classList.add('studio-rich');
      // make it contenteditable fallback
      box.setAttribute('contenteditable','true');
      box.title = 'Edit content here (rich text supported in Admin)';
      // load server HTML if present (server returns HTML in settings)
      if(settings && settings[s.key]) box.innerHTML = settings[s.key];
      // save on blur
      box.addEventListener('blur', debounce(async (ev) => {
        await saveSetting(s.key, ev.target.innerHTML.trim());
      }, 900));
    });

    // profile image editable (img with data-setting="profile_image")
    qsa('img[data-setting]').forEach(img=>{
      img.style.cursor = 'pointer';
      img.title = 'Click to change image';
      img.addEventListener('click', async (ev) => {
        // open file input
        const file = await pickFile();
        if(!file) return;
        const upload = await uploadFile(file, 'Profile');
        if(upload.ok) {
          img.src = `/uploads/${upload.filename}`;
          await saveSetting(img.getAttribute('data-setting'), upload.filename);
        } else alert(upload.error || 'Upload failed');
      });
    });

    // hero background (element with id="hero" and data-setting="hero_bg")
    const hero = qs('#hero');
    if(hero && hero.getAttribute('data-setting')) {
      hero.style.cursor = 'pointer';
      hero.title = 'Click to change hero background';
      hero.addEventListener('click', async ()=>{
        const file = await pickFile();
        if(!file) return;
        const up = await uploadFile(file, 'Background');
        if(up.ok) {
          hero.style.backgroundImage = `url('/uploads/${up.filename}')`;
          await saveSetting(hero.getAttribute('data-setting'), up.filename);
        } else alert(up.error || 'Upload failed');
      });
    }

    // inline theme selector quick toggle panel
    injectThemeMiniPicker(settings && settings.bg_color);
  }

  // simple file picker helper returning File or null
  function pickFile() {
    return new Promise(resolve=>{
      const inp = document.createElement('input');
      inp.type = 'file';
      inp.accept = 'image/*,video/*';
      inp.onchange = ()=>resolve(inp.files[0] || null);
      inp.click();
    });
  }

  // upload using /api/upload
  async function uploadFile(file, category='General') {
    const fd = new FormData();
    fd.append('file', file);
    fd.append('category', category);
    fd.append('ftype', file.type && file.type.startsWith('video') ? 'video' : 'photo');
    try {
      const res = await fetch('/api/upload', {method:'POST', body: fd});
      return await res.json();
    } catch(e) {
      return {ok:false, error: 'Network upload failed'};
    }
  }

  async function saveSetting(key, value) {
    try {
      await api('/api/settings', {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({[key]: value})});
      flashSaved();
    } catch(e) { console.error(e) }
  }

  // small saved flash animation
  function flashSaved() {
    let el = qs('#studio-saved');
    if(!el) {
      el = document.createElement('div');
      el.id = 'studio-saved';
      el.className = 'studio-saved';
      el.innerText = 'Saved';
      document.body.appendChild(el);
    }
    el.classList.add('studio-saved-show');
    setTimeout(()=>el.classList.remove('studio-saved-show'), 1000);
  }

  // gallery Sortable
  async function initGallerySortable() {
    const container = qs('#gallery-strip');
    if(!container || !window.Sortable) return;
    if(sortableInstance) sortableInstance.destroy();
    sortableInstance = Sortable.create(container, {
      animation: 180,
      handle: '.g-item',
      onEnd: async () => {
        // new order IDs (we require each g-item to have data-id)
        const ids = Array.from(container.querySelectorAll('.g-item')).map(el => parseInt(el.getAttribute('data-id'))).filter(Boolean);
        if(!ids.length) return;
        await api('/api/reorder', {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({order: ids})});
        flashSaved();
      }
    });
    // make thumbnails clickable to open media in new tab
    container.querySelectorAll('.g-item img, .g-item video').forEach(media=>{
      media.onclick = ()=> window.open(media.src, '_blank');
    });
  }

  // studio controls (upload directly to gallery)
  function injectStudioControls(settings) {
    // Add a small floating toolbar top-right in studio mode
    if(qs('#studio-toolbar')) return;
    const html = `
      <div id="studio-toolbar" class="studio-toolbar">
        <button id="studio-add-media">+ Add Media</button>
        <select id="studio-theme-select" title="Pick theme">
          <option value="pink">Soft Pink</option>
          <option value="black">Black • Gold</option>
          <option value="white">White • Beige</option>
          <option value="royal">Royal Blue</option>
          <option value="peach">Peach Glow</option>
          <option value="lilac">Lilac Dream</option>
          <option value="rose">Rose Gold</option>
          <option value="neutral">Neutral Chic</option>
          <option value="studio-dark">Studio Dark</option>
          <option value="classic">Classic Beige</option>
          <option value="minimal">Minimal White</option>
          <option value="gloss">Glossy Black</option>
          <option value="bold">Bold Contrast</option>
        </select>
        <button id="studio-exit">Exit</button>
      </div>
    `;
    document.body.insertAdjacentHTML('beforeend', html);
    qs('#studio-add-media').onclick = async () => {
      const f = await pickFile(); if(!f) return;
      const u = await uploadFile(f, 'Gallery');
      if(u.ok){ location.reload() } else alert('Upload failed');
    };
    qs('#studio-exit').onclick = () => {
      document.documentElement.classList.remove('studio-on','studio-activating');
      const tb = qs('#studio-toolbar'); if(tb) tb.remove();
      location.reload();
    };
    const sel = qs('#studio-theme-select');
    // set initial value by examining settings.bg_color or theme (simple heuristic)
    // when changed, save to settings and apply quick theme
    sel.onchange = async () => {
      const val = sel.value;
      // map theme -> bg_color (simple)
      const map = {
        'pink':'#fff0f6','black':'#000000','white':'#ffffff','royal':'#f0f7ff','peach':'#fff4f0',
        'lilac':'#f9f6ff','rose':'#fff2f4','neutral':'#f6f0ea','studio-dark':'#0b0b0b','classic':'#fbf7f2',
        'minimal':'#ffffff','gloss':'#0d0d0d','bold':'#f3f3f3'
      };
      await saveSetting('bg_color', map[val] || '#fff0f6');
      document.body.style.background = map[val] || '#fff0f6';
      flashSaved();
    };
  }

  // small theme mini picker near site title
  function injectThemeMiniPicker(currentBg) {
    if(qs('#studio-theme-mini')) return;
    const wrap = document.createElement('div');
    wrap.id = 'studio-theme-mini';
    wrap.className = 'studio-theme-mini';
    wrap.innerHTML = `
      <label>Theme</label>
      <select id="studio-mini-select">
        <option value="pink">Soft Pink</option>
        <option value="black">Black</option>
        <option value="white">White</option>
      </select>
    `;
    const brand = qs('.branding') || qs('.brand');
    if(brand) brand.appendChild(wrap);
    qs('#studio-mini-select').onchange = async (e) => {
      const map = {pink:'#fff0f6', black:'#000', white:'#ffffff'};
      await saveSetting('bg_color', map[e.target.value] || '#fff0f6');
      document.documentElement.style.background = map[e.target.value] || '#fff0f6';
      flashSaved();
    };
  }

  // debounce util
  function debounce(fn, wait=300){
    let t;
    return (...args)=> { clearTimeout(t); t = setTimeout(()=>fn(...args), wait); };
  }

  // initial injection & setup
  function init() {
    injectSecretButton();
    injectPasswordModal();

    // mark gallery items with data-id to support reorder
    qsa('.gallery-strip .g-item').forEach((el, idx) => {
      if(!el.getAttribute('data-id')) {
        const idMatch = el.querySelector('img,video')?.getAttribute('data-id') || el.getAttribute('data-id') || el.dataset.id;
        if(idMatch) el.setAttribute('data-id', idMatch);
      }
    });

    // minor: render quill placeholders if any preview boxes exist (page.html should include these)
  }

  // run when DOM ready
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
