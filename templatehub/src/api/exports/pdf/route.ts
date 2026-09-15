import { NextRequest, NextResponse } from 'next/server';
import { PDFRenderer } from '@/lib/rendering/pdf-render';
import { validateApiKey } from '@/lib/auth/validate-key';

export async function POST(request: NextRequest) {
  try {
    const apiKey = request.headers.get('Authorization')?.replace('Bearer ', '');
    if (!apiKey || !validateApiKey(apiKey)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { html, options } = body;

    if (!html) {
      return NextResponse.json(
        { error: 'Missing html content' },
        { status: 400 }
      );
    }

    const renderer = new PDFRenderer();
    const buffer = await renderer.render(html, options);

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Length': buffer.length.toString(),
      },
    });
  } catch (error) {
    console.error('POST /exports/pdf error:', error);
    return NextResponse.json(
      { error: 'Failed to export PDF' },
      { status: 500 }
    );
  }
}
