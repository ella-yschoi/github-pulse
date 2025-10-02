import { GitHubService } from './githubService';
import { WeeklyReport } from '../types';
import moment from 'moment';

export class ReportService {
  private githubService: GitHubService;

  constructor(githubToken: string) {
    this.githubService = new GitHubService(githubToken);
  }

  async generateWeeklyReport(
    username: string,
    startDate?: string
  ): Promise<WeeklyReport> {
    try {
      const start = startDate
        ? moment(startDate)
        : moment().subtract(1, 'week').startOf('week');
      const end = moment(start).endOf('week');

      const repos = await this.githubService.getUserRepos(username);

      let totalStars = 0;
      let totalViews = 0;
      let totalVisitors = 0;
      const repoStats = [];

      // Get stats for each repo
      for (const repo of repos) {
        try {
          const [owner, repoName] = repo.full_name.split('/');
          const stats = await this.githubService.getRepoStats(owner, repoName);

          totalStars += repo.stargazers_count;
          totalViews += stats.views;
          totalVisitors += stats.visitors;

          repoStats.push({
            name: repo.full_name,
            stars: repo.stargazers_count,
            views: stats.views,
            visitors: stats.visitors,
          });
        } catch (error: any) {
          console.log(`Skipping repo ${repo.full_name} due to error:`, error);
          // Continue processing
        }
      }

      // Sort by stars and get top 5
      const topRepos = repoStats.sort((a, b) => b.stars - a.stars).slice(0, 5);

      // Count new and updated repos in the week
      const newRepos = repos.filter((repo) =>
        moment(repo.created_at).isBetween(start, end, 'day', '[]')
      ).length;

      const updatedRepos = repos.filter((repo) =>
        moment(repo.updated_at).isBetween(start, end, 'day', '[]')
      ).length;

      return {
        username,
        week_start: start.format('YYYY-MM-DD'),
        week_end: end.format('YYYY-MM-DD'),
        total_stars: totalStars,
        total_views: totalViews,
        total_visitors: totalVisitors,
        top_repos: topRepos,
        new_repos: newRepos,
        updated_repos: updatedRepos,
      };
    } catch (error: any) {
      console.error('Error generating weekly report:', error);
      throw new Error(`Failed to generate weekly report: ${error.message}`);
    }
  }
}
