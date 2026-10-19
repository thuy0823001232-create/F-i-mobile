/**
 * Sleek, Low-Occlusion HUD Overlay with Collapsible Bottom Control Dock
 * Complies with Three.js skill directives:
 * - 85%+ unobstructed viewport (pointer-events-none wrappers)
 * - Zero backdrop-filter over active WebGL
 * - Tabular-nums integer score & clock readouts
 * - Collapsible bottom dock
 * - Real-time tactical radar minimap
 */

import React, { useState, useEffect } from 'react';
import { GameSimulation } from '../game/physicsEngine';
import { CameraPreset } from './StadiumCanvas';
import { sounds } from '../services/soundEffects';
import { commentator } from '../services/commentator';
import { CommentatorAnnouncement, VehicleMode } from '../types/game';
import {
  Volume2,
  VolumeX,
  Camera,
  Car,
  User as UserIcon,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Trophy,
  Share2,
  Mic,
  Smartphone,
  Mail,
  Zap,
} from 'lucide-react';

interface GameHUDProps {
  simulation: GameSimulation;
  cameraPreset: CameraPreset;
  onSelectCamera: (preset: CameraPreset) => void;
  onToggleVehicle: () => void;
  vehicleMode: VehicleMode;
  onOpenTournament: () => void;
  onOpenLeaderboard: () => void;
  onOpenGmailModal: () => void;
  onOpenWidgetModal: () => void;
  onOpenReplayModal: () => void;
  hasReplayAvailable: boolean;
  matchTitle: string;
}

export const GameHUD: React.FC<GameHUDProps> = ({
  simulation,
  cameraPreset,
  onSelectCamera,
  onToggleVehicle,
  vehicleMode,
  onOpenTournament,
  onOpenLeaderboard,
  onOpenGmailModal,
  onOpenWidgetModal,
  onOpenReplayModal,
  hasReplayAvailable,
  matchTitle,
}) => {
  const [isDockCollapsed, setIsDockCollapsed] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [activeAnnouncement, setActiveAnnouncement] = useState<CommentatorAnnouncement | null>(null);
  const [, setTick] = useState(0);

  // HUD sync tick (30 fps is plenty for HUD numbers)
  useEffect(() => {
    const timer = setInterval(() => {
      setTick(t => t + 1);
    }, 100);
    return () => clearInterval(timer);
  }, []);

  // Commentator listener
  useEffect(() => {
    const unsubscribe = commentator.addListener((announcement) => {
      setActiveAnnouncement(announcement);
      // Auto clear banner after 4.5 seconds
      setTimeout(() => {
        setActiveAnnouncement(curr => (curr?.id === announcement.id ? null : curr));
      }, 4500);
    });
    return unsubscribe;
  }, []);

  const handleToggleMute = () => {
    const nextMuted = sounds.toggleMute();
    commentator.setMuted(nextMuted);
    setIsMuted(nextMuted);
  };

  const userPlayer = simulation.players.find(p => p.isUser) || simulation.players[0];
  const minutes = Math.floor(simulation.matchTimeSeconds / 60);
  const seconds = Math.floor(simulation.matchTimeSeconds % 60);
  const timeFormatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  return (
    <div className="absolute inset-0 pointer-events-none select-none overflow-hidden flex flex-col justify-between p-3 sm:p-5">
      {/* 1. TOP STATUS CLUSTER: Scoreboard, Match Clock & Tournament Badge */}
      <div className="flex items-start justify-between w-full">
        {/* Left: App Title & Match Mode */}
        <div className="flex flex-col gap-1 pointer-events-auto">
          <div className="flex items-center gap-2 bg-slate-900/90 text-white px-3.5 py-1.5 rounded-lg border border-slate-700/80 shadow-md">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
            <span className="font-bold text-xs sm:text-sm tracking-wide uppercase text-slate-200">
              {matchTitle}
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-300 bg-slate-950/80 px-2.5 py-1 rounded border border-slate-800">
            <span className="text-amber-400 font-semibold">Trọng Tài:</span>
            <span>{simulation.referee.state === 'patrolling' ? 'Quan sát' : 'Can thiệp lỗi'}</span>
            {simulation.referee.activeCard && (
              <span
                className={`ml-1 px-1.5 py-0.2 rounded text-[10px] font-bold ${
                  simulation.referee.activeCard === 'red' ? 'bg-red-600 text-white' : 'bg-yellow-400 text-black'
                }`}
              >
                {simulation.referee.activeCard === 'red' ? 'THẺ ĐỎ' : 'THẺ VÀNG'}
              </span>
            )}
          </div>
        </div>

        {/* Center: Main Match Scoreboard */}
        <div className="flex flex-col items-center pointer-events-auto">
          <div className="flex items-center bg-slate-950/95 border border-slate-700/80 rounded-xl px-4 py-2 shadow-2xl text-white">
            {/* Team Red */}
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-red-500 shadow-[0_0_8px_#ef4444]"></span>
              <span className="font-extrabold text-sm sm:text-base text-red-400 uppercase tracking-wider">ĐỎ</span>
              <span className="font-black text-2xl sm:text-3xl tabular-nums ml-2 text-white">
                {simulation.scoreRed}
              </span>
            </div>

            <div className="mx-3 text-slate-500 font-bold text-lg sm:text-xl">:</div>

            {/* Team Blue */}
            <div className="flex items-center gap-2">
              <span className="font-black text-2xl sm:text-3xl tabular-nums mr-2 text-white">
                {simulation.scoreBlue}
              </span>
              <span className="font-extrabold text-sm sm:text-base text-blue-400 uppercase tracking-wider">XANH</span>
              <span className="w-3 h-3 rounded-full bg-blue-500 shadow-[0_0_8px_#3b82f6]"></span>
            </div>

            {/* Match Clock */}
            <div className="ml-4 pl-3 border-l border-slate-700 flex flex-col items-center">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Hiệp 1</span>
              <span className="font-mono text-xs sm:text-sm font-bold text-amber-300 tabular-nums">
                {timeFormatted}
              </span>
            </div>
          </div>

          {/* User Boost & Stamina Bar */}
          {userPlayer && (
            <div className="mt-1.5 flex items-center gap-2 bg-slate-950/80 px-3 py-1 rounded-full border border-slate-800 text-[11px] text-slate-300">
              <Zap className="w-3 h-3 text-cyan-400" />
              <span className="font-semibold text-cyan-300">Nitro:</span>
              <div className="w-24 sm:w-32 bg-slate-800 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-cyan-500 to-blue-500 h-full transition-all duration-100"
                  style={{ width: `${Math.round(userPlayer.boost)}%` }}
                />
              </div>
              <span className="tabular-nums font-mono text-[10px] text-slate-400">
                {Math.round(userPlayer.boost)}%
              </span>
            </div>
          )}
        </div>

        {/* Right: Quick Action Modals (Leaderboard, Gmail, Widget) */}
        <div className="flex items-center gap-1.5 pointer-events-auto">
          <button
            onClick={onOpenLeaderboard}
            className="flex items-center gap-1 bg-slate-900/90 hover:bg-slate-800 text-amber-300 px-2.5 py-1.5 rounded-lg border border-slate-700 text-xs font-semibold shadow transition-colors cursor-pointer"
            title="Bảng xếp hạng toàn cầu"
          >
            <Trophy className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Bảng Hạng</span>
          </button>

          <button
            onClick={onOpenGmailModal}
            className="flex items-center gap-1 bg-slate-900/90 hover:bg-slate-800 text-red-300 px-2.5 py-1.5 rounded-lg border border-slate-700 text-xs font-semibold shadow transition-colors cursor-pointer"
            title="Gửi thông báo trận đấu qua Gmail"
          >
            <Mail className="w-3.5 h-3.5 text-red-400" />
            <span className="hidden sm:inline">Gmail</span>
          </button>

          <button
            onClick={onOpenWidgetModal}
            className="flex items-center gap-1 bg-slate-900/90 hover:bg-slate-800 text-purple-300 px-2.5 py-1.5 rounded-lg border border-slate-700 text-xs font-semibold shadow transition-colors cursor-pointer"
            title="Hỏi quyền ra Widget"
          >
            <Smartphone className="w-3.5 h-3.5 text-purple-400" />
            <span className="hidden sm:inline">Widget</span>
          </button>
        </div>
      </div>

      {/* 2. CENTER-LEFT: 2D Tactical Minimap Radar */}
      <div className="pointer-events-auto flex items-end justify-between w-full">
        <div className="bg-slate-950/90 border border-slate-700/80 rounded-xl p-2 shadow-xl flex flex-col items-center">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
            Radar Sân Cỏ
          </div>
          <div className="relative w-36 h-24 bg-emerald-950/80 rounded border border-emerald-600/50 overflow-hidden">
            {/* Center line */}
            <div className="absolute top-0 bottom-0 left-1/2 w-[1px] bg-emerald-500/40" />
            <div className="absolute top-1/2 left-1/2 w-6 h-6 -translate-x-1/2 -translate-y-1/2 rounded-full border border-emerald-500/40" />

            {/* Players */}
            {simulation.players.map(p => {
              // Normalize (-36..36 to 0..100%, -24..24 to 0..100%)
              const leftPct = ((p.position.x + 36) / 72) * 100;
              const topPct = ((p.position.z + 24) / 48) * 100;
              return (
                <div
                  key={p.id}
                  className={`absolute w-2 h-2 -translate-x-1/2 -translate-y-1/2 rounded-full ${
                    p.team === 'red' ? 'bg-red-400' : 'bg-blue-400'
                  } ${p.isUser ? 'ring-2 ring-white ring-offset-1' : ''}`}
                  style={{ left: `${leftPct}%`, top: `${topPct}%` }}
                />
              );
            })}

            {/* Referee */}
            <div
              className="absolute w-2 h-2 -translate-x-1/2 -translate-y-1/2 bg-yellow-300 rounded-sm"
              style={{
                left: `${((simulation.referee.x + 36) / 72) * 100}%`,
                top: `${((simulation.referee.z + 24) / 48) * 100}%`,
              }}
            />

            {/* Ball */}
            <div
              className="absolute w-2.5 h-2.5 -translate-x-1/2 -translate-y-1/2 bg-white rounded-full shadow-[0_0_6px_#ffffff]"
              style={{
                left: `${((simulation.ball.x + 36) / 72) * 100}%`,
                top: `${((simulation.ball.z + 24) / 48) * 100}%`,
              }}
            />
          </div>
          <div className="flex items-center gap-2 mt-1 text-[9px] text-slate-400 font-medium">
            <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-red-400"></span> Đỏ</span>
            <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span> Xanh</span>
            <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 bg-yellow-300"></span> T.Tài</span>
          </div>
        </div>

        {/* Live Commentator Speech Banner */}
        {activeAnnouncement && (
          <div className="bg-slate-900/95 border-l-4 border-amber-400 text-white px-4 py-2.5 rounded-r-xl max-w-md shadow-2xl animate-fade-in mx-auto">
            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400 uppercase tracking-wider mb-0.5">
              <Mic className="w-3.5 h-3.5 animate-pulse" />
              <span>Bình Luận Viên Trực Tiếp</span>
            </div>
            <p className="text-xs sm:text-sm font-semibold leading-relaxed text-slate-100">
              "{activeAnnouncement.text}"
            </p>
          </div>
        )}

        {/* Right side: Replay Prompt button if goal scored */}
        {hasReplayAvailable && (
          <div className="pointer-events-auto">
            <button
              onClick={onOpenReplayModal}
              className="flex items-center gap-2 bg-gradient-to-r from-red-600 to-amber-500 hover:from-red-500 hover:to-amber-400 text-white font-extrabold px-3.5 py-2 rounded-xl shadow-lg cursor-pointer transform hover:scale-105 transition-all"
            >
              <RotateCcw className="w-4 h-4" />
              <span className="text-xs sm:text-sm">Xem Lại Bàn Thắng (Slow-Mo)</span>
            </button>
          </div>
        )}
      </div>

      {/* 3. UNIFIED BOTTOM CONTROL DOCK (Collapsible, Zero Viewport Occlusion) */}
      <div className="relative pointer-events-auto flex flex-col items-center">
        {/* Toggle Collapse Button */}
        <button
          onClick={() => setIsDockCollapsed(!isDockCollapsed)}
          className="flex items-center gap-1 text-[11px] font-bold text-slate-300 bg-slate-900/90 hover:bg-slate-800 px-3 py-1 rounded-t-lg border-t border-x border-slate-700/80 shadow cursor-pointer transition-colors"
        >
          {isDockCollapsed ? (
            <>
              <ChevronUp className="w-3.5 h-3.5 text-amber-400" />
              <span>Hiện Bảng Điều Khiển</span>
            </>
          ) : (
            <>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              <span>Ẩn Bảng Điều Khiển</span>
            </>
          )}
        </button>

        {/* Dock Container */}
        {!isDockCollapsed && (
          <div className="w-full max-w-4xl bg-slate-950/95 border border-slate-700/80 rounded-b-2xl rounded-tl-2xl rounded-tr-2xl p-2.5 sm:p-3 shadow-2xl flex flex-wrap items-center justify-between gap-3 text-white">
            {/* Control Hints */}
            <div className="flex flex-col gap-0.5 text-[11px] text-slate-300">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="bg-slate-800 px-1.5 py-0.5 rounded font-mono font-bold text-amber-400">P1 (WASD)</span>
                <span>Di chuyển</span>
                <span className="text-slate-500">·</span>
                <span className="bg-slate-800 px-1.5 py-0.5 rounded font-mono font-bold text-cyan-400">Space / F</span>
                <span>Sút bóng / Bắn laser</span>
                <span className="text-slate-500">·</span>
                <span className="bg-slate-800 px-1.5 py-0.5 rounded font-mono font-bold text-emerald-400">Shift</span>
                <span>Tăng tốc Nitro</span>
              </div>
              <div className="text-[10px] text-slate-400 flex items-center gap-1.5">
                <span className="bg-slate-800 px-1.5 py-0.5 rounded font-mono font-bold text-blue-400">P2 (Phím Mũi Tên)</span>
                <span>Điều khiển P2 · Phím M sút/bắn · N tăng tốc</span>
              </div>
            </div>

            {/* Interactive Control Buttons */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* Vehicle Toggle: Foot Striker vs Turbo Battle Car */}
              <button
                onClick={onToggleVehicle}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-bold cursor-pointer transition-all ${
                  vehicleMode === 'car'
                    ? 'bg-amber-500 text-black border-amber-400 shadow-[0_0_12px_#f59e0b]'
                    : 'bg-slate-900 text-slate-200 border-slate-700 hover:bg-slate-800'
                }`}
              >
                {vehicleMode === 'car' ? <Car className="w-4 h-4" /> : <UserIcon className="w-4 h-4" />}
                <span>{vehicleMode === 'car' ? 'Siêu Xe Nitro' : 'Cầu Thủ Đá Bóng'}</span>
              </button>

              {/* Camera Presets */}
              <div className="flex items-center bg-slate-900 rounded-lg p-0.5 border border-slate-700 text-xs">
                {(['broadcast', 'follow', 'drone', 'goal_cam'] as CameraPreset[]).map(preset => {
                  const labels: Record<CameraPreset, string> = {
                    broadcast: 'Truyền hình',
                    follow: 'Góc nhìn thứ 3',
                    drone: 'Flycam trên cao',
                    goal_cam: 'Góc cầu môn',
                  };
                  const active = cameraPreset === preset;
                  return (
                    <button
                      key={preset}
                      onClick={() => onSelectCamera(preset)}
                      className={`px-2 py-1 rounded font-medium cursor-pointer transition-colors ${
                        active ? 'bg-blue-600 text-white font-bold' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {labels[preset]}
                    </button>
                  );
                })}
              </div>

              {/* Tournament Modal Trigger */}
              <button
                onClick={onOpenTournament}
                className="flex items-center gap-1 bg-gradient-to-r from-amber-600 to-yellow-500 text-slate-950 font-bold px-2.5 py-1.5 rounded-lg text-xs cursor-pointer hover:opacity-90 transition-opacity"
              >
                <Trophy className="w-3.5 h-3.5" />
                <span>Giải Đấu</span>
              </button>

              {/* Mute Audio */}
              <button
                onClick={handleToggleMute}
                className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 cursor-pointer"
                title={isMuted ? 'Bật âm thanh' : 'Tắt âm thanh'}
              >
                {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
