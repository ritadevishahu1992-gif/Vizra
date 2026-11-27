import express from 'express';
import http from 'http';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { setupVizraEngageRoutes } from '../src/server/engage/engageRoutes';
import {
  updateEngageConfig,
  upsertEngageContent,
  setEngageContentApproval,
  deleteEngageContent,
} from '../src/server/engage/engageStore';
import { selectEngageInventory } from '../src/server/engage/engageSelectionEngine';
import {
  VizraEngageBanner,
  VIZRA_ENGAGE_TAGLINE,
  deriveCoarseIntentFromMode,
} from '../src/components/ai/engage/VizraEngageBanner';
import { deriveEngageLifecycleFromMessage, ChatMessage } from '../src/components/ai/ChatMessage';
import {
  logSafeInteractionEvent,
  getLoggedSafeInteractionEvents,
  clearLoggedSafeInteractionEvents,
} from '../src/services/engageEventLogger';

async function runVizraEngageTests() {
  console.log('==============================================================');
  console.log(' VIZRA ENGAGE — PHASE 2.1 & FULL LIFECYCLE VERIFICATION SUITE');
  console.log('==============================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, id: string, desc: string) {
    if (condition) {
      console.log(`✅ [PASS] ${id}: ${desc}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${id}: ${desc}`);
      failed++;
    }
  }

  // Ensure Engage is enabled initially
  updateEngageConfig({ enabled: true, sponsoredEnabled: true, affiliateEnabled: true });

  // ---------------------------------------------------------------------------
  // PART A: BACKEND & GOVERNANCE CHECKS (ENGAGE-01 .. ENGAGE-11)
  // ---------------------------------------------------------------------------
  const selection = selectEngageInventory({ mode: 'code', sessionHash: 'test-sess-1', limit: 6 });
  assert(
    selection.enabled === true && selection.items.length > 0,
    'ENGAGE-01',
    'Selection engine returns approved & active contextual content for mode="code"'
  );

  const hasPendingItem = selection.items.some((i) => i.approvalStatus !== 'approved');
  assert(
    !hasPendingItem,
    'ENGAGE-02',
    'Unapproved / pending_review items are strictly excluded from public selection'
  );

  const expiredItem = upsertEngageContent({
    title: 'Expired Promo Card',
    body: 'This card is past its expiration timestamp.',
    type: 'knowledge_card',
    category: 'Test',
    sponsorshipLabel: 'None',
    approvalStatus: 'approved',
    enabled: true,
    expiresAt: '2020-01-01T00:00:00.000Z',
  });
  const afterExpired = selectEngageInventory({ mode: 'quick', sessionHash: 'test-sess-2', limit: 10 });
  assert(
    !afterExpired.items.some((i) => i.id === expiredItem.id),
    'ENGAGE-03',
    'Expired content items are automatically excluded from selection'
  );
  deleteEngageContent(expiredItem.id);

  const draftItem = upsertEngageContent({
    title: 'Pending Governance Item',
    body: 'Should only appear after explicit approval.',
    type: 'creative_tip',
    category: 'Governance',
    sponsorshipLabel: 'None',
    approvalStatus: 'pending_review',
    enabled: true,
    priority: 99,
  });
  const whilePending = selectEngageInventory({ mode: 'quick', sessionHash: 'test-sess-3', limit: 10 });
  assert(
    !whilePending.items.some((i) => i.id === draftItem.id),
    'ENGAGE-04',
    'Newly submitted pending_review content is withheld until administrator approval'
  );

  setEngageContentApproval(draftItem.id, 'approved', 'security-admin@vizra.ai');
  const afterApproval = selectEngageInventory({ mode: 'quick', sessionHash: 'test-sess-3', limit: 10 });
  assert(
    afterApproval.items.some((i) => i.id === draftItem.id),
    'ENGAGE-05',
    'Approved content immediately becomes eligible for serving'
  );
  deleteEngageContent(draftItem.id);

  const app = express();
  app.use(express.json());
  setupVizraEngageRoutes(app);
  const server = http.createServer(app);

  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', () => resolve()));
  const addr = server.address() as { port: number };
  const baseUrl = `http://127.0.0.1:${addr.port}`;

  try {
    const selRes = await fetch(`${baseUrl}/api/engage/select?mode=research&session=http-test-1`);
    const selData = await selRes.json();
    assert(
      selRes.status === 200 && selData.success === true && Array.isArray(selData.items),
      'ENGAGE-06',
      'GET /api/engage/select returns 200 OK with contextual inventory'
    );

    const eventPayload = {
      eventType: 'impression',
      contentId: 'eng-vis-neural-synthesis',
      contentType: 'visualization',
      category: 'AI Architecture',
      sessionHash: 'dedupe-session-99',
      mode: 'quick',
      lifecycleState: 'generating',
      renderLatencyMs: 11,
      dedupeKey: 'fixed-dedupe-key-001',
    };

    const evRes1 = await fetch(`${baseUrl}/api/engage/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(eventPayload),
    });
    const evData1 = await evRes1.json();

    const evRes2 = await fetch(`${baseUrl}/api/engage/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(eventPayload),
    });
    const evData2 = await evRes2.json();

    assert(
      evData1.recorded === true && evData2.recorded === false && evData2.deduplicated === true,
      'ENGAGE-07',
      'POST /api/engage/events records first impression and deduplicates rapid duplicate events'
    );

    const ssrfRes = await fetch(`${baseUrl}/api/engage/admin/campaigns`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Malicious Metadata Campaign',
        partnerId: 'partner-vizra-studio',
        destinationUrl: 'http://169.254.169.254/latest/meta-data/',
      }),
    });
    assert(
      ssrfRes.status === 400,
      'ENGAGE-08',
      'POST /api/engage/admin/campaigns rejects private/metadata SSRF destination URLs (400)'
    );

    const forgedKeyRes = await fetch(`${baseUrl}/api/engage/admin/overview`, {
      headers: { 'X-Admin-Key': 'forged-invalid-admin-key' },
    });
    assert(
      forgedKeyRes.status === 401,
      'ENGAGE-09',
      'GET /api/engage/admin/overview rejects invalid X-Admin-Key with 401 Unauthorized'
    );

    const forgedJwtRes = await fetch(`${baseUrl}/api/engage/admin/overview`, {
      headers: { Authorization: 'Bearer forged.jwt.token' },
    });
    assert(
      forgedJwtRes.status === 401,
      'ENGAGE-10',
      'GET /api/engage/admin/overview rejects malformed/forged Bearer JWT with 401 Unauthorized'
    );

    updateEngageConfig({ enabled: false });
    const disabledSel = selectEngageInventory({ mode: 'quick', sessionHash: 'test-kill' });
    assert(
      disabledSel.enabled === false && disabledSel.items.length === 0,
      'ENGAGE-11',
      'Global kill-switch immediately disables Engage inventory without affecting Omnia chat'
    );
    updateEngageConfig({ enabled: true });
  } finally {
    server.close();
  }

  // ---------------------------------------------------------------------------
  // PART B: PHASE 2.1 FRONTEND LIFECYCLE & COMPONENT STABILIZATION SCENARIOS
  // ---------------------------------------------------------------------------
  console.log('\n--- Phase 2.1 Frontend Lifecycle & Stabilization Scenarios ---');

  // Scenario 1: Normal generation (waiting for first token)
  const genLifecycle = deriveEngageLifecycleFromMessage({
    status: 'streaming',
    content: '',
  });
  const genHtml = renderToStaticMarkup(
    React.createElement(VizraEngageBanner, {
      lifecycleState: genLifecycle,
      mode: 'code',
      hasStreamedTokens: false,
    })
  );
  assert(
    genLifecycle === 'generating' &&
      genHtml.includes('OMNIA 1.0 • Synthesizing Response') &&
      genHtml.includes(VIZRA_ENGAGE_TAGLINE),
    'PHASE2.1-S01',
    'Scenario 1 (Normal generation): Renders full VIZRA Engage waiting experience during generating state'
  );

  // Scenario 2: First streaming token arrives
  const firstTokenLifecycle = deriveEngageLifecycleFromMessage({
    status: 'streaming',
    content: 'Here',
  });
  const firstTokenHtml = renderToStaticMarkup(
    React.createElement(VizraEngageBanner, {
      lifecycleState: firstTokenLifecycle,
      mode: 'code',
      hasStreamedTokens: true,
    })
  );
  assert(
    firstTokenLifecycle === 'streaming' &&
      firstTokenHtml.includes('VIZRA Engage Compact Streaming Indicator') &&
      !firstTokenHtml.includes(VIZRA_ENGAGE_TAGLINE),
    'PHASE2.1-S02',
    'Scenario 2 (First streaming token): Immediately collapses into compact 1-line indicator when first token arrives'
  );

  // Scenario 3: Multiple streaming chunks inside ChatMessage
  const multiChunkHtml = renderToStaticMarkup(
    React.createElement(ChatMessage, {
      message: {
        id: 'asst-stream-1',
        role: 'assistant',
        content: 'Streaming chunk 1, chunk 2, and chunk 3 clearly visible.',
        timestamp: '12:00 PM',
        status: 'streaming',
        mode: 'research',
      },
    })
  );
  assert(
    multiChunkHtml.includes('Streaming chunk 1, chunk 2, and chunk 3 clearly visible.') &&
      multiChunkHtml.includes('VIZRA Engage Compact Streaming Indicator'),
    'PHASE2.1-S03',
    'Scenario 3 (Multiple streaming chunks): Streaming answer text is prioritized and never hidden or obstructed'
  );

  // Scenario 4: Successful completion
  const completedLifecycle = deriveEngageLifecycleFromMessage({
    status: 'done',
    content: 'Final completed answer.',
  });
  const completedBannerHtml = renderToStaticMarkup(
    React.createElement(VizraEngageBanner, {
      lifecycleState: completedLifecycle,
      mode: 'quick',
      hasStreamedTokens: true,
    })
  );
  assert(
    completedLifecycle === 'completed' && completedBannerHtml === '',
    'PHASE2.1-S04',
    'Scenario 4 (Successful completion): Engage cleanly unmounts (returns null) upon completion'
  );

  // Scenario 5: User cancellation
  const cancelledLifecycle = deriveEngageLifecycleFromMessage({
    status: 'cancelled',
    content: 'Synthesis cancelled by user.',
  });
  const cancelledBannerHtml = renderToStaticMarkup(
    React.createElement(VizraEngageBanner, {
      lifecycleState: cancelledLifecycle,
      mode: 'quick',
      hasStreamedTokens: false,
    })
  );
  const cancelledMsgHtml = renderToStaticMarkup(
    React.createElement(ChatMessage, {
      message: {
        id: 'asst-cancel-1',
        role: 'assistant',
        content: '',
        timestamp: '12:01 PM',
        status: 'cancelled',
        mode: 'quick',
      },
    })
  );
  assert(
    cancelledLifecycle === 'cancelled' &&
      cancelledBannerHtml === '' &&
      cancelledMsgHtml.includes('Synthesis cancelled by user.') &&
      !cancelledMsgHtml.includes('VIZRA Engage'),
    'PHASE2.1-S05',
    'Scenario 5 (User cancellation): Engage disappears immediately on cancellation and fallback message renders safely'
  );

  // Scenario 6: Generation failure / error state
  const failedLifecycle = deriveEngageLifecycleFromMessage({
    status: 'error',
    content: '',
  });
  const failedBannerHtml = renderToStaticMarkup(
    React.createElement(VizraEngageBanner, {
      lifecycleState: failedLifecycle,
      mode: 'quick',
      hasStreamedTokens: false,
    })
  );
  const failedMsgHtml = renderToStaticMarkup(
    React.createElement(ChatMessage, {
      message: {
        id: 'asst-err-1',
        role: 'assistant',
        content: '',
        timestamp: '12:02 PM',
        status: 'error',
        mode: 'quick',
      },
    })
  );
  assert(
    failedLifecycle === 'failed' &&
      failedBannerHtml === '' &&
      failedMsgHtml.includes('An error occurred during inference. Please retry.') &&
      !failedMsgHtml.includes('VIZRA Engage'),
    'PHASE2.1-S06',
    'Scenario 6 (Generation failure): Engage never appears during error states'
  );

  // Scenario 7: Very fast responses (idle -> completed)
  const idleHtml = renderToStaticMarkup(
    React.createElement(VizraEngageBanner, {
      lifecycleState: 'idle',
      mode: 'quick',
    })
  );
  const fastCompleteHtml = renderToStaticMarkup(
    React.createElement(VizraEngageBanner, {
      lifecycleState: 'completed',
      mode: 'quick',
      hasStreamedTokens: true,
    })
  );
  assert(
    idleHtml === '' && fastCompleteHtml === '',
    'PHASE2.1-S07',
    'Scenario 7 (Very fast responses): Rapid idle -> completed transition leaves zero residual Engage UI'
  );

  // Scenario 8: Repeated messages across modes & coarse intents
  const codeIntent = deriveCoarseIntentFromMode('code');
  const scienceIntent = deriveCoarseIntentFromMode('science');
  const researchIntent = deriveCoarseIntentFromMode('research');
  const turn1Html = renderToStaticMarkup(
    React.createElement(VizraEngageBanner, {
      lifecycleState: 'generating',
      mode: 'science',
    })
  );
  const turn2Html = renderToStaticMarkup(
    React.createElement(VizraEngageBanner, {
      lifecycleState: 'generating',
      mode: 'code',
    })
  );
  assert(
    codeIntent === 'coding' &&
      scienceIntent === 'science' &&
      researchIntent === 'research' &&
      turn1Html.includes('science mode') &&
      turn2Html.includes('code mode'),
    'PHASE2.1-S08',
    'Scenario 8 (Repeated messages): Consecutive turns across modes cleanly reset context and derive coarseIntent'
  );

  // Scenario 9: Mobile viewport responsiveness classes
  assert(
    genHtml.includes('w-full max-w-2xl') &&
      genHtml.includes('hidden sm:inline-block') &&
      genHtml.includes('break-words'),
    'PHASE2.1-S09',
    'Scenario 9 (Mobile viewport): Responsive width constraints, word-wrapping, and mobile header compaction applied'
  );

  // Scenario 10: Reduced-motion preference enabled
  const reducedMotionHtml = renderToStaticMarkup(
    React.createElement(VizraEngageBanner, {
      lifecycleState: 'generating',
      mode: 'quick',
      forceReducedMotion: true,
    })
  );
  assert(
    !reducedMotionHtml.includes('animate-ping') &&
      !reducedMotionHtml.includes('animate-pulse'),
    'PHASE2.1-S10',
    'Scenario 10 (Reduced-motion enabled): Disables pulsing/pinging animations when reduced motion is active'
  );

  // Scenario 11: Engage component rendering failure (Error Boundary isolation)
  // Note: In SSR renderToStaticMarkup, React error boundaries do not catch like client DOM,
  // so we verify both EngageErrorBoundary's getDerivedStateFromError + render() contract directly.
  const { EngageErrorBoundary } = await import(
    '../src/components/ai/engage/EngageErrorBoundary'
  );
  const boundaryInstance = new EngageErrorBoundary({
    lifecycleState: 'generating',
    hasStreamedTokens: false,
    children: null,
  });
  boundaryInstance.state = EngageErrorBoundary.getDerivedStateFromError(
    new Error('Test render crash')
  );
  const fallbackElement = boundaryInstance.render() as React.ReactElement;
  const fallbackHtml = renderToStaticMarkup(fallbackElement);

  const boundaryStreamingInstance = new EngageErrorBoundary({
    lifecycleState: 'streaming',
    hasStreamedTokens: true,
    children: null,
  });
  boundaryStreamingInstance.state = { hasError: true };
  const streamingFallbackResult = boundaryStreamingInstance.render();

  const boundaryCompletedInstance = new EngageErrorBoundary({
    lifecycleState: 'completed',
    hasStreamedTokens: true,
    children: null,
  });
  boundaryCompletedInstance.state = { hasError: true };
  const completedFallbackResult = boundaryCompletedInstance.render();

  assert(
    fallbackHtml.includes('OMNIA 1.0 is synthesizing…') &&
      streamingFallbackResult === null &&
      completedFallbackResult === null,
    'PHASE2.1-S11',
    'Scenario 11 (Error boundary failure): Renders minimal fallback during generating, collapses on streaming/completed'
  );

  // Scenario 12: Privacy-compliant zero-PII event logging service
  clearLoggedSafeInteractionEvents();
  const loggedEntry = logSafeInteractionEvent('chat_initiated', {
    mode: 'research',
    model: 'omnia-1.0',
    hasAttachments: false,
    // Attempt to inject forbidden PII fields:
    prompt: 'Secret private prompt text',
    email: 'private@user.com',
    uid: 'user-secret-uid-123',
    content: 'Private message content',
  } as any);
  const allLogged = getLoggedSafeInteractionEvents();
  const serializedLog = JSON.stringify(allLogged);

  assert(
    allLogged.length === 1 &&
      loggedEntry.payload.mode === 'research' &&
      !serializedLog.includes('Secret private prompt text') &&
      !serializedLog.includes('private@user.com') &&
      !serializedLog.includes('user-secret-uid-123'),
    'PHASE2.1-S12',
    'Scenario 12 (Zero-PII Event Logger): Records interaction flow telemetry while strictly stripping PII and prompt content'
  );

  console.log('\n==============================================================');
  console.log(` SUMMARY: ${passed}/${passed + failed} checks passed`);
  console.log('==============================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runVizraEngageTests().catch((err) => {
  console.error('Fatal error in VIZRA Engage test suite:', err);
  process.exit(1);
});
