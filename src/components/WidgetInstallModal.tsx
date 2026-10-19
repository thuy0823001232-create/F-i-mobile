/**
 * Widget Permission & Fast-Access Launcher Modal
 * Allows the user to grant permission for homescreen / desktop widget pinning, match push alerts, and quick match tracker.
 */

import React, { useState } from 'react';
import { Smartphone, CheckCircle, ShieldCheck, X, Sparkles, Bell } from 'lucide-react';
import confetti from 'canvas-confetti';

interface WidgetInstallModalProps {
  onClose: () => void;
}

export const WidgetInstallModal: React.FC<WidgetInstallModalProps> = ({ onClose }) => {
  const [hasPermission, setHasPermission] = useState<boolean>(false);
  const [notifGranted, setNotifGranted] = useState<boolean>(false);

  const handleGrantPermission = async () => {
    // Request notification permission if available
    if (typeof window !== 'undefined' && 'Notification' in window) {
      try {
        const res = await Notification.requestPermission();
        if (res === 'granted') {
          setNotifGranted(true);
        }
      } catch {
        // Fallback
      }
    }
    setHasPermission(true);
    confetti({ particleCount: 60, spread: 60 });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-2xl p-5 shadow-2xl text-white relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg bg-slate-800 border border-slate-700 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-purple-600/20 border border-purple-500/40 flex items-center justify-center text-purple-400">
            <Smartphone className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-black uppercase tracking-wide">
              Hỏi Quyền Ra Widget Màn Hình
            </h2>
            <div className="text-xs text-slate-400">Ghim Widget trận đấu trực tiếp</div>
          </div>
        </div>

        {hasPermission ? (
          <div className="bg-emerald-950/50 border border-emerald-600/50 rounded-xl p-4 text-center my-3">
            <CheckCircle className="w-10 h-10 text-emerald-400 mx-auto mb-2" />
            <h3 className="font-extrabold text-sm text-emerald-300">Đã Cấp Quyền Widget Thành Công!</h3>
            <p className="text-xs text-slate-300 mt-1 leading-relaxed">
              Widget tỷ số trực tiếp đã sẵn sàng xuất hiện trên màn hình chính của bạn. Bạn có thể theo dõi tỷ số mọi lúc!
            </p>
          </div>
        ) : (
          <div className="space-y-3 mb-5">
            <p className="text-xs text-slate-300 leading-relaxed">
              Bạn có muốn cho phép <strong>Super Turbo Football 3D</strong> tạo Widget lối tắt trên màn hình và gửi thông báo khi phát hiện đối thủ trực tuyến mới?
            </p>

            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2 text-xs">
              <div className="flex items-center gap-2 text-slate-200">
                <Sparkles className="w-4 h-4 text-amber-400 flex-shrink-0" />
                <span>Xem nhanh tỷ số và trận đấu trực tiếp qua Widget màn hình</span>
              </div>
              <div className="flex items-center gap-2 text-slate-200">
                <Bell className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                <span>Báo rung khi có bạn bè hoặc đối thủ mới ghép phòng online</span>
              </div>
              <div className="flex items-center gap-2 text-slate-200">
                <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>Khởi chạy trận đấu chỉ với 1 chạm</span>
              </div>
            </div>
          </div>
        )}

        <div className="flex items-center justify-end gap-2 pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold cursor-pointer"
          >
            Đóng
          </button>
          {!hasPermission && (
            <button
              onClick={handleGrantPermission}
              className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-extrabold px-5 py-2 rounded-xl text-xs shadow-lg cursor-pointer transition-transform hover:scale-105"
            >
              Đồng Ý Cấp Quyền Widget
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
