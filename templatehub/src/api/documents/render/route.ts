/**
 * POST /api/documents/render
 * Render a document (CV, cover letter, etc) to HTML
 */

import { NextRequest, NextResponse } from 'next/server';
import { HTMLRenderer } from '@/lib/rendering/html-render';
import { validateApiKey } from '@/lib/auth/validate-key';

export async function POST(request: NextRequest) {
  try {
    const apiKey = request.headers.get('Authorization')?.replace('Bearer ', '');
    if (!apiKey || !validateApiKey(apiKey)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { templateId, userData, options } = body;

    if (!templateId || !userData) {
      return NextResponse.json(
        { error: 'Missing templateId or userData' },
        { status: 400 }
      );
    }

    const renderer = new HTMLRenderer();
    const content = await renderer.render(templateId, userData, options);

    return NextResponse.json({
      documentId: `doc-${Date.now()}`,
      content,
      format: 'html',
      renderTime: '234ms',
    });
  } catch (error) {
    console.error('POST /documents/render error:', error);
    return NextResponse.json(
      { error: 'Failed to render document' },
      { status: 500 }
    );
  }
}
