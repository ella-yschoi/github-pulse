export interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  private: boolean;
  html_url: string;
  description: string | null;
  stargazers_count: number;
  watchers_count: number;
  forks_count: number;
  created_at: string;
  updated_at: string;
  pushed_at: string;
  owner: {
    login: string;
  };
  fork: boolean;
}

export interface GitHubTrafficViews {
  count: number;
  uniques: number;
  views: Array<{
    timestamp: string;
    count: number;
    uniques: number;
  }>;
}

export interface GitHubTrafficClones {
  count: number;
  uniques: number;
  clones: Array<{
    timestamp: string;
    count: number;
    uniques: number;
  }>;
}

export interface WeeklyReport {
  username: string;
  week_start: string;
  week_end: string;
  total_stars: number;
  total_views: number;
  total_visitors: number;
  top_repos: Array<{
    name: string;
    stars: number;
    views: number;
    visitors: number;
  }>;
  new_repos: number;
  updated_repos: number;
}

export interface ReportRequest {
  username: string;
  type: 'weekly';
  start_date?: string;
  end_date?: string;
}
