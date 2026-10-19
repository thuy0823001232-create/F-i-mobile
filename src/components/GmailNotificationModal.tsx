/**
 * Gmail Match Notification & Account Setup Modal
 * Fully follows Google Workspace Integration skill:
 * - Client-side token authentication via Firebase Auth
 * - In-memory access token
 * - Explicit user confirmation dialog before sending email
 * - Official Google Sign-In button styling
 */

import React, { useState } from 'react';
import { User } from 'firebase/auth';
import { signInWithGoogle, sendGmailNotification, getCachedAccessToken } from '../services/authAndGmail';
import { Mail, CheckCircle2, AlertTriangle, Send, X, ShieldCheck, Sparkles } from 'lucide-react';

interface GmailNotificationModalProps {
  currentUser: User | null;
  onUserLoggedIn: (user: User) => void;
  onClose: () => void;
  matchInfo?: {
    matchTitle: string;
    scoreRed: number;
    scoreBlue: number;
    userGoals: number;
  };
}

export const GmailNotificationModal: React.FC<GmailNotificationModalProps> = ({
  currentUser,
  onUserLoggedIn,
  onClose,
  matchInfo,
}) => {
  const [recipient, setRecipient] = useState<string>(currentUser?.email || 'thuy0823001232@gmail.com');
  const [notificationType, setNotificationType] = useState<'account_setup' | 'match_result'>('account_setup');
  const [isSending, setIsSending] = useState(false);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [sendSuccess, setSendSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showConfirmSend, setShowConfirmSend] = useState(false);

  const handleGoogleSignIn = async () => {
    setIsSigningIn(true);
    setErrorMessage(null);
    try {
      const res = await signInWithGoogle();
      if (res) {
        onUserLoggedIn(res.user);
        if (res.user.email) {
          setRecipient(res.user.email);
        }
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      setErrorMessage(message || 'Đăng nhập Google thất bại');
    } finally {
      setIsSigningIn(false);
    }
  };

  const getEmailContent = () => {
    if (notificationType === 'account_setup') {
      return {
        subject: '⚽ [Super Turbo Football 3D] Xác nhận thiết lập tài khoản và kết nối trận đấu',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0f172a; color: #f8fafc; padding: 24px; border-radius: 12px;">
            <h2 style="color: #f59e0b; margin-top: 0;">⚽ Super Turbo Football 3D - Battle Arena</h2>
            <p>Xin chào <strong>${currentUser?.displayName || 'Cầu thủ'}</strong>,</p>
            <p>Tài khoản của bạn đã được kết nối thành công với máy chủ <strong>Super Turbo Football 3D</strong>.</p>
            <div style="background: #1e293b; padding: 16px; border-radius: 8px; border-left: 4px solid #3b82f6; margin: 16px 0;">
              <p style="margin: 0; font-size: 14px;"><strong>Trạng thái:</strong> Đang hoạt động trên máy chủ trực tuyến</p>
              <p style="margin: 6px 0 0 0; font-size: 14px;"><strong>Chế độ mở khóa:</strong> World Grand Cup · Siêu Xe Nitro · Đại Chiến Blaster</p>
              <p style="margin: 6px 0 0 0; font-size: 14px;"><strong>Hệ thống:</strong> Trọng tài AI & Bình luận viên trực tiếp đã kích hoạt</p>
            </div>
            <p style="font-size: 13px; color: #94a3b8;">Bạn sẽ nhận được thông báo kết quả thi đấu và bảng xếp hạng hàng tuần qua địa chỉ email này.</p>
            <hr style="border: 0; border-top: 1px solid #334155; margin: 20px 0;" />
            <p style="font-size: 11px; color: #64748b;">Super Turbo Football 3D · Công nghệ mô phỏng bóng đá hành động</p>
          </div>
        `
      };
    } else {
      return {
        subject: `🏆 [Super Turbo Football 3D] Báo cáo kết quả trận đấu: ${matchInfo?.matchTitle || 'Trận Đấu Đỉnh Cao'}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0f172a; color: #f8fafc; padding: 24px; border-radius: 12px;">
            <h2 style="color: #ef4444; margin-top: 0;">🏆 Kết Quả Trận Đấu Rực Lửa!</h2>
            <p>Trận đấu <strong>${matchInfo?.matchTitle || 'Trận đấu'}</strong> vừa kết thúc trên sân vận động Super Turbo Stadium.</p>
            <div style="background: #1e293b; padding: 18px; border-radius: 8px; text-align: center; margin: 16px 0;">
              <div style="font-size: 28px; font-weight: bold; color: #fbbf24;">
                ĐỘI ĐỎ ${matchInfo?.scoreRed ?? 3} - ${matchInfo?.scoreBlue ?? 2} ĐỘI XANH
              </div>
              <p style="margin: 8px 0 0 0; font-size: 14px; color: #a5f3fc;">
                Bàn thắng của bạn trong trận: <strong>${matchInfo?.userGoals ?? 2}</strong> bàn
              </p>
            </div>
            <p style="font-size: 13px; color: #94a3b8;">Điểm xếp hạng tuần của bạn đã được cập nhật vào bảng xếp hạng toàn cầu!</p>
          </div>
        `
      };
    }
  };

  const handleExecuteSend = async () => {
    setShowConfirmSend(false);
    setIsSending(true);
    setErrorMessage(null);
    setSendSuccess(false);

    const emailData = getEmailContent();
    const result = await sendGmailNotification({
      recipientEmail: recipient,
      subject: emailData.subject,
      htmlBody: emailData.html,
    });

    setIsSending(false);
    if (result.success) {
      setSendSuccess(true);
    } else {
      setErrorMessage(result.error || 'Gửi email qua Gmail thất bại');
    }
  };

  const hasAccessToken = !!getCachedAccessToken();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-lg rounded-2xl p-5 shadow-2xl text-white relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg bg-slate-800 border border-slate-700 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Title */}
        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-10 h-10 rounded-xl bg-red-600/20 border border-red-500/40 flex items-center justify-center text-red-400">
            <Mail className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-black uppercase tracking-wide">
              Kết Nối Gmail & Thông Báo Trận Đấu
            </h2>
            <div className="text-xs text-slate-400">
              Gửi thông báo thiết lập tài khoản & cập nhật kết quả qua Gmail
            </div>
          </div>
        </div>

        {/* Google Authentication Box */}
        {!hasAccessToken ? (
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 mb-4">
            <div className="text-xs text-slate-300 mb-3 leading-relaxed">
              Để bảo mật và gửi thông báo trận đấu trực tiếp qua hộp thư Gmail, vui lòng đăng nhập tài khoản Google của bạn:
            </div>

            {/* Official Google Sign-In Button */}
            <button
              onClick={handleGoogleSignIn}
              disabled={isSigningIn}
              className="w-full flex items-center justify-center gap-3 bg-white hover:bg-slate-100 text-slate-800 font-bold py-2.5 px-4 rounded-xl shadow cursor-pointer transition-colors"
            >
              <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-5 h-5">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
              </svg>
              <span>{isSigningIn ? 'Đang xác thực Google...' : 'Sign in with Google'}</span>
            </button>
          </div>
        ) : (
          <div className="bg-emerald-950/40 p-3 rounded-xl border border-emerald-600/40 flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              <div>
                <div className="text-xs font-bold text-white">Đã đăng nhập Google</div>
                <div className="text-[11px] text-emerald-300 font-mono">{currentUser?.email || recipient}</div>
              </div>
            </div>
            <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded font-bold border border-emerald-500/30">
              Quyền Gmail Sẵn Sàng
            </span>
          </div>
        )}

        {/* Email Form */}
        <div className="space-y-3 mb-4">
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">
              Email nhận thông báo:
            </label>
            <input
              type="email"
              value={recipient}
              onChange={e => setRecipient(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 font-mono"
              placeholder="ví dụ: thuy0823001232@gmail.com"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">
              Loại thông báo cần gửi:
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setNotificationType('account_setup')}
                className={`py-2 px-3 rounded-lg text-xs font-bold border cursor-pointer transition-colors ${
                  notificationType === 'account_setup'
                    ? 'bg-blue-600 text-white border-blue-500'
                    : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                }`}
              >
                Xác nhận tài khoản & Vào Game
              </button>

              <button
                type="button"
                onClick={() => setNotificationType('match_result')}
                className={`py-2 px-3 rounded-lg text-xs font-bold border cursor-pointer transition-colors ${
                  notificationType === 'match_result'
                    ? 'bg-blue-600 text-white border-blue-500'
                    : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                }`}
              >
                Báo cáo kết quả trận đấu
              </button>
            </div>
          </div>
        </div>

        {/* Error / Success Feedback */}
        {sendSuccess && (
          <div className="bg-emerald-950/60 border border-emerald-500/60 text-emerald-300 p-3 rounded-xl flex items-center gap-2 text-xs mb-4">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>Thông báo đã được gửi thành công đến <strong>{recipient}</strong> qua Gmail API!</span>
          </div>
        )}

        {errorMessage && (
          <div className="bg-red-950/60 border border-red-500/60 text-red-300 p-3 rounded-xl flex items-center gap-2 text-xs mb-4">
            <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Workspace Skill Explicit Confirmation Dialog */}
        {showConfirmSend && (
          <div className="p-3 bg-amber-950/50 border border-amber-600/70 rounded-xl mb-4">
            <div className="text-xs font-bold text-amber-300 flex items-center gap-1.5 mb-1.5">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <span>Xác nhận gửi email qua tài khoản Gmail của bạn?</span>
            </div>
            <p className="text-[11px] text-slate-300 mb-3">
              Thao tác này sẽ gửi một email thông báo đến <strong>{recipient}</strong> với tiêu đề:
              <br />
              <em className="text-amber-200">"{getEmailContent().subject}"</em>
            </p>
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setShowConfirmSend(false)}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleExecuteSend}
                className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow cursor-pointer"
              >
                Xác nhận gửi ngay
              </button>
            </div>
          </div>
        )}

        {/* Send Button */}
        {!showConfirmSend && (
          <div className="flex items-center justify-end gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold cursor-pointer"
            >
              Đóng
            </button>
            <button
              onClick={() => {
                if (!hasAccessToken) {
                  setErrorMessage('Vui lòng bấm Sign in with Google phía trên trước khi gửi.');
                  return;
                }
                setShowConfirmSend(true);
              }}
              disabled={isSending}
              className="flex items-center gap-2 bg-gradient-to-r from-red-600 to-amber-500 hover:from-red-500 hover:to-amber-400 text-white font-extrabold px-5 py-2.5 rounded-xl text-xs shadow-lg cursor-pointer transition-transform hover:scale-105"
            >
              <Send className="w-4 h-4" />
              <span>{isSending ? 'Đang gửi qua Gmail...' : 'Gửi Thông Báo Qua Gmail'}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
