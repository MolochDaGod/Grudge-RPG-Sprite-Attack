import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { EffectSpriteConfig, getFramePosition, getFrameDimensions } from "@/lib/effectSprites";

interface AnimatedEffectSpriteProps {
  config: EffectSpriteConfig;
  size?: number;
  onComplete?: () => void;
  className?: string;
  centered?: boolean; // If true, centers the effect. If false, uses middle-bottom focal point for combat.
}

export function AnimatedEffectSprite({
  config,
  size = 64,
  onComplete,
  className = "",
  centered = true,
}: AnimatedEffectSpriteProps) {
  const [currentFrame, setCurrentFrame] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  const advanceFrame = useCallback(() => {
    setCurrentFrame((prev) => {
      const nextFrame = prev + 1;
      if (nextFrame >= config.frameCount) {
        if (config.loop) {
          return 0; // Loop back to start
        } else {
          setIsComplete(true);
          return prev; // Stay on last frame
        }
      }
      return nextFrame;
    });
  }, [config.frameCount, config.loop]);

  useEffect(() => {
    if (isComplete) {
      onComplete?.();
      return;
    }

    const timer = setInterval(advanceFrame, config.frameDuration);
    return () => clearInterval(timer);
  }, [advanceFrame, config.frameDuration, isComplete, onComplete]);

  // Reset when config changes
  useEffect(() => {
    setCurrentFrame(0);
    setIsComplete(false);
  }, [config.src]);

  const { col, row } = getFramePosition(config, currentFrame);
  const { frameWidth, frameHeight, sheetWidth, sheetHeight } = getFrameDimensions(config);
  
  // Impact effects (4x2 grid = 8 frames) should be positioned at the bottom (near feet)
  // Attack effects and projectiles are centered
  const isImpactEffect = config.columns === 4 && config.rows === 2;
  
  // Calculate scale to fit the frame into the display size
  const scale = size / Math.max(frameWidth, frameHeight);
  const scaledSheetWidth = sheetWidth * scale;
  const scaledSheetHeight = sheetHeight * scale;
  const scaledFrameWidth = frameWidth * scale;
  const scaledFrameHeight = frameHeight * scale;
  
  // Calculate the offset to show the current frame
  const offsetX = col * scaledFrameWidth;
  const offsetY = row * scaledFrameHeight;
  
  // Position: impact effects at bottom, others centered
  const leftPos = (size - scaledFrameWidth) / 2 - offsetX;
  const topPos = isImpactEffect 
    ? (size - scaledFrameHeight) - offsetY  // Bottom aligned for impact effects
    : (size - scaledFrameHeight) / 2 - offsetY;  // Centered for attack effects

  return (
    <AnimatePresence>
      {!isComplete && (
        <motion.div
          className={`pointer-events-none overflow-hidden ${className}`}
          style={{
            width: size,
            height: size,
            position: "relative",
            // Centered mode for previews, middle-bottom focal point for combat positioning
            transform: centered ? undefined : "translate(-50%, -100%)",
          }}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.5 }}
          transition={{ duration: 0.1 }}
          data-testid="animated-effect-sprite"
        >
          <div
            style={{
              position: "absolute",
              left: leftPos,
              top: topPos,
              width: scaledSheetWidth,
              height: scaledSheetHeight,
              backgroundImage: `url(${config.src})`,
              backgroundSize: `${scaledSheetWidth}px ${scaledSheetHeight}px`,
              backgroundRepeat: "no-repeat",
            }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Wrapper component that handles effect name lookup
import { getEffectSprite } from "@/lib/effectSprites";

interface EffectAnimationProps {
  effectName: string;
  size?: number;
  onComplete?: () => void;
  className?: string;
}

export function EffectAnimation({
  effectName,
  size = 64,
  onComplete,
  className = "",
}: EffectAnimationProps) {
  const config = getEffectSprite(effectName);

  if (!config) {
    // Fallback for unknown effects
    return null;
  }

  return (
    <AnimatedEffectSprite
      config={config}
      size={size}
      onComplete={onComplete}
      className={className}
    />
  );
}
