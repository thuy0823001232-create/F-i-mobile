/**
 * Live Audio & Speech Commentator for Football Matches
 * Uses Web Speech Synthesis with dynamic pitch/rate and rich Vietnamese & English commentary lines.
 */

import { CommentatorAnnouncement } from '../types/game';

type CommentatorListener = (announcement: CommentatorAnnouncement) => void;

class CommentatorService {
  private synth: SpeechSynthesis | null = null;
  private voice: SpeechSynthesisVoice | null = null;
  private isMuted: boolean = false;
  private language: 'vi' | 'en' = 'vi';
  private listeners: CommentatorListener[] = [];
  private lastAnnouncementTime: number = 0;
  private history: CommentatorAnnouncement[] = [];

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.synth = window.speechSynthesis;
      this.updateVoice();
      if (this.synth.onvoiceschanged !== undefined) {
        this.synth.onvoiceschanged = () => this.updateVoice();
      }
    }
  }

  private updateVoice() {
    if (!this.synth) return;
    const voices = this.synth.getVoices();
    if (this.language === 'vi') {
      const viVoice = voices.find(v => v.lang.startsWith('vi') || v.lang.includes('VIE'));
      this.voice = viVoice || voices.find(v => v.lang.startsWith('en')) || voices[0] || null;
    } else {
      const enVoice = voices.find(v => v.lang.startsWith('en-US') || v.lang.startsWith('en'));
      this.voice = enVoice || voices[0] || null;
    }
  }

  public setLanguage(lang: 'vi' | 'en') {
    this.language = lang;
    this.updateVoice();
  }

  public getLanguage(): 'vi' | 'en' {
    return this.language;
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (muted && this.synth) {
      this.synth.cancel();
    }
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  public addListener(listener: CommentatorListener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  public getHistory(): CommentatorAnnouncement[] {
    return this.history.slice(-10);
  }

  public announce(
    type: CommentatorAnnouncement['type'],
    data?: { player?: string; team?: string; speed?: number; detail?: string }
  ) {
    const now = Date.now();
    // Throttle duplicate commentary
    if (now - this.lastAnnouncementTime < 1800 && type !== 'goal') {
      return;
    }
    this.lastAnnouncementTime = now;

    const phrase = this.generatePhrase(type, data);
    const announcement: CommentatorAnnouncement = {
      id: Math.random().toString(36).substring(2, 9),
      text: phrase.text,
      timestamp: now,
      type,
      intensity: phrase.intensity,
    };

    this.history.push(announcement);
    this.listeners.forEach(fn => fn(announcement));

    if (!this.isMuted && this.synth) {
      try {
        this.synth.cancel(); // Don't queue too long
        const utterance = new SpeechSynthesisUtterance(phrase.text);
        if (this.voice) {
          utterance.voice = this.voice;
        }
        utterance.rate = phrase.intensity === 'epic' ? 1.15 : 1.05;
        utterance.pitch = phrase.intensity === 'epic' ? 1.25 : 1.0;
        this.synth.speak(utterance);
      } catch {
        // SpeechSynthesis error fallback
      }
    }
  }

  private generatePhrase(
    type: CommentatorAnnouncement['type'],
    data?: { player?: string; team?: string; speed?: number; detail?: string }
  ): { text: string; intensity: 'normal' | 'excited' | 'epic' } {
    const pName = data?.player || 'Cầu thủ';
    const isVi = this.language === 'vi';

    if (type === 'goal') {
      const viLines = [
        `VÀOOOOOO! Một siêu phẩm không thể cản phá của ${pName}! Cả cầu trường nổ tung!`,
        `VÀOOOOOO! Cú dứt điểm thần sầu của ${pName}! Thủ môn hoàn toàn bất lực!`,
        `BÀN THẮNG VÀNG! ${pName} đã xé toang mành lưới đối phương! Quá đẳng cấp!`,
        `VÀOOOOO! Cú sút sấm sét tốc độ ${Math.round(data?.speed || 98)} km/h găm thẳng vào góc chết!`
      ];
      const enLines = [
        `GOALLLLLLL! Unbelievable masterclass strike by ${pName}! The stadium goes wild!`,
        `WHAT A GOAL! ${pName} fires an unstoppable rocket into the top corner!`,
        `IT'S IN! Spectacular finish by ${pName}! World-class technique!`,
      ];
      const list = isVi ? viLines : enLines;
      return { text: list[Math.floor(Math.random() * list.length)], intensity: 'epic' };
    }

    if (type === 'shot') {
      const viLines = [
        `${pName} tung cú nã đại bác từ cự ly xa! Cực kỳ nguy hiểm!`,
        `Một pha ra chân chớp nhoáng của ${pName}!`,
        `${pName} dứt điểm căng như kẻ chỉ!`,
        `Pha phối hợp phản công sắc lẹm kết thúc bằng cú sút của ${pName}!`
      ];
      const enLines = [
        `${pName} unleashes a ferocious thunderbolt from distance!`,
        `Lightning quick shot by ${pName}!`,
        `${pName} strikes it with venom!`
      ];
      const list = isVi ? viLines : enLines;
      return { text: list[Math.floor(Math.random() * list.length)], intensity: 'excited' };
    }

    if (type === 'foul') {
      const viLines = [
        `Trọng tài đã cất còi! Một pha vào bóng thô bạo từ phía sau của ${pName}!`,
        `Tiếng còi của trọng tài vang lên! Pha phạm lỗi tranh chấp quyết liệt!`,
        `Tắc bóng nguy hiểm! Trọng tài lập tức can thiệp!`
      ];
      const enLines = [
        `The referee blows the whistle! Harsh tackle from ${pName}!`,
        `Foul given! Aggressive sliding challenge on the pitch!`,
        `The official steps in to stop play!`
      ];
      const list = isVi ? viLines : enLines;
      return { text: list[Math.floor(Math.random() * list.length)], intensity: 'excited' };
    }

    if (type === 'card') {
      const isRed = data?.detail === 'red';
      const viLines = isRed
        ? [
            `THẺ ĐỎ TRỰC TIẾP! Trọng tài truất quyền thi đấu của ${pName}! Một pha phạm lỗi thô bạo!`,
            `Trọng tài rút thẻ đỏ! ${pName} buộc phải rời sân sớm!`
          ]
        : [
            `Trọng tài rút thẻ vàng cảnh cáo số ${data?.detail || ''} ${pName}!`,
            `Thẻ vàng cho ${pName} sau pha va chạm nguy hiểm!`
          ];
      const enLines = isRed
        ? [`RED CARD! The referee sends off ${pName}! An unforgiving decision!`]
        : [`Yellow card shown to ${pName} for that cynical foul!`];
      const list = isVi ? viLines : enLines;
      return { text: list[Math.floor(Math.random() * list.length)], intensity: 'epic' };
    }

    if (type === 'save') {
      const viLines = [
        `Phản xạ xuất thần của người gác đền! Cứu thua mười mươi!`,
        `Thủ môn bay người đấm bóng ngoạn mục!`,
        `Không thể tin nổi! Pha cứu thua bằng đầu ngón tay cứu rỗi đội nhà!`
      ];
      const enLines = [
        `Sensational diving fingertip save by the goalkeeper!`,
        `What a stop! Incredible reflexes between the posts!`,
      ];
      const list = isVi ? viLines : enLines;
      return { text: list[Math.floor(Math.random() * list.length)], intensity: 'excited' };
    }

    if (type === 'kickoff') {
      const viLines = [
        `Trọng tài nổi còi bắt đầu trận đại chiến! Hai đội tràn lên với khí thế rực lửa!`,
        `Trận đấu chính thức bắt đầu! Hãy cùng chờ đón những siêu phẩm sân cỏ!`,
      ];
      const enLines = [
        `The referee blows the whistle and kickoff is underway! The atmosphere is electric!`,
        `Match started! Let the battle for the championship begin!`
      ];
      const list = isVi ? viLines : enLines;
      return { text: list[Math.floor(Math.random() * list.length)], intensity: 'normal' };
    }

    // Default
    return {
      text: isVi ? `Diễn biến trận đấu đang hết sức nghẹt thở!` : `End to end action on the pitch!`,
      intensity: 'normal'
    };
  }
}

export const commentator = new CommentatorService();
