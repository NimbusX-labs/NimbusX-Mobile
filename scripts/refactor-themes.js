const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '../src');

// Excluded files (manually refactored or class components)
const excludedFiles = [
  'AppNavigator.tsx',
  'MainNavigator.tsx',
  'ChatNavigator.tsx',
  'AuthNavigator.tsx',
  'ErrorBoundary.tsx'
];

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    if (isDirectory) {
      // Skip the theme directory itself to avoid modifying colors.ts
      if (f !== 'theme') {
        walkDir(dirPath, callback);
      }
    } else {
      callback(dirPath);
    }
  });
}

console.log('Starting refactoring script...');

walkDir(srcDir, (filePath) => {
  const ext = path.extname(filePath);
  if (ext !== '.ts' && ext !== '.tsx') return;

  const fileName = path.basename(filePath);
  if (excludedFiles.includes(fileName)) {
    console.log(`Skipping excluded file: ${fileName}`);
    return;
  }

  let content = fs.readFileSync(filePath, 'utf8');

  // 1. Check if the file imports colors from @theme or @theme/colors
  const importRegex = /import\s*\{\s*([^}]*?\bcolors\b[^}]*?)\}\s*from\s*'(@theme(?:\/colors)?)';/g;
  if (!importRegex.test(content)) {
    return; // Skip files that don't import colors
  }

  console.log(`Refactoring file: ${filePath}`);

  // Reset regex index
  importRegex.lastIndex = 0;

  // Replace import
  content = content.replace(importRegex, (match, importsStr, source) => {
    const imports = importsStr.split(',').map(s => s.trim()).filter(Boolean);
    const filtered = imports.filter(x => x !== 'colors');
    filtered.unshift('useThemeColors', 'createThemedStyles');
    return `import { ${filtered.join(', ')} } from '${source}';`;
  });

  // 2. Replace StyleSheet.create with createThemedStyles
  const stylesRegex = /const\s+styles\s*=\s*StyleSheet\.create\(\{([\s\S]+?)\}\);?/g;
  content = content.replace(stylesRegex, (match, stylesBody) => {
    return `const styles = createThemedStyles((colors) => ({${stylesBody}}));`;
  });

  // 3. Inject useThemeColors() into functional components
  // Match arrow function components: const Component = (...) => {
  const arrowComponentRegex = /(const\s+[A-Z][a-zA-Z0-9_]*(?:\s*:\s*[^=]+)?\s*=\s*(?:React\.memo\()?\(?[^)]*\)?\s*=>\s*\{)/g;
  content = content.replace(arrowComponentRegex, '$1\n  const colors = useThemeColors();');

  // Match regular function components: function Component(...) {
  const functionComponentRegex = /(function\s+[A-Z][a-zA-Z0-9_]*\s*\([^)]*\)\s*\{)/g;
  content = content.replace(functionComponentRegex, '$1\n  const colors = useThemeColors();');

  fs.writeFileSync(filePath, content, 'utf8');
});

console.log('Refactoring complete!');
