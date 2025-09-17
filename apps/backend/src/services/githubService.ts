import axios, { AxiosInstance } from 'axios';
import { GitHubRepo, GitHubTrafficViews, GitHubTrafficClones } from '../types';

export class GitHubService {
  private client: AxiosInstance;

  constructor(token: string) {
    this.client = axios.create({
      baseURL: 'https://api.github.com',
      headers: {
        Authorization: `token ${token}`,
        Accept: 'application/vnd.github.v3+json',
        'User-Agent': 'GitHub-Pulse-Backend',
      },
    });
  }

  async getUserRepos(username: string): Promise<GitHubRepo[]> {
    try {
      const response = await this.client.get(`/users/${username}/repos`, {
        params: {
          type: 'all',
          sort: 'updated',
          per_page: 100,
        },
      });

      // 해당 사용자가 소유한 리포지토리만 필터링 (fork 제외)
      const userRepos = response.data.filter(
        (repo: GitHubRepo) => repo.owner.login === username && !repo.fork
      );

      console.log(
        `Found ${userRepos.length} owned repositories for ${username}`
      );
      return userRepos;
    } catch (error) {
      console.error('Error fetching user repos:', error);
      throw new Error('Failed to fetch user repositories');
    }
  }

  async getRepoTrafficViews(
    owner: string,
    repo: string
  ): Promise<GitHubTrafficViews> {
    try {
      const response = await this.client.get(
        `/repos/${owner}/${repo}/traffic/views`
      );
      return response.data;
    } catch (error) {
      console.error(
        `Error fetching traffic views for ${owner}/${repo}:`,
        error
      );
      return {
        count: 0,
        uniques: 0,
        views: [],
      };
    }
  }

  async getRepoTrafficClones(
    owner: string,
    repo: string
  ): Promise<GitHubTrafficClones> {
    try {
      const response = await this.client.get(
        `/repos/${owner}/${repo}/traffic/clones`
      );
      return response.data;
    } catch (error) {
      console.error(
        `Error fetching traffic clones for ${owner}/${repo}:`,
        error
      );
      return {
        count: 0,
        uniques: 0,
        clones: [],
      };
    }
  }

  async getRepoStats(owner: string, repo: string) {
    try {
      const [views, clones] = await Promise.all([
        this.getRepoTrafficViews(owner, repo),
        this.getRepoTrafficClones(owner, repo),
      ]);

      return {
        views: views.count,
        visitors: views.uniques,
        clones: clones.count,
        clone_uniques: clones.uniques,
      };
    } catch (error: any) {
      // 403 Forbidden이나 404 Not Found는 권한이 없거나 접근할 수 없는 리포지토리
      if (error.response?.status === 403 || error.response?.status === 404) {
        console.log(`Skipping ${owner}/${repo} - no access or not found`);
        return {
          views: 0,
          visitors: 0,
          clones: 0,
          clone_uniques: 0,
        };
      }

      console.error(`Error fetching repo stats for ${owner}/${repo}:`, error);
      return {
        views: 0,
        visitors: 0,
        clones: 0,
        clone_uniques: 0,
      };
    }
  }
}
