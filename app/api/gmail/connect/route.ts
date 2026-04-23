import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { randomBytes } from 'crypto';
import { createClient } from '@/lib/supabase/server';
import { generateAuthUrl } from '@/lib/gmail/client';

export async function GET() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // CSRF 対策: ランダムな state を生成して HttpOnly Cookie に保存
  const state = randomBytes(32).toString('hex');
  const cookieStore = await cookies();
  cookieStore.set('gmail_oauth_state', state, {
    httpOnly: true,
    secure:   process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge:   600, // 10分
    path:     '/',
  });

  const authUrl = generateAuthUrl(state);
  return NextResponse.redirect(authUrl);
}
