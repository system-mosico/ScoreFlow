const fs = require('fs');
const path = require('path');

// index.htmlを修正して、すべてのルートのJavaScriptを読み込むようにする
const publicDir = path.join(__dirname, '../public');
const indexHtmlPath = path.join(publicDir, 'index.html');

if (fs.existsSync(indexHtmlPath)) {
  let html = fs.readFileSync(indexHtmlPath, 'utf8');
  
  // /createページ用のJavaScriptを追加
  const createJsFile = '/_next/static/chunks/app/create/page-b0c8edde5a0c4a79.js';
  
  // main-app-bdfa2d0147b81ca8.jsの後に/createページのJavaScriptを追加
  if (!html.includes(createJsFile)) {
    html = html.replace(
      /(<script src="\/_next\/static\/chunks\/main-app-[^"]+\.js" async=""><\/script>)/,
      `$1\n<script src="${createJsFile}" async=""></script>`
    );
  }
  
  fs.writeFileSync(indexHtmlPath, html);
  console.log('✓ Fixed routing in index.html');
} else {
  console.error('⚠ index.html not found');
}

