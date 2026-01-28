// Polls Service
// Handles CRUD operations for polls and questions in D1

import { Env, Poll, Question, CreatePollRequest } from '../types';
import { generateUUID, updateLastAccessed } from '../utils';
import { generateMagicLinks } from './magicLinks';

/**
 * Create a new poll with questions
 */
export async function createPoll(
  env: Env,
  request: CreatePollRequest
): Promise<{ poll: Poll; magicLinks: { owner: string; viewer: string; taker: string } }> {
  const pollId = generateUUID();
  const now = new Date().toISOString();

  // Generate magic links first
  const magicLinks = await generateMagicLinks(env, pollId);

  // Insert poll record with magic link codes
  await env.DB.prepare(
    `INSERT INTO polls (id, title, description, created_at, last_accessed, is_locked, total_participants, owner_code, viewer_code, taker_code)
     VALUES (?, ?, ?, ?, ?, 0, 0, ?, ?, ?)`
  )
    .bind(pollId, request.title, request.description || null, now, now, magicLinks.owner, magicLinks.viewer, magicLinks.taker)
    .run();

  // Insert questions
  const questionPromises = request.questions.map((q, index) => {
    const questionId = generateUUID();
    const optionsJson = q.options ? JSON.stringify(q.options) : null;

    return env.DB.prepare(
      `INSERT INTO questions (id, poll_id, question_text, question_type, options, order_index)
       VALUES (?, ?, ?, ?, ?, ?)`
    )
      .bind(questionId, pollId, q.questionText, q.questionType, optionsJson, index)
      .run();
  });

  await Promise.all(questionPromises);

  // Fetch and return the created poll
  const poll = await getPollById(env, pollId);
  if (!poll) {
    throw new Error('Failed to retrieve created poll');
  }

  return { poll, magicLinks };
}

/**
 * Get poll by ID with all questions
 */
export async function getPollById(env: Env, pollId: string): Promise<Poll | null> {
  // Fetch poll
  const pollResult = await env.DB.prepare(
    'SELECT * FROM polls WHERE id = ?'
  )
    .bind(pollId)
    .first();

  if (!pollResult) {
    return null;
  }

  // Fetch questions
  const questionsResult = await env.DB.prepare(
    'SELECT * FROM questions WHERE poll_id = ? ORDER BY order_index'
  )
    .bind(pollId)
    .all();

  const questions: Question[] = (questionsResult.results || []).map((row: any) => ({
    id: row.id,
    pollId: row.poll_id,
    questionText: row.question_text,
    questionType: row.question_type,
    options: row.options ? JSON.parse(row.options) : undefined,
    orderIndex: row.order_index,
  }));

  const poll: Poll = {
    id: pollResult.id as string,
    title: pollResult.title as string,
    description: pollResult.description as string | undefined,
    createdAt: pollResult.created_at as string,
    lastAccessed: pollResult.last_accessed as string,
    isLocked: Boolean(pollResult.is_locked),
    totalParticipants: pollResult.total_participants as number,
    questions,
  };

  return poll;
}

/**
 * Update poll (only if not locked)
 */
export async function updatePoll(
  env: Env,
  pollId: string,
  updates: { title?: string; description?: string }
): Promise<Poll | null> {
  // Check if poll is locked
  const poll = await getPollById(env, pollId);
  if (!poll) {
    return null;
  }

  if (poll.isLocked) {
    throw new Error('Cannot update poll: poll is locked (has responses)');
  }

  // Build update query dynamically
  const fields: string[] = [];
  const values: any[] = [];

  if (updates.title !== undefined) {
    fields.push('title = ?');
    values.push(updates.title);
  }

  if (updates.description !== undefined) {
    fields.push('description = ?');
    values.push(updates.description);
  }

  if (fields.length === 0) {
    return poll;
  }

  fields.push('last_accessed = CURRENT_TIMESTAMP');
  values.push(pollId);

  await env.DB.prepare(
    `UPDATE polls SET ${fields.join(', ')} WHERE id = ?`
  )
    .bind(...values)
    .run();

  // Update last accessed timestamp
  await updateLastAccessed(env.DB, pollId);

  return await getPollById(env, pollId);
}

/**
 * Delete poll and all associated data
 */
export async function deletePoll(env: Env, pollId: string): Promise<boolean> {
  const result = await env.DB.prepare('DELETE FROM polls WHERE id = ?')
    .bind(pollId)
    .run();

  return (result.meta.changes || 0) > 0;
}

/**
 * Lock poll (called when first response is submitted)
 */
export async function lockPoll(env: Env, pollId: string): Promise<void> {
  await env.DB.prepare('UPDATE polls SET is_locked = 1 WHERE id = ?')
    .bind(pollId)
    .run();
}

/**
 * Increment participant count
 */
export async function incrementParticipantCount(env: Env, pollId: string): Promise<void> {
  await env.DB.prepare(
    'UPDATE polls SET total_participants = total_participants + 1 WHERE id = ?'
  )
    .bind(pollId)
    .run();
}

/**
 * Copy poll to create a new one with new magic links (no responses)
 */
export async function copyPoll(
  env: Env,
  sourcePollId: string
): Promise<{ poll: Poll; magicLinks: { owner: string; viewer: string; taker: string } } | null> {
  const sourcePoll = await getPollById(env, sourcePollId);
  if (!sourcePoll) {
    return null;
  }

  // Create new poll with same structure
  const createRequest: CreatePollRequest = {
    title: `${sourcePoll.title} (Copy)`,
    description: sourcePoll.description,
    questions: sourcePoll.questions.map(q => ({
      questionText: q.questionText,
      questionType: q.questionType,
      options: q.options,
    })),
  };

  return await createPoll(env, createRequest);
}

/**
 * Get magic link codes for a poll from the database
 */
export async function getPollMagicLinks(
  env: Env,
  pollId: string
): Promise<{ owner: string; viewer: string; taker: string } | null> {
  const result = await env.DB.prepare(
    'SELECT owner_code, viewer_code, taker_code FROM polls WHERE id = ?'
  )
    .bind(pollId)
    .first();

  if (!result) {
    return null;
  }

  return {
    owner: result.owner_code as string,
    viewer: result.viewer_code as string,
    taker: result.taker_code as string,
  };
}
