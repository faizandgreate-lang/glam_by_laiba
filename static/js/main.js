// main.js — Site interactions, UI behaviors
(() => {

  // Smooth scroll for anchor links
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e){
      e.preventDefault();
      const target = document.querySelector(this.getAttribute('href'));
      if(target){
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  // Mobile menu toggle
  const nav = document.querySelector('.nav-bar');
  if(nav){
    const menuBtn = document.createElement('button');
    menuBtn.innerText = '☰';
    menuBtn.classList.add('nav-toggle');
    nav.appendChild(menuBtn);

    menuBtn.addEventListener('click', ()=>{
      nav.classList.toggle('nav-open');
    });
  }

  // Highlight active menu item on scroll
  const sections = document.querySelectorAll('section, header');
  const menuItems = document.querySelectorAll('.nav-bar .menu span');

  window.addEventListener('scroll', () => {
    let current = '';
    sections.forEach(section => {
      const sectionTop = section.offsetTop - 100;
      if(window.scrollY >= sectionTop) current = section.getAttribute('id');
    });

    menuItems.forEach(item => {
      item.classList.remove('active');
      if(item.innerText.toLowerCase() === current) item.classList.add('active');
    });
  });

  // Lazy load images (optional)
  const lazyImages = document.querySelectorAll('img[data-src]');
  const lazyLoad = () => {
    lazyImages.forEach(img => {
      if(img.getBoundingClientRect().top < window.innerHeight + 100){
        img.src = img.getAttribute('data-src');
        img.removeAttribute('data-src');
      }
    });
  };
  window.addEventListener('scroll', lazyLoad);
  window.addEventListener('resize', lazyLoad);
  window.addEventListener('load', lazyLoad);

})();
