/**
 * A Little Garden of Happiness – 20/10 Lily of the Valley Experience
 * Highly polished interactive static web app
 */

(function () {
  'use strict';

  // --- DOM Elements ---
  const experienceContainer = document.getElementById('experienceContainer');
  const skyBackground = document.getElementById('skyBackground');
  const initialScreen = document.getElementById('initialScreen');
  const flowerWrapper = document.getElementById('flowerWrapper');
  const draggableFlower = document.getElementById('draggableFlower');
  const dragCueGuide = document.getElementById('dragCueGuide');
  const introTextWrapper = document.getElementById('introTextWrapper');
  const vinePathFill = document.getElementById('vinePathFill');
  const vineBuds = document.getElementById('vineBuds');
  
  const gardenLayerBack = document.getElementById('gardenLayerBack');
  const gardenLayerMid = document.getElementById('gardenLayerMid');
  const gardenLayerFore = document.getElementById('gardenLayerFore');
  
  const cardOverlay = document.getElementById('cardOverlay');
  const exploreGardenBtn = document.getElementById('exploreGardenBtn');
  const sendWishBtn = document.getElementById('sendWishBtn');
  
  const gardenHudControls = document.getElementById('gardenHudControls');
  const reopenCardBtn = document.getElementById('reopenCardBtn');
  const replayExperienceBtn = document.getElementById('replayExperienceBtn');
  
  const audioToggleBtn = document.getElementById('audioToggleBtn');
  const audioIcon = document.getElementById('audioIcon');
  const audioLabel = document.getElementById('audioLabel');
  const wishToast = document.getElementById('wishToast');
  
  const canvas = document.getElementById('ambientCanvas');
  const ctx = canvas.getContext('2d');

  // --- State Variables ---
  let isDragging = false;
  let dragStartX = 0;
  let dragStartY = 0;
  let flowerPosX = 0;
  let flowerPosY = 0;
  let flowerTargetX = 0;
  let flowerTargetY = 0;
  let velocityX = 0;
  let velocityY = 0;
  let lastMoveTime = 0;
  let lastMoveX = 0;
  let lastMoveY = 0;
  
  let cumulativeDistance = 0;
  let dragProgress = 0; // 0.0 to 1.0
  const DRAG_THRESHOLD = 450; // total pixel movement to complete bloom
  let isGardenFullyBloomed = false;
  let cardShown = false;
  let isAudioPlaying = false;
  let plantWishMode = false;
  
  let animationFrameId = null;
  let spawnedClusters = [];
  let width = window.innerWidth;
  let height = window.innerHeight;

  // --- SVG Templates for Lily of the Valley Clusters ---
  // Authentic Convallaria majalis: Multi-stem racemes with dense hanging bells cascading above leaves
  function createBellSVG(x, y, pdx, pdy, scale, delay) {
    return `
      <g class="bell-group" style="animation-delay: ${delay}s" transform="translate(${x}, ${y})">
        <path d="M 0 0 Q ${pdx * 0.4} ${pdy * 0.7} ${pdx} ${pdy}" fill="none" stroke="#68936a" stroke-width="1.7" stroke-linecap="round" />
        <g transform="translate(${pdx}, ${pdy}) scale(${scale})">
          <!-- Bell blossom with scalloped rim -->
          <path d="M 0 0 C -7 2, -12 8, -11 17 C -11 23, -7 25, -4 22 C -2 24, 0 24, 2 22 C 4 24, 7 24, 7 22 C 10 24, 12 21, 11 17 C 12 8, 7 2, 0 0 Z" 
                fill="#ffffff" stroke="#c4dec9" stroke-width="0.8" />
          <ellipse cx="0" cy="20" rx="9" ry="3.8" fill="#fff9db" opacity="0.9" />
          <circle cx="-1" cy="19" r="1.5" fill="#f0d575" />
          <circle cx="2" cy="19" r="1.3" fill="#f0d575" />
        </g>
      </g>
    `;
  }

  function createLilyClusterSVG(scale = 1, flip = false, variant = 0) {
    const transformFlip = flip ? 'scale(-1, 1)' : '';
    let stemsAndBells = '';

    if (variant === 0) {
      // 3-Stem Fountain Cluster: Center Tall + Left Arch + Right Arch (~21 bells)
      // Stalk 1 (Center tall arch to left: reaches x: 80, y: 25)
      const stalk1Bells = [
        { x: 85,  y: 35,  pdx: -16, pdy: 14, s: 0.8,  d: 0.1 },
        { x: 102, y: 68,  pdx: -20, pdy: 16, s: 0.95, d: 0.25 },
        { x: 118, y: 108, pdx: -24, pdy: 18, s: 1.1,  d: 0.4 },
        { x: 130, y: 152, pdx: -25, pdy: 20, s: 1.18, d: 0.55 },
        { x: 138, y: 200, pdx: -24, pdy: 20, s: 1.15, d: 0.7 },
        { x: 144, y: 248, pdx: -22, pdy: 18, s: 1.05, d: 0.85 },
        { x: 147, y: 292, pdx: -20, pdy: 16, s: 0.9,  d: 0.95 }
      ];
      let b1 = '';
      stalk1Bells.forEach(b => { b1 += createBellSVG(b.x, b.y, b.pdx, b.pdy, b.s, b.d); });

      // Stalk 2 (Tall right arch: reaches x: 255, y: 40)
      const stalk2Bells = [
        { x: 250, y: 48,  pdx: 16, pdy: 14, s: 0.82, d: 0.15 },
        { x: 232, y: 80,  pdx: 20, pdy: 16, s: 0.98, d: 0.3 },
        { x: 215, y: 120, pdx: 24, pdy: 18, s: 1.12, d: 0.45 },
        { x: 200, y: 165, pdx: 25, pdy: 20, s: 1.16, d: 0.6 },
        { x: 188, y: 212, pdx: 24, pdy: 20, s: 1.14, d: 0.75 },
        { x: 178, y: 260, pdx: 22, pdy: 18, s: 1.02, d: 0.9 },
        { x: 170, y: 304, pdx: 20, pdy: 16, s: 0.88, d: 1.05 }
      ];
      let b2 = '';
      stalk2Bells.forEach(b => { b2 += createBellSVG(b.x, b.y, b.pdx, b.pdy, b.s, b.d); });

      // Stalk 3 (Upper center arch: reaches x: 150, y: 15)
      const stalk3Bells = [
        { x: 150, y: 20,  pdx: -15, pdy: 13, s: 0.78, d: 0.2 },
        { x: 160, y: 55,  pdx: -18, pdy: 15, s: 0.95, d: 0.35 },
        { x: 165, y: 95,  pdx: -22, pdy: 17, s: 1.08, d: 0.5 },
        { x: 166, y: 140, pdx: -23, pdy: 18, s: 1.12, d: 0.65 },
        { x: 164, y: 185, pdx: -22, pdy: 18, s: 1.05, d: 0.8 },
        { x: 162, y: 230, pdx: -20, pdy: 16, s: 0.92, d: 0.95 }
      ];
      let b3 = '';
      stalk3Bells.forEach(b => { b3 += createBellSVG(b.x, b.y, b.pdx, b.pdy, b.s, b.d); });

      stemsAndBells = `
        <!-- Stalk 1 -->
        <path d="M 150 430 Q 150 290 142 190 Q 134 80 85 35" fill="none" stroke="#68936a" stroke-width="3" stroke-linecap="round"/>
        ${b1}
        <!-- Stalk 2 -->
        <path d="M 160 430 Q 165 300 185 200 Q 205 90 250 48" fill="none" stroke="#638d65" stroke-width="2.8" stroke-linecap="round"/>
        ${b2}
        <!-- Stalk 3 -->
        <path d="M 155 430 Q 162 270 165 160 Q 166 70 150 20" fill="none" stroke="#719b73" stroke-width="2.6" stroke-linecap="round"/>
        ${b3}
      `;
    } else {
      // 2-Stem Spreading Cluster (~15 bells)
      // Stalk A (Left sweep: reaches x: 60, y: 30)
      const stalkABells = [
        { x: 65,  y: 35,  pdx: -16, pdy: 14, s: 0.8,  d: 0.1 },
        { x: 88,  y: 72,  pdx: -20, pdy: 16, s: 0.98, d: 0.25 },
        { x: 110, y: 118, pdx: -24, pdy: 18, s: 1.12, d: 0.4 },
        { x: 126, y: 168, pdx: -24, pdy: 20, s: 1.18, d: 0.55 },
        { x: 138, y: 220, pdx: -23, pdy: 20, s: 1.12, d: 0.7 },
        { x: 144, y: 272, pdx: -21, pdy: 18, s: 1.0,  d: 0.85 },
        { x: 148, y: 320, pdx: -18, pdy: 16, s: 0.88, d: 1.0 }
      ];
      let bA = '';
      stalkABells.forEach(b => { bA += createBellSVG(b.x, b.y, b.pdx, b.pdy, b.s, b.d); });

      // Stalk B (Right sweep: reaches x: 260, y: 40)
      const stalkBBells = [
        { x: 255, y: 45,  pdx: 16, pdy: 14, s: 0.82, d: 0.15 },
        { x: 235, y: 85,  pdx: 20, pdy: 16, s: 0.98, d: 0.3 },
        { x: 215, y: 132, pdx: 23, pdy: 18, s: 1.12, d: 0.45 },
        { x: 198, y: 184, pdx: 24, pdy: 20, s: 1.15, d: 0.6 },
        { x: 184, y: 238, pdx: 23, pdy: 20, s: 1.1,  d: 0.75 },
        { x: 174, y: 290, pdx: 20, pdy: 18, s: 0.98, d: 0.9 },
        { x: 166, y: 338, pdx: 18, pdy: 16, s: 0.85, d: 1.05 }
      ];
      let bB = '';
      stalkBBells.forEach(b => { bB += createBellSVG(b.x, b.y, b.pdx, b.pdy, b.s, b.d); });

      stemsAndBells = `
        <path d="M 150 430 Q 148 290 138 190 Q 124 85 65 35" fill="none" stroke="#68936a" stroke-width="3" stroke-linecap="round"/>
        ${bA}
        <path d="M 158 430 Q 168 300 186 200 Q 206 90 255 45" fill="none" stroke="#638d65" stroke-width="2.8" stroke-linecap="round"/>
        ${bB}
      `;
    }

    return `
      <svg class="cluster-svg" viewBox="0 0 320 440" width="${280 * scale}" height="${400 * scale}" style="overflow: visible; filter: drop-shadow(0 4px 14px rgba(35, 65, 40, 0.15)); ${transformFlip ? 'transform:' + transformFlip + ';' : ''}">
        <defs>
          <linearGradient id="cLeafA" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="#88b58a"/>
            <stop offset="50%" stop-color="#4e7c54"/>
            <stop offset="100%" stop-color="#2c5132"/>
          </linearGradient>
          <linearGradient id="cLeafB" x1="1" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#9fc8a2"/>
            <stop offset="50%" stop-color="#5a8b61"/>
            <stop offset="100%" stop-color="#345e3a"/>
          </linearGradient>
        </defs>
        
        <!-- Base Leaves (Sleek, staying gracefully below the bells) -->
        <g class="leaves-base" opacity="0.94">
          <!-- Left Leaf -->
          <path d="M 155 430 C 120 380, 45 310, 60 210 C 72 150, 120 200, 148 340 Z" fill="url(#cLeafA)"/>
          <path d="M 155 430 Q 85 270 65 170" fill="none" stroke="#b0dcb2" stroke-width="1.8" stroke-linecap="round" opacity="0.45"/>

          <!-- Right Leaf -->
          <path d="M 155 430 C 185 380, 265 300, 245 190 C 230 130, 185 190, 162 330 Z" fill="url(#cLeafB)"/>
          <path d="M 155 430 Q 215 260 240 160" fill="none" stroke="#c0e6c2" stroke-width="1.8" stroke-linecap="round" opacity="0.45"/>

          <!-- Center Fore Leaf -->
          <path d="M 155 430 C 135 370, 115 280, 135 210 C 150 165, 170 210, 165 350 Z" fill="url(#cLeafA)" opacity="0.85"/>
        </g>

        <!-- Stems & Hanging Bells (Prominently arched above leaves) -->
        ${stemsAndBells}
      </svg>
    `;
  }

  // --- Dynamic Garden Sprouting Schedule (Dense, 36 Positions) ---
  const gardenLayout = [
    // Back Layer: 12 clusters across screen
    { layer: 'back', left: -2,  scale: 0.88, flip: false, rot: -4, var: 0, thresh: 0.12 },
    { layer: 'back', left: 8,   scale: 0.82, flip: true,  rot: 3,  var: 1, thresh: 0.18 },
    { layer: 'back', left: 18,  scale: 0.90, flip: false, rot: -2, var: 0, thresh: 0.25 },
    { layer: 'back', left: 27,  scale: 0.85, flip: true,  rot: 4,  var: 1, thresh: 0.32 },
    { layer: 'back', left: 36,  scale: 0.92, flip: false, rot: -3, var: 0, thresh: 0.22 },
    { layer: 'back', left: 46,  scale: 0.86, flip: true,  rot: 2,  var: 1, thresh: 0.38 },
    { layer: 'back', left: 55,  scale: 0.90, flip: false, rot: -4, var: 0, thresh: 0.44 },
    { layer: 'back', left: 64,  scale: 0.84, flip: true,  rot: 3,  var: 1, thresh: 0.30 },
    { layer: 'back', left: 73,  scale: 0.92, flip: false, rot: -2, var: 0, thresh: 0.40 },
    { layer: 'back', left: 82,  scale: 0.86, flip: true,  rot: 4,  var: 1, thresh: 0.28 },
    { layer: 'back', left: 91,  scale: 0.90, flip: false, rot: -3, var: 0, thresh: 0.16 },
    { layer: 'back', left: 98,  scale: 0.84, flip: true,  rot: 2,  var: 1, thresh: 0.34 },

    // Mid Layer: 14 clusters forming lush flower dense body
    { layer: 'mid', left: -4,  scale: 1.10, flip: false, rot: -5, var: 0, thresh: 0.20 },
    { layer: 'mid', left: 4,   scale: 1.05, flip: true,  rot: 3,  var: 1, thresh: 0.35 },
    { layer: 'mid', left: 12,  scale: 1.15, flip: false, rot: -3, var: 0, thresh: 0.45 },
    { layer: 'mid', left: 21,  scale: 1.08, flip: true,  rot: 2,  var: 1, thresh: 0.50 },
    { layer: 'mid', left: 29,  scale: 1.12, flip: false, rot: -4, var: 0, thresh: 0.58 },
    { layer: 'mid', left: 38,  scale: 1.06, flip: true,  rot: 3,  var: 1, thresh: 0.62 },
    { layer: 'mid', left: 48,  scale: 1.16, flip: false, rot: -2, var: 0, thresh: 0.66 },
    { layer: 'mid', left: 56,  scale: 1.08, flip: true,  rot: 4,  var: 1, thresh: 0.54 },
    { layer: 'mid', left: 65,  scale: 1.14, flip: false, rot: -3, var: 0, thresh: 0.60 },
    { layer: 'mid', left: 74,  scale: 1.06, flip: true,  rot: 2,  var: 1, thresh: 0.48 },
    { layer: 'mid', left: 81,  scale: 1.15, flip: false, rot: -4, var: 0, thresh: 0.42 },
    { layer: 'mid', left: 88,  scale: 1.08, flip: true,  rot: 3,  var: 1, thresh: 0.38 },
    { layer: 'mid', left: 94,  scale: 1.12, flip: false, rot: -2, var: 0, thresh: 0.52 },
    { layer: 'mid', left: 101, scale: 1.05, flip: true,  rot: 4,  var: 1, thresh: 0.28 },

    // Fore Layer: 10 framing tall clusters (grand cascades)
    { layer: 'fore', left: -5,  scale: 1.35, flip: false, rot: -6, var: 0, thresh: 0.52 },
    { layer: 'fore', left: 7,   scale: 1.28, flip: true,  rot: 3,  var: 1, thresh: 0.65 },
    { layer: 'fore', left: 17,  scale: 1.32, flip: false, rot: -3, var: 0, thresh: 0.74 },
    { layer: 'fore', left: 31,  scale: 1.25, flip: true,  rot: 4,  var: 1, thresh: 0.82 },
    { layer: 'fore', left: 44,  scale: 1.30, flip: false, rot: -2, var: 0, thresh: 0.88 },
    { layer: 'fore', left: 58,  scale: 1.26, flip: true,  rot: 3,  var: 1, thresh: 0.84 },
    { layer: 'fore', left: 70,  scale: 1.32, flip: false, rot: -4, var: 0, thresh: 0.76 },
    { layer: 'fore', left: 80,  scale: 1.28, flip: true,  rot: 3,  var: 1, thresh: 0.70 },
    { layer: 'fore', left: 90,  scale: 1.36, flip: false, rot: 5,  var: 0, thresh: 0.60 },
    { layer: 'fore', left: 99,  scale: 1.30, flip: true,  rot: -5, var: 1, thresh: 0.55 }
  ];

  function getLayerContainer(layerName) {
    if (layerName === 'back') return gardenLayerBack;
    if (layerName === 'fore') return gardenLayerFore;
    return gardenLayerMid;
  }

  function checkGardenSprouts(progress) {
    gardenLayout.forEach((item, index) => {
      if (progress >= item.thresh && !spawnedClusters[index]) {
        spawnCluster(item, index);
      }
    });
  }

  function spawnCluster(config, index) {
    const container = getLayerContainer(config.layer);
    const clusterEl = document.createElement('div');
    clusterEl.className = 'garden-cluster sprouting cluster-sway';
    
    // Set custom CSS variables for swaying
    const swayDur = (4.0 + Math.random() * 2.5).toFixed(1) + 's';
    const swayDelay = (-Math.random() * 4).toFixed(1) + 's';
    clusterEl.style.setProperty('--sway-dur', swayDur);
    clusterEl.style.setProperty('--sway-delay', swayDelay);
    clusterEl.style.setProperty('--rot-start', `${config.rot - 8}deg`);
    clusterEl.style.setProperty('--rot-end', `${config.rot}deg`);
    
    let bottomOffset = -10;
    if (config.layer === 'back') bottomOffset = 25 + Math.random() * 30;
    else if (config.layer === 'mid') bottomOffset = 0 + Math.random() * 20;
    else bottomOffset = -20 + Math.random() * 15;

    clusterEl.style.left = `${config.left}%`;
    clusterEl.style.bottom = `${bottomOffset}px`;
    clusterEl.innerHTML = createLilyClusterSVG(config.scale, config.flip, config.var || 0);

    container.appendChild(clusterEl);
    spawnedClusters[index] = clusterEl;

    // Trigger sweet bell chime sound when cluster pops up
    if (Math.random() > 0.4) {
      playMagicalChime(400 + Math.random() * 500);
    }

    // Burst tiny sparkles at base of new sprout
    const rect = clusterEl.getBoundingClientRect();
    spawnBurstSparkles(rect.left + rect.width / 2, window.innerHeight - 30, 8);
  }

  // --- Pointer Events (Drag & Interaction) ---
  function initPointerInteraction() {
    flowerWrapper.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove, { passive: false });
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerUp);

    // Prevent default context menu or drag gestures
    flowerWrapper.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  function onPointerDown(e) {
    if (isGardenFullyBloomed) return;
    
    isDragging = true;
    dragCueGuide.style.opacity = '0';
    flowerWrapper.classList.add('is-dragging');
    try {
      flowerWrapper.setPointerCapture(e.pointerId);
    } catch (err) {}

    dragStartX = e.clientX;
    dragStartY = e.clientY;
    lastMoveX = e.clientX;
    lastMoveY = e.clientY;
    lastMoveTime = performance.now();

    // Start background gentle melody on first gesture
    startAudioIfNeeded();

    // Spawn touch ripples
    spawnBurstSparkles(e.clientX, e.clientY, 12);
    playBellNote(523.25); // C5 note
  }

  function onPointerMove(e) {
    if (!isDragging) {
      // Wind sway mouse tracking over master flower when hovering
      if (!isGardenFullyBloomed) {
        const rect = flowerWrapper.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const diffX = (e.clientX - centerX) / (rect.width / 2);
        const tilt = Math.max(-6, Math.min(6, diffX * 5));
        draggableFlower.style.transform = `rotate(${tilt}deg)`;
      }
      return;
    }

    if (e.cancelable) {
      e.preventDefault(); // Stop mobile scrolling
    }

    const now = performance.now();
    const dt = Math.max(16, now - lastMoveTime);
    const dx = e.clientX - lastMoveX;
    const dy = e.clientY - lastMoveY;

    // Calculate movement distance
    const dist = Math.hypot(dx, dy);
    cumulativeDistance += dist;

    // Calculate velocity for natural stem tilt
    velocityX = (dx / dt) * 16;
    velocityY = (dy / dt) * 16;
    lastMoveX = e.clientX;
    lastMoveY = e.clientY;
    lastMoveTime = now;

    // Calculate offset relative to initial grab point
    flowerTargetX = (e.clientX - dragStartX) * 0.7;
    flowerTargetY = (e.clientY - dragStartY) * 0.7;

    // Apply smooth dragging physics
    const tiltAngle = Math.max(-18, Math.min(18, velocityX * 1.8));
    draggableFlower.style.transform = `translate(${flowerTargetX}px, ${flowerTargetY}px) rotate(${tiltAngle}deg)`;

    // Spawn trail sparkles
    if (dist > 5) {
      spawnTrailSparkle(e.clientX, e.clientY);
    }

    // Update progress using both cumulative traversal and direct pull
    const directPull = Math.hypot(flowerTargetX, flowerTargetY);
    dragProgress = Math.min(1.0, Math.max(cumulativeDistance / DRAG_THRESHOLD, directPull / 220));
    updateProgressUI(dragProgress);
    checkGardenSprouts(dragProgress);

    // If reached 100%, trigger Grand Bloom immediately
    if (dragProgress >= 1.0 && !isGardenFullyBloomed) {
      onPointerUp(e);
      completeGardenBloom();
    }
  }

  function onPointerUp(e) {
    if (!isDragging) return;
    isDragging = false;
    flowerWrapper.classList.remove('is-dragging');
    try {
      if (e && e.pointerId) flowerWrapper.releasePointerCapture(e.pointerId);
    } catch (err) {}

    // Tap fallback: If user tapped/clicked without substantial dragging, award progress!
    const dragDistance = Math.hypot(flowerTargetX, flowerTargetY);
    if (dragDistance < 12 && cumulativeDistance < 30) {
      cumulativeDistance += 120; // +25% on tap
      dragProgress = Math.min(1.0, cumulativeDistance / DRAG_THRESHOLD);
      updateProgressUI(dragProgress);
      checkGardenSprouts(dragProgress);
      playMagicalChime(550);
      spawnBurstSparkles(lastMoveX, lastMoveY, 15);
    }

    // If progress is far enough (>= 0.65), help the user bloom fully!
    if (dragProgress >= 0.65 && !isGardenFullyBloomed) {
      animateProgressToFull();
    } else if (!isGardenFullyBloomed) {
      // Return gently to center
      draggableFlower.style.transition = 'transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)';
      draggableFlower.style.transform = 'translate(0px, 0px) rotate(0deg)';
      setTimeout(() => {
        draggableFlower.style.transition = '';
      }, 600);
    }
  }

  function animateProgressToFull() {
    const startProgress = dragProgress;
    const duration = 1200;
    const startTime = performance.now();

    function step(now) {
      const elapsed = now - startTime;
      const t = Math.min(1, elapsed / duration);
      // Ease out cubic
      const ease = 1 - Math.pow(1 - t, 3);
      dragProgress = startProgress + (1 - startProgress) * ease;
      
      updateProgressUI(dragProgress);
      checkGardenSprouts(dragProgress);

      if (t < 1) {
        requestAnimationFrame(step);
      } else {
        completeGardenBloom();
      }
    }
    requestAnimationFrame(step);
  }

  // --- Update Progress Vine & Indicators ---
  function updateProgressUI(progress) {
    // Fill the SVG vine path
    const offset = 400 * (1 - progress);
    vinePathFill.style.strokeDashoffset = offset;

    // Activate bud milestone nodes
    const nodes = vineBuds.querySelectorAll('.bud-node');
    if (progress >= 0.15) nodes[0].classList.add('active');
    if (progress >= 0.45) nodes[1].classList.add('active');
    if (progress >= 0.75) nodes[2].classList.add('active');
    if (progress >= 0.98) nodes[3].classList.add('active');

    // Warm up the sky softly
    if (progress > 0.3) {
      skyBackground.classList.add('bloomed');
    }
  }

  // --- Grand Blooming Climax ---
  function completeGardenBloom() {
    if (isGardenFullyBloomed) return;
    isGardenFullyBloomed = true;

    // Ensure all remaining clusters bloom
    gardenLayout.forEach((item, index) => {
      if (!spawnedClusters[index]) {
        setTimeout(() => {
          spawnCluster(item, index);
        }, index * 80);
      }
    });

    // Animate master flower gracefully settling into the garden stage
    draggableFlower.style.transition = 'transform 1.4s cubic-bezier(0.25, 1, 0.5, 1), opacity 1.4s ease';
    draggableFlower.style.transform = `translate(0px, 80px) scale(0.9)`;
    
    // Hide initial guidance text
    initialScreen.classList.add('garden-bloomed');

    // Joyous celebratory particle explosion
    spawnCelebrationCascade();

    // Play Grand Harp Arpeggio
    playGrandArpeggio();

    // After an emotional pause (~1.3s), present the 20/10 Greeting Card
    setTimeout(() => {
      showGreetingCard();
    }, 1300);
  }

  function showGreetingCard() {
    cardShown = true;
    cardOverlay.classList.add('active');
    gardenHudControls.classList.remove('visible');
  }

  function hideGreetingCard() {
    cardShown = false;
    cardOverlay.classList.remove('active');
    gardenHudControls.classList.add('visible');
    
    // Show toast hint that user can interact with the garden
    showWishToast('Chạm vào bất kỳ đâu trong khu vườn để gieo đóa hoa hạnh phúc! 🌸');
  }

  function showWishToast(msg) {
    const textEl = document.getElementById('wishToastText');
    if (textEl) textEl.textContent = msg;
    wishToast.classList.add('active');
    setTimeout(() => {
      wishToast.classList.remove('active');
    }, 4500);
  }

  // --- Canvas Particle System (Petals, Golden Dust, Butterflies) ---
  const petals = [];
  const sparkles = [];
  const butterflies = [];

  class LilyPetal {
    constructor() {
      this.reset(true);
    }
    reset(initial = false) {
      this.x = Math.random() * width;
      this.y = initial ? Math.random() * height : -20;
      this.size = 7 + Math.random() * 8;
      this.speedY = 0.6 + Math.random() * 0.9;
      this.speedX = Math.sin(Math.random() * Math.PI) * 0.8;
      this.rotation = Math.random() * 360;
      this.rotSpeed = (Math.random() - 0.5) * 1.5;
      this.wobble = Math.random() * Math.PI * 2;
      this.wobbleSpeed = 0.02 + Math.random() * 0.02;
      this.opacity = 0.45 + Math.random() * 0.45;
    }
    update() {
      this.wobble += this.wobbleSpeed;
      this.x += this.speedX + Math.sin(this.wobble) * 0.7;
      this.y += this.speedY;
      this.rotation += this.rotSpeed;

      if (this.y > height + 30 || this.x < -30 || this.x > width + 30) {
        this.reset();
      }
    }
    draw(ctx) {
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate((this.rotation * Math.PI) / 180);
      ctx.fillStyle = `rgba(255, 255, 255, ${this.opacity})`;
      ctx.shadowColor = 'rgba(217, 235, 220, 0.5)';
      ctx.shadowBlur = 4;
      
      // Draw bell petal curve
      ctx.beginPath();
      ctx.ellipse(0, 0, this.size * 0.55, this.size, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  class SparkleParticle {
    constructor(x, y, vx, vy, color, size, life) {
      this.x = x;
      this.y = y;
      this.vx = vx;
      this.vy = vy;
      this.color = color || '#fae69e';
      this.size = size || 3;
      this.life = life || 1;
      this.maxLife = this.life;
    }
    update() {
      this.x += this.vx;
      this.y += this.vy;
      this.vy += 0.015; // gentle float gravity
      this.life -= 0.02;
    }
    draw(ctx) {
      const alpha = Math.max(0, this.life / this.maxLife);
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.fillStyle = this.color;
      ctx.globalAlpha = alpha;
      ctx.shadowColor = this.color;
      ctx.shadowBlur = 8;
      
      // Little diamond/cross sparkle shape
      const s = this.size;
      ctx.beginPath();
      ctx.moveTo(0, -s);
      ctx.lineTo(s * 0.35, 0);
      ctx.lineTo(0, s);
      ctx.lineTo(-s * 0.35, 0);
      ctx.closePath();
      ctx.fill();
      
      ctx.beginPath();
      ctx.arc(0, 0, s * 0.35, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  class FairyButterfly {
    constructor() {
      this.x = Math.random() * width;
      this.y = height * 0.4 + Math.random() * (height * 0.5);
      this.targetX = this.x;
      this.targetY = this.y;
      this.size = 9 + Math.random() * 5;
      this.wingAngle = 0;
      this.wingSpeed = 0.2 + Math.random() * 0.15;
      this.color = Math.random() > 0.5 ? '#fce2eb' : '#e6f3eb';
      this.edgeColor = '#d9b466';
      this.angle = 0;
    }
    update() {
      this.wingAngle += this.wingSpeed;
      
      // Smooth wandering motion
      if (Math.hypot(this.targetX - this.x, this.targetY - this.y) < 20 || Math.random() < 0.01) {
        this.targetX = 50 + Math.random() * (width - 100);
        this.targetY = height * 0.25 + Math.random() * (height * 0.65);
      }
      
      const dx = this.targetX - this.x;
      const dy = this.targetY - this.y;
      this.x += dx * 0.008;
      this.y += dy * 0.008 + Math.sin(this.wingAngle * 0.5) * 0.6;
      this.angle = Math.atan2(dy, dx);
    }
    draw(ctx) {
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate(this.angle + Math.PI / 2);
      const flap = Math.sin(this.wingAngle);

      ctx.fillStyle = this.color;
      ctx.strokeStyle = this.edgeColor;
      ctx.lineWidth = 0.7;

      // Left wing
      ctx.save();
      ctx.scale(flap, 1);
      ctx.beginPath();
      ctx.ellipse(-this.size * 0.6, 0, this.size * 0.7, this.size * 1.1, -0.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();

      // Right wing
      ctx.save();
      ctx.scale(-flap, 1);
      ctx.beginPath();
      ctx.ellipse(-this.size * 0.6, 0, this.size * 0.7, this.size * 1.1, -0.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();

      ctx.restore();
    }
  }

  function initParticles() {
    petals.length = 0;
    sparkles.length = 0;
    butterflies.length = 0;

    // Populate initial drifting petals
    const petalCount = width < 600 ? 18 : 32;
    for (let i = 0; i < petalCount; i++) {
      petals.push(new LilyPetal());
    }

    // Populate gentle butterflies
    const butterflyCount = width < 600 ? 2 : 4;
    for (let i = 0; i < butterflyCount; i++) {
      butterflies.push(new FairyButterfly());
    }
  }

  function spawnTrailSparkle(x, y) {
    const vx = (Math.random() - 0.5) * 2;
    const vy = (Math.random() - 0.5) * 2;
    const colors = ['#fce8a6', '#ffffff', '#c5e4cb', '#f7d3df'];
    const col = colors[Math.floor(Math.random() * colors.length)];
    sparkles.push(new SparkleParticle(x, y, vx, vy, col, 3 + Math.random() * 2.5, 0.9));
  }

  function spawnBurstSparkles(x, y, count = 10) {
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
      const speed = 1.5 + Math.random() * 3.5;
      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed;
      const colors = ['#fdeba4', '#ffffff', '#bce2c4', '#fce1ec'];
      const col = colors[Math.floor(Math.random() * colors.length)];
      sparkles.push(new SparkleParticle(x, y, vx, vy, col, 3.5 + Math.random() * 3, 1.2));
    }
  }

  function spawnCelebrationCascade() {
    for (let i = 0; i < 40; i++) {
      setTimeout(() => {
        const x = Math.random() * width;
        const y = Math.random() * (height * 0.6);
        spawnBurstSparkles(x, y, 6);
      }, i * 50);
    }
  }

  function animateLoop() {
    ctx.clearRect(0, 0, width, height);

    // Draw & update falling lily petals
    petals.forEach(p => {
      p.update();
      p.draw(ctx);
    });

    // Draw & update sparkling dust
    for (let i = sparkles.length - 1; i >= 0; i--) {
      const s = sparkles[i];
      s.update();
      s.draw(ctx);
      if (s.life <= 0) {
        sparkles.splice(i, 1);
      }
    }

    // Draw butterflies when garden is flourishing
    if (isGardenFullyBloomed || dragProgress > 0.4) {
      butterflies.forEach(b => {
        b.update();
        b.draw(ctx);
      });
    }

    animationFrameId = requestAnimationFrame(animateLoop);
  }

  // --- Garden Interaction: Plant a Blessing Wish on Tap ---
  const blessingsList = [
    'An Yên 🕊️',
    'Hạnh Phúc 🌸',
    'Bình Yên 🌿',
    'Rạng Rỡ ✨',
    'Ngọt Ngào 🤍',
    'Yêu Đời 💖',
    'May Mắn 🍀',
    'Thuần Khiết 🌼',
    'Vạn Sự Cát Tường 🌟'
  ];
  let blessingIdx = 0;

  function handleGardenClick(e) {
    if (!isGardenFullyBloomed || cardShown) return;

    // Check if clicked an interactive button or HUD
    if (e.target.closest('#gardenHudControls') || e.target.closest('#audioControlWrap')) return;

    const x = e.clientX;
    const y = e.clientY;

    // Burst sparkles
    spawnBurstSparkles(x, y, 14);

    // Play chime
    playMagicalChime(500 + Math.random() * 400);

    // Spawn floating blessing text
    const blessingText = blessingsList[blessingIdx % blessingsList.length];
    blessingIdx++;

    const popup = document.createElement('div');
    popup.className = 'blessing-popup';
    popup.textContent = blessingText;
    popup.style.left = `${x}px`;
    popup.style.top = `${y}px`;

    experienceContainer.appendChild(popup);
    setTimeout(() => {
      if (popup.parentNode) popup.parentNode.removeChild(popup);
    }, 2300);
  }

  // --- Web Audio API: Crystalline Wind Chime & Peaceful Celesta Arpeggios ---
  let audioCtx = null;
  let melodyIntervalId = null;

  function initAudioContext() {
    if (!audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        audioCtx = new AudioContext();
      }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
  }

  function startAudioIfNeeded() {
    initAudioContext();
    if (!isAudioPlaying) {
      isAudioPlaying = true;
      audioToggleBtn.classList.add('playing');
      audioLabel.textContent = 'Đang phát';
      startAmbientCelestaMelody();
    }
  }

  function toggleAudio() {
    initAudioContext();
    isAudioPlaying = !isAudioPlaying;
    if (isAudioPlaying) {
      audioToggleBtn.classList.add('playing');
      audioLabel.textContent = 'Đang phát';
      startAmbientCelestaMelody();
      playMagicalChime(659.25);
    } else {
      audioToggleBtn.classList.remove('playing');
      audioLabel.textContent = 'Giai điệu';
      stopAmbientMelody();
    }
  }

  function playBellNote(freq, gainLevel = 0.15, duration = 1.4) {
    if (!audioCtx || audioCtx.state !== 'running') return;
    try {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime);

      gain.gain.setValueAtTime(0, audioCtx.currentTime);
      gain.gain.linearRampToValueAtTime(gainLevel, audioCtx.currentTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + duration);

      osc.connect(gain);
      gain.connect(audioCtx.destination);

      osc.start();
      osc.stop(audioCtx.currentTime + duration);
    } catch (err) {
      // Audio autoplay gracefully handled
    }
  }

  function playMagicalChime(baseFreq = 520) {
    if (!audioCtx || audioCtx.state !== 'running') return;
    const notes = [baseFreq, baseFreq * 1.25, baseFreq * 1.5, baseFreq * 2];
    notes.forEach((freq, idx) => {
      setTimeout(() => {
        playBellNote(freq, 0.12 - idx * 0.02, 1.2);
      }, idx * 70);
    });
  }

  function playGrandArpeggio() {
    if (!audioCtx || audioCtx.state !== 'running') return;
    // C Major 9 pentatonic harp flourish: C4, G4, C5, E5, G5, B5, C6, E6
    const chord = [261.63, 392.00, 523.25, 659.25, 783.99, 987.77, 1046.50, 1318.51];
    chord.forEach((freq, i) => {
      setTimeout(() => {
        playBellNote(freq, 0.18, 2.0);
      }, i * 110);
    });
  }

  // Soft ambient fairy music box lullaby (pentatonic, calming and beautiful)
  const lullabyNotes = [
    523.25, // C5
    659.25, // E5
    783.99, // G5
    880.00, // A5
    1046.50,// C6
    880.00, // A5
    783.99, // G5
    659.25, // E5
    587.33, // D5
    659.25, // E5
    783.99, // G5
    523.25  // C5
  ];
  let melodyStep = 0;

  function startAmbientCelestaMelody() {
    if (melodyIntervalId) clearInterval(melodyIntervalId);
    melodyIntervalId = setInterval(() => {
      if (isAudioPlaying && audioCtx && audioCtx.state === 'running') {
        const freq = lullabyNotes[melodyStep % lullabyNotes.length];
        playBellNote(freq, 0.09, 1.8);
        melodyStep++;
      }
    }, 750);
  }

  function stopAmbientMelody() {
    if (melodyIntervalId) {
      clearInterval(melodyIntervalId);
      melodyIntervalId = null;
    }
  }

  // --- Reset & Replay Experience ---
  function replayExperience() {
    isGardenFullyBloomed = false;
    cardShown = false;
    cumulativeDistance = 0;
    dragProgress = 0;
    spawnedClusters = [];

    // Clear all garden layers
    gardenLayerBack.innerHTML = '';
    gardenLayerMid.innerHTML = '';
    gardenLayerFore.innerHTML = '';

    // Reset initial flower
    draggableFlower.style.transition = '';
    draggableFlower.style.transform = 'translate(0px, 0px) rotate(0deg)';
    
    // Reset initial screen & cues
    initialScreen.classList.remove('garden-bloomed');
    dragCueGuide.style.opacity = '1';
    flowerWrapper.classList.remove('is-dragging');
    
    // Reset vine progress
    vinePathFill.style.strokeDashoffset = 400;
    vineBuds.querySelectorAll('.bud-node').forEach(n => n.classList.remove('active'));

    // Reset sky
    skyBackground.classList.remove('bloomed');

    // Hide overlays & HUD
    cardOverlay.classList.remove('active');
    gardenHudControls.classList.remove('visible');

    // Chime
    playMagicalChime(440);
  }

  // --- Window Resize & Setup ---
  function onResize() {
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;
    initParticles();
  }

  // --- Event Listeners Initialization ---
  function init() {
    onResize();
    window.addEventListener('resize', onResize);

    initPointerInteraction();
    requestAnimationFrame(animateLoop);

    // Audio button
    audioToggleBtn.addEventListener('click', toggleAudio);

    // Card buttons
    exploreGardenBtn.addEventListener('click', hideGreetingCard);
    sendWishBtn.addEventListener('click', () => {
      hideGreetingCard();
      showWishToast('Hãy chạm vào bất cứ đâu để gieo đóa hoa và ước nguyện nhé! 🌿');
    });

    // Garden HUD buttons
    reopenCardBtn.addEventListener('click', showGreetingCard);
    replayExperienceBtn.addEventListener('click', replayExperience);

    // Interactive garden taps (plant wishes)
    experienceContainer.addEventListener('click', handleGardenClick);

    // Ensure audio activates on any user interaction if not yet started
    document.body.addEventListener('click', () => {
      if (!audioCtx) initAudioContext();
    }, { once: true });
  }

  // Run on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
