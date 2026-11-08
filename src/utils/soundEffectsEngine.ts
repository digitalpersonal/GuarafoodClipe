/**
 * Procedural Web Audio Sound Effects Engine for GuaraFood Commercials
 * Ultra-lightweight (0 KB assets downloaded, synthesized purely in Web Audio API).
 * Supports both live preview during video playback and offline buffer mixing for video rendering.
 */

import { SFXType, SoundEffectCue } from '../types/clip';

let sharedAudioCtx: AudioContext | null = null;

export function getSharedAudioContext(): AudioContext {
  if (!sharedAudioCtx || sharedAudioCtx.state === 'closed') {
    const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    sharedAudioCtx = new AudioCtxClass();
  }
  if (sharedAudioCtx.state === 'suspended') {
    sharedAudioCtx.resume().catch(() => {});
  }
  return sharedAudioCtx;
}

/**
 * Procedurally generates an AudioBuffer for a given sound effect type.
 * Works seamlessly with both online AudioContext and OfflineAudioContext.
 */
export function generateSFXBuffer(
  ctx: BaseAudioContext,
  type: SFXType,
  duration: number = 2.5,
  volume: number = 0.8
): AudioBuffer {
  const sampleRate = ctx.sampleRate;
  const numSamples = Math.max(1024, Math.floor(sampleRate * duration));
  const buffer = ctx.createBuffer(2, numSamples, sampleRate);
  const left = buffer.getChannelData(0);
  const right = buffer.getChannelData(1);

  const vol = Math.max(0.01, Math.min(1.0, volume)) * 0.45;

  switch (type) {
    case 'sizzle':
    case 'grill-sear': {
      // Hot griddle / frying oil sizzle: stochastic crackles + bandpassed thermal noise
      let b0 = 0, b1 = 0, b2 = 0; // Pink noise state
      const isSear = type === 'grill-sear';

      for (let i = 0; i < numSamples; i++) {
        const t = i / sampleRate;

        // Envelope
        const fadeIn = Math.min(1, t / (isSear ? 0.08 : 0.15));
        const fadeOut = Math.min(1, (duration - t) / 0.3);
        const env = fadeIn * fadeOut;

        // Generate pink noise base
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        const pink = b0 + b1 + b2 + white * 0.5362;

        // High frequency crackle pops (micro-bursts simulating oil droplets)
        const isPop = Math.random() < (isSear ? 0.07 : 0.045);
        const pop = isPop ? (Math.random() * 2 - 1) * 2.2 : 0;

        // Subtle steam hiss mod
        const hissMod = 0.75 + 0.25 * Math.sin(t * 12.0) * Math.sin(t * 4.3);

        const sample = (pink * 0.25 + pop + white * 0.18) * env * vol * hissMod * 0.7;

        // Slight stereo spread
        left[i] = sample * (1 + (Math.random() - 0.5) * 0.2);
        right[i] = sample * (1 + (Math.random() - 0.5) * 0.2);
      }
      break;
    }

    case 'glass-clink': {
      // Crystal glass clink: inharmonic glass modes + transient click
      const f1 = 2280; // Main glass bell mode (Hz)
      const f2 = 3180; // Inharmonic ring
      const f3 = 4560; // Upper overtone
      const f4 = 6320; // High sheen

      for (let i = 0; i < numSamples; i++) {
        const t = i / sampleRate;

        // Attack click
        const click = t < 0.003 ? (Math.random() * 2 - 1) * Math.exp(-t * 2000) * 1.5 : 0;

        // Resonant ring decays
        const ring1 = Math.sin(2 * Math.PI * f1 * t) * Math.exp(-t * 3.8);
        const ring2 = Math.sin(2 * Math.PI * f2 * t + 0.5) * Math.exp(-t * 4.4) * 0.65;
        const ring3 = Math.sin(2 * Math.PI * f3 * t + 1.2) * Math.exp(-t * 6.2) * 0.35;
        const ring4 = Math.sin(2 * Math.PI * f4 * t) * Math.exp(-t * 9.0) * 0.15;

        // Stereo phase offset for pristine spatial width
        const sampleL = (click * 0.4 + ring1 + ring2 + ring3 + ring4) * vol * 0.65;
        const sampleR = (click * 0.4 + ring1 + ring2 * 1.1 + ring3 * 0.9 - ring4 * 0.5) * vol * 0.65;

        left[i] = sampleL;
        right[i] = sampleR;
      }
      break;
    }

    case 'restaurant-ambience': {
      // Warm room acoustics: filtered low rumble + distant gentle cutlery touches
      let rumbleFilter = 0;
      for (let i = 0; i < numSamples; i++) {
        const t = i / sampleRate;

        // Ambient room tone
        const white = Math.random() * 2 - 1;
        rumbleFilter = rumbleFilter * 0.96 + white * 0.04;

        // Cutlery touches at specific moments (t = 0.5s, 1.4s, 2.1s)
        let cutlery = 0;
        const cutleryTimes = [0.45, 1.35, 2.15];
        for (const ct of cutleryTimes) {
          if (t >= ct && t < ct + 0.4) {
            const dt = t - ct;
            const tapFreq = 3400 + (ct * 300) % 800;
            cutlery += Math.sin(2 * Math.PI * tapFreq * dt) * Math.exp(-dt * 24.0) * 0.28;
          }
        }

        const fadeIn = Math.min(1, t / 0.4);
        const fadeOut = Math.min(1, (duration - t) / 0.5);
        const env = fadeIn * fadeOut;

        const base = (rumbleFilter * 0.35 + cutlery + white * 0.02) * env * vol * 0.7;
        left[i] = base * 0.9;
        right[i] = base * 1.05;
      }
      break;
    }

    case 'order-bell': {
      // Reception / order notification desk bell (C6 1046Hz + overtones)
      const b1 = 1046;
      const b2 = 2093;
      const b3 = 3135;

      for (let i = 0; i < numSamples; i++) {
        const t = i / sampleRate;
        const transient = t < 0.005 ? (Math.random() * 2 - 1) * Math.exp(-t * 1200) : 0;
        const ring1 = Math.sin(2 * Math.PI * b1 * t) * Math.exp(-t * 2.2);
        const ring2 = Math.sin(2 * Math.PI * b2 * t) * Math.exp(-t * 3.5) * 0.55;
        const ring3 = Math.sin(2 * Math.PI * b3 * t) * Math.exp(-t * 5.0) * 0.25;

        const sample = (transient * 0.5 + ring1 + ring2 + ring3) * vol * 0.6;
        left[i] = sample;
        right[i] = sample;
      }
      break;
    }

    case 'drink-fizz': {
      // Cold beverage effervescence / ice fizz
      let b0 = 0;
      for (let i = 0; i < numSamples; i++) {
        const t = i / sampleRate;
        const white = Math.random() * 2 - 1;
        // High-pass behavior
        b0 = white - b0 * 0.85;

        const isBubble = Math.random() < 0.08;
        const bubble = isBubble ? (Math.random() * 2 - 1) * 1.5 : 0;

        const fadeIn = Math.min(1, t / 0.2);
        const fadeOut = Math.min(1, (duration - t) / 0.3);
        const env = fadeIn * fadeOut;

        const sample = (b0 * 0.22 + bubble * 0.4) * env * vol * 0.65;
        left[i] = sample;
        right[i] = sample * (1 + (Math.random() - 0.5) * 0.3);
      }
      break;
    }

    default: {
      for (let i = 0; i < numSamples; i++) {
        left[i] = 0;
        right[i] = 0;
      }
    }
  }

  return buffer;
}

/**
 * Triggers an immediate playback of a sound effect in the user's active AudioContext.
 */
export async function playLiveSFX(
  type: SFXType,
  customCtx?: AudioContext | null,
  volume: number = 0.8,
  duration: number = 2.5
): Promise<void> {
  const ctx = customCtx || getSharedAudioContext();
  if (ctx.state === 'suspended') {
    await ctx.resume().catch(() => {});
  }

  const buffer = generateSFXBuffer(ctx, type, duration, volume);
  const source = ctx.createBufferSource();
  source.buffer = buffer;

  const gain = ctx.createGain();
  gain.gain.value = volume;

  source.connect(gain);
  gain.connect(ctx.destination);

  source.start(0);
}

/**
 * Metadata descriptor for each SFX sound category
 */
export interface SFXDescriptor {
  type: SFXType;
  label: string;
  category: 'cozinha' | 'bebidas' | 'ambiente' | 'sistema';
  icon: string;
  description: string;
  defaultDuration: number;
  recommendedScene: string;
}

export const SFX_DESCRIPTORS: Record<SFXType, SFXDescriptor> = {
  sizzle: {
    type: 'sizzle',
    label: 'Fritura na Chapa',
    category: 'cozinha',
    icon: '🔥',
    description: 'Chiado característico do smash burger ou pastel fritando com óleo quente',
    defaultDuration: 3.0,
    recommendedScene: 'Smash Burger Fritando na Chapa / Pastéis Dourados',
  },
  'grill-sear': {
    type: 'grill-sear',
    label: 'Carne Selando no Fogo',
    category: 'cozinha',
    icon: '🥩',
    description: 'Prensada forte na chapa com fumaça e estalo de calor intenso',
    defaultDuration: 2.5,
    recommendedScene: 'Hambúrguer na Chapa / Cozinha Profissional',
  },
  'glass-clink': {
    type: 'glass-clink',
    label: 'Vidros Tilintando / Brinde',
    category: 'ambiente',
    icon: '🥂',
    description: 'Som nítido e cristalino de copos e garrafas se tocando em comemoração',
    defaultDuration: 2.0,
    recommendedScene: 'Galera Rindo e Comendo Pizza / Brinde com Refrigerante',
  },
  'restaurant-ambience': {
    type: 'restaurant-ambience',
    label: 'Ambiente de Restaurante',
    category: 'ambiente',
    icon: '🍽️',
    description: 'Burburinho acolhedor de salão, murmúrio suave e toques leves de talheres',
    defaultDuration: 3.5,
    recommendedScene: 'Restaurante Aconchegante / Encontro com Amigos',
  },
  'order-bell': {
    type: 'order-bell',
    label: 'Ding do Pedido / Sino',
    category: 'sistema',
    icon: '🛎️',
    description: 'Sino metálico dourado de pedido pronto ou notificação de entrega',
    defaultDuration: 1.8,
    recommendedScene: 'Bateu a Fome no Celular / Parceiro em Destaque',
  },
  'drink-fizz': {
    type: 'drink-fizz',
    label: 'Gás & Refrescância',
    category: 'bebidas',
    icon: '🥤',
    description: 'Borbulhas de refrigerante com gelo ou refrescância imediata de açaí',
    defaultDuration: 2.5,
    recommendedScene: 'Açaí Gelado / Refrigerante com Gás',
  },
};
