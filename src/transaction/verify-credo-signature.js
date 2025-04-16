// verify-credo-signature.js

const crypto = require('crypto');
const fs = require('fs');

// Load raw webhook body (exact string as received)
const rawBody = fs.readFileSync('./payload.json'); // should be raw text, not parsed JSON

// Your Credo secret hash (replace with your real secret)
const secret = '0PRI0972PGQuEcxcG7jl5jgURw74A5BG'; // Store in .env

// Signature header from Credo (as sent in `credo-signature`)
const signatureFromCredo =
  '9613712ad4dee368acfec1f440bb4652fe38f1a23f13ee1c951c4d8b1b693386c1ea6ca25cb48389b898541c19b59937a6190f563a7254f40d6348c9c9e73a85';

// Compute hash
const computedHash = crypto
  .createHmac('sha512', secret)
  .update(rawBody)
  .digest('hex');

console.log('Computed Hash:', computedHash);
console.log('Signature from Credo:', signatureFromCredo);

if (computedHash === signatureFromCredo) {
  console.log('✅ Signature matches');
} else {
  console.log('❌ Signature mismatch');
}
