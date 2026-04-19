export const INSTAGRAM_RECOMMENDED_WIDTH = 1080;
export const INSTAGRAM_RECOMMENDED_HEIGHT = 1350;
export const INSTAGRAM_RECOMMENDED_RATIO = 4 / 5;

export function isRecommendedInstagramPortrait(width: number, height: number) {
  if (!width || !height) return false;
  const ratio = width / height;
  const ratioDelta = Math.abs(ratio - INSTAGRAM_RECOMMENDED_RATIO);
  return width >= INSTAGRAM_RECOMMENDED_WIDTH && height >= INSTAGRAM_RECOMMENDED_HEIGHT && ratioDelta < 0.03;
}
