// admin.js — Admin panel & content management helpers
(() => {

  const api = async (url, opts) => {
    const res = await fetch(url, opts);
    try { return await res.json(); } catch(e) { return null; }
  };

  // Quick add gallery item
  async function addGalleryItem() {
    const file = await pickFile();
    if(!file) return;
    const up = await uploadFile(file);
    if(up && up.ok) {
      alert('Gallery item added!');
      location.reload();
    } else {
      alert('Upload failed!');
    }
  }

  // Quick add service item
  async function addServiceItem() {
    const file = await pickFile();
    if(!file) return;
    const up = await uploadFile(file);
    if(up && up.ok) {
      alert('Service item added!');
      location.reload();
    } else {
      alert('Upload failed!');
    }
  }

  // File picker helper
  function pickFile() {
    return new Promise(resolve => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*,video/*';
      input.onchange = () => resolve(input.files[0] || null);
      input.click();
    });
  }

  // File upload helper
  async function uploadFile(file) {
    const fd = new FormData();
    fd.append('file', file);
    fd.append('category', 'Admin');
    fd.append('ftype', file.type.startsWith('video') ? 'video' : 'photo');
    const res = await fetch('/api/upload', {method:'POST', body: fd});
    try { return await res.json(); } catch(e) { return null; }
  }

  // Delete gallery/service item
  async function deleteItem(table, id) {
    if(!confirm('Are you sure you want to delete this item?')) return;
    const res = await api(`/api/delete?table=${table}&id=${id}`, {method:'POST'});
    if(res && res.ok) location.reload();
    else alert('Delete failed!');
  }

  // Expose admin functions globally
  window.admin = {
    addGalleryItem,
    addServiceItem,
    deleteItem
  };

})();
