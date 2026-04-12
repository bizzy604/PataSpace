import { getPataSpaceLoginScreen, readPataSpaceLoginHtml } from '@/lib/stitch/pataspace-login';

export async function GET(
  _request: Request,
  context: { params: Promise<{ slug: string }> },
) {
  const { slug } = await context.params;
  const screen = getPataSpaceLoginScreen(slug);
  const html = readPataSpaceLoginHtml(slug);

  if (!screen || !html) {
    return new Response('Not found', {
      status: 404,
    });
  }

  const renderedHtml = html.replace('<head>', '<head><base target="_top" />');

  return new Response(renderedHtml, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Content-Disposition': `inline; filename="${String(screen.order).padStart(2, '0')}-${screen.slug}.html"`,
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
}
