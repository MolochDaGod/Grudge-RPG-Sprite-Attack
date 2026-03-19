import type { HeroSprite, SpriteAnimation, Race, HeroClass } from '@shared/spriteUUIDs';

interface PuterKV {
  get: (key: string) => Promise<unknown>;
  set: (key: string, value: unknown) => Promise<void>;
  list: (options?: { prefix?: string }) => Promise<{ key: string; value: unknown }[]>;
  del: (key: string) => Promise<void>;
}

interface PuterAuth {
  signIn: () => Promise<{ username: string }>;
  signOut: () => Promise<void>;
  getUser: () => Promise<{ username: string } | null>;
  isSignedIn: () => boolean;
}

interface PuterAI {
  txt2img: (prompt: string) => Promise<Blob>;
  chat: (prompt: string) => Promise<string>;
}

interface PuterInstance {
  kv: PuterKV;
  auth: PuterAuth;
  ai: PuterAI;
}

function getPuter(): PuterInstance | undefined {
  return (window as unknown as { puter?: PuterInstance }).puter;
}

const API_BASE = '/api/sprites';

export interface SpriteAPIResponse<T> {
  success: boolean;
  error?: string;
  [key: string]: any;
}

export interface HeroSummary {
  id: string;
  race: Race;
  heroClass: HeroClass;
  spriteSize: number;
  folder: string;
  animationCount: number;
  hasEffects: boolean;
  hasProjectiles: boolean;
}

export interface UUIDLookupResult {
  uuid: string;
  found: boolean;
  heroId?: string;
  race?: Race;
  heroClass?: HeroClass;
  type?: 'animation' | 'effect' | 'projectile';
  animation?: SpriteAnimation;
  spriteUrl?: string;
  spriteSize?: number;
}

export const spriteAPI = {
  async getAllHeroes(): Promise<HeroSummary[]> {
    const res = await fetch(`${API_BASE}/heroes`);
    const data = await res.json();
    if (!data.success) throw new Error(data.error || 'Failed to fetch heroes');
    return data.heroes;
  },

  async getHeroById(id: string): Promise<HeroSprite> {
    const res = await fetch(`${API_BASE}/heroes/${id}`);
    const data = await res.json();
    if (!data.success) throw new Error(data.error || 'Hero not found');
    return data.hero;
  },

  async getHeroesByRace(race: Race): Promise<HeroSprite[]> {
    const res = await fetch(`${API_BASE}/race/${race}`);
    const data = await res.json();
    if (!data.success) throw new Error(data.error || 'Failed to fetch heroes');
    return data.heroes;
  },

  async getHeroesByClass(heroClass: HeroClass): Promise<HeroSprite[]> {
    const res = await fetch(`${API_BASE}/class/${heroClass}`);
    const data = await res.json();
    if (!data.success) throw new Error(data.error || 'Failed to fetch heroes');
    return data.heroes;
  },

  async getAnimationByUUID(uuid: string): Promise<UUIDLookupResult> {
    const res = await fetch(`${API_BASE}/uuid/${uuid}`);
    const data = await res.json();
    if (!data.success) {
      return { uuid, found: false };
    }
    return {
      uuid,
      found: true,
      heroId: data.heroId,
      race: data.race,
      heroClass: data.heroClass,
      type: data.type,
      animation: data.animation,
      spriteUrl: data.spriteUrl,
      spriteSize: data.spriteSize
    };
  },

  async getAllUUIDs(): Promise<string[]> {
    const res = await fetch(`${API_BASE}/uuids`);
    const data = await res.json();
    if (!data.success) throw new Error(data.error || 'Failed to fetch UUIDs');
    return data.uuids;
  },

  async getSpriteUrl(heroId: string, animationKey: string): Promise<string> {
    const res = await fetch(`${API_BASE}/url/${heroId}/${animationKey}`);
    const data = await res.json();
    if (!data.success) throw new Error(data.error || 'Sprite not found');
    return data.spriteUrl;
  },

  async batchLookup(uuids: string[]): Promise<UUIDLookupResult[]> {
    const res = await fetch(`${API_BASE}/batch-lookup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uuids })
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error || 'Batch lookup failed');
    return data.results;
  }
};

export const puterSpriteStorage = {
  isPuterAvailable(): boolean {
    return typeof window !== 'undefined' && !!getPuter();
  },

  async saveSprite(key: string, spriteData: string): Promise<void> {
    const puter = getPuter();
    if (!puter) {
      localStorage.setItem(`sprite_${key}`, spriteData);
      return;
    }
    await puter.kv.set(`sprite_${key}`, spriteData);
  },

  async loadSprite(key: string): Promise<string | null> {
    const puter = getPuter();
    if (!puter) {
      return localStorage.getItem(`sprite_${key}`);
    }
    const result = await puter.kv.get(`sprite_${key}`);
    return typeof result === 'string' ? result : null;
  },

  async listSprites(prefix?: string): Promise<string[]> {
    const puter = getPuter();
    if (!puter) {
      const keys: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith('sprite_')) {
          if (!prefix || key.includes(prefix)) {
            keys.push(key.replace('sprite_', ''));
          }
        }
      }
      return keys;
    }
    const items = await puter.kv.list({ prefix: `sprite_${prefix || ''}` });
    return items.map(item => item.key.replace('sprite_', ''));
  },

  async deleteSprite(key: string): Promise<void> {
    const puter = getPuter();
    if (!puter) {
      localStorage.removeItem(`sprite_${key}`);
      return;
    }
    await puter.kv.del(`sprite_${key}`);
  },

  async saveSpriteManifest(heroId: string, manifest: Record<string, unknown>): Promise<void> {
    const key = `manifest_${heroId}`;
    const data = JSON.stringify(manifest);
    const puter = getPuter();
    if (!puter) {
      localStorage.setItem(key, data);
      return;
    }
    await puter.kv.set(key, data);
  },

  async loadSpriteManifest(heroId: string): Promise<Record<string, unknown> | null> {
    const key = `manifest_${heroId}`;
    const puter = getPuter();
    if (!puter) {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    }
    const data = await puter.kv.get(key);
    return typeof data === 'string' ? JSON.parse(data) : null;
  }
};

export async function preloadSprites(heroIds: string[]): Promise<Map<string, HTMLImageElement>> {
  const sprites = new Map<string, HTMLImageElement>();
  
  const loadPromises = heroIds.map(async (heroId) => {
    try {
      const hero = await spriteAPI.getHeroById(heroId);
      
      for (const [animKey, anim] of Object.entries(hero.animations)) {
        const url = `${hero.folder}${anim.fileName}`;
        const img = new Image();
        img.src = url;
        
        await new Promise<void>((resolve, reject) => {
          img.onload = () => resolve();
          img.onerror = () => reject(new Error(`Failed to load: ${url}`));
        });
        
        sprites.set(`${heroId}_${animKey}`, img);
      }
    } catch (err) {
      console.warn(`Failed to preload sprites for ${heroId}:`, err);
    }
  });
  
  await Promise.all(loadPromises);
  return sprites;
}

export function createSpriteAnimator(
  spriteSheet: HTMLImageElement,
  frameWidth: number,
  frameHeight: number,
  frameCount: number,
  fps: number,
  loop: boolean
) {
  let currentFrame = 0;
  let elapsed = 0;
  const frameDuration = 1000 / fps;
  let isPlaying = false;
  let animationId: number | null = null;
  let lastTime = 0;
  let onComplete: (() => void) | null = null;

  const canvas = document.createElement('canvas');
  canvas.width = frameWidth;
  canvas.height = frameHeight;
  const ctx = canvas.getContext('2d')!;

  function render() {
    ctx.clearRect(0, 0, frameWidth, frameHeight);
    ctx.drawImage(
      spriteSheet,
      currentFrame * frameWidth, 0,
      frameWidth, frameHeight,
      0, 0,
      frameWidth, frameHeight
    );
  }

  function update(timestamp: number) {
    if (!isPlaying) return;

    const delta = timestamp - lastTime;
    lastTime = timestamp;
    elapsed += delta;

    if (elapsed >= frameDuration) {
      elapsed = 0;
      currentFrame++;

      if (currentFrame >= frameCount) {
        if (loop) {
          currentFrame = 0;
        } else {
          currentFrame = frameCount - 1;
          isPlaying = false;
          onComplete?.();
          return;
        }
      }

      render();
    }

    animationId = requestAnimationFrame(update);
  }

  return {
    canvas,
    play(callback?: () => void) {
      onComplete = callback || null;
      isPlaying = true;
      currentFrame = 0;
      elapsed = 0;
      lastTime = performance.now();
      render();
      animationId = requestAnimationFrame(update);
    },
    stop() {
      isPlaying = false;
      if (animationId) {
        cancelAnimationFrame(animationId);
        animationId = null;
      }
    },
    reset() {
      currentFrame = 0;
      elapsed = 0;
      render();
    },
    getFrame() {
      return currentFrame;
    },
    isAnimating() {
      return isPlaying;
    }
  };
}
