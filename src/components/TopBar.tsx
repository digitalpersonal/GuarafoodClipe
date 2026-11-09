import React from 'react';
import { Play, Share2, Flame, Music, Sparkles, ExternalLink, Wand2, Download } from 'lucide-react';

interface TopBarProps {
  onPlayPause: () => void;
  isPlaying: boolean;
  onOpenShareModal: () => void;
  activeTab: 'player' | 'studio' | 'lyrics' | 'audio' | 'partners' | 'sfx';
  setActiveTab: (tab: 'player' | 'studio' | 'lyrics' | 'audio' | 'partners' | 'sfx') => void;
  onExportProject: () => void;
  onImportProject: (file: File) => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  onPlayPause,
  isPlaying,
  onOpenShareModal,
  activeTab,
  setActiveTab,
  onExportProject,
  onImportProject,
}) => {
  return (
    <header className="flex items-center justify-between gap-2 sm:gap-4 px-3 sm:px-6 py-2.5 sm:py-3.5 border-b border-slate-800/80 bg-slate-950/90 backdrop-blur-xl sticky top-0 z-40 max-w-full overflow-x-hidden">
      {/* Zone 1: Wordmark with Flame Icon */}
      <a
        href="#"
        onClick={(e) => {
          e.preventDefault();
          setActiveTab('player');
        }}
        className="text-lg sm:text-xl font-extrabold tracking-tight text-white whitespace-nowrap shrink-0 flex items-center gap-2 group"
      >
        <span className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-gradient-to-tr from-amber-500 to-red-600 flex items-center justify-center text-slate-950 shadow-md shadow-amber-500/20 group-hover:scale-105 transition-transform">
          <Flame className="w-4 h-4 sm:w-5 sm:h-5 fill-current" />
        </span>
        <span className="font-heading">GuaraFood Clips</span>
      </a>

      {/* Zone 2: Navigation links */}
      <nav className="hidden lg:flex items-center gap-5 text-xs sm:text-sm font-semibold text-slate-400">
        <button
          onClick={() => setActiveTab('player')}
          className={`transition-colors whitespace-nowrap shrink-0 ${
            activeTab === 'player' ? 'text-amber-400 font-bold' : 'hover:text-white'
          }`}
        >
          Clipe Principal
        </button>
        <button
          onClick={() => setActiveTab('sfx')}
          className={`transition-colors whitespace-nowrap shrink-0 flex items-center gap-1 ${
            activeTab === 'sfx' ? 'text-amber-400 font-bold' : 'hover:text-white'
          }`}
        >
          <span>Efeitos SFX</span>
          <span className="px-1.5 py-0.2 rounded-md bg-amber-500/20 text-amber-400 text-[10px] font-extrabold border border-amber-500/30">
            Realismo
          </span>
        </button>
        <button
          onClick={() => setActiveTab('audio')}
          className={`transition-colors whitespace-nowrap shrink-0 ${
            activeTab === 'audio' ? 'text-amber-400 font-bold' : 'hover:text-white'
          }`}
        >
          Biblioteca de Músicas
        </button>
        <button
          onClick={() => setActiveTab('studio')}
          className={`transition-colors whitespace-nowrap shrink-0 ${
            activeTab === 'studio' ? 'text-amber-400 font-bold' : 'hover:text-white'
          }`}
        >
          Estúdio Diretor
        </button>
        <button
          onClick={() => setActiveTab('lyrics')}
          className={`transition-colors whitespace-nowrap shrink-0 ${
            activeTab === 'lyrics' ? 'text-amber-400 font-bold' : 'hover:text-white'
          }`}
        >
          Karaokê
        </button>
        <button
          onClick={() => setActiveTab('partners')}
          className={`transition-colors whitespace-nowrap shrink-0 ${
            activeTab === 'partners' ? 'text-amber-400 font-bold' : 'hover:text-white'
          }`}
        >
          Parceiros
        </button>
      </nav>

      {/* Zone 3: Primary action buttons */}
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        <input
          type="file"
          id="import-project"
          className="hidden"
          accept=".json"
          onChange={(e) => {
            if (e.target.files && e.target.files[0]) {
              onImportProject(e.target.files[0]);
              e.target.value = '';
            }
          }}
        />
        <label
          htmlFor="import-project"
          className="cursor-pointer px-2 sm:px-3 py-1.5 text-[11px] sm:text-xs font-bold text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-xl transition-all whitespace-nowrap"
        >
          Carregar
        </label>
        <button
          onClick={onExportProject}
          className="px-2 sm:px-3 py-1.5 text-[11px] sm:text-xs font-bold text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-xl transition-all whitespace-nowrap"
        >
          Salvar Projeto
        </button>
        <button
          onClick={onOpenShareModal}
          className="px-2.5 sm:px-4 py-1.5 sm:py-2 text-[11px] sm:text-xs font-black text-slate-950 bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-300 hover:to-orange-400 rounded-xl transition-all shadow-md shadow-amber-500/25 whitespace-nowrap flex items-center gap-1.5 active:scale-95 cursor-pointer"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Baixar Vídeo</span>
        </button>
      </div>
    </header>
  );
};
