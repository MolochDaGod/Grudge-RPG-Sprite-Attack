import { useState, useEffect, useRef, useCallback } from 'react';
import { CharacterSprite, SpriteAnimation, getSpriteUrl } from '@/lib/spriteManifest';

export interface SpriteColorTints {
  hueRotate?: number;
  saturate?: number;
  brightness?: number;
}

interface SpriteAnimatorProps {
  character: CharacterSprite;
  animation: string;
  scale?: number;
  fps?: number;
  playing?: boolean;
  showDebug?: boolean;
  colorTints?: SpriteColorTints;
  onAnimationEnd?: () => void;
}

export function SpriteAnimator({
  character,
  animation,
  scale = 2,
  fps = 10,
  playing = true,
  showDebug = false,
  colorTints,
  onAnimationEnd
}: SpriteAnimatorProps) {
  const [currentFrame, setCurrentFrame] = useState(0);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 });
  const animationRef = useRef<number>(0);
  const lastFrameTimeRef = useRef<number>(0);
  const preloadRef = useRef<HTMLImageElement | null>(null);
  
  const animData = character.animations[animation];
  const spriteUrl = getSpriteUrl(character, animation);
  
  const frameWidth = animData?.frameWidth || 100;
  const frameHeight = animData?.frameHeight || 100;
  const totalFrames = animData?.frames || 6;
  const isLooping = animData?.loop ?? true;
  
  useEffect(() => {
    setCurrentFrame(0);
    setImageLoaded(false);
    setImageError(false);
    setImageDimensions({ width: 0, height: 0 });
    
    const img = new Image();
    preloadRef.current = img;
    
    img.onload = () => {
      setImageLoaded(true);
      setImageDimensions({ width: img.naturalWidth, height: img.naturalHeight });
    };
    
    img.onerror = () => {
      setImageError(true);
      console.warn(`Failed to load sprite: ${spriteUrl}`);
    };
    
    img.src = spriteUrl;
    
    return () => {
      if (preloadRef.current) {
        preloadRef.current.onload = null;
        preloadRef.current.onerror = null;
      }
    };
  }, [character.id, animation, spriteUrl]);
  
  const animate = useCallback((timestamp: number) => {
    if (!playing || !animData) {
      animationRef.current = requestAnimationFrame(animate);
      return;
    }
    
    const frameDuration = 1000 / fps;
    
    if (timestamp - lastFrameTimeRef.current >= frameDuration) {
      lastFrameTimeRef.current = timestamp;
      
      setCurrentFrame(prev => {
        const nextFrame = prev + 1;
        if (nextFrame >= totalFrames) {
          if (isLooping) {
            return 0;
          } else {
            onAnimationEnd?.();
            return prev;
          }
        }
        return nextFrame;
      });
    }
    
    animationRef.current = requestAnimationFrame(animate);
  }, [playing, fps, totalFrames, isLooping, animData, onAnimationEnd]);
  
  useEffect(() => {
    if (imageLoaded && playing) {
      lastFrameTimeRef.current = performance.now();
      animationRef.current = requestAnimationFrame(animate);
    }
    return () => cancelAnimationFrame(animationRef.current);
  }, [imageLoaded, playing, animate]);
  
  const displayWidth = frameWidth * scale;
  const displayHeight = frameHeight * scale;
  
  if (!animData) {
    return (
      <div 
        className="flex items-center justify-center bg-muted/50 rounded"
        style={{ width: displayWidth, height: displayHeight }}
      >
        <span className="text-xs text-muted-foreground">No anim</span>
      </div>
    );
  }
  
  if (imageError) {
    return (
      <div 
        className="flex flex-col items-center justify-center bg-destructive/20 rounded p-1"
        style={{ width: displayWidth, height: displayHeight }}
      >
        <span className="text-xs text-destructive">Failed</span>
        {showDebug && (
          <span className="text-[8px] text-destructive/70 truncate max-w-full px-1">
            {spriteUrl.split('/').pop()}
          </span>
        )}
      </div>
    );
  }
  
  const sheetWidth = frameWidth * totalFrames;
  const sheetHeight = frameHeight;
  const bgPositionX = -(currentFrame * frameWidth * scale);
  
  const filterParts: string[] = [];
  if (colorTints) {
    if (colorTints.hueRotate !== undefined && colorTints.hueRotate !== 0) {
      filterParts.push(`hue-rotate(${colorTints.hueRotate}deg)`);
    }
    if (colorTints.saturate !== undefined && colorTints.saturate !== 100) {
      filterParts.push(`saturate(${colorTints.saturate}%)`);
    }
    if (colorTints.brightness !== undefined && colorTints.brightness !== 100) {
      filterParts.push(`brightness(${colorTints.brightness}%)`);
    }
  }
  const filterStyle = filterParts.length > 0 ? filterParts.join(' ') : undefined;
  
  return (
    <div 
      className="relative"
      style={{ 
        width: displayWidth, 
        height: displayHeight,
      }}
      data-testid={`sprite-${character.id}-${animation}`}
    >
      <div
        style={{
          width: displayWidth,
          height: displayHeight,
          backgroundImage: `url(${spriteUrl})`,
          backgroundPosition: `${bgPositionX}px 0px`,
          backgroundSize: `${sheetWidth * scale}px ${sheetHeight * scale}px`,
          backgroundRepeat: 'no-repeat',
          imageRendering: 'pixelated',
          filter: filterStyle,
        }}
      />
      {!imageLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted/50">
          <span className="text-xs text-muted-foreground">...</span>
        </div>
      )}
      {showDebug && imageLoaded && (
        <div className="absolute -bottom-4 left-0 right-0 text-center">
          <span className="text-[8px] text-muted-foreground">
            {imageDimensions.width}x{imageDimensions.height} | F{currentFrame + 1}/{totalFrames}
          </span>
        </div>
      )}
    </div>
  );
}

interface SpritePreviewCardProps {
  character: CharacterSprite;
  selectedAnimation: string;
  onAnimationChange: (anim: string) => void;
  showDebug?: boolean;
}

export function SpritePreviewCard({ 
  character, 
  selectedAnimation, 
  onAnimationChange,
  showDebug = false 
}: SpritePreviewCardProps) {
  const animationKeys = Object.keys(character.animations);
  const hasAnimation = character.animations[selectedAnimation] !== undefined;
  const effectiveAnimation = hasAnimation ? selectedAnimation : animationKeys[0] || 'idle';
  
  return (
    <div className="flex flex-col gap-2 p-4 bg-card rounded-lg border" data-testid={`card-sprite-${character.id}`}>
      <h3 className="font-semibold text-sm">{character.name}</h3>
      
      <div className="flex justify-center py-2 bg-slate-800 rounded min-h-[80px]">
        <SpriteAnimator 
          character={character} 
          animation={effectiveAnimation}
          scale={1.5}
          fps={8}
          showDebug={showDebug}
        />
      </div>
      
      <div className="flex flex-wrap gap-1">
        {animationKeys.slice(0, 6).map(animKey => {
          const anim = character.animations[animKey];
          return (
            <button
              key={animKey}
              onClick={() => onAnimationChange(animKey)}
              className={`px-2 py-0.5 text-xs rounded transition-colors ${
                effectiveAnimation === animKey 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-muted hover:bg-muted/80'
              } ${anim.isEffect ? 'border border-orange-500/50' : ''} ${anim.isProjectile ? 'border border-blue-500/50' : ''}`}
              data-testid={`button-anim-${character.id}-${animKey}`}
            >
              {animKey}
            </button>
          );
        })}
        {animationKeys.length > 6 && (
          <span className="px-2 py-0.5 text-xs text-muted-foreground">
            +{animationKeys.length - 6}
          </span>
        )}
      </div>
    </div>
  );
}

interface EffectAnimatorProps {
  effectPath: string;
  frames: number;
  frameWidth?: number;
  frameHeight?: number;
  scale?: number;
  fps?: number;
  loop?: boolean;
  onComplete?: () => void;
}

export function EffectAnimator({
  effectPath,
  frames,
  frameWidth = 100,
  frameHeight = 100,
  scale = 2,
  fps = 12,
  loop = false,
  onComplete
}: EffectAnimatorProps) {
  const [currentFrame, setCurrentFrame] = useState(0);
  const [imageLoaded, setImageLoaded] = useState(false);
  const animationRef = useRef<number>(0);
  const lastFrameTimeRef = useRef<number>(0);
  
  useEffect(() => {
    setCurrentFrame(0);
    setImageLoaded(false);
    
    const img = new Image();
    img.onload = () => setImageLoaded(true);
    img.src = effectPath;
  }, [effectPath]);
  
  const animate = useCallback((timestamp: number) => {
    const frameDuration = 1000 / fps;
    
    if (timestamp - lastFrameTimeRef.current >= frameDuration) {
      lastFrameTimeRef.current = timestamp;
      
      setCurrentFrame(prev => {
        const nextFrame = prev + 1;
        if (nextFrame >= frames) {
          if (loop) {
            return 0;
          } else {
            onComplete?.();
            return prev;
          }
        }
        return nextFrame;
      });
    }
    
    animationRef.current = requestAnimationFrame(animate);
  }, [fps, frames, loop, onComplete]);
  
  useEffect(() => {
    if (imageLoaded) {
      lastFrameTimeRef.current = performance.now();
      animationRef.current = requestAnimationFrame(animate);
    }
    return () => cancelAnimationFrame(animationRef.current);
  }, [imageLoaded, animate]);
  
  const displayWidth = frameWidth * scale;
  const displayHeight = frameHeight * scale;
  const sheetWidth = frameWidth * frames;
  const bgPositionX = -(currentFrame * frameWidth * scale);
  
  if (!imageLoaded) {
    return null;
  }
  
  return (
    <div
      style={{
        width: displayWidth,
        height: displayHeight,
        backgroundImage: `url(${effectPath})`,
        backgroundPosition: `${bgPositionX}px 0px`,
        backgroundSize: `${sheetWidth * scale}px ${displayHeight}px`,
        backgroundRepeat: 'no-repeat',
        imageRendering: 'pixelated',
      }}
    />
  );
}
