export type GameMode = 'tournament' | 'quick_match' | 'car_turbo' | 'battle_blaster';

export type MatchType = '1v1' | '2v2' | '3v3' | '5v5_multi';

export type VehicleMode = 'foot' | 'car';

export interface PlayerStats {
  id: string;
  name: string;
  team: 'red' | 'blue';
  number: number;
  role: 'striker' | 'midfielder' | 'defender' | 'goalkeeper';
  isUser: boolean;
  userSlot?: number; // 1 = P1 (WASD), 2 = P2 (Arrows), 3..10 = bot or remote
  position: { x: number; y: number; z: number };
  velocity: { x: number; y: number; z: number };
  rotationY: number;
  speed: number;
  boost: number; // 0 - 100
  health: number; // 0 - 100 for battle mode
  stamina: number;
  isKicking: boolean;
  isTackling: boolean;
  isStunned: boolean;
  stunTimer: number;
  yellowCards: number;
  redCard: boolean;
  goalsScored: number;
  vehicleMode: VehicleMode;
  carSteer: number;
  carSpeed: number;
}

export interface BallState {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  rotX: number;
  rotY: number;
  rotZ: number;
  lastTouchPlayerId: string | null;
  lastTouchTeam: 'red' | 'blue' | null;
}

export interface RefereeState {
  x: number;
  y: number;
  z: number;
  targetX: number;
  targetZ: number;
  rotationY: number;
  state: 'patrolling' | 'running_to_foul' | 'blowing_whistle' | 'card_presentation' | 'goal_signal';
  activeCard: 'yellow' | 'red' | null;
  whistleTimer: number;
  cardTargetPlayerId: string | null;
}

export interface BlasterLaser {
  id: string;
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  ownerId: string;
  team: 'red' | 'blue';
  life: number;
}

export interface CommentatorAnnouncement {
  id: string;
  text: string;
  timestamp: number;
  type: 'goal' | 'shot' | 'foul' | 'card' | 'kickoff' | 'save' | 'whistle';
  intensity: 'normal' | 'excited' | 'epic';
}

export interface ReplayFrame {
  timestamp: number;
  ball: { x: number; y: number; z: number; rotX: number; rotY: number; rotZ: number };
  players: Array<{
    id: string;
    team: 'red' | 'blue';
    x: number;
    y: number;
    z: number;
    rotY: number;
    isKicking: boolean;
    vehicleMode: VehicleMode;
  }>;
  referee: { x: number; y: number; z: number; rotY: number };
}

export interface GoalHighlight {
  id: string;
  scorerName: string;
  scorerTeam: 'red' | 'blue';
  matchMinute: string;
  speedKmh: number;
  distanceMeters: number;
  frames: ReplayFrame[];
  commentary: string;
}

export interface LeaderboardEntry {
  rank: number;
  playerName: string;
  country: string;
  weeklyWins: number;
  totalGoals: number;
  rating: number;
  avatarSeed: string;
  favoriteMode: string;
}

export interface TournamentMatch {
  id: string;
  round: 'quarter' | 'semi' | 'final';
  teamRed: string;
  teamBlue: string;
  scoreRed: number;
  scoreBlue: number;
  isPlayed: boolean;
  winner?: 'red' | 'blue';
}

export interface TournamentData {
  title: string;
  currentRound: 'quarter' | 'semi' | 'final';
  matches: TournamentMatch[];
  playerTeam: 'red' | 'blue';
  playerTeamName: string;
  champion?: string;
}
