import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    console.log('OG Image request started');

    const { searchParams } = new URL(request.url);
    const username = searchParams.get('username') || 'GitHub User';
    const starsTotal = searchParams.get('stars') || '0';
    const views14d = searchParams.get('views') || '0';
    const topRepo = searchParams.get('topRepo') || 'No repositories';

    console.log('OG Image params:', {
      username,
      starsTotal,
      views14d,
      topRepo,
      url: request.url,
    });

    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#1f2937',
            fontFamily: 'system-ui, sans-serif',
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 40,
              backgroundColor: '#ffffff',
              borderRadius: 20,
              width: 900,
              textAlign: 'center',
            }}
          >
            <div
              style={{
                fontSize: 48,
                fontWeight: 700,
                color: '#1f2937',
                marginBottom: 20,
                display: 'flex',
              }}
            >
              GitHub Pulse
            </div>

            <div
              style={{
                fontSize: 28,
                color: '#6b7280',
                marginBottom: 40,
                display: 'flex',
              }}
            >
              @{username}
            </div>

            <div
              style={{
                fontSize: 24,
                color: '#1f2937',
                marginBottom: 20,
                display: 'flex',
              }}
            >
              ⭐ {starsTotal} Stars
            </div>

            <div
              style={{
                fontSize: 24,
                color: '#1f2937',
                marginBottom: 20,
                display: 'flex',
              }}
            >
              👀 {views14d} Views (14d)
            </div>

            <div
              style={{
                fontSize: 18,
                color: '#6b7280',
                marginTop: 20,
                display: 'flex',
              }}
            >
              Top: {topRepo}
            </div>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  } catch (error) {
    console.error('Error generating OG image:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });

    return new Response('Error generating image', { status: 500 });
  }
}
