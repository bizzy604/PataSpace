import { readPataSpaceLoginScreenshot } from '@/lib/stitch/pataspace-login';

export async function GET(
  _request: Request,
  context: { params: Promise<{ slug: string }> },
) {
  const { slug } = await context.params;
  const image = readPataSpaceLoginScreenshot(slug);

  if (!image) {
    return new Response('Not found', {
      status: 404,
    });
  }

  return new Response(image, {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
}
