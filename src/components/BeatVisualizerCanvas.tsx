import React, { useEffect, useRef } from 'react';
import { OverlayEffectType } from '../types/clip';

interface BeatVisualizerCanvasProps {
  analyserNode: AnalyserNode | null;
  isPlaying: boolean;
  particleTheme: string;
  overlayEffect?: OverlayEffectType;
  intensity?: number;
}

// Embers & Dust Particle
interface FireEmber {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  maxAlpha: number;
  pulsePhase: number;
}

// Steam Wisp Particle
interface SteamWisp {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  growth: number;
  alpha: number;
  maxAlpha: number;
}

export const BeatVisualizerCanvas: React.FC<BeatVisualizerCanvasProps> = ({
  analyserNode,
  isPlaying,
  overlayEffect = 'master-tv',
  intensity = 1.0,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const embersRef = useRef<FireEmber[]>([]);
  const steamRef = useRef<SteamWisp[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;

    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Initialize Embers / Cinematic Dust
    const emberCount = Math.floor(45 * intensity);
    const emberColors = ['#f97316', '#ef4444', '#f59e0b', '#fbbf24', '#ffffff'];

    if (embersRef.current.length === 0 || embersRef.current.length !== emberCount) {
      embersRef.current = Array.from({ length: emberCount }).map(() => {
        const alpha = Math.random() * 0.6 + 0.2;
        return {
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          vx: (Math.random() - 0.5) * 1.5,
          vy: -Math.random() * 1.8 - 0.5,
          size: Math.random() * 3.5 + 1.2,
          color: emberColors[Math.floor(Math.random() * emberColors.length)],
          alpha,
          maxAlpha: alpha,
          pulsePhase: Math.random() * Math.PI * 2,
        };
      });
    }

    // Initialize Steam Wisps
    const steamCount = Math.floor(25 * intensity);
    if (steamRef.current.length === 0 || steamRef.current.length !== steamCount) {
      steamRef.current = Array.from({ length: steamCount }).map(() => {
        const maxAlpha = Math.random() * 0.18 + 0.05;
        return {
          x: Math.random() * canvas.width,
          y: canvas.height + Math.random() * 100,
          vx: (Math.random() - 0.5) * 0.8,
          vy: -Math.random() * 1.2 - 0.6,
          radius: Math.random() * 25 + 15,
          growth: Math.random() * 0.4 + 0.2,
          alpha: maxAlpha,
          maxAlpha,
        };
      });
    }

    const frequencyData = new Uint8Array(64);

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      let bassValue = 0.4;
      if (analyserNode && isPlaying) {
        analyserNode.getByteFrequencyData(frequencyData);
        let bassSum = 0;
        for (let i = 0; i < 8; i++) {
          bassSum += frequencyData[i];
        }
        bassValue = bassSum / (8 * 255);
      } else if (isPlaying) {
        bassValue = 0.4 + Math.sin(Date.now() / 300) * 0.25;
      }

      const activeEffect = overlayEffect;

      // 1. RENDER STEAM PARTICLES (Vapor de pratos quentes)
      if (activeEffect === 'steam' || activeEffect === 'master-tv') {
        steamRef.current.forEach((s) => {
          s.y += s.vy * (isPlaying ? 1.2 : 0.8);
          s.x += s.vx + Math.sin(s.y * 0.02) * 0.6;
          s.radius += s.growth;

          // Fade out as it rises
          const heightProgress = 1 - s.y / canvas.height;
          s.alpha = Math.max(0, s.maxAlpha * (1 - heightProgress));

          if (s.y < -50 || s.alpha <= 0) {
            s.y = canvas.height + Math.random() * 40;
            s.x = Math.random() * canvas.width;
            s.radius = Math.random() * 25 + 15;
            s.alpha = s.maxAlpha;
          }

          ctx.save();
          ctx.beginPath();
          ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
          const grad = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.radius);
          grad.addColorStop(0, `rgba(255, 255, 255, ${s.alpha})`);
          grad.addColorStop(0.6, `rgba(240, 240, 245, ${s.alpha * 0.5})`);
          grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
          ctx.fillStyle = grad;
          ctx.fill();
          ctx.restore();
        });
      }

      // 2. RENDER GLOWING EMBERS & CINEMATIC DUST (Brasas & Poeira 4K)
      if (
        activeEffect === 'embers' ||
        activeEffect === 'cinematic-dust' ||
        activeEffect === 'master-tv'
      ) {
        embersRef.current.forEach((p) => {
          const speed = isPlaying ? 1 + bassValue * 2 : 0.7;
          p.y += p.vy * speed;
          p.x += p.vx + Math.sin(p.pulsePhase + p.y * 0.03) * 0.8;
          p.pulsePhase += 0.05;

          // Pulse opacity on beat
          const pulse = Math.sin(p.pulsePhase) * 0.2;
          const currentAlpha = Math.min(1, Math.max(0.1, p.maxAlpha + pulse));

          if (p.y < -20) {
            p.y = canvas.height + 20;
            p.x = Math.random() * canvas.width;
          }

          ctx.save();
          ctx.globalAlpha = currentAlpha;

          if (activeEffect === 'cinematic-dust') {
            // Soft bokeh dust mote
            ctx.shadowColor = '#f59e0b';
            ctx.shadowBlur = isPlaying ? 10 : 4;
            ctx.fillStyle = '#fde047';
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size * 1.5, 0, Math.PI * 2);
            ctx.fill();
          } else {
            // Fiery Ember spark
            ctx.shadowColor = p.color;
            ctx.shadowBlur = isPlaying ? 15 * bassValue + 5 : 6;
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
          }

          ctx.restore();
        });
      }

      // 3. OPTIONAL CINEMATIC LENS FLARE ON HEAVY BASS
      if (isPlaying && bassValue > 0.52) {
        ctx.save();
        ctx.globalCompositeOperation = 'screen';
        const grad = ctx.createRadialGradient(
          canvas.width / 2,
          canvas.height / 3,
          0,
          canvas.width / 2,
          canvas.height / 3,
          bassValue * canvas.width * 0.28
        );
        grad.addColorStop(0, 'rgba(245, 158, 11, 0.2)');
        grad.addColorStop(0.7, 'rgba(239, 68, 68, 0.08)');
        grad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(canvas.width / 2, canvas.height / 3, bassValue * canvas.width * 0.28, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [analyserNode, isPlaying, overlayEffect, intensity]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none z-10"
    />
  );
};
