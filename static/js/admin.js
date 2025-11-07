// admin.js — login, load settings, gallery, upload, prices visual editor, reviews, themes
function qs(s){return document.querySelector(s)}
function qsa(s){return document.querySelectorAll(s)}
function openAdmin(){ qs('#admin-modal').style.display='flex' }
function closeAdmin(){ qs('#admin-modal').style.display='none'; qs('#admin-panel').style.display='none'; qs('#admin-login').style.display='block' }

async function doLogin(){
  const pwd = qs('#admin-password').value
  const res = await fetch('/api/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({password:pwd})})
  const j = await res.json()
  if(j.ok){ qs('#admin-login').style.display='none'; qs('#admin-panel').style.display='block'; loadAdmin() }
  else qs('#login-error').innerText='Wrong password'
}

async function loadAdmin(){
  // load settings
  const r = await fetch('/api/get_settings')
  const data = await r.json()
  qs('#site-title-input').value = data.site_title || ''
  qs('#tagline-input').value = data.tagline || ''
  const theme = data.bg_color_theme || data.bg_color || '#fff0f6'
  // use theme stored as one of 'pink','black','white' if present in settings.bg_color
  const mapping = {'#fff0f6':'pink','black':'black','#ffffff':'white'}
  let themeVal = 'pink'
  if(data.bg_color === '#000' || data.bg_color === 'black') themeVal='black'
  if(data.bg_color === '#ffffff') themeVal='white'
  qs('#theme-select').value = themeVal
  applyTheme(themeVal)

  // load prices editor (visual)
  const prices = data.prices || {}
  renderPricesEditor(prices)

  loadAdminGallery()
}

// APPLY THEME (add class to documentElement)
function applyTheme(name){
  document.documentElement.classList.remove('theme-pink','theme-black','theme-white')
  if(name === 'pink') document.documentElement.classList.add('theme-pink')
  if(name === 'black') document.documentElement.classList.add('theme-black')
  if(name === 'white') document.documentElement.classList.add('theme-white')
}

async function saveSettings(){
  const theme = qs('#theme-select').value
  // map theme to a bg_color just for backward compatibility
  const map = {pink:'#fff0f6', black:'#000', white:'#ffffff'}
  const payload = {site_title: qs('#site-title-input').value, tagline: qs('#tagline-input').value, bg_color: map[theme]}
  await fetch('/api/settings', {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload)})
  applyTheme(theme)
  alert('Settings saved')
  location.reload()
}

// ---------- GALLERY ----------
async function uploadFile(){
  const f = qs('#file-input').files[0]; if(!f){ alert('Choose file'); return }
  const fd = new FormData(); fd.append('file', f); fd.append('category', qs('#cat').value || 'General'); fd.append('ftype', qs('#ftype').value)
  const res = await fetch('/api/upload',{method:'POST',body:fd})
  const j = await res.json()
  if(j.ok){ alert('Uploaded'); loadAdminGallery(); location.reload() } else alert(j.error||'Upload failed')
}

async function loadAdminGallery(){
  const g = qs('#admin-gallery'); g.innerHTML=''
  const res = await fetch('/api/gallery')
  const arr = await res.json()
  arr.forEach(item=>{
    const div = document.createElement('div'); div.style.display='inline-block'; div.style.margin='8px'
    if(item.type==='photo'){ div.innerHTML = `<img src="/uploads/${item.filename}" width=140>` }
    else { div.innerHTML = `<video src="/uploads/${item.filename}" width=140 controls></video>` }
    const del = document.createElement('button'); del.innerText='Delete'; del.onclick = async ()=>{
      if(!confirm('Delete?')) return
      const r = await fetch('/api/photo/'+item.id, {method:'DELETE'})
      const jr = await r.json(); if(jr.ok){ loadAdminGallery(); location.reload() } else alert('Delete failed')
    }
    div.appendChild(del); g.appendChild(div)
  })
}

// ---------- PRICES visual editor ----------
function renderPricesEditor(pricesObj){
  const container = qs('#prices-editor')
  container.innerHTML = ''
  // for each category
  Object.keys(pricesObj).forEach(cat=>{
    const card = document.createElement('div'); card.style.border='1px solid #eee'; card.style.padding='8px'; card.style.margin='6px'; card.style.borderRadius='8px'
    const title = document.createElement('h4'); title.innerText = cat
    card.appendChild(title)
    const list = document.createElement('div')
    Object.entries(pricesObj[cat]).forEach(([k,v])=>{
      const row = document.createElement('div'); row.style.display='flex'; row.style.justifyContent='space-between'; row.style.gap='8px'
      const name = document.createElement('input'); name.value = k
      const val = document.createElement('input'); val.value = v
      const rem = document.createElement('button'); rem.innerText='Remove'; rem.onclick = ()=>{ row.remove() }
      row.appendChild(name); row.appendChild(val); row.appendChild(rem)
      list.appendChild(row)
    })
    const addBtn = document.createElement('button'); addBtn.innerText='Add Row'; addBtn.onclick = ()=>{
      const row = document.createElement('div'); row.style.display='flex'; row.style.justifyContent='space-between'; row.style.gap='8px'
      const name = document.createElement('input'); name.placeholder='Label'
      const val = document.createElement('input'); val.placeholder='Price'
      const rem = document.createElement('button'); rem.innerText='Remove'; rem.onclick = ()=>{ row.remove() }
      row.appendChild(name); row.appendChild(val); row.appendChild(rem)
      list.appendChild(row)
    }
    card.appendChild(list); card.appendChild(addBtn)
    container.appendChild(card)
  })
  // Add ability to add new category
  const newCatBtn = document.createElement('button'); newCatBtn.innerText='Add Category'; newCatBtn.onclick = ()=>{
    const name = prompt('Category name (e.g. Party)')
    if(!name) return
    const obj = {}; obj[name] = {"Example":"0"}
    renderPricesEditor(Object.assign({}, pricesObj, obj))
  }
  container.appendChild(newCatBtn)
}

async function savePricesVisual(){
  // build object from editor
  const container = qs('#prices-editor')
  const obj = {}
  Array.from(container.children).forEach(card=>{
    const h = card.querySelector('h4'); if(!h) return
    const cat = h.innerText
    const rows = card.querySelectorAll('div > input')
    const values = {}
    for(let i=0;i<rows.length;i+=2){
      const k = rows[i].value || ('Item'+i)
      const v = rows[i+1].value || '0'
      values[k]=v
    }
    obj[cat]=values
  })
  await fetch('/api/prices', {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(obj)})
  alert('Prices saved'); location.reload()
}

// ---------- REVIEWS ----------
async function addReview(e){
  e.preventDefault()
  const form = document.getElementById('reviewForm'); const fd = new FormData(form)
  const res = await fetch('/api/review', {method:'POST', body: fd}); const j = await res.json()
  if(j.ok){ alert('Review added'); location.reload() } else alert('Failed')
}

// load initial theme class on page load (small safety)
document.addEventListener('DOMContentLoaded', async ()=>{
  try {
    const r = await fetch('/api/get_settings'); const d = await r.json()
    const bg = d.bg_color || '#fff0f6'
    if(bg==='black' || bg==='#000') applyTheme('black')
    else if(bg==='#ffffff') applyTheme('white')
    else applyTheme('pink')
  } catch(e){}
})
