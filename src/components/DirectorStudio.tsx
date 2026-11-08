import React, { useState } from 'react';
import { VideoScene, LyricLine } from '../types/clip';
import { Sliders, Video, Layers, Image as ImageIcon, FastForward, Play, Tv, Film, Flame, Upload, Link as LinkIcon, Check, Music, Type, Plus } from 'lucide-react';

interface DirectorStudioProps {
  scenes: VideoScene[];
  activeSceneIndex: number;
  onUpdateScene: (index: number, updatedScene: VideoScene) => void;
  onSelectScene: (index: number) => void;
  currentTime: number;
  lyrics?: LyricLine[];
  onUpdateLyric?: (updatedLyric: LyricLine) => void;
  onAddLyric?: (newLyric: LyricLine) => void;
}

export const DirectorStudio: React.FC<DirectorStudioProps> = ({
  scenes,
  activeSceneIndex,
  onUpdateScene,
  onSelectScene,
  currentTime,
  lyrics = [],
  onUpdateLyric,
  onAddLyric,
}) => {
  const [selectedTab, setSelectedTab] = useState<'scenes' | 'media-upload' | 'effects'>('scenes');
  const [videoUrlInput, setVideoUrlInput] = useState('');
  const [imageUrlInput, setImageUrlInput] = useState('');
  const currentScene = scenes[activeSceneIndex] || scenes[0];

  // Find lyrics associated with current scene's time window
  const sceneLyrics = lyrics.filter(
    (l) =>
      (l.startTime >= currentScene.startTime && l.startTime < currentScene.endTime) ||
      (l.endTime > currentScene.startTime && l.endTime <= currentScene.endTime) ||
      (l.startTime <= currentScene.startTime && l.endTime >= currentScene.endTime)
  );

  const transitionOptions: VideoScene['transitionType'][] = [
    'zoom',
    'pan-left',
    'pan-right',
    'pulse',
    'glitch',
    'rotate',
    'fade',
    'fast-zoom',
    'whip-pan',
  ];

  const particleThemeOptions: { value: VideoScene['particleTheme']; label: string; desc: string }[] = [
    { value: 'fresh-veggies', label: 'Efeito Calor & Grelhado', desc: 'Partículas de brasas e luz dourada de hambúrguer grelhado' },
    { value: 'cheese-pull', label: 'Queijo Puxando no Forno', desc: 'Efeito vapor de forno a lenha e luzes de basílico fresco' },
    { value: 'acai-splash', label: 'Açaí Tropical & Sol', desc: 'Flares de luz solar praiana e bagas de açaí' },
    { value: 'golden-crisp', label: 'Pastelaria Crocante 4K', desc: 'Faíscas douradas e vapor de pastel frito na hora' },
    { value: 'speed-lines', label: 'Velocidade de Entrega', desc: 'Linhas de movimento dinâmico da moto GuaraFood' },
  ];

  // Handle local video file upload for active scene
  const handleVideoFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentScene) return;

    const fileUrl = URL.createObjectURL(file);
    onUpdateScene(activeSceneIndex, {
      ...currentScene,
      videoSrc: fileUrl,
    });
  };

  // Handle local image file upload for active scene
  const handleImageFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentScene) return;

    const fileUrl = URL.createObjectURL(file);
    onUpdateScene(activeSceneIndex, {
      ...currentScene,
      imageSrc: fileUrl,
    });
  };

  // Handle custom video URL submission
  const handleApplyVideoUrl = (e: React.FormEvent) => {
    e.preventDefault();
    if (!videoUrlInput.trim() || !currentScene) return;

    onUpdateScene(activeSceneIndex, {
      ...currentScene,
      videoSrc: videoUrlInput.trim(),
    });
    setVideoUrlInput('');
  };

  // Handle custom image URL submission
  const handleApplyImageUrl = (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageUrlInput.trim() || !currentScene) return;

    onUpdateScene(activeSceneIndex, {
      ...currentScene,
      imageSrc: imageUrlInput.trim(),
    });
    setImageUrlInput('');
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl backdrop-blur-md flex flex-col gap-4">
      {/* HEADER TABS */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <Film className="w-5 h-5 text-amber-500" />
          <h2 className="text-lg font-bold text-white tracking-wide font-heading">
            Estúdio Diretor & Envio de Vídeos
          </h2>
        </div>

        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 overflow-x-auto">
          <button
            onClick={() => setSelectedTab('scenes')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1 ${
              selectedTab === 'scenes'
                ? 'bg-amber-500 text-slate-950 shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Video className="w-3.5 h-3.5" />
            <span>17 Vídeos MP4</span>
          </button>
          <button
            onClick={() => setSelectedTab('media-upload')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1 ${
              selectedTab === 'media-upload'
                ? 'bg-amber-500 text-slate-950 shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Trocar Vídeo/Foto</span>
          </button>
          <button
            onClick={() => setSelectedTab('effects')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
              selectedTab === 'effects'
                ? 'bg-amber-500 text-slate-950 shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Efeitos
          </button>
        </div>
      </div>

      {/* TAB CONTENT 1: SCENES & STORYBOARD */}
      {selectedTab === 'scenes' && (
        <div className="space-y-4">
          <div className="text-xs text-slate-400 flex items-center justify-between">
            <span>Selecione a cena para trocar o vídeo ou ajustar o movimento:</span>
            <span className="text-amber-400 font-mono font-medium">
              Cena {activeSceneIndex + 1} de {scenes.length}
            </span>
          </div>

          {/* SCENE THUMBNAILS ROW (100% REAL MP4 VIDEOS) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 overflow-x-auto pb-2">
            {scenes.map((scene, idx) => {
              const isActive = idx === activeSceneIndex;
              return (
                <button
                  key={scene.id}
                  onClick={() => onSelectScene(idx)}
                  className={`group relative rounded-xl overflow-hidden border-2 text-left transition-all aspect-video bg-slate-950 ${
                    isActive
                      ? 'border-amber-500 ring-2 ring-amber-500/30 scale-105 shadow-lg'
                      : 'border-slate-800 hover:border-slate-700 opacity-80 hover:opacity-100'
                  }`}
                >
                  {/* REAL MP4 VIDEO LOOP IN THUMBNAIL */}
                  {scene.videoSrc ? (
                    <video
                      src={scene.videoSrc}
                      autoPlay
                      loop
                      muted
                      playsInline
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <img
                      src={scene.imageSrc}
                      alt={scene.title}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/30 to-transparent p-2 flex flex-col justify-between pointer-events-none">
                    <span className="self-start text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-900/95 text-amber-300 font-bold flex items-center gap-1 border border-amber-500/30">
                      <Video className="w-2.5 h-2.5 text-amber-400" />
                      <span>Vídeo #{idx + 1} ({scene.startTime}s-{scene.endTime}s)</span>
                    </span>
                    <span className="text-[11px] font-bold text-white truncate group-hover:text-amber-400">
                      {scene.title}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* QUICK MEDIA UPLOADER CARD FOR ACTIVE SCENE */}
          {currentScene && (
            <div className="p-4 rounded-xl bg-slate-950/90 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div className="text-xs font-extrabold text-white font-heading">
                  Mídia Ativa da Cena #{activeSceneIndex + 1}: {currentScene.title}
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  {currentScene.videoSrc ? '📹 Vídeo MP4 Ativo' : '🖼️ Imagem 4K'}
                </span>
              </div>

              {/* LIVE ACTIVE VIDEO PREVIEW */}
              {currentScene.videoSrc && (
                <div className="relative rounded-xl overflow-hidden aspect-video bg-black border border-amber-500/30 shadow-lg">
                  <video
                    src={currentScene.videoSrc}
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-slate-950/80 backdrop-blur-md text-[10px] font-bold text-amber-400 border border-amber-500/30 flex items-center gap-1">
                    <Video className="w-3 h-3 text-amber-400" />
                    <span>Prévia do Vídeo MP4 (Cena #{activeSceneIndex + 1})</span>
                  </div>
                </div>
              )}

              {/* TWO COLUMN UPLOAD OPTIONS */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* UPLOAD VIDEO FILE */}
                <label className="p-3.5 rounded-xl border-2 border-dashed border-amber-500/40 hover:border-amber-500 bg-amber-500/5 hover:bg-amber-500/10 transition-all cursor-pointer flex flex-col items-center justify-center text-center gap-1.5 group">
                  <Video className="w-6 h-6 text-amber-500 group-hover:scale-110 transition-transform" />
                  <div className="text-xs font-bold text-white">
                    Enviar Vídeo MP4 para esta Cena
                  </div>
                  <div className="text-[10px] text-slate-400">
                    Substitui a imagem por um vídeo em movimento real
                  </div>
                  <input
                    type="file"
                    accept="video/*"
                    onChange={handleVideoFileUpload}
                    className="hidden"
                  />
                </label>

                {/* UPLOAD IMAGE FILE */}
                <label className="p-3.5 rounded-xl border-2 border-dashed border-slate-800 hover:border-slate-700 bg-slate-900/60 transition-all cursor-pointer flex flex-col items-center justify-center text-center gap-1.5 group">
                  <ImageIcon className="w-6 h-6 text-slate-400 group-hover:scale-110 transition-transform" />
                  <div className="text-xs font-bold text-white">
                    Enviar Foto/Imagem para esta Cena
                  </div>
                  <div className="text-[10px] text-slate-400">
                    Carregar imagem .JPG ou .PNG
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageFileUpload}
                    className="hidden"
                  />
                </label>
              </div>

              {/* SCENE PARAMETERS EDIT */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-800">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Título da Cena
                  </label>
                  <input
                    type="text"
                    value={currentScene.title}
                    onChange={(e) =>
                      onUpdateScene(activeSceneIndex, {
                        ...currentScene,
                        title: e.target.value,
                      })
                    }
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Movimento de Câmera
                  </label>
                  <select
                    value={currentScene.transitionType}
                    onChange={(e) =>
                      onUpdateScene(activeSceneIndex, {
                        ...currentScene,
                        transitionType: e.target.value as VideoScene['transitionType'],
                      })
                    }
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500 capitalize"
                  >
                    {transitionOptions.map((t) => (
                      <option key={t} value={t}>
                        {t === 'zoom' && '🔍 Travelling Zoom'}
                        {t === 'pan-left' && '⬅️ Panorâmica Esquerda'}
                        {t === 'pan-right' && '➡️ Panorâmica Direita'}
                        {t === 'pulse' && '💥 Pulso no Beat'}
                        {t === 'glitch' && '⚡ Efeito Glitch'}
                        {t === 'rotate' && '🔄 Movimento de Câmera'}
                        {t === 'fade' && '🌫️ Desvanecimento (Fade)'}
                        {t === 'fast-zoom' && '🚀 Zoom Rápido'}
                        {t === 'whip-pan' && '💫 Whip-Pan Cinematográfico'}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* EDIT SCENE SUBTITLE / LYRICS (KARAOKE) */}
              <div className="pt-3 border-t border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-amber-400 flex items-center gap-1.5 font-heading">
                    <Music className="w-3.5 h-3.5" />
                    <span>Legenda da Cena (Rodapé do Vídeo & Karaokê)</span>
                  </label>
                  <span className="text-[10px] text-slate-400 font-mono">
                    Janela da Cena: {currentScene.startTime}s - {currentScene.endTime}s
                  </span>
                </div>

                {sceneLyrics.length > 0 ? (
                  <div className="space-y-2">
                    {sceneLyrics.map((lyric) => (
                      <div
                        key={lyric.id}
                        className="bg-slate-900/90 border border-amber-500/30 rounded-xl p-3 space-y-2 shadow-inner"
                      >
                        <div className="flex items-center justify-between text-[11px] text-slate-300">
                          <span className="font-bold flex items-center gap-1 text-amber-300">
                            <Type className="w-3 h-3 text-amber-400" />
                            <span>Texto da Legenda:</span>
                          </span>
                          <span className="font-mono text-xs text-amber-400 font-bold bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                            {lyric.startTime}s ➔ {lyric.endTime}s
                          </span>
                        </div>

                        <input
                          type="text"
                          value={lyric.text}
                          onChange={(e) =>
                            onUpdateLyric?.({
                              ...lyric,
                              text: e.target.value,
                            })
                          }
                          className="w-full bg-slate-950 border border-slate-700 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 rounded-lg px-3 py-2 text-xs sm:text-sm text-white font-medium focus:outline-none"
                          placeholder="Digite a legenda que aparece no vídeo (ex: Lápettit Pizzaria)..."
                        />

                        <div className="flex items-center justify-between text-[10px] text-slate-400">
                          <span>Dica: As alterações na legenda são sincronizadas imediatamente na tela do vídeo e no arquivo exportado.</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-3 bg-slate-900/60 rounded-xl border border-dashed border-slate-800 text-center space-y-2">
                    <p className="text-xs text-slate-400">
                      Nenhuma legenda vinculada a esta cena ({currentScene.startTime}s a {currentScene.endTime}s).
                    </p>
                    {onAddLyric && (
                      <button
                        type="button"
                        onClick={() =>
                          onAddLyric({
                            id: `lyric-${Date.now()}`,
                            startTime: currentScene.startTime,
                            endTime: currentScene.endTime,
                            text: 'Nova Legenda...',
                            section: 'verse',
                          })
                        }
                        className="px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 border border-amber-500/40 text-xs font-bold transition-colors inline-flex items-center gap-1"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Adicionar Legenda nesta Cena</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT 2: MEDIA UPLOAD & URL LINKS */}
      {selectedTab === 'media-upload' && currentScene && (
        <div className="space-y-4">
          <div className="text-xs text-slate-400">
            Troque o vídeo ou a foto da <strong>Cena #{activeSceneIndex + 1} ({currentScene.title})</strong> enviando um arquivo ou colando um link web:
          </div>

          {/* PASTE VIDEO URL FORM */}
          <form onSubmit={handleApplyVideoUrl} className="p-4 rounded-xl border border-amber-500/40 bg-amber-500/10 space-y-2">
            <div className="text-xs font-bold text-white flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Video className="w-4 h-4 text-amber-400" />
                <span>Cole o Link de um Vídeo Web (.MP4)</span>
              </span>
              <span className="text-[10px] text-amber-300">Formato Vídeo</span>
            </div>
            <input
              type="url"
              placeholder="https://meu-servidor.com/video-comida.mp4"
              value={videoUrlInput}
              onChange={(e) => setVideoUrlInput(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
            />
            <button
              type="submit"
              className="w-full py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-colors flex items-center justify-center gap-1.5"
            >
              <Check className="w-4 h-4" /> Aplicar Vídeo na Cena
            </button>
          </form>

          {/* PASTE IMAGE URL FORM */}
          <form onSubmit={handleApplyImageUrl} className="p-4 rounded-xl border border-slate-800 bg-slate-950/80 space-y-2">
            <div className="text-xs font-bold text-white flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4 text-slate-400" />
                <span>Cole o Link de uma Imagem Web (.JPG / .PNG)</span>
              </span>
              <span className="text-[10px] text-slate-400">Formato Imagem</span>
            </div>
            <input
              type="url"
              placeholder="https://meu-servidor.com/foto-comida.jpg"
              value={imageUrlInput}
              onChange={(e) => setImageUrlInput(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
            />
            <button
              type="submit"
              className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition-colors flex items-center justify-center gap-1.5"
            >
              <Check className="w-4 h-4" /> Aplicar Foto na Cena
            </button>
          </form>
        </div>
      )}

      {/* TAB CONTENT 3: BROADCAST EFFECTS */}
      {selectedTab === 'effects' && (
        <div className="space-y-4">
          {/* WATERMARK STATUS BANNER */}
          <div className="p-3.5 rounded-xl border border-amber-500/40 bg-amber-500/10 flex items-center justify-between gap-3 shadow-md">
            <div className="flex items-center gap-3">
              <div className="bg-slate-950/80 p-2 rounded-xl border border-slate-800 shadow">
                <img
                  src="/assets/aistudio/Logo_GuaraFood_white_outline_transparent.png"
                  alt="Logo GuaraFood (Branco & Laranja)"
                  className="h-7 w-auto object-contain"
                />
              </div>
              <div className="text-xs">
                <span className="font-extrabold text-white block">Marca d'Água Branca & Laranja</span>
                <span className="text-[10px] text-amber-300">Contornos vermelhos substituídos por branco luminoso</span>
              </div>
            </div>
            <span className="text-[10px] font-extrabold px-2.5 py-1 rounded-lg bg-amber-500 text-slate-950 uppercase tracking-wider">
              Ativa 100%
            </span>
          </div>

          <div className="text-xs text-slate-400">
            Efeitos visuais de iluminação e vinheta profissional de transmissão de televisão:
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {particleThemeOptions.map((theme) => {
              const isSelected = currentScene?.particleTheme === theme.value;
              return (
                <button
                  key={theme.value}
                  onClick={() =>
                    onUpdateScene(activeSceneIndex, {
                      ...currentScene,
                      particleTheme: theme.value,
                    })
                  }
                  className={`flex items-start gap-3 p-3.5 rounded-xl border text-left transition-all ${
                    isSelected
                      ? 'bg-amber-500/15 border-amber-500 text-white ring-1 ring-amber-500'
                      : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <Tv className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <div className="text-xs font-bold text-white font-heading">{theme.label}</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      {theme.desc}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
