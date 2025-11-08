// main.js — Frontend interactivity for Glam by Laiba
document.addEventListener('DOMContentLoaded', () => {

  // ===== HERO SLIDER =====
  const slides = document.querySelectorAll('.hero-slide');
  let currentSlide = 0;
  const nextSlide = () => {
    slides[currentSlide].classList.remove('active');
    currentSlide = (currentSlide + 1) % slides.length;
    slides[currentSlide].classList.add('active');
  };
  if(slides.length > 1) setInterval(nextSlide, 5000); // slide every 5s

  // Swipe Support for Hero Slider
  let startX = 0;
  const heroSection = document.querySelector('.hero');
  if(heroSection){
    heroSection.addEventListener('touchstart', e => startX = e.touches[0].clientX);
    heroSection.addEventListener('touchend', e => {
      const endX = e.changedTouches[0].clientX;
      if(endX - startX > 50) { // swipe right
        slides[currentSlide].classList.remove('active');
        currentSlide = (currentSlide - 1 + slides.length) % slides.length;
        slides[currentSlide].classList.add('active');
      } else if(startX - endX > 50) { // swipe left
        nextSlide();
      }
    });
  }

  // ===== PORTFOLIO FILTERING =====
  const filterButtons = document.querySelectorAll('.portfolio-filter button');
  const portfolioItems = document.querySelectorAll('.g-item');

  filterButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const cat = btn.getAttribute('data-category');
      filterButtons.forEach(b=>b.classList.remove('active'));
      btn.classList.add('active');

      portfolioItems.forEach(item => {
        if(cat === 'all' || item.getAttribute('data-category') === cat) {
          item.style.display = 'block';
        } else {
          item.style.display = 'none';
        }
      });
    });
  });

  // ===== LIGHTBOX =====
  let lightboxOverlay, lightboxMedia;
  portfolioItems.forEach(item => {
    const media = item.querySelector('img, video');
    if(media){
      media.style.cursor = 'pointer';
      media.addEventListener('click', () => {
        if(!lightboxOverlay){
          lightboxOverlay = document.createElement('div');
          lightboxOverlay.id = 'lightbox-overlay';
          Object.assign(lightboxOverlay.style, {
            position:'fixed', top:0, left:0, width:'100%', height:'100%',
            background:'rgba(0,0,0,0.9)', display:'flex', justifyContent:'center',
            alignItems:'center', zIndex:99999, cursor:'pointer'
          });
          document.body.appendChild(lightboxOverlay);
        }
        lightboxOverlay.innerHTML = '';
        lightboxMedia = media.tagName === 'VIDEO' ? document.createElement('video') : document.createElement('img');
        if(media.tagName === 'VIDEO'){
          lightboxMedia.src = media.src;
          lightboxMedia.controls = true;
          lightboxMedia.autoplay = true;
        } else {
          lightboxMedia.src = media.src;
        }
        lightboxMedia.style.maxWidth = '90%';
        lightboxMedia.style.maxHeight = '90%';
        lightboxOverlay.appendChild(lightboxMedia);
        lightboxOverlay.style.display = 'flex';

        lightboxOverlay.onclick = () => lightboxOverlay.style.display = 'none';
      });
    }
  });

  // ===== SMOOTH SCROLLING =====
  const navLinks = document.querySelectorAll('a[href^="#"]');
  navLinks.forEach(link => {
    link.addEventListener('click', e => {
      e.preventDefault();
      const target = document.querySelector(link.getAttribute('href'));
      if(target){
        window.scrollTo({top: target.offsetTop - 60, behavior: 'smooth'});
      }
    });
  });

  // ===== HERO VIDEO AUTOPLAY LIKE GIF =====
  const heroVideos = document.querySelectorAll('.hero video');
  heroVideos.forEach(v => {
    v.muted = true;
    v.autoplay = true;
    v.loop = true;
    v.playsInline = true;
    v.addEventListener('click', () => v.muted = false); // unmute on click
  });

});
