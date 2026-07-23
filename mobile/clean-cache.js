#!/usr/bin/env node

/**
 * Cache Clearing Script for Expo/Metro
 * Run this to clear Metro bundler cache and rebuild
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🧹 Cleaning Expo/Metro cache...\n');

const mobileDir = path.join(__dirname);

// Directories to clear
const dirsToClean = [
  '.expo',
  'node_modules/.cache',
  '.next',
];

for (const dir of dirsToClean) {
  const fullPath = path.join(mobileDir, dir);
  if (fs.existsSync(fullPath)) {
    console.log(`  ✓ Removing ${dir}`);
    execSync(`rmdir /s /q "${fullPath}"`, { stdio: 'ignore' });
  }
}

console.log('\n✅ Cache cleaned successfully!');
console.log('\nNext steps:');
console.log('  npm install  # Reinstall dependencies');
console.log('  npm run dev  # Start the dev server');
