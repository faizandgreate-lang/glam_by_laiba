// filtering and admin actions
function qs(s){return document.querySelector(s)}
function qsa(s){return document.querySelectorAll(s)}

qsa('.filters button').forEach(b=>b.addEventListener('click', ()=>{ let f=b.getAttribute('data-filter'); qsa('#gallery .media').forEach(p=>{ if(f==='All' || p.dataset.category===f) p.style.display='block'; else p.style.display='none' }) }))

function openAdmin(){ qs('#admin-modal').style.display='flex'; }
function closeAdmin(){ qs('#admin-modal').style.display='none'; qs('#admin-panel').style.display='none'; qs('#admin-login').style.display='block'; }

async function doLogin(){
  const pwd = qs('#admin-password').value
  const res = await fetch('/api/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({password:pwd})})
  const j = await res.json()
  if(j.ok){ qs('#admin-login').style.display='none'; qs('#admin-panel').style.display='block'; loadAdminGallery(); }
  else qs('#login-error').innerText='Wrong password'
}

async function updateTitle(){
  const title = qs('#new-title').value
  const tagline = qs('#new-tagline').value
  const res = await fetch('/api/update_title',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({title, tagline})})
  const j = await res.json()
  if(j.ok){ qs('#site-title').innerText = j.title; alert('Title updated') }
}

async function uploadMedia(){
  const file = qs('#file-input').files[0]
  const ftype = qs('#ftype').value
  const category = qs('#category-select').value
  if(!file){ alert('Choose a file'); return }
  const fd = new FormData(); fd.append('file', file); fd.append('ftype', ftype); fd.append('category', category)
  const res = await fetch('/api/upload',{method:'POST',body:fd})
  const j = await res.json()
  if(j.ok){ alert('Uploaded'); location.reload(); } else alert(j.error||'Upload failed')
}

async function loadAdminGallery(){
  const adminG = qs('#admin-gallery'); adminG.innerHTML=''
  qsa('#gallery .media').forEach(p=>{
    const clone = p.cloneNode(true)
    clone.style.width='120px'; clone.style.cursor='pointer'
    clone.onclick = async ()=>{ if(!confirm('Delete this item?')) return; const id=p.dataset.id; const res = await fetch('/api/delete/'+id,{method:'POST'}); const j=await res.json(); if(j.ok) location.reload(); else alert('Delete failed') }
    adminG.appendChild(clone)
  })
}

// video modal
function closeVideo(){ qs('#video-modal').style.display='none'; qs('#player').pause(); qs('#player').src=''; }
qsa('.play-btn').forEach(b=>b.addEventListener('click', ()=>{ const src=b.getAttribute('data-src'); qs('#player').src = src; qs('#video-modal').style.display='flex'; qs('#player').play(); }))
window.onclick = function(e){ if(e.target.classList.contains('modal')) closeAdmin(); }
