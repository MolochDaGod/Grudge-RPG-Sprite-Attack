import { useState, useEffect, useCallback, useMemo } from "react";

interface VisibilityAnimatorProps {
  src: string;
  columns: number;
  rows: number;
  frameCount: number;
  frameDuration: number;
  frameWidth: number;
  frameHeight: number;
  loop?: boolean;
  autoPlay?: boolean;
  onComplete?: () => void;
  className?: string;
  scale?: number;
}

export function VisibilityAnimator({
  src,
  columns,
  rows,
  frameCount,
  frameDuration,
  frameWidth,
  frameHeight,
  loop = false,
  autoPlay = true,
  onComplete,
  className = "",
  scale = 1,
}: VisibilityAnimatorProps) {
  const [currentFrame, setCurrentFrame] = useState(0);
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [isComplete, setIsComplete] = useState(false);

  const displayWidth = frameWidth * scale;
  const displayHeight = frameHeight * scale;

  const frames = useMemo(() => {
    const frameData: { x: number; y: number; index: number }[] = [];
    for (let i = 0; i < frameCount; i++) {
      const col = i % columns;
      const row = Math.floor(i / columns);
      frameData.push({
        x: col * frameWidth,
        y: row * frameHeight,
        index: i,
      });
    }
    return frameData;
  }, [columns, rows, frameCount, frameWidth, frameHeight]);

  const advanceFrame = useCallback(() => {
    setCurrentFrame((prev) => {
      const nextFrame = prev + 1;
      if (nextFrame >= frameCount) {
        if (loop) {
          return 0;
        } else {
          setIsComplete(true);
          setIsPlaying(false);
          return prev;
        }
      }
      return nextFrame;
    });
  }, [frameCount, loop]);

  useEffect(() => {
    if (!isPlaying || isComplete) return;

    const timer = setInterval(advanceFrame, frameDuration);
    return () => clearInterval(timer);
  }, [advanceFrame, frameDuration, isPlaying, isComplete]);

  useEffect(() => {
    if (isComplete && onComplete) {
      onComplete();
    }
  }, [isComplete, onComplete]);

  useEffect(() => {
    setCurrentFrame(0);
    setIsComplete(false);
    setIsPlaying(autoPlay);
  }, [src, autoPlay]);

  const play = () => {
    setCurrentFrame(0);
    setIsComplete(false);
    setIsPlaying(true);
  };

  const pause = () => setIsPlaying(false);
  const resume = () => setIsPlaying(true);

  return (
    <div
      className={`relative overflow-hidden ${className}`}
      style={{
        width: displayWidth,
        height: displayHeight,
      }}
      data-testid="visibility-animator"
    >
      {frames.map((frame) => (
        <div
          key={frame.index}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: displayWidth,
            height: displayHeight,
            backgroundImage: `url(${src})`,
            backgroundPosition: `-${frame.x * scale}px -${frame.y * scale}px`,
            backgroundSize: `${columns * displayWidth}px ${rows * displayHeight}px`,
            backgroundRepeat: "no-repeat",
            visibility: frame.index === currentFrame ? "visible" : "hidden",
          }}
          data-frame={frame.index}
        />
      ))}
    </div>
  );
}

interface PreloadedFrameAnimatorProps {
  frames: string[];
  frameDuration: number;
  size: number;
  loop?: boolean;
  autoPlay?: boolean;
  onComplete?: () => void;
  className?: string;
}

export function PreloadedFrameAnimator({
  frames,
  frameDuration,
  size,
  loop = false,
  autoPlay = true,
  onComplete,
  className = "",
}: PreloadedFrameAnimatorProps) {
  const [currentFrame, setCurrentFrame] = useState(0);
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [isComplete, setIsComplete] = useState(false);
  const [loadedFrames, setLoadedFrames] = useState<Set<number>>(new Set());

  useEffect(() => {
    frames.forEach((src, index) => {
      const img = new Image();
      img.onload = () => {
        setLoadedFrames((prev) => new Set(prev).add(index));
      };
      img.src = src;
    });
  }, [frames]);

  const advanceFrame = useCallback(() => {
    setCurrentFrame((prev) => {
      const nextFrame = prev + 1;
      if (nextFrame >= frames.length) {
        if (loop) {
          return 0;
        } else {
          setIsComplete(true);
          setIsPlaying(false);
          return prev;
        }
      }
      return nextFrame;
    });
  }, [frames.length, loop]);

  useEffect(() => {
    if (!isPlaying || isComplete) return;

    const timer = setInterval(advanceFrame, frameDuration);
    return () => clearInterval(timer);
  }, [advanceFrame, frameDuration, isPlaying, isComplete]);

  useEffect(() => {
    if (isComplete && onComplete) {
      onComplete();
    }
  }, [isComplete, onComplete]);

  const allLoaded = loadedFrames.size === frames.length;

  return (
    <div
      className={`relative overflow-hidden ${className}`}
      style={{ width: size, height: size }}
      data-testid="preloaded-frame-animator"
    >
      {frames.map((src, index) => (
        <img
          key={index}
          src={src}
          alt={`frame-${index}`}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: size,
            height: size,
            objectFit: "contain",
            visibility: index === currentFrame && allLoaded ? "visible" : "hidden",
          }}
          data-frame={index}
        />
      ))}
      {!allLoaded && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
}
