/**
 * 3 Tournament Modes System (Cúp Vô Địch Thế Giới, Siêu Xe Nitro, Đại Chiến Sinh Tử)
 * Bracket view, knockout progression, match simulation, and champion celebrations.
 */

import React, { useState } from 'react';
import { TournamentData, TournamentMatch, GameMode, VehicleMode } from '../types/game';
import { Trophy, Flame, ShieldAlert, Award, Play, ChevronRight, X } from 'lucide-react';
import confetti from 'canvas-confetti';

interface TournamentViewProps {
  onClose: () => void;
  onStartMatch: (mode: GameMode, vehicleMode: VehicleMode, matchTitle: string) => void;
}

export const TournamentView: React.FC<TournamentViewProps> = ({
  onClose,
  onStartMatch,
}) => {
  const [selectedTournamentIndex, setSelectedTournamentIndex] = useState<number>(0);

  const tournaments: Array<{
    id: string;
    mode: GameMode;
    vehicleMode: VehicleMode;
    title: string;
    subtitle: string;
    description: string;
    icon: typeof Trophy;
    color: string;
    bracket: TournamentMatch[];
  }> = [
    {
      id: 'world_cup',
      mode: 'tournament',
      vehicleMode: 'foot',
      title: 'Cúp Vô Địch Thế Giới (World Grand Cup)',
      subtitle: 'Đỉnh cao bóng đá 3D truyền thống',
      description: 'Hành trình loại trực tiếp từ vòng Tứ kết đến Chung kết rực lửa dưới ánh đèn sân vận động!',
      icon: Trophy,
      color: 'from-amber-500 to-yellow-600',
      bracket: [
        { id: 'm1', round: 'quarter', teamRed: 'Việt Nam Rồng Vàng', teamBlue: 'Brazil Vũ Công Samba', scoreRed: 3, scoreBlue: 2, isPlayed: true, winner: 'red' },
        { id: 'm2', round: 'quarter', teamRed: 'Pháp Gà Trống', teamBlue: 'Argentina Tango', scoreRed: 1, scoreBlue: 2, isPlayed: true, winner: 'blue' },
        { id: 'm3', round: 'semi', teamRed: 'Việt Nam Rồng Vàng', teamBlue: 'Argentina Tango', scoreRed: 0, scoreBlue: 0, isPlayed: false },
        { id: 'm4', round: 'final', teamRed: 'Đội Thắng BK1', teamBlue: 'Đội Thắng BK2', scoreRed: 0, scoreBlue: 0, isPlayed: false },
      ],
    },
    {
      id: 'car_league',
      mode: 'car_turbo',
      vehicleMode: 'car',
      title: 'Giải Đấu Siêu Xe Tốc Độ (Turbo Nitro Car)',
      subtitle: 'Bóng đá xe đua tên lửa Rocket League',
      description: 'Lái siêu xe gắn động cơ phản lực, drift cua gắt, nitro boost xé gió và húc tung quả bóng vào lưới đối thủ!',
      icon: Flame,
      color: 'from-orange-500 to-red-600',
      bracket: [
        { id: 'c1', round: 'quarter', teamRed: 'Nitro Phoenix', teamBlue: 'Cyber Mustang', scoreRed: 4, scoreBlue: 1, isPlayed: true, winner: 'red' },
        { id: 'c2', round: 'quarter', teamRed: 'Apex Viper', teamBlue: 'Thunder GT', scoreRed: 2, scoreBlue: 3, isPlayed: true, winner: 'blue' },
        { id: 'c3', round: 'semi', teamRed: 'Nitro Phoenix', teamBlue: 'Thunder GT', scoreRed: 0, scoreBlue: 0, isPlayed: false },
        { id: 'c4', round: 'final', teamRed: 'Đội Thắng BK1', teamBlue: 'Đội Thắng BK2', scoreRed: 0, scoreBlue: 0, isPlayed: false },
      ],
    },
    {
      id: 'battle_blaster',
      mode: 'battle_blaster',
      vehicleMode: 'foot',
      title: 'Đại Chiến Sinh Tử (Combat Blaster Arena)',
      subtitle: 'Bóng đá chiến thuật trang bị vũ khí Laser',
      description: 'Cầu thủ được trang bị súng laser Blaster, bắn gây choáng đối phương và tạo lực đẩy sút bóng siêu thanh!',
      icon: ShieldAlert,
      color: 'from-purple-500 to-indigo-600',
      bracket: [
        { id: 'b1', round: 'quarter', teamRed: 'Laser Phantoms', teamBlue: 'Plasma Storm', scoreRed: 5, scoreBlue: 3, isPlayed: true, winner: 'red' },
        { id: 'b2', round: 'quarter', teamRed: 'Hyper Strikers', teamBlue: 'Vortex Titan', scoreRed: 1, scoreBlue: 2, isPlayed: true, winner: 'blue' },
        { id: 'b3', round: 'semi', teamRed: 'Laser Phantoms', teamBlue: 'Vortex Titan', scoreRed: 0, scoreBlue: 0, isPlayed: false },
        { id: 'b4', round: 'final', teamRed: 'Đội Thắng BK1', teamBlue: 'Đội Thắng BK2', scoreRed: 0, scoreBlue: 0, isPlayed: false },
      ],
    },
  ];

  const currentTourney = tournaments[selectedTournamentIndex];

  const handleLaunch = () => {
    confetti({ particleCount: 50, spread: 60 });
    onStartMatch(currentTourney.mode, currentTourney.vehicleMode, currentTourney.title);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-3xl rounded-2xl p-5 shadow-2xl text-white relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg bg-slate-800 border border-slate-700 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-2 mb-4">
          <Award className="w-6 h-6 text-amber-400" />
          <h2 className="text-lg sm:text-xl font-black uppercase tracking-wide">
            3 Chế Độ Giải Đấu Gay Cấn
          </h2>
        </div>

        {/* 3 Tournament Mode Tabs */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
          {tournaments.map((t, idx) => {
            const Icon = t.icon;
            const isSelected = selectedTournamentIndex === idx;
            return (
              <button
                key={t.id}
                onClick={() => setSelectedTournamentIndex(idx)}
                className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                  isSelected
                    ? `bg-slate-800 border-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.25)] ring-1 ring-amber-400`
                    : `bg-slate-950/70 border-slate-800 hover:border-slate-700 text-slate-300`
                }`}
              >
                <div className={`w-8 h-8 rounded-lg bg-gradient-to-r ${t.color} flex items-center justify-center text-slate-950 font-black mb-2 shadow`}>
                  <Icon className="w-4 h-4 text-white" />
                </div>
                <div className="font-extrabold text-xs sm:text-sm text-white line-clamp-1">{t.title}</div>
                <div className="text-[11px] text-amber-400 font-semibold mt-0.5">{t.subtitle}</div>
              </button>
            );
          })}
        </div>

        {/* Selected Tournament Details & Knockout Bracket */}
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 mb-5">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="text-base font-extrabold text-amber-300">{currentTourney.title}</h3>
              <p className="text-xs text-slate-300 mt-1">{currentTourney.description}</p>
            </div>
            <div className="hidden sm:flex px-3 py-1 rounded bg-slate-800 border border-slate-700 text-xs font-mono text-emerald-400 font-bold">
              Cúp Vàng: 10,000 Xu
            </div>
          </div>

          {/* Knockout Bracket Tree */}
          <div className="mt-4 pt-4 border-t border-slate-800">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">
              Cây Đấu Loại Trực Tiếp (Bracket):
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Tứ kết */}
              <div className="flex flex-col gap-2">
                <div className="text-[11px] font-bold text-slate-400 uppercase">Vòng Tứ Kết</div>
                <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800 text-xs">
                  <div className="flex justify-between font-bold text-emerald-400">
                    <span>{currentTourney.bracket[0].teamRed}</span>
                    <span>{currentTourney.bracket[0].scoreRed}</span>
                  </div>
                  <div className="flex justify-between text-slate-400 text-[11px] mt-1">
                    <span>{currentTourney.bracket[0].teamBlue}</span>
                    <span>{currentTourney.bracket[0].scoreBlue}</span>
                  </div>
                </div>
              </div>

              {/* Bán kết (Current Match) */}
              <div className="flex flex-col gap-2">
                <div className="text-[11px] font-bold text-amber-400 uppercase flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                  <span>Bán Kết (Trận Tiếp Theo)</span>
                </div>
                <div className="bg-amber-950/40 p-2.5 rounded-lg border border-amber-600/60 text-xs shadow">
                  <div className="flex justify-between font-bold text-white">
                    <span>{currentTourney.bracket[2].teamRed}</span>
                    <span className="text-amber-400">VS</span>
                  </div>
                  <div className="flex justify-between font-bold text-white mt-1">
                    <span>{currentTourney.bracket[2].teamBlue}</span>
                    <span className="text-amber-400">? - ?</span>
                  </div>
                </div>
              </div>

              {/* Chung kết */}
              <div className="flex flex-col gap-2">
                <div className="text-[11px] font-bold text-slate-400 uppercase">Chung Kết Cúp Vàng</div>
                <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800 text-xs opacity-75">
                  <div className="text-slate-400 font-semibold">{currentTourney.bracket[3].teamRed}</div>
                  <div className="text-slate-400 font-semibold mt-1">{currentTourney.bracket[3].teamBlue}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Start Button */}
        <div className="flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold cursor-pointer"
          >
            Đóng
          </button>
          <button
            onClick={handleLaunch}
            className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black px-6 py-2.5 rounded-xl text-xs sm:text-sm shadow-xl cursor-pointer transition-transform hover:scale-105"
          >
            <Play className="w-4 h-4 fill-slate-950" />
            <span>Tham Gia Trận Đấu Bán Kết Ngay</span>
          </button>
        </div>
      </div>
    </div>
  );
};
