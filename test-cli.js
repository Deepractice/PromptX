#!/usr/bin/env node

console.log('Script started');

try {
  console.log('Importing @promptx/logger...');
  const logger = require('@promptx/logger').default;
  console.log('Logger imported successfully');
  
  console.log('Importing @promptx/core...');
  const core = require('@promptx/core');
  console.log('Core imported successfully');
  
  console.log('Core exports:', Object.keys(core));
} catch (err) {
  console.error('Error during import:', err.message);
  console.error('Stack:', err.stack);
}