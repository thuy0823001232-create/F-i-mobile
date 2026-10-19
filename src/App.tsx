/**
 * Super Turbo Football 3D - Battle Arena
 * Main Application Component & Game Shell
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GameSimulation, InputState } from './game/physicsEngine';
import { StadiumCanvas, CameraPreset } from './components/StadiumCanvas';
import { GameHUD } from './components/GameHUD';
import { TitleScreen } from './components/TitleScreen';
import { GameOverModal } from './components/GameOverModal';
import { TournamentView } from './components/TournamentView';
import { LeaderboardModal } from './components/LeaderboardModal';
import { GmailNotificationModal } from './components/GmailNotificationModal';
import { WidgetInstallModal } from './components/WidgetInstallModal';
import { ReplayModal } from './components/ReplayModal';
import { GameMode, MatchType, VehicleMode, GoalHighlight } from './types/game';
import { initAuthListener } from './services/authAndGmail';
import { multiplayer } from './services/multiplayerSync';
import { User } from 'firebase/auth';

type GameState = 'title' | 'playing' | 'game_over';

export default function App() {
  const [gameState, setGameState] = useState<GameState>('title');
  const [matchTitle, setMatchTitle] = useState<string>('Trận Cầu Đỉnh Cao 3D');
  const [matchType, setMatchType] = useState<MatchType>('2v2');
  const [vehicleMode, setVehicleMode] = useState<VehicleMode>('foot');
  const [cameraPreset, setCameraPreset] = useState<CameraPreset>('broadcast');
  const [isSlowMotion, setIsSlowMotion] = useState<boolean>(false);

  // Modals state
  const [isTournamentOpen, setIsTournamentOpen] = useState(false);
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);
  const [isGmailOpen, setIsGmailOpen] = useState(false);
  const [isWidgetOpen, setIsWidgetOpen] = useState(false);
  const [isReplayOpen, setIsReplayOpen] = useState(false);
  const [currentHighlight, setCurrentHighlight] = useState<GoalHighlight | null>(null);

  // User auth state
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Simulation ref (persists across re-renders without tearing down canvas)
  const simulationRef = useRef<GameSimulation>(new GameSimulation('2v2', 'foot'));

  // Continuous keyboard input state ref
  const inputRef = useRef<InputState>({
    p1Up: false,
    p1Down: false,
    p1Left: false,
    p1Right: false,
    p1Shoot: false,
    p1Pass: false,
    p1Sprint: false,
    p1Action: false,
    p2Up: false,
    p2Down: false,
    p2Left: false,
    p2Right: false,
    p2Shoot: false,
    p2Pass: false,
    p2Sprint: false,
    p2Action: false,
  });

  // Track Firebase Auth state
  useEffect(() => {
    const unsubscribe = initAuthListener((user) => {
      setCurrentUser(user);
      if (user?.displayName) {
        multiplayer.setPlayerName(user.displayName);
      }
    });
    return unsubscribe;
  }, []);

  // Keyboard Event Handlers (edge-triggered & continuous held inputs)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const inp = inputRef.current;

      // Player 1 controls (WASD + Space + F + Shift + E)
      if (e.code === 'KeyW') inp.p1Up = true;
      if (e.code === 'KeyS') inp.p1Down = true;
      if (e.code === 'KeyA') inp.p1Left = true;
      if (e.code === 'KeyD') inp.p1Right = true;
      if (e.code === 'Space') inp.p1Shoot = true;
      if (e.code === 'KeyF') inp.p1Action = true; // Blaster shot
      if (e.code === 'ShiftLeft') inp.p1Sprint = true;
      if (e.code === 'KeyE') inp.p1Pass = true;

      // Player 2 controls (Arrow keys + Numpad0 / M + N + L)
      if (e.code === 'ArrowUp') inp.p2Up = true;
      if (e.code === 'ArrowDown') inp.p2Down = true;
      if (e.code === 'ArrowLeft') inp.p2Left = true;
      if (e.code === 'ArrowRight') inp.p2Right = true;
      if (e.code === 'KeyM' || e.code === 'Numpad0') inp.p2Shoot = true;
      if (e.code === 'KeyN' || e.code === 'ShiftRight') inp.p2Sprint = true;
      if (e.code === 'KeyL') inp.p2Action = true;

      // Escape key to pause or return
      if (e.code === 'Escape' && gameState === 'playing') {
        simulationRef.current.isPaused = !simulationRef.current.isPaused;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const inp = inputRef.current;

      if (e.code === 'KeyW') inp.p1Up = false;
      if (e.code === 'KeyS') inp.p1Down = false;
      if (e.code === 'KeyA') inp.p1Left = false;
      if (e.code === 'KeyD') inp.p1Right = false;
      if (e.code === 'Space') inp.p1Shoot = false;
      if (e.code === 'KeyF') inp.p1Action = false;
      if (e.code === 'ShiftLeft') inp.p1Sprint = false;
      if (e.code === 'KeyE') inp.p1Pass = false;

      if (e.code === 'ArrowUp') inp.p2Up = false;
      if (e.code === 'ArrowDown') inp.p2Down = false;
      if (e.code === 'ArrowLeft') inp.p2Left = false;
      if (e.code === 'ArrowRight') inp.p2Right = false;
      if (e.code === 'KeyM' || e.code === 'Numpad0') inp.p2Shoot = false;
      if (e.code === 'KeyN' || e.code === 'ShiftRight') inp.p2Sprint = false;
      if (e.code === 'KeyL') inp.p2Action = false;
    };

    // Clear held keys on window blur (per Game Craft guidelines)
    const handleBlur = () => {
      const inp = inputRef.current;
      Object.keys(inp).forEach((key) => {
        (inp as unknown as Record<string, boolean>)[key] = false;
      });
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleBlur);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleBlur);
    };
  }, [gameState]);

  // Handle Goal Highlight Callback
  useEffect(() => {
    simulationRef.current.onGoalScored = (highlight) => {
      setCurrentHighlight(highlight);
    };
  }, []);

  // Poll for Match Over condition
  useEffect(() => {
    if (gameState !== 'playing') return;
    const interval = setInterval(() => {
      if (simulationRef.current.isGameOver) {
        setGameState('game_over');
        // Record match result into weekly leaderboard
        const p1Goals = simulationRef.current.players.find(p => p.isUser)?.goalsScored || 0;
        const won = simulationRef.current.scoreRed > simulationRef.current.scoreBlue;
        multiplayer.recordMatchResult(
          currentUser?.displayName || 'Bạn',
          won,
          p1Goals,
          matchTitle
        );
      }
    }, 500);
    return () => clearInterval(interval);
  }, [gameState, currentUser, matchTitle]);

  const handleStartGame = useCallback(
    (config: {
      mode: GameMode;
      matchType: MatchType;
      vehicleMode: VehicleMode;
      matchTitle: string;
      opponentName?: string;
    }) => {
      setMatchType(config.matchType);
      setVehicleMode(config.vehicleMode);
      setMatchTitle(config.matchTitle);

      // Re-initialize simulation
      const newSim = new GameSimulation(config.matchType, config.vehicleMode);
      newSim.onGoalScored = (highlight) => setCurrentHighlight(highlight);
      simulationRef.current = newSim;

      newSim.resetKickoff();
      setGameState('playing');
    },
    []
  );

  const handleToggleVehicle = useCallback(() => {
    const nextMode: VehicleMode = vehicleMode === 'car' ? 'foot' : 'car';
    setVehicleMode(nextMode);
    simulationRef.current.players.forEach((p) => {
      p.vehicleMode = nextMode;
    });
  }, [vehicleMode]);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-950 font-sans select-none">
      {/* 3D WebGL Canvas Layer (Persistent) */}
      <StadiumCanvas
        simulation={simulationRef.current}
        inputState={inputRef}
        cameraPreset={cameraPreset}
        isSlowMotion={isSlowMotion}
      />

      {/* Title Screen Overlay */}
      {gameState === 'title' && (
        <TitleScreen
          onStartGame={handleStartGame}
          onOpenTournament={() => setIsTournamentOpen(true)}
          onOpenLeaderboard={() => setIsLeaderboardOpen(true)}
          onOpenGmail={() => setIsGmailOpen(true)}
          onOpenWidget={() => setIsWidgetOpen(true)}
        />
      )}

      {/* In-Game HUD Overlay */}
      {gameState === 'playing' && (
        <GameHUD
          simulation={simulationRef.current}
          cameraPreset={cameraPreset}
          onSelectCamera={setCameraPreset}
          onToggleVehicle={handleToggleVehicle}
          vehicleMode={vehicleMode}
          onOpenTournament={() => setIsTournamentOpen(true)}
          onOpenLeaderboard={() => setIsLeaderboardOpen(true)}
          onOpenGmailModal={() => setIsGmailOpen(true)}
          onOpenWidgetModal={() => setIsWidgetOpen(true)}
          onOpenReplayModal={() => {
            if (currentHighlight) {
              setIsReplayOpen(true);
            }
          }}
          hasReplayAvailable={!!currentHighlight}
          matchTitle={matchTitle}
        />
      )}

      {/* Game Over / Victory Modal */}
      {gameState === 'game_over' && (
        <GameOverModal
          simulation={simulationRef.current}
          matchTitle={matchTitle}
          onRestart={() => {
            handleStartGame({
              mode: 'quick_match',
              matchType,
              vehicleMode,
              matchTitle,
            });
          }}
          onHome={() => setGameState('title')}
          onOpenGmail={() => setIsGmailOpen(true)}
          onOpenReplay={() => {
            if (currentHighlight) {
              setIsReplayOpen(true);
            }
          }}
        />
      )}

      {/* 3 Tournament Modes Modal */}
      {isTournamentOpen && (
        <TournamentView
          onClose={() => setIsTournamentOpen(false)}
          onStartMatch={(mode, vehMode, title) => {
            handleStartGame({
              mode,
              matchType: '2v2',
              vehicleMode: vehMode,
              matchTitle: title,
            });
          }}
        />
      )}

      {/* Weekly Global Leaderboard Modal */}
      {isLeaderboardOpen && (
        <LeaderboardModal
          onClose={() => setIsLeaderboardOpen(false)}
          currentPlayerName={currentUser?.displayName || 'Bạn'}
        />
      )}

      {/* Gmail Match Notification Modal */}
      {isGmailOpen && (
        <GmailNotificationModal
          currentUser={currentUser}
          onUserLoggedIn={(user) => setCurrentUser(user)}
          onClose={() => setIsGmailOpen(false)}
          matchInfo={{
            matchTitle,
            scoreRed: simulationRef.current.scoreRed,
            scoreBlue: simulationRef.current.scoreBlue,
            userGoals:
              simulationRef.current.players.find((p) => p.isUser)?.goalsScored || 0,
          }}
        />
      )}

      {/* Widget Install / Fast-access Permission Modal */}
      {isWidgetOpen && (
        <WidgetInstallModal onClose={() => setIsWidgetOpen(false)} />
      )}

      {/* Goal Highlight / Slow-Motion Replay Modal */}
      {isReplayOpen && currentHighlight && (
        <ReplayModal
          highlight={currentHighlight}
          onClose={() => {
            setIsReplayOpen(false);
            setIsSlowMotion(false);
          }}
          onSetSlowMotion={setIsSlowMotion}
        />
      )}
    </div>
  );
}
