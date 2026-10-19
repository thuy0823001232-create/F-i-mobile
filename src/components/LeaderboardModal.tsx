/**
 * Weekly Global Leaderboard Modal
 * Weekly rankings, goals scored, win streak, trophies, and friend competition.
 */

import React, { useState, useEffect } from 'react';
import { LeaderboardEntry } from '../types/game';
import { multiplayer } from '../services/multiplayerSync';
import { Trophy, Medal, Flame, Globe, Users, X, Share2 } from 'lucide-react';

interface LeaderboardModalProps {
  onClose: () => void;
  currentPlayerName: string;
}

export const LeaderboardModal: React.FC<LeaderboardModalProps> = ({
  onClose,
  currentPlayerName,
}) => {
  const [board, setBoard] = useState<LeaderboardEntry[]>([]);
  const [timeRemaining, setTimeRemaining] = useState<string>('3 ngày 14 giờ');

  useEffect(() => {
    setBoard(multiplayer.getWeeklyLeaderboard());
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-2xl rounded-2xl p-5 shadow-2xl text-white relative max-h-[90vh] flex flex-col">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg bg-slate-800 border border-slate-700 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center justify-between mb-4 pr-10">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow">
              <Trophy className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black uppercase tracking-wide flex items-center gap-2">
                <span>Bảng Xếp Hạng Toàn Cầu Hàng Tuần</span>
                <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded font-bold border border-emerald-500/30">
                  Tuần 42
                </span>
              </h2>
              <div className="text-xs text-slate-400">
                Làm mới bảng xếp hạng sau: <span className="text-amber-400 font-bold">{timeRemaining}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Top 3 Podium Highlights */}
        <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-4">
          {board.slice(0, 3).map((entry, idx) => {
            const colors = [
              'border-amber-400 bg-amber-500/10 text-amber-300', // Rank 1
              'border-slate-400 bg-slate-500/10 text-slate-300', // Rank 2
              'border-amber-700 bg-amber-800/10 text-amber-500', // Rank 3
            ];
            const badges = ['🥇 Hạng 1', '🥈 Hạng 2', '🥉 Hạng 3'];
            return (
              <div
                key={entry.playerName}
                className={`p-3 rounded-xl border flex flex-col items-center text-center ${colors[idx]}`}
              >
                <div className="text-[11px] font-black uppercase tracking-wider">{badges[idx]}</div>
                <div className="font-extrabold text-xs sm:text-sm text-white mt-1 line-clamp-1">{entry.playerName}</div>
                <div className="font-mono font-black text-sm sm:text-base text-amber-300 mt-1 tabular-nums">
                  {entry.rating} <span className="text-[10px] text-slate-400">Elo</span>
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5 font-medium">
                  {entry.weeklyWins} Thắng · {entry.totalGoals} Bàn
                </div>
              </div>
            );
          })}
        </div>

        {/* Scrollable Leaderboard Table */}
        <div className="flex-1 overflow-y-auto rounded-xl border border-slate-800 bg-slate-950/80 mb-4 divide-y divide-slate-800/60">
          <div className="grid grid-cols-12 gap-2 px-3 py-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider bg-slate-900/60 sticky top-0">
            <div className="col-span-2 text-center">Hạng</div>
            <div className="col-span-5">Cầu Thủ</div>
            <div className="col-span-2 text-center">Số Trận Thắng</div>
            <div className="col-span-3 text-right">Điểm Rating</div>
          </div>

          {board.map(entry => {
            const isMe = entry.playerName.toLowerCase() === currentPlayerName.toLowerCase();
            return (
              <div
                key={entry.playerName}
                className={`grid grid-cols-12 gap-2 px-3 py-2.5 items-center text-xs transition-colors ${
                  isMe ? 'bg-amber-500/20 border-l-4 border-amber-400 font-bold' : 'hover:bg-slate-900/50'
                }`}
              >
                <div className="col-span-2 flex items-center justify-center">
                  <span
                    className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[11px] ${
                      entry.rank === 1
                        ? 'bg-amber-400 text-slate-950 font-black'
                        : entry.rank === 2
                        ? 'bg-slate-300 text-slate-950 font-black'
                        : entry.rank === 3
                        ? 'bg-amber-700 text-white font-black'
                        : 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    {entry.rank}
                  </span>
                </div>

                <div className="col-span-5 flex items-center gap-2">
                  <span className="text-xs bg-slate-800 px-1.5 py-0.5 rounded text-slate-400 font-mono">
                    {entry.country}
                  </span>
                  <span className="truncate font-semibold text-white">
                    {entry.playerName} {isMe && '(Bạn)'}
                  </span>
                </div>

                <div className="col-span-2 text-center font-mono tabular-nums text-emerald-400 font-bold">
                  {entry.weeklyWins}
                </div>

                <div className="col-span-3 text-right font-mono tabular-nums text-amber-300 font-bold">
                  {entry.rating}
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom Actions */}
        <div className="flex items-center justify-between gap-3 pt-1">
          <div className="text-xs text-slate-400">
            Đấu thắng trận để nhận thêm <span className="text-amber-400 font-bold">+25 Elo</span> hàng tuần!
          </div>
          <button
            onClick={onClose}
            className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-5 py-2 rounded-xl text-xs cursor-pointer shadow"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
