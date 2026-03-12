import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { gh, GitHubAPIError, RateLimitError } from '@/lib/github';
import { cache, createCacheKey, CACHE_TTL } from '@/lib/cache';
import OpenAI from 'openai';
import { logger } from '@/lib/logger';
import type { ActivitySummary } from '@/types/api';

// Types for GitHub API responses
interface GitHubIssue {
  number: number;
  title: string;
  body: string | null;
  state: 'open' | 'closed';
  created_at: string;
  updated_at: string;
  user: {
    login: string;
  };
}

interface GitHubPullRequest {
  number: number;
  title: string;
  body: string | null;
  state: 'open' | 'closed' | 'merged';
  created_at: string;
  updated_at: string;
  user: {
    login: string;
  };
  merged_at: string | null;
}

interface GitHubCommit {
  sha: string;
  commit: {
    message: string;
    author: {
      name: string;
      date: string;
    };
  };
  author: {
    login: string;
  } | null;
}

// Lazy OpenAI client (avoid build-time error when env var is missing)
function getOpenAIClient() {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

/**
 * Fetch recent repository activities from GitHub API
 */
async function fetchRepositoryActivities(
  accessToken: string,
  owner: string,
  repo: string,
  days: number = 14
): Promise<{
  issues: GitHubIssue[];
  pulls: GitHubPullRequest[];
  commits: GitHubCommit[];
}> {
  const since = new Date();
  since.setDate(since.getDate() - days);
  const sinceISO = since.toISOString();

  try {
    // Fetch more data to ensure we have enough recent activities
    // Remove 'since' parameter to get all recent data, then filter client-side
    const allIssues = (await gh(
      accessToken,
      `/repos/${owner}/${repo}/issues?state=all&per_page=50&sort=created&direction=desc`,
      {
        method: 'GET',
      }
    )) as GitHubIssue[];

    const allPulls = (await gh(
      accessToken,
      `/repos/${owner}/${repo}/pulls?state=all&per_page=50&sort=created&direction=desc`,
      {
        method: 'GET',
      }
    )) as GitHubPullRequest[];

    const allCommits = (await gh(
      accessToken,
      `/repos/${owner}/${repo}/commits?per_page=50&since=${sinceISO}`,
      {
        method: 'GET',
      }
    )) as GitHubCommit[];

    // Filter issues: only include those created within the timeframe
    const issues = allIssues.filter(
      (issue) => new Date(issue.created_at) >= since
    );

    // Filter pull requests: only include those created or merged within the timeframe
    const pulls = allPulls.filter((pr) => {
      const createdDate = new Date(pr.created_at);
      const mergedDate = pr.merged_at ? new Date(pr.merged_at) : null;

      // Include if created within timeframe OR merged within timeframe
      return createdDate >= since || (mergedDate && mergedDate >= since);
    });

    // Commits are already filtered by GitHub API using author.date
    const commits = allCommits;

    return { issues, pulls, commits };
  } catch (error) {
    if (error instanceof RateLimitError) {
      throw new Error(
        'GitHub API rate limit exceeded. Please try again later.'
      );
    }
    if (error instanceof GitHubAPIError) {
      throw new Error(`GitHub API error: ${error.message}`);
    }
    throw new Error('Failed to fetch repository activities');
  }
}

/**
 * Fetch activities across multiple repositories and aggregate
 */
async function fetchMultiRepoActivities(
  accessToken: string,
  repos: { owner: string; repo: string }[],
  days: number
): Promise<{
  issues: GitHubIssue[];
  pulls: GitHubPullRequest[];
  commits: GitHubCommit[];
}> {
  const allIssues: GitHubIssue[] = [];
  const allPulls: GitHubPullRequest[] = [];
  const allCommits: GitHubCommit[] = [];

  // Fetch 2 repos at a time to avoid rate limiting
  const batchSize = 2;
  for (let i = 0; i < repos.length; i += batchSize) {
    const batch = repos.slice(i, i + batchSize);
    const results = await Promise.allSettled(
      batch.map((r) =>
        fetchRepositoryActivities(accessToken, r.owner, r.repo, days)
      )
    );

    for (const result of results) {
      if (result.status === 'fulfilled') {
        allIssues.push(...result.value.issues);
        allPulls.push(...result.value.pulls);
        allCommits.push(...result.value.commits);
      }
    }
  }

  return { issues: allIssues, pulls: allPulls, commits: allCommits };
}

/**
 * Generate AI summary using OpenAI
 */
async function generateAISummary(
  issues: GitHubIssue[],
  pulls: GitHubPullRequest[],
  commits: GitHubCommit[],
  repoNames: string[],
  timeframe: string
): Promise<string> {
  // Prepare input text for AI
  const activities: string[] = [];

  // Add issues
  issues.forEach((issue) => {
    const body = issue.body ? issue.body.slice(0, 200) : '';
    activities.push(`Issue #${issue.number}: ${issue.title} - ${body}`);
  });

  // Add pull requests
  pulls.forEach((pr) => {
    const body = pr.body ? pr.body.slice(0, 200) : '';
    activities.push(`PR #${pr.number}: ${pr.title} - ${body}`);
  });

  // Add commits
  commits.forEach((commit) => {
    const message = commit.commit.message.slice(0, 100);
    activities.push(`Commit: ${message}`);
  });

  const inputText = activities.join('\n');
  const repoList = repoNames.join(', ');

  try {
    const completion = await getOpenAIClient().chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content:
            'You are an expert assistant that summarizes GitHub account-wide activities. You will only receive activities that were created, merged, or committed within the specified timeframe across multiple repositories. Provide concise, professional summaries in English that highlight key changes, new features, bug fixes, and overall progress. Do not make assumptions about activities outside the provided timeframe.',
        },
        {
          role: 'user',
          content: `Summarize the GitHub account activities across repositories (${repoList}) that occurred within the last ${timeframe}. The following activities are all from this specific timeframe:\n\n${inputText}\n\nProvide a brief summary in 2-3 sentences highlighting the main activities and changes across the account during this ${timeframe} period.`,
        },
      ],
      max_tokens: 250,
      temperature: 0.3,
    });

    return (
      completion.choices[0]?.message?.content || 'Unable to generate summary'
    );
  } catch (error) {
    logger.error('OpenAI API error:', error);
    throw new Error('Failed to generate AI summary');
  }
}

/**
 * Validate repository parameter
 */
function validateRepoParam(
  repo: string
): { owner: string; repo: string } | null {
  const match = repo.match(/^([^\/]+)\/([^\/]+)$/);
  if (!match) return null;

  const [, owner, repoName] = match;
  if (!owner || !repoName) return null;

  return { owner, repo: repoName };
}

/**
 * GET /api/summary
 * Generate account-wide activity summary by AI across repositories
 */
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.accessToken) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const reposParam = searchParams.get('repos');
    const period = searchParams.get('period') || '14d';

    // Validate parameters
    if (!reposParam) {
      return NextResponse.json(
        { error: 'repos parameter is required (comma-separated owner/repo)' },
        { status: 400 }
      );
    }

    const repoNames = reposParam.split(',').filter(Boolean).slice(0, 5);
    const repoInfos: { owner: string; repo: string }[] = [];

    for (const name of repoNames) {
      const info = validateRepoParam(name.trim());
      if (!info) {
        return NextResponse.json(
          { error: `Invalid repository format: "${name}". Use "owner/repo"` },
          { status: 400 }
        );
      }
      repoInfos.push(info);
    }

    if (repoInfos.length === 0) {
      return NextResponse.json(
        { error: 'At least one valid repository is required' },
        { status: 400 }
      );
    }

    // Parse period (default 14 days)
    const daysMatch = period.match(/^(\d+)d$/);
    const days = daysMatch ? parseInt(daysMatch[1], 10) : 14;

    if (days < 1 || days > 30) {
      return NextResponse.json(
        { error: 'Period must be between 1 and 30 days' },
        { status: 400 }
      );
    }

    // Check cache first
    const cacheKey = createCacheKey(
      'summary-account',
      session.user.username || 'anonymous',
      repoNames.sort().join('|'),
      period
    );
    const cached = cache.get<ActivitySummary>(cacheKey);

    if (cached) {
      return NextResponse.json(cached, {
        headers: {
          'Cache-Control': 'private, no-cache, no-store, must-revalidate',
          'X-Cache': 'HIT',
          'X-User': session.user.username || 'anonymous',
        },
      });
    }

    // Fetch activities across all repos
    const { issues, pulls, commits } = await fetchMultiRepoActivities(
      session.accessToken,
      repoInfos,
      days
    );

    // Check if there are any activities
    const totalActivities = issues.length + pulls.length + commits.length;

    let summary: string;
    if (totalActivities === 0) {
      summary = `No new activities found across your repositories during the last ${days} days. Your account appears to be in a quiet period with no recent issues, pull requests, or commits.`;
    } else {
      // Generate AI summary
      summary = await generateAISummary(
        issues,
        pulls,
        commits,
        repoNames,
        `${days} days`
      );
    }

    // Prepare response
    const response: ActivitySummary = {
      summary,
      stats: {
        issues: issues.length,
        pulls: pulls.length,
        commits: commits.length,
      },
      timeframe: `${days} days`,
    };

    // Cache the response
    cache.set(cacheKey, response, CACHE_TTL.MEDIUM);

    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'private, no-cache, no-store, must-revalidate',
        'X-Cache': 'MISS',
        'X-User': session.user.username || 'anonymous',
      },
    });
  } catch (error) {
    logger.error('Activity Summary by AI API error:', error);

    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
