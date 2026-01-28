// Magic Link Service
// Handles generation and validation of magic links stored in KV

import { Env, MagicLinkData, MagicLinkMode } from '../types';
import { generateMagicLinkCode } from '../utils';

const THIRTY_DAYS_SECONDS = 30 * 24 * 60 * 60; // 30 days in seconds

/**
 * Generate three magic links for a poll (owner, viewer, taker)
 */
export async function generateMagicLinks(
  env: Env,
  pollId: string
): Promise<{ owner: string; viewer: string; taker: string }> {
  const ownerCode = await createMagicLink(env, pollId, 'owner');
  const viewerCode = await createMagicLink(env, pollId, 'viewer');
  const takerCode = await createMagicLink(env, pollId, 'taker');

  return {
    owner: ownerCode,
    viewer: viewerCode,
    taker: takerCode,
  };
}

/**
 * Create a single magic link and store in KV
 */
async function createMagicLink(
  env: Env,
  pollId: string,
  mode: MagicLinkMode
): Promise<string> {
  // Generate unique code (retry if collision occurs, though highly unlikely)
  let code = generateMagicLinkCode();
  let attempts = 0;
  const maxAttempts = 3;

  while (attempts < maxAttempts) {
    const existing = await env.MAGIC_LINKS.get(code);
    if (!existing) break;
    code = generateMagicLinkCode();
    attempts++;
  }

  const linkData: MagicLinkData = {
    pollId,
    mode,
    createdAt: Date.now(),
  };

  // Store in KV with 30-day TTL
  await env.MAGIC_LINKS.put(code, JSON.stringify(linkData), {
    expirationTtl: THIRTY_DAYS_SECONDS,
  });

  return code;
}

/**
 * Validate a magic link code and return poll ID and mode
 */
export async function validateMagicLink(
  env: Env,
  code: string
): Promise<MagicLinkData | null> {
  const data = await env.MAGIC_LINKS.get(code);
  
  if (!data) {
    return null;
  }

  try {
    return JSON.parse(data) as MagicLinkData;
  } catch (error) {
    console.error('Failed to parse magic link data:', error);
    return null;
  }
}

/**
 * Reset TTL for magic links when poll is accessed
 * This extends the 30-day expiration from the last access
 */
export async function refreshMagicLinks(
  env: Env,
  pollId: string,
  codes: { owner: string; viewer: string; taker: string }
): Promise<void> {
  // Re-write each magic link with fresh TTL
  const promises = Object.entries(codes).map(async ([mode, code]) => {
    const linkData: MagicLinkData = {
      pollId,
      mode: mode as MagicLinkMode,
      createdAt: Date.now(),
    };

    await env.MAGIC_LINKS.put(code, JSON.stringify(linkData), {
      expirationTtl: THIRTY_DAYS_SECONDS,
    });
  });

  await Promise.all(promises);
}

/**
 * Delete magic links for a poll
 */
export async function deleteMagicLinks(
  env: Env,
  codes: string[]
): Promise<void> {
  const promises = codes.map(code => env.MAGIC_LINKS.delete(code));
  await Promise.all(promises);
}
