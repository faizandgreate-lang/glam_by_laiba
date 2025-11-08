// admin.js — Admin control for Glam by Laiba
document.addEventListener('DOMContentLoaded', () => {
  
  const PWD = '1234'; // default admin password, can be changed server-side

  // ===== Admin Panel Unlock =====
  const unlockBtn = document.querySelector('#admin-unlock-btn');
  if(unlockBtn){
    unlockBtn.addEventListener('click', () => {
      const password = prompt('Enter Admin/Studio password:');
      if(password === PWD){
        enterStudioMode();
      } else {
        alert('Wrong password!');
      }
    });
  }

  function enterStudioMode(){
    document.documentElement.classList.add('studio-on');
    alert('Studio Mode Activated! You can now edit text, images, videos, and buttons inline.');
    
    // Show hidden Studio tools if any
    const tools = document.querySelectorAll('.studio-tool');
    tools.forEach(tool => tool.style.display = 'block');
  }

  // ===== Quick Media Upload Button =====
  const addMediaBtn = document.querySelector('#admin-add-media');
  if(addMediaBtn){
    addMediaBtn.addEventListener('click', async () => {
      const file = await pickFile();
      if(file){
        const result = await uploadFile(file);
        if(result && result.ok){
          alert('Media uploaded successfully!');
          location.reload();
        } else {
          alert('Upload failed.');
        }
      }
    });
  }

  // ===== Pick File Utility =====
  function pickFile(){
    return new Promise(resolve => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*,video/*,application/pdf';
      input.onchange = () => resolve(input.files[0] || null);
      input.click();
    });
  }

  // ===== Upload File Utility =====
  async function uploadFile(file){
    const formData = new FormData();
    formData.append('file', file);
    try {
      const response = await fetch('/api/upload', { method:'POST', body: formData });
      return await response.json();
    } catch(e){
      return null;
    }
  }

  // ===== Admin Logout =====
  const exitBtn = document.querySelector('#admin-exit-studio');
  if(exitBtn){
    exitBtn.addEventListener('click', () => {
      document.documentElement.classList.remove('studio-on');
      alert('Studio Mode Exited.');
      location.reload();
    });
  }

});
