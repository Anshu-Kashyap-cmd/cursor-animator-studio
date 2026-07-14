export type EasingType = string;

// Helper functions for cubic bezier coordinate calculations
function getBezierCoordinate(t: number, p1: number, p2: number): number {
  return 3 * Math.pow(1 - t, 2) * t * p1 + 3 * (1 - t) * Math.pow(t, 2) * p2 + Math.pow(t, 3);
}

function solveBezierT(x: number, x1: number, x2: number): number {
  const epsilon = 1e-5;
  let low = 0;
  let high = 1;
  let t = 0.5;

  // 24 binary search iterations are extremely fast and guarantee sub-millisecond precision
  for (let i = 0; i < 24; i++) {
    const currentX = getBezierCoordinate(t, x1, x2);
    if (Math.abs(currentX - x) < epsilon) {
      return t;
    }
    if (currentX < x) {
      low = t;
    } else {
      high = t;
    }
    t = (low + high) / 2;
  }
  return t;
}

export function evaluateCubicBezier(x: number, x1: number, y1: number, x2: number, y2: number): number {
  if (x <= 0) return 0;
  if (x >= 1) return 1;
  const t = solveBezierT(x, x1, x2);
  return getBezierCoordinate(t, y1, y2);
}

// Additional advanced mathematical easing formulas (e.g. Elastic, Bounce)
function elasticOut(t: number): number {
  if (t === 0) return 0;
  if (t === 1) return 1;
  const p = 0.3;
  return Math.pow(2, -10 * t) * Math.sin((t - p / 4) * (2 * Math.PI) / p) + 1;
}

function elasticIn(t: number): number {
  if (t === 0) return 0;
  if (t === 1) return 1;
  const p = 0.3;
  return -Math.pow(2, 10 * (t - 1)) * Math.sin((t - 1 - p / 4) * (2 * Math.PI) / p);
}

function elasticInOut(t: number): number {
  if (t === 0) return 0;
  if (t === 1) return 1;
  const p = 0.3 * 1.5;
  let val = t * 2;
  if (val < 1) {
    return -0.5 * Math.pow(2, 10 * (val - 1)) * Math.sin((val - 1 - p / 4) * (2 * Math.PI) / p);
  }
  val -= 1;
  return 0.5 * Math.pow(2, -10 * val) * Math.sin((val - p / 4) * (2 * Math.PI) / p) + 1;
}

function bounceOut(t: number): number {
  const n1 = 7.5625;
  const d1 = 2.75;
  if (t < 1 / d1) {
    return n1 * t * t;
  } else if (t < 2 / d1) {
    const t2 = t - 1.5 / d1;
    return n1 * t2 * t2 + 0.75;
  } else if (t < 2.5 / d1) {
    const t2 = t - 2.25 / d1;
    return n1 * t2 * t2 + 0.9375;
  } else {
    const t2 = t - 2.625 / d1;
    return n1 * t2 * t2 + 0.984375;
  }
}

function bounceIn(t: number): number {
  return 1 - bounceOut(1 - t);
}

function bounceInOut(t: number): number {
  return t < 0.5 ? (1 - bounceOut(1 - 2 * t)) / 2 : (1 + bounceOut(2 * t - 1)) / 2;
}

/**
 * Applies any registered easing curve (including custom cubic-bezier strings) to progress t (0 to 1).
 */
export function applyEasing(t: number, easing: EasingType): number {
  if (typeof easing !== "string") return t;

  const normalized = easing.trim().toLowerCase();

  // Parse custom cubic-bezier coordinates: cubic-bezier(x1, y1, x2, y2)
  if (normalized.startsWith("cubic-bezier(")) {
    try {
      const coords = normalized
        .replace("cubic-bezier(", "")
        .replace(")", "")
        .split(",")
        .map((n) => parseFloat(n.trim()));
      
      if (coords.length === 4 && coords.every((n) => !isNaN(n))) {
        return evaluateCubicBezier(t, coords[0], coords[1], coords[2], coords[3]);
      }
    } catch (e) {
      console.error("Error parsing custom cubic-bezier:", e);
    }
  }

  // Pre-configured switch fallbacks
  switch (normalized) {
    case "linear":
      return t;
    case "ease-in":
      return t * t * t; // Cubic ease-in
    case "ease-out":
      return 1 - Math.pow(1 - t, 3); // Cubic ease-out
    case "ease-in-out":
      return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; // Cubic ease-in-out
    
    // Elastic family
    case "elastic-out":
    case "elastic":
      return elasticOut(t);
    case "elastic-in":
      return elasticIn(t);
    case "elastic-in-out":
      return elasticInOut(t);

    // Bounce family
    case "bounce-out":
    case "bounce":
      return bounceOut(t);
    case "bounce-in":
      return bounceIn(t);
    case "bounce-in-out":
      return bounceInOut(t);

    // Common named cubic-bezier aliases for convenience
    case "ease-in-back":
      return evaluateCubicBezier(t, 0.36, 0, 0.66, -0.56);
    case "ease-out-back":
      return evaluateCubicBezier(t, 0.34, 1.56, 0.64, 1);
    case "ease-in-out-back":
      return evaluateCubicBezier(t, 0.68, -0.6, 0.32, 1.6);
    case "ease-in-sine":
      return 1 - Math.cos((t * Math.PI) / 2);
    case "ease-out-sine":
      return Math.sin((t * Math.PI) / 2);
    case "ease-in-out-sine":
      return -(Math.cos(Math.PI * t) - 1) / 2;

    default:
      return t;
  }
}
