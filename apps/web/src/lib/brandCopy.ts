/**
 * 브랜딩 문구 생성 유틸리티
 */

export interface BrandCopyParams {
  starsTotal: number;
  views14d: number;
  topRepoName: string;
}

/**
 * GitHub Pulse 브랜딩 문구 생성
 * @param params 브랜딩 문구 생성에 필요한 데이터
 * @returns 생성된 브랜딩 문구
 */
export function makeBrandCopy({
  starsTotal,
  views14d,
  topRepoName,
}: BrandCopyParams): string {
  // 숫자 포맷팅 함수
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

  return `총 ⭐:${formattedStars}, 14일 내 방문자: ${formattedViews}, Top repo: ${topRepoName}`;
}

/**
 * 짧은 버전의 브랜딩 문구 (OG 이미지용)
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
 * 대시보드용 요약 문구
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

  return `총 ${reposCount}개 리포지토리에서 ${formatNumber(
    starsTotal
  )}개의 스타와 ${formatNumber(views14d)}번의 방문을 기록했어요!`;
}
