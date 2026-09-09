/**
 * PUT /api/auth/device-token - Store device push token
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function PUT(request: NextRequest) {
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
    const { pushToken, platform, deviceId } = body;

    if (!pushToken || !platform || !deviceId) {
      return NextResponse.json(
        { error: 'Missing required fields: pushToken, platform, deviceId' },
        { status: 400 }
      );
    }

    // Store or update device token
    const { data: device, error: upsertError } = await supabase
      .from('device_tokens')
      .upsert({
        user_id: user.id,
        device_id: deviceId,
        push_token: pushToken,
        platform,
        updated_at: new Date().toISOString()
      }, { onConflict: 'device_id' })
      .select()
      .single();

    if (upsertError) {
      console.error('Upsert device token error:', upsertError);
      return NextResponse.json(
        { error: 'Failed to store device token' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Device token registered successfully'
    });
  } catch (error) {
    console.error('Device token error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
