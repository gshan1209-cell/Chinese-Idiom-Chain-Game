import assert from 'node:assert/strict';
import test from 'node:test';

import {
  isIosLikeDevice,
  isStandaloneDisplay,
  requestPwaInstallation
} from '../.test-dist/src/pwa/install.js';

test('detects iPhone and iPadOS devices without treating desktop Mac as iOS', () => {
  assert.equal(
    isIosLikeDevice({ userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0)', platform: 'iPhone', maxTouchPoints: 5 }),
    true
  );
  assert.equal(
    isIosLikeDevice({ userAgent: 'Mozilla/5.0 (Macintosh)', platform: 'MacIntel', maxTouchPoints: 5 }),
    true
  );
  assert.equal(
    isIosLikeDevice({ userAgent: 'Mozilla/5.0 (Macintosh)', platform: 'MacIntel', maxTouchPoints: 0 }),
    false
  );
});

test('recognizes browser and iOS standalone display modes', () => {
  assert.equal(isStandaloneDisplay(true, false), true);
  assert.equal(isStandaloneDisplay(false, true), true);
  assert.equal(isStandaloneDisplay(false, false), false);
});

test('requests installation and returns accepted outcome', async () => {
  let promptCalls = 0;
  const result = await requestPwaInstallation({
    prompt: async () => { promptCalls += 1; },
    userChoice: Promise.resolve({ outcome: 'accepted', platform: 'web' })
  });

  assert.equal(promptCalls, 1);
  assert.deepEqual(result, { outcome: 'accepted', platform: 'web' });
});

test('returns dismissed outcome without throwing', async () => {
  const result = await requestPwaInstallation({
    prompt: async () => {},
    userChoice: Promise.resolve({ outcome: 'dismissed', platform: '' })
  });

  assert.equal(result.outcome, 'dismissed');
});
