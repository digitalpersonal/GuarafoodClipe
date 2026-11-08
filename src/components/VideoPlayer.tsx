import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize, RotateCcw, Smartphone, Monitor, Tv, Film, Eye, EyeOff, Heart, MessageCircle, Send, Music2, Square, Sparkles, Globe } from 'lucide-react';
import { VideoScene, LyricLine, PartnerRestaurant, AspectRatioMode, OverlayEffectType } from '../types/clip';
import { BeatVisualizerCanvas } from './BeatVisualizerCanvas';
import { AUDIO_FILE_PATH, PARTNER_RESTAURANTS } from '../data/songData';

interface VideoPlayerProps {
  scenes: VideoScene[];
  lyrics: LyricLine[];
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  onTimeUpdate: (time: number) => void;
  onDurationChange: (duration: number) => void;
  onPlayPause: () => void;
  onSeek: (time: number) => void;
  aspectRatio: AspectRatioMode;
  onAspectRatioChange: (ratio: AspectRatioMode) => void;
  audioRef: React.RefObject<HTMLAudioElement | null>;
  analyserNode: AnalyserNode | null;
  partners?: PartnerRestaurant[];
  overlayEffect?: OverlayEffectType;
  onOverlayEffectChange?: (effect: OverlayEffectType) => void;
  onOpenExportModal?: () => void;
  subtitleOffset?: number;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  scenes,
  lyrics,
  currentTime,
  duration,
  isPlaying,
  onTimeUpdate,
  onDurationChange,
  onPlayPause,
  onSeek,
  aspectRatio,
  onAspectRatioChange,
  audioRef,
  analyserNode,
  partners = PARTNER_RESTAURANTS,
  overlayEffect = 'master-tv',
  onOverlayEffectChange,
  onOpenExportModal,
  subtitleOffset = 0,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(0.9);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [showSubtitles, setShowSubtitles] = useState(true);
  const [localOverlay, setLocalOverlay] = useState<OverlayEffectType>(overlayEffect);
  const [liked, setLiked] = useState(false);
  const hideControlsTimerRef = useRef<NodeJS.Timeout | null>(null);

  const activeOverlay = onOverlayEffectChange ? overlayEffect : localOverlay;

  // Active scene calculation (fast 2-3s agile cuts)
  const activeSceneIndex = scenes.findIndex(
    (scene) => currentTime >= scene.startTime && currentTime <= scene.endTime
  );
  const currentScene = scenes[activeSceneIndex !== -1 ? activeSceneIndex : 0] || scenes[0];

  const activeSceneIdx = activeSceneIndex !== -1 ? activeSceneIndex : 0;
  const nextSceneIdx = (activeSceneIdx + 1) % scenes.length;
  const nextScene = scenes[nextSceneIdx];

  // Hidden offscreen canvas ref for pre-rendering next scene motion effects
  const offscreenCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Pre-render upcoming scene into hidden canvas cache to guarantee zero stutter on transition
  useEffect(() => {
    if (!nextScene || !offscreenCanvasRef.current) return;
    const canvas = offscreenCanvasRef.current;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = nextScene.imageSrc;
    img.onload = () => {
      canvas.width = 640;
      canvas.height = 360;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    };
  }, [nextSceneIdx, scenes]);

  // Keep all scene videos preloaded and cached in memory, play active scene smoothly
  useEffect(() => {
    videoRefs.current.forEach((vid, idx) => {
      if (!vid) return;
      const isCurrent = idx === activeSceneIdx;
      const isNext = idx === nextSceneIdx;
      if (isCurrent) {
        vid.muted = true;
        if (vid.paused) {
          vid.play().catch(() => {});
        }
      } else if (isNext) {
        // Preload next scene video buffer
        vid.preload = 'auto';
      } else {
        if (!vid.paused) {
          vid.pause();
        }
      }
    });
  }, [activeSceneIdx, nextSceneIdx, isPlaying, scenes]);

  // Active lyric line calculation (adjusted by sync offset)
  const activeLyric = lyrics.find(
    (l) => (currentTime - subtitleOffset) >= l.startTime && (currentTime - subtitleOffset) <= l.endTime
  );

  // Active partner restaurant calculation (adjusted by sync offset)
  const activePartner = partners.find(
    (p) => (currentTime - subtitleOffset) >= p.timeMark && (currentTime - subtitleOffset) < p.timeMark + 2.5
  );

  // Handle audio volume & mute
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted, audioRef]);

  // Handle autohide controls on mouse inactivity
  const handleMouseMove = () => {
    setShowControls(true);
    if (hideControlsTimerRef.current) clearTimeout(hideControlsTimerRef.current);
    if (isPlaying) {
      hideControlsTimerRef.current = setTimeout(() => setShowControls(false), 3500);
    }
  };

  // Toggle fullscreen
  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  // Format mm:ss
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const getMotionVideoClass = (transition: VideoScene['transitionType']) => {
    switch (transition) {
      case 'zoom':
        return 'animate-ken-burns';
      case 'pan-left':
        return 'animate-pan-left';
      case 'pan-right':
        return 'animate-pan-right';
      case 'pulse':
        return 'animate-beat-zoom';
      case 'glitch':
        return 'animate-whip-pan';
      case 'whip-pan':
        return 'animate-whip-pan';
      case 'rotate':
        return 'animate-tilt-pulse';
      case 'fade':
        return 'animate-fade';
      case 'fast-zoom':
        return 'animate-fast-zoom';
      default:
        return 'animate-ken-burns';
    }
  };

  // Dynamic Aspect Ratio Container Styling
  const getContainerRatioStyle = () => {
    switch (aspectRatio) {
      case '9:16':
        return 'w-full max-w-[340px] h-[620px] rounded-[40px] border-8 border-slate-900 shadow-[0_0_50px_rgba(245,158,11,0.2)]';
      case '1:1':
        return 'w-full max-w-[480px] aspect-square rounded-3xl border border-slate-800 shadow-2xl';
      case '21:9':
        return 'w-full aspect-[21/9] rounded-2xl border border-slate-800 shadow-2xl';
      case '16:9':
      default:
        return 'w-full aspect-video rounded-2xl border border-slate-800/80 shadow-2xl';
    }
  };

  return (
    <div className="w-full flex flex-col items-center gap-4">
      {/* PROMINENT FORMAT SWITCHER BAR */}
      <div className="w-full max-w-xl bg-slate-900/90 border border-slate-800 rounded-2xl p-1.5 sm:p-2 flex items-center justify-between gap-1 shadow-lg backdrop-blur-md overflow-x-auto">
        <span className="text-xs font-bold text-slate-300 hidden md:inline px-2 font-heading shrink-0">
          Formato de Tela:
        </span>

        <div className="flex items-center gap-1 w-full overflow-x-auto justify-between sm:justify-around py-0.5">
          <button
            onClick={() => onAspectRatioChange('9:16')}
            className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-xl text-[10px] sm:text-xs font-extrabold transition-all shrink-0 ${
              aspectRatio === '9:16'
                ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 shadow-md'
                : 'bg-slate-950 text-slate-400 hover:text-white'
            }`}
          >
            <Smartphone className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            <span>Celular (9:16)</span>
          </button>

          <button
            onClick={() => onAspectRatioChange('16:9')}
            className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-xl text-[10px] sm:text-xs font-extrabold transition-all shrink-0 ${
              aspectRatio === '16:9'
                ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 shadow-md'
                : 'bg-slate-950 text-slate-400 hover:text-white'
            }`}
          >
            <Monitor className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            <span>TV (16:9)</span>
          </button>

          <button
            onClick={() => onAspectRatioChange('1:1')}
            className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-xl text-[10px] sm:text-xs font-extrabold transition-all shrink-0 ${
              aspectRatio === '1:1'
                ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 shadow-md'
                : 'bg-slate-950 text-slate-400 hover:text-white'
            }`}
          >
            <Square className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            <span>Feed (1:1)</span>
          </button>

          <button
            onClick={() => onAspectRatioChange('21:9')}
            className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-xl text-[10px] sm:text-xs font-extrabold transition-all shrink-0 ${
              aspectRatio === '21:9'
                ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 shadow-md'
                : 'bg-slate-950 text-slate-400 hover:text-white'
            }`}
          >
            <Film className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            <span>Cinema (21:9)</span>
          </button>
        </div>
      </div>

      {/* THE PLAYER CONTAINER */}
      <div
        ref={containerRef}
        onMouseMove={handleMouseMove}
        className={`relative bg-slate-950 overflow-hidden flex flex-col items-center justify-center select-none transition-all duration-300 ${getContainerRatioStyle()}`}
      >
        {/* SMARTPHONE NOTCH */}
        {aspectRatio === '9:16' && (
          <div className="absolute top-2 left-1/2 -translate-x-1/2 z-40 w-24 h-4 bg-slate-900 rounded-full flex items-center justify-center gap-1.5 border border-slate-800">
            <div className="w-2 h-2 rounded-full bg-slate-950" />
            <div className="w-1.5 h-1.5 rounded-full bg-blue-900/60" />
          </div>
        )}

        {/* Hidden HTML5 Audio Element & Offscreen Preload Canvas */}
        <audio
          ref={audioRef}
          src={AUDIO_FILE_PATH}
          onTimeUpdate={(e) => onTimeUpdate(e.currentTarget.currentTime)}
          onLoadedMetadata={(e) => onDurationChange(e.currentTarget.duration)}
          onEnded={() => onPlayPause()}
        />
        <canvas ref={offscreenCanvasRef} className="hidden" aria-hidden="true" />

        {/* BACKGROUND MEDIA STACK FOR GUARANTEED VISIBILITY */}
        <div className="absolute inset-0 z-0 overflow-hidden bg-slate-950">
          {scenes.map((scene, idx) => {
            const isActive = idx === (activeSceneIndex !== -1 ? activeSceneIndex : 0);
            return (
              <div
                key={scene.id}
                className={`absolute inset-0 transition-opacity duration-500 ${
                  isActive ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
                }`}
              >
                {/* 1. PRIMARY LOCAL MP4 VIDEO ELEMENT (100% REAL MOTION) */}
                {scene.videoSrc ? (
                  <video
                    ref={(el) => {
                      videoRefs.current[idx] = el;
                    }}
                    src={scene.videoSrc}
                    autoPlay
                    loop
                    muted
                    playsInline
                    preload="auto"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <img
                    src={scene.imageSrc}
                    alt={scene.title}
                    referrerPolicy="no-referrer"
                    className={`w-full h-full object-cover transition-transform duration-700 ${getMotionVideoClass(
                      scene.transitionType
                    )}`}
                  />
                )}

                {/* Fallback gradient in case both fail */}
                <div
                  className={`w-full h-full bg-gradient-to-br ${scene.fallbackGradient} flex items-center justify-center -z-10`}
                >
                  <div className="text-center p-6 text-white/30 font-bold text-4xl font-heading">
                    {scene.ingredientFocus.toUpperCase()}
                  </div>
                </div>

                <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-slate-950/95 to-transparent" />
              </div>
            );
          })}
        </div>

        {/* CANVAS PARTICLES OVERLAY */}
        <BeatVisualizerCanvas
          analyserNode={analyserNode}
          isPlaying={isPlaying}
          particleTheme={currentScene.particleTheme}
          overlayEffect={activeOverlay}
          intensity={1.2}
        />

        {/* REEL ACTIONS SIDEBAR (Visible only in 9:16 Cellphone mode) */}
        {aspectRatio === '9:16' && (
          <div className="absolute right-3 bottom-24 z-30 flex flex-col items-center gap-4 text-white">
            <button
              onClick={() => setLiked(!liked)}
              className="flex flex-col items-center gap-0.5 group"
            >
              <div className={`p-2.5 rounded-full backdrop-blur-md transition-transform active:scale-125 ${
                liked ? 'bg-red-500 text-white' : 'bg-slate-950/70 text-white hover:bg-slate-900'
              }`}>
                <Heart className={`w-5 h-5 ${liked ? 'fill-current' : ''}`} />
              </div>
              <span className="text-[10px] font-bold shadow-sm">12.4k</span>
            </button>

            <div className="flex flex-col items-center gap-0.5">
              <div className="p-2.5 rounded-full bg-slate-950/70 backdrop-blur-md text-white">
                <MessageCircle className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold shadow-sm">842</span>
            </div>

            <div className="flex flex-col items-center gap-0.5">
              <div className="p-2.5 rounded-full bg-slate-950/70 backdrop-blur-md text-white">
                <Send className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold shadow-sm">Enviar</span>
            </div>

            <div className="w-8 h-8 rounded-full border-2 border-amber-500 bg-slate-900 flex items-center justify-center animate-spin">
              <Music2 className="w-4 h-4 text-amber-400" />
            </div>
          </div>
        )}

        {/* MARCA D'ÁGUA GUARAFOOD 2026 (FLOAT TRANSPARENTE DIRETO NA CENA - SEM NENHUM BOTÃO OU FUNDO BLOQUEANDO) */}
        <div className="absolute top-2.5 sm:top-4 right-2.5 sm:right-4 z-30 pointer-events-none flex items-center transition-transform hover:scale-105 filter drop-shadow-[0_4px_14px_rgba(0,0,0,0.95)]">
          <img
            src="/assets/aistudio/Logo_GuaraFood_2026_transparent.png"
            alt="Marca d'água GuaraFood 2026"
            className="h-9 sm:h-12 md:h-14 w-auto object-contain"
          />
        </div>

        {/* TV COMMERCIAL PARTNER SPOTLIGHT BADGE */}
        {activePartner && (
          <div className="absolute top-16 left-4 z-30 animate-in slide-in-from-left duration-300">
            <div className="flex items-center gap-3 px-3.5 py-2 rounded-xl bg-slate-950/90 border-l-4 border-amber-500 border-y border-r border-slate-800 shadow-2xl backdrop-blur-xl text-white max-w-[240px]">
              <span className="text-xl">{activePartner.icon}</span>
              <div className="truncate">
                <div className="text-[9px] font-extrabold uppercase text-amber-400">
                  PARCEIRO EM DESTAQUE
                </div>
                <div className="text-xs font-extrabold text-white font-heading truncate">
                  {activePartner.name}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* CLEAN EXTREME BOTTOM RODAPÉ SUBTITLES */}
        {showSubtitles && activeLyric && (
          <div className={`absolute inset-x-2 z-30 transition-all duration-300 flex justify-center pointer-events-none ${
            showControls || !isPlaying ? 'bottom-32 sm:bottom-36' : 'bottom-16 sm:bottom-20'
          }`}>
            <div className="px-4 py-1.5 rounded-lg bg-slate-950/95 backdrop-blur-md border border-amber-500/50 shadow-2xl text-center max-w-md">
              <div className="text-xs sm:text-base font-black text-amber-300 font-heading tracking-tight leading-tight">
                {activeLyric.text}
              </div>
            </div>
          </div>
        )}

        {/* TV BROADCAST RODAPÉ BANNER (GUARAFOOD.COM.BR - HIGHLY LEGIBLE & UNBLOCKED) */}
        <div className={`absolute left-0 right-0 z-40 transition-all duration-300 pointer-events-auto ${
          showControls || !isPlaying ? 'bottom-20 sm:bottom-22' : 'bottom-3'
        } flex items-center justify-center px-2`}>
          <a
            href="https://guarafood.com.br"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 sm:gap-2 px-3.5 sm:px-5 py-1.5 sm:py-2 rounded-2xl bg-slate-950/95 border-2 border-amber-500 shadow-[0_0_30px_rgba(245,158,11,0.6)] backdrop-blur-md hover:bg-amber-500 hover:text-slate-950 text-white transition-all group cursor-pointer"
          >
            <Globe className="w-4 sm:w-5 h-4 sm:h-5 text-amber-400 group-hover:text-slate-950 animate-pulse shrink-0" />
            <span className="text-[10px] sm:text-xs font-extrabold tracking-wide font-heading uppercase text-slate-200 group-hover:text-slate-950">
              PEÇA AGORA:
            </span>
            <span className="text-xs sm:text-lg font-black text-amber-400 group-hover:text-slate-950 tracking-wider font-heading underline decoration-amber-400 group-hover:decoration-slate-950 underline-offset-2">
              GUARAFOOD.COM.BR
            </span>
            <span className="hidden sm:inline text-[10px] font-extrabold text-slate-950 bg-amber-400 px-2 py-0.5 rounded shadow ml-1">
              Guaranésia - MG
            </span>
          </a>
        </div>

        {/* PLAYER HUD CONTROLS BAR */}
        <div
          className={`absolute inset-x-0 bottom-0 z-30 p-2.5 bg-slate-950/95 transition-opacity duration-300 ${
            showControls || !isPlaying ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        >
          {/* TIMELINE SCRUBBER */}
          <div className="relative mb-1.5 group">
            <input
              type="range"
              min={0}
              max={duration || 67}
              step={0.1}
              value={currentTime}
              onChange={(e) => onSeek(parseFloat(e.target.value))}
              className="w-full h-1.5 rounded-lg bg-slate-800 appearance-none cursor-pointer accent-amber-500 hover:h-2 transition-all"
            />
          </div>

          {/* BOTTOM HUD CONTROLS */}
          <div className="flex items-center justify-between gap-3 text-white">
            <div className="flex items-center gap-2">
              <button
                onClick={onPlayPause}
                className="p-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-bold transition-transform transform hover:scale-105 active:scale-95 shadow-md"
                title={isPlaying ? 'Pausar' : 'Reproduzir'}
              >
                {isPlaying ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current ml-0.5" />}
              </button>

              <button
                onClick={() => onSeek(0)}
                className="p-1 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800/80 transition-colors"
                title="Reiniciar"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>

              <div className="text-[10px] font-mono font-semibold text-slate-300 tracking-wider">
                <span className="text-amber-400">{formatTime(currentTime)}</span> / {formatTime(duration || 67)}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="hidden sm:flex items-center gap-1">
                <button
                  onClick={() => setIsMuted(!isMuted)}
                  className="p-1 text-slate-300 hover:text-amber-400 transition-colors"
                >
                  {isMuted || volume === 0 ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                </button>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={isMuted ? 0 : volume}
                  onChange={(e) => {
                    setVolume(parseFloat(e.target.value));
                    setIsMuted(false);
                  }}
                  className="w-12 h-1 rounded bg-slate-800 appearance-none cursor-pointer accent-amber-500"
                />
              </div>

              <button
                onClick={() => setShowSubtitles(!showSubtitles)}
                className="p-1 rounded-lg text-slate-300 hover:text-amber-400 hover:bg-slate-800/80 transition-colors"
                title={showSubtitles ? 'Ocultar Legendas' : 'Exibir Legendas'}
              >
                {showSubtitles ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5 text-slate-400" />}
              </button>

              <button
                onClick={toggleFullscreen}
                className="p-1 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800/80 transition-colors"
                title="Tela Cheia"
              >
                <Maximize className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ALWAYS-VISIBLE GUARAFOOD SITE LINK BANNER BELOW PLAYER */}
      <a
        href="https://guarafood.com.br"
        target="_blank"
        rel="noopener noreferrer"
        className="w-full max-w-xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 hover:from-amber-400 hover:via-orange-400 hover:to-amber-400 text-slate-950 p-3 sm:p-3.5 rounded-2xl shadow-[0_0_30px_rgba(245,158,11,0.4)] flex items-center justify-between gap-3 font-extrabold transition-all transform hover:scale-[1.01] active:scale-98 cursor-pointer border border-amber-400"
      >
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-slate-950 text-amber-400 shadow">
            <Globe className="w-5 h-5 animate-pulse" />
          </div>
          <div className="text-left">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-900 block leading-none">
              Site Oficial de Delivery · Guaranésia - MG
            </span>
            <span className="text-base sm:text-lg font-black tracking-wider font-heading underline decoration-slate-950 underline-offset-2 leading-tight">
              GUARAFOOD.COM.BR
            </span>
          </div>
        </div>

        <div className="px-3.5 py-1.5 rounded-xl bg-slate-950 text-amber-400 text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow shrink-0">
          <span>Peça Aqui</span>
          <span className="text-sm">➔</span>
        </div>
      </a>
    </div>
  );
};
