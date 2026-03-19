import { useEffect, useRef, useState, useCallback } from 'react';
import * as PIXI from 'pixi.js';
import { getHeroById, getSpriteUrl } from '@shared/spriteUUIDs';
import type { Race, HeroClass } from '@shared/spriteUUIDs';

interface SpritePreviewProps {
  race: Race;
  heroClass: HeroClass;
  animation?: string;
  width?: number;
  height?: number;
  scale?: number;
  className?: string;
}

export function SpritePreview({
  race,
  heroClass,
  animation = 'idle',
  width = 400,
  height = 400,
  scale = 4,
  className = '',
}: SpritePreviewProps) {
  const [canvasContainer, setCanvasContainer] = useState<HTMLDivElement | null>(null);
  const appRef = useRef<PIXI.Application | null>(null);
  const [loading, setLoading] = useState(true);
  const [key, setKey] = useState(0);

  const containerCallback = useCallback((node: HTMLDivElement | null) => {
    setCanvasContainer(node);
  }, []);

  useEffect(() => {
    if (!canvasContainer) return;

    let mounted = true;
    let app: PIXI.Application | null = null;
    let isDestroying = false;
    
    const cleanup = () => {
      mounted = false;
      if (app && !isDestroying) {
        isDestroying = true;
        const appToDestroy = app;
        app = null;
        appRef.current = null;

        // Stop the ticker to cancel future RAFs, override render to
        // absorb any in-flight RAF that was already dequeued by the browser.
        try { appToDestroy.render = () => {}; } catch (e) {}
        try { appToDestroy.ticker.stop(); } catch (e) {}

        // Remove canvas from DOM immediately so nothing is visible.
        try {
          (appToDestroy.canvas as HTMLCanvasElement | null)
            ?.parentNode?.removeChild(appToDestroy.canvas as HTMLCanvasElement);
        } catch (e) {}

        // Wait two animation frames: the first lets any in-flight RAF
        // complete (render is now a no-op), the second guarantees the
        // stopped ticker won't fire again, then we destroy safely.
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            try {
              appToDestroy.destroy(true, { children: true, texture: true });
            } catch (e) {}
          });
        });
      }
    };

    const initApp = async () => {
      try {
        app = new PIXI.Application();
        
        await app.init({
          width,
          height,
          backgroundAlpha: 0,
          antialias: true,
        });

        if (!mounted) {
          cleanup();
          return;
        }

        while (canvasContainer.firstChild) {
          canvasContainer.removeChild(canvasContainer.firstChild);
        }
        
        canvasContainer.appendChild(app.canvas as HTMLCanvasElement);
        appRef.current = app;
        
        await loadSprite(app);
      } catch (err) {
        console.warn('Failed to init PIXI app:', err);
        setLoading(false);
      }
    };

    const loadSprite = async (pixiApp: PIXI.Application) => {
      if (!mounted || !pixiApp.stage) {
        setLoading(false);
        return;
      }

      const heroId = `${race}-${heroClass}`;
      const heroSprite = getHeroById(heroId);

      if (!heroSprite) {
        createPlaceholder(pixiApp);
        setLoading(false);
        return;
      }

      const spriteUrl = getSpriteUrl(heroSprite, animation);
      if (!spriteUrl) {
        createPlaceholder(pixiApp);
        setLoading(false);
        return;
      }

      try {
        const publicUrl = spriteUrl.replace('dist/sprites/', '/sprites/');
        const baseTexture = await PIXI.Assets.load(publicUrl);
        
        if (!mounted || !pixiApp.stage) {
          setLoading(false);
          return;
        }
        
        const anim = heroSprite.animations[animation];
        if (!anim) {
          throw new Error('Animation not found');
        }

        const frames: PIXI.Texture[] = [];
        const frameWidth = heroSprite.spriteSize;
        const frameHeight = heroSprite.spriteSize;
        
        for (let i = 0; i < anim.frames; i++) {
          const rect = new PIXI.Rectangle(
            i * frameWidth,
            0,
            frameWidth,
            frameHeight
          );
          const frameTexture = new PIXI.Texture({
            source: baseTexture.source,
            frame: rect
          });
          frames.push(frameTexture);
        }

        if (!mounted || !pixiApp.stage) {
          setLoading(false);
          return;
        }

        const animatedSprite = new PIXI.AnimatedSprite(frames);
        animatedSprite.animationSpeed = (anim.fps || 8) / 60;
        animatedSprite.loop = anim.loop ?? true;
        animatedSprite.anchor.set(0.5, 0.5);
        animatedSprite.x = width / 2;
        animatedSprite.y = height / 2;
        animatedSprite.scale.set(scale);
        animatedSprite.play();

        pixiApp.stage.addChild(animatedSprite);
        setLoading(false);
      } catch (err) {
        console.warn(`Failed to load sprite for ${heroId}:`, err);
        if (mounted && pixiApp.stage) {
          createPlaceholder(pixiApp);
        }
        setLoading(false);
      }
    };

    const createPlaceholder = (pixiApp: PIXI.Application) => {
      if (!pixiApp.stage) return;
      
      const placeholder = new PIXI.Graphics();
      placeholder.fill({ color: 0x333355 });
      placeholder.roundRect(width / 2 - 30, height / 2 - 35, 60, 70, 6);
      placeholder.fill();
      
      placeholder.fill({ color: 0xffffff, alpha: 0.5 });
      placeholder.circle(width / 2 - 10, height / 2 - 18, 4);
      placeholder.circle(width / 2 + 10, height / 2 - 18, 4);
      placeholder.fill();

      const text = new PIXI.Text({
        text: `${race.charAt(0).toUpperCase()}${heroClass.charAt(0).toUpperCase()}`,
        style: { 
          fontSize: Math.min(18, width / 5), 
          fill: 0xffffff,
          fontWeight: 'bold'
        }
      });
      text.anchor.set(0.5);
      text.x = width / 2;
      text.y = height / 2 + 8;
      
      pixiApp.stage.addChild(placeholder);
      pixiApp.stage.addChild(text);
    };

    initApp();

    return cleanup;
  }, [canvasContainer, race, heroClass, animation, width, height, scale]);

  useEffect(() => {
    setKey(k => k + 1);
    setLoading(true);
  }, [race, heroClass]);

  return (
    <div 
      className={`relative ${className}`}
      style={{ width, height }}
      data-testid={`sprite-preview-${race}-${heroClass}`}
    >
      <div 
        key={key}
        ref={containerCallback}
        style={{ width, height, position: 'absolute', top: 0, left: 0 }}
      />
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted/30 rounded pointer-events-none">
          <div className="text-muted-foreground text-xs">
            {race.charAt(0).toUpperCase()}{heroClass.charAt(0).toUpperCase()}
          </div>
        </div>
      )}
    </div>
  );
}
