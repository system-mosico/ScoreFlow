const fs = require('fs');
const path = require('path');

// Next.jsのビルド出力からHTMLファイルをコピー
const sourceDir = path.join(__dirname, '../.next/server/app');
const destDir = path.join(__dirname, '../public');

// コピーするルート
const routes = [
  { src: 'index.html', dest: 'index.html' },
  { src: 'create/page.html', dest: 'create.html' },
  { src: '_not-found.html', dest: '404.html' },
];

// ディレクトリを作成
if (!fs.existsSync(destDir)) {
  fs.mkdirSync(destDir, { recursive: true });
}

// HTMLファイルをコピー
routes.forEach(({ src, dest }) => {
  const srcPath = path.join(sourceDir, src);
  const destPath = path.join(destDir, dest);
  
  if (fs.existsSync(srcPath)) {
    // ディレクトリを作成
    const destDirPath = path.dirname(destPath);
    if (!fs.existsSync(destDirPath)) {
      fs.mkdirSync(destDirPath, { recursive: true });
    }
    
    fs.copyFileSync(srcPath, destPath);
    console.log(`✓ Copied ${src} -> ${dest}`);
  } else {
    console.warn(`⚠ File not found: ${srcPath}`);
  }
});

console.log('Static pages generated successfully!');

