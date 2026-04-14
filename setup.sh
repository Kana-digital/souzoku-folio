#!/bin/bash
# 想続フォリオ セットアップスクリプト
# ターミナルで実行: bash setup.sh

echo ""
echo "📜  想続フォリオ セットアップ開始"
echo "=================================="
echo ""

# Node.js チェック
if ! command -v node &> /dev/null; then
    echo "❌ Node.js が見つかりません"
    echo "👉 https://nodejs.org/ からLTS版をインストールしてください"
    echo "   インストール後、もう一度このスクリプトを実行してください"
    exit 1
fi

echo "✅ Node.js $(node -v) 検出"
echo ""

# npm install
echo "📦 パッケージをインストール中...（1〜3分かかります）"
npm install
echo ""

if [ $? -ne 0 ]; then
    echo "❌ npm install に失敗しました"
    exit 1
fi

echo "✅ インストール完了！"
echo ""
echo "🚀 Expo 開発サーバーを起動します..."
echo ""

# MacのローカルIPを自動取得してExpoに渡す
# これがないとQRコードが127.0.0.1になりiPhoneから接続できない
LOCAL_IP=$(ipconfig getifaddr en0 2>/dev/null || hostname -I 2>/dev/null | awk '{print $1}')
if [ -n "$LOCAL_IP" ]; then
    echo "📱 ローカルIP: $LOCAL_IP"
    echo "   QRコードが表示されたら、iPhoneのカメラで読み取ってください"
    echo "   （Expo Goアプリがインストールされている必要があります）"
    echo "   ※ MacとiPhoneが同じWi-Fiに接続されていること"
    echo ""
    REACT_NATIVE_PACKAGER_HOSTNAME=$LOCAL_IP npx expo start --clear
else
    echo "⚠️ ローカルIPを自動取得できませんでした"
    echo "   手動で起動してください:"
    echo "   REACT_NATIVE_PACKAGER_HOSTNAME=<あなたのIP> npx expo start --clear"
    echo ""
    npx expo start --clear
fi
