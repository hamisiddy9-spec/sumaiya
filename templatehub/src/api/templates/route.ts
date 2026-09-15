/**
 * GET /api/templates
 * List all templates with optional filtering
 */

import { NextRequest, NextResponse } from 'next/server';
import { TemplateStore } from '@/lib/templates/store';
import { validateApiKey } from '@/lib/auth/validate-key';

export async function GET(request: NextRequest) {
  try {
    // Validate API key
    const apiKey = request.headers.get('Authorization')?.replace('Bearer ', '');
    if (!apiKey || !validateApiKey(apiKey)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse query params
    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get('category');
    const family = searchParams.get('family');
    const tier = searchParams.get('tier') as 'core' | 'premium' | null;
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');

    // Fetch from store
    const store = new TemplateStore();
    const { data, total } = await store.getByCategory(category, {
      family,
      tier,
      limit,
      offset,
    });

    return NextResponse.json({
      data,
      total,
      limit,
      offset,
    });
  } catch (error) {
    console.error('GET /templates error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
