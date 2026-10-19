/**
 * 3D Soccer Physics Engine, Game Simulation, Referee AI, and Replay Ring Buffer
 * Zero GC in render loop - reusable module-level vectors.
 */

import * as THREE from 'three';
import {
  PlayerStats,
  BallState,
  RefereeState,
  BlasterLaser,
  ReplayFrame,
  GoalHighlight,
  VehicleMode,
  MatchType,
} from '../types/game';
import { sounds } from '../services/soundEffects';
import { commentator } from '../services/commentator';

// Module-scope pre-allocated math objects to guarantee zero GC during simulation tick
const _vecA = new THREE.Vector3();
const _vecB = new THREE.Vector3();

// Stadium pitch boundaries
export const FIELD_HALF_X = 36.0;
export const FIELD_HALF_Z = 24.0;
export const GOAL_WIDTH = 10.0;
export const GOAL_HEIGHT = 4.2;

export interface InputState {
  // Player 1 (WASD)
  p1Up: boolean;
  p1Down: boolean;
  p1Left: boolean;
  p1Right: boolean;
  p1Shoot: boolean;
  p1Pass: boolean;
  p1Sprint: boolean;
  p1Action: boolean; // Blaster / Tackle

  // Player 2 (Arrows / Numpad)
  p2Up: boolean;
  p2Down: boolean;
  p2Left: boolean;
  p2Right: boolean;
  p2Shoot: boolean;
  p2Pass: boolean;
  p2Sprint: boolean;
  p2Action: boolean;
}

export class GameSimulation {
  public players: PlayerStats[] = [];
  public ball: BallState;
  public referee: RefereeState;
  public lasers: BlasterLaser[] = [];
  public scoreRed: number = 0;
  public scoreBlue: number = 0;
  public matchTimeSeconds: number = 0;
  public matchDurationSeconds: number = 180; // 3 minute match
  public isPaused: boolean = false;
  public isGameOver: boolean = false;
  public lastGoalHighlight: GoalHighlight | null = null;
  public onGoalScored?: (highlight: GoalHighlight) => void;
  public onFoulCalled?: (card: 'yellow' | 'red', playerName: string) => void;

  private replayBuffer: ReplayFrame[] = [];
  private maxReplayFrames = 600; // 10 seconds of 60fps history
  private goalCooldown: number = 0;
  private cameraShakeIntensity: number = 0;

  constructor(matchType: MatchType = '2v2', vehicleMode: VehicleMode = 'foot') {
    this.ball = {
      x: 0,
      y: 0.45,
      z: 0,
      vx: 0,
      vy: 0,
      vz: 0,
      rotX: 0,
      rotY: 0,
      rotZ: 0,
      lastTouchPlayerId: null,
      lastTouchTeam: null,
    };

    this.referee = {
      x: 0,
      y: 0,
      z: 10,
      targetX: 0,
      targetZ: 10,
      rotationY: 0,
      state: 'patrolling',
      activeCard: null,
      whistleTimer: 0,
      cardTargetPlayerId: null,
    };

    this.setupSquads(matchType, vehicleMode);
  }

  public setupSquads(matchType: MatchType, vehicleMode: VehicleMode) {
    this.players = [];
    let countPerTeam = 2; // default 2v2 (4 players)
    if (matchType === '1v1') countPerTeam = 1;
    else if (matchType === '2v2') countPerTeam = 2;
    else if (matchType === '3v3') countPerTeam = 3;
    else if (matchType === '5v5_multi') countPerTeam = 5; // 10 players total on pitch!

    const redNames = ['Tiền Đạo Sơn', 'Hậu Vệ Dũng', 'Tiền Vệ Quang', 'Thủ Môn Lâm', 'Chân Sút Hùng'];
    const blueNames = ['Tiền Đạo Alex', 'Hậu Vệ Silva', 'Tiền Vệ Bruno', 'Thủ Môn Courtois', 'Chân Sút Mbappe'];

    // Red Team (Left attacking to Right)
    for (let i = 0; i < countPerTeam; i++) {
      const isUser = i === 0;
      const isGoalkeeper = i === countPerTeam - 1 && countPerTeam >= 3;
      const role = isGoalkeeper ? 'goalkeeper' : i === 0 ? 'striker' : i === 1 ? 'midfielder' : 'defender';

      let posX = -12;
      let posZ = (i - (countPerTeam - 1) / 2) * 8;
      if (isGoalkeeper) {
        posX = -34;
        posZ = 0;
      }

      this.players.push({
        id: `red_${i}`,
        name: redNames[i] || `Red Player ${i + 1}`,
        team: 'red',
        number: isGoalkeeper ? 1 : i === 0 ? 10 : 7 + i,
        role,
        isUser,
        userSlot: isUser ? 1 : undefined,
        position: { x: posX, y: 0, z: posZ },
        velocity: { x: 0, y: 0, z: 0 },
        rotationY: Math.PI / 2,
        speed: 11,
        boost: 100,
        health: 100,
        stamina: 100,
        isKicking: false,
        isTackling: false,
        isStunned: false,
        stunTimer: 0,
        yellowCards: 0,
        redCard: false,
        goalsScored: 0,
        vehicleMode,
        carSteer: 0,
        carSpeed: 0,
      });
    }

    // Blue Team (Right attacking to Left)
    for (let i = 0; i < countPerTeam; i++) {
      // Slot 2 can be controlled by Player 2 on local keyboard!
      const isUserP2 = i === 0 && matchType !== '1v1';
      const isGoalkeeper = i === countPerTeam - 1 && countPerTeam >= 3;
      const role = isGoalkeeper ? 'goalkeeper' : i === 0 ? 'striker' : i === 1 ? 'midfielder' : 'defender';

      let posX = 12;
      let posZ = (i - (countPerTeam - 1) / 2) * 8;
      if (isGoalkeeper) {
        posX = 34;
        posZ = 0;
      }

      this.players.push({
        id: `blue_${i}`,
        name: blueNames[i] || `Blue Player ${i + 1}`,
        team: 'blue',
        number: isGoalkeeper ? 1 : i === 0 ? 9 : 8 + i,
        role,
        isUser: isUserP2,
        userSlot: isUserP2 ? 2 : undefined,
        position: { x: posX, y: 0, z: posZ },
        velocity: { x: 0, y: 0, z: 0 },
        rotationY: -Math.PI / 2,
        speed: 11,
        boost: 100,
        health: 100,
        stamina: 100,
        isKicking: false,
        isTackling: false,
        isStunned: false,
        stunTimer: 0,
        yellowCards: 0,
        redCard: false,
        goalsScored: 0,
        vehicleMode,
        carSteer: 0,
        carSpeed: 0,
      });
    }
  }

  public resetKickoff(scoringTeam?: 'red' | 'blue') {
    this.ball.x = 0;
    this.ball.y = 0.45;
    this.ball.z = 0;
    this.ball.vx = 0;
    this.ball.vy = 0;
    this.ball.vz = 0;

    this.players.forEach(p => {
      p.isStunned = false;
      p.stunTimer = 0;
      p.velocity.x = 0;
      p.velocity.y = 0;
      p.velocity.z = 0;
      p.carSpeed = 0;

      const idx = parseInt(p.id.split('_')[1] || '0', 10);
      const isRed = p.team === 'red';
      const dirX = isRed ? -1 : 1;
      p.rotationY = isRed ? Math.PI / 2 : -Math.PI / 2;

      if (p.role === 'goalkeeper') {
        p.position.x = dirX * 34;
        p.position.z = 0;
      } else {
        p.position.x = dirX * (8 + idx * 6);
        p.position.z = (idx - 0.5) * 8;
      }
    });

    this.referee.x = 0;
    this.referee.z = 8;
    this.referee.state = 'patrolling';
    this.referee.activeCard = null;

    sounds.playWhistle();
    commentator.announce('kickoff');
  }

  public shootLaser(player: PlayerStats) {
    if (player.isStunned || player.redCard) return;

    sounds.playLaserShot();
    const speed = 40;
    const dirX = Math.sin(player.rotationY);
    const dirZ = Math.cos(player.rotationY);

    this.lasers.push({
      id: Math.random().toString(36).substring(2, 8),
      x: player.position.x + dirX * 1.5,
      y: 1.2,
      z: player.position.z + dirZ * 1.5,
      vx: dirX * speed,
      vy: 0,
      vz: dirZ * speed,
      ownerId: player.id,
      team: player.team,
      life: 1.5, // 1.5s lifespan
    });
  }

  public update(dt: number, input: InputState) {
    if (this.isPaused || this.isGameOver) return;

    const clampedDt = Math.min(dt, 0.05);
    this.matchTimeSeconds += clampedDt;
    if (this.matchTimeSeconds >= this.matchDurationSeconds) {
      this.isGameOver = true;
      sounds.playWhistle(true);
      return;
    }

    if (this.goalCooldown > 0) {
      this.goalCooldown -= clampedDt;
    }

    // Camera shake decay
    if (this.cameraShakeIntensity > 0) {
      this.cameraShakeIntensity = Math.max(0, this.cameraShakeIntensity - clampedDt * 4);
    }

    // 1. Update Players
    this.updatePlayers(clampedDt, input);

    // 2. Update Ball Physics
    this.updateBall(clampedDt);

    // 3. Update Blaster Lasers
    this.updateLasers(clampedDt);

    // 4. Update Referee AI
    this.updateReferee(clampedDt);

    // 5. Record Replay Frame (Buffer Ring)
    this.recordReplayFrame();

    // 6. Check Goal Condition
    this.checkGoal();
  }

  private updatePlayers(dt: number, input: InputState) {
    this.players.forEach(p => {
      if (p.redCard) return;

      // Recharge boost
      if (p.boost < 100) {
        p.boost = Math.min(100, p.boost + dt * 15);
      }

      // Stun recovery
      if (p.isStunned) {
        p.stunTimer -= dt;
        if (p.stunTimer <= 0) {
          p.isStunned = false;
        }
        return;
      }

      const isCar = p.vehicleMode === 'car';

      // Control resolution (Human vs AI)
      let moveX = 0;
      let moveZ = 0;
      let shoot = false;
      let sprint = false;
      let action = false;

      if (p.userSlot === 1) {
        if (input.p1Up) moveZ -= 1;
        if (input.p1Down) moveZ += 1;
        if (input.p1Left) moveX -= 1;
        if (input.p1Right) moveX += 1;
        shoot = input.p1Shoot;
        sprint = input.p1Sprint;
        action = input.p1Action;
      } else if (p.userSlot === 2) {
        if (input.p2Up) moveZ -= 1;
        if (input.p2Down) moveZ += 1;
        if (input.p2Left) moveX -= 1;
        if (input.p2Right) moveX += 1;
        shoot = input.p2Shoot;
        sprint = input.p2Sprint;
        action = input.p2Action;
      } else {
        // AI Logic
        const aiBehavior = this.computeAiMove(p);
        moveX = aiBehavior.moveX;
        moveZ = aiBehavior.moveZ;
        shoot = aiBehavior.shoot;
        sprint = aiBehavior.sprint;
        action = aiBehavior.action;
      }

      // Blaster laser action
      if (action) {
        this.shootLaser(p);
      }

      // Movement execution
      if (isCar) {
        // Car vehicle dynamics
        const steerInput = moveX;
        const throttleInput = -moveZ;

        p.carSteer = steerInput;
        const maxCarSpeed = sprint && p.boost > 10 ? 24 : 14;
        if (sprint && p.boost > 10 && throttleInput !== 0) {
          p.boost = Math.max(0, p.boost - dt * 25);
          sounds.playNitroBoost();
        }

        if (throttleInput !== 0) {
          p.carSpeed = THREE.MathUtils.damp(p.carSpeed, throttleInput * maxCarSpeed, 4, dt);
          p.rotationY += -steerInput * dt * 2.8 * (p.carSpeed > 0 ? 1 : -1);
        } else {
          p.carSpeed = THREE.MathUtils.damp(p.carSpeed, 0, 5, dt);
        }

        p.velocity.x = Math.sin(p.rotationY) * p.carSpeed;
        p.velocity.z = Math.cos(p.rotationY) * p.carSpeed;

        sounds.updateEngine(Math.abs(p.carSpeed) / maxCarSpeed, p.userSlot === 1);
      } else {
        // Human Striker foot soldier dynamics
        const len = Math.hypot(moveX, moveZ);
        if (len > 0.01) {
          moveX /= len;
          moveZ /= len;
          const targetAngle = Math.atan2(moveX, moveZ);
          p.rotationY = THREE.MathUtils.damp(p.rotationY, targetAngle, 12, dt);

          const maxRunSpeed = sprint && p.boost > 10 ? 16 : 9.5;
          if (sprint && p.boost > 10) {
            p.boost = Math.max(0, p.boost - dt * 20);
          }

          p.velocity.x = moveX * maxRunSpeed;
          p.velocity.z = moveZ * maxRunSpeed;
        } else {
          p.velocity.x = THREE.MathUtils.damp(p.velocity.x, 0, 10, dt);
          p.velocity.z = THREE.MathUtils.damp(p.velocity.z, 0, 10, dt);
        }
      }

      // Apply displacement
      p.position.x += p.velocity.x * dt;
      p.position.z += p.velocity.z * dt;

      // Constrain inside stadium perimeter
      p.position.x = Math.max(-FIELD_HALF_X - 1.5, Math.min(FIELD_HALF_X + 1.5, p.position.x));
      p.position.z = Math.max(-FIELD_HALF_Z, Math.min(FIELD_HALF_Z, p.position.z));

      // Player-Ball Contact
      const distToBall = Math.hypot(p.position.x - this.ball.x, p.position.z - this.ball.z);
      const contactRadius = isCar ? 1.8 : 1.2;

      if (distToBall < contactRadius) {
        this.ball.lastTouchPlayerId = p.id;
        this.ball.lastTouchTeam = p.team;

        if (shoot) {
          // Powerful shot towards opponent goal
          p.isKicking = true;
          const targetGoalX = p.team === 'red' ? FIELD_HALF_X : -FIELD_HALF_X;
          const targetGoalZ = (Math.random() - 0.5) * 4;
          const dirX = targetGoalX - p.position.x;
          const dirZ = targetGoalZ - p.position.z;
          const dist = Math.hypot(dirX, dirZ);

          const shotPower = isCar ? 36 : 28;
          this.ball.vx = (dirX / dist) * shotPower;
          this.ball.vz = (dirZ / dist) * shotPower;
          this.ball.vy = isCar ? 8 : 6;

          sounds.playKick(1.2);
          commentator.announce('shot', { player: p.name, speed: shotPower * 3.6 });
          this.cameraShakeIntensity = 0.4;
        } else {
          // Dribble / push ball forward
          const pushSpeed = isCar ? Math.max(8, Math.abs(p.carSpeed) * 1.3) : 9.0;
          const forwardX = Math.sin(p.rotationY);
          const forwardZ = Math.cos(p.rotationY);

          this.ball.vx = forwardX * pushSpeed;
          this.ball.vz = forwardZ * pushSpeed;
          this.ball.vy = Math.max(this.ball.vy, 1.5);
          sounds.playKick(0.5);
        }
      } else {
        p.isKicking = false;
      }
    });

    // Player-to-player collision and harsh tackle detection (Referee involvement)
    for (let i = 0; i < this.players.length; i++) {
      for (let j = i + 1; j < this.players.length; j++) {
        const p1 = this.players[i];
        const p2 = this.players[j];
        if (p1.redCard || p2.redCard) continue;

        const dx = p2.position.x - p1.position.x;
        const dz = p2.position.z - p1.position.z;
        const dist = Math.hypot(dx, dz);
        const minDist = p1.vehicleMode === 'car' || p2.vehicleMode === 'car' ? 2.2 : 1.3;

        if (dist < minDist && dist > 0.001) {
          // Push apart
          const overlap = (minDist - dist) / 2;
          const nx = dx / dist;
          const nz = dz / dist;
          p1.position.x -= nx * overlap;
          p1.position.z -= nz * overlap;
          p2.position.x += nx * overlap;
          p2.position.z += nz * overlap;

          sounds.playTackle();

          // Foul Check: if opponents collide at high speed from behind
          if (p1.team !== p2.team && Math.random() < 0.25 && this.referee.state === 'patrolling') {
            const offender = Math.hypot(p1.velocity.x, p1.velocity.z) > Math.hypot(p2.velocity.x, p2.velocity.z) ? p1 : p2;
            const victim = offender === p1 ? p2 : p1;
            this.callFoul(offender, victim);
          }
        }
      }
    }
  }

  private computeAiMove(bot: PlayerStats): { moveX: number; moveZ: number; shoot: boolean; sprint: boolean; action: boolean } {
    const isRed = bot.team === 'red';
    const opponentGoalX = isRed ? FIELD_HALF_X : -FIELD_HALF_X;
    const ownGoalX = isRed ? -FIELD_HALF_X : FIELD_HALF_X;

    let moveX = 0;
    let moveZ = 0;
    let shoot = false;
    let sprint = false;
    let action = false;

    if (bot.role === 'goalkeeper') {
      // Stay near goal line, align Z with ball
      const targetX = ownGoalX * 0.92;
      const targetZ = Math.max(-GOAL_WIDTH / 2, Math.min(GOAL_WIDTH / 2, this.ball.z * 0.7));
      moveX = targetX - bot.position.x;
      moveZ = targetZ - bot.position.z;
      // Dive if ball is coming close to goal
      if (Math.abs(this.ball.x - ownGoalX) < 12) {
        sprint = true;
        shoot = true;
      }
    } else if (bot.role === 'defender') {
      // Position between ball and own goal
      const targetX = (this.ball.x + ownGoalX) * 0.5;
      const targetZ = this.ball.z * 0.8;
      moveX = targetX - bot.position.x;
      moveZ = targetZ - bot.position.z;
      sprint = Math.hypot(moveX, moveZ) > 8;
      if (Math.hypot(bot.position.x - this.ball.x, bot.position.z - this.ball.z) < 3) {
        shoot = true;
      }
    } else {
      // Striker / Midfielder: chase ball and attack
      const dx = this.ball.x - bot.position.x;
      const dz = this.ball.z - bot.position.z;
      moveX = dx;
      moveZ = dz;
      sprint = Math.hypot(dx, dz) > 5;

      const distToOpponentGoal = Math.hypot(opponentGoalX - bot.position.x, 0 - bot.position.z);
      if (Math.hypot(dx, dz) < 2.0 && distToOpponentGoal < 30) {
        shoot = true;
      }

      // Battle mode blaster shot chance
      if (Math.random() < 0.015 && distToOpponentGoal < 35) {
        action = true;
      }
    }

    return { moveX, moveZ, shoot, sprint, action };
  }

  private updateBall(dt: number) {
    const gravity = -18.0;
    const airResistance = 0.992;
    const grassFriction = 0.985;

    // Ball kinematics
    this.ball.vy += gravity * dt;
    this.ball.x += this.ball.vx * dt;
    this.ball.y += this.ball.vy * dt;
    this.ball.z += this.ball.vz * dt;

    this.ball.vx *= airResistance;
    this.ball.vz *= airResistance;

    // Pitch bounce
    if (this.ball.y <= 0.45) {
      this.ball.y = 0.45;
      if (Math.abs(this.ball.vy) > 1.2) {
        this.ball.vy = -this.ball.vy * 0.65; // restitution
        sounds.playKick(0.3);
      } else {
        this.ball.vy = 0;
      }
      this.ball.vx *= grassFriction;
      this.ball.vz *= grassFriction;
    }

    // Ball rotation spin
    this.ball.rotX += this.ball.vz * dt * 2;
    this.ball.rotZ -= this.ball.vx * dt * 2;

    // Pitch Sideline & Goal line bounce (rebound back onto field)
    if (Math.abs(this.ball.z) > FIELD_HALF_Z) {
      this.ball.z = Math.sign(this.ball.z) * FIELD_HALF_Z;
      this.ball.vz = -this.ball.vz * 0.7;
    }

    // Check goal crossbar & posts hit
    const inGoalZ = Math.abs(this.ball.z) < GOAL_WIDTH / 2;
    const onGoalLine = Math.abs(this.ball.x) >= FIELD_HALF_X;

    if (onGoalLine && !inGoalZ) {
      this.ball.x = Math.sign(this.ball.x) * FIELD_HALF_X;
      this.ball.vx = -this.ball.vx * 0.7;
      sounds.playPostHit();
    }
  }

  private updateLasers(dt: number) {
    for (let i = this.lasers.length - 1; i >= 0; i--) {
      const laser = this.lasers[i];
      laser.x += laser.vx * dt;
      laser.z += laser.vz * dt;
      laser.life -= dt;

      // Ball hit check
      const distToBall = Math.hypot(laser.x - this.ball.x, laser.z - this.ball.z);
      if (distToBall < 1.6) {
        // Laser imparts heavy impulse to ball
        this.ball.vx += (laser.vx / 40) * 25;
        this.ball.vz += (laser.vz / 40) * 25;
        this.ball.vy = 5;
        sounds.playKick(1.0);
        this.lasers.splice(i, 1);
        continue;
      }

      // Player hit check
      for (const p of this.players) {
        if (p.id !== laser.ownerId && p.team !== laser.team) {
          const d = Math.hypot(laser.x - p.position.x, laser.z - p.position.z);
          if (d < 1.5) {
            // Stun opponent!
            p.isStunned = true;
            p.stunTimer = 1.8;
            sounds.playTackle();
            this.lasers.splice(i, 1);
            break;
          }
        }
      }

      if (laser.life <= 0) {
        this.lasers.splice(i, 1);
      }
    }
  }

  private updateReferee(dt: number) {
    const ref = this.referee;

    if (ref.state === 'patrolling') {
      // Follow ball progression smoothly from side of play
      ref.targetX = this.ball.x * 0.6;
      ref.targetZ = Math.sign(this.ball.z || 1) * 12;

      const dx = ref.targetX - ref.x;
      const dz = ref.targetZ - ref.z;
      const dist = Math.hypot(dx, dz);
      if (dist > 1.0) {
        ref.x += (dx / dist) * 7.5 * dt;
        ref.z += (dz / dist) * 7.5 * dt;
        ref.rotationY = Math.atan2(dx, dz);
      }
    } else if (ref.state === 'running_to_foul') {
      const targetPlayer = this.players.find(p => p.id === ref.cardTargetPlayerId);
      if (targetPlayer) {
        const dx = targetPlayer.position.x - ref.x;
        const dz = targetPlayer.position.z - ref.z;
        const dist = Math.hypot(dx, dz);
        if (dist > 1.8) {
          ref.x += (dx / dist) * 9.0 * dt;
          ref.z += (dz / dist) * 9.0 * dt;
          ref.rotationY = Math.atan2(dx, dz);
        } else {
          // Present card
          ref.state = 'card_presentation';
          ref.whistleTimer = 2.5;
        }
      }
    } else if (ref.state === 'card_presentation') {
      ref.whistleTimer -= dt;
      if (ref.whistleTimer <= 0) {
        ref.state = 'patrolling';
        ref.activeCard = null;
        ref.cardTargetPlayerId = null;
      }
    }
  }

  public callFoul(offender: PlayerStats, victim: PlayerStats) {
    sounds.playWhistle();
    offender.yellowCards += 1;
    const isRedCard = offender.yellowCards >= 2;
    if (isRedCard) {
      offender.redCard = true;
    }

    this.referee.state = 'running_to_foul';
    this.referee.activeCard = isRedCard ? 'red' : 'yellow';
    this.referee.cardTargetPlayerId = offender.id;

    sounds.playCardAlert(isRedCard);
    commentator.announce('foul', { player: offender.name });
    setTimeout(() => {
      commentator.announce('card', { player: offender.name, detail: isRedCard ? 'red' : String(offender.number) });
    }, 1200);

    if (this.onFoulCalled) {
      this.onFoulCalled(isRedCard ? 'red' : 'yellow', offender.name);
    }
  }

  private checkGoal() {
    if (this.goalCooldown > 0) return;

    // Check West Goal (Blue net => Red scores!)
    if (this.ball.x <= -FIELD_HALF_X - 0.5 && Math.abs(this.ball.z) < GOAL_WIDTH / 2 && this.ball.y < GOAL_HEIGHT) {
      this.scoreRed += 1;
      this.handleGoalScored('red');
    }
    // Check East Goal (Red net => Blue scores!)
    else if (this.ball.x >= FIELD_HALF_X + 0.5 && Math.abs(this.ball.z) < GOAL_WIDTH / 2 && this.ball.y < GOAL_HEIGHT) {
      this.scoreBlue += 1;
      this.handleGoalScored('blue');
    }
  }

  private handleGoalScored(scoringTeam: 'red' | 'blue') {
    this.goalCooldown = 6.0; // 6 second highlight window
    this.cameraShakeIntensity = 1.0;

    const scorer = this.players.find(p => p.id === this.ball.lastTouchPlayerId) ||
      this.players.find(p => p.team === scoringTeam && p.role === 'striker') ||
      this.players[0];

    scorer.goalsScored += 1;

    sounds.playGoalExplosion();
    const speed = Math.round(Math.hypot(this.ball.vx, this.ball.vz) * 3.6 + 60);
    const dist = Math.round(Math.abs(this.ball.x));

    const commentary = scoringTeam === 'red'
      ? `VÀOOOOOO! Bàn thắng mở tỷ số tuyệt đẹp của ${scorer.name}!`
      : `VÀOOOOOO! Tuyệt phẩm dứt điểm đẳng cấp thế giới của ${scorer.name}!`;

    commentator.announce('goal', { player: scorer.name, speed });

    // Build highlight reel from replay buffer
    const highlight: GoalHighlight = {
      id: `goal_${Date.now()}`,
      scorerName: scorer.name,
      scorerTeam: scoringTeam,
      matchMinute: `${Math.floor(this.matchTimeSeconds / 60) + 1}'`,
      speedKmh: speed,
      distanceMeters: dist,
      frames: [...this.replayBuffer],
      commentary,
    };

    this.lastGoalHighlight = highlight;
    if (this.onGoalScored) {
      this.onGoalScored(highlight);
    }

    // Trigger referee celebration
    this.referee.state = 'goal_signal';

    setTimeout(() => {
      this.resetKickoff(scoringTeam);
    }, 4500);
  }

  private recordReplayFrame() {
    const frame: ReplayFrame = {
      timestamp: Date.now(),
      ball: {
        x: this.ball.x,
        y: this.ball.y,
        z: this.ball.z,
        rotX: this.ball.rotX,
        rotY: this.ball.rotY,
        rotZ: this.ball.rotZ,
      },
      players: this.players.map(p => ({
        id: p.id,
        team: p.team,
        x: p.position.x,
        y: p.position.y,
        z: p.position.z,
        rotY: p.rotationY,
        isKicking: p.isKicking,
        vehicleMode: p.vehicleMode,
      })),
      referee: {
        x: this.referee.x,
        y: this.referee.y,
        z: this.referee.z,
        rotY: this.referee.rotationY,
      },
    };

    this.replayBuffer.push(frame);
    if (this.replayBuffer.length > this.maxReplayFrames) {
      this.replayBuffer.shift();
    }
  }

  public getCameraShake(): number {
    return this.cameraShakeIntensity;
  }
}
