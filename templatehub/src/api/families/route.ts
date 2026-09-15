import { NextRequest, NextResponse } from 'next/server';
import { TemplateStore } from '@/lib/templates/store';
import { validateApiKey } from '@/lib/auth/validate-key';

export async function GET(request: NextRequest) {
  try {
    const apiKey = request.headers.get('Authorization')?.replace('Bearer ', '');
    if (!apiKey || !validateApiKey(apiKey)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const product = searchParams.get('product') || 'sumaiya';
    const tier = searchParams.get('tier') as 'core' | 'premium' | null;

    const store = new TemplateStore();
    const families = await store.getFamilies(product, tier || undefined);

    return NextResponse.json({ data: families });
  } catch (error) {
    console.error('GET /families error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
