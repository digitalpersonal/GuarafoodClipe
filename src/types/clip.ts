export interface LyricLine {
  id: string;
  startTime: number; // in seconds
  endTime: number; // in seconds
  text: string;
  section: 'intro' | 'verse' | 'chorus' | 'partners' | 'outro';
  highlightWord?: string;
}

export interface AudioTrack {
  id: string;
  title: string;
  artist: string;
  audioUrl: string;
  duration?: number;
  isCustom?: boolean;
}

export interface SavedSongProject {
  id: string;
  title: string;
  artist: string;
  audioUrl: string;
  duration?: number;
  lyrics: LyricLine[];
  createdAt: number;
  updatedAt: number;
  isPreset?: boolean;
}

export type OverlayEffectType = 'steam' | 'embers' | 'cinematic-dust' | 'master-tv' | 'none';

export interface VideoScene {
  id: string;
  startTime: number;
  endTime: number;
  title: string;
  subtitle: string;
  imageSrc: string;
  videoSrc?: string; // HTML5 MP4 video loop source
  fallbackGradient: string;
  transitionType: 'zoom' | 'pan-left' | 'pan-right' | 'pulse' | 'glitch' | 'rotate' | 'fade' | 'fast-zoom' | 'whip-pan';
  ingredientFocus: 'burger' | 'pizza' | 'acai' | 'pastel' | 'scooter' | 'kitchen';
  particleTheme: 'fresh-veggies' | 'cheese-pull' | 'acai-splash' | 'golden-crisp' | 'speed-lines';
  overlayEffect?: OverlayEffectType;
}

export interface PartnerRestaurant {
  id: string;
  name: string;
  category: string;
  specialty: string;
  icon: string;
  discountBadge: string;
  timeMark: number;
}

export type AspectRatioMode = '9:16' | '16:9' | '1:1' | '21:9';

export type SFXType = 'sizzle' | 'glass-clink' | 'restaurant-ambience' | 'order-bell' | 'drink-fizz' | 'grill-sear';

export interface SoundEffectCue {
  id: string;
  name: string;
  type: SFXType;
  timeMark: number; // in seconds
  duration: number; // in seconds
  volume: number; // 0.0 to 1.0
  icon: string;
  description: string;
  enabled: boolean;
}
