import type { Metadata } from 'next';

// Generate dynamic metadata for OG image
export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}): Promise<Metadata> {
  const params = await searchParams;
  const username =
    (params.u as string) || (params.username as string) || 'GitHub User';
  const stars = (params.s as string) || (params.stars as string) || '0';
  const views = (params.v as string) || (params.views as string) || '0';
  const topRepo =
    (params.t as string) || (params.topRepo as string) || 'No repositories';

  const ogImageUrl = `/opengraph-image?username=${encodeURIComponent(
    username
  )}&stars=${stars}&views=${views}&topRepo=${encodeURIComponent(topRepo)}`;

  return {
    metadataBase: new URL(process.env.NEXTAUTH_URL || 'http://localhost:3002'),
    title: `GitHub Pulse - @${username}'s Dashboard`,
    description: `GitHub repository analytics for @${username}. ${stars} stars, ${views} views (14d), top repo: ${topRepo}`,
    openGraph: {
      title: `GitHub Pulse - @${username}'s Dashboard`,
      description: `GitHub repository analytics for @${username}. ${stars} stars, ${views} views (14d), top repo: ${topRepo}`,
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: `GitHub Pulse Dashboard for @${username}`,
        },
      ],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: `GitHub Pulse - @${username}'s Dashboard`,
      description: `GitHub repository analytics for @${username}. ${stars} stars, ${views} views (14d), top repo: ${topRepo}`,
      images: [ogImageUrl],
    },
  };
}

import SharedContent from '@/components/SharedContent';

export default function SharedPage() {
  return <SharedContent />;
}
