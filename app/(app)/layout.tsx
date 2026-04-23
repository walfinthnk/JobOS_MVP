import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { LogoutButton } from '@/components/LogoutButton';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name')
    .eq('id', user.id)
    .single();

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-6">
              <Link href="/dashboard" className="text-xl font-bold text-blue-600">
                JobOS
              </Link>
              <nav className="flex gap-4 text-sm">
                <Link href="/dashboard" className="text-gray-600 hover:text-gray-900 font-medium">
                  ダッシュボード
                </Link>
                <Link href="/stats" className="text-gray-600 hover:text-gray-900 font-medium">
                  統計
                </Link>
                <Link href="/settings/gmail" className="text-gray-600 hover:text-gray-900 font-medium">
                  Gmail連携
                </Link>
              </nav>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-700 font-medium">
                {profile?.display_name ?? user.email}
              </span>
              <LogoutButton />
            </div>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {children}
      </main>
    </div>
  );
}
