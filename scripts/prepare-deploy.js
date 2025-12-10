const fs = require('fs');
const path = require('path');

/**
 * Firebase Hosting用のデプロイ準備スクリプト
 * Next.jsのビルド出力を整理し、必要なファイルをpublicディレクトリにコピー
 */

const sourceDir = path.join(__dirname, '../.next/server/app');
const publicDir = path.join(__dirname, '../public');
const staticDir = path.join(__dirname, '../.next/static');

// 動的にJavaScriptファイル名を取得
function findCreatePageJs() {
  const createChunksDir = path.join(staticDir, 'chunks/app/create');
  if (!fs.existsSync(createChunksDir)) {
    return null;
  }
  
  const files = fs.readdirSync(createChunksDir);
  const pageJs = files.find(f => f.startsWith('page-') && f.endsWith('.js'));
  return pageJs ? `/_next/static/chunks/app/create/${pageJs}` : null;
}

function findHomePageJs() {
  const appChunksDir = path.join(staticDir, 'chunks/app');
  if (!fs.existsSync(appChunksDir)) {
    return null;
  }
  
  const files = fs.readdirSync(appChunksDir);
  const pageJs = files.find(f => f.startsWith('page-') && f.endsWith('.js') && !f.includes('/'));
  return pageJs ? `/_next/static/chunks/app/${pageJs}` : null;
}

// JavaScriptファイルからチャンクIDを取得
function getChunkIdFromJs(jsFilePath) {
  // まず .next/static から読み込む（predeployの時点ではこちらが存在する）
  let fullPath = path.join(staticDir, jsFilePath.replace(/^\/_next\/static\//, ''));
  if (!fs.existsSync(fullPath)) {
    // フォールバック: public ディレクトリから読み込む
    fullPath = path.join(__dirname, '..', 'public', jsFilePath.replace(/^\//, ''));
    if (!fs.existsSync(fullPath)) {
      return null;
    }
  }
  
  const content = fs.readFileSync(fullPath, 'utf8');
  const match = content.match(/\[\[(\d+)\]/);
  return match ? match[1] : null;
}

// /createページ用のHTMLを生成
function generateCreatePageHtml() {
  const indexHtmlPath = path.join(sourceDir, 'index.html');
  if (!fs.existsSync(indexHtmlPath)) {
    console.error('⚠ index.html not found');
    return false;
  }

  let html = fs.readFileSync(indexHtmlPath, 'utf8');
  const createJsFile = findCreatePageJs();
  const homeJsFile = findHomePageJs();

  if (!createJsFile) {
    console.error('⚠ /create page JavaScript not found');
    return false;
  }
  
  // 実際のチャンクIDを取得
  const createChunkId = getChunkIdFromJs(createJsFile);
  const homeChunkId = getChunkIdFromJs(homeJsFile || '');

  // /createページのJavaScriptを追加（まだ含まれていない場合）
  // ホームページのJavaScriptは削除せず、両方を含める（webpackのチャンクマッピングを保持するため）
  const createJsFileName = path.basename(createJsFile);
  if (!html.includes(createJsFile)) {
    html = html.replace(
      /(<script src="\/_next\/static\/chunks\/main-app-[^"]+\.js" async=""><\/script>)/,
      `$1\n<script src="${createJsFile}" async=""></script>`
    );
  }

  // ルーティングデータ内のJavaScript参照を修正
  if (homeJsFile) {
    const homeJsFileName = path.basename(homeJsFile);
    const createJsFileName = path.basename(createJsFile);
    
    // ファイル名の置換（すべての出現箇所）
    html = html.replace(
      new RegExp(homeJsFileName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'),
      createJsFileName
    );
    
    // パスの置換（app/page- を app/create/page- に）
    html = html.replace(
      /"static\/chunks\/app\/page-/g,
      '"static/chunks/app/create/page-'
    );
    html = html.replace(
      /app\/page-/g,
      'app/create/page-'
    );
    
    // チャンクIDマッピングの修正（I[6919,...]形式のルーティングデータ）
    // ホームページのチャンクID（974など）を/createページのチャンクIDに置換
    if (homeChunkId && createChunkId && homeChunkId !== createChunkId) {
      // チャンクIDの置換（"974" を実際のチャンクIDに）
      // パターン1: "974","static/chunks/app/page-xxx.js" を "323","static/chunks/app/create/page-xxx.js" に
      html = html.replace(
        new RegExp(`"${homeChunkId}"[^"]*"static/chunks/app/${homeJsFileName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"`, 'g'),
        `"${createChunkId}","static/chunks/app/create/${createJsFileName}"`
      );
      
      // パターン2: I[6919,[...,"974","static/chunks/app/page-xxx.js"]] 形式
      html = html.replace(
        new RegExp(`"${homeChunkId}"[^,]*"static/chunks/app/${homeJsFileName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"`, 'g'),
        `"${createChunkId}","static/chunks/app/create/${createJsFileName}"`
      );
    }
    
    // チャンクIDが取得できない場合でも、ファイルパスは修正する
    // ルーティングデータ内の "974" を実際のチャンクIDに置換
    if (createChunkId) {
      // I[6919,[...,"974","static/chunks/app/create/page-xxx.js"]] 形式を修正
      // エスケープされたJSON文字列内の "974" を置換
      html = html.replace(
        new RegExp(`"974"[^"]*"static/chunks/app/create/${createJsFileName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"`, 'g'),
        `"${createChunkId}","static/chunks/app/create/${createJsFileName}"`
      );
      
      // より広範囲な置換（チャンクIDマッピング全体）
      html = html.replace(
        /"974","static\/chunks\/app\/create\/page-/g,
        `"${createChunkId}","static/chunks/app/create/page-`
      );
      
      // より単純な置換：ルーティングデータ内の "974" を実際のチャンクIDに
      // エスケープされたJSON文字列内の \"974\" を \"323\" に置換
      // パターン: I[6919,[...,\"974\",\"static/chunks/app/create/page-xxx.js\"...]]
      // ファイル名を含む完全な置換（複数の形式を試す）
      const patterns = [
        [`"974","static/chunks/app/create/${createJsFileName}"`, `"${createChunkId}","static/chunks/app/create/${createJsFileName}"`],
        [`\\"974\\",\\"static/chunks/app/create/${createJsFileName}\\"`, `\\"${createChunkId}\\",\\"static/chunks/app/create/${createJsFileName}\\"`],
        [`"974","static/chunks/app/create/page-`, `"${createChunkId}","static/chunks/app/create/page-`],
        [`\\"974\\",\\"static/chunks/app/create/page-`, `\\"${createChunkId}\\",\\"static/chunks/app/create/page-`]
      ];
      
      patterns.forEach(([pattern, replacement]) => {
        html = html.replace(new RegExp(pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), replacement);
      });
    }
    
    // より広範囲な置換（チャンクマッピング全体）
    html = html.replace(
      new RegExp(`"static/chunks/app/${homeJsFileName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"`, 'g'),
      `"static/chunks/app/create/${createJsFileName}"`
    );
  }

  // ルーティングデータを修正（/createページ用）
  // エスケープされたJSON文字列内の "__PAGE__" を "create" に置換
  // パターン1: "children":["__PAGE__",{}]
  html = html.replace(
    /"children":\["__PAGE__",\{\}\]/g,
    '"children":["create",{}]'
  );
  
  // パターン2: \"children\":[\"__PAGE__\",{}] (エスケープされた形式)
  html = html.replace(
    /\\"children\\":\\\[\\"__PAGE__\\",\\\{\\\}\]/g,
    '\\"children\\":\\[\\"create\\",\\{\\]'
  );
  
  // パターン3: "children":["__PAGE__" (部分マッチ)
  html = html.replace(
    /"children":\["__PAGE__"/g,
    '"children":["create"'
  );
  
  // パターン4: \"children\":[\"__PAGE__\" (エスケープされた部分マッチ)
  html = html.replace(
    /\\"children\\":\\\[\\"__PAGE__\\"/g,
    '\\"children\\":\\[\\"create\\"'
  );
  
  // パターン5: ルーティングデータ内の "__PAGE__" を "create" に置換
  // ただし、エスケープされたJSON文字列内のみを対象とする
  // ルーティングデータの構造: "children":["__PAGE__",{}] または \"children\":[\"__PAGE__\",{}]
  html = html.replace(
    /(\["__PAGE__",\{\}\])/g,
    '["create",{}]'
  );
  html = html.replace(
    /(\\\[\\"__PAGE__\\",\\\{\\\}\])/g,
    '\\[\\"create\\",\\{\\]'
  );

  // webpackのチャンクマッピングにチャンクID 323を追加
  // webpackのチャンクローダーがチャンクID 323を読み込めるようにする
  if (createChunkId && createJsFile) {
    // webpackのチャンクマッピングがまだ追加されていない場合
    const createJsPath = createJsFile.replace(/^\//, '');
    const createJsFullPath = path.join(staticDir, createJsPath.replace(/^_next\/static\//, ''));
    
    if (fs.existsSync(createJsFullPath)) {
      const createJsContent = fs.readFileSync(createJsFullPath, 'utf8');
      // webpackのチャンクマッピングを抽出（最初の行全体、通常は1行にまとまっている）
      // パターン: (self.webpackChunk_N_E=...).push([[323],{...}])
      const lines = createJsContent.split('\n');
      const firstLine = lines[0];
      // 最初の行にwebpackのチャンクマッピングが含まれているか確認
      if (firstLine.includes('webpackChunk_N_E') && firstLine.includes(`[[${createChunkId}]`)) {
        if (!html.includes(`[[${createChunkId}]`)) {
          // webpackのスクリプトタグの後にチャンクマッピングを追加
          html = html.replace(
            /(<script[^>]*src="[^"]*webpack-[^"]*\.js"[^>]*><\/script>)/,
            `$1\n<script>${firstLine}</script>`
          );
          console.log('✓ Added webpack chunk mapping for chunk ID', createChunkId);
        }
      }
    }
  }

  // ディレクトリを作成
  const createDir = path.join(publicDir, 'create');
  if (!fs.existsSync(createDir)) {
    fs.mkdirSync(createDir, { recursive: true });
  }

  const createHtmlPath = path.join(createDir, 'index.html');
  fs.writeFileSync(createHtmlPath, html);
  console.log('✓ Generated /create/index.html');
  return true;
}

// index.htmlに/createページのJavaScriptを追加（クライアントサイドルーティング用）
function enhanceIndexHtml() {
  const indexHtmlPath = path.join(publicDir, 'index.html');
  if (!fs.existsSync(indexHtmlPath)) {
    console.error('⚠ index.html not found in public directory');
    return false;
  }

  let html = fs.readFileSync(indexHtmlPath, 'utf8');
  const createJsFile = findCreatePageJs();
  const createChunkId = createJsFile ? getChunkIdFromJs(createJsFile) : null;
  const createJsFileName = createJsFile ? path.basename(createJsFile) : null;

  if (createJsFile && !html.includes(createJsFile)) {
    html = html.replace(
      /(<script src="\/_next\/static\/chunks\/main-app-[^"]+\.js" async=""><\/script>)/,
      `$1\n<script src="${createJsFile}" async=""></script>`
    );
  }

  // ホームページのルーティングデータに/createページのチャンクマッピングを追加
  if (createChunkId && createJsFileName) {
    // I[6919,[...,"974","static/chunks/app/page-xxx.js"]] の後に
    // /createページのチャンクマッピングを追加
    const createChunkMapping = `"${createChunkId}","static/chunks/app/create/${createJsFileName}"`;
    
    // エスケープされた形式のチャンクマッピング
    const escapedMapping = `\\"${createChunkId}\\",\\"static/chunks/app/create/${createJsFileName}\\"`;
    
    // 既に/createページのチャンクマッピングが含まれているか確認
    if (!html.includes(createChunkMapping) && !html.includes(escapedMapping)) {
      // エスケープされた形式: I\[6919,\[...\"974\",\"static/chunks/app/page-xxx.js\"...\]\]
      // "974"の後にカンマと/createページのチャンクマッピングを追加
      html = html.replace(
        /(\\"974\\",\\"static\/chunks\/app\/page-[^\\"]+\.js\\")/,
        `$1,${escapedMapping}`
      );
      
      // 通常の形式（エスケープされていない場合）
      html = html.replace(
        /("974","static\/chunks\/app\/page-[^"]+\.js")/,
        `$1,${createChunkMapping}`
      );
    }
  }

  fs.writeFileSync(indexHtmlPath, html);
  console.log('✓ Enhanced index.html with /create page JavaScript');
  return true;
}

// メイン処理
function main() {
  console.log('📦 Preparing deployment files...');
  
  // /createページ用のHTMLを生成
  if (!generateCreatePageHtml()) {
    console.error('❌ Failed to generate /create page HTML');
    process.exit(1);
  }

  // index.htmlを強化
  enhanceIndexHtml();

  console.log('✅ Deployment preparation complete!');
}

main();

