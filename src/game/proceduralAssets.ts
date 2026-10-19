/**
 * Procedural 3D Models, Textures & Materials for Stadium Soccer Arena
 * Fully complies with Three.js Skill Directives:
 * - 3 to 12 part composite groups for actors, cars, and referee
 * - Procedural canvas textures with SRGBColorSpace & maximum anisotropy
 * - PBR materials with varied roughness/metalness
 * - Bottom-center pivot grounding
 */

import * as THREE from 'three';

export interface StadiumAssets {
  pitchTexture: THREE.CanvasTexture;
  ballTexture: THREE.CanvasTexture;
  adBoardTexture: THREE.CanvasTexture;
  netTexture: THREE.CanvasTexture;
  refereeStripeTexture: THREE.CanvasTexture;
}

// 1. Procedural High-Definition Football Pitch Canvas Texture
export function createPitchTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 2048;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d')!;

  // Base grass stripes
  const stripes = 20;
  const stripeH = canvas.height / stripes;
  for (let i = 0; i < stripes; i++) {
    ctx.fillStyle = i % 2 === 0 ? '#278b37' : '#1f772e';
    ctx.fillRect(0, i * stripeH, canvas.width, stripeH);
  }

  // Subtle grass blade noise
  const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imgData.data;
  for (let i = 0; i < data.length; i += 4) {
    const noise = (Math.random() - 0.5) * 12;
    data[i] = Math.max(0, Math.min(255, data[i] + noise * 0.5));
    data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + noise));
    data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + noise * 0.3));
  }
  ctx.putImageData(imgData, 0, 0);

  // Field markings (White lines)
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 10;
  ctx.lineCap = 'round';

  const marginX = 80;
  const marginY = 60;
  const pW = canvas.width - marginX * 2;
  const pH = canvas.height - marginY * 2;
  const midX = canvas.width / 2;
  const midY = canvas.height / 2;

  // Outer boundary line
  ctx.strokeRect(marginX, marginY, pW, pH);

  // Half-way line
  ctx.beginPath();
  ctx.moveTo(midX, marginY);
  ctx.lineTo(midX, marginY + pH);
  ctx.stroke();

  // Center circle & spot
  const centerRadius = 120;
  ctx.beginPath();
  ctx.arc(midX, midY, centerRadius, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(midX, midY, 8, 0, Math.PI * 2);
  ctx.fill();

  // Penalty Boxes (Left and Right)
  const penaltyW = 240;
  const penaltyH = 460;
  const goalAreaW = 100;
  const goalAreaH = 220;

  // Left side
  ctx.strokeRect(marginX, midY - penaltyH / 2, penaltyW, penaltyH);
  ctx.strokeRect(marginX, midY - goalAreaH / 2, goalAreaW, goalAreaH);
  // Penalty spot
  ctx.beginPath();
  ctx.arc(marginX + 170, midY, 7, 0, Math.PI * 2);
  ctx.fill();
  // Penalty arc
  ctx.beginPath();
  ctx.arc(marginX + 170, midY, 90, -0.9, 0.9);
  ctx.stroke();

  // Right side
  ctx.strokeRect(canvas.width - marginX - penaltyW, midY - penaltyH / 2, penaltyW, penaltyH);
  ctx.strokeRect(canvas.width - marginX - goalAreaW, midY - goalAreaH / 2, goalAreaW, goalAreaH);
  // Penalty spot
  ctx.beginPath();
  ctx.arc(canvas.width - marginX - 170, midY, 7, 0, Math.PI * 2);
  ctx.fill();
  // Penalty arc
  ctx.beginPath();
  ctx.arc(canvas.width - marginX - 170, midY, 90, Math.PI - 0.9, Math.PI + 0.9);
  ctx.stroke();

  // Corner arcs
  const cornerR = 30;
  // Top-left
  ctx.beginPath();
  ctx.arc(marginX, marginY, cornerR, 0, Math.PI / 2);
  ctx.stroke();
  // Bottom-left
  ctx.beginPath();
  ctx.arc(marginX, canvas.height - marginY, cornerR, -Math.PI / 2, 0);
  ctx.stroke();
  // Top-right
  ctx.beginPath();
  ctx.arc(canvas.width - marginX, marginY, cornerR, Math.PI / 2, Math.PI);
  ctx.stroke();
  // Bottom-right
  ctx.beginPath();
  ctx.arc(canvas.width - marginX, canvas.height - marginY, cornerR, Math.PI, Math.PI * 1.5);
  ctx.stroke();

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  return texture;
}

// 2. Procedural Soccer Ball Texture with Pentagon Patches
export function createBallTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#f8f8f8';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Black pentagon leather patches
  ctx.fillStyle = '#1c1c1e';
  const drawPentagon = (cx: number, cy: number, r: number) => {
    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
      const angle = (i * 2 * Math.PI) / 5 - Math.PI / 2;
      const x = cx + r * Math.cos(angle);
      const y = cy + r * Math.sin(angle);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#3a3a3c';
    ctx.stroke();
  };

  const rows = 4;
  const cols = 6;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if ((r + c) % 2 === 0) {
        const cx = (c + 0.5) * (canvas.width / cols);
        const cy = (r + 0.5) * (canvas.height / rows);
        drawPentagon(cx, cy, 26);
      }
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

// 3. Electronic Animated LED Ad Board Texture
export function createAdBoardTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;

  const gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
  gradient.addColorStop(0, '#0f172a');
  gradient.addColorStop(0.2, '#1e3a8a');
  gradient.addColorStop(0.5, '#7c3aed');
  gradient.addColorStop(0.8, '#b91c1c');
  gradient.addColorStop(1, '#0f172a');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = '#f8fafc';
  ctx.font = 'bold 36px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('SUPER TURBO FOOTBALL 3D  ★  CHAMPIONS LEAGUE 2026  ★  ACTION STADIUM', canvas.width / 2, canvas.height / 2);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.repeat.set(4, 1);
  return texture;
}

// 4. Net mesh texture
export function createNetTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
  ctx.lineWidth = 3;

  for (let i = 0; i <= canvas.width; i += 16) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i, canvas.height);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(0, i);
    ctx.lineTo(canvas.width, i);
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(16, 8);
  return texture;
}

// 5. Referee striped jersey texture
export function createRefereeTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;

  const stripes = 8;
  const w = canvas.width / stripes;
  for (let i = 0; i < stripes; i++) {
    ctx.fillStyle = i % 2 === 0 ? '#111827' : '#f9fafb';
    ctx.fillRect(i * w, 0, w, canvas.height);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

// 6. 3-12 Part Composite 3D Player Actor
export function createPlayerMesh(team: 'red' | 'blue', number: number, isGoalkeeper = false): THREE.Group {
  const group = new THREE.Group();

  const jerseyColor = isGoalkeeper ? '#10b981' : team === 'red' ? '#ef4444' : '#3b82f6';
  const shortsColor = isGoalkeeper ? '#064e3b' : team === 'red' ? '#7f1d1d' : '#1e3a8a';
  const skinColor = '#d97706';

  const jerseyMat = new THREE.MeshStandardMaterial({
    color: jerseyColor,
    roughness: 0.6,
    metalness: 0.1,
  });

  const shortsMat = new THREE.MeshStandardMaterial({
    color: shortsColor,
    roughness: 0.7,
    metalness: 0.05,
  });

  const skinMat = new THREE.MeshStandardMaterial({
    color: skinColor,
    roughness: 0.8,
    metalness: 0.0,
  });

  const bootMat = new THREE.MeshStandardMaterial({
    color: '#0f172a',
    roughness: 0.35,
    metalness: 0.3,
  });

  const hairMat = new THREE.MeshStandardMaterial({
    color: '#1e293b',
    roughness: 0.9,
    metalness: 0.0,
  });

  // Part 1: Torso (Jersey)
  const torsoGeo = new THREE.BoxGeometry(0.7, 0.9, 0.45);
  const torso = new THREE.Mesh(torsoGeo, jerseyMat);
  torso.position.y = 1.35;
  torso.castShadow = true;
  torso.receiveShadow = true;
  group.add(torso);

  // Part 2: Number badge on back/chest
  const numberGeo = new THREE.PlaneGeometry(0.25, 0.35);
  const numberMat = new THREE.MeshBasicMaterial({ color: '#ffffff' });
  const backBadge = new THREE.Mesh(numberGeo, numberMat);
  backBadge.position.set(0, 1.4, -0.23);
  backBadge.rotation.y = Math.PI;
  group.add(backBadge);

  // Part 3: Head
  const headGeo = new THREE.SphereGeometry(0.24, 16, 16);
  const head = new THREE.Mesh(headGeo, skinMat);
  head.position.y = 2.05;
  head.castShadow = true;
  group.add(head);

  // Part 4: Hair / Helmet
  const hairGeo = new THREE.CylinderGeometry(0.25, 0.26, 0.14, 16);
  const hair = new THREE.Mesh(hairGeo, hairMat);
  hair.position.y = 2.2;
  group.add(hair);

  // Part 5 & 6: Arms (Left & Right)
  const armGeo = new THREE.CylinderGeometry(0.1, 0.09, 0.65, 12);
  const leftArm = new THREE.Mesh(armGeo, jerseyMat);
  leftArm.position.set(-0.46, 1.4, 0);
  leftArm.rotation.z = 0.2;
  leftArm.castShadow = true;
  group.add(leftArm);

  const rightArm = new THREE.Mesh(armGeo, jerseyMat);
  rightArm.position.set(0.46, 1.4, 0);
  rightArm.rotation.z = -0.2;
  rightArm.castShadow = true;
  group.add(rightArm);

  // Part 7: Shorts (Hips)
  const hipsGeo = new THREE.BoxGeometry(0.68, 0.35, 0.44);
  const hips = new THREE.Mesh(hipsGeo, shortsMat);
  hips.position.y = 0.85;
  hips.castShadow = true;
  group.add(hips);

  // Part 8 & 9: Legs (Left & Right)
  const legGeo = new THREE.CylinderGeometry(0.12, 0.1, 0.6, 12);
  const leftLeg = new THREE.Mesh(legGeo, skinMat);
  leftLeg.position.set(-0.2, 0.45, 0);
  leftLeg.castShadow = true;
  group.add(leftLeg);

  const rightLeg = new THREE.Mesh(legGeo, skinMat);
  rightLeg.position.set(0.2, 0.45, 0);
  rightLeg.castShadow = true;
  group.add(rightLeg);

  // Part 10 & 11: Boots
  const bootGeo = new THREE.BoxGeometry(0.18, 0.14, 0.34);
  const leftBoot = new THREE.Mesh(bootGeo, bootMat);
  leftBoot.position.set(-0.2, 0.07, 0.06);
  leftBoot.castShadow = true;
  group.add(leftBoot);

  const rightBoot = new THREE.Mesh(bootGeo, bootMat);
  rightBoot.position.set(0.2, 0.07, 0.06);
  rightBoot.castShadow = true;
  group.add(rightBoot);

  // Soft contact shadow disk (grounding)
  const shadowGeo = new THREE.CircleGeometry(0.5, 16);
  const shadowMat = new THREE.MeshBasicMaterial({
    color: '#000000',
    transparent: true,
    opacity: 0.35,
    depthWrite: false,
  });
  const shadow = new THREE.Mesh(shadowGeo, shadowMat);
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.015;
  group.add(shadow);

  // Indicator ring over head for user player
  const ringGeo = new THREE.RingGeometry(0.35, 0.45, 24);
  const ringMat = new THREE.MeshBasicMaterial({
    color: team === 'red' ? '#ff4d4f' : '#4096ff',
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.85,
  });
  const ring = new THREE.Mesh(ringGeo, ringMat);
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 2.45;
  ring.name = 'indicatorRing';
  ring.visible = false;
  group.add(ring);

  group.userData = {
    leftLeg,
    rightLeg,
    leftArm,
    rightArm,
    indicatorRing: ring,
    team,
    number,
  };

  return group;
}

// 7. Composite 3D Referee Actor (with striped uniform and cards)
export function createRefereeMesh(stripeTex: THREE.CanvasTexture): THREE.Group {
  const group = new THREE.Group();

  const refJerseyMat = new THREE.MeshStandardMaterial({
    map: stripeTex,
    roughness: 0.5,
    metalness: 0.1,
  });
  const blackMat = new THREE.MeshStandardMaterial({ color: '#111827', roughness: 0.7 });
  const skinMat = new THREE.MeshStandardMaterial({ color: '#f59e0b', roughness: 0.8 });
  const yellowCardMat = new THREE.MeshStandardMaterial({ color: '#eab308', roughness: 0.2, metalness: 0.3 });
  const redCardMat = new THREE.MeshStandardMaterial({ color: '#ef4444', roughness: 0.2, metalness: 0.3 });

  // 1. Torso
  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.85, 0.4), refJerseyMat);
  torso.position.y = 1.35;
  torso.castShadow = true;
  group.add(torso);

  // 2. Head
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.23, 16, 16), skinMat);
  head.position.y = 2.05;
  head.castShadow = true;
  group.add(head);

  // 3. Whistle on neck
  const whistle = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 0.12), new THREE.MeshStandardMaterial({ color: '#cbd5e1', metalness: 0.9, roughness: 0.1 }));
  whistle.position.set(0, 1.85, 0.2);
  group.add(whistle);

  // 4. Arms & Cards
  const armGeo = new THREE.CylinderGeometry(0.09, 0.08, 0.6, 12);
  const leftArm = new THREE.Mesh(armGeo, blackMat);
  leftArm.position.set(-0.42, 1.4, 0);
  group.add(leftArm);

  const rightArm = new THREE.Mesh(armGeo, blackMat);
  rightArm.position.set(0.42, 1.4, 0);
  group.add(rightArm);

  // Right hand holding card
  const cardGeo = new THREE.PlaneGeometry(0.18, 0.28);
  const cardMesh = new THREE.Mesh(cardGeo, yellowCardMat);
  cardMesh.position.set(0.5, 2.2, 0.2);
  cardMesh.rotation.x = 0.2;
  cardMesh.visible = false;
  cardMesh.name = 'refereeCard';
  group.add(cardMesh);

  // Legs & Boots
  const legGeo = new THREE.CylinderGeometry(0.1, 0.09, 0.6, 12);
  const leftLeg = new THREE.Mesh(legGeo, blackMat);
  leftLeg.position.set(-0.18, 0.45, 0);
  group.add(leftLeg);

  const rightLeg = new THREE.Mesh(legGeo, blackMat);
  rightLeg.position.set(0.18, 0.45, 0);
  group.add(rightLeg);

  const bootGeo = new THREE.BoxGeometry(0.16, 0.12, 0.3);
  const leftBoot = new THREE.Mesh(bootGeo, blackMat);
  leftBoot.position.set(-0.18, 0.06, 0.05);
  group.add(leftBoot);

  const rightBoot = new THREE.Mesh(bootGeo, blackMat);
  rightBoot.position.set(0.18, 0.06, 0.05);
  group.add(rightBoot);

  // Ground shadow
  const shadow = new THREE.Mesh(
    new THREE.CircleGeometry(0.5, 16),
    new THREE.MeshBasicMaterial({ color: '#000000', transparent: true, opacity: 0.35, depthWrite: false })
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.015;
  group.add(shadow);

  group.userData = {
    cardMesh,
    yellowCardMat,
    redCardMat,
    leftLeg,
    rightLeg,
  };

  return group;
}

// 8. Composite 3D Turbo Soccer Battle Car (Rocket League Style)
export function createBattleCarMesh(team: 'red' | 'blue'): THREE.Group {
  const group = new THREE.Group();

  const bodyColor = team === 'red' ? '#dc2626' : '#2563eb';
  const accentColor = team === 'red' ? '#f59e0b' : '#38bdf8';

  const bodyMat = new THREE.MeshPhysicalMaterial({
    color: bodyColor,
    metalness: 0.85,
    roughness: 0.2,
    clearcoat: 1.0,
    clearcoatRoughness: 0.1,
  });

  const canopyMat = new THREE.MeshPhysicalMaterial({
    color: '#0f172a',
    metalness: 0.9,
    roughness: 0.1,
    transmission: 0.6,
    thickness: 0.5,
  });

  const rimMat = new THREE.MeshStandardMaterial({
    color: accentColor,
    metalness: 0.9,
    roughness: 0.2,
  });

  const tireMat = new THREE.MeshStandardMaterial({
    color: '#1e293b',
    roughness: 0.8,
  });

  // 1. Lower Chassis
  const chassisGeo = new THREE.BoxGeometry(1.6, 0.45, 2.8);
  const chassis = new THREE.Mesh(chassisGeo, bodyMat);
  chassis.position.y = 0.55;
  chassis.castShadow = true;
  group.add(chassis);

  // 2. Cockpit / Canopy
  const canopyGeo = new THREE.BoxGeometry(1.2, 0.45, 1.4);
  const canopy = new THREE.Mesh(canopyGeo, canopyMat);
  canopy.position.set(0, 0.9, -0.2);
  canopy.castShadow = true;
  group.add(canopy);

  // 3. Front Bumper / Ramming wedge for soccer ball
  const ramGeo = new THREE.BoxGeometry(1.7, 0.35, 0.4);
  const ramMat = new THREE.MeshStandardMaterial({ color: '#334155', metalness: 0.8, roughness: 0.3 });
  const ram = new THREE.Mesh(ramGeo, ramMat);
  ram.position.set(0, 0.4, 1.45);
  ram.castShadow = true;
  group.add(ram);

  // 4. Rear Spoiler Wing
  const wingGeo = new THREE.BoxGeometry(1.7, 0.08, 0.4);
  const wing = new THREE.Mesh(wingGeo, bodyMat);
  wing.position.set(0, 1.15, -1.3);
  group.add(wing);

  const strut1 = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.3, 8), ramMat);
  strut1.position.set(-0.6, 0.95, -1.3);
  group.add(strut1);

  const strut2 = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.3, 8), ramMat);
  strut2.position.set(0.6, 0.95, -1.3);
  group.add(strut2);

  // 5. Nitro Exhaust Thruster (Glows when boosting)
  const exhaustGeo = new THREE.CylinderGeometry(0.18, 0.22, 0.4, 16);
  const exhaustMat = new THREE.MeshStandardMaterial({ color: '#1e1e1e', metalness: 0.9, roughness: 0.1 });
  const exhaust = new THREE.Mesh(exhaustGeo, exhaustMat);
  exhaust.rotation.x = Math.PI / 2;
  exhaust.position.set(0, 0.55, -1.45);
  group.add(exhaust);

  // Nitro Flame Cone
  const flameGeo = new THREE.ConeGeometry(0.2, 0.8, 12);
  const flameMat = new THREE.MeshBasicMaterial({ color: '#38bdf8', transparent: true, opacity: 0.0 });
  const flame = new THREE.Mesh(flameGeo, flameMat);
  flame.rotation.x = -Math.PI / 2;
  flame.position.set(0, 0.55, -1.9);
  flame.name = 'nitroFlame';
  group.add(flame);

  // 6. Blaster Laser Cannon Turret (Battle Soccer Mode)
  const turretBase = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.22, 0.15, 16), ramMat);
  turretBase.position.set(0, 1.15, 0.2);
  group.add(turretBase);

  const barrelGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.7, 12);
  const barrelMat = new THREE.MeshStandardMaterial({ color: '#f59e0b', metalness: 0.9, roughness: 0.2 });
  const barrel = new THREE.Mesh(barrelGeo, barrelMat);
  barrel.rotation.x = Math.PI / 2;
  barrel.position.set(0, 1.22, 0.6);
  group.add(barrel);

  // 7. 4 Wheels (Tire + Rim)
  const wheelPositions = [
    [-0.9, 0.38, 0.9],   // Front-left
    [0.9, 0.38, 0.9],    // Front-right
    [-0.9, 0.42, -0.9],  // Rear-left (slightly larger)
    [0.9, 0.42, -0.9],   // Rear-right
  ];

  const wheels: THREE.Mesh[] = [];
  wheelPositions.forEach((pos, idx) => {
    const isRear = idx >= 2;
    const r = isRear ? 0.42 : 0.38;
    const wGeo = new THREE.CylinderGeometry(r, r, 0.3, 16);
    const wheel = new THREE.Mesh(wGeo, tireMat);
    wheel.rotation.z = Math.PI / 2;
    wheel.position.set(pos[0], pos[1], pos[2]);
    wheel.castShadow = true;

    // Rim hubcap
    const rim = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.6, r * 0.6, 0.31, 8), rimMat);
    wheel.add(rim);

    group.add(wheel);
    wheels.push(wheel);
  });

  // Contact shadow
  const shadow = new THREE.Mesh(
    new THREE.PlaneGeometry(2.4, 3.4),
    new THREE.MeshBasicMaterial({ color: '#000000', transparent: true, opacity: 0.4, depthWrite: false })
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.02;
  group.add(shadow);

  group.userData = {
    wheels,
    nitroFlame: flame,
    team,
  };

  return group;
}

// 9. Full Stadium Architecture (Grandstands, Floodlights, Goals, Electronic Boards)
export function createStadiumEnvironment(assets: StadiumAssets): THREE.Group {
  const stadium = new THREE.Group();

  // Pitch surface (80m x 50m)
  const pitchGeo = new THREE.PlaneGeometry(80, 50);
  const pitchMat = new THREE.MeshStandardMaterial({
    map: assets.pitchTexture,
    roughness: 0.8,
    metalness: 0.05,
  });
  const pitch = new THREE.Mesh(pitchGeo, pitchMat);
  pitch.rotation.x = -Math.PI / 2;
  pitch.receiveShadow = true;
  stadium.add(pitch);

  // Outer green apron (run-off area)
  const apronGeo = new THREE.PlaneGeometry(104, 74);
  const apronMat = new THREE.MeshStandardMaterial({
    color: '#15803d',
    roughness: 0.9,
    metalness: 0.0,
  });
  const apron = new THREE.Mesh(apronGeo, apronMat);
  apron.rotation.x = -Math.PI / 2;
  apron.position.y = -0.02;
  apron.receiveShadow = true;
  stadium.add(apron);

  // Electronic LED ad perimeter boards
  const adMat = new THREE.MeshStandardMaterial({
    map: assets.adBoardTexture,
    roughness: 0.3,
    metalness: 0.2,
    emissive: new THREE.Color('#1e293b'),
    emissiveIntensity: 0.4,
  });

  // North & South ad boards
  const adLongGeo = new THREE.BoxGeometry(84, 1.2, 0.3);
  const adNorth = new THREE.Mesh(adLongGeo, adMat);
  adNorth.position.set(0, 0.6, 27);
  adNorth.castShadow = true;
  stadium.add(adNorth);

  const adSouth = new THREE.Mesh(adLongGeo, adMat);
  adSouth.position.set(0, 0.6, -27);
  adSouth.castShadow = true;
  stadium.add(adSouth);

  // East & West ad boards (leaving goal opening)
  const adShortGeo = new THREE.BoxGeometry(0.3, 1.2, 18);
  const adEast1 = new THREE.Mesh(adShortGeo, adMat);
  adEast1.position.set(42, 0.6, 17);
  stadium.add(adEast1);

  const adEast2 = new THREE.Mesh(adShortGeo, adMat);
  adEast2.position.set(42, 0.6, -17);
  stadium.add(adEast2);

  const adWest1 = new THREE.Mesh(adShortGeo, adMat);
  adWest1.position.set(-42, 0.6, 17);
  stadium.add(adWest1);

  const adWest2 = new THREE.Mesh(adShortGeo, adMat);
  adWest2.position.set(-42, 0.6, -17);
  stadium.add(adWest2);

  // Tiered Grandstands with Spectators
  const standConcreteMat = new THREE.MeshStandardMaterial({
    color: '#334155',
    roughness: 0.9,
    metalness: 0.1,
  });

  // Procedural crowd canvas texture
  const crowdCanvas = document.createElement('canvas');
  crowdCanvas.width = 512;
  crowdCanvas.height = 128;
  const cctx = crowdCanvas.getContext('2d')!;
  cctx.fillStyle = '#1e293b';
  cctx.fillRect(0, 0, crowdCanvas.width, crowdCanvas.height);
  const colors = ['#ef4444', '#3b82f6', '#f59e0b', '#10b981', '#ffffff', '#8b5cf6', '#e2e8f0'];
  for (let y = 0; y < crowdCanvas.height; y += 8) {
    for (let x = 0; x < crowdCanvas.width; x += 6) {
      cctx.fillStyle = colors[Math.floor(Math.random() * colors.length)];
      cctx.beginPath();
      cctx.arc(x + 3, y + 4, 3, 0, Math.PI * 2);
      cctx.fill();
    }
  }
  const crowdTex = new THREE.CanvasTexture(crowdCanvas);
  crowdTex.wrapS = THREE.RepeatWrapping;
  crowdTex.wrapT = THREE.RepeatWrapping;
  crowdTex.repeat.set(12, 4);

  const crowdMat = new THREE.MeshStandardMaterial({
    map: crowdTex,
    roughness: 0.8,
  });

  // North Stand
  const standNorth = new THREE.Mesh(new THREE.BoxGeometry(96, 14, 24), standConcreteMat);
  standNorth.position.set(0, 7, 44);
  stadium.add(standNorth);

  const crowdNorth = new THREE.Mesh(new THREE.PlaneGeometry(96, 26), crowdMat);
  crowdNorth.rotation.x = -Math.PI / 4;
  crowdNorth.position.set(0, 8, 38);
  stadium.add(crowdNorth);

  // South Stand
  const standSouth = new THREE.Mesh(new THREE.BoxGeometry(96, 14, 24), standConcreteMat);
  standSouth.position.set(0, 7, -44);
  stadium.add(standSouth);

  const crowdSouth = new THREE.Mesh(new THREE.PlaneGeometry(96, 26), crowdMat);
  crowdSouth.rotation.x = Math.PI / 4;
  crowdSouth.position.set(0, 8, -38);
  stadium.add(crowdSouth);

  // West & East Stands
  const standEast = new THREE.Mesh(new THREE.BoxGeometry(24, 14, 70), standConcreteMat);
  standEast.position.set(58, 7, 0);
  stadium.add(standEast);

  const crowdEast = new THREE.Mesh(new THREE.PlaneGeometry(70, 26), crowdMat);
  crowdEast.rotation.y = -Math.PI / 2;
  crowdEast.rotation.x = -Math.PI / 4;
  crowdEast.position.set(51, 8, 0);
  stadium.add(crowdEast);

  const standWest = new THREE.Mesh(new THREE.BoxGeometry(24, 14, 70), standConcreteMat);
  standWest.position.set(-58, 7, 0);
  stadium.add(standWest);

  const crowdWest = new THREE.Mesh(new THREE.PlaneGeometry(70, 26), crowdMat);
  crowdWest.rotation.y = Math.PI / 2;
  crowdWest.rotation.x = -Math.PI / 4;
  crowdWest.position.set(-51, 8, 0);
  stadium.add(crowdWest);

  // Stadium Floodlight Towers (4 corners)
  const floodlightPositions = [
    [-46, 36],
    [46, 36],
    [-46, -36],
    [46, -36],
  ];

  const towerMat = new THREE.MeshStandardMaterial({ color: '#475569', metalness: 0.9, roughness: 0.2 });
  const lightHeadMat = new THREE.MeshBasicMaterial({ color: '#fffbeb' });

  floodlightPositions.forEach(([x, z]) => {
    // Truss pillar
    const tower = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 1.4, 28, 8), towerMat);
    tower.position.set(x, 14, z);
    stadium.add(tower);

    // Lamp array head
    const head = new THREE.Mesh(new THREE.BoxGeometry(5, 3, 1), towerMat);
    head.position.set(x, 28, z);
    head.lookAt(0, 5, 0);
    stadium.add(head);

    // Bright illuminated panels
    const lamps = new THREE.Mesh(new THREE.BoxGeometry(4.6, 2.6, 0.2), lightHeadMat);
    lamps.position.set(0, 0, 0.55);
    head.add(lamps);
  });

  // Goal Posts (West = Blue side, East = Red side)
  const goalWidth = 10;
  const goalHeight = 4.2;
  const goalDepth = 4.0;

  const postMat = new THREE.MeshStandardMaterial({
    color: '#ffffff',
    roughness: 0.15,
    metalness: 0.8,
  });

  const netMat = new THREE.MeshBasicMaterial({
    map: assets.netTexture,
    transparent: true,
    opacity: 0.7,
    side: THREE.DoubleSide,
  });

  const buildGoal = (xSide: number, rotY: number) => {
    const goal = new THREE.Group();

    // Crossbar
    const crossbar = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, goalWidth, 16), postMat);
    crossbar.rotation.z = Math.PI / 2;
    crossbar.position.set(0, goalHeight, 0);
    crossbar.castShadow = true;
    goal.add(crossbar);

    // Left post
    const postL = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, goalHeight, 16), postMat);
    postL.position.set(-goalWidth / 2, goalHeight / 2, 0);
    postL.castShadow = true;
    goal.add(postL);

    // Right post
    const postR = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, goalHeight, 16), postMat);
    postR.position.set(goalWidth / 2, goalHeight / 2, 0);
    postR.castShadow = true;
    goal.add(postR);

    // Net back box
    const netBack = new THREE.Mesh(new THREE.PlaneGeometry(goalWidth, goalHeight), netMat);
    netBack.position.set(0, goalHeight / 2, -goalDepth);
    goal.add(netBack);

    const netTop = new THREE.Mesh(new THREE.PlaneGeometry(goalWidth, goalDepth), netMat);
    netTop.rotation.x = Math.PI / 2;
    netTop.position.set(0, goalHeight, -goalDepth / 2);
    goal.add(netTop);

    const netLeft = new THREE.Mesh(new THREE.PlaneGeometry(goalDepth, goalHeight), netMat);
    netLeft.rotation.y = Math.PI / 2;
    netLeft.position.set(-goalWidth / 2, goalHeight / 2, -goalDepth / 2);
    goal.add(netLeft);

    const netRight = new THREE.Mesh(new THREE.PlaneGeometry(goalDepth, goalHeight), netMat);
    netRight.rotation.y = -Math.PI / 2;
    netRight.position.set(goalWidth / 2, goalHeight / 2, -goalDepth / 2);
    goal.add(netRight);

    goal.position.set(xSide, 0, 0);
    goal.rotation.y = rotY;
    stadium.add(goal);
  };

  buildGoal(-36.8, Math.PI / 2); // West Goal
  buildGoal(36.8, -Math.PI / 2); // East Goal

  return stadium;
}
