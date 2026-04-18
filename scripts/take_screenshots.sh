#!/bin/bash
# 想いフォリオ App Store用スクリーンショット撮影スクリプト
# 使い方: bash scripts/take_screenshots.sh

set -e

IPHONE_69="DDCF2F18-4928-4866-B76C-1BD932EA8C3C"  # iPhone 16 Pro Max
IPHONE_65="A674FCEE-4A2E-4185-B924-3EAE3C645871"  # iPhone 11 Pro Max

OUT_DIR="$HOME/Desktop/souzoku-screenshots"
mkdir -p "$OUT_DIR/6.9" "$OUT_DIR/6.5"

# 現在起動中のデバイスを検出
BOOTED=$(xcrun simctl list devices | grep Booted | head -1 | grep -oE '[A-F0-9-]{36}')

if [ -z "$BOOTED" ]; then
  echo "❌ Simulatorが起動していません。先にExpo Goで接続してください"
  exit 1
fi

# サイズ判定
if [ "$BOOTED" = "$IPHONE_69" ]; then
  SIZE="6.9"
elif [ "$BOOTED" = "$IPHONE_65" ]; then
  SIZE="6.5"
else
  echo "⚠️ 未知のデバイス: $BOOTED"
  SIZE="unknown"
fi

echo "📱 対象デバイス: $BOOTED（$SIZE インチ）"

# ステータスバー固定
echo "⏰ ステータスバーを9:41に固定..."
xcrun simctl status_bar "$BOOTED" override \
  --time "9:41" \
  --dataNetwork wifi \
  --wifiMode active \
  --wifiBars 3 \
  --cellularMode active \
  --cellularBars 4 \
  --batteryState charged \
  --batteryLevel 100

# 撮影関数
snap() {
  local name="$1"
  local desc="$2"
  echo ""
  echo "📸 [$SIZE] $desc"
  echo "    Simulatorで目的の画面を表示したら Enter を押してください..."
  read
  xcrun simctl io "$BOOTED" screenshot "$OUT_DIR/$SIZE/${name}.png"
  echo "    ✅ 保存: $OUT_DIR/$SIZE/${name}.png"
}

echo ""
echo "=============================================="
echo "  想いフォリオ スクショ撮影 ($SIZE インチ)"
echo "=============================================="
echo ""
echo "各画面を表示するタイミングで Enter を押してください"

snap "01_home"     "ホーム画面（総資産・円グラフ）"
snap "02_list"     "リスト画面（資産一覧）"
snap "03_analysis" "分析画面（カテゴリ内訳）"
snap "04_add"      "追加画面（カテゴリ選択表示）"
snap "05_guide"    "ガイド画面"

# ステータスバー解除
xcrun simctl status_bar "$BOOTED" clear

echo ""
echo "✨ 完了！保存先: $OUT_DIR/$SIZE/"
open "$OUT_DIR/$SIZE/"
