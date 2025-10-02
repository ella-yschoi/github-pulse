import { NextRequest, NextResponse } from 'next/server';

// Base64 decoding for parameter restoration
function decodeCompressedUrl(encoded: string): Record<string, string> | null {
  try {
    const decoded = Buffer.from(encoded, 'base64').toString('utf-8');
    const parts = decoded.split(',');

    if (parts.length !== 6) return null; // Expecting 6 parts: u, s, v, t, r, top3

    return {
      u: parts[0],
      s: parts[1],
      v: parts[2],
      t: parts[3],
      r: parts[4],
      top3: parts[5],
    };
  } catch (error) {
    console.error('Error decoding compressed URL:', error);
    return null;
  }
}

// Short URL redirect handling
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;

    if (!code) {
      return NextResponse.redirect(new URL('/', request.url));
    }

    console.log('Processing short URL:', { code });

    // Decode compressed code to parameters
    const decodedParams = decodeCompressedUrl(code);

    console.log('Decoded params:', decodedParams);

    if (!decodedParams) {
      console.log('Failed to decode, redirecting to home');
      // If decoding fails, redirect to home page instead of using hardcoded data
      return NextResponse.redirect(new URL('/', request.url));
    }

    // Convert parameters to URL query string
    const queryString = new URLSearchParams(decodedParams).toString();
    const redirectUrl = `${request.nextUrl.origin}/shared?${queryString}`;

    console.log('Success redirect URL:', redirectUrl);

    // Redirect to original URL
    return NextResponse.redirect(redirectUrl);
  } catch (error) {
    console.error('Error redirecting short URL:', error);
    return NextResponse.redirect(new URL('/', request.url));
  }
}
