import React, { useState, useEffect, useRef } from 'react';
import { LyricLine, AudioTrack, SavedSongProject } from '../types/clip';
import { PRESET_AUDIO_TRACKS, AUDIO_FILE_PATH } from '../data/songData';
import {
  saveAudioBlob,
  getAudioBlobUrl,
  deleteAudioBlob,
  loadSavedProjects,
  persistProjects,
  exportProjectToJsonFile,
  exportLyricsToLrcFile,
  parseProjectJson,
} from '../utils/audioStorage';
import {
  Music,
  Upload,
  Edit3,
  Plus,
  Trash2,
  Check,
  Sparkles,
  FileAudio,
  Link as LinkIcon,
  ExternalLink,
  Copy,
  Wand2,
  Download,
  FolderHeart,
  Save,
  RotateCcw,
  FileText,
  Clock,
  Play,
  FileUp,
} from 'lucide-react';

interface AudioLyricsImporterProps {
  currentTrack: AudioTrack;
  onSelectTrack: (track: AudioTrack) => void;
  lyrics: LyricLine[];
  onUpdateLyrics: (newLyrics: LyricLine[]) => void;
  duration: number;
  onOpenExportModal?: () => void;
}

export const AudioLyricsImporter: React.FC<AudioLyricsImporterProps> = ({
  currentTrack,
  onSelectTrack,
  lyrics,
  onUpdateLyrics,
  duration,
  onOpenExportModal,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'library' | 'suno' | 'audio' | 'paste-text' | 'lyrics-edit'>('library');
  const [savedProjects, setSavedProjects] = useState<SavedSongProject[]>([]);
  const [customAudioUrl, setCustomAudioUrl] = useState('');
  const [customAudioTitle, setCustomAudioTitle] = useState('');
  const [customAudioArtist, setCustomAudioArtist] = useState('');
  const [pastedLyricsText, setPastedLyricsText] = useState('');
  const [copiedPromptIndex, setCopiedPromptIndex] = useState<number | null>(null);

  // Save current project form state
  const [saveTitle, setSaveTitle] = useState('');
  const [saveArtist, setSaveArtist] = useState('');
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null);
  const jsonFileInputRef = useRef<HTMLInputElement | null>(null);

  // Ready-to-use Suno AI prompts for GuaraFood commercials
  const sunoPrompts = [
    {
      title: 'Jingle Pop/Funk Animado (Oficial)',
      style: 'Brazilian Pop Funk, Commercial Jingle, Energetic, Catchy Male & Female Vocals, 125 BPM',
      lyrics: `[Intro]
Bateu a fome, já sabe onde chamar...
GuaraFood da cidade pra entregar!

[Verse]
Lanches, pizzas, açaí pra refrescar
Pastéis e muito mais, é só escolher e pedir!
No app da cidade é fácil comprar...
Comprou com quem investe aqui pra gente crescer!

[Chorus]
GuaraFood! GuaraFood! Seu pedido chega, bom demais!
GuaraFood! GuaraFood! Da nossa cidade pra você e muito mais!`,
    },
    {
      title: 'Jingle Sertanejo Guaranésia',
      style: 'Sertanejo Universitário Animado, Sanfona Pop, Vocal Vibrante, 130 BPM',
      lyrics: `[Intro]
Fome em Guaranésia?
Pede no GuaraFood!

[Chorus]
GuaraFood chega rápido na sua porta!
Pizza quentinha, açaí gelado e burger suculento!
Comprou com quem investe aqui pra gente crescer!`,
    },
    {
      title: 'Jingle Trap/Pop Beat Urbano',
      style: 'Urban Trap Pop, Commercial Beat, Smooth Flow, 120 BPM, Bass Boost',
      lyrics: `[Intro]
Abriu o app, escolheu...
GuaraFood tá na rota!

[Chorus]
Chega quentinho, chega no capricho
GuaraFood é da nossa cidade, pode confiar!`,
    },
  ];

  // Load saved projects on mount
  useEffect(() => {
    const loaded = loadSavedProjects();
    setSavedProjects(loaded);
  }, []);

  const handleCopyPrompt = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedPromptIndex(index);
    setTimeout(() => setCopiedPromptIndex(null), 2500);
  };

  // Upload an audio file and save it in IndexedDB for permanent reuse
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const trackId = `custom-track-${Date.now()}`;
    const cleanTitle = file.name.replace(/\.[^/.]+$/, '');

    // Persist blob in IndexedDB
    await saveAudioBlob(trackId, file);
    const objectUrl = URL.createObjectURL(file);

    const newTrack: AudioTrack = {
      id: trackId,
      title: cleanTitle,
      artist: 'Upload do Usuário',
      audioUrl: objectUrl,
      isCustom: true,
    };

    onSelectTrack(newTrack);

    // Auto-create and save project bundle
    const newProject: SavedSongProject = {
      id: trackId,
      title: cleanTitle,
      artist: 'Upload do Usuário',
      audioUrl: objectUrl,
      duration: duration || 67,
      lyrics: lyrics,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      isPreset: false,
    };

    const updatedProjects = [newProject, ...savedProjects];
    setSavedProjects(updatedProjects);
    persistProjects(updatedProjects);

    setSaveSuccessMessage(`Música "${cleanTitle}" salva na biblioteca com sucesso!`);
    setTimeout(() => setSaveSuccessMessage(null), 3000);
  };

  // Add custom audio URL
  const handleAddAudioUrl = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customAudioUrl.trim()) return;

    const trackId = `url-track-${Date.now()}`;
    const title = customAudioTitle.trim() || 'Música Personalizada';
    const artist = customAudioArtist.trim() || 'URL Externa';

    const newTrack: AudioTrack = {
      id: trackId,
      title,
      artist,
      audioUrl: customAudioUrl.trim(),
      isCustom: true,
    };

    onSelectTrack(newTrack);

    // Also persist project
    const newProject: SavedSongProject = {
      id: trackId,
      title,
      artist,
      audioUrl: customAudioUrl.trim(),
      duration: duration || 67,
      lyrics: lyrics,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      isPreset: false,
    };

    const updatedProjects = [newProject, ...savedProjects];
    setSavedProjects(updatedProjects);
    persistProjects(updatedProjects);

    setCustomAudioUrl('');
    setCustomAudioTitle('');
    setCustomAudioArtist('');
    setSaveSuccessMessage(`Música "${title}" adicionada e salva!`);
    setTimeout(() => setSaveSuccessMessage(null), 3000);
  };

  // Save current active state as a new project
  const handleSaveCurrentProject = () => {
    const title = saveTitle.trim() || currentTrack.title || 'Novo Jingle GuaraFood';
    const artist = saveArtist.trim() || currentTrack.artist || 'GuaraFood Produções';

    const newProject: SavedSongProject = {
      id: `project-${Date.now()}`,
      title,
      artist,
      audioUrl: currentTrack.audioUrl,
      duration: duration || 67,
      lyrics: [...lyrics],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      isPreset: false,
    };

    const updated = [newProject, ...savedProjects.filter((p) => p.id !== newProject.id)];
    setSavedProjects(updated);
    persistProjects(updated);

    setSaveTitle('');
    setSaveArtist('');
    setSaveSuccessMessage(`Projeto "${title}" salvo com sucesso para uso posterior!`);
    setTimeout(() => setSaveSuccessMessage(null), 3500);
  };

  // Load a saved project into the active clip & karaoke
  const handleLoadProject = async (project: SavedSongProject) => {
    let finalAudioUrl = project.audioUrl;

    // If it was a custom blob, check if IndexedDB has the blob
    if (project.id.startsWith('custom-track-')) {
      const restoredUrl = await getAudioBlobUrl(project.id);
      if (restoredUrl) {
        finalAudioUrl = restoredUrl;
      }
    }

    onSelectTrack({
      id: project.id,
      title: project.title,
      artist: project.artist,
      audioUrl: finalAudioUrl,
      duration: project.duration,
      isCustom: !project.isPreset,
    });

    if (project.lyrics && project.lyrics.length > 0) {
      onUpdateLyrics(project.lyrics);
    }

    setSaveSuccessMessage(`"${project.title}" ativado no clipe e no karaokê!`);
    setTimeout(() => setSaveSuccessMessage(null), 3000);
  };

  // Delete a saved project
  const handleDeleteProject = (projectId: string) => {
    const target = savedProjects.find((p) => p.id === projectId);
    if (!target) return;
    if (target.isPreset) {
      alert('Faixas predefinidas originais não podem ser excluídas.');
      return;
    }

    deleteAudioBlob(projectId);
    const updated = savedProjects.filter((p) => p.id !== projectId);
    setSavedProjects(updated);
    persistProjects(updated);
  };

  // Import JSON project from local computer
  const handleImportJsonFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const parsed = parseProjectJson(content);
      if (parsed) {
        const updated = [parsed, ...savedProjects];
        setSavedProjects(updated);
        persistProjects(updated);
        handleLoadProject(parsed);
        setSaveSuccessMessage(`Projeto "${parsed.title}" importado e carregado com sucesso!`);
        setTimeout(() => setSaveSuccessMessage(null), 3500);
      } else {
        alert('O arquivo selecionado não contém um formato de projeto GuaraFood válido.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Auto-generate timestamped lyrics from pasted raw text
  const handleAutoGenerateLyrics = () => {
    if (!pastedLyricsText.trim()) return;

    const rawLines = pastedLyricsText
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    if (rawLines.length === 0) return;

    const trackDuration = duration || 67;
    const timeStep = trackDuration / rawLines.length;

    const generatedLyrics: LyricLine[] = rawLines.map((line, idx) => {
      const startTime = parseFloat((idx * timeStep).toFixed(1));
      const endTime = parseFloat(((idx + 1) * timeStep).toFixed(1));

      let section: LyricLine['section'] = 'verse';
      const lower = line.toLowerCase();
      if (idx === 0 || lower.includes('bateu a fome') || lower.includes('intro')) {
        section = 'intro';
      } else if (lower.includes('guarafood') || lower.includes('refrão') || lower.includes('chega')) {
        section = 'chorus';
      } else if (lower.includes('parceiro') || lower.includes('pizzaria') || lower.includes('açaí')) {
        section = 'partners';
      }

      return {
        id: `gen-lyric-${idx + 1}-${Date.now()}`,
        startTime,
        endTime,
        text: line,
        section,
      };
    });

    onUpdateLyrics(generatedLyrics);
    setActiveSubTab('lyrics-edit');
    setSaveSuccessMessage(`${generatedLyrics.length} linhas sincronizadas! Lembre-se de salvar na biblioteca.`);
    setTimeout(() => setSaveSuccessMessage(null), 3500);
  };

  const handleUpdateLine = (id: string, field: keyof LyricLine, value: unknown) => {
    const updated = lyrics.map((l) => (l.id === id ? { ...l, [field]: value } : l));
    onUpdateLyrics(updated);
  };

  const handleDeleteLine = (id: string) => {
    onUpdateLyrics(lyrics.filter((l) => l.id !== id));
  };

  const handleAddNewLine = () => {
    const lastLine = lyrics[lyrics.length - 1];
    const newStart = lastLine ? lastLine.endTime : 0;
    const newLine: LyricLine = {
      id: `lyric-${Date.now()}`,
      startTime: newStart,
      endTime: newStart + 3,
      text: 'Nova linha de letra...',
      section: 'verse',
    };
    onUpdateLyrics([...lyrics, newLine]);
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl backdrop-blur-md space-y-4">
      {/* HEADER TABS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <Music className="w-5 h-5 text-amber-500" />
          <h2 className="text-base sm:text-lg font-bold text-white tracking-wide font-heading">
            Gerenciador & Biblioteca de Músicas
          </h2>
        </div>

        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 overflow-x-auto max-w-full">
          <button
            onClick={() => setActiveSubTab('library')}
            className={`px-2.5 sm:px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1 shrink-0 ${
              activeSubTab === 'library'
                ? 'bg-amber-500 text-slate-950 shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <FolderHeart className="w-3.5 h-3.5" />
            <span>Biblioteca ({savedProjects.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('suno')}
            className={`px-2.5 sm:px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1 shrink-0 ${
              activeSubTab === 'suno'
                ? 'bg-amber-500 text-slate-950 shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Wand2 className="w-3.5 h-3.5" />
            <span>Suno AI</span>
          </button>

          <button
            onClick={() => setActiveSubTab('audio')}
            className={`px-2.5 sm:px-3 py-1.5 text-xs font-bold rounded-lg transition-all shrink-0 ${
              activeSubTab === 'audio'
                ? 'bg-amber-500 text-slate-950 shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Enviar Áudio
          </button>

          <button
            onClick={() => setActiveSubTab('paste-text')}
            className={`px-2.5 sm:px-3 py-1.5 text-xs font-bold rounded-lg transition-all shrink-0 ${
              activeSubTab === 'paste-text'
                ? 'bg-amber-500 text-slate-950 shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Colar Letra
          </button>

          <button
            onClick={() => setActiveSubTab('lyrics-edit')}
            className={`px-2.5 sm:px-3 py-1.5 text-xs font-bold rounded-lg transition-all shrink-0 ${
              activeSubTab === 'lyrics-edit'
                ? 'bg-amber-500 text-slate-950 shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Tempos ({lyrics.length})
          </button>
        </div>
      </div>

      {/* SUCCESS NOTIFICATION TOAST */}
      {saveSuccessMessage && (
        <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-2 animate-in fade-in duration-200">
          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{saveSuccessMessage}</span>
        </div>
      )}

      {/* SUB-TAB 0: PERMANENT LIBRARY (SALVAR, IMPORTAR, EXPORTAR, CARREGAR) */}
      {activeSubTab === 'library' && (
        <div className="space-y-4">
          {/* QUICK SAVE CURRENT SONG & LYRICS CARD */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-slate-950 border border-amber-500/30 space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-xs font-extrabold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                <Save className="w-4 h-4" />
                <span>Salvar Música & Letra Atual no Sistema</span>
              </div>
              <span className="text-[10px] font-bold text-slate-400">
                {lyrics.length} estrofes ativas
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Guarde a combinação atual da música (<strong>{currentTrack.title}</strong>) e todas as suas estrofes com tempos no banco de dados para abrir ou usar em qualquer momento futuro.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <input
                type="text"
                placeholder="Título da música (ex: Jingle Oficial Guaranésia 2026)"
                value={saveTitle}
                onChange={(e) => setSaveTitle(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
              />
              <input
                type="text"
                placeholder="Artista / Criador (ex: Produção GuaraFood / Suno AI)"
                value={saveArtist}
                onChange={(e) => setSaveArtist(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-1">
              <button
                onClick={handleSaveCurrentProject}
                className="flex-1 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition-transform active:scale-95 flex items-center justify-center gap-1.5 shadow-md shadow-amber-500/20"
              >
                <Save className="w-4 h-4" />
                <span>Salvar no Sistema para Uso Posterior</span>
              </button>

              <button
                onClick={() =>
                  exportProjectToJsonFile({
                    id: currentTrack.id,
                    title: saveTitle.trim() || currentTrack.title,
                    artist: saveArtist.trim() || currentTrack.artist,
                    audioUrl: currentTrack.audioUrl,
                    duration,
                    lyrics,
                    createdAt: Date.now(),
                    updatedAt: Date.now(),
                  })
                }
                className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition-colors flex items-center gap-1.5"
                title="Baixar arquivo JSON com áudio e letra no computador"
              >
                <Download className="w-3.5 h-3.5 text-amber-400" />
                <span>Exportar (.JSON)</span>
              </button>

              <button
                onClick={() =>
                  exportLyricsToLrcFile(
                    saveTitle.trim() || currentTrack.title,
                    saveArtist.trim() || currentTrack.artist,
                    lyrics
                  )
                }
                className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition-colors flex items-center gap-1.5"
                title="Exportar letra em formato Karaoke universal (.LRC)"
              >
                <FileText className="w-3.5 h-3.5 text-amber-400" />
                <span>Exportar (.LRC)</span>
              </button>
            </div>
          </div>

          {/* IMPORT PROJECT FROM COMPUTER */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
            <div className="text-xs text-slate-300">
              <span className="font-bold text-white block">Importar Arquivo Salvo do Computador</span>
              <span className="text-[11px] text-slate-400">Restaure arquivos de música e letras (.JSON) baixados anteriormente.</span>
            </div>
            <button
              onClick={() => jsonFileInputRef.current?.click()}
              className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center gap-1.5 transition-colors shrink-0"
            >
              <FileUp className="w-4 h-4 text-amber-400" />
              <span>Importar (.JSON)</span>
            </button>
            <input
              ref={jsonFileInputRef}
              type="file"
              accept=".json"
              onChange={handleImportJsonFile}
              className="hidden"
            />
          </div>

          {/* SAVED SONGS LIST */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-300">
              <span>Músicas & Letras Armazenadas no Sistema:</span>
              <span className="text-amber-400 font-mono font-medium">
                {savedProjects.length} Salvos
              </span>
            </div>

            <div className="space-y-2 max-h-80 overflow-y-auto pr-1 custom-scrollbar">
              {savedProjects.map((proj) => {
                const isActive = currentTrack.id === proj.id || currentTrack.title === proj.title;
                return (
                  <div
                    key={proj.id}
                    className={`p-3.5 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      isActive
                        ? 'bg-amber-500/15 border-amber-500 ring-1 ring-amber-500/30'
                        : 'bg-slate-950/80 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-black text-white font-heading">
                          {proj.title}
                        </span>
                        {isActive && (
                          <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-amber-500 text-slate-950">
                            Ativo no Vídeo
                          </span>
                        )}
                        {proj.isPreset && (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                            Oficial
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-400">
                        <span>{proj.artist}</span>
                        <span>·</span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-amber-400" />
                          <span>{proj.lyrics?.length || 0} estrofes</span>
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 self-end sm:self-auto shrink-0">
                      <button
                        onClick={() => handleLoadProject(proj)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
                          isActive
                            ? 'bg-amber-500 text-slate-950 shadow-md'
                            : 'bg-slate-800 hover:bg-slate-700 text-white'
                        }`}
                        title="Carregar esta música e letra no vídeo agora"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>{isActive ? 'Em Reprodução' : 'Usar no Vídeo'}</span>
                      </button>

                      <button
                        onClick={() => exportProjectToJsonFile(proj)}
                        className="p-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition-colors"
                        title="Exportar arquivo de backup .JSON"
                      >
                        <Download className="w-4 h-4 text-amber-400" />
                      </button>

                      {!proj.isPreset && (
                        <button
                          onClick={() => handleDeleteProject(proj.id)}
                          className="p-1.5 rounded-xl bg-slate-900 hover:bg-red-950/60 text-slate-400 hover:text-red-400 border border-slate-800 transition-colors"
                          title="Excluir da biblioteca"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 1: SUNO AI DIRECT LINK & PROMPT TEMPLATES */}
      {activeSubTab === 'suno' && (
        <div className="space-y-4">
          {/* SUNO AI HERO DIRECT BANNER */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-900/60 via-amber-950/50 to-slate-950 border border-purple-500/40 shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-purple-300 font-extrabold text-xs uppercase tracking-wider">
                <Wand2 className="w-4 h-4 text-purple-400" />
                <span>Estúdio de Criação de Músicas Suno.ai</span>
              </div>
              <a
                href="https://suno.com"
                target="_blank"
                rel="noopener noreferrer"
                className="px-3.5 py-1.5 rounded-xl bg-purple-500 hover:bg-purple-400 text-white font-black text-xs shadow-lg flex items-center gap-1.5 transition-transform active:scale-95 shrink-0"
              >
                <span>Abrir Suno.com</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Crie músicas e jingles promocionais personalizados com inteligência artificial no <strong>Suno.com</strong>. Copie os comandos de prompts abaixo, gere a música no Suno e depois importe o arquivo `.mp3` para o clipe!
            </p>
          </div>

          {/* SUNO PROMPTS TEMPLATES LIST */}
          <div className="space-y-3">
            <div className="text-xs font-bold text-slate-300">
              Prompts Prontos do GuaraFood para copiar no Suno:
            </div>

            {sunoPrompts.map((promptItem, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="text-xs font-bold text-white font-heading">
                    {promptItem.title}
                  </div>
                  <button
                    onClick={() =>
                      handleCopyPrompt(
                        `Style: ${promptItem.style}\n\nLyrics:\n${promptItem.lyrics}`,
                        idx
                      )
                    }
                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-400 font-semibold text-[11px] flex items-center gap-1 transition-colors"
                  >
                    {copiedPromptIndex === idx ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" /> Copiado!
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" /> Copiar Prompt Suno
                      </>
                    )}
                  </button>
                </div>

                <div className="text-[11px] text-amber-300 font-mono bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                  <strong className="text-slate-400">Estilo:</strong> {promptItem.style}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUB-TAB 2: AUDIO IMPORTER & TRACK SELECTOR */}
      {activeSubTab === 'audio' && (
        <div className="space-y-4">
          <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-amber-500 text-slate-950 font-bold">
                <FileAudio className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-extrabold text-amber-300 uppercase tracking-wider">
                  Áudio Selecionado no Clipe
                </div>
                <div className="text-sm font-black text-white font-heading">
                  {currentTrack.title}
                </div>
                <div className="text-xs text-slate-400">{currentTrack.artist}</div>
              </div>
            </div>
            <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
              ● Ativo
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="p-4 rounded-xl border-2 border-dashed border-slate-800 hover:border-amber-500/50 bg-slate-950/60 hover:bg-slate-950 transition-all cursor-pointer flex flex-col items-center justify-center text-center gap-2 group">
              <Upload className="w-6 h-6 text-amber-500 group-hover:scale-110 transition-transform" />
              <div>
                <div className="text-xs font-bold text-white">
                  Carregar Áudio (.mp3 do Suno)
                </div>
                <div className="text-[10px] text-slate-400">
                  Salva no banco de dados local (.MP3, .WAV, .M4A)
                </div>
              </div>
              <input
                type="file"
                accept="audio/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>

            <form onSubmit={handleAddAudioUrl} className="p-4 rounded-xl border border-slate-800 bg-slate-950/60 space-y-2">
              <div className="text-xs font-bold text-white flex items-center gap-1.5">
                <LinkIcon className="w-3.5 h-3.5 text-amber-500" />
                <span>Cole a URL do Áudio</span>
              </div>
              <input
                type="text"
                placeholder="Nome da faixa..."
                value={customAudioTitle}
                onChange={(e) => setCustomAudioTitle(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
              />
              <input
                type="url"
                placeholder="https://exemplo.com/minha-musica.mp3"
                value={customAudioUrl}
                onChange={(e) => setCustomAudioUrl(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
              />
              <button
                type="submit"
                className="w-full py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-colors"
              >
                Usar e Salvar este Áudio URL
              </button>
            </form>
          </div>

          {/* PROMINENT GENERATE VIDEO BUTTON AFTER SENDING MUSIC */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-slate-950 shadow-xl space-y-3 text-center border-2 border-amber-300">
            <div className="flex items-center justify-center gap-2 text-slate-950 font-black text-sm uppercase tracking-wider font-heading">
              <Sparkles className="w-5 h-5 animate-pulse" />
              <span>Áudio Pronto? Gere o Vídeo Comercial Agora!</span>
            </div>
            <p className="text-xs text-slate-950 font-medium">
              O sistema aplicará a nova trilha sonora em sincronia com todas as 17 cenas de vídeo MP4 em alta definição do GuaraFood.
            </p>
            <button
              onClick={() => {
                setSaveSuccessMessage('Vídeo comercial preparado! Abrindo motor de renderização...');
                if (onOpenExportModal) {
                  onOpenExportModal();
                }
              }}
              className="w-full py-3.5 rounded-xl bg-slate-950 text-amber-400 hover:bg-slate-900 font-black text-sm shadow-2xl transition-transform transform hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2 cursor-pointer border border-amber-400/40"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>GERAR E BAIXAR VÍDEO COMERCIAL COM ESTA MÚSICA</span>
            </button>
          </div>

          <div className="space-y-2">
            <div className="text-xs font-bold text-slate-300">
              Músicas Predefinidas do GuaraFood:
            </div>
            <div className="space-y-1.5">
              {PRESET_AUDIO_TRACKS.map((track) => (
                <button
                  key={track.id}
                  onClick={() => onSelectTrack(track)}
                  className={`w-full p-2.5 rounded-xl border text-left flex items-center justify-between transition-all ${
                    currentTrack.id === track.id
                      ? 'bg-amber-500/15 border-amber-500 text-white font-bold'
                      : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Music className="w-4 h-4 text-amber-400" />
                    <div>
                      <div className="text-xs font-bold">{track.title}</div>
                      <div className="text-[10px] text-slate-400">{track.artist}</div>
                    </div>
                  </div>
                  {currentTrack.id === track.id && (
                    <Check className="w-4 h-4 text-amber-400" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 3: PASTE RAW TEXT LYRICS */}
      {activeSubTab === 'paste-text' && (
        <div className="space-y-3">
          <div className="text-xs text-slate-400">
            Cole a letra inteira da música criada no Suno abaixo. O sistema vai dividir em linhas e sincronizar os tempos automaticamente:
          </div>

          <textarea
            rows={8}
            placeholder={`Cole a letra da música do Suno aqui... Exemplo:

Bateu a fome, já sabe onde chamar...
GuaraFood da cidade pra entregar!
Lanches, pizzas, açaí pra refrescar...
Pastéis e muito mais, é só escolher e pedir!`}
            value={pastedLyricsText}
            onChange={(e) => setPastedLyricsText(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white font-mono focus:outline-none focus:border-amber-500 leading-relaxed"
          />

          <button
            onClick={handleAutoGenerateLyrics}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs shadow-lg transition-all flex items-center justify-center gap-2 active:scale-95"
          >
            <Sparkles className="w-4 h-4" />
            <span>Gerar e Sincronizar Letra no Vídeo</span>
          </button>
        </div>
      )}

      {/* SUB-TAB 4: EDIT INDIVIDUAL LYRIC LINES & TIMESTAMPS */}
      {activeSubTab === 'lyrics-edit' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Ajuste os segundos de início/fim e o texto de cada estrofe:</span>
            <div className="flex items-center gap-2">
              <button
                onClick={handleAddNewLine}
                className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Adicionar Estrofe
              </button>
            </div>
          </div>

          <div className="max-h-72 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
            {lyrics.map((line, idx) => (
              <div
                key={line.id}
                className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono font-bold text-amber-400 bg-slate-900 px-1.5 py-0.5 rounded">
                      #{idx + 1}
                    </span>

                    <div className="flex items-center gap-1 text-[11px] font-mono text-slate-300">
                      <span>Início:</span>
                      <input
                        type="number"
                        step={0.5}
                        value={line.startTime}
                        onChange={(e) =>
                          handleUpdateLine(line.id, 'startTime', parseFloat(e.target.value) || 0)
                        }
                        className="w-14 bg-slate-900 border border-slate-700 rounded px-1.5 py-0.5 text-center text-amber-400 font-bold"
                      />
                      <span>s — Fim:</span>
                      <input
                        type="number"
                        step={0.5}
                        value={line.endTime}
                        onChange={(e) =>
                          handleUpdateLine(line.id, 'endTime', parseFloat(e.target.value) || 0)
                        }
                        className="w-14 bg-slate-900 border border-slate-700 rounded px-1.5 py-0.5 text-center text-amber-400 font-bold"
                      />
                      <span>s</span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleDeleteLine(line.id)}
                    className="p-1 rounded text-slate-500 hover:text-red-400 hover:bg-slate-900"
                    title="Excluir estrofe"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <input
                  type="text"
                  value={line.text}
                  onChange={(e) => handleUpdateLine(line.id, 'text', e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500 font-medium"
                />
              </div>
            ))}
          </div>

          {/* QUICK SAVE BUTTON BELOW LYRICS LIST */}
          <button
            onClick={handleSaveCurrentProject}
            className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 font-bold text-xs transition-colors flex items-center justify-center gap-1.5 border border-slate-700"
          >
            <Save className="w-4 h-4 text-amber-400" />
            <span>Salvar Letra e Tempos Atuais na Biblioteca do Sistema</span>
          </button>
        </div>
      )}
    </div>
  );
};
