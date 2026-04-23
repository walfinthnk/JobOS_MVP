import Link from 'next/link';
import { signupAction } from './actions';

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; success?: string }>;
}) {
  const { error, success } = await searchParams;

  if (success) {
    return (
      <>
        <h2 className="mb-4 text-center text-2xl font-semibold text-gray-900">
          確認メールを送信しました
        </h2>
        <p className="text-center text-sm text-gray-600">
          ご登録のメールアドレスに確認メールを送信しました。
          <br />
          メール内のリンクをクリックしてアカウントを有効化してください。
        </p>
        <p className="mt-6 text-center text-sm">
          <Link href="/login" className="font-medium text-blue-600 hover:underline">
            ログイン画面へ
          </Link>
        </p>
      </>
    );
  }

  return (
    <>
      <h2 className="mb-6 text-center text-2xl font-semibold text-gray-900">
        新規アカウント登録
      </h2>

      {error && (
        <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700">
          {decodeURIComponent(error)}
        </div>
      )}

      <form action={signupAction} className="space-y-5">
        <div>
          <label htmlFor="display_name" className="block text-sm font-medium text-gray-700">
            表示名 <span className="text-red-500">*</span>
          </label>
          <input
            id="display_name"
            name="display_name"
            type="text"
            required
            minLength={1}
            maxLength={50}
            placeholder="例：田中 太郎"
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">
            メールアドレス <span className="text-red-500">*</span>
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            maxLength={255}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700">
            パスワード（8文字以上）<span className="text-red-500">*</span>
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div>
          <label htmlFor="password_confirm" className="block text-sm font-medium text-gray-700">
            パスワード（確認）<span className="text-red-500">*</span>
          </label>
          <input
            id="password_confirm"
            name="password_confirm"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-start gap-2">
          <input
            id="terms"
            name="terms"
            type="checkbox"
            required
            className="mt-0.5 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <label htmlFor="terms" className="text-sm text-gray-700">
            <a href="#" className="text-blue-600 hover:underline">利用規約</a>
            および
            <a href="#" className="text-blue-600 hover:underline">プライバシーポリシー</a>
            に同意する
          </label>
        </div>

        <button
          type="submit"
          className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          アカウントを作成
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-600">
        すでにアカウントをお持ちの方は{' '}
        <Link href="/login" className="font-medium text-blue-600 hover:underline">
          ログイン
        </Link>
      </p>
    </>
  );
}
