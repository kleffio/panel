"use client";

import { useEffect, useMemo, useRef } from "react";
import type { RefObject } from "react";

type Ripple = {
  x: number;
  y: number;
  start: number;
};

type DotPoint = {
  x: number;
  y: number;
};

type BucketState = {
  alpha: number;
  radius: number;
  points: number[];
};

type RippleBounds = {
  ripple: Ripple;
  elapsed: number;
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
};

const DOT_FIELD_CONFIG = {
  grid: {
    spacing: 22,
    baseRadius: 1.1,
    canvasOpacity: 0.7,
    maxVisibleOpacity: 0.96,
  },
  hover: {
    radius: 150,
    maxLift: 8,
    maxOpacityBoost: 0.2,
    maxRadiusBoost: 0.8,
  },
  ripple: {
    durationMs: 850,
    speed: 0.24,
    width: 38,
    maxConcurrentRipples: 4,
    opacityBoost: 0.34,
    radiusBoost: 0.65,
    liftBoost: 4,
  },
  animation: {
    followEase: 0.15,
  },
  performance: {
    opacityBuckets: 16,
    radiusBuckets: 8,
  },
} as const;

const TWO_PI = Math.PI * 2;

function parseCssColor(input: string) {
  const normalized = input.trim();

  if (normalized.startsWith("#")) {
    const hex = normalized.slice(1);
    const expanded =
      hex.length === 3 ? hex.split("").map((part) => `${part}${part}`).join("") : hex;
    const value = Number.parseInt(expanded, 16);
    return {
      r: (value >> 16) & 255,
      g: (value >> 8) & 255,
      b: value & 255,
      a: 1,
    };
  }

  const match = normalized.match(/rgba?\(([^)]+)\)/i);
  if (!match) {
    return { r: 255, g: 255, b: 255, a: 0.08 };
  }

  const parts = match[1].split(",").map((part) => Number.parseFloat(part.trim()));
  return {
    r: parts[0] ?? 255,
    g: parts[1] ?? 255,
    b: parts[2] ?? 255,
    a: parts[3] ?? 1,
  };
}

export function InteractiveDotField({
  containerRef,
  overlayDotColor,
}: {
  containerRef: RefObject<HTMLElement | null>;
  overlayDotColor: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const dotGridRef = useRef<DotPoint[]>([]);
  const bucketStatesRef = useRef<BucketState[]>([]);
  const rippleBoundsRef = useRef<RippleBounds[]>([]);
  const frameIdRef = useRef<number | null>(null);
  const offscreenCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const ripplesRef = useRef<Ripple[]>([]);
  const pointerTargetRef = useRef({ x: 0, y: 0, active: false });
  const animatedPointerRef = useRef({ x: 0, y: 0, active: false });

  const dotColor = useMemo(() => parseCssColor(overlayDotColor), [overlayDotColor]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return undefined;
    }

    const handlePointerMove = (event: PointerEvent) => {
      const rect = container.getBoundingClientRect();
      pointerTargetRef.current = {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
        active: true,
      };
    };

    const handlePointerDown = (event: PointerEvent) => {
      const rect = container.getBoundingClientRect();
      ripplesRef.current = [
        ...ripplesRef.current.slice(-(DOT_FIELD_CONFIG.ripple.maxConcurrentRipples - 1)),
        {
          x: event.clientX - rect.left,
          y: event.clientY - rect.top,
          start: performance.now(),
        },
      ];
    };

    const clearHover = () => {
      pointerTargetRef.current.active = false;
    };

    container.addEventListener("pointermove", handlePointerMove);
    container.addEventListener("pointerdown", handlePointerDown);
    container.addEventListener("pointerleave", clearHover);

    return () => {
      container.removeEventListener("pointermove", handlePointerMove);
      container.removeEventListener("pointerdown", handlePointerDown);
      container.removeEventListener("pointerleave", clearHover);
    };
  }, [containerRef]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) {
      return undefined;
    }

    const context = canvas.getContext("2d");
    if (!context) {
      return undefined;
    }

    const ensureOffscreenCanvas = () => {
      if (!offscreenCanvasRef.current) {
        offscreenCanvasRef.current = document.createElement("canvas");
      }

      return offscreenCanvasRef.current;
    };

    const drawStaticFrame = () => {
      const offscreenCanvas = ensureOffscreenCanvas();
      const offscreenContext = offscreenCanvas.getContext("2d");
      const width = container.clientWidth;
      const height = container.clientHeight;

      if (!offscreenContext) {
        return;
      }

      offscreenCanvas.width = width;
      offscreenCanvas.height = height;
      offscreenContext.clearRect(0, 0, width, height);
      offscreenContext.fillStyle = `rgb(${dotColor.r} ${dotColor.g} ${dotColor.b})`;
      offscreenContext.globalAlpha = dotColor.a;
      offscreenContext.beginPath();

      for (const dot of dotGridRef.current) {
        offscreenContext.moveTo(dot.x + DOT_FIELD_CONFIG.grid.baseRadius, dot.y);
        offscreenContext.arc(dot.x, dot.y, DOT_FIELD_CONFIG.grid.baseRadius, 0, TWO_PI);
      }

      offscreenContext.fill();
      offscreenContext.globalAlpha = 1;
    };

    const resizeCanvas = () => {
      const width = container.clientWidth;
      const height = container.clientHeight;
      const dpr = window.devicePixelRatio || 1;

      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      context.setTransform(dpr, 0, 0, dpr, 0, 0);

      const dots: DotPoint[] = [];
      for (let y = DOT_FIELD_CONFIG.grid.spacing / 2; y < height + DOT_FIELD_CONFIG.grid.spacing; y += DOT_FIELD_CONFIG.grid.spacing) {
        for (let x = DOT_FIELD_CONFIG.grid.spacing / 2; x < width + DOT_FIELD_CONFIG.grid.spacing; x += DOT_FIELD_CONFIG.grid.spacing) {
          dots.push({ x, y });
        }
      }

      dotGridRef.current = dots;

      const bucketCount =
        (DOT_FIELD_CONFIG.performance.opacityBuckets + 1) *
        (DOT_FIELD_CONFIG.performance.radiusBuckets + 1);
      bucketStatesRef.current = Array.from({ length: bucketCount }, () => ({
        alpha: dotColor.a,
        radius: DOT_FIELD_CONFIG.grid.baseRadius,
        points: [],
      }));

      drawStaticFrame();
    };

    const draw = (timestamp: number) => {
      const width = container.clientWidth;
      const height = container.clientHeight;
      const target = pointerTargetRef.current;
      const animated = animatedPointerRef.current;

      animated.x += (target.x - animated.x) * DOT_FIELD_CONFIG.animation.followEase;
      animated.y += (target.y - animated.y) * DOT_FIELD_CONFIG.animation.followEase;
      animated.active = target.active;

      const activeRipples = ripplesRef.current.filter(
        (ripple) => timestamp - ripple.start < DOT_FIELD_CONFIG.ripple.durationMs,
      );
      ripplesRef.current = activeRipples;

      if (!animated.active && activeRipples.length === 0) {
        const offscreenCanvas = offscreenCanvasRef.current;
        context.clearRect(0, 0, width, height);
        if (offscreenCanvas) {
          context.drawImage(offscreenCanvas, 0, 0, width, height);
        }
        frameIdRef.current = window.requestAnimationFrame(draw);
        return;
      }

      context.clearRect(0, 0, width, height);
      const dots = dotGridRef.current;
      const bucketStates = bucketStatesRef.current;
      for (const bucket of bucketStates) {
        bucket.points.length = 0;
      }

      rippleBoundsRef.current = activeRipples.map((ripple) => {
        const elapsed = timestamp - ripple.start;
        const radius = elapsed * DOT_FIELD_CONFIG.ripple.speed;
        const padding = DOT_FIELD_CONFIG.ripple.width;
        return {
          ripple,
          elapsed,
          minX: ripple.x - radius - padding,
          maxX: ripple.x + radius + padding,
          minY: ripple.y - radius - padding,
          maxY: ripple.y + radius + padding,
        };
      });

      for (const dot of dots) {
        let offsetY = 0;
        let opacity = dotColor.a;
        let radius = DOT_FIELD_CONFIG.grid.baseRadius;

        if (animated.active) {
          const distance = Math.hypot(dot.x - animated.x, dot.y - animated.y);
          if (distance < DOT_FIELD_CONFIG.hover.radius) {
            const influence = 1 - distance / DOT_FIELD_CONFIG.hover.radius;
            const eased = influence * influence * (3 - 2 * influence);
            offsetY -= DOT_FIELD_CONFIG.hover.maxLift * eased;
            opacity += DOT_FIELD_CONFIG.hover.maxOpacityBoost * eased;
            radius += DOT_FIELD_CONFIG.hover.maxRadiusBoost * eased;
          }
        }

        for (const ripple of rippleBoundsRef.current) {
          if (
            dot.x < ripple.minX ||
            dot.x > ripple.maxX ||
            dot.y < ripple.minY ||
            dot.y > ripple.maxY
          ) {
            continue;
          }

          const progress = ripple.elapsed / DOT_FIELD_CONFIG.ripple.durationMs;
          const rippleRadius = ripple.elapsed * DOT_FIELD_CONFIG.ripple.speed;
          const rippleFade = 1 - progress;
          const distance = Math.hypot(dot.x - ripple.ripple.x, dot.y - ripple.ripple.y);
          const bandDistance = Math.abs(distance - rippleRadius);

          if (bandDistance < DOT_FIELD_CONFIG.ripple.width) {
            const influence = (1 - bandDistance / DOT_FIELD_CONFIG.ripple.width) * rippleFade;
            opacity += DOT_FIELD_CONFIG.ripple.opacityBoost * influence;
            radius += DOT_FIELD_CONFIG.ripple.radiusBoost * influence;
            offsetY -= DOT_FIELD_CONFIG.ripple.liftBoost * influence;
          }
        }

        const finalOpacity = Math.min(opacity, DOT_FIELD_CONFIG.grid.maxVisibleOpacity);
        const alphaIndex = Math.round(finalOpacity * DOT_FIELD_CONFIG.performance.opacityBuckets);
        const radiusProgress =
          (radius - DOT_FIELD_CONFIG.grid.baseRadius) / DOT_FIELD_CONFIG.hover.maxRadiusBoost;
        const radiusIndex = Math.max(
          0,
          Math.min(
            DOT_FIELD_CONFIG.performance.radiusBuckets,
            Math.round(radiusProgress * DOT_FIELD_CONFIG.performance.radiusBuckets),
          ),
        );
        const bucketIndex =
          alphaIndex * (DOT_FIELD_CONFIG.performance.radiusBuckets + 1) + radiusIndex;
        const bucket = bucketStates[bucketIndex];
        bucket.alpha = alphaIndex / DOT_FIELD_CONFIG.performance.opacityBuckets;
        bucket.radius =
          DOT_FIELD_CONFIG.grid.baseRadius +
          (radiusIndex / DOT_FIELD_CONFIG.performance.radiusBuckets) *
            DOT_FIELD_CONFIG.hover.maxRadiusBoost;
        bucket.points.push(dot.x, dot.y + offsetY);
      }

      context.fillStyle = `rgb(${dotColor.r} ${dotColor.g} ${dotColor.b})`;
      for (const bucket of bucketStates) {
        if (bucket.points.length === 0) {
          continue;
        }

        context.globalAlpha = bucket.alpha;
        context.beginPath();
        for (let i = 0; i < bucket.points.length; i += 2) {
          const x = bucket.points[i];
          const y = bucket.points[i + 1];
          context.moveTo(x + bucket.radius, y);
          context.arc(x, y, bucket.radius, 0, TWO_PI);
        }
        context.fill();
      }

      context.globalAlpha = 1;
      frameIdRef.current = window.requestAnimationFrame(draw);
    };

    resizeCanvas();
    frameIdRef.current = window.requestAnimationFrame(draw);
    window.addEventListener("resize", resizeCanvas);

    return () => {
      if (frameIdRef.current !== null) {
        window.cancelAnimationFrame(frameIdRef.current);
      }
      window.removeEventListener("resize", resizeCanvas);
    };
  }, [containerRef, dotColor.a, dotColor.b, dotColor.g, dotColor.r]);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none absolute inset-0 z-0"
      style={{ opacity: DOT_FIELD_CONFIG.grid.canvasOpacity }}
      aria-hidden="true"
    />
  );
}
