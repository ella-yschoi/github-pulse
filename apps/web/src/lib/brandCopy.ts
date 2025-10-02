/**
 * Branding copy generation utility
 */

export interface BrandCopyParams {
  starsTotal: number;
  views14d: number;
  topRepoName: string;
}

/**
 * Generate GitHub Pulse branding copy
 * @param params Data needed for branding copy generation
 * @returns Generated branding copy
 */
export function makeBrandCopy({
  starsTotal,
  views14d,
  topRepoName,
}: BrandCopyParams): string {
  // Number formatting function
  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    }
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toString();
  };

  const formattedStars = formatNumber(starsTotal);
  const formattedViews = formatNumber(views14d);

  return `Total ⭐:${formattedStars}, 14-day visitors: ${formattedViews}, Top repo: ${topRepoName}`;
}

/**
 * Short version of branding copy (for OG images)
 */
export function makeShortBrandCopy({
  starsTotal,
  views14d,
  topRepoName,
}: BrandCopyParams): string {
  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    }
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toString();
  };

  const formattedStars = formatNumber(starsTotal);
  const formattedViews = formatNumber(views14d);

  return `⭐${formattedStars} • 👀${formattedViews} • ${topRepoName}`;
}

/**
 * Dashboard summary copy
 */
export function makeDashboardSummary({
  starsTotal,
  views14d,
  reposCount,
}: {
  starsTotal: number;
  views14d: number;
  reposCount: number;
}): string {
  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    }
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toString();
  };

  return `Total ${reposCount} repositories with ${formatNumber(
    starsTotal
  )} stars and ${formatNumber(views14d)} visits!`;
}
