import React, { useState } from 'react';
import { Volume2, VolumeX, Plus, Play, Trash2, Sliders, Clock, Sparkles, Check, Flame, Wine, Coffee, Bell, Waves, Radio, Music } from 'lucide-react';
import { SoundEffectCue, SFXType } from '../types/clip';
import { SFX_DESCRIPTORS, playLiveSFX } from '../utils/soundEffectsEngine';

interface SoundEffectsStudioProps {
  cues: SoundEffectCue[];
  onUpdateCue: (updatedCue: SoundEffectCue) => void;
  onAddCue: (newCue: SoundEffectCue) => void;
  onDeleteCue: (id: string) => void;
  onSeek: (time: number) => void;
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  sfxMasterVolume: number;
  onMasterVolumeChange: (vol: number) => void;
  isSfxGloballyEnabled: boolean;
  onToggleGlobalSfx: () => void;
  subtitleOffset: number;
  onSubtitleOffsetChange: (offset: number) => void;
  sfxOffset: number;
  onSfxOffsetChange: (offset: number) => void;
}

export const SoundEffectsStudio: React.FC<SoundEffectsStudioProps> = ({
  cues,
  onUpdateCue,
  onAddCue,
  onDeleteCue,
  onSeek,
  currentTime,
  duration,
  isPlaying,
  sfxMasterVolume,
  onMasterVolumeChange,
  isSfxGloballyEnabled,
  onToggleGlobalSfx,
  subtitleOffset,
  onSubtitleOffsetChange,
  sfxOffset,
  onSfxOffsetChange,
}) => {
  const [filterCategory, setFilterCategory] = useState<'all' | 'cozinha' | 'ambiente' | 'bebidas' | 'sistema'>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [activePreviewType, setActivePreviewType] = useState<string | null>(null);

  // New cue form state
  const [newCueName, setNewCueName] = useState('');
  const [newCueType, setNewCueType] = useState<SFXType>('sizzle');
  const [newCueTimeMark, setNewCueTimeMark] = useState<number>(Math.round(currentTime * 10) / 10);
  const [newCueVolume, setNewCueVolume] = useState<number>(0.35);
  const [newCueDuration, setNewCueDuration] = useState<number>(2.5);

  const handlePreview = async (type: SFXType, volume: number = 0.35, dur: number = 2.5) => {
    setActivePreviewType(type);
    await playLiveSFX(type, null, volume * sfxMasterVolume, dur);
    setTimeout(() => {
      setActivePreviewType(null);
    }, dur * 1000);
  };

  const handleOpenAddModal = () => {
    setNewCueName('');
    setNewCueType('sizzle');
    setNewCueTimeMark(Math.round(currentTime * 10) / 10);
    setNewCueVolume(0.35);
    setNewCueDuration(2.5);
    setIsAddModalOpen(true);
  };

  const handleCreateCue = (e: React.FormEvent) => {
    e.preventDefault();
    const descriptor = SFX_DESCRIPTORS[newCueType];
    const newCue: SoundEffectCue = {
      id: `sfx-${Date.now()}`,
      name: newCueName.trim() || descriptor.label,
      type: newCueType,
      timeMark: Math.max(0, Math.min(duration || 67, newCueTimeMark)),
      duration: newCueDuration,
      volume: newCueVolume,
      icon: descriptor.icon,
      description: descriptor.description,
      enabled: true,
    };
    onAddCue(newCue);
    setIsAddModalOpen(false);
  };

  const filteredCues = cues.filter((cue) => {
    if (filterCategory === 'all') return true;
    const cat = SFX_DESCRIPTORS[cue.type]?.category;
    return cat === filterCategory;
  });

  const formatSec = (secs: number) => {
    const s = secs.toFixed(1);
    return `${s}s`;
  };

  return (
    <div className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 text-white space-y-6 shadow-xl">
      {/* HEADER SECTION */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/40">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </span>
            <h2 className="text-xl sm:text-2xl font-black font-heading tracking-tight text-white">
              Camada de Efeitos Sonoros Realistas (SFX)
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
            Sons de <strong className="text-amber-300">fritura na chapa</strong>, <strong className="text-amber-300">vidros tilintando em brindes</strong> e <strong className="text-amber-300">ambiente acolhedor de restaurante</strong> sintetizados em tempo real no áudio do vídeo.
          </p>
        </div>

        {/* MASTER SFX CONTROLS */}
        <div className="flex items-center gap-3 bg-slate-950 p-2.5 rounded-xl border border-slate-800 shrink-0">
          <button
            onClick={onToggleGlobalSfx}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              isSfxGloballyEnabled
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            {isSfxGloballyEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            <span>{isSfxGloballyEnabled ? 'SFX Ativo' : 'SFX Silenciado'}</span>
          </button>

          <div className="flex items-center gap-2 px-2">
            <span className="text-[11px] font-bold text-slate-400">Volume SFX:</span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={sfxMasterVolume}
              onChange={(e) => onMasterVolumeChange(parseFloat(e.target.value))}
              disabled={!isSfxGloballyEnabled}
              className="w-20 sm:w-28 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500 disabled:opacity-40"
            />
            <span className="text-xs font-mono font-bold text-amber-400 w-8">
              {Math.round(sfxMasterVolume * 100)}%
            </span>
          </div>

          <button
            onClick={handleOpenAddModal}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 text-xs font-black transition-all shadow-md active:scale-95 cursor-pointer ml-1"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Adicionar SFX</span>
          </button>
        </div>
      </div>

      {/* SYNC CORRECTION SYSTEM */}
      <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4 space-y-4">
        <div className="flex items-center gap-2 text-amber-400">
          <Clock className="w-4 h-4" />
          <h3 className="text-sm font-black uppercase tracking-wider font-heading">
            Ajuste Fino de Sincronia (Offset)
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Subtitle Offset */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-amber-500" />
                Sincronia das Legendas & Parceiros
              </label>
              <span className={`text-xs font-mono font-bold ${subtitleOffset === 0 ? 'text-slate-500' : 'text-amber-400'}`}>
                {subtitleOffset > 0 ? '+' : ''}{(subtitleOffset * 1000).toFixed(0)}ms
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-bold text-slate-500 uppercase">Adiantar</span>
              <input
                type="range"
                min="-1"
                max="1"
                step="0.05"
                value={subtitleOffset}
                onChange={(e) => onSubtitleOffsetChange(parseFloat(e.target.value))}
                className="flex-1 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
              />
              <span className="text-[10px] font-bold text-slate-500 uppercase">Atrasar</span>
            </div>
            <p className="text-[10px] text-slate-400 leading-tight">
              Ajuste se as legendas aparecem antes ou depois do áudio. (Ex: -200ms para aparecer mais cedo).
            </p>
          </div>

          {/* SFX Offset */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Volume2 className="w-3.5 h-3.5 text-amber-500" />
                Sincronia dos Efeitos Sonoros (SFX)
              </label>
              <span className={`text-xs font-mono font-bold ${sfxOffset === 0 ? 'text-slate-500' : 'text-amber-400'}`}>
                {sfxOffset > 0 ? '+' : ''}{(sfxOffset * 1000).toFixed(0)}ms
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-bold text-slate-500 uppercase">Adiantar</span>
              <input
                type="range"
                min="-1"
                max="1"
                step="0.05"
                value={sfxOffset}
                onChange={(e) => onSfxOffsetChange(parseFloat(e.target.value))}
                className="flex-1 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
              />
              <span className="text-[10px] font-bold text-slate-500 uppercase">Atrasar</span>
            </div>
            <p className="text-[10px] text-slate-400 leading-tight">
              Ajuste o disparo de todos os sons (fritura, brindes, etc) para casar com a batida ou cena.
            </p>
          </div>
        </div>
      </div>

      {/* TIMELINE VISUAL STRIP */}
      <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
        <div className="flex items-center justify-between text-xs text-slate-400 font-semibold">
          <span className="flex items-center gap-1.5 text-slate-300">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            Timeline de Disparos de Efeitos Sonoros ({cues.length} marcadores)
          </span>
          <span className="font-mono text-amber-400">
            Tempo Atual: {currentTime.toFixed(1)}s / {(duration || 67).toFixed(1)}s
          </span>
        </div>

        {/* Timeline Bar with Markers */}
        <div
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const ratio = (e.clientX - rect.left) / rect.width;
            onSeek(ratio * (duration || 67));
          }}
          className="relative w-full h-8 bg-slate-900 border border-slate-700/80 rounded-lg cursor-pointer overflow-hidden group"
          title="Clique na timeline para navegar"
        >
          {/* Active playhead */}
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-amber-400 z-20 shadow-[0_0_10px_#f59e0b] pointer-events-none"
            style={{ left: `${Math.min(100, (currentTime / (duration || 67)) * 100)}%` }}
          />

          {/* Cue markers on timeline */}
          {cues.map((cue) => {
            const leftPercent = (cue.timeMark / (duration || 67)) * 100;
            const isFiring = Math.abs(currentTime - cue.timeMark) < 1.0;
            return (
              <div
                key={cue.id}
                style={{ left: `${Math.min(98, Math.max(1, leftPercent))}%` }}
                onClick={(e) => {
                  e.stopPropagation();
                  onSeek(cue.timeMark);
                }}
                className={`absolute top-1 bottom-1 w-6 -ml-3 rounded flex items-center justify-center text-xs transition-transform hover:scale-125 z-10 ${
                  isFiring
                    ? 'bg-amber-400 text-slate-950 scale-125 shadow-[0_0_12px_#f59e0b] animate-bounce'
                    : cue.enabled
                    ? 'bg-slate-800/90 hover:bg-amber-500 text-white hover:text-slate-950 border border-amber-500/40'
                    : 'bg-slate-800/40 text-slate-500'
                }`}
                title={`${cue.name} (${cue.timeMark.toFixed(1)}s) - Clique para ir`}
              >
                <span>{cue.icon}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* CATEGORY FILTER BUTTONS */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-bold text-slate-400">Filtrar:</span>
        {[
          { key: 'all', label: 'Todos os Efeitos', icon: Sparkles },
          { key: 'cozinha', label: 'Cozinha & Fritura', icon: Flame },
          { key: 'ambiente', label: 'Ambiente & Brinde', icon: Wine },
          { key: 'bebidas', label: 'Bebidas & Gás', icon: Coffee },
          { key: 'sistema', label: 'Sinos & Notificações', icon: Bell },
        ].map((cat) => {
          const Icon = cat.icon;
          return (
            <button
              key={cat.key}
              onClick={() => setFilterCategory(cat.key as any)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                filterCategory === cat.key
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>

      {/* CUES CARDS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {filteredCues.map((cue) => {
          const descriptor = SFX_DESCRIPTORS[cue.type] || SFX_DESCRIPTORS.sizzle;
          const isFiring = Math.abs(currentTime - cue.timeMark) < 1.0;
          const isPreviewing = activePreviewType === cue.type;

          return (
            <div
              key={cue.id}
              className={`p-4 rounded-xl border transition-all ${
                isFiring
                  ? 'bg-amber-500/10 border-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.25)]'
                  : cue.enabled
                  ? 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
                  : 'bg-slate-950/40 border-slate-800/50 opacity-60'
              }`}
            >
              {/* TOP ROW: ICON, NAME, BADGE */}
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-2xl p-1.5 rounded-lg bg-slate-900 border border-slate-800 shadow">
                    {cue.icon}
                  </span>
                  <div>
                    <h4 className="text-sm font-extrabold text-white font-heading leading-tight">
                      {cue.name}
                    </h4>
                    <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wide">
                      {descriptor.label}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <span className="px-2 py-0.5 rounded-md bg-slate-900 border border-slate-800 font-mono text-xs font-bold text-amber-400">
                    {formatSec(cue.timeMark)}
                  </span>
                </div>
              </div>

              {/* DESCRIPTION */}
              <p className="text-xs text-slate-400 mb-3 line-clamp-2">
                {cue.description}
              </p>

              {/* CONTROLS ROW */}
              <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-800/80">
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handlePreview(cue.type, cue.volume, cue.duration)}
                    className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      isPreviewing
                        ? 'bg-amber-400 text-slate-950 animate-pulse'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                    }`}
                    title="Ouvir som deste efeito agora"
                  >
                    <Play className="w-3 h-3 fill-current" />
                    <span>Ouvir</span>
                  </button>

                  <button
                    onClick={() => onSeek(cue.timeMark)}
                    className="flex items-center gap-1 px-2 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                    title="Ir para o momento deste efeito no vídeo"
                  >
                    <Clock className="w-3 h-3 text-amber-400" />
                    <span>Ir</span>
                  </button>
                </div>

                {/* INDIVIDUAL VOLUME & ENABLE TOGGLE */}
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    <Volume2 className="w-3 h-3 text-slate-400" />
                    <input
                      type="range"
                      min="0.1"
                      max="1.0"
                      step="0.05"
                      value={cue.volume}
                      onChange={(e) =>
                        onUpdateCue({ ...cue, volume: parseFloat(e.target.value) })
                      }
                      className="w-14 h-1 bg-slate-800 rounded appearance-none cursor-pointer accent-amber-500"
                      title={`Volume: ${Math.round(cue.volume * 100)}%`}
                    />
                  </div>

                  <button
                    onClick={() => onUpdateCue({ ...cue, enabled: !cue.enabled })}
                    className={`p-1.5 rounded-lg text-xs font-bold transition-colors ${
                      cue.enabled
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                        : 'bg-slate-800 text-slate-500'
                    }`}
                    title={cue.enabled ? 'Ativado' : 'Desativado'}
                  >
                    <Check className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => onDeleteCue(cue.id)}
                    className="p-1.5 rounded-lg bg-slate-900 hover:bg-red-950 text-slate-500 hover:text-red-400 transition-colors"
                    title="Excluir este efeito sonoro"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* MODAL TO ADD NEW SFX CUE */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-lg shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
                  <Plus className="w-5 h-5" />
                </span>
                <h3 className="text-lg font-black font-heading text-white">
                  Novo Efeito Sonoro na Timeline
                </h3>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateCue} className="space-y-4">
              {/* SFX TYPE SELECT */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Tipo de Som Realista
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {(Object.keys(SFX_DESCRIPTORS) as SFXType[]).map((typeKey) => {
                    const desc = SFX_DESCRIPTORS[typeKey];
                    const isSelected = newCueType === typeKey;
                    return (
                      <button
                        type="button"
                        key={typeKey}
                        onClick={() => {
                          setNewCueType(typeKey);
                          if (!newCueName) setNewCueName(desc.label);
                          handlePreview(typeKey, newCueVolume, 2.0);
                        }}
                        className={`p-2.5 rounded-xl border text-left flex flex-col items-start gap-1 transition-all ${
                          isSelected
                            ? 'bg-amber-500 text-slate-950 border-amber-400 font-black shadow-md'
                            : 'bg-slate-950 hover:bg-slate-800 text-slate-300 border-slate-800'
                        }`}
                      >
                        <span className="text-xl">{desc.icon}</span>
                        <span className="text-xs leading-tight">{desc.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* NAME */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Nome do Marcador
                </label>
                <input
                  type="text"
                  value={newCueName}
                  onChange={(e) => setNewCueName(e.target.value)}
                  placeholder="Ex: Fritura do Pastel Gigante"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-amber-500"
                  required
                />
              </div>

              {/* TIMESTAMPS */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-slate-300">
                      Segundo no Vídeo
                    </label>
                    <button
                      type="button"
                      onClick={() => setNewCueTimeMark(Math.round(currentTime * 10) / 10)}
                      className="text-[10px] text-amber-400 font-bold hover:underline"
                    >
                      Usar atual ({currentTime.toFixed(1)}s)
                    </button>
                  </div>
                  <input
                    type="number"
                    min="0"
                    max={duration || 67}
                    step="0.1"
                    value={newCueTimeMark}
                    onChange={(e) => setNewCueTimeMark(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-amber-500 font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Duração do Som (s)
                  </label>
                  <input
                    type="number"
                    min="1.0"
                    max="6.0"
                    step="0.5"
                    value={newCueDuration}
                    onChange={(e) => setNewCueDuration(parseFloat(e.target.value) || 2.0)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-amber-500 font-mono"
                    required
                  />
                </div>
              </div>

              {/* VOLUME */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-300">Volume</label>
                  <span className="text-xs font-mono text-amber-400 font-bold">
                    {Math.round(newCueVolume * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="1.0"
                  step="0.05"
                  value={newCueVolume}
                  onChange={(e) => setNewCueVolume(parseFloat(e.target.value))}
                  className="w-full h-2 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-amber-500"
                />
              </div>

              {/* PREVIEW & SUBMIT */}
              <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => handlePreview(newCueType, newCueVolume, newCueDuration)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold"
                >
                  <Play className="w-3.5 h-3.5 fill-current text-amber-400" />
                  <span>Testar Prévia do Som</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 text-xs font-black shadow-lg"
                  >
                    Salvar na Timeline
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
