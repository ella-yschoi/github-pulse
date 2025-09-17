import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'GitHub Pulse - Share your GitHub activity';
export const size = {
  width: 1200,
  height: 630,
};

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        <div
          style={{
            fontSize: 72,
            fontWeight: 'bold',
            marginBottom: 20,
            textAlign: 'center',
          }}
        >
          GitHub Pulse
        </div>
        <div
          style={{
            fontSize: 32,
            opacity: 0.9,
            textAlign: 'center',
            maxWidth: 800,
          }}
        >
          Share your GitHub activity and insights
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
