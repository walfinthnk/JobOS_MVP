import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'プライバシーポリシー | JobOS',
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-3xl px-4 py-12">
        <div className="mb-6">
          <Link href="/" className="text-sm text-blue-600 hover:underline">
            ← JobOS トップへ
          </Link>
        </div>

        <div className="rounded-lg bg-white px-8 py-10 shadow-sm">
          <h1 className="mb-2 text-2xl font-bold text-gray-900">プライバシーポリシー</h1>
          <p className="mb-8 text-sm text-gray-500">最終更新日：2026年4月24日</p>

          <section className="mb-8">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">1. 事業者情報</h2>
            <p className="mb-3 text-sm text-gray-700">
              本プライバシーポリシーは、JobOS（以下「本サービス」）を運営する事業者（以下「当社」）が、
              ユーザーの個人情報をどのように収集・利用・保護するかを定めるものです。
            </p>
            <table className="w-full text-sm text-gray-700">
              <tbody>
                <tr className="border-t"><td className="py-2 pr-4 font-medium text-gray-600 w-32">サービス名</td><td className="py-2">JobOS</td></tr>
                <tr className="border-t"><td className="py-2 pr-4 font-medium text-gray-600">運営者</td><td className="py-2">Kaoru Akimoto</td></tr>
                <tr className="border-t"><td className="py-2 pr-4 font-medium text-gray-600">所在地</td><td className="py-2">神奈川県横浜市金沢区長浜2-7-39</td></tr>
                <tr className="border-t border-b"><td className="py-2 pr-4 font-medium text-gray-600">お問い合わせ</td><td className="py-2">walfinthnk@gmail.com</td></tr>
              </tbody>
            </table>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">2. 収集する情報</h2>
            <h3 className="mb-2 font-medium text-gray-800">2-1. ユーザーが直接入力する情報</h3>
            <ul className="mb-4 list-disc pl-5 text-sm text-gray-700 space-y-1">
              <li>アカウント情報：メールアドレス、表示名、パスワード（ハッシュ化済み）</li>
              <li>転職活動データ：応募企業名、職種、求人URL、応募日、選考ステータス、メモ</li>
            </ul>
            <h3 className="mb-2 font-medium text-gray-800">2-2. 自動的に収集される情報</h3>
            <ul className="mb-4 list-disc pl-5 text-sm text-gray-700 space-y-1">
              <li>アクセスログ：IPアドレス、ブラウザ種別、アクセス日時（セキュリティ監視・障害対応目的）</li>
              <li>Cookie：セッション管理用トークン（ログイン状態の維持）</li>
            </ul>
            <h3 className="mb-2 font-medium text-gray-800">2-3. Google アカウント連携時に取得する情報（オプション機能）</h3>
            <p className="mb-2 text-sm text-gray-700">Gmail 連携機能をご利用の場合、ユーザーの明示的な同意のもと、以下の情報を取得します。</p>
            <ul className="mb-3 list-disc pl-5 text-sm text-gray-700 space-y-1">
              <li>Gmail アドレス：連携したGoogle アカウントのメールアドレス（連携アカウントの識別）</li>
              <li>メール件名：「求人応募」ラベルが付いたメールの件名のみ（企業名・選考ステータスの自動抽出）</li>
              <li>メール受信日時：上記対象メールの受信日時（応募日・更新日の自動入力）</li>
              <li>メール送信者：上記対象メールの送信者ドメイン（企業名の補完）</li>
            </ul>
            <p className="mb-2 text-sm font-medium text-gray-700">取得しない情報：</p>
            <ul className="mb-3 list-disc pl-5 text-sm text-gray-700 space-y-1">
              <li>メール本文（解析後ただちにメモリから破棄し、データベースに保存しません）</li>
              <li>「求人応募」ラベル以外のメール</li>
              <li>連絡先・カレンダー・その他のGoogleサービスのデータ</li>
            </ul>
            <p className="text-sm text-gray-600">
              本サービスによる Google アカウントの使用は、
              <a href="https://developers.google.com/terms/api-services-user-data-policy" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Google API Services User Data Policy</a>
              および
              <a href="https://developers.google.com/terms/api-services-user-data-policy#limited-use" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Limited Use Policy</a>
              に準拠しています。
            </p>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">3. 情報の利用目的</h2>
            <ul className="list-disc pl-5 text-sm text-gray-700 space-y-1">
              <li>本サービスの提供・運営（認証、転職活動データの管理）</li>
              <li>Gmail 連携機能による求人情報の自動登録・ステータス自動更新</li>
              <li>システムの安定運用・セキュリティ確保</li>
              <li>お問い合わせへの対応</li>
              <li>サービス改善のための統計分析（個人を特定できない形式）</li>
            </ul>
            <p className="mt-3 text-sm font-medium text-gray-700">利用しない目的：広告の配信・ターゲティング、第三者への情報提供・販売、機械学習モデルの学習・訓練、転職活動管理以外の目的への転用</p>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">4. 情報の第三者提供</h2>
            <p className="text-sm text-gray-700">当社は、以下の場合を除き、収集した個人情報を第三者に提供しません。</p>
            <ol className="mt-2 list-decimal pl-5 text-sm text-gray-700 space-y-1">
              <li>ユーザー本人の事前同意がある場合</li>
              <li>法令に基づき開示が必要な場合</li>
              <li>人の生命・身体・財産を保護するために緊急に必要な場合</li>
            </ol>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">5. 委託先・利用している外部サービス</h2>
            <table className="w-full text-sm text-gray-700">
              <thead><tr className="border-b"><th className="py-2 pr-4 text-left font-medium text-gray-600">サービス</th><th className="py-2 pr-4 text-left font-medium text-gray-600">用途</th></tr></thead>
              <tbody>
                <tr className="border-t"><td className="py-2 pr-4">Supabase（米国）</td><td className="py-2">データベース・認証基盤</td></tr>
                <tr className="border-t"><td className="py-2 pr-4">Vercel（米国）</td><td className="py-2">ホスティング・CDN</td></tr>
                <tr className="border-t border-b"><td className="py-2 pr-4">Google LLC（米国）</td><td className="py-2">Gmail API・Pub/Sub</td></tr>
              </tbody>
            </table>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">6. データの保管と保護</h2>
            <ul className="list-disc pl-5 text-sm text-gray-700 space-y-1">
              <li>保管場所：Supabase（AWS ap-northeast-1 東京リージョン）</li>
              <li>通信暗号化：全通信を HTTPS（TLS 1.2以上）で保護</li>
              <li>アクセス制御：Row Level Security（RLS）により、各ユーザーは自分のデータのみ操作可能</li>
              <li>Google トークンの保護：アクセストークン・リフレッシュトークンを AES-256-GCM で暗号化して保存</li>
              <li>パスワード：ハッシュ化して保管（平文では保存しません）</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">7. データの保持期間と削除</h2>
            <table className="w-full text-sm text-gray-700">
              <thead><tr className="border-b"><th className="py-2 pr-4 text-left font-medium text-gray-600">データの種類</th><th className="py-2 text-left font-medium text-gray-600">保持期間</th></tr></thead>
              <tbody>
                <tr className="border-t"><td className="py-2 pr-4">アカウント情報・転職活動データ</td><td className="py-2">アカウント削除まで</td></tr>
                <tr className="border-t"><td className="py-2 pr-4">Gmail 同期ログ</td><td className="py-2">最終同期日から90日間（自動削除）</td></tr>
                <tr className="border-t"><td className="py-2 pr-4">Gmail アクセストークン</td><td className="py-2">Gmail 連携解除まで（解除時に即時削除）</td></tr>
                <tr className="border-t border-b"><td className="py-2 pr-4">アクセスログ</td><td className="py-2">90日間（自動削除）</td></tr>
              </tbody>
            </table>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">8. ユーザーの権利</h2>
            <ul className="list-disc pl-5 text-sm text-gray-700 space-y-1">
              <li>個人情報の開示請求：お問い合わせ窓口へメールで連絡</li>
              <li>個人情報の訂正・削除：設定画面から直接変更、またはお問い合わせ窓口へ連絡</li>
              <li>Gmail 連携の解除：設定画面の「Gmail 連携を解除する」から即時解除可能</li>
              <li>アカウントの削除：設定画面から全データを削除可能</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">9. Cookie の利用</h2>
            <p className="text-sm text-gray-700">
              本サービスは、ログイン状態の維持のためにセッション Cookie（httpOnly + Secure + SameSite=Strict）を使用します。
              アクセス解析ツール（Google Analytics 等）は MVP 段階では使用していません。
            </p>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">10. プライバシーポリシーの変更</h2>
            <p className="text-sm text-gray-700">
              本ポリシーを変更する場合、変更内容・変更日をサービス内またはメールでユーザーに通知します。
              重要な変更については、再度の同意取得を行います。
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-lg font-semibold text-gray-900">11. お問い合わせ窓口</h2>
            <ul className="list-none text-sm text-gray-700 space-y-1">
              <li><span className="font-medium">メール：</span>xxxxxxxxxx</li>
              <li><span className="font-medium">受付時間：</span>平日 10:00〜18:00（土日祝日・年末年始を除く）</li>
              <li><span className="font-medium">回答期限：</span>受付から14日以内</li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
