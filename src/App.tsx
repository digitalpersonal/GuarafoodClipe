/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { VideoScene, AspectRatioMode, PartnerRestaurant, LyricLine, AudioTrack, SoundEffectCue } from './types/clip';
import { INITIAL_VIDEO_SCENES, SONG_LYRICS, PARTNER_RESTAURANTS, PRESET_AUDIO_TRACKS, DEFAULT_SFX_CUES } from './data/songData';
import { VideoPlayer } from './components/VideoPlayer';
import { DirectorStudio } from './components/DirectorStudio';
import { LyricsKaraokePanel } from './components/LyricsKaraokePanel';
import { PartnerSpotlight } from './components/PartnerSpotlight';
import { AudioLyricsImporter } from './components/AudioLyricsImporter';
import { SoundEffectsStudio } from './components/SoundEffectsStudio';
import { ShareExportModal } from './components/ShareExportModal';
import { TopBar } from './components/TopBar';
import { playLiveSFX } from './utils/soundEffectsEngine';
import { Play, Pause, Flame, Sparkles, Utensils, Award, Clock, Heart, Volume2, Music, Video } from 'lucide-react';

export default function App() {
  const [scenes, setScenes] = useState<VideoScene[]>(INITIAL_VIDEO_SCENES);
  const [partners, setPartners] = useState<PartnerRestaurant[]>(PARTNER_RESTAURANTS);
  const [lyrics, setLyrics] = useState<LyricLine[]>(SONG_LYRICS);
  const [currentTrack, setCurrentTrack] = useState<AudioTrack>(PRESET_AUDIO_TRACKS[0]);
  const [sfxCues, setSfxCues] = useState<SoundEffectCue[]>(DEFAULT_SFX_CUES);
  const [sfxMasterVolume, setSfxMasterVolume] = useState<number>(0.35);
  const [isSfxGloballyEnabled, setIsSfxGloballyEnabled] = useState<boolean>(true);

  const [activeSceneIndex, setActiveSceneIndex] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(67);
  const [isPlaying, setIsPlaying] = useState(false);
  const [aspectRatio, setAspectRatio] = useState<AspectRatioMode>('16:9');
  const [activeTab, setActiveTab] = useState<'player' | 'studio' | 'lyrics' | 'audio' | 'partners' | 'sfx'>('player');
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  // Sync Correction Offsets (in seconds, e.g., 0.2 = 200ms)
  const [subtitleOffset, setSubtitleOffset] = useState<number>(0);
  const [sfxOffset, setSfxOffset] = useState<number>(0);

  const triggeredCuesRef = useRef<Set<string>>(new Set());
  const prevTimeRef = useRef<number>(0);

  // Audio Context & Analyser Node for Web Audio spectrum
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);

  const initWebAudio = () => {
    if (!audioRef.current || audioCtxRef.current) return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioCtx();
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 128;

      const source = ctx.createMediaElementSource(audioRef.current);
      source.connect(analyser);
      analyser.connect(ctx.destination);

      audioCtxRef.current = ctx;
      analyserRef.current = analyser;
      sourceRef.current = source;
    } catch {
      // AudioContext fallback
    }
  };

  const handlePlayPause = () => {
    if (!audioRef.current) return;

    initWebAudio();
    if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
    }
  };

  const handleTimeUpdate = (time: number) => {
    setCurrentTime(time);

    // If user scrubbed backward or looped, reset triggered cues
    if (time < prevTimeRef.current - 0.5) {
      triggeredCuesRef.current.clear();
    }
    prevTimeRef.current = time;

    if (!isSfxGloballyEnabled || !isPlaying) return;

    // Check cues to fire at current second (adjusted by sfxOffset)
    for (const cue of sfxCues) {
      if (!cue.enabled) continue;
      const triggerTime = cue.timeMark + sfxOffset;
      if (time >= triggerTime && time <= triggerTime + 0.35) {
        if (!triggeredCuesRef.current.has(cue.id)) {
          triggeredCuesRef.current.add(cue.id);
          playLiveSFX(cue.type, audioCtxRef.current, cue.volume * sfxMasterVolume, cue.duration);
        }
      }
    }
  };

  const handleSeek = (time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
      // Remove cues that occur at or after seek time so they can fire again
      triggeredCuesRef.current = new Set(
        Array.from(triggeredCuesRef.current).filter((id) => {
          const c = sfxCues.find((x) => x.id === id);
          return c ? (c.timeMark + sfxOffset) < time : false;
        })
      );
    }
  };

  const handleUpdateSfxCue = (updated: SoundEffectCue) => {
    setSfxCues((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
  };

  const handleAddSfxCue = (newCue: SoundEffectCue) => {
    setSfxCues((prev) => [...prev, newCue].sort((a, b) => a.timeMark - b.timeMark));
  };

  const handleDeleteSfxCue = (id: string) => {
    setSfxCues((prev) => prev.filter((c) => c.id !== id));
  };

  const handleUpdateLyric = (updatedLyric: LyricLine) => {
    setLyrics((prev) => prev.map((l) => (l.id === updatedLyric.id ? updatedLyric : l)));
  };

  const handleAddLyric = (newLyric: LyricLine) => {
    setLyrics((prev) => [...prev, newLyric].sort((a, b) => a.startTime - b.startTime));
  };

  const handleDeleteLyric = (lyricId: string) => {
    setLyrics((prev) => prev.filter((l) => l.id !== lyricId));
  };

  const handleUpdateScene = (index: number, updatedScene: VideoScene) => {
    const nextScenes = [...scenes];
    nextScenes[index] = updatedScene;
    setScenes(nextScenes);
  };

  const handleSelectScene = (index: number) => {
    setActiveSceneIndex(index);
    if (scenes[index]) {
      handleSeek(scenes[index].startTime);
    }
  };

  const handleAddPartner = (newPartner: PartnerRestaurant) => {
    setPartners((prev) => [...prev, newPartner]);
  };

  const handleUpdatePartner = (updatedPartner: PartnerRestaurant) => {
    setPartners((prev) => prev.map((p) => (p.id === updatedPartner.id ? updatedPartner : p)));
  };

  const handleDeletePartner = (partnerId: string) => {
    setPartners((prev) => prev.filter((p) => p.id !== partnerId));
  };

  const handleSelectTrack = (track: AudioTrack) => {
    setCurrentTrack(track);
    setIsPlaying(false);
    setCurrentTime(0);
    if (audioRef.current) {
      audioRef.current.src = track.audioUrl;
      audioRef.current.currentTime = 0;
      audioRef.current.load();
    }
    if (track.duration) {
      setDuration(track.duration);
    }
  };

  // Keep activeSceneIndex synced with currentTime
  useEffect(() => {
    const idx = scenes.findIndex(
      (scene) => currentTime >= scene.startTime && currentTime <= scene.endTime
    );
    if (idx !== -1 && idx !== activeSceneIndex) {
      setActiveSceneIndex(idx);
    }
  }, [currentTime, scenes, activeSceneIndex]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-amber-500 selection:text-slate-950">
      {/* TOP BAR */}
      <TopBar
        onPlayPause={handlePlayPause}
        isPlaying={isPlaying}
        onOpenShareModal={() => setIsShareModalOpen(true)}
        activeTab={activeTab as any}
        setActiveTab={setActiveTab as any}
      />

      {/* MAIN CONTAINER */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 space-y-8">
        {/* HERO TITLE BANNER */}
        <div className="text-center space-y-3 max-w-3xl mx-auto pt-2">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold uppercase tracking-wider">
            <Flame className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
            <span>Propaganda Oficial de TV · Comercial 4K GuaraFood</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight font-heading">
            GuaraFood — O Comercial de TV da Nossa Cidade!
          </h1>

          <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-2xl mx-auto">
            Propaganda profissional estilo TV com pessoas reais saboreando pratos suculentos, entregadores em ação, pizzaiolos no forno a lenha e os melhores restaurantes parceiros de Guaranésia.
          </p>
        </div>

        {/* PRIMARY VIEWPORT & CONTROL GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* LEFT/TOP COLUMN: THE VIDEO CLIP PLAYER */}
          <div className="lg:col-span-7 flex flex-col items-center justify-center gap-4">
            <VideoPlayer
              scenes={scenes}
              lyrics={lyrics}
              currentTime={currentTime}
              duration={duration}
              isPlaying={isPlaying}
              onTimeUpdate={handleTimeUpdate}
              onDurationChange={setDuration}
              onPlayPause={handlePlayPause}
              onSeek={handleSeek}
              aspectRatio={aspectRatio}
              onAspectRatioChange={setAspectRatio}
              audioRef={audioRef}
              analyserNode={analyserRef.current}
              partners={partners}
              onOpenExportModal={() => setIsShareModalOpen(true)}
              subtitleOffset={subtitleOffset}
            />

            {/* SCENE QUICK JUMP STRIP */}
            <div className="w-full bg-slate-900/60 border border-slate-800 rounded-2xl p-3 flex items-center justify-between gap-2 overflow-x-auto">
              <span className="text-xs font-bold text-amber-400 shrink-0 px-2 font-heading">
                Cenas de TV:
              </span>
              <div className="flex items-center gap-1.5 overflow-x-auto py-1">
                {scenes.map((scene, idx) => (
                  <button
                    key={scene.id}
                    onClick={() => handleSelectScene(idx)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                      idx === activeSceneIndex
                        ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                        : 'bg-slate-950 text-slate-400 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    <Video className={`w-3 h-3 ${idx === activeSceneIndex ? 'text-slate-950' : 'text-amber-400'}`} />
                    <span>{idx + 1}. {scene.ingredientFocus}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: LYRICS KARAOKE & DIRECTOR STUDIO PANEL */}
          <div className="lg:col-span-5 space-y-6">
            {/* INTERACTIVE NAVIGATION TABS */}
            <div className="flex items-center gap-1 p-1 bg-slate-900 rounded-xl border border-slate-800 overflow-x-auto max-w-full">
              <button
                onClick={() => setActiveTab('lyrics')}
                className={`flex-1 min-w-[60px] px-2 py-1.5 sm:py-2 text-[11px] sm:text-xs font-bold rounded-lg transition-all shrink-0 whitespace-nowrap ${
                  activeTab === 'lyrics' || activeTab === 'player'
                    ? 'bg-amber-500 text-slate-950 shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Karaokê
              </button>

              <button
                onClick={() => setActiveTab('audio')}
                className={`flex-1 min-w-[75px] px-2 py-1.5 sm:py-2 text-[11px] sm:text-xs font-bold rounded-lg transition-all shrink-0 whitespace-nowrap ${
                  activeTab === 'audio'
                    ? 'bg-amber-500 text-slate-950 shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Biblioteca & Músicas
              </button>

              <button
                onClick={() => setActiveTab('sfx')}
                className={`flex-1 min-w-[75px] px-2 py-1.5 sm:py-2 text-[11px] sm:text-xs font-bold rounded-lg transition-all shrink-0 whitespace-nowrap flex items-center justify-center gap-1 ${
                  activeTab === 'sfx'
                    ? 'bg-amber-500 text-slate-950 shadow-md font-extrabold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <span>Efeitos SFX</span>
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              </button>

              <button
                onClick={() => setActiveTab('studio')}
                className={`flex-1 min-w-[65px] px-2 py-1.5 sm:py-2 text-[11px] sm:text-xs font-bold rounded-lg transition-all shrink-0 whitespace-nowrap ${
                  activeTab === 'studio'
                    ? 'bg-amber-500 text-slate-950 shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Estúdio
              </button>

              <button
                onClick={() => setActiveTab('partners')}
                className={`flex-1 min-w-[75px] px-2 py-1.5 sm:py-2 text-[11px] sm:text-xs font-bold rounded-lg transition-all shrink-0 whitespace-nowrap ${
                  activeTab === 'partners'
                    ? 'bg-amber-500 text-slate-950 shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Parceiros ({partners.length})
              </button>
            </div>

            {/* TAB CONTENTS */}
            {(activeTab === 'lyrics' || activeTab === 'player') && (
              <LyricsKaraokePanel
                lyrics={lyrics}
                currentTime={currentTime}
                onSeek={handleSeek}
                isPlaying={isPlaying}
                onUpdateLyric={handleUpdateLyric}
                onAddLyric={handleAddLyric}
                onDeleteLyric={handleDeleteLyric}
              />
            )}

            {activeTab === 'sfx' && (
              <SoundEffectsStudio
                cues={sfxCues}
                onUpdateCue={handleUpdateSfxCue}
                onAddCue={handleAddSfxCue}
                onDeleteCue={handleDeleteSfxCue}
                onSeek={handleSeek}
                currentTime={currentTime}
                duration={duration}
                isPlaying={isPlaying}
                sfxMasterVolume={sfxMasterVolume}
                onMasterVolumeChange={setSfxMasterVolume}
                isSfxGloballyEnabled={isSfxGloballyEnabled}
                onToggleGlobalSfx={() => setIsSfxGloballyEnabled(!isSfxGloballyEnabled)}
                subtitleOffset={subtitleOffset}
                onSubtitleOffsetChange={setSubtitleOffset}
                sfxOffset={sfxOffset}
                onSfxOffsetChange={setSfxOffset}
              />
            )}

            {activeTab === 'audio' && (
              <AudioLyricsImporter
                currentTrack={currentTrack}
                onSelectTrack={handleSelectTrack}
                lyrics={lyrics}
                onUpdateLyrics={setLyrics}
                duration={duration}
                onOpenExportModal={() => setIsShareModalOpen(true)}
              />
            )}

            {activeTab === 'studio' && (
              <DirectorStudio
                scenes={scenes}
                activeSceneIndex={activeSceneIndex}
                onUpdateScene={handleUpdateScene}
                onSelectScene={handleSelectScene}
                currentTime={currentTime}
                lyrics={lyrics}
                onUpdateLyric={handleUpdateLyric}
                onAddLyric={handleAddLyric}
              />
            )}

            {activeTab === 'partners' && (
              <PartnerSpotlight
                currentTime={currentTime}
                onSeek={handleSeek}
                partners={partners}
                onAddPartner={handleAddPartner}
                onUpdatePartner={handleUpdatePartner}
                onDeletePartner={handleDeletePartner}
              />
            )}
          </div>
        </div>

        {/* FEATURED PARTNERS SPOTLIGHT SECTION BELOW THE FOLD */}
        <section className="pt-4">
          <PartnerSpotlight
            currentTime={currentTime}
            onSeek={handleSeek}
            partners={partners}
            onAddPartner={handleAddPartner}
            onUpdatePartner={handleUpdatePartner}
            onDeletePartner={handleDeletePartner}
          />
        </section>

        {/* PROOF & STATS STRIP */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-slate-800/80">
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 text-center">
            <div className="text-2xl sm:text-3xl font-black text-amber-400 font-heading">{partners.length}+</div>
            <div className="text-xs text-slate-400 mt-1">Restaurantes Parceiros</div>
          </div>
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 text-center">
            <div className="text-2xl sm:text-3xl font-black text-amber-400 font-heading">100%</div>
            <div className="text-xs text-slate-400 mt-1">Ingredientes Frescos</div>
          </div>
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 text-center">
            <div className="text-2xl sm:text-3xl font-black text-amber-400 font-heading">4K</div>
            <div className="text-xs text-slate-400 mt-1">Imagens em Movimento</div>
          </div>
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 text-center">
            <div className="text-2xl sm:text-3xl font-black text-amber-400 font-heading">9:16 & 16:9</div>
            <div className="text-xs text-slate-400 mt-1">Pronto para Reels & TV</div>
          </div>
        </div>
      </main>

      {/* QUIET FOOTER */}
      <footer className="border-t border-slate-900 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>GuaraFood © 2026 · Da nossa cidade para você</div>
          <div className="flex items-center gap-4 text-slate-400">
            <span>Guaranésia - MG</span>
            <span>·</span>
            <span>Propaganda Comercial Oficial</span>
          </div>
        </div>
      </footer>

      {/* SHARE / EXPORT & VIDEO RENDER MODAL */}
      <ShareExportModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        aspectRatio={aspectRatio}
        onAspectRatioChange={setAspectRatio}
        scenes={scenes}
        lyrics={lyrics}
        partners={partners}
        audioUrl={currentTrack.audioUrl}
        duration={duration}
        sfxCues={sfxCues}
        sfxMasterVolume={sfxMasterVolume}
        isSfxGloballyEnabled={isSfxGloballyEnabled}
        subtitleOffset={subtitleOffset}
        sfxOffset={sfxOffset}
      />
    </div>
  );
}
