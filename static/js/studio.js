// studio.js
document.addEventListener("DOMContentLoaded", function () {
  const STUDIO_PASSWORD = "1234";
  let isStudioMode = false;

  // --------------------------
  // Login for Studio Mode
  // --------------------------
  const loginBtn = document.getElementById("studio-login-btn");
  if (loginBtn) {
    loginBtn.addEventListener("click", async () => {
      const password = prompt("Enter Studio Password:");
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (data.ok) {
        isStudioMode = true;
        alert("Studio Mode Activated!");
        enableEditing();
      } else {
        alert("Wrong password!");
      }
    });
  }

  // --------------------------
  // Enable Inline Text Editing
  // --------------------------
  function enableEditing() {
    document.querySelectorAll("[data-editable]").forEach((el) => {
      el.contentEditable = true;
      el.style.outline = "2px dashed #f0a";
      el.addEventListener("blur", () => saveText(el));
    });

    // Enable image upload buttons
    document.querySelectorAll("[data-upload]").forEach((btn) => {
      btn.style.display = "inline-block";
      btn.addEventListener("change", (e) => uploadFile(e.target));
    });

    // Enable drag & drop for gallery/services
    initDragAndDrop();

    // Theme selector
    const themeSelector = document.getElementById("theme-selector");
    if (themeSelector) {
      themeSelector.addEventListener("change", () => changeTheme(themeSelector.value));
    }
  }

  // --------------------------
  // Save edited text
  // --------------------------
  async function saveText(el) {
    const key = el.dataset.key;
    const value = el.innerText;
    await fetch("/api/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [key]: value }),
    });
  }

  // --------------------------
  // Upload file (image/video/pdf)
  // --------------------------
  async function uploadFile(input) {
    const file = input.files[0];
    if (!file) return;

    const category = input.dataset.category || "Studio";
    const ftype = input.dataset.ftype || "photo";

    const formData = new FormData();
    formData.append("file", file);
    formData.append("category", category);
    formData.append("ftype", ftype);

    const res = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });
    const data = await res.json();

    if (data.ok) {
      // Add new element to gallery/services
      const container = document.querySelector(`#${category}-container`);
      if (container) {
        const div = document.createElement("div");
        div.classList.add("studio-item");
        div.dataset.id = data.filename; // temp ID
        div.innerHTML = `<img src="/uploads/${data.filename}" alt="" />`;
        container.appendChild(div);
      }
      alert("Upload successful!");
    } else {
      alert("Upload failed: " + data.error);
    }
  }

  // --------------------------
  // Drag & Drop Reordering
  // --------------------------
  function initDragAndDrop() {
    document.querySelectorAll(".studio-gallery, .studio-services").forEach((container) => {
      let dragSrcEl = null;

      container.querySelectorAll(".studio-item").forEach((item) => {
        item.draggable = true;

        item.addEventListener("dragstart", (e) => {
          dragSrcEl = item;
          e.dataTransfer.effectAllowed = "move";
        });

        item.addEventListener("dragover", (e) => {
          e.preventDefault();
          e.dataTransfer.dropEffect = "move";
        });

        item.addEventListener("drop", (e) => {
          e.stopPropagation();
          if (dragSrcEl !== item) {
            const parent = item.parentNode;
            const nodes = Array.from(parent.children);
            const srcIndex = nodes.indexOf(dragSrcEl);
            const targetIndex = nodes.indexOf(item);

            if (srcIndex < targetIndex) {
              parent.insertBefore(dragSrcEl, item.nextSibling);
            } else {
              parent.insertBefore(dragSrcEl, item);
            }

            // Save new order
            saveOrder(parent);
          }
        });
      });
    });
  }

  async function saveOrder(container) {
    const order = Array.from(container.children).map((el) => el.dataset.id);
    await fetch("/api/reorder", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ order }),
    });
  }

  // --------------------------
  // Theme switching
  // --------------------------
  async function changeTheme(themeFile) {
    const link = document.getElementById("theme-css");
    if (link) link.href = `/static/${themeFile}`;

    // Save selected theme
    await fetch("/api/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ current_theme: themeFile }),
    });
  }
});
