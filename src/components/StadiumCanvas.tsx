/**
 * Three.js 3D Stadium Canvas Viewport
 * Implements full Three.js Skill Directives:
 * - RoomEnvironment reflection via PMREMGenerator
 * - SRGBColorSpace, ACESFilmicToneMapping, PCFSoftShadowMap
 * - Smooth exponential camera damping
 * - Zero GC render loop with preallocated math objects
 */

import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { GameSimulation, InputState } from '../game/physicsEngine';
import {
  createPitchTexture,
  createBallTexture,
  createAdBoardTexture,
  createNetTexture,
  createRefereeTexture,
  createPlayerMesh,
  createRefereeMesh,
  createBattleCarMesh,
  createStadiumEnvironment,
} from '../game/proceduralAssets';

// Module-level reusable math objects (Zero GC in render loop)
const _camTarget = new THREE.Vector3();
const _camDesiredPos = new THREE.Vector3();
const _laserGeo = new THREE.CylinderGeometry(0.08, 0.08, 1.4, 8);
const _laserMatRed = new THREE.MeshBasicMaterial({ color: '#ff4d4f' });
const _laserMatBlue = new THREE.MeshBasicMaterial({ color: '#4096ff' });

export type CameraPreset = 'broadcast' | 'follow' | 'drone' | 'goal_cam';

interface StadiumCanvasProps {
  simulation: GameSimulation;
  inputState: React.MutableRefObject<InputState>;
  cameraPreset: CameraPreset;
  isSlowMotion?: boolean;
}

export const StadiumCanvas: React.FC<StadiumCanvasProps> = ({
  simulation,
  inputState,
  cameraPreset,
  isSlowMotion = false,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const simRef = useRef(simulation);
  simRef.current = simulation;
  const camPresetRef = useRef(cameraPreset);
  camPresetRef.current = cameraPreset;
  const slowMoRef = useRef(isSlowMotion);
  slowMoRef.current = isSlowMotion;

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // 1. Scene & Horizon Fog
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#0a0f1d');
    scene.fog = new THREE.FogExp2('#0a0f1d', 0.007);

    // 2. Camera Setup
    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.5, 300);
    camera.position.set(0, 32, 42);

    // 3. Renderer Setup
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
      stencil: false,
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.appendChild(renderer.domElement);

    // 4. Studio Environment Reflection (RoomEnvironment)
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    // 5. Balanced 3-Point Lighting Rig
    const hemiLight = new THREE.HemisphereLight('#93c5fd', '#14532d', 0.85);
    scene.add(hemiLight);

    const dirLight = new THREE.DirectionalLight('#fffbeb', 1.8);
    dirLight.position.set(25, 45, 20);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    dirLight.shadow.camera.near = 10;
    dirLight.shadow.camera.far = 120;
    dirLight.shadow.camera.left = -45;
    dirLight.shadow.camera.right = 45;
    dirLight.shadow.camera.top = 35;
    dirLight.shadow.camera.bottom = -35;
    dirLight.shadow.bias = -0.0005;
    dirLight.shadow.normalBias = 0.02;
    scene.add(dirLight);

    const rimLight = new THREE.DirectionalLight('#38bdf8', 0.6);
    rimLight.position.set(-25, 30, -25);
    scene.add(rimLight);

    // 6. Build Stadium Architecture & Procedural Assets
    const assets = {
      pitchTexture: createPitchTexture(),
      ballTexture: createBallTexture(),
      adBoardTexture: createAdBoardTexture(),
      netTexture: createNetTexture(),
      refereeStripeTexture: createRefereeTexture(),
    };

    const stadiumGroup = createStadiumEnvironment(assets);
    scene.add(stadiumGroup);

    // 7. Soccer Ball 3D Mesh
    const ballGeo = new THREE.SphereGeometry(0.48, 32, 32);
    const ballMat = new THREE.MeshStandardMaterial({
      map: assets.ballTexture,
      roughness: 0.25,
      metalness: 0.15,
    });
    const ballMesh = new THREE.Mesh(ballGeo, ballMat);
    ballMesh.castShadow = true;
    ballMesh.receiveShadow = true;
    scene.add(ballMesh);

    // Ball contact shadow
    const ballShadow = new THREE.Mesh(
      new THREE.CircleGeometry(0.45, 16),
      new THREE.MeshBasicMaterial({ color: '#000000', transparent: true, opacity: 0.35, depthWrite: false })
    );
    ballShadow.rotation.x = -Math.PI / 2;
    ballShadow.position.y = 0.02;
    scene.add(ballShadow);

    // 8. Player Meshes Cache
    const playerMeshMap = new Map<string, THREE.Group>();

    const refreshPlayerMeshes = () => {
      const sim = simRef.current;
      // Remove old meshes no longer in simulation
      playerMeshMap.forEach((mesh, id) => {
        if (!sim.players.some(p => p.id === id)) {
          scene.remove(mesh);
          playerMeshMap.delete(id);
        }
      });

      // Add or update meshes
      sim.players.forEach(p => {
        let mesh = playerMeshMap.get(p.id);
        if (!mesh) {
          if (p.vehicleMode === 'car') {
            mesh = createBattleCarMesh(p.team);
          } else {
            mesh = createPlayerMesh(p.team, p.number, p.role === 'goalkeeper');
          }
          scene.add(mesh);
          playerMeshMap.set(p.id, mesh);
        }
      });
    };

    refreshPlayerMeshes();

    // 9. Referee 3D Mesh
    const refMesh = createRefereeMesh(assets.refereeStripeTexture);
    scene.add(refMesh);

    // 10. Laser Blaster Beam Pool
    const laserMeshes: THREE.Mesh[] = [];

    // Pre-warm renderer
    renderer.compile(scene, camera);

    // 11. Animation & Simulation Loop
    const clock = new THREE.Clock();
    let animFrameId: number;

    const animate = () => {
      animFrameId = requestAnimationFrame(animate);

      let dt = clock.getDelta();
      if (slowMoRef.current) {
        dt *= 0.3; // 30% speed for slow-mo replay
      }

      const sim = simRef.current;
      sim.update(dt, inputState.current);

      // Check if players count changed
      if (playerMeshMap.size !== sim.players.length) {
        refreshPlayerMeshes();
      }

      // Sync Ball Position & Rotation
      ballMesh.position.set(sim.ball.x, sim.ball.y, sim.ball.z);
      ballMesh.rotation.x = sim.ball.rotX;
      ballMesh.rotation.y = sim.ball.rotY;
      ballMesh.rotation.z = sim.ball.rotZ;

      ballShadow.position.x = sim.ball.x;
      ballShadow.position.z = sim.ball.z;
      const heightFactor = Math.max(0.1, 1 - sim.ball.y / 6);
      ballShadow.scale.setScalar(heightFactor);
      (ballShadow.material as THREE.MeshBasicMaterial).opacity = 0.4 * heightFactor;

      // Sync Players
      sim.players.forEach(p => {
        const mesh = playerMeshMap.get(p.id);
        if (!mesh) return;

        mesh.visible = !p.redCard;
        mesh.position.set(p.position.x, p.position.y, p.position.z);
        mesh.rotation.y = p.rotationY;

        // Animate legs when running (for foot players)
        if (p.vehicleMode === 'foot' && mesh.userData.leftLeg) {
          const moveSpeed = Math.hypot(p.velocity.x, p.velocity.z);
          if (moveSpeed > 0.5) {
            const legSwing = Math.sin(clock.getElapsedTime() * 12) * 0.45;
            mesh.userData.leftLeg.rotation.x = legSwing;
            mesh.userData.rightLeg.rotation.x = -legSwing;
            mesh.userData.leftArm.rotation.x = -legSwing * 0.7;
            mesh.userData.rightArm.rotation.x = legSwing * 0.7;
          } else {
            mesh.userData.leftLeg.rotation.x = 0;
            mesh.userData.rightLeg.rotation.x = 0;
            mesh.userData.leftArm.rotation.x = 0;
            mesh.userData.rightArm.rotation.x = 0;
          }

          // Active indicator ring for user
          if (mesh.userData.indicatorRing) {
            mesh.userData.indicatorRing.visible = p.isUser;
            if (p.isUser) {
              mesh.userData.indicatorRing.rotation.z += dt * 3;
            }
          }
        }

        // Animate wheels and nitro flame (for battle cars)
        if (p.vehicleMode === 'car' && mesh.userData.wheels) {
          const carSpeed = p.carSpeed;
          mesh.userData.wheels.forEach((w: THREE.Mesh) => {
            w.rotation.x += carSpeed * dt * 4;
          });
          if (mesh.userData.nitroFlame) {
            const boosting = p.boost > 10 && Math.abs(carSpeed) > 12;
            mesh.userData.nitroFlame.material.opacity = boosting ? 0.9 : 0.0;
          }
        }
      });

      // Sync Referee
      refMesh.position.set(sim.referee.x, sim.referee.y, sim.referee.z);
      refMesh.rotation.y = sim.referee.rotationY;
      if (refMesh.userData.cardMesh) {
        refMesh.userData.cardMesh.visible = sim.referee.activeCard !== null;
        if (sim.referee.activeCard === 'red') {
          refMesh.userData.cardMesh.material = refMesh.userData.redCardMat;
        } else if (sim.referee.activeCard === 'yellow') {
          refMesh.userData.cardMesh.material = refMesh.userData.yellowCardMat;
        }
      }

      // Sync Lasers
      while (laserMeshes.length < sim.lasers.length) {
        const mesh = new THREE.Mesh(_laserGeo, _laserMatRed);
        scene.add(mesh);
        laserMeshes.push(mesh);
      }
      while (laserMeshes.length > sim.lasers.length) {
        const mesh = laserMeshes.pop();
        if (mesh) scene.remove(mesh);
      }
      sim.lasers.forEach((l, idx) => {
        const mesh = laserMeshes[idx];
        if (mesh) {
          mesh.position.set(l.x, l.y, l.z);
          mesh.rotation.y = Math.atan2(l.vx, l.vz);
          mesh.rotation.x = Math.PI / 2;
          mesh.material = l.team === 'red' ? _laserMatRed : _laserMatBlue;
        }
      });

      // Camera Exponential Damping & Presets
      const preset = camPresetRef.current;
      const userPlayer = sim.players.find(p => p.isUser) || sim.players[0];

      if (preset === 'broadcast') {
        // Broadcast TV Stadium Cam (following ball with smooth damping)
        _camDesiredPos.set(sim.ball.x * 0.4, 26, 36);
        _camTarget.set(sim.ball.x * 0.7, 1.5, sim.ball.z * 0.4);
      } else if (preset === 'follow' && userPlayer) {
        // Behind-Player Action Chase Cam
        const backX = -Math.sin(userPlayer.rotationY) * 11;
        const backZ = -Math.cos(userPlayer.rotationY) * 11;
        _camDesiredPos.set(userPlayer.position.x + backX, 7, userPlayer.position.z + backZ);
        _camTarget.set(userPlayer.position.x, 2, userPlayer.position.z);
      } else if (preset === 'drone') {
        // Top-Down Tactical Drone Cam
        _camDesiredPos.set(sim.ball.x * 0.5, 46, sim.ball.z * 0.3 + 8);
        _camTarget.set(sim.ball.x * 0.5, 0, sim.ball.z * 0.3);
      } else if (preset === 'goal_cam') {
        // Cinematic Behind-Goal Cam
        _camDesiredPos.set(38, 5, 0);
        _camTarget.set(sim.ball.x, 1, sim.ball.z);
      }

      // Camera Shake from hard shots or goal impacts
      const shake = sim.getCameraShake();
      if (shake > 0.01) {
        _camDesiredPos.x += (Math.random() - 0.5) * shake * 1.2;
        _camDesiredPos.y += (Math.random() - 0.5) * shake * 1.2;
      }

      // Smooth exponential damping
      camera.position.x = THREE.MathUtils.damp(camera.position.x, _camDesiredPos.x, 5.5, dt);
      camera.position.y = THREE.MathUtils.damp(camera.position.y, _camDesiredPos.y, 5.5, dt);
      camera.position.z = THREE.MathUtils.damp(camera.position.z, _camDesiredPos.z, 5.5, dt);
      camera.lookAt(_camTarget);

      renderer.render(scene, camera);
    };

    animFrameId = requestAnimationFrame(animate);

    // Resize Handler
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animFrameId);
      window.removeEventListener('resize', handleResize);
      laserMeshes.forEach(m => scene.remove(m));
      renderer.dispose();
      assets.pitchTexture.dispose();
      assets.ballTexture.dispose();
      assets.adBoardTexture.dispose();
      assets.netTexture.dispose();
      assets.refereeStripeTexture.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return <div ref={mountRef} className="absolute inset-0 w-full h-full overflow-hidden" />;
};
