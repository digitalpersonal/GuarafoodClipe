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
    'video/mp4;codecs=avc1,mp4a.40.2',
    'video/mp4',
    'video/webm;codecs=vp9,opus',
    'video/webm;codecs=vp8,opus',
    'video/webm',
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
  subtitleOffset = 0,
  sfxOffset = 0,
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
  subtitleOffset?: number;
  sfxOffset?: number;
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

  // Pre-load all scene media (images and videos) in parallel with concurrency limits
  onProgress({
    percent: 3,
    currentSecond: 0,
    totalSeconds: duration,
    sceneIndex: 0,
    sceneTitle: 'Carregando mídias...',
    statusText: 'Preparando fotografias e vídeos...',
  });

  const mediaUrls = [
    '/assets/aistudio/Logo_GuaraFood_2026_transparent.png',
    ...scenes.map((s) => s.videoSrc || s.imageSrc)
  ];
  const mediaTypes = [
    'image',
    ...scenes.map((s) => (s.videoSrc ? 'video' : 'image'))
  ];

  const loadedMedia: (HTMLImageElement | HTMLVideoElement)[] = [];
  const BATCH_SIZE = 3;
  
  for (let i = 0; i < mediaUrls.length; i += BATCH_SIZE) {
    const batch = mediaUrls.slice(i, i + BATCH_SIZE);
    const types = mediaTypes.slice(i, i + BATCH_SIZE);
    
    const results = await Promise.all(batch.map((url, idx) => {
      return types[idx] === 'video' ? preloadVideo(url) : preloadImage(url);
    }));
    
    loadedMedia.push(...results);
    
    onProgress({
      percent: Math.round(3 + (Math.min(i + BATCH_SIZE, mediaUrls.length) / mediaUrls.length) * 10),
      currentSecond: 0,
      totalSeconds: duration,
      sceneIndex: 0,
      sceneTitle: 'Carregando mídias...',
      statusText: `Carregando ${Math.min(i + BATCH_SIZE, mediaUrls.length)} de ${mediaUrls.length} arquivos...`,
    });
  }

  const [watermarkImg, ...loadedScenesMedia] = loadedMedia;

// Preload a video URL into HTMLVideoElement with timeout
function preloadVideo(src: string): Promise<HTMLVideoElement> {
  return new Promise((resolve) => {
    const video = document.createElement('video');
    video.crossOrigin = 'anonymous';
    video.muted = true;
    video.playsInline = true;
    video.preload = 'auto';
    
    const timeout = setTimeout(() => resolve(video), 8000); // 8s timeout
    
    video.oncanplaythrough = () => {
      clearTimeout(timeout);
      resolve(video);
    };
    video.onerror = () => {
      clearTimeout(timeout);
      resolve(video); // Resolve anyway to not block rendering
    };
    video.src = src;
    video.load();
  });
}

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
    const musicGain = audioCtx.createGain();
    musicGain.gain.value = 0.85; // Slightly lower music to let SFX pop
    audioSource.connect(musicGain);
    musicGain.connect(dest);
  } catch (err) {
    console.warn('Audio decoding failed, proceeding with silent audio:', err);
  }

  // Prepare and synthesize enabled SFX sources
  const enabledCues = (sfxCues || []).filter((c) => c.enabled);
  const sfxSources: { src: AudioBufferSourceNode; timeMark: number; name: string }[] = [];

  for (const cue of enabledCues) {
    try {
      // Pass 1.0 to generate a normalized buffer, then scale with gain node below
      const sfxBuffer = generateSFXBuffer(audioCtx, cue.type, cue.duration, 1.0);
      const sfxSource = audioCtx.createBufferSource();
      sfxSource.buffer = sfxBuffer;
      const sfxGain = audioCtx.createGain();
      // Increase gain to ensure visibility in mix
      sfxGain.gain.value = cue.volume * 1.5; 
      sfxSource.connect(sfxGain);
      sfxGain.connect(dest);
      sfxSources.push({ src: sfxSource, timeMark: cue.timeMark + sfxOffset, name: cue.name });
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

  // Start recording
  recorder.start();
  const preRoll = 1.2; // 1.2s delay to ensure capture is ready
  const startAudioTime = audioCtx.currentTime + preRoll;
  
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

  // Master render loop tied to Audio Clock for perfect sync
  return new Promise<RenderResult>((resolve, reject) => {
    const renderStartTime = audioCtx.currentTime;
    const totalRenderDuration = duration + preRoll;

    const renderFrame = async () => {
      const elapsedTotal = audioCtx.currentTime - renderStartTime;
      const currentLoopTime = Math.max(0, elapsedTotal - preRoll);
      const isInPreRoll = elapsedTotal < preRoll;

      // 1. CLEAR & BACKGROUND
      ctx.save();
      ctx.fillStyle = '#020617';
      ctx.fillRect(0, 0, width, height);

      // Find active scene
      const sceneIndex = scenes.findIndex(
        (s) => currentLoopTime >= s.startTime && currentLoopTime <= s.endTime
      );
      const currentSceneIdx = sceneIndex !== -1 ? sceneIndex : Math.min(scenes.length - 1, Math.floor((currentLoopTime / duration) * scenes.length));
      const scene = scenes[currentSceneIdx] || scenes[0];
      const media = loadedMedia[currentSceneIdx] || loadedMedia[0];

      const sceneDuration = Math.max(0.1, scene.endTime - scene.startTime);
      const sceneProgress = isInPreRoll ? 0 : Math.min(1, Math.max(0, (currentLoopTime - scene.startTime) / sceneDuration));

      // Handle video sync with frame-wait logic for rendering
      if (media instanceof HTMLVideoElement && media.duration) {
        const targetTime = isInPreRoll ? 0 : sceneProgress * media.duration;
        // Only seek if significantly different to avoid excessive seeking overhead
        if (Math.abs(media.currentTime - targetTime) > 0.03) {
          media.currentTime = targetTime;
          // In a real render, we'd wait for 'seeked' event here. 
          // For now, we'll proceed as requestAnimationFrame usually gives enough buffer 
          // between frames at 30fps.
        }
      }

      // Ken Burns / Transition transform
      let scale = 1.05;
      let translateX = 0;
      let translateY = 0;
      let opacity = 1.0;

      // Only apply Ken Burns to static images, or if explicitly requested for video
      if (!(media instanceof HTMLVideoElement)) {
        switch (scene.transitionType) {
          case 'zoom':
            scale = 1.05 + 0.15 * sceneProgress;
            translateY = -15 * (height / 1080) * sceneProgress;
            break;
          case 'fast-zoom':
            scale = 1.02 + 0.32 * Math.pow(sceneProgress, 1.2);
            break;
          case 'pan-left':
            scale = 1.15;
            translateX = 40 * (width / 1920) * (1 - 2 * sceneProgress);
            break;
          case 'pan-right':
            scale = 1.15;
            translateX = -40 * (width / 1920) * (1 - 2 * sceneProgress);
            break;
          case 'whip-pan':
          case 'glitch':
            scale = 1.12;
            translateX = -70 * (width / 1920) * (1 - sceneProgress);
            break;
          case 'fade':
            scale = 1.05 + 0.08 * sceneProgress;
            if (sceneProgress < 0.2) opacity = sceneProgress / 0.2;
            else if (sceneProgress > 0.85) opacity = (1 - sceneProgress) / 0.15;
            break;
          case 'pulse':
          case 'rotate':
          default:
            scale = 1.08 + 0.08 * Math.sin(sceneProgress * Math.PI);
            break;
        }
      }

      ctx.globalAlpha = opacity;
      ctx.translate(width / 2, height / 2);
      ctx.scale(scale, scale);
      ctx.translate(-width / 2 + translateX, -height / 2 + translateY);

      if (media) {
        // media can be HTMLImageElement or HTMLVideoElement
        const mWidth = (media as any).videoWidth || (media as any).width;
        const mHeight = (media as any).videoHeight || (media as any).height;
        
        if (mWidth > 0) {
          const mediaRatio = mWidth / mHeight;
          const canvasRatio = width / height;
          let drawW, drawH, drawX, drawY;
          if (mediaRatio > canvasRatio) {
            drawH = height;
            drawW = height * mediaRatio;
            drawX = (width - drawW) / 2;
            drawY = 0;
          } else {
            drawW = width;
            drawH = width / mediaRatio;
            drawX = 0;
            drawY = (height - drawH) / 2;
          }
          ctx.drawImage(media, drawX, drawY, drawW, drawH);
        }
      }
      ctx.restore();

      // 2. VIGNETTE & GRADIENTS
      const grad = ctx.createLinearGradient(0, height * 0.55, 0, height);
      grad.addColorStop(0, 'rgba(2, 6, 23, 0)');
      grad.addColorStop(0.7, 'rgba(2, 6, 23, 0.7)');
      grad.addColorStop(1, 'rgba(2, 6, 23, 0.95)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, height * 0.55, width, height * 0.45);

      const topGrad = ctx.createLinearGradient(0, 0, 0, height * 0.2);
      topGrad.addColorStop(0, 'rgba(2, 6, 23, 0.75)');
      topGrad.addColorStop(1, 'rgba(2, 6, 23, 0)');
      ctx.fillStyle = topGrad;
      ctx.fillRect(0, 0, width, height * 0.2);

      // 3. WATERMARK
      if (watermarkImg && watermarkImg.width > 0) {
        const wmWidth = Math.round(width * 0.16);
        const wmHeight = Math.round(wmWidth * (watermarkImg.height / watermarkImg.width));
        const wmX = width - wmWidth - Math.round(width * 0.03);
        const wmY = Math.round(height * 0.03);
        ctx.save();
        ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
        ctx.shadowBlur = 12;
        ctx.drawImage(watermarkImg, wmX, wmY, wmWidth, wmHeight);
        ctx.restore();
      }

      // 4. PARTNER BADGE
      const adjustedTime = currentLoopTime - subtitleOffset;
      const activePartner = partners.find((p) => adjustedTime >= p.timeMark && adjustedTime < p.timeMark + 2.5);
      if (activePartner) {
        const badgeH = height * 0.04;
        const badgeW = width * 0.3; // Much smaller width
        const badgeY = height * 0.05; // Moved even higher
        const badgeX = width * 0.03;
        ctx.save();
        ctx.fillStyle = 'rgba(2, 6, 23, 0.7)';
        ctx.strokeStyle = 'rgba(245, 158, 11, 0.5)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(badgeX, badgeY, badgeW, badgeH, 8);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#ffffff';
        ctx.font = `bold ${Math.round(height * 0.016)}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`${activePartner.icon} ${activePartner.name.toUpperCase()}`, badgeX + badgeW/2, badgeY + badgeH / 2);
        ctx.restore();
      }

      // 5. SUBTITLES
      if (showSubtitles) {
        const adjustedTime = currentLoopTime - subtitleOffset;
        const activeLyric = lyrics.find((l) => adjustedTime >= l.startTime && adjustedTime <= l.endTime);
        if (activeLyric) {
          ctx.save();
          ctx.textAlign = 'center';
          ctx.textBaseline = 'bottom';
          const tagText = activeLyric.section === 'chorus' ? '🔥 REFRÃO' : activeLyric.section === 'partners' ? '⭐ PARCEIROS' : '🎵 GUARAFOOD';
          ctx.font = `bold ${Math.round(height * 0.016)}px "Outfit", sans-serif`;
          ctx.fillStyle = '#fbbf24';
          ctx.fillText(tagText, width / 2, height - (height * 0.18));
          
          const fontSize = Math.round(height * 0.034);
          ctx.font = `900 ${fontSize}px "Outfit", sans-serif`;
          ctx.shadowColor = 'rgba(0, 0, 0, 0.95)';
          ctx.shadowBlur = 14;
          ctx.fillStyle = '#ffffff';

          // Simple wrapping or scaling for narrow screens
          const maxWidth = width * 0.85;
          const metrics = ctx.measureText(activeLyric.text);
          if (metrics.width > maxWidth) {
            ctx.font = `900 ${Math.round(fontSize * (maxWidth / metrics.width))}px "Outfit", sans-serif`;
          }
          
          ctx.fillText(activeLyric.text, width / 2, height - (height * 0.12));
          ctx.restore();
        }
      }

      // 6. BOTTOM BANNER (guarafood.com.br)
      ctx.save();
      const bannerText = 'GUARAFOOD.COM.BR';
      const bannerFontSize = Math.round(height * 0.014); // Smaller
      ctx.font = `900 ${bannerFontSize}px "Outfit", sans-serif`;
      const textMetrics = ctx.measureText(bannerText);
      
      const bannerW = textMetrics.width + (width * 0.03);
      const bannerH = height * 0.03;
      const bannerX = (width - bannerW) / 2;
      const bannerY = height - bannerH - (height * 0.015);
      
      ctx.fillStyle = 'rgba(2, 6, 23, 0.7)';
      ctx.strokeStyle = 'rgba(245, 158, 11, 0.5)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(bannerX, bannerY, bannerW, bannerH, 8);
      ctx.fill();
      ctx.stroke();
      
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(bannerText, width / 2, bannerY + bannerH / 2);
      ctx.restore();

      // 7. FINAL FADE OUT (Last 1.5 seconds)
      const fadeOutStart = duration - 1.5;
      if (currentLoopTime > fadeOutStart) {
        const fadeOutProgress = (currentLoopTime - fadeOutStart) / 1.5;
        ctx.save();
        ctx.globalCompositeOperation = 'destination-out';
        ctx.fillStyle = `rgba(2, 6, 23, ${fadeOutProgress})`;
        ctx.fillRect(0, 0, width, height);
        ctx.restore();
      }

      // 8. PREVIEW & PROGRESS
      if (previewCanvas) {
        const pCtx = previewCanvas.getContext('2d');
        if (pCtx) {
          previewCanvas.width = 320;
          previewCanvas.height = Math.round(320 * (height / width));
          pCtx.drawImage(canvas, 0, 0, previewCanvas.width, previewCanvas.height);
        }
      }

      const progressPercent = Math.min(99, Math.round((elapsedTotal / totalRenderDuration) * 100));
      onProgress({
        percent: progressPercent,
        currentSecond: Math.round(currentLoopTime),
        totalSeconds: duration,
        sceneIndex: currentSceneIdx + 1,
        sceneTitle: scene.title,
        statusText: isInPreRoll ? 'Preparando abertura...' : `Renderizando: ${progressPercent}% (${Math.round(currentLoopTime)}s / ${Math.round(duration)}s)`,
      });

      if (elapsedTotal < totalRenderDuration) {
        requestAnimationFrame(renderFrame);
      } else {
        if (audioSource) { try { audioSource.stop(); } catch {} }
        recorder.stop();
        audioCtx.close().catch(() => {});
        recordingPromise.then((videoBlob) => {
          const videoUrl = URL.createObjectURL(videoBlob);
          const ext = mimeType.includes('mp4') ? 'mp4' : 'webm';
          const filename = `guarafood_comercial_2026_${aspectRatio.replace(':', 'x')}.${ext}`;
          onProgress({ percent: 100, currentSecond: duration, totalSeconds: duration, sceneIndex: scenes.length, sceneTitle: 'Pronto!', statusText: 'Download Liberado!' });
          resolve({ videoBlob, videoUrl, filename, mimeType, duration });
        }).catch(reject);
      }
    };
    requestAnimationFrame(renderFrame);
  });
}
