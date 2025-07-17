#!/usr/bin/env node

/**
 * Environment Switcher for JusPay Testing
 * Easily switch between mock and real environments
 */

const fs = require('fs');
const path = require('path');

const MOCK_ENV_PATH = path.join(__dirname, '.env.mock');
const REAL_ENV_PATH = path.join(__dirname, '.env');
const BACKUP_ENV_PATH = path.join(__dirname, '.env.backup');

function copyFile(source, destination) {
  try {
    const content = fs.readFileSync(source, 'utf8');
    fs.writeFileSync(destination, content);
    return true;
  } catch (error) {
    console.error(`Error copying ${source} to ${destination}:`, error.message);
    return false;
  }
}

function switchToMock() {
  console.log('🧪 Switching to MOCK environment...');
  
  // Backup current .env
  if (fs.existsSync(REAL_ENV_PATH)) {
    copyFile(REAL_ENV_PATH, BACKUP_ENV_PATH);
    console.log('✅ Backed up current .env to .env.backup');
  }
  
  // Copy mock env to .env
  if (copyFile(MOCK_ENV_PATH, REAL_ENV_PATH)) {
    console.log('✅ Switched to MOCK environment');
    console.log('📋 Mock environment details:');
    console.log('   - Uses JusPay Sandbox (test transactions only)');
    console.log('   - Transactions appear in dashboard but no real money');
    console.log('   - Consistent mock customer/product data');
    console.log('   - Test card numbers for different scenarios');
  }
}

function switchToReal() {
  console.log('🔴 Switching to REAL environment...');
  
  if (fs.existsSync(BACKUP_ENV_PATH)) {
    if (copyFile(BACKUP_ENV_PATH, REAL_ENV_PATH)) {
      console.log('✅ Restored real environment from backup');
    }
  } else {
    console.log('⚠️  No backup found. Please manually configure .env for real environment');
  }
}

function showStatus() {
  console.log('📊 Current Environment Status:');
  
  if (!fs.existsSync(REAL_ENV_PATH)) {
    console.log('❌ No .env file found');
    return;
  }
  
  const envContent = fs.readFileSync(REAL_ENV_PATH, 'utf8');
  
  if (envContent.includes('USE_MOCK_DATA=true')) {
    console.log('🧪 Currently using: MOCK environment');
    console.log('   - Sandbox transactions only');
    console.log('   - No real money involved');
  } else {
    console.log('🔴 Currently using: REAL environment');
    console.log('   - Live transactions (if production)');
    console.log('   - Check JUSPAY_BASE_URL for environment type');
  }
  
  // Show key config
  const lines = envContent.split('\n');
  lines.forEach(line => {
    if (line.startsWith('JUSPAY_BASE_URL=') || 
        line.startsWith('USE_MOCK_DATA=') ||
        line.startsWith('NODE_ENV=')) {
      console.log(`   ${line}`);
    }
  });
}

function showHelp() {
  console.log(`
🔧 JusPay Environment Switcher

Usage: node envSwitcher.js [command]

Commands:
  mock     Switch to mock/test environment
  real     Switch to real environment  
  status   Show current environment status
  help     Show this help message

Examples:
  node envSwitcher.js mock    # Switch to mock testing
  node envSwitcher.js real    # Switch back to real environment
  node envSwitcher.js status  # Check current environment
`);
}

// Parse command line arguments
const command = process.argv[2];

switch (command) {
  case 'mock':
    switchToMock();
    break;
  case 'real':
    switchToReal();
    break;
  case 'status':
    showStatus();
    break;
  case 'help':
  case undefined:
    showHelp();
    break;
  default:
    console.log(`❌ Unknown command: ${command}`);
    showHelp();
    process.exit(1);
}
