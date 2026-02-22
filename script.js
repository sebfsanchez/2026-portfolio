// Floating contact - random movement around the page
const floatingContact = document.querySelector('.floating-contact');

let posX = Math.random() * (window.innerWidth - 300);
let posY = Math.random() * (window.innerHeight - 100);
let velX = 0.8;
let velY = 0.6;

function updatePosition() {
  const rect = floatingContact.getBoundingClientRect();
  const maxX = window.innerWidth - rect.width - 20;
  const maxY = window.innerHeight - rect.height - 20;

  posX += velX;
  posY += velY;

  // Bounce off edges
  if (posX <= 20 || posX >= maxX) {
    velX *= -1;
    posX = Math.max(20, Math.min(posX, maxX));
  }
  if (posY <= 20 || posY >= maxY) {
    velY *= -1;
    posY = Math.max(20, Math.min(posY, maxY));
  }

  floatingContact.style.left = posX + 'px';
  floatingContact.style.top = posY + 'px';

  requestAnimationFrame(updatePosition);
}

// Start animation
if (floatingContact) {
  floatingContact.style.left = posX + 'px';
  floatingContact.style.top = posY + 'px';
  requestAnimationFrame(updatePosition);
}

// Recalculate bounds on resize
window.addEventListener('resize', () => {
  const rect = floatingContact.getBoundingClientRect();
  const maxX = window.innerWidth - rect.width - 20;
  const maxY = window.innerHeight - rect.height - 20;
  posX = Math.min(posX, maxX);
  posY = Math.min(posY, maxY);
});


// Cursor echo effect (tight trail that fades)
let isOverCarousel = false;
const carouselEl = document.querySelector('.carousel');
if (carouselEl) {
  carouselEl.addEventListener('mouseenter', () => { isOverCarousel = true; });
  carouselEl.addEventListener('mouseleave', () => { isOverCarousel = false; });
}

// Check if cursor is over any scattered image
function isOverScatteredImage(x, y) {
  const images = document.querySelectorAll('.scattered-image');
  for (const img of images) {
    const rect = img.getBoundingClientRect();
    if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) {
      return true;
    }
  }
  return false;
}

let lastEchoTime = 0;
const echoInterval = 25;

document.addEventListener('mousemove', (e) => {
  const now = Date.now();
  if (now - lastEchoTime < echoInterval) return;
  lastEchoTime = now;

  const dot = document.createElement('div');
  const color = (isOverCarousel || isOverScatteredImage(e.clientX, e.clientY)) ? '#DFFF00' : '#FF46A2';

  dot.style.cssText = `
    position: fixed;
    left: ${e.clientX}px;
    top: ${e.clientY}px;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background-color: ${color};
    pointer-events: none;
    z-index: 9998;
    opacity: 0.5;
    transform: translate(-50%, -50%);
    transition: opacity 0.15s ease-out;
  `;

  document.body.appendChild(dot);

  // Fade out and remove quickly
  setTimeout(() => {
    dot.style.opacity = '0';
    setTimeout(() => dot.remove(), 150);
  }, 50);
});


// Carousel / Image scatter functionality
const carousel = document.querySelector('.carousel');
const cursor = document.querySelector('.carousel-cursor');
const imageSources = document.querySelectorAll('#image-sources img');
let currentImageIndex = 0;

// Custom cursor follow
if (carousel && cursor) {
  carousel.addEventListener('mousemove', (e) => {
    cursor.style.left = e.clientX + 'px';
    cursor.style.top = e.clientY + 'px';
  });

  carousel.addEventListener('mouseleave', () => {
    cursor.style.opacity = '0';
  });

  carousel.addEventListener('mouseenter', () => {
    cursor.style.opacity = '1';
  });

  // Click to scatter new image
  carousel.addEventListener('click', () => {
    // If all images shown, clear them and reset
    if (currentImageIndex >= imageSources.length) {
      const scattered = document.querySelectorAll('.scattered-image');
      scattered.forEach(img => img.remove());
      currentImageIndex = 0;
      return;
    }

    const sourceImg = imageSources[currentImageIndex];
    const newImg = document.createElement('img');
    newImg.src = sourceImg.src;
    newImg.alt = sourceImg.alt;
    newImg.className = 'scattered-image';

    // Image size constraints
    const imgWidth = 280;
    const imgHeight = 200;
    const margin = 20;

    // Get the main carousel position to avoid it
    const carouselRect = carousel.getBoundingClientRect();
    const padding = 50;

    // Define edge zones (left, right, top, bottom of the main image)
    // Account for image size so full image stays in view
    const zones = [
      // Left zone
      { minX: margin, maxX: carouselRect.left - padding - imgWidth, minY: margin, maxY: window.innerHeight - imgHeight - margin },
      // Right zone
      { minX: carouselRect.right + padding, maxX: window.innerWidth - imgWidth - margin, minY: margin, maxY: window.innerHeight - imgHeight - margin },
      // Top zone
      { minX: margin, maxX: window.innerWidth - imgWidth - margin, minY: margin + 60, maxY: carouselRect.top - padding - imgHeight },
      // Bottom zone
      { minX: margin, maxX: window.innerWidth - imgWidth - margin, minY: carouselRect.bottom + padding, maxY: window.innerHeight - imgHeight - margin - 60 }
    ];

    // Filter out zones that are too small
    const validZones = zones.filter(z => (z.maxX - z.minX) > 50 && (z.maxY - z.minY) > 50);

    // Pick a random zone, fallback to corners if no valid zones
    let randomX, randomY;
    if (validZones.length > 0) {
      const zone = validZones[Math.floor(Math.random() * validZones.length)];
      randomX = zone.minX + Math.random() * (zone.maxX - zone.minX);
      randomY = zone.minY + Math.random() * (zone.maxY - zone.minY);
    } else {
      // Fallback: place in corners
      const corners = [
        { x: margin, y: margin + 60 },
        { x: window.innerWidth - imgWidth - margin, y: margin + 60 },
        { x: margin, y: window.innerHeight - imgHeight - margin - 60 },
        { x: window.innerWidth - imgWidth - margin, y: window.innerHeight - imgHeight - margin - 60 }
      ];
      const corner = corners[Math.floor(Math.random() * corners.length)];
      randomX = corner.x;
      randomY = corner.y;
    }

    newImg.style.left = randomX + 'px';
    newImg.style.top = randomY + 'px';

    document.body.appendChild(newImg);
    currentImageIndex++;
  });
}


// Drawing mode
const drawButton = document.querySelector('.draw-button');
const drawOverlay = document.querySelector('.draw-overlay');
const drawCanvas = document.getElementById('draw-canvas');
const drawClose = document.querySelector('.draw-close');
const drawSend = document.querySelector('.draw-send');
const colorSwatches = document.querySelectorAll('.color-swatch');
const undoBtn = document.querySelector('.undo-btn');
const redoBtn = document.querySelector('.redo-btn');
const eraserSlider = document.getElementById('eraser-slider');

if (drawButton && drawCanvas) {
  const ctx = drawCanvas.getContext('2d');
  let isDrawing = false;
  let currentColor = '#FF46A2';
  let isEraser = false;
  let eraserSize = 20;
  let lastX = 0;
  let lastY = 0;

  // Undo/redo history
  let history = [];
  let historyIndex = -1;
  const maxHistory = 50;

  function saveState() {
    // Remove any redo states
    history = history.slice(0, historyIndex + 1);
    // Save current state
    history.push(drawCanvas.toDataURL());
    if (history.length > maxHistory) {
      history.shift();
    }
    historyIndex = history.length - 1;
  }

  function undo() {
    if (historyIndex > 0) {
      historyIndex--;
      const img = new Image();
      img.onload = () => {
        ctx.clearRect(0, 0, drawCanvas.width, drawCanvas.height);
        ctx.drawImage(img, 0, 0);
      };
      img.src = history[historyIndex];
    } else if (historyIndex === 0) {
      historyIndex = -1;
      ctx.clearRect(0, 0, drawCanvas.width, drawCanvas.height);
    }
  }

  function redo() {
    if (historyIndex < history.length - 1) {
      historyIndex++;
      const img = new Image();
      img.onload = () => {
        ctx.clearRect(0, 0, drawCanvas.width, drawCanvas.height);
        ctx.drawImage(img, 0, 0);
      };
      img.src = history[historyIndex];
    }
  }

  // Set canvas size
  function resizeCanvas() {
    const imageData = ctx.getImageData(0, 0, drawCanvas.width, drawCanvas.height);
    drawCanvas.width = window.innerWidth;
    drawCanvas.height = window.innerHeight;
    ctx.putImageData(imageData, 0, 0);
  }

  drawCanvas.width = window.innerWidth;
  drawCanvas.height = window.innerHeight;
  window.addEventListener('resize', resizeCanvas);

  // Open drawing mode
  drawButton.addEventListener('click', () => {
    drawOverlay.classList.add('active');
    resizeCanvas();
  });

  // Close drawing mode
  drawClose.addEventListener('click', () => {
    drawOverlay.classList.remove('active');
    // Clear the canvas and history when closing
    ctx.clearRect(0, 0, drawCanvas.width, drawCanvas.height);
    history = [];
    historyIndex = -1;
  });


  // Color selection
  const eraserRow = document.querySelector('.eraser-row');
  colorSwatches.forEach(swatch => {
    swatch.addEventListener('click', () => {
      colorSwatches.forEach(s => s.classList.remove('active'));
      swatch.classList.add('active');
      if (swatch.dataset.color === 'eraser') {
        isEraser = true;
        if (eraserRow) eraserRow.classList.add('active');
      } else {
        isEraser = false;
        currentColor = swatch.dataset.color;
        if (eraserRow) eraserRow.classList.remove('active');
      }
    });
  });

  // Undo/redo buttons
  if (undoBtn) {
    undoBtn.addEventListener('click', undo);
  }
  if (redoBtn) {
    redoBtn.addEventListener('click', redo);
  }

  // Eraser slider
  if (eraserSlider) {
    eraserSlider.addEventListener('input', (e) => {
      eraserSize = parseInt(e.target.value);
    });
  }

  // Drawing functions
  function startDrawing(e) {
    isDrawing = true;
    const rect = drawCanvas.getBoundingClientRect();
    lastX = e.clientX - rect.left;
    lastY = e.clientY - rect.top;
  }

  function draw(e) {
    if (!isDrawing) return;

    const rect = drawCanvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(lastX, lastY);
    ctx.lineTo(x, y);

    if (isEraser) {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.lineWidth = eraserSize;
    } else {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = currentColor;
      ctx.lineWidth = 8;
    }

    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();

    lastX = x;
    lastY = y;
  }

  function stopDrawing() {
    if (isDrawing) {
      saveState();
    }
    isDrawing = false;
    ctx.globalCompositeOperation = 'source-over';
  }

  // Mouse events
  drawCanvas.addEventListener('mousedown', startDrawing);
  drawCanvas.addEventListener('mousemove', draw);
  drawCanvas.addEventListener('mouseup', stopDrawing);
  drawCanvas.addEventListener('mouseout', stopDrawing);

  // Touch events for mobile
  drawCanvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    const touch = e.touches[0];
    startDrawing({ clientX: touch.clientX, clientY: touch.clientY });
  });

  drawCanvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    const touch = e.touches[0];
    draw({ clientX: touch.clientX, clientY: touch.clientY });
  });

  drawCanvas.addEventListener('touchend', stopDrawing);
}

// Name popup and send functionality (outside the if block)
document.addEventListener('DOMContentLoaded', function() {
  const sendBtn = document.querySelector('.draw-send');
  const popup = document.querySelector('.name-popup');
  const input = document.querySelector('#drawer-name');
  const cancelBtn = document.querySelector('.name-cancel');
  const submitBtn = document.querySelector('.name-submit');
  const canvas = document.getElementById('draw-canvas');

  if (!sendBtn || !popup || !canvas) return;

  sendBtn.onclick = function() {
    popup.classList.add('active');
    input.value = '';
    input.focus();
  };

  cancelBtn.onclick = function() {
    popup.classList.remove('active');
  };

  submitBtn.onclick = function() {
    doSend();
  };

  input.onkeydown = function(e) {
    if (e.key === 'Enter') doSend();
  };

  function doSend() {
    var userName = input.value.trim() || 'Anonymous';
    popup.classList.remove('active');

    // Create temp canvas
    var temp = document.createElement('canvas');
    temp.width = canvas.width;
    temp.height = canvas.height;
    var tctx = temp.getContext('2d');

    // Background
    tctx.fillStyle = '#F0EEE9';
    tctx.fillRect(0, 0, temp.width, temp.height);

    // Drawing
    tctx.drawImage(canvas, 0, 0);

    // Name
    tctx.font = '500 24px "Geist Sans", -apple-system, sans-serif';
    tctx.fillStyle = '#222';
    tctx.textAlign = 'right';
    tctx.fillText(userName, temp.width - 40, temp.height - 40);

    // Download
    var dataURL = temp.toDataURL('image/png');
    var a = document.createElement('a');
    a.href = dataURL;
    a.download = 'drawing-for-seb.png';
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    // Email
    var subj = encodeURIComponent('my drawing!');
    var body = encodeURIComponent('i made this for you :)\n\n-' + userName);
    window.open('mailto:sebfsanchez@gmail.com?subject=' + subj + '&body=' + body);
  }
});
