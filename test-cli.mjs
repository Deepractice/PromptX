#!/usr/bin/env node

console.log('ESM Script started');

try {
  console.log('Importing @promptx/logger...');
  const loggerModule = await import('@promptx/logger');
  console.log('Logger module:', Object.keys(loggerModule));
  const logger = loggerModule.default;
  console.log('Logger imported successfully');
  
  console.log('Importing @promptx/core...');
  const coreModule = await import('@promptx/core');
  console.log('Core module:', Object.keys(coreModule));
  const core = coreModule.default;
  console.log('Core imported successfully');
  
  console.log('Core exports:', Object.keys(core));
} catch (err) {
  console.error('Error during import:', err.message);
  console.error('Stack:', err.stack);
}