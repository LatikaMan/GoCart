// Quick verification script to require key files and ensure they parse
try {
  require('../inngest/client');
  require('../inngest/functions');
  require('../app/api/route');
  console.log('Imports parsed successfully');
} catch (err) {
  console.error('Import error:', err);
  process.exit(1);
}
