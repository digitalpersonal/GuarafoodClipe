import React, { useState, useRef } from 'react';
import {
  X,
  Share2,
  Download,
  Copy,
  Check,
  Video,
  Sparkles,
  Play,
  RotateCcw,
  MessageCircle,
  Instagram,
  Music2,
  Facebook,
  Monitor,
  Smartphone,
  Square,
  Film,
  FileCheck,
  Flame,
} from 'lucide-react';
import { AspectRatioMode, VideoScene, LyricLine, PartnerRestaurant, SoundEffectCue } from '../types/clip';
import { renderFinalCommercialVideo, RenderProgress, RenderResult } from '../utils/videoRenderer';

interface ShareExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  aspectRatio: AspectRatioMode;
  onAspectRatioChange?: (ratio: AspectRatioMode) => void;
  scenes: VideoScene[];
  lyrics: LyricLine[];
  partners: PartnerRestaurant[];
  audioUrl: string;
  duration: number;
  sfxCues?: SoundEffectCue[];
}

export const ShareExportModal: React.FC<ShareExportModalProps> = ({
  isOpen,
  onClose,
  aspectRatio,
  onAspectRatioChange,
  scenes,
  lyrics,
  partners,
  audioUrl,
  duration,
  sfxCues = [],
}) => {
  const [selectedRatio, setSelectedRatio] = useState<AspectRatioMode>(aspectRatio);
  const [includeSubtitles, setIncludeSubtitles] = useState(true);
  const [includeSfx, setIncludeSfx] = useState(true);
  const [isRendering, setIsRendering] = useState(false);
  const [renderProgress, setRenderProgress] = useState<RenderProgress | null>(null);
  const [renderResult, setRenderResult] = useState<RenderResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [copied, setCopied] = useState(false);
  const [captionCopied, setCaptionCopied] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState<'whatsapp' | 'instagram' | 'tiktok' | 'facebook'>('whatsapp');

  const previewCanvasRef = useRef<HTMLCanvasElement | null>(null);

  if (!isOpen) return null;

  const currentUrl = window.location.href;
  const shareTitle = 'GuaraFood — O Comercial de TV da Nossa Cidade!';
  const promoCaption = `🍔 Chegou o GuaraFood! O app de delivery oficial de Guaranésia. Peça hambúrgueres artesanais, pizzas no forno a lenha, açaí e pastéis com entrega rápida! 🍕🍧\n\nAssista ao comercial oficial de TV: ${currentUrl}\n\n#GuaraFood #DeliveryGuaranesia #ComidaBoa #ComercialDeTV #SaborLocal`;

  const handleRatioSelect = (ratio: AspectRatioMode) => {
    setSelectedRatio(ratio);
    if (onAspectRatioChange) {
      onAspectRatioChange(ratio);
    }
  };

  const handleStartRender = async () => {
    setIsRendering(true);
    setRenderResult(null);
    setErrorMessage(null);
    setRenderProgress({
      percent: 1,
      currentSecond: 0,
      totalSeconds: duration || 67,
      sceneIndex: 1,
      sceneTitle: 'Iniciando motor de renderização...',
      statusText: 'Preparando canvas, fotografias e áudio...',
    });

    try {
      const result = await renderFinalCommercialVideo({
        scenes,
        lyrics,
        partners,
        audioUrl,
        duration: duration || 67,
        aspectRatio: selectedRatio,
        showSubtitles: includeSubtitles,
        sfxCues: includeSfx ? sfxCues : [],
        onProgress: (progress) => {
          setRenderProgress(progress);
        },
        previewCanvas: previewCanvasRef.current,
      });

      setRenderResult(result);
      setIsRendering(false);

      // Auto-trigger download
      triggerDownload(result.videoUrl, result.filename);
    } catch (err: unknown) {
      console.error('Erro na renderização:', err);
      const msg = err instanceof Error ? err.message : 'Falha ao processar vídeo';
      setErrorMessage(`Ocorreu um erro ao renderizar: ${msg}`);
      setIsRendering(false);
    }
  };

  const triggerDownload = (url: string, filename: string) => {
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleShareWhatsApp = () => {
    const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(promoCaption)}`;
    window.open(waUrl, '_blank');
  };

  const handleShareFacebook = () => {
    const fbUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(currentUrl)}&quote=${encodeURIComponent(shareTitle)}`;
    window.open(fbUrl, '_blank');
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(currentUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleCopyCaption = () => {
    navigator.clipboard.writeText(promoCaption);
    setCaptionCopied(true);
    setTimeout(() => setCaptionCopied(false), 2500);
  };

  const handleNativeShare = async () => {
    if (typeof navigator !== 'undefined' && 'share' in navigator) {
      try {
        await navigator.share({
          title: shareTitle,
          text: promoCaption,
          url: currentUrl,
        });
      } catch {
        // Ignored
      }
    } else {
      handleCopyLink();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 max-w-xl w-full shadow-2xl space-y-4 my-auto animate-in fade-in zoom-in duration-200 max-h-[92vh] overflow-y-auto custom-scrollbar">
        {/* HEADER */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Video className="w-5 h-5 text-amber-500" />
            <h3 className="text-base sm:text-lg font-bold text-white font-heading">
              Renderizar e Baixar Vídeo Comercial Final
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* FORMAT / ASPECT RATIO SELECTOR */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-slate-300">
            1. Escolha o Formato do Vídeo Final:
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <button
              disabled={isRendering}
              onClick={() => handleRatioSelect('16:9')}
              className={`p-2.5 rounded-xl border text-left flex flex-col gap-1 transition-all ${
                selectedRatio === '16:9'
                  ? 'bg-amber-500/15 border-amber-500 text-white font-bold ring-1 ring-amber-500/40'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center gap-1.5 text-xs text-amber-400">
                <Monitor className="w-3.5 h-3.5" />
                <span>TV / YouTube</span>
              </div>
              <span className="text-[10px] text-slate-400">16:9 (1920x1080)</span>
            </button>

            <button
              disabled={isRendering}
              onClick={() => handleRatioSelect('9:16')}
              className={`p-2.5 rounded-xl border text-left flex flex-col gap-1 transition-all ${
                selectedRatio === '9:16'
                  ? 'bg-amber-500/15 border-amber-500 text-white font-bold ring-1 ring-amber-500/40'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center gap-1.5 text-xs text-amber-400">
                <Smartphone className="w-3.5 h-3.5" />
                <span>Reels / TikTok</span>
              </div>
              <span className="text-[10px] text-slate-400">9:16 (1080x1920)</span>
            </button>

            <button
              disabled={isRendering}
              onClick={() => handleRatioSelect('1:1')}
              className={`p-2.5 rounded-xl border text-left flex flex-col gap-1 transition-all ${
                selectedRatio === '1:1'
                  ? 'bg-amber-500/15 border-amber-500 text-white font-bold ring-1 ring-amber-500/40'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center gap-1.5 text-xs text-amber-400">
                <Square className="w-3.5 h-3.5" />
                <span>Feed Quadrado</span>
              </div>
              <span className="text-[10px] text-slate-400">1:1 (1080x1080)</span>
            </button>

            <button
              disabled={isRendering}
              onClick={() => handleRatioSelect('21:9')}
              className={`p-2.5 rounded-xl border text-left flex flex-col gap-1 transition-all ${
                selectedRatio === '21:9'
                  ? 'bg-amber-500/15 border-amber-500 text-white font-bold ring-1 ring-amber-500/40'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center gap-1.5 text-xs text-amber-400">
                <Film className="w-3.5 h-3.5" />
                <span>Cinema Scope</span>
              </div>
              <span className="text-[10px] text-slate-400">21:9 (Ultrawide)</span>
            </button>
          </div>
        </div>

        {/* SUBTITLES TOGGLE */}
        <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
          <div className="text-xs">
            <span className="font-bold text-white block">Gravar Legendas Sincronizadas no Vídeo</span>
            <span className="text-[10px] text-slate-400">Inclui letras em tipografia oficial de TV no rodapé</span>
          </div>
          <input
            type="checkbox"
            checked={includeSubtitles}
            onChange={(e) => setIncludeSubtitles(e.target.checked)}
            disabled={isRendering}
            className="w-4 h-4 accent-amber-500 cursor-pointer"
          />
        </div>

        {/* SFX SOUND EFFECTS TOGGLE */}
        <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
          <div className="text-xs">
            <span className="font-bold text-white flex items-center gap-1.5">
              <span>Incluir Efeitos Sonoros Realistas (SFX)</span>
              <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 text-[10px] font-extrabold">
                {sfxCues.filter(c => c.enabled).length} ativos
              </span>
            </span>
            <span className="text-[10px] text-slate-400">
              Mixa sons de fritura, vidros tilintando, ambiente de restaurante e sinos no áudio final
            </span>
          </div>
          <input
            type="checkbox"
            checked={includeSfx}
            onChange={(e) => setIncludeSfx(e.target.checked)}
            disabled={isRendering}
            className="w-4 h-4 accent-amber-500 cursor-pointer"
          />
        </div>

        {/* MAIN RENDER ENGINE CARD */}
        <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
          {isRendering ? (
            <div className="py-2 space-y-3 text-center">
              <div className="flex items-center justify-between text-xs font-bold text-amber-400">
                <span className="flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 animate-spin" />
                  <span>{renderProgress?.statusText || 'Processando cenas...'}</span>
                </span>
                <span className="font-mono text-white text-sm">{renderProgress?.percent || 0}%</span>
              </div>

              {/* PROGRESS BAR */}
              <div className="w-full bg-slate-900 rounded-full h-3 overflow-hidden border border-slate-800">
                <div
                  className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-400 h-full rounded-full transition-all duration-150 shadow-md shadow-amber-500/30"
                  style={{ width: `${renderProgress?.percent || 0}%` }}
                />
              </div>

              {/* LIVE RENDER PREVIEW CANVAS */}
              <div className="relative mx-auto rounded-xl overflow-hidden border border-amber-500/30 bg-black aspect-video max-w-[280px] shadow-lg">
                <canvas ref={previewCanvasRef} className="w-full h-full object-contain" />
                <div className="absolute bottom-1 left-2 text-[9px] font-mono text-amber-300 bg-slate-950/80 px-1.5 py-0.5 rounded">
                  {renderProgress?.currentSecond}s / {renderProgress?.totalSeconds}s
                </div>
              </div>

              <p className="text-[11px] text-slate-400">
                Combinando 17 cenas fotográficas, movimentos dinâmicos, marca d'água 2026 e trilha sonora em alta definição...
              </p>
            </div>
          ) : renderResult ? (
            <div className="py-2 space-y-3">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300">
                <div className="p-2 rounded-xl bg-emerald-500 text-slate-950">
                  <FileCheck className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-extrabold uppercase tracking-wide">
                    Vídeo Renderizado com Sucesso!
                  </div>
                  <div className="text-xs text-white font-mono truncate">
                    {renderResult.filename} ({(renderResult.videoBlob.size / (1024 * 1024)).toFixed(1)} MB)
                  </div>
                </div>
              </div>

              {/* FINISHED VIDEO PREVIEW PLAYER */}
              <div className="relative rounded-2xl overflow-hidden border border-slate-800 bg-black aspect-video shadow-xl">
                <video
                  src={renderResult.videoUrl}
                  controls
                  playsInline
                  className="w-full h-full object-contain"
                />
              </div>

              {/* ACTION BUTTONS */}
              <div className="flex flex-col sm:flex-row gap-2 pt-1">
                <button
                  onClick={() => triggerDownload(renderResult.videoUrl, renderResult.filename)}
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2 active:scale-95"
                >
                  <Download className="w-4 h-4" />
                  <span>Baixar Arquivo de Vídeo Pronto</span>
                </button>

                <button
                  onClick={handleStartRender}
                  className="px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs transition-colors flex items-center justify-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Renderizar Novamente</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-extrabold text-white font-heading">
                    Combinar Cenas, Transições e Trilha Sonora
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Gera um arquivo de vídeo independente para postar no Instagram, YouTube, TV e WhatsApp.
                  </div>
                </div>
              </div>

              {errorMessage && (
                <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs">
                  {errorMessage}
                </div>
              )}

              <button
                onClick={handleStartRender}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-sm shadow-xl shadow-amber-500/25 transition-all flex items-center justify-center gap-2 active:scale-95 cursor-pointer uppercase tracking-wider"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>RENDERIZAR E GERAR VÍDEO COMPLETO AGORA</span>
              </button>
            </div>
          )}
        </div>

        {/* SOCIAL SHARING SECTION */}
        <div className="space-y-2 pt-2 border-t border-slate-800">
          <label className="block text-xs font-bold text-slate-300">
            2. Compartilhar Comercial nas Redes:
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <button
              onClick={handleShareWhatsApp}
              className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 hover:bg-emerald-500/20 text-emerald-400 font-bold transition-all group active:scale-95"
            >
              <MessageCircle className="w-5 h-5 mb-1 text-emerald-400 group-hover:scale-110 transition-transform" />
              <span className="text-xs">WhatsApp</span>
            </button>

            <button
              onClick={() => setSelectedPlatform('instagram')}
              className={`flex flex-col items-center justify-center p-2.5 rounded-xl border font-bold transition-all group active:scale-95 ${
                selectedPlatform === 'instagram'
                  ? 'bg-pink-500/20 border-pink-500 text-pink-300'
                  : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
              }`}
            >
              <Instagram className="w-5 h-5 mb-1 text-pink-400 group-hover:scale-110 transition-transform" />
              <span className="text-xs">Instagram</span>
            </button>

            <button
              onClick={() => setSelectedPlatform('tiktok')}
              className={`flex flex-col items-center justify-center p-2.5 rounded-xl border font-bold transition-all group active:scale-95 ${
                selectedPlatform === 'tiktok'
                  ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300'
                  : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
              }`}
            >
              <Music2 className="w-5 h-5 mb-1 text-cyan-400 group-hover:scale-110 transition-transform" />
              <span className="text-xs">TikTok</span>
            </button>

            <button
              onClick={handleShareFacebook}
              className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/30 hover:bg-blue-500/20 text-blue-400 font-bold transition-all group active:scale-95"
            >
              <Facebook className="w-5 h-5 mb-1 text-blue-400 group-hover:scale-110 transition-transform" />
              <span className="text-xs">Facebook</span>
            </button>
          </div>
        </div>

        {/* NATIVE SYSTEM SHARE SHEET BUTTON */}
        {typeof navigator !== 'undefined' && 'share' in navigator && (
          <button
            onClick={handleNativeShare}
            className="w-full py-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-700 text-white font-bold text-xs transition-colors flex items-center justify-center gap-2"
          >
            <Share2 className="w-4 h-4 text-amber-400" />
            <span>Compartilhar via Menu do Celular</span>
          </button>
        )}

        {/* PROMO CAPTION & HASHTAGS COPY BOX */}
        <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
          <div className="flex items-center justify-between text-xs font-bold text-slate-300">
            <span>Legenda Pronta para Redes Sociais:</span>
            <button
              onClick={handleCopyCaption}
              className="text-[11px] font-semibold text-amber-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              {captionCopied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" /> Copiada!
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" /> Copiar Legenda
                </>
              )}
            </button>
          </div>
          <p className="text-[11px] text-slate-400 font-mono bg-slate-900/90 p-2 rounded-lg leading-relaxed max-h-20 overflow-y-auto">
            {promoCaption}
          </p>
        </div>

        {/* DIRECT LINK COPY */}
        <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
          <input
            type="text"
            readOnly
            value={currentUrl}
            className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 font-mono focus:outline-none"
          />
          <button
            onClick={handleCopyLink}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs transition-colors flex items-center gap-1.5 shrink-0"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" /> Copiado!
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" /> Copiar Link
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
