/**
 * Atmospheric Full-Viewport Title Screen & Online Matchmaking Launcher
 * Complies with Game Craft constitution:
 * - Bespoke inline SVG title lockup over negative space
 * - Primary Start CTA with Enter/Space hotkey
 * - Single flat control hint line
 * - Online Matchmaking auto-search with instant AI fallback
 * - Selection for 1v1 up to 5v5 (10 players on pitch!) and car mode
 */

import React, { useState, useEffect } from 'react';
import { GameMode, MatchType, VehicleMode } from '../types/game';
import { multiplayer } from '../services/multiplayerSync';
import {
  Trophy,
  Users,
  Flame,
  Zap,
  Play,
  RotateCcw,
  Sparkles,
  Shield,
  Car,
  User as UserIcon,
  Wifi,
  Search,
  Bot,
} from 'lucide-react';

interface TitleScreenProps {
  onStartGame: (config: {
    mode: GameMode;
    matchType: MatchType;
    vehicleMode: VehicleMode;
    matchTitle: string;
    opponentName?: string;
  }) => void;
  onOpenTournament: () => void;
  onOpenLeaderboard: () => void;
  onOpenGmail: () => void;
  onOpenWidget: () => void;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({
  onStartGame,
  onOpenTournament,
  onOpenLeaderboard,
  onOpenGmail,
  onOpenWidget,
}) => {
  const [matchType, setMatchType] = useState<MatchType>('2v2');
  const [vehicleMode, setVehicleMode] = useState<VehicleMode>('foot');
  const [isSearchingOnline, setIsSearchingOnline] = useState(false);
  const [searchStatus, setSearchStatus] = useState<string>('');
  const [matchedOpponent, setMatchedOpponent] = useState<{ name: string; isAi: boolean } | null>(null);

  // Keyboard shortcut: Space or Enter to quickly start
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.code === 'Enter' || e.code === 'Space') && !isSearchingOnline) {
        onStartGame({
          mode: 'quick_match',
          matchType,
          vehicleMode,
          matchTitle: vehicleMode === 'car' ? 'Trận Chiến Siêu Xe Nitro' : 'Trận Đại Chiến 3D',
        });
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [matchType, vehicleMode, isSearchingOnline, onStartGame]);

  // Subscribe to multiplayer matchmaking
  useEffect(() => {
    const unsubscribe = multiplayer.subscribe(status => {
      if (status.state === 'searching') {
        setIsSearchingOnline(true);
        setSearchStatus('Đang quét máy chủ tìm người chơi khác vào cùng lúc...');
      } else if (status.state === 'matched') {
        setSearchStatus(`Đã tìm thấy đối thủ trực tuyến: ${status.opponentName}!`);
        setMatchedOpponent({ name: status.opponentName || 'Người chơi Online', isAi: false });
        setTimeout(() => {
          setIsSearchingOnline(false);
          onStartGame({
            mode: 'quick_match',
            matchType,
            vehicleMode,
            matchTitle: `Đấu Online: Bạn vs ${status.opponentName}`,
            opponentName: status.opponentName,
          });
        }, 1500);
      } else if (status.state === 'ai_fallback') {
        setSearchStatus(`Chưa có người cùng lúc — Kết nối ngay với Bot Cao Cấp: ${status.opponentName}!`);
        setMatchedOpponent({ name: status.opponentName || 'AI Master', isAi: true });
        setTimeout(() => {
          setIsSearchingOnline(false);
          onStartGame({
            mode: 'quick_match',
            matchType,
            vehicleMode,
            matchTitle: `Đấu Trực Tiếp: Bạn vs ${status.opponentName}`,
            opponentName: status.opponentName,
          });
        }, 1500);
      } else {
        setIsSearchingOnline(false);
      }
    });

    return unsubscribe;
  }, [matchType, vehicleMode, onStartGame]);

  const handleStartOnlineMatchmaking = () => {
    multiplayer.startMatchmaking('Tiền Đạo Vàng');
  };

  return (
    <div className="absolute inset-0 z-40 flex flex-col justify-between p-6 sm:p-10 bg-slate-950/85 overflow-y-auto">
      {/* Top Bar: Nav shortcuts */}
      <div className="flex items-center justify-between w-full max-w-6xl mx-auto">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-emerald-400"></span>
          <span className="text-xs font-mono font-bold text-slate-300 uppercase tracking-widest">
            Máy Chủ Trực Tuyến: Hoạt Động (60 FPS WebGL)
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenLeaderboard}
            className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-amber-300 border border-slate-800 text-xs font-bold cursor-pointer transition-colors shadow"
          >
            Bảng Xếp Hạng Tuần
          </button>
          <button
            onClick={onOpenGmail}
            className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-red-300 border border-slate-800 text-xs font-bold cursor-pointer transition-colors shadow"
          >
            Kết Nối Gmail
          </button>
          <button
            onClick={onOpenWidget}
            className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-purple-300 border border-slate-800 text-xs font-bold cursor-pointer transition-colors shadow"
          >
            Widget
          </button>
        </div>
      </div>

      {/* Hero Centerpiece: Bespoke SVG Title Lockup */}
      <div className="flex flex-col items-center justify-center my-auto text-center max-w-3xl mx-auto">
        {/* Inline SVG Title Lockup */}
        <div className="mb-4">
          <svg className="w-64 sm:w-80 h-auto" viewBox="0 0 400 90" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="titleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#f59e0b" />
                <stop offset="40%" stopColor="#ef4444" />
                <stop offset="100%" stopColor="#3b82f6" />
              </linearGradient>
            </defs>
            <text x="200" y="38" textAnchor="middle" fill="#f8fafc" fontSize="24" fontWeight="900" letterSpacing="4">
              SUPER TURBO
            </text>
            <text x="200" y="78" textAnchor="middle" fill="url(#titleGrad)" fontSize="46" fontWeight="900" letterSpacing="2">
              FOOTBALL 3D
            </text>
          </svg>
        </div>

        <p className="text-sm sm:text-base text-slate-300 font-medium max-w-xl mb-6 leading-relaxed">
          Đại chiến bóng đá 3D chân thực trên chảo lửa sân vận động. Tranh tài với Siêu xe tên lửa, Súng bắn Laser, Trọng tài chuyên nghiệp và Bình luận viên giọng đọc trực tiếp!
        </p>

        {/* Match Settings Config: Players & Vehicle Mode */}
        <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl w-full max-w-lg mb-6 shadow-2xl flex flex-col gap-4 text-left">
          {/* Match Size: 1v1 up to 5v5 (10 players) */}
          <div>
            <div className="flex items-center justify-between text-xs font-bold text-slate-300 mb-2">
              <span>Số Lượng Cầu Thủ Trên Sân:</span>
              <span className="text-amber-400 font-mono">
                {matchType === '5v5_multi' ? '10 Người Chơi (5v5 Toàn Đội)' : matchType === '3v3' ? '6 Người (3v3)' : matchType === '2v2' ? '4 Người (2v2)' : '2 Người (1v1 Solo)'}
              </span>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {(['1v1', '2v2', '3v3', '5v5_multi'] as MatchType[]).map(type => (
                <button
                  key={type}
                  onClick={() => setMatchType(type)}
                  className={`py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    matchType === type
                      ? 'bg-blue-600 text-white border-blue-400 shadow-[0_0_12px_rgba(59,130,246,0.5)]'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                  }`}
                >
                  {type === '5v5_multi' ? '5v5 (10 người)' : type}
                </button>
              ))}
            </div>
          </div>

          {/* Vehicle Mode: Foot Striker vs Turbo Rocket Car */}
          <div>
            <div className="flex items-center justify-between text-xs font-bold text-slate-300 mb-2">
              <span>Hình Thức Thi Đấu:</span>
              <span className="text-cyan-400 font-mono">
                {vehicleMode === 'car' ? 'Siêu Xe Tên Lửa (Nitro Car)' : 'Cầu Thủ Đá Bóng (Foot Striker)'}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setVehicleMode('foot')}
                className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                  vehicleMode === 'foot'
                    ? 'bg-emerald-600 text-white border-emerald-400 shadow'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                }`}
              >
                <UserIcon className="w-4 h-4" />
                <span>Cầu Thủ Đá Bóng</span>
              </button>

              <button
                onClick={() => setVehicleMode('car')}
                className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                  vehicleMode === 'car'
                    ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-[0_0_12px_#f59e0b]'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                }`}
              >
                <Car className="w-4 h-4" />
                <span>Siêu Xe Nitro (Rocket)</span>
              </button>
            </div>
          </div>
        </div>

        {/* Primary CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full max-w-lg">
          {/* Auto Find Online Opponent */}
          <button
            onClick={handleStartOnlineMatchmaking}
            disabled={isSearchingOnline}
            className="flex-1 w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black py-3.5 px-6 rounded-2xl shadow-xl cursor-pointer text-sm transition-transform hover:scale-105"
          >
            <Wifi className="w-4 h-4" />
            <span>Tìm Đối Thủ Online (Máy Chủ Tự Động)</span>
          </button>

          {/* Quick Play Against AI / Local 2-Player */}
          <button
            onClick={() =>
              onStartGame({
                mode: 'quick_match',
                matchType,
                vehicleMode,
                matchTitle: vehicleMode === 'car' ? 'Trận Chiến Siêu Xe Nitro' : 'Trận Đại Chiến 3D',
              })
            }
            className="flex-1 w-full flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black py-3.5 px-6 rounded-2xl shadow-xl cursor-pointer text-sm transition-transform hover:scale-105"
          >
            <Play className="w-4 h-4 fill-slate-950" />
            <span>Vào Trận Ngay (Enter / Space)</span>
          </button>
        </div>

        {/* Tournament Shortcut */}
        <div className="mt-3">
          <button
            onClick={onOpenTournament}
            className="text-xs font-bold text-amber-400 hover:text-amber-300 underline underline-offset-4 cursor-pointer flex items-center gap-1.5"
          >
            <Trophy className="w-3.5 h-3.5" />
            <span>Khám phá 3 Chế Độ Giải Đấu Gay Cấn & Cúp Vàng</span>
          </button>
        </div>
      </div>

      {/* Online Searching Modal Backdrop */}
      {isSearchingOnline && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85">
          <div className="bg-slate-900 border border-slate-700 p-6 rounded-2xl max-w-md w-full text-center text-white shadow-2xl">
            <div className="w-14 h-14 rounded-2xl bg-blue-600/20 border border-blue-500 flex items-center justify-center mx-auto mb-4 text-blue-400">
              <Search className="w-7 h-7 animate-spin" />
            </div>
            <h3 className="text-base font-black uppercase tracking-wide">
              Máy Chủ Đang Tìm Người Chơi...
            </h3>
            <p className="text-xs text-slate-300 mt-2 leading-relaxed">
              {searchStatus}
            </p>
            {matchedOpponent && (
              <div className="mt-4 p-3 rounded-xl bg-emerald-950/60 border border-emerald-500 text-emerald-300 text-xs font-bold flex items-center justify-center gap-2">
                {matchedOpponent.isAi ? <Bot className="w-4 h-4" /> : <Users className="w-4 h-4" />}
                <span>Ghép phòng thành công với: {matchedOpponent.name}</span>
              </div>
            )}
            <button
              onClick={() => {
                multiplayer.cancelMatchmaking();
                setIsSearchingOnline(false);
              }}
              className="mt-5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold cursor-pointer"
            >
              Hủy Tìm Kiếm
            </button>
          </div>
        </div>
      )}

      {/* Single Flat Control-Hint Line (Constitutional Mandate) */}
      <div className="text-center text-[11px] font-semibold text-slate-400 pt-3">
        WASD Di Chuyển · Space / F Sút / Bắn Súng · Shift Tăng Tốc · Esc Tạm Dừng · Phím Mũi Tên cho P2
      </div>
    </div>
  );
};
