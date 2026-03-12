/** Shared API response types */

export interface OverviewResponse {
  range: '14d';
  totals: {
    stars_total: number;
    views_14d: number;
    unique_14d: number;
    repos_count: number;
  };
  timeseries: { date: string; views: number; unique: number }[];
  top_repos: {
    full_name: string;
    stars: number;
    views_14d: number;
    sparkline_data: { date: string; views: number }[];
  }[];
  brand_copy: string;
}

export interface ActivitySummary {
  summary: string;
  stats: {
    issues: number;
    pulls: number;
    commits: number;
  };
  timeframe: string;
}
