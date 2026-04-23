# JobOS MVP — CLAUDE.md

## プロジェクト概要

転職サイト利用者向け転職活動支援アプリ「JobOS」のMVP実装リポジトリ。

## 技術スタック

| 層 | 技術 |
|----|------|
| フロントエンド | Next.js 14（App Router）+ Tailwind CSS + TypeScript |
| バックエンド | Next.js API Routes（同一リポジトリ） |
| データベース・認証 | Supabase（PostgreSQL + Auth + RLS） |
| Gmail連携 | googleapis + Google Cloud Pub/Sub |
| デプロイ | Vercel（Git push → 自動CI/CD） |

## 開発コマンド

```bash
npm run dev      # 開発サーバー起動（localhost:3000）
npm run build    # 本番ビルド
npm run lint     # ESLint実行
npm run typecheck # TypeScript型チェック
```

## 要件定義書・開発計画の参照先

本リポジトリの実装は以下のドキュメントに準拠すること。
ドキュメントは strategy-board リポジトリ（walfinthnk/strategy-board）で管理。

| ドキュメント | 参照箇所 |
|------------|---------|
| 要件定義書 v1.1 | 機能要件・画面仕様・DB設計・シーケンス図 |
| MVP開発計画 v2.1 | フェーズ構成・エージェント指示テンプレート |

---

## Git 運用ルール

### 基本方針

**コードを変更するたびに、必ず GitHub へプッシュする。**

ローカルにだけ変更を残してはいけない。変更 → コミット → プッシュをワンセットで行う。

### コミット手順

```bash
git add <変更ファイル>
git commit -m "変更内容を端的に説明するメッセージ"
git push origin <ブランチ名>
```

### コミットメッセージ規約

| プレフィックス | 用途 |
|---|---|
| `feat:` | 新機能の追加 |
| `fix:` | バグ修正 |
| `refactor:` | 機能変更なしのコード整理 |
| `style:` | フォーマット・見た目のみの変更 |
| `docs:` | ドキュメントのみの変更 |
| `test:` | テストの追加・修正 |
| `chore:` | ビルド設定・依存関係の更新 |

例: `feat: Gmail OAuth連携フローを実装`

### ブランチ戦略

- `main` — 常にデプロイ可能な状態を保つ
- `feature/<機能名>` — 新機能の開発
- `fix/<バグ名>` — バグ修正

### プッシュのタイミング

以下のいずれかの場面で必ずプッシュする：

1. ファイルを新規作成したとき
2. 既存ファイルを編集したとき
3. ファイルを削除したとき
4. 作業セッションを終了するとき

### 禁止事項

- `git push --force` を `main` ブランチへ実行しない
- コミットメッセージを空にしない
- `--no-verify` でフックをスキップしない
- `.env.local` をコミットしない（`.gitignore` に必ず含める）

---

## コーディング規約

- `any` 型の使用禁止。TypeScript strict モードを有効化すること
- コメントは「なぜ」そうしているかが自明でない場合のみ書く
- セキュリティ上の懸念（XSS・SQLインジェクション・OAuth state等）が生じないよう実装する
- `dangerouslySetInnerHTML` の使用禁止
- 全 API Routes で `supabase.auth.getUser()` による認証確認を必須とする
- Gmail トークンは必ず AES-256-GCM で暗号化してから DB に保存すること

## セキュリティチェックリスト（PR前に確認）

- [ ] RLS ポリシーが全テーブルに設定されているか
- [ ] 環境変数がハードコードされていないか
- [ ] OAuth state パラメータの生成・検証が実装されているか
- [ ] Pub/Sub Webhook で Google 署名検証を行っているか
- [ ] refresh_token がログやレスポンスに露出していないか
