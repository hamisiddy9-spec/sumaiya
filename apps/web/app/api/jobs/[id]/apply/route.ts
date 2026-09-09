/**
 * POST /api/jobs/:id/apply - Apply to a job
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          }
        }
      }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { cvId } = body;

    if (!cvId) {
      return NextResponse.json(
        { error: 'Missing required field: cvId' },
        { status: 400 }
      );
    }

    // Create application record
    const { data: application, error: insertError } = await supabase
      .from('applications')
      .insert({
        user_id: user.id,
        job_id: params.id,
        cv_id: cvId,
        status: 'pending',
        applied_at: new Date().toISOString()
      })
      .select()
      .single();

    if (insertError) {
      console.error('Insert application error:', insertError);
      return NextResponse.json(
        { error: 'Failed to apply to job' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      applicationId: application.id,
      status: 'pending',
      appliedAt: application.applied_at
    });
  } catch (error) {
    console.error('Job apply error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
