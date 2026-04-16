/**
 * ⚠️ このファイルは非推奨です。
 *
 * かつてスクショ撮影用にデモデータを AsyncStorage に投入する関数が入っていましたが、
 * 本番環境で起動のたびに demo data が上書きされる不具合を引き起こしたため、
 * useStore.ts の import を削除し、中身も no-op に変更しました。
 *
 * 次回スクショ撮影が必要になった場合は、Git 履歴から復元してください。
 * その際は **useStore.ts の revert を忘れないこと**。
 */

export async function loadDemoData(): Promise<void> {
  // 意図的に何もしない。
  return;
}
