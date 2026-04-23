'use server';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export async function signupAction(formData: FormData) {
  const supabase = await createClient();

  const display_name       = (formData.get('display_name') as string)?.trim();
  const email              = formData.get('email') as string;
  const password           = formData.get('password') as string;
  const password_confirm   = formData.get('password_confirm') as string;
  const terms              = formData.get('terms');

  if (!display_name || display_name.length < 1 || display_name.length > 50) {
    redirect('/signup?error=表示名は1〜50文字で入力してください');
  }

  if (password !== password_confirm) {
    redirect('/signup?error=パスワードが一致しません');
  }

  if (!terms) {
    redirect('/signup?error=利用規約・プライバシーポリシーへの同意が必要です');
  }

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { display_name },
      emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
    },
  });

  if (error) {
    if (error.message.includes('already registered')) {
      redirect('/signup?error=このメールアドレスは既に登録されています');
    }
    redirect(`/signup?error=${encodeURIComponent(error.message)}`);
  }

  redirect('/signup?success=1');
}
