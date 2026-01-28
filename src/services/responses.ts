// Responses Service
// Handles poll response submission and validation

import { Env, SubmitResponseRequest, Participant, Answer } from '../types';
import { generateUUID, updateLastAccessed } from '../utils';
import { lockPoll, incrementParticipantCount } from './polls';

/**
 * Check if a session has already submitted a response to this poll
 */
export async function hasParticipated(
  env: Env,
  pollId: string,
  sessionId: string
): Promise<boolean> {
  const result = await env.DB.prepare(
    'SELECT id FROM participants WHERE poll_id = ? AND session_id = ?'
  )
    .bind(pollId, sessionId)
    .first();

  return result !== null;
}

/**
 * Submit poll responses
 */
export async function submitResponse(
  env: Env,
  request: SubmitResponseRequest
): Promise<{ success: boolean; participantId: string }> {
  const { pollCode, sessionId, answers } = request;

  // Validate that poll exists via magic link
  // This is validated before calling this function

  // Check for duplicate submission
  const alreadyParticipated = await hasParticipated(env, pollCode, sessionId);
  if (alreadyParticipated) {
    throw new Error('This session has already submitted a response to this poll');
  }

  const participantId = generateUUID();
  const now = new Date().toISOString();

  // Create participant record
  await env.DB.prepare(
    `INSERT INTO participants (id, poll_id, session_id, joined_at, submitted_at, has_submitted)
     VALUES (?, ?, ?, ?, ?, 1)`
  )
    .bind(participantId, pollCode, sessionId, now, now)
    .run();

  // Insert all answers
  const answerPromises = answers.map(async (answer) => {
    const answerId = generateUUID();
    const answerValueJson = JSON.stringify(answer.answerValue);

    return env.DB.prepare(
      `INSERT INTO answers (id, participant_id, question_id, poll_id, answer_value, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`
    )
      .bind(answerId, participantId, answer.questionId, pollCode, answerValueJson, now)
      .run();
  });

  await Promise.all(answerPromises);

  // Lock the poll (idempotent - won't error if already locked)
  await lockPoll(env, pollCode);

  // Increment participant count
  await incrementParticipantCount(env, pollCode);

  // Update last accessed timestamp
  await updateLastAccessed(env.DB, pollCode);

  return { success: true, participantId };
}

/**
 * Get participant by ID
 */
export async function getParticipant(
  env: Env,
  participantId: string
): Promise<Participant | null> {
  const result = await env.DB.prepare(
    'SELECT * FROM participants WHERE id = ?'
  )
    .bind(participantId)
    .first();

  if (!result) {
    return null;
  }

  return {
    id: result.id as string,
    pollId: result.poll_id as string,
    sessionId: result.session_id as string,
    joinedAt: result.joined_at as string,
    submittedAt: result.submitted_at as string | undefined,
    hasSubmitted: Boolean(result.has_submitted),
  };
}

/**
 * Get all answers for a participant
 */
export async function getParticipantAnswers(
  env: Env,
  participantId: string
): Promise<Answer[]> {
  const result = await env.DB.prepare(
    'SELECT * FROM answers WHERE participant_id = ?'
  )
    .bind(participantId)
    .all();

  return (result.results || []).map((row: any) => ({
    id: row.id,
    participantId: row.participant_id,
    questionId: row.question_id,
    pollId: row.poll_id,
    answerValue: JSON.parse(row.answer_value),
    createdAt: row.created_at,
  }));
}
