const path = require('path');
const fs = require('fs');

const artifactDir = 'C:\\Users\\prem\\.gemini\\antigravity\\brain\\b5c3f625-094a-4aca-91c7-475cf538a7eb';
const workspaceDir = 'D:\\New folder\\NimbusX';
const junctionPath = path.join(workspaceDir, 'artifact_link');

console.log('Junction exists:', fs.existsSync(junctionPath));

// Let's test how '/artifact_link/screenshot.png' resolves
const p = '/artifact_link/screenshot.png';

// Try resolving it relative to workspace or drive root
const resolvedDriveRoot = path.resolve(p); // goes to D:\artifact_link\screenshot.png
const resolvedWorkspaceRel = path.resolve(workspaceDir, p.substring(1)); // goes to D:\New folder\NimbusX\artifact_link\screenshot.png

console.log(`Path: "${p}"`);
console.log(`  Resolved (Drive Root): "${resolvedDriveRoot}"`);
console.log(`  Resolved (Workspace Rel): "${resolvedWorkspaceRel}"`);

try {
  const realDriveRoot = fs.realpathSync(resolvedDriveRoot);
  console.log(`  Real (Drive Root): "${realDriveRoot}"`);
  console.log(`  IsWithin (Drive Root):`, realDriveRoot.toLowerCase().startsWith(artifactDir.toLowerCase()));
} catch (err) {
  console.log(`  Real (Drive Root) failed: ${err.message}`);
}

try {
  const realWorkspaceRel = fs.realpathSync(resolvedWorkspaceRel);
  console.log(`  Real (Workspace Rel): "${realWorkspaceRel}"`);
  console.log(`  IsWithin (Workspace Rel):`, realWorkspaceRel.toLowerCase().startsWith(artifactDir.toLowerCase()));
} catch (err) {
  console.log(`  Real (Workspace Rel) failed: ${err.message}`);
}
