import { GitHubService } from './githubService';
import { WeeklyReport } from '../types';
import { startOfWeek, endOfWeek, subWeeks, isWithinInterval, format, parseISO } from 'date-fns';

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
        ? startOfWeek(parseISO(startDate))
        : startOfWeek(subWeeks(new Date(), 1));
      const end = endOfWeek(start);

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
        } catch (error: unknown) {
          console.log(`Skipping repo ${repo.full_name} due to error:`, error);
          // Continue processing
        }
      }

      // Sort by stars and get top 5
      const topRepos = repoStats.sort((a, b) => b.stars - a.stars).slice(0, 5);

      // Count new and updated repos in the week
      const newRepos = repos.filter((repo) =>
        isWithinInterval(parseISO(repo.created_at), { start, end })
      ).length;

      const updatedRepos = repos.filter((repo) =>
        isWithinInterval(parseISO(repo.updated_at), { start, end })
      ).length;

      return {
        username,
        week_start: format(start, 'yyyy-MM-dd'),
        week_end: format(end, 'yyyy-MM-dd'),
        total_stars: totalStars,
        total_views: totalViews,
        total_visitors: totalVisitors,
        top_repos: topRepos,
        new_repos: newRepos,
        updated_repos: updatedRepos,
      };
    } catch (error: unknown) {
      console.error('Error generating weekly report:', error);
      throw new Error(`Failed to generate weekly report: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}
