import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Asset } from '../types';
import { CATEGORY_MAP, CATEGORIES } from '../constants/categories';
import { GUIDES } from '../constants/guides';

function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function formatYenHtml(amount: number): string {
  return '¥' + amount.toLocaleString('ja-JP');
}

/**
 * 相続用PDFを生成して共有シートを開く
 */
export async function exportPdf(assets: Asset[]): Promise<void> {
  const totalAmount = assets.reduce((sum, a) => sum + (a.amount ?? 0), 0);
  const now = new Date();
  const dateStr = `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日`;

  // カテゴリ別集計
  const categoryData = CATEGORIES.map((cat) => {
    const catAssets = assets.filter((a) => a.categoryId === cat.id);
    const catTotal = catAssets.reduce((sum, a) => sum + (a.amount ?? 0), 0);
    return { ...cat, assets: catAssets, total: catTotal };
  }).filter((c) => c.assets.length > 0);

  // HTML 組み立て
  const html = `
<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="utf-8"/>
<style>
  @page { size: A4; margin: 12mm; }
  body { font-family: 'Hiragino Sans', 'Yu Gothic', sans-serif; color: #333; margin: 0; padding: 8px; font-size: 9px; line-height: 1.4; }
  .cover { text-align: center; padding: 16px 8px 8px; }
  .cover h1 { font-size: 18px; color: #333; margin-bottom: 4px; }
  .cover .subtitle { font-size: 11px; color: #666; }
  .cover .date { font-size: 9px; color: #999; margin-top: 8px; }
  .cover .notice { background: #f8f0e0; border: 1px solid #e0c080; border-radius: 6px; padding: 6px 10px; margin-top: 12px; font-size: 8px; color: #8B6914; }
  .disclaimer { background: #f5f5f5; border-left: 2px solid #999; padding: 4px 8px; font-size: 8px; color: #666; margin: 8px 0; }
  h2 { color: #5a3ed9; border-bottom: 1px solid #5a3ed9; padding-bottom: 2px; margin-top: 12px; margin-bottom: 4px; font-size: 12px; }
  h3 { color: #444; font-size: 10px; margin-top: 8px; margin-bottom: 2px; }
  .total-box { background: #f0f0ff; border-radius: 6px; padding: 8px; text-align: center; margin: 8px 0; }
  .total-box .amount { font-size: 18px; font-weight: bold; color: #5a3ed9; }
  .total-box .label { font-size: 9px; color: #666; }
  table { width: 100%; border-collapse: collapse; margin: 4px 0; }
  th { background: #5a3ed9; color: white; padding: 3px 6px; text-align: left; font-size: 8px; }
  td { padding: 3px 6px; border-bottom: 1px solid #eee; font-size: 8px; }
  tr:nth-child(even) { background: #fafafa; }
  .amount-cell { text-align: right; font-weight: 600; }
  .category-header { background: #f5f5f5; padding: 4px 8px; border-radius: 4px; margin-top: 8px; font-weight: bold; font-size: 9px; }
  .step { display: flex; margin: 3px 0; }
  .step-num { background: #5a3ed9; color: white; width: 16px; height: 16px; border-radius: 8px; text-align: center; line-height: 16px; font-size: 8px; font-weight: bold; margin-right: 6px; flex-shrink: 0; }
  .step-text { flex: 1; }
  .step-title { font-weight: bold; font-size: 9px; }
  .step-detail { font-size: 8px; color: #555; }
  .page-break { page-break-before: always; }
  .footer { text-align: center; font-size: 7px; color: #999; margin-top: 12px; padding-top: 4px; border-top: 1px solid #eee; }
</style>
</head>
<body>

<!-- 表紙 -->
<div class="cover">
  <h1>想いフォリオ</h1>
  <div class="subtitle">資産一覧</div>
  <div class="date">作成日: ${dateStr}</div>
  <div class="notice">
    このPDFにはパスワード・暗証番号は一切記載されていません。<br/>
    金融機関等への手続には別途本人確認書類が必要です。
  </div>
</div>

<!-- 総資産サマリー -->
<h2>資産サマリー</h2>
<div class="total-box">
  <div class="label">総資産（概算）</div>
  <div class="amount">${formatYenHtml(totalAmount)}</div>
  <div class="label">${assets.length}件の資産</div>
</div>

<table>
  <tr><th>カテゴリ</th><th>件数</th><th style="text-align:right">合計金額</th><th style="text-align:right">構成比</th></tr>
  ${categoryData.map((c) => `
  <tr>
    <td>${escapeHtml(c.label)}</td>
    <td>${c.assets.length}件</td>
    <td class="amount-cell">${formatYenHtml(c.total)}</td>
    <td class="amount-cell">${totalAmount > 0 ? ((c.total / totalAmount) * 100).toFixed(1) : 0}%</td>
  </tr>`).join('')}
</table>

<!-- カテゴリ別詳細 -->
<h2>カテゴリ別 資産詳細</h2>
${categoryData.map((c) => `
<div class="category-header">${escapeHtml(c.label)}（${formatYenHtml(c.total)}）</div>
<table>
  <tr><th>資産名</th><th style="text-align:right">概算金額</th><th>登録日</th></tr>
  ${c.assets.map((a) => `
  <tr>
    <td>${escapeHtml(a.title)}</td>
    <td class="amount-cell">${formatYenHtml(a.amount)}</td>
    <td>${new Date(a.createdAt).toLocaleDateString('ja-JP')}</td>
  </tr>`).join('')}
</table>`).join('')}

<!-- 手続ガイド（独立ページ） -->
<div class="page-break"></div>
<h2>相続時の一般的な手続ガイド</h2>
<div class="disclaimer">
  以下は一般的な情報提供を目的としたものであり、法的助言・税務助言ではありません。
  個別の相続手続は司法書士・税理士・弁護士にご相談ください。
</div>

${GUIDES.filter((g) => categoryData.some((c) => c.id === g.categoryId)).map((guide) => {
  const cat = CATEGORY_MAP[guide.categoryId];
  return `
<h3>${escapeHtml(guide.title)}</h3>
<p style="color:#555">${escapeHtml(guide.overview)}</p>
${guide.steps.map((s) => `
<div class="step">
  <div class="step-num">${s.step}</div>
  <div class="step-text">
    <div class="step-title">${escapeHtml(s.title)}</div>
    <div class="step-detail">${escapeHtml(s.detail)}</div>
  </div>
</div>`).join('')}`;
}).join('')}

<!-- フッター -->
<div class="footer">
  本書類は「想いフォリオ」により ${dateStr} に作成されました。<br/>
  本アプリは情報提供を目的としており、法的助言・税務助言ではありません。<br/>
  個別の相続手続は司法書士・税理士・弁護士にご相談ください。
</div>

</body>
</html>`;

  // PDF生成
  const { uri } = await Print.printToFileAsync({
    html,
    base64: false,
  });

  // 共有シートを開く
  await Sharing.shareAsync(uri, {
    mimeType: 'application/pdf',
    dialogTitle: '想いフォリオ — 資産一覧PDF',
    UTI: 'com.adobe.pdf',
  });
}
