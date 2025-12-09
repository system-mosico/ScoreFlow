const fs = require('fs');
const path = require('path');

// Next.jsのビルド出力から/createページのHTMLを生成
const sourceDir = path.join(__dirname, '../.next/server/app');
const destDir = path.join(__dirname, '../public');

// index.htmlを読み込む
const indexHtmlPath = path.join(sourceDir, 'index.html');
const createHtmlPath = path.join(destDir, 'create.html');

if (fs.existsSync(indexHtmlPath)) {
  let html = fs.readFileSync(indexHtmlPath, 'utf8');
  
  // /createページ用のJavaScriptファイル名を取得
  const createJsFile = 'app/create/page-b0c8edde5a0c4a79.js';
  
  // app/page-*.js を app/create/page-*.js に置き換え
  html = html.replace(
    /app\/page-([^"']+)\.js/g,
    createJsFile
  );
  
  // ディレクトリを作成
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }
  
  fs.writeFileSync(createHtmlPath, html);
  console.log('✓ Generated /create page HTML');
} else {
  console.error('⚠ index.html not found');
}

