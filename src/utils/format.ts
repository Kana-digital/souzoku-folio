/**
 * 金額を日本円フォーマットに変換
 * 例: 1234567 → "¥1,234,567"
 */
export function formatYen(amount: number): string {
  return new Intl.NumberFormat('ja-JP', {
    style: 'currency',
    currency: 'JPY',
  }).format(amount);
}

/**
 * 金額入力文字列をパース（カンマ・全角数字に対応）
 * 例: "1,234,567" → 1234567, "１２３" → 123
 */
export function parseAmountInput(input: string): number {
  // 全角数字を半角に変換
  const halfWidth = input.replace(/[０-９]/g, (c) =>
    String.fromCharCode(c.charCodeAt(0) - 0xFEE0)
  );
  // カンマ・スペース・円記号を除去
  const cleaned = halfWidth.replace(/[,\s¥￥]/g, '');
  const num = parseInt(cleaned, 10);
  return isNaN(num) ? 0 : num;
}

/**
 * 入力中の金額にカンマを自動挿入する
 * 数字以外を除去してからカンマ区切りにする
 * 例: "1234567" → "1,234,567"、 "5000000" → "5,000,000"
 */
export function formatAmountInput(input: string): string {
  // 全角数字を半角に変換
  const halfWidth = input.replace(/[０-９]/g, (c) =>
    String.fromCharCode(c.charCodeAt(0) - 0xFEE0)
  );
  // 数字以外を除去
  const digits = halfWidth.replace(/\D/g, '');
  if (digits === '') return '';
  // カンマ区切り
  return Number(digits).toLocaleString('ja-JP');
}
