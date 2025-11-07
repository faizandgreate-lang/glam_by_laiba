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
  // load current settings
  const res = await fetch('/')
  // fetch settings via dedicated endpoint would be nicer; instead rely on DOM placeholders - but we will fetch via API
  const sres = await fetch('/'); // just to trigger
  // populate current settings fields via a quick API call to server-side settings (we'll call /api/get_settings)
  try {
    const r = await fetch('/api/get_settings'); const data=await r.json()
    qs('#site-title-input').value = data.site_title || ''
    qs('#tagline-input').value = data.tagline || ''
    qs('#bg-input').value = data.bg_color || '#fff0f6'
    qs('#prices-json').value = JSON.stringify(data.prices, null, 2)
  } catch(e){ console.log('no settings api') }
  // list gallery
  loadAdminGallery()
}

// Upload file
async function uploadFile(){
  const f = qs('#file-input').files[0]; if(!f){ alert('Choose file'); return }
  const fd = new FormData(); fd.append('file', f); fd.append('category', qs('#cat').value || 'General'); fd.append('ftype', qs('#ftype').value)
  const res = await fetch('/api/upload',{method:'POST',body:fd}); const j = await res.json()
  if(j.ok){ alert('Uploaded'); loadAdminGallery(); location.reload() } else alert(j.error||'Upload failed')
}

async function loadAdminGallery(){
  const g = qs('#admin-gallery'); g.innerHTML=''
  const res = await fetch('/api/gallery') // we will add this endpoint soon
  const j = await res.json()
  j.forEach(item=>{
    const div = document.createElement('div'); div.style.display='inline-block'; div.style.margin='6px'
    if(item.type==='photo'){ div.innerHTML = `<img src="/uploads/${item.filename}" width=120>` }
    else { div.innerHTML = `<video src="/uploads/${item.filename}" width=120 controls></video>` }
    const del = document.createElement('button'); del.innerText='Delete'; del.onclick = async ()=>{
      if(!confirm('Delete?')) return
      const r = await fetch('/api/photo/'+item.id, {method:'DELETE'})
      const jr = await r.json(); if(jr.ok){ loadAdminGallery(); location.reload() } else alert('Delete failed')
    }
    div.appendChild(del); g.appendChild(div)
  })
}

// Save settings
async function saveSettings(){
  const payload = {site_title: qs('#site-title-input').value, tagline: qs('#tagline-input').value, bg_color: qs('#bg-input').value}
  await fetch('/api/settings', {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload)})
  alert('Saved'); location.reload()
}

// Prices
async function savePrices(){
  try {
    const obj = JSON.parse(qs('#prices-json').value)
    await fetch('/api/prices', {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(obj)})
    alert('Prices saved'); location.reload()
  } catch(e){ alert('Invalid JSON') }
}

// Reviews
async function addReview(e){
  e.preventDefault()
  const form = document.getElementById('reviewForm'); const fd = new FormData(form)
  const res = await fetch('/api/review', {method:'POST', body: fd}); const j = await res.json()
  if(j.ok){ alert('Review added'); location.reload() } else alert('Failed')
}
