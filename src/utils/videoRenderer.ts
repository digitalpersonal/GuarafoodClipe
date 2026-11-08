import { VideoScene, LyricLine, PartnerRestaurant, AspectRatioMode, SoundEffectCue } from '../types/clip';
import { generateSFXBuffer } from './soundEffectsEngine';

export interface RenderProgress {
  percent: number;
  currentSecond: number;
  totalSeconds: number;
  sceneIndex: number;
  sceneTitle: string;
  statusText: string;
}

export interface RenderResult {
  videoBlob: Blob;
  videoUrl: string;
  filename: string;
  mimeType: string;
  duration: number;
}

// Helper to determine best supported MediaRecorder MIME type
export function getSupportedMimeType(): string {
  if (typeof MediaRecorder === 'undefined') return '';
  const types = [
    'video/webm;codecs=vp9,opus',
    'video/webm;codecs=vp8,opus',
    'video/webm',
    'video/mp4;codecs=avc1,mp4a.40.2',
    'video/mp4',
  ];
  for (const t of types) {
    if (MediaRecorder.isTypeSupported(t)) {
      return t;
    }
  }
  return '';
}

// Preload an image URL into HTMLImageElement
function preloadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => {
      // Return a 1x1 fallback canvas if image fails to load
      const fallback = new Image();
      fallback.src = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=';
      resolve(fallback);
    };
    img.src = src;
  });
}

export async function renderFinalCommercialVideo({
  scenes,
  lyrics,
  partners,
  audioUrl,
  duration,
  aspectRatio = '16:9',
  showSubtitles = true,
  sfxCues = [],
  onProgress,
  previewCanvas,
}: {
  scenes: VideoScene[];
  lyrics: LyricLine[];
  partners: PartnerRestaurant[];
  audioUrl: string;
  duration: number;
  aspectRatio?: AspectRatioMode;
  showSubtitles?: boolean;
  sfxCues?: SoundEffectCue[];
  onProgress: (p: RenderProgress) => void;
  previewCanvas?: HTMLCanvasElement | null;
}): Promise<RenderResult> {
  // Determine dimensions based on selected aspect ratio
  let width = 1920;
  let height = 1080;
  if (aspectRatio === '9:16') {
    width = 1080;
    height = 1920;
  } else if (aspectRatio === '1:1') {
    width = 1080;
    height = 1080;
  } else if (aspectRatio === '21:9') {
    width = 1920;
    height = 820;
  }

  // Pre-load all scene images in parallel
  onProgress({
    percent: 3,
    currentSecond: 0,
    totalSeconds: duration,
    sceneIndex: 0,
    sceneTitle: 'Carregando imagens em alta definição...',
    statusText: 'Pré-carregando fotografias profissionais das 17 cenas...',
  });

  const [watermarkImg, ...loadedImages] = await Promise.all([
    preloadImage('/assets/aistudio/Logo_GuaraFood_2026_transparent.png'),
    ...scenes.map((s) => preloadImage(s.imageSrc)),
  ]);

  // Set up offscreen canvas
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d', { alpha: false });
  if (!ctx) throw new Error('Não foi possível inicializar o canvas 2D');

  // Set up Web Audio
  const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  const audioCtx = new AudioContextClass();
  const dest = audioCtx.createMediaStreamDestination();

  // Load and decode audio buffer
  onProgress({
    percent: 8,
    currentSecond: 0,
    totalSeconds: duration,
    sceneIndex: 0,
    sceneTitle: 'Decodificando trilha sonora e efeitos SFX...',
    statusText: 'Carregando áudio oficial e gerando efeitos sonoros realistas...',
  });

  let audioSource: AudioBufferSourceNode | null = null;
  try {
    const response = await fetch(audioUrl);
    const arrayBuffer = await response.arrayBuffer();
    const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
    audioSource = audioCtx.createBufferSource();
    audioSource.buffer = audioBuffer;
    audioSource.connect(dest);
  } catch (err) {
    console.warn('Audio decoding failed, proceeding with silent audio:', err);
  }

  // Prepare and synthesize enabled SFX sources
  const enabledCues = (sfxCues || []).filter((c) => c.enabled);
  const sfxSources: { src: AudioBufferSourceNode; timeMark: number; name: string }[] = [];

  for (const cue of enabledCues) {
    try {
      const sfxBuffer = generateSFXBuffer(audioCtx, cue.type, cue.duration, cue.volume);
      const sfxSource = audioCtx.createBufferSource();
      sfxSource.buffer = sfxBuffer;
      const sfxGain = audioCtx.createGain();
      sfxGain.gain.value = cue.volume;
      sfxSource.connect(sfxGain);
      sfxGain.connect(dest);
      sfxSources.push({ src: sfxSource, timeMark: cue.timeMark, name: cue.name });
    } catch (e) {
      console.warn('Could not synthesize SFX for render:', cue.name, e);
    }
  }

  // Combine canvas video stream + audio stream
  const canvasStream = canvas.captureStream(30);
  const audioTracks = dest.stream.getAudioTracks();
  if (audioTracks.length > 0) {
    canvasStream.addTrack(audioTracks[0]);
  }

  const mimeType = getSupportedMimeType() || 'video/webm';
  const recorder = new MediaRecorder(canvasStream, {
    mimeType,
    videoBitsPerSecond: 6_000_000, // 6 Mbps for crisp 1080p
  });

  const chunks: Blob[] = [];
  recorder.ondataavailable = (e) => {
    if (e.data && e.data.size > 0) {
      chunks.push(e.data);
    }
  };

  const recordingPromise = new Promise<Blob>((resolve) => {
    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: mimeType });
      resolve(blob);
    };
  });

  // Start recording and audio
  recorder.start(250);
  const startAudioTime = audioCtx.currentTime;
  if (audioSource) {
    audioSource.start(startAudioTime);
  }

  // Schedule all SFX sources relative to startAudioTime
  for (const sfx of sfxSources) {
    try {
      sfx.src.start(startAudioTime + Math.max(0, sfx.timeMark));
    } catch (err) {
      console.warn('Error starting SFX source:', sfx.name, err);
    }
  }

  const fps = 30;
  const totalFrames = Math.max(1, Math.round(duration * fps));
  const frameIntervalMs = 1000 / fps;

  // Render frame by frame
  for (let frame = 0; frame <= totalFrames; frame++) {
    const currentTime = frame / fps;

    // Find active scene
    const sceneIndex = scenes.findIndex(
      (s) => currentTime >= s.startTime && currentTime <= s.endTime
    );
    const currentSceneIdx = sceneIndex !== -1 ? sceneIndex : Math.min(scenes.length - 1, Math.floor((currentTime / duration) * scenes.length));
    const scene = scenes[currentSceneIdx] || scenes[0];
    const img = loadedImages[currentSceneIdx] || loadedImages[0];

    const sceneDuration = Math.max(0.1, scene.endTime - scene.startTime);
    const sceneProgress = Math.min(1, Math.max(0, (currentTime - scene.startTime) / sceneDuration));

    // Calculate motion / transform for current scene
    ctx.save();
    ctx.fillStyle = '#020617';
    ctx.fillRect(0, 0, width, height);

    // Apply Ken Burns / Transition transform
    let scale = 1.05;
    let translateX = 0;
    let translateY = 0;
    let opacity = 1.0;

    switch (scene.transitionType) {
      case 'zoom':
        scale = 1.05 + 0.15 * sceneProgress;
        translateY = -15 * sceneProgress;
        break;
      case 'fast-zoom':
        scale = 1.02 + 0.32 * Math.pow(sceneProgress, 1.2);
        break;
      case 'pan-left':
        scale = 1.15;
        translateX = 40 * (1 - 2 * sceneProgress);
        break;
      case 'pan-right':
        scale = 1.15;
        translateX = -40 * (1 - 2 * sceneProgress);
        break;
      case 'whip-pan':
      case 'glitch':
        scale = 1.12;
        translateX = -70 * (1 - sceneProgress);
        break;
      case 'fade':
        scale = 1.05 + 0.08 * sceneProgress;
        if (sceneProgress < 0.2) {
          opacity = sceneProgress / 0.2;
        } else if (sceneProgress > 0.85) {
          opacity = (1 - sceneProgress) / 0.15;
        }
        break;
      case 'pulse':
      case 'rotate':
      default:
        scale = 1.08 + 0.08 * Math.sin(sceneProgress * Math.PI);
        break;
    }

    ctx.globalAlpha = opacity;
    ctx.translate(width / 2, height / 2);
    ctx.scale(scale, scale);
    ctx.translate(-width / 2 + translateX, -height / 2 + translateY);

    // Draw background cover image
    if (img && img.width > 0) {
      const imgRatio = img.width / img.height;
      const canvasRatio = width / height;
      let drawW = width;
      let drawH = height;
      let drawX = 0;
      let drawY = 0;

      if (imgRatio > canvasRatio) {
        drawH = height;
        drawW = height * imgRatio;
        drawX = (width - drawW) / 2;
      } else {
        drawW = width;
        drawH = width / imgRatio;
        drawY = (height - drawH) / 2;
      }
      ctx.drawImage(img, drawX, drawY, drawW, drawH);
    }
    ctx.restore();

    // 2. Cinematic vignette & bottom gradient for lyrics readability
    const grad = ctx.createLinearGradient(0, height * 0.55, 0, height);
    grad.addColorStop(0, 'rgba(2, 6, 23, 0)');
    grad.addColorStop(0.7, 'rgba(2, 6, 23, 0.7)');
    grad.addColorStop(1, 'rgba(2, 6, 23, 0.95)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, height * 0.55, width, height * 0.45);

    // Top subtle bar gradient for watermark contrast
    const topGrad = ctx.createLinearGradient(0, 0, 0, height * 0.2);
    topGrad.addColorStop(0, 'rgba(2, 6, 23, 0.75)');
    topGrad.addColorStop(1, 'rgba(2, 6, 23, 0)');
    ctx.fillStyle = topGrad;
    ctx.fillRect(0, 0, width, height * 0.2);

    // 3. Draw GuaraFood 2026 Watermark in top right
    if (watermarkImg && watermarkImg.width > 0) {
      const wmWidth = Math.round(width * 0.18);
      const wmHeight = Math.round(wmWidth * (watermarkImg.height / watermarkImg.width));
      const wmX = width - wmWidth - Math.round(width * 0.03);
      const wmY = Math.round(height * 0.03);

      ctx.save();
      ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
      ctx.shadowBlur = 12;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 4;
      ctx.drawImage(watermarkImg, wmX, wmY, wmWidth, wmHeight);
      ctx.restore();
    }

    // 4. Draw active partner spotlight badge if partner is mentioned
    const activePartner = partners.find(
      (p) => currentTime >= p.timeMark && currentTime < p.timeMark + 2.5
    );
    if (activePartner) {
      const badgeY = height * 0.12;
      ctx.save();
      ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 3;
      const badgeW = width * 0.55;
      const badgeH = 70;
      const badgeX = (width - badgeW) / 2;
      
      // Rounded rect
      ctx.beginPath();
      ctx.roundRect(badgeX, badgeY, badgeW, badgeH, 20);
      ctx.fill();
      ctx.stroke();

      // Text inside badge
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 24px "Outfit", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`${activePartner.icon} ${activePartner.name} · ${activePartner.discountBadge}`, width / 2, badgeY + badgeH / 2);
      ctx.restore();
    }

    // 5. Draw synchronized lyric karaoke text at the bottom
    if (showSubtitles) {
      const activeLyric = lyrics.find(
        (l) => currentTime >= l.startTime && currentTime <= l.endTime
      );
      if (activeLyric) {
        ctx.save();
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';

        // Tag (Section: REFRÃO, PARCEIROS, etc.)
        const tagText = activeLyric.section === 'chorus' ? '🔥 REFRÃO' : activeLyric.section === 'partners' ? '⭐ PARCEIROS' : '🎵 GUARAFOOD';
        ctx.font = 'bold 18px "Outfit", sans-serif';
        ctx.fillStyle = '#fbbf24';
        ctx.fillText(tagText, width / 2, height - 90);

        // Main Lyric Text
        ctx.font = '900 36px "Outfit", sans-serif';
        ctx.shadowColor = 'rgba(0, 0, 0, 0.95)';
        ctx.shadowBlur = 14;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 4;
        ctx.fillStyle = '#ffffff';
        ctx.fillText(activeLyric.text, width / 2, height - 40);
        ctx.restore();
      }
    }

    // Update real-time progress preview canvas if provided
    if (previewCanvas) {
      const pCtx = previewCanvas.getContext('2d');
      if (pCtx) {
        previewCanvas.width = 320;
        previewCanvas.height = Math.round(320 * (height / width));
        pCtx.drawImage(canvas, 0, 0, previewCanvas.width, previewCanvas.height);
      }
    }

    // Update progress state
    const progressPercent = Math.min(99, Math.round(10 + (frame / totalFrames) * 88));
    onProgress({
      percent: progressPercent,
      currentSecond: Math.round(currentTime),
      totalSeconds: duration,
      sceneIndex: currentSceneIdx + 1,
      sceneTitle: scene.title,
      statusText: `Renderizando cena #${currentSceneIdx + 1}: ${scene.title}`,
    });

    // Pause briefly to give the recorder and browser ticks time to process
    await new Promise((resolve) => setTimeout(resolve, frameIntervalMs));
  }

  // Stop recording
  onProgress({
    percent: 99,
    currentSecond: duration,
    totalSeconds: duration,
    sceneIndex: scenes.length,
    sceneTitle: 'Finalizando codificação de vídeo...',
    statusText: 'Empacotando arquivo final de vídeo em alta definição...',
  });

  if (audioSource) {
    try {
      audioSource.stop();
    } catch {
      // Ignore
    }
  }
  recorder.stop();
  audioCtx.close().catch(() => {});

  const videoBlob = await recordingPromise;
  const videoUrl = URL.createObjectURL(videoBlob);
  const ext = mimeType.includes('mp4') ? 'mp4' : 'webm';
  const filename = `guarafood_comercial_oficial_2026_${aspectRatio.replace(':', 'x')}.${ext}`;

  onProgress({
    percent: 100,
    currentSecond: duration,
    totalSeconds: duration,
    sceneIndex: scenes.length,
    sceneTitle: 'Vídeo Comercial Pronto!',
    statusText: 'Renderização 100% concluída!',
  });

  return {
    videoBlob,
    videoUrl,
    filename,
    mimeType,
    duration,
  };
}
