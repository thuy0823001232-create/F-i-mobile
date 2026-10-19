/**
 * Game Over & Match Victory Summary Modal
 * Shows winner, goal tally, cards issued by referee, and quick action to email results or view replays.
 */

import React, { useEffect } from 'react';
import { GameSimulation } from '../game/physicsEngine';
import { Trophy, RotateCcw, Home, Mail, Share2, Award, Zap } from 'lucide-react';
import confetti from 'canvas-confetti';

interface GameOverModalProps {
  simulation: GameSimulation;
  matchTitle: string;
  onRestart: () => void;
  onHome: () => void;
  onOpenGmail: () => void;
  onOpenReplay: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  simulation,
  matchTitle,
  onRestart,
  onHome,
  onOpenGmail,
  onOpenReplay,
}) => {
  const isRedWinner = simulation.scoreRed > simulation.scoreBlue;
  const isDraw = simulation.scoreRed === simulation.scoreBlue;

  useEffect(() => {
    if (isRedWinner) {
      confetti({
        particleCount: 100,
        spread: 80,
        origin: { y: 0.5 },
      });
    }
  }, [isRedWinner]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-2xl p-6 shadow-2xl text-white text-center">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center mx-auto mb-3 text-amber-400">
          <Trophy className="w-9 h-9" />
        </div>

        <h2 className="text-xl sm:text-2xl font-black uppercase tracking-wider text-amber-400">
          {isDraw ? 'KẾT THÚC BẤT PHÂN THẮNG BẠI' : isRedWinner ? 'CHIẾN THẮNG HUY HOÀNG!' : 'ĐỘI BẠN GIÀNH CHIẾN THẮNG'}
        </h2>
        <div className="text-xs text-slate-300 mt-1">{matchTitle}</div>

        {/* Final Score Board */}
        <div className="my-5 bg-slate-950 p-4 rounded-xl border border-slate-800 flex items-center justify-center gap-6">
          <div className="text-center">
            <div className="text-xs font-bold text-red-400 uppercase">Đội Đỏ</div>
            <div className="text-3xl sm:text-4xl font-black tabular-nums text-white mt-1">
              {simulation.scoreRed}
            </div>
          </div>

          <div className="text-slate-600 font-black text-2xl">:</div>

          <div className="text-center">
            <div className="text-xs font-bold text-blue-400 uppercase">Đội Xanh</div>
            <div className="text-3xl sm:text-4xl font-black tabular-nums text-white mt-1">
              {simulation.scoreBlue}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-2 mb-3">
          <button
            onClick={onOpenReplay}
            className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold cursor-pointer transition-colors"
          >
            <RotateCcw className="w-4 h-4 text-cyan-400" />
            <span>Xem Lại Bàn Thắng</span>
          </button>

          <button
            onClick={onOpenGmail}
            className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-red-300 border border-slate-700 text-xs font-bold cursor-pointer transition-colors"
          >
            <Mail className="w-4 h-4 text-red-400" />
            <span>Gửi Báo Cáo Gmail</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onHome}
            className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold cursor-pointer transition-colors"
          >
            <Home className="w-4 h-4" />
            <span>Về Màn Hình Chính</span>
          </button>

          <button
            onClick={onRestart}
            className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-xs shadow-lg cursor-pointer transition-transform hover:scale-105"
          >
            <RotateCcw className="w-4 h-4 fill-slate-950" />
            <span>Đá Lại Trận Mới</span>
          </button>
        </div>
      </div>
    </div>
  );
};
