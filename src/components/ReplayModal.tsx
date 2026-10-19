/**
 * Goal Highlight & Slow-Motion Replay Modal
 * Displays shot trajectory metrics, slow-mo speed toggles, multi-angle view, and highlight snapshot sharing.
 */

import React, { useState } from 'react';
import { GoalHighlight } from '../types/game';
import { Play, Pause, RotateCcw, Share2, Download, X, Eye, Gauge, Crosshair } from 'lucide-react';
import confetti from 'canvas-confetti';

interface ReplayModalProps {
  highlight: GoalHighlight;
  onClose: () => void;
  onSetSlowMotion: (slowMo: boolean) => void;
}

export const ReplayModal: React.FC<ReplayModalProps> = ({
  highlight,
  onClose,
  onSetSlowMotion,
}) => {
  const [isPlaying, setIsPlaying] = useState(true);
  const [speedMultiplier, setSpeedMultiplier] = useState<0.25 | 0.5 | 1.0>(0.5);
  const [copiedShare, setCopiedShare] = useState(false);

  const triggerCelebration = () => {
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
    });
  };

  const handleShare = () => {
    const text = `⚽ Siêu phẩm bàn thắng của ${highlight.scorerName} với tốc độ sút ${highlight.speedKmh} km/h từ khoảng cách ${highlight.distanceMeters}m trong Super Turbo Football 3D!`;
    navigator.clipboard.writeText(text);
    setCopiedShare(true);
    triggerCelebration();
    setTimeout(() => setCopiedShare(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-lg rounded-2xl p-5 shadow-2xl text-white relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg bg-slate-800 border border-slate-700 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Title */}
        <div className="flex items-center gap-2 mb-3">
          <span className="px-2 py-0.5 rounded bg-red-600 text-white font-extrabold text-xs uppercase tracking-wider">
            REPLAY HIGHLIGHT
          </span>
          <span className="text-amber-400 font-bold text-sm">Khoảnh Khắc Ghi Bàn Đẹp Mắt</span>
        </div>

        {/* Scorer Info & Commentary */}
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 mb-4">
          <div className="text-lg font-black text-white flex items-center justify-between">
            <span>{highlight.scorerName}</span>
            <span className={`text-xs px-2 py-0.5 rounded font-bold uppercase ${highlight.scorerTeam === 'red' ? 'bg-red-500/20 text-red-400' : 'bg-blue-500/20 text-blue-400'}`}>
              Đội {highlight.scorerTeam === 'red' ? 'Đỏ' : 'Xanh'}
            </span>
          </div>

          <p className="text-xs text-slate-300 mt-2 italic leading-relaxed">
            "{highlight.commentary}"
          </p>

          {/* Metric Stats */}
          <div className="grid grid-cols-2 gap-3 mt-4 pt-3 border-t border-slate-800/80">
            <div className="flex items-center gap-2">
              <Gauge className="w-4 h-4 text-amber-400" />
              <div>
                <div className="text-[10px] text-slate-400 uppercase font-bold">Tốc độ cú sút</div>
                <div className="font-mono font-black text-base text-amber-300 tabular-nums">
                  {highlight.speedKmh} <span className="text-xs font-normal text-slate-400">km/h</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Crosshair className="w-4 h-4 text-cyan-400" />
              <div>
                <div className="text-[10px] text-slate-400 uppercase font-bold">Cự ly dứt điểm</div>
                <div className="font-mono font-black text-base text-cyan-300 tabular-nums">
                  {highlight.distanceMeters} <span className="text-xs font-normal text-slate-400">mét</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Slow Motion Controls */}
        <div className="flex flex-col gap-2 mb-4">
          <div className="text-xs font-bold text-slate-300">Tốc Độ Phát Lại (Slow-Motion):</div>
          <div className="flex items-center gap-2">
            {([0.25, 0.5, 1.0] as const).map(rate => (
              <button
                key={rate}
                onClick={() => {
                  setSpeedMultiplier(rate);
                  onSetSlowMotion(rate < 1.0);
                }}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                  speedMultiplier === rate
                    ? 'bg-amber-500 text-black border-amber-400 shadow-[0_0_10px_#f59e0b]'
                    : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                }`}
              >
                {rate === 0.25 ? '0.25x Siêu Chậm' : rate === 0.5 ? '0.5x Slow-Mo' : '1.0x Chuẩn'}
              </button>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between gap-3 pt-2">
          <button
            onClick={handleShare}
            className="flex-1 flex items-center justify-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-white font-bold py-2.5 rounded-xl border border-slate-700 text-xs transition-colors cursor-pointer"
          >
            <Share2 className="w-4 h-4 text-cyan-400" />
            <span>{copiedShare ? 'Đã Sao Chép Highlight!' : 'Chia Sẻ Khoảnh Khắc'}</span>
          </button>

          <button
            onClick={onClose}
            className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold py-2.5 rounded-xl text-xs transition-all cursor-pointer shadow-lg text-center"
          >
            Tiếp Tục Trận Đấu
          </button>
        </div>
      </div>
    </div>
  );
};
