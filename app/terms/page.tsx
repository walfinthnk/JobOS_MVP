import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '利用規約 | JobOS',
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-3xl px-4 py-12">
        <div className="mb-6">
          <Link href="/" className="text-sm text-blue-600 hover:underline">
            ← JobOS トップへ
          </Link>
        </div>

        <div className="rounded-lg bg-white px-8 py-10 shadow-sm">
          <h1 className="mb-2 text-2xl font-bold text-gray-900">利用規約</h1>
          <p className="mb-8 text-sm text-gray-500">最終更新日：2026年4月24日</p>

          <section className="mb-8">
            <h2 className="mb-3 text-lg font-semibold text-gray-900">第1条（目的と適用範囲）</h2>
            <p className="text-sm text-gray-700">
              本利用規約（以下「本規約」）は、当社が提供する転職活動支援サービス「JobOS」（以下「本サービス」）の
              利用条件を定めるものです。ユーザーは本規約に同意した上で本サービスを利用するものとします。
              本規約は、本サービスを利用するすべてのユーザーに適用されます。
            </p>
          </section>

          <section className="mb-8">
            <h2 className="mb-3 text-lg font-semibold text-gray-900">第2条（定義）</h2>
            <table className="w-full text-sm text-gray-700">
              <tbody>
                <tr className="border-t"><td className="py-2 pr-4 font-medium text-gray-600 w-36">当社</td><td className="py-2">本サービスを運営する事業者</td></tr>
                <tr className="border-t"><td className="py-2 pr-4 font-medium text-gray-600">ユーザー</td><td className="py-2">本サービスに登録し利用する個人</td></tr>
                <tr className="border-t"><td className="py-2 pr-4 font-medium text-gray-600">コンテンツ</td><td className="py-2">ユーザーが本サービスに入力・登録した転職活動データ（求人情報・メモ等）</td></tr>
                <tr className="border-t border-b"><td className="py-2 pr-4 font-medium text-gray-600">Gmail 連携機能</td><td className="py-2">ユーザーの Google アカウントに接続し、Gmail から求人情報を自動取得する機能</td></tr>
              </tbody>
            </table>
          </section>

          <section className="mb-8">
            <h2 className="mb-3 text-lg font-semibold text-gray-900">第3条（アカウント登録）</h2>
            <ol className="list-decimal pl-5 text-sm text-gray-700 space-y-1">
              <li>本サービスの利用にはアカウント登録が必要です。</li>
              <li>ユーザーは自身の正確な情報を登録するものとし、変更が生じた場合は速やかに更新してください。</li>
              <li>アカウントは1人1つとし、第三者への貸与・譲渡・共有を禁止します。</li>
              <li>アカウントに起因するすべての行為の責任はユーザーが負うものとします。</li>
              <li>16歳未満の方は、保護者の同意を得た上でご利用ください。</li>
            </ol>
          </section>

          <section className="mb-8">
            <h2 className="mb-3 text-lg font-semibold text-gray-900">第4条（サービスの内容）</h2>
            <ol className="list-decimal pl-5 text-sm text-gray-700 space-y-1">
              <li>転職活動の応募状況・選考ステータスの一元管理</li>
              <li>ステータス変更履歴の自動記録</li>
              <li>応募数・書類通過率・活動日数等の統計表示</li>
              <li>Gmail との連携による求人情報の自動登録・ステータス自動更新（オプション機能）</li>
            </ol>
          </section>

          <section className="mb-8">
            <h2 className="mb-3 text-lg font-semibold text-gray-900">第5条（Gmail 連携機能の利用条件）</h2>
            <ol className="list-decimal pl-5 text-sm text-gray-700 space-y-1">
              <li>Gmail 連携機能のご利用には、Google アカウントによる OAuth 認証が必要です。</li>
              <li>当社は <code className="rounded bg-gray-100 px-1">gmail.readonly</code>（メール読み取り）と <code className="rounded bg-gray-100 px-1">gmail.labels</code>（ラベル読み取り）のみを要求します。メールの送信・削除・変更は行いません。</li>
              <li>当社は取得した Gmail データを転職活動管理の目的にのみ使用し、広告配信・第三者提供・機械学習への利用は行いません。</li>
              <li>メール本文は解析後ただちに破棄し、データベースに永続保存しません。</li>
              <li>ユーザーはいつでも設定画面から Gmail 連携を解除でき、解除と同時にトークンは失効・削除されます。</li>
              <li>Gmail 連携機能の利用は <a href="https://developers.google.com/terms" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Google API サービス利用規約</a> に従います。</li>
            </ol>
          </section>

          <section className="mb-8">
            <h2 className="mb-3 text-lg font-semibold text-gray-900">第6条（禁止事項）</h2>
            <p className="mb-2 text-sm text-gray-700">ユーザーは以下の行為を禁止します。</p>
            <ul className="list-disc pl-5 text-sm text-gray-700 space-y-1">
              <li>他人のアカウントを不正に使用する行為</li>
              <li>不正な目的でアカウントを複数登録する行為</li>
              <li>自動化ツール・ボットを用いた大量アクセス行為</li>
              <li>虚偽・誤解を招く情報の登録</li>
              <li>第三者の著作権・商標・プライバシーを侵害するコンテンツの登録</li>
              <li>本サービスのシステムに不正アクセスする行為</li>
              <li>本サービスの運営を妨害・負荷を与える行為</li>
              <li>日本国内外の法律・法令に違反する行為</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="mb-3 text-lg font-semibold text-gray-900">第7条（コンテンツの取り扱い）</h2>
            <ol className="list-decimal pl-5 text-sm text-gray-700 space-y-1">
              <li>ユーザーが登録したコンテンツの著作権はユーザーに帰属します。</li>
              <li>当社は、本サービスの運営・改善に必要な範囲でコンテンツを利用できるものとします。</li>
              <li>当社は、ユーザーのコンテンツを個人を特定できない形式に加工した上で、サービス改善のための統計分析に利用する場合があります。</li>
            </ol>
          </section>

          <section className="mb-8">
            <h2 className="mb-3 text-lg font-semibold text-gray-900">第8条（サービスの変更・中断・終了）</h2>
            <ol className="list-decimal pl-5 text-sm text-gray-700 space-y-1">
              <li>当社は、事前通知なく本サービスの内容を変更・追加・削除することがあります。</li>
              <li>システムメンテナンス・自然災害・外部サービス障害等の場合、本サービスを一時中断することがあります。</li>
              <li>本サービスを終了する場合は、原則として30日前までにユーザーへ通知します。</li>
              <li>本サービスの変更・中断・終了によりユーザーに生じた損害について、当社は責任を負いません。</li>
            </ol>
          </section>

          <section className="mb-8">
            <h2 className="mb-3 text-lg font-semibold text-gray-900">第9条（有料サービスについて）</h2>
            <ol className="list-decimal pl-5 text-sm text-gray-700 space-y-1">
              <li>本サービスの MVP 段階では無料プランのみを提供します。</li>
              <li>有料プランの提供開始時は、料金・課金タイミング・解約方法を事前に明示します。</li>
              <li>デジタルサービスの性質上、原則として返金には応じられません。</li>
            </ol>
            <div className="mt-3 rounded-md bg-gray-50 p-4 text-sm text-gray-700">
              <p className="font-medium mb-1">特定商取引法に基づく表示（有料プラン提供時）</p>
              <ul className="space-y-1">
                <li><span className="text-gray-600">販売業者：</span>Kaoru Akimoto</li>
                <li><span className="text-gray-600">所在地：</span>神奈川県横浜市金沢区長浜2-7-39</li>
                <li><span className="text-gray-600">メール：</span>walfinthnk@gmail.com</li>
              </ul>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="mb-3 text-lg font-semibold text-gray-900">第10条（知的財産権）</h2>
            <ol className="list-decimal pl-5 text-sm text-gray-700 space-y-1">
              <li>本サービスに関する著作権・商標・その他の知的財産権は当社または正当な権利者に帰属します。</li>
              <li>ユーザーは、当社の事前承諾なく本サービスのコンテンツを複製・転載・商業利用することはできません。</li>
            </ol>
          </section>

          <section className="mb-8">
            <h2 className="mb-3 text-lg font-semibold text-gray-900">第11条（免責事項）</h2>
            <ol className="list-decimal pl-5 text-sm text-gray-700 space-y-1">
              <li>当社は、本サービスに事実上または法律上の瑕疵がないことを保証しません。</li>
              <li>当社は、本サービスの利用または利用できなかったことにより発生した損害について、当社の故意または重大な過失がある場合を除き、責任を負いません。</li>
              <li>Gmail 連携機能は Google の API 仕様変更・サービス停止等により利用できなくなる場合があります。</li>
              <li>メール解析の結果（企業名・ステータス等）は自動処理によるものであり、正確性を保証しません。ユーザー自身で確認・修正を行ってください。</li>
            </ol>
          </section>

          <section className="mb-8">
            <h2 className="mb-3 text-lg font-semibold text-gray-900">第12条（規約の変更）</h2>
            <p className="text-sm text-gray-700">
              重要な変更を行う場合は、変更内容・施行日を事前にサービス内およびメールで通知します。
              変更後も本サービスを継続して利用する場合、変更後の規約に同意したものとみなします。
            </p>
          </section>

          <section className="mb-8">
            <h2 className="mb-3 text-lg font-semibold text-gray-900">第13条（アカウント停止・終了）</h2>
            <ol className="list-decimal pl-5 text-sm text-gray-700 space-y-1">
              <li>ユーザーが本規約に違反した場合、当社は事前通知なくアカウントを一時停止または削除することがあります。</li>
              <li>ユーザーは設定画面からいつでもアカウントを削除できます。削除後、データは復元できません。</li>
            </ol>
          </section>

          <section className="mb-8">
            <h2 className="mb-3 text-lg font-semibold text-gray-900">第14条（準拠法・管轄裁判所）</h2>
            <ol className="list-decimal pl-5 text-sm text-gray-700 space-y-1">
              <li>本規約は日本法に準拠し、日本語を正文とします。</li>
              <li>本サービスに関する紛争については、当社所在地を管轄する裁判所を第一審の専属的合意管轄裁判所とします。</li>
            </ol>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-gray-900">お問い合わせ</h2>
            <ul className="list-none text-sm text-gray-700 space-y-1">
              <li><span className="font-medium">運営者：</span>XXXXXXXXXX</li>
              <li><span className="font-medium">所在地：</span>XXXXXXXXXX</li>
              <li><span className="font-medium">メール：</span>XXXXXXXXXX</li>
              <li><span className="font-medium">受付時間：</span>平日 10:00〜18:00（土日祝日・年末年始を除く）</li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
