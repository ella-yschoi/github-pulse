import { NextResponse } from 'next/server';

const BACKEND_URL =
  process.env.BACKEND_URL ||
  (process.env.NODE_ENV === 'production'
    ? 'http://43.201.71.223:3001'
    : 'http://localhost:3001');

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string[] }> }
) {
  try {
    const { searchParams } = new URL(request.url);
    const resolvedParams = await params;
    const timestamp = resolvedParams?.slug?.[0] || `${Date.now()}`;
    const type = searchParams.get('type') || 'weekly';
    const username = searchParams.get('username') || '';

    // Preserve the timestamp segment if present (e.g., /download/123456789)
    const backendUrl = `${BACKEND_URL}/api/reports/download/${timestamp}?type=${encodeURIComponent(
      type
    )}&username=${encodeURIComponent(username)}`;

    const response = await fetch(backendUrl);

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to download report' },
        { status: response.status }
      );
    }

    const contentType = response.headers.get('content-type') || '';
    if (!contentType.toLowerCase().includes('application/pdf')) {
      const text = await response.text();
      try {
        const data = JSON.parse(text);
        return NextResponse.json(data, {
          status: 502,
          headers: { 'Cache-Control': 'no-store' },
        });
      } catch {
        return new NextResponse(text, {
          status: 502,
          headers: {
            'Content-Type': 'text/plain; charset=utf-8',
            'Cache-Control': 'no-store',
          },
        });
      }
    }

    const pdfBuffer = await response.arrayBuffer();

    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Length': String(pdfBuffer.byteLength),
        'Cache-Control': 'no-store',
        'Content-Disposition': `attachment; filename="${type}-report-${username}-${
          new Date().toISOString().split('T')[0]
        }.pdf"`,
      },
    });
  } catch (error) {
    console.error('Download catch-all proxy error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
