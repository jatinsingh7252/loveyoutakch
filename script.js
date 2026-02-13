const noBtn = document.getElementById('noBtn');
const yesBtn = document.getElementById('yesBtn');
const celebration = document.getElementById('celebration');
const confettiRoot = document.getElementById('confetti');
const closeBtn = document.getElementById('closeBtn');
const bgMusic = document.getElementById('bgMusic');
const container = document.querySelector('.container');
const buttonsContainer = document.querySelector('.buttons');
const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Track current transform offset for the NO button
let noButtonOffsetX = 0;
let noButtonOffsetY = 0;
let moving = false;

function moveNoButton(){
  if (moving) return; // simple throttle
  moving = true;
  
  requestAnimationFrame(() => {
    if (!container || !buttonsContainer || !noBtn) {
      moving = false;
      return;
    }
    
    const containerRect = container.getBoundingClientRect();
    const buttonsRect = buttonsContainer.getBoundingClientRect();
    const btnRect = noBtn.getBoundingClientRect();
    
    // Calculate available space within the container
    const padding = 15;
    const minX = padding;
    const maxX = containerRect.width - btnRect.width - padding;
    const minY = padding;
    const maxY = containerRect.height - btnRect.height - padding;
    
    // Get button's natural position (center of buttons container)
    const buttonsCenterX = buttonsRect.left - containerRect.left + (buttonsRect.width / 2);
    const buttonsCenterY = buttonsRect.top - containerRect.top + (buttonsRect.height / 2);
    const btnCenterX = btnRect.width / 2;
    const btnCenterY = btnRect.height / 2;
    
    // Get current transform offset
    const currentX = buttonsCenterX - btnCenterX + noButtonOffsetX;
    const currentY = buttonsCenterY - btnCenterY + noButtonOffsetY;
    
    // Generate random position within bounds, ensuring it moves significantly
    let randomX, randomY;
    let attempts = 0;
    do {
      randomX = Math.random() * (maxX - minX) + minX;
      randomY = Math.random() * (maxY - minY) + minY;
      attempts++;
    } while (Math.abs(randomX - currentX) < 40 && Math.abs(randomY - currentY) < 40 && attempts < 20);
    
    // Calculate transform values relative to button's natural center position
    const deltaX = randomX - (buttonsCenterX - btnCenterX);
    const deltaY = randomY - (buttonsCenterY - btnCenterY);
    
    // Store the offset
    noButtonOffsetX = deltaX;
    noButtonOffsetY = deltaY;
    
    // Apply transform using CSS variables to avoid conflicts with hover
    noBtn.style.setProperty('--move-x', `${deltaX}px`);
    noBtn.style.setProperty('--move-y', `${deltaY}px`);
    
    setTimeout(()=> moving = false, 400);
  });
}

// Move button on hover/mouseenter
noBtn.addEventListener('mouseenter', moveNoButton);
noBtn.addEventListener('pointerenter', moveNoButton);
noBtn.addEventListener('focus', moveNoButton);

// YES button click shows celebration with confetti
function showCelebration(){
  celebration.classList.remove('hidden');
  celebration.setAttribute('aria-hidden','false');
  // generate confetti unless user prefers reduced motion
  if (!prefersReduced) createConfetti(28);
}

function hideCelebration(){
  celebration.classList.add('hidden');
  celebration.setAttribute('aria-hidden','true');
  // clear confetti
  if (confettiRoot) confettiRoot.innerHTML = '';
}

yesBtn.addEventListener('click', showCelebration);
closeBtn.addEventListener('click', hideCelebration);

// Confetti generator: creates absolutely positioned colored rectangles with fall animation
function createConfetti(amount){
  if (!confettiRoot) return;
  // Valentine-themed colors
  const colors = ['#ff5a7a','#ff89a6','#ffb3d1','#ffd166','#ff6b9d','#ff9ec5','#ffc0d9'];
  const rootRect = celebration.getBoundingClientRect();
  for (let i=0;i<amount;i++){
    const el = document.createElement('div');
    el.className = 'confetti-piece';
    const w = Math.floor(Math.random()*12)+6;
    const h = Math.floor(Math.random()*8)+6;
    el.style.width = `${w}px`;
    el.style.height = `${h}px`;
    el.style.left = `${Math.random()*100}%`;
    el.style.top = `${Math.random()*30}%`;
    el.style.background = colors[Math.floor(Math.random()*colors.length)];
    const rot = Math.floor(Math.random()*360);
    el.style.transform = `translateY(-10vh) rotate(${rot}deg)`;
    const dur = 2000 + Math.floor(Math.random()*1800);
    el.style.animation = `confetti-fall ${dur}ms cubic-bezier(.2,.8,.2,1) forwards ${Math.random()*400}ms`;
    confettiRoot.appendChild(el);
    // cleanup
    setTimeout(()=> el.remove(), dur + 1500);
  }
}

// keyboard accessibility: if user tries to click NO, keep playful behavior
noBtn.addEventListener('click', (e)=>{
  e.preventDefault();
  moveNoButton();
});

// clear confetti if overlay closed by Esc
document.addEventListener('keydown', (e)=>{
  if (e.key === 'Escape') hideCelebration();
});

// confetti keyframes injected for robustness
const style = document.createElement('style');
style.textContent = `@keyframes confetti-fall { 0% { transform: translateY(-20vh) rotate(0deg); opacity:1 } 100% { transform: translateY(120vh) rotate(360deg); opacity:0 } }`;
document.head.appendChild(style);

// Music autoplay - always play music
(function initMusic() {
  if (!bgMusic) return;
  
  bgMusic.volume = 0.3; // Set volume to 30% for background music
  
  // Try to play immediately
  const playMusic = () => {
    bgMusic.play().catch(err => {
      // If autoplay is blocked, try on first user interaction
      const playOnInteraction = () => {
        bgMusic.play().catch(() => {
          console.log('Music autoplay prevented by browser');
        });
        document.removeEventListener('click', playOnInteraction);
        document.removeEventListener('touchstart', playOnInteraction);
        document.removeEventListener('keydown', playOnInteraction);
      };
      
      document.addEventListener('click', playOnInteraction, { once: true });
      document.addEventListener('touchstart', playOnInteraction, { once: true });
      document.addEventListener('keydown', playOnInteraction, { once: true });
    });
  };
  
  // Try to play when page loads
  if (bgMusic.readyState >= 2) {
    playMusic();
  } else {
    bgMusic.addEventListener('canplay', playMusic, { once: true });
  }
  
  // Also try on any user interaction as fallback
  const tryPlayOnInteraction = () => {
    if (bgMusic.paused) {
      bgMusic.play().catch(() => {});
    }
  };
  
  document.addEventListener('click', tryPlayOnInteraction, { once: true });
  document.addEventListener('touchstart', tryPlayOnInteraction, { once: true });
  document.addEventListener('keydown', tryPlayOnInteraction, { once: true });
  
  // Keep music playing if it stops
  bgMusic.addEventListener('pause', () => {
    // Only auto-resume if it wasn't paused by user (browser autoplay policy)
    setTimeout(() => {
      if (bgMusic.paused) {
        bgMusic.play().catch(() => {});
      }
    }, 100);
  });
  
  bgMusic.addEventListener('error', () => {
    console.log('Music file not found. Please add a music file named "music.mp3" or "music.ogg" to the project folder.');
  });
})();

// Entrance animation trigger (adds class to reveal card & buttons)
if (container){
  if (!prefersReduced) {
    // Staggered: card then buttons and quotes
    requestAnimationFrame(() => {
      container.classList.add('is-loaded');
      const btnGroup = document.querySelector('.buttons');
      if (btnGroup) btnGroup.classList.add('is-loaded');
      const quotesSection = document.querySelector('.valentine-quotes');
      if (quotesSection) quotesSection.classList.add('is-loaded');
    });
  } else {
    container.classList.add('is-loaded');
    const btnGroup = document.querySelector('.buttons');
    if (btnGroup) btnGroup.classList.add('is-loaded');
    const quotesSection = document.querySelector('.valentine-quotes');
    if (quotesSection) quotesSection.classList.add('is-loaded');
  }
}

