// admin.js — updated with Quill WYSIWYG and Sortable drag & drop for gallery
function qs(s){return document.querySelector(s)}
function qsa(s){return document.querySelectorAll(s)}
function openAdmin(){ qs('#admin-modal').style.display='flex' }
function closeAdmin(){ qs('#admin-modal').style.display='none'; qs('#admin-panel').style.display='none'; qs('#admin-login').style.display='block' }

let quillHome, quillPortfolio, quillPrices

async function doLogin(){
  const pwd = qs('#admin-password').value
  const res = await fetch('/api/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({password:pwd})})
  const j = await res.json()
  if(j.ok){ qs('#admin-login').style.display='none'; qs('#admin-panel').style.display='block'; await loadAdmin() }
  else qs('#login-error').innerText='Wrong password'
}

async function loadAdmin(){
  const r = await fetch('/api/get_settings')
  const data = await r.json()
  qs('#site-title-input').value = data.site_title || ''
  qs('#tagline-input').value = data.tagline || ''
  // setup Quill editors
  if(!quillHome){
    quillHome = new Quill('#quill-home', {theme: 'snow', placeholder:'Home description...'})
  }
  if(!quillPortfolio){
    quillPortfolio = new Quill('#quill-portfolio', {theme: 'snow', placeholder:'Portfolio description...'})
  }
  if(!quillPrices){
    quillPrices = new Quill('#quill-prices', {theme: 'snow', placeholder:'Prices description...'})
  }
  quillHome.root.innerHTML = data.home_desc || ''
  quillPortfolio.root.innerHTML = data.portfolio_desc || ''
  quillPrices.root.innerHTML = data.prices_desc || ''

  // theme
  const mapping = {'#fff0f6':'pink','black':'black','#ffffff':'white'}
  let themeVal = 'pink'
  if(data.bg_color === '#000' || data.bg_color === 'black') themeVal='black'
  if(data.bg_color === '#ffffff') themeVal='white'
  qs('#theme-select').value = themeVal
  applyTheme(themeVal)

  renderPricesEditor(data.prices || {})
  await loadAdminGallery()
}

// save settings including HTML from Quill
async function saveSettings(){
  const theme = qs('#theme-select').value
  const map = {pink:'#fff0f6', black:'#000', white:'#ffffff'}
  const payload = {
    site_title: qs('#site-title-input').value,
    tagline: qs('#tagline-input').value,
    bg_color: map[theme],
    home_desc: quillHome.root.innerHTML,
    portfolio_desc: quillPortfolio.root.innerHTML,
    prices_desc: quillPrices.root.innerHTML
  }
  await fetch('/api/settings', {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload)})
  applyTheme(theme)
  alert('Settings saved')
  location.reload()
}

// GALLERY: render, enable Sortable, save order
async function loadAdminGallery(){
  const g = qs('#admin-gallery'); g.innerHTML = ''
  const res = await fetch('/api/gallery')
  const arr = await res.json()
  // container for Sortable
  const list = document.createElement('div'); list.id='sortable-gallery'; list.style.display='flex'; list.style.flexWrap='wrap'; list.style.gap='8px'
  arr.forEach(item=>{
    const div = document.createElement('div'); div.className='admin-thumb'; div.dataset.id = item.id
    div.style.width = '140px'; div.style.textAlign='center'
    if(item.type==='photo'){ div.innerHTML = `<img src="/uploads/${item.filename}" width=140>` }
    else { div.innerHTML = `<video src="/uploads/${item.filename}" width=140 controls></video>` }
    const del = document.createElement('button'); del.innerText='Delete'; del.onclick = async ()=>{
      if(!confirm('Delete?')) return
      const r = await fetch('/api/photo/'+item.id, {method:'DELETE'})
      const jr = await r.json(); if(jr.ok){ loadAdminGallery(); location.reload() } else alert('Delete failed')
    }
    div.appendChild(del); list.appendChild(div)
  })
  g.appendChild(list)

  // make sortable
  if(window.Sortable){ 
    if(window.gallerySortable) window.gallerySortable.destroy()
    window.gallerySortable = Sortable.create(list, {
      animation: 150,
      onEnd: function(evt){
        // collect new order and POST to /api/reorder
        const ids = Array.from(list.children).map(ch => parseInt(ch.dataset.id))
        fetch('/api/reorder', {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({order: ids})})
          .then(r=>r.json()).then(j=>{ if(j.ok) console.log('Order saved') })
      }
    })
  }
}

// upload
async function uploadFile(){
  const f = qs('#file-input').files[0]; if(!f){ alert('Choose file'); return }
  const fd = new FormData(); fd.append('file', f); fd.append('category', qs('#cat').value || 'General'); fd.append('ftype', qs('#ftype').value)
  const res = await fetch('/api/upload',{method:'POST',body:fd})
  const j = await res.json()
  if(j.ok){ alert('Uploaded'); loadAdminGallery(); location.reload() } else alert(j.error||'Upload failed')
}

// (prices editor + reviews functions remain same — keep your current implementations)
