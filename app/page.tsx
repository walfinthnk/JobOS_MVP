import Link from 'next/link';
import Image from 'next/image';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-white flex flex-col">

      {/* ヘッダー */}
      <header className="px-6 py-4 border-b border-gray-100 bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Image src="/logo.png" alt="JobOS" width={32} height={32} className="rounded-lg" />
            <span className="font-bold text-xl text-gray-900">JobOS</span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm text-gray-600 hover:text-gray-900 px-3 py-1.5 rounded-md hover:bg-gray-100 transition-colors"
            >
              ログイン
            </Link>
            <Link
              href="/signup"
              className="text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 px-4 py-1.5 rounded-md transition-colors"
            >
              無料で始める
            </Link>
          </div>
        </div>
      </header>

      {/* ヒーロー */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-20 text-center">
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 text-xs font-medium px-3 py-1.5 rounded-full border border-blue-100">
            Gmail 自動連携対応
          </div>

          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 leading-tight">
            就活・転職活動を、<br />もっとシンプルに。
          </h1>

          <p className="text-lg text-gray-500 leading-relaxed">
            JobOS は、応募した求人をカンバンボードで一元管理し、<br className="hidden sm:block" />
            Gmail と連携して選考状況を自動追跡するツールです。
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <Link
              href="/signup"
              className="inline-flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-3 rounded-lg transition-colors text-sm"
            >
              無料で始める →
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center justify-center border border-gray-200 hover:bg-gray-50 text-gray-700 font-medium px-6 py-3 rounded-lg transition-colors text-sm"
            >
              すでにアカウントをお持ちの方
            </Link>
          </div>
        </div>

        {/* 機能紹介 */}
        <div className="max-w-3xl mx-auto mt-20 grid sm:grid-cols-3 gap-6 text-left">
          {[
            {
              icon: '📋',
              title: 'カンバン管理',
              desc: '応募中・書類選考・面接中・内定をボード形式で一覧把握。ステータスをワンクリックで更新。',
            },
            {
              icon: '📧',
              title: 'Gmail 自動連携',
              desc: '求人メールを自動解析して応募状況を追跡。手入力ゼロで最新情報を保持。',
            },
            {
              icon: '📊',
              title: '活動サマリー',
              desc: '応募数・通過率・活動日数をダッシュボードで即確認。転職活動の全体像を把握。',
            },
          ].map(({ icon, title, desc }) => (
            <div key={title} className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
              <div className="text-2xl mb-3">{icon}</div>
              <h3 className="font-semibold text-gray-900 mb-1">{title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </main>

      {/* フッター */}
      <footer className="border-t border-gray-100 py-6 px-6">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-gray-400">
          <span>© 2026 JobOS</span>
          <div className="flex items-center gap-4">
            <Link href="/privacy" className="hover:text-gray-600 transition-colors">
              プライバシーポリシー
            </Link>
            <Link href="/terms" className="hover:text-gray-600 transition-colors">
              利用規約
            </Link>
          </div>
        </div>
      </footer>

    </div>
  );
}
