import Link from 'next/link';
import { resetPasswordAction } from './actions';

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; success?: string }>;
}) {
  const { error, success } = await searchParams;

  if (success) {
    return (
      <>
        <h2 className="mb-4 text-center text-2xl font-semibold text-gray-900">
          メールを送信しました
        </h2>
        <p className="text-center text-sm text-gray-600">
          パスワードリセット用のリンクをメールに送信しました。
          <br />
          メールを確認してください。
        </p>
        <p className="mt-6 text-center text-sm">
          <Link href="/login" className="font-medium text-blue-600 hover:underline">
            ログイン画面へ戻る
          </Link>
        </p>
      </>
    );
  }

  return (
    <>
      <h2 className="mb-2 text-center text-2xl font-semibold text-gray-900">
        パスワードリセット
      </h2>
      <p className="mb-6 text-center text-sm text-gray-600">
        登録済みのメールアドレスにリセットリンクを送信します。
      </p>

      {error && (
        <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700">
          {decodeURIComponent(error)}
        </div>
      )}

      <form action={resetPasswordAction} className="space-y-5">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">
            メールアドレス
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

        <button
          type="submit"
          className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          リセットリンクを送信
        </button>
      </form>

      <p className="mt-6 text-center text-sm">
        <Link href="/login" className="font-medium text-blue-600 hover:underline">
          ← ログインに戻る
        </Link>
      </p>
    </>
  );
}
