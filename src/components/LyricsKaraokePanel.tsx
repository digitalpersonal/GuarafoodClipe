import React, { useState } from 'react';
import { LyricLine } from '../types/clip';
import { Music, Search, Play, Sparkles, Pencil, Check, X, Plus, Trash2 } from 'lucide-react';

interface LyricsKaraokePanelProps {
  lyrics: LyricLine[];
  currentTime: number;
  onSeek: (time: number) => void;
  isPlaying: boolean;
  onUpdateLyric?: (updatedLyric: LyricLine) => void;
  onDeleteLyric?: (id: string) => void;
  onAddLyric?: (newLyric: LyricLine) => void;
}

export const LyricsKaraokePanel: React.FC<LyricsKaraokePanelProps> = ({
  lyrics,
  currentTime,
  onSeek,
  isPlaying,
  onUpdateLyric,
  onDeleteLyric,
  onAddLyric,
}) => {
  const [filterQuery, setFilterQuery] = useState('');
  const [editingLyricId, setEditingLyricId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [editStartTime, setEditStartTime] = useState<number>(0);
  const [editEndTime, setEditEndTime] = useState<number>(0);
  const [isAddingNew, setIsAddingNew] = useState(false);

  // New lyric form state
  const [newText, setNewText] = useState('');
  const [newStartTime, setNewStartTime] = useState<number>(Math.round(currentTime * 10) / 10);
  const [newEndTime, setNewEndTime] = useState<number>(Math.round((currentTime + 3) * 10) / 10);
  const [newSection, setNewSection] = useState<LyricLine['section']>('verse');

  const filteredLyrics = lyrics.filter((l) =>
    l.text.toLowerCase().includes(filterQuery.toLowerCase())
  );

  const handleStartEdit = (lyric: LyricLine, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingLyricId(lyric.id);
    setEditText(lyric.text);
    setEditStartTime(lyric.startTime);
    setEditEndTime(lyric.endTime);
  };

  const handleSaveEdit = (lyric: LyricLine, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!editText.trim()) return;
    onUpdateLyric?.({
      ...lyric,
      text: editText.trim(),
      startTime: editStartTime,
      endTime: editEndTime,
    });
    setEditingLyricId(null);
  };

  const handleCancelEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingLyricId(null);
  };

  const handleCreateNewLyric = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newText.trim() || !onAddLyric) return;

    const newLyric: LyricLine = {
      id: `lyric-${Date.now()}`,
      text: newText.trim(),
      startTime: Math.max(0, newStartTime),
      endTime: Math.max(newStartTime + 0.5, newEndTime),
      section: newSection,
    };

    onAddLyric(newLyric);
    setNewText('');
    setIsAddingNew(false);
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl backdrop-blur-md flex flex-col h-full max-h-[580px]">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3 mb-3">
        <div className="flex items-center gap-2">
          <Music className="w-5 h-5 text-amber-500 animate-bounce shrink-0" />
          <div>
            <h2 className="text-base sm:text-lg font-bold text-white tracking-wide font-heading">
              Legendas & Letra (Karaokê)
            </h2>
            <p className="text-[11px] text-slate-400">
              Edite o texto de qualquer cena para alterar a legenda exibida no vídeo
            </p>
          </div>
        </div>

        {/* SEARCH & ADD BUTTONS */}
        <div className="flex items-center gap-2">
          <div className="relative w-36 sm:w-44">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Buscar legenda..."
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-full pl-8 pr-3 py-1 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />
          </div>

          {onAddLyric && (
            <button
              onClick={() => {
                setNewStartTime(Math.round(currentTime * 10) / 10);
                setNewEndTime(Math.round((currentTime + 3) * 10) / 10);
                setIsAddingNew(!isAddingNew);
              }}
              className="p-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold transition-all shadow shrink-0"
              title="Adicionar nova linha de legenda"
            >
              <Plus className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* FORM TO ADD NEW LYRIC */}
      {isAddingNew && (
        <form
          onSubmit={handleCreateNewLyric}
          className="bg-slate-950 border border-amber-500/40 rounded-xl p-3 mb-3 space-y-2 animate-in fade-in"
        >
          <div className="flex items-center justify-between text-xs font-bold text-amber-400">
            <span>Nova Legenda no Vídeo</span>
            <button
              type="button"
              onClick={() => setIsAddingNew(false)}
              className="text-slate-400 hover:text-white"
            >
              ✕
            </button>
          </div>

          <input
            type="text"
            value={newText}
            onChange={(e) => setNewText(e.target.value)}
            placeholder="Digite o texto da legenda (ex: Lápettit Pizzaria 🍕)..."
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
            required
            autoFocus
          />

          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-[10px] text-slate-400">Início (s)</label>
              <input
                type="number"
                step="0.1"
                min="0"
                value={newStartTime}
                onChange={(e) => setNewStartTime(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white font-mono"
              />
            </div>

            <div>
              <label className="block text-[10px] text-slate-400">Fim (s)</label>
              <input
                type="number"
                step="0.1"
                min="0.1"
                value={newEndTime}
                onChange={(e) => setNewEndTime(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white font-mono"
              />
            </div>

            <div>
              <label className="block text-[10px] text-slate-400">Seção</label>
              <select
                value={newSection}
                onChange={(e) => setNewSection(e.target.value as any)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white"
              >
                <option value="intro">Intro</option>
                <option value="verse">Verso</option>
                <option value="chorus">Refrão</option>
                <option value="partners">Parceiros</option>
                <option value="outro">Final</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setIsAddingNew(false)}
              className="px-3 py-1 rounded-lg bg-slate-800 text-slate-300 text-xs font-semibold"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-3 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black"
            >
              Salvar Legenda
            </button>
          </div>
        </form>
      )}

      {/* LYRICS SCROLL LIST */}
      <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
        {filteredLyrics.map((lyric) => {
          const isActive = currentTime >= lyric.startTime && currentTime <= lyric.endTime;
          const isPassed = currentTime > lyric.endTime;
          const isEditing = editingLyricId === lyric.id;

          return (
            <div
              key={lyric.id}
              onClick={() => !isEditing && onSeek(lyric.startTime)}
              className={`group flex items-start gap-2.5 p-3 rounded-xl transition-all border ${
                isEditing
                  ? 'bg-slate-950 border-amber-500 shadow-xl'
                  : isActive
                  ? 'bg-gradient-to-r from-amber-500/20 via-orange-500/10 to-transparent border-amber-500/80 shadow-lg scale-[1.01] cursor-pointer'
                  : isPassed
                  ? 'bg-slate-950/40 border-slate-800/60 text-slate-400 hover:border-slate-700 cursor-pointer'
                  : 'bg-slate-950/60 border-slate-800/80 text-slate-200 hover:border-slate-700 cursor-pointer'
              }`}
            >
              {/* TIMESTAMP BADGE */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onSeek(lyric.startTime);
                }}
                className={`shrink-0 flex items-center gap-1 font-mono text-[11px] px-2 py-1 rounded-md transition-colors ${
                  isActive
                    ? 'bg-amber-500 text-slate-950 font-bold'
                    : 'bg-slate-900 text-slate-400 group-hover:text-white group-hover:bg-amber-500/20'
                }`}
                title="Pular para este momento no vídeo"
              >
                <Play className="w-2.5 h-2.5 fill-current" />
                <span>{lyric.startTime.toFixed(1)}s</span>
              </button>

              {/* CONTENT OR INLINE EDIT FORM */}
              <div className="flex-1 min-w-0">
                {isEditing ? (
                  <div className="space-y-2" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="text"
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      className="w-full bg-slate-900 border border-amber-500 rounded-lg px-2.5 py-1.5 text-xs sm:text-sm text-white focus:outline-none"
                      autoFocus
                    />

                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono">
                        <span>De:</span>
                        <input
                          type="number"
                          step="0.1"
                          value={editStartTime}
                          onChange={(e) => setEditStartTime(parseFloat(e.target.value) || 0)}
                          className="w-14 bg-slate-900 border border-slate-700 rounded px-1 py-0.5 text-white"
                        />
                        <span>Até:</span>
                        <input
                          type="number"
                          step="0.1"
                          value={editEndTime}
                          onChange={(e) => setEditEndTime(parseFloat(e.target.value) || 0)}
                          className="w-14 bg-slate-900 border border-slate-700 rounded px-1 py-0.5 text-white"
                        />
                        <span>s</span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {onDeleteLyric && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteLyric(lyric.id);
                            }}
                            className="p-1 rounded bg-slate-900 hover:bg-red-950 text-slate-400 hover:text-red-400 transition-colors"
                            title="Excluir esta legenda"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={(e) => handleCancelEdit(e)}
                          className="px-2 py-1 rounded bg-slate-800 text-slate-300 text-xs font-semibold"
                        >
                          Cancelar
                        </button>
                        <button
                          type="button"
                          onClick={(e) => handleSaveEdit(lyric, e)}
                          className="flex items-center gap-1 px-2.5 py-1 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold shadow"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Salvar</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between gap-2 mb-0.5">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[10px] font-extrabold uppercase tracking-wider px-1.5 py-0.2 rounded ${
                            lyric.section === 'chorus'
                              ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                              : lyric.section === 'partners'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              : lyric.section === 'intro'
                              ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {lyric.section}
                        </span>
                        {isActive && isPlaying && (
                          <span className="flex items-center gap-1 text-[10px] text-amber-400 font-bold animate-pulse">
                            <Sparkles className="w-3 h-3" /> Tocando Agora
                          </span>
                        )}
                      </div>

                      {/* EDIT BUTTON */}
                      {onUpdateLyric && (
                        <button
                          type="button"
                          onClick={(e) => handleStartEdit(lyric, e)}
                          className="opacity-60 group-hover:opacity-100 p-1 rounded-md hover:bg-slate-800 text-slate-400 hover:text-amber-400 transition-all"
                          title="Editar texto da legenda"
                        >
                          <Pencil className="w-3 h-3" />
                        </button>
                      )}
                    </div>

                    <p
                      className={`text-xs sm:text-sm leading-relaxed transition-all ${
                        isActive
                          ? 'font-extrabold text-white text-sm sm:text-base text-amber-200'
                          : 'font-medium'
                      }`}
                    >
                      {lyric.text}
                    </p>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
