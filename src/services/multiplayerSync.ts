/**
 * Matchmaking & Weekly Leaderboard Service
 * Auto-finds other active players or pairs with adaptive AI bots.
 * Manages weekly tournament brackets and player ratings.
 */

import { LeaderboardEntry } from '../types/game';

type MatchStatusListener = (status: {
  state: 'idle' | 'searching' | 'matched' | 'ai_fallback';
  opponentName?: string;
  opponentRank?: number;
  roomId?: string;
  isAi?: boolean;
}) => void;

class MultiplayerService {
  private channel: BroadcastChannel | null = null;
  private listeners: MatchStatusListener[] = [];
  private searchTimer: number | null = null;
  private currentRoomId: string | null = null;
  private localPlayerName: string = 'Tiền Đạo Vàng';

  constructor() {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        this.channel = new BroadcastChannel('super_turbo_football_matchmaking');
        this.channel.onmessage = this.handleMessage.bind(this);
      } catch (e) {
        console.warn('BroadcastChannel not supported', e);
      }
    }
  }

  public setPlayerName(name: string) {
    this.localPlayerName = name;
  }

  public subscribe(listener: MatchStatusListener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notify(status: Parameters<MatchStatusListener>[0]) {
    this.listeners.forEach(fn => fn(status));
  }

  private handleMessage(ev: MessageEvent) {
    const data = ev.data;
    if (!data || !data.type) return;

    if (data.type === 'FIND_OPPONENT' && this.searchTimer) {
      // Another human is looking! Respond and pair
      const roomId = `room_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      this.currentRoomId = roomId;
      if (this.channel) {
        this.channel.postMessage({
          type: 'MATCH_ACCEPT',
          roomId,
          acceptorName: this.localPlayerName,
          targetSeeker: data.senderName,
        });
      }
      if (this.searchTimer) {
        clearTimeout(this.searchTimer);
        this.searchTimer = null;
      }
      this.notify({
        state: 'matched',
        opponentName: data.senderName,
        opponentRank: 1850 + Math.floor(Math.random() * 200),
        roomId,
        isAi: false,
      });
    } else if (data.type === 'MATCH_ACCEPT' && this.searchTimer && data.targetSeeker === this.localPlayerName) {
      if (this.searchTimer) {
        clearTimeout(this.searchTimer);
        this.searchTimer = null;
      }
      this.currentRoomId = data.roomId;
      this.notify({
        state: 'matched',
        opponentName: data.acceptorName,
        opponentRank: 1920 + Math.floor(Math.random() * 150),
        roomId: data.roomId,
        isAi: false,
      });
    }
  }

  public startMatchmaking(preferredName?: string) {
    if (preferredName) this.localPlayerName = preferredName;
    this.notify({ state: 'searching' });

    // Announce to other tabs/windows
    if (this.channel) {
      this.channel.postMessage({
        type: 'FIND_OPPONENT',
        senderName: this.localPlayerName,
      });
    }

    // Auto find: if nobody joins within 4 seconds, connect with AI bot!
    if (this.searchTimer) clearTimeout(this.searchTimer);
    this.searchTimer = window.setTimeout(() => {
      this.searchTimer = null;
      const aiNames = [
        'AI Ronaldo Bot 7',
        'AI Messi Turbo 10',
        'Cyber Striker MBappe',
        'Robot Haaland 9',
        'Matrix Neuer GK',
      ];
      const botName = aiNames[Math.floor(Math.random() * aiNames.length)];
      this.notify({
        state: 'ai_fallback',
        opponentName: botName,
        opponentRank: 1740 + Math.floor(Math.random() * 300),
        roomId: `ai_match_${Date.now()}`,
        isAi: true,
      });
    }, 4500);
  }

  public cancelMatchmaking() {
    if (this.searchTimer) {
      clearTimeout(this.searchTimer);
      this.searchTimer = null;
    }
    this.notify({ state: 'idle' });
  }

  // Weekly Leaderboard Storage
  public getWeeklyLeaderboard(): LeaderboardEntry[] {
    const key = 'stf_weekly_leaderboard_v1';
    const cached = localStorage.getItem(key);
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch {
        // fallback
      }
    }

    const defaultBoard: LeaderboardEntry[] = [
      { rank: 1, playerName: 'DragonStriker99', country: 'VN', weeklyWins: 42, totalGoals: 118, rating: 2480, avatarSeed: 'D99', favoriteMode: 'Rocket Car' },
      { rank: 2, playerName: 'CyberSpeedster', country: 'KR', weeklyWins: 39, totalGoals: 95, rating: 2390, avatarSeed: 'CS', favoriteMode: 'Blaster' },
      { rank: 3, playerName: 'GoldenBoot_VN', country: 'VN', weeklyWins: 35, totalGoals: 88, rating: 2310, avatarSeed: 'GB', favoriteMode: 'World Cup' },
      { rank: 4, playerName: 'ApexKeeper01', country: 'JP', weeklyWins: 31, totalGoals: 72, rating: 2240, avatarSeed: 'AK', favoriteMode: 'World Cup' },
      { rank: 5, playerName: 'TurboNitro_Bro', country: 'BR', weeklyWins: 28, totalGoals: 69, rating: 2190, avatarSeed: 'TN', favoriteMode: 'Rocket Car' },
      { rank: 6, playerName: 'ThunderBlaster', country: 'DE', weeklyWins: 26, totalGoals: 61, rating: 2130, avatarSeed: 'TB', favoriteMode: 'Blaster' },
      { rank: 7, playerName: 'BãoLửaHàNội', country: 'VN', weeklyWins: 24, totalGoals: 58, rating: 2090, avatarSeed: 'BL', favoriteMode: 'World Cup' },
      { rank: 8, playerName: 'PhantomStriker', country: 'FR', weeklyWins: 21, totalGoals: 50, rating: 2040, avatarSeed: 'PS', favoriteMode: 'Rocket Car' },
    ];
    localStorage.setItem(key, JSON.stringify(defaultBoard));
    return defaultBoard;
  }

  public recordMatchResult(userName: string, isWin: boolean, goals: number, modeName: string) {
    const board = this.getWeeklyLeaderboard();
    const existingIndex = board.findIndex(b => b.playerName.toLowerCase() === userName.toLowerCase());

    if (existingIndex >= 0) {
      if (isWin) board[existingIndex].weeklyWins += 1;
      board[existingIndex].totalGoals += goals;
      board[existingIndex].rating += isWin ? 25 : -10;
      board[existingIndex].favoriteMode = modeName;
    } else {
      board.push({
        rank: board.length + 1,
        playerName: userName,
        country: 'VN',
        weeklyWins: isWin ? 1 : 0,
        totalGoals: goals,
        rating: 1500 + (isWin ? 30 : 0) + goals * 10,
        avatarSeed: userName.substring(0, 2).toUpperCase(),
        favoriteMode: modeName,
      });
    }

    // Sort by rating descending
    board.sort((a, b) => b.rating - a.rating);
    board.forEach((entry, idx) => {
      entry.rank = idx + 1;
    });

    localStorage.setItem('stf_weekly_leaderboard_v1', JSON.stringify(board.slice(0, 20)));
    return board;
  }
}

export const multiplayer = new MultiplayerService();
