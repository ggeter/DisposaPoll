// Results Service
// Aggregates and calculates poll results

import { Env, PollResults, QuestionResult, QuestionType, ResultData } from '../types';
import { getPollById } from './polls';
import { updateLastAccessed } from '../utils';

/**
 * Get aggregated results for a poll
 */
export async function getAggregatedResults(
  env: Env,
  pollId: string
): Promise<PollResults | null> {
  const poll = await getPollById(env, pollId);
  if (!poll) {
    return null;
  }

  // Get total number of responses
  const participantCountResult = await env.DB.prepare(
    'SELECT COUNT(*) as count FROM participants WHERE poll_id = ? AND has_submitted = 1'
  )
    .bind(pollId)
    .first();

  const totalResponses = (participantCountResult?.count as number) || 0;

  // Aggregate results for each question
  const questionResults: QuestionResult[] = await Promise.all(
    poll.questions.map(question => aggregateQuestionResults(env, pollId, question.id, question.questionType, question.questionText))
  );

  // Update last accessed timestamp
  await updateLastAccessed(env.DB, pollId);

  return {
    pollId,
    totalResponses,
    questionResults,
  };
}

/**
 * Aggregate results for a single question
 */
async function aggregateQuestionResults(
  env: Env,
  pollId: string,
  questionId: string,
  questionType: QuestionType,
  questionText: string
): Promise<QuestionResult> {
  // Fetch all answers for this question
  const answersResult = await env.DB.prepare(
    'SELECT answer_value FROM answers WHERE question_id = ? AND poll_id = ?'
  )
    .bind(questionId, pollId)
    .all();

  const answers = (answersResult.results || []).map((row: any) => JSON.parse(row.answer_value));

  let results: ResultData = {};

  switch (questionType) {
    case 'single':
      results = aggregateSingleChoice(answers);
      break;
    case 'multiple':
      results = aggregateMultipleChoice(answers);
      break;
    case 'text':
      results = aggregateText(answers);
      break;
    case 'rating':
      results = aggregateRating(answers);
      break;
  }

  return {
    questionId,
    questionText,
    questionType,
    results,
  };
}

/**
 * Aggregate single-choice question results
 */
function aggregateSingleChoice(answers: any[]): ResultData {
  const optionCounts: Record<string, number> = {};
  
  answers.forEach(answer => {
    const value = answer.value as string;
    optionCounts[value] = (optionCounts[value] || 0) + 1;
  });

  const total = answers.length;
  const percentages: Record<string, number> = {};
  
  Object.keys(optionCounts).forEach(option => {
    percentages[option] = total > 0 ? (optionCounts[option] / total) * 100 : 0;
  });

  return {
    singleChoice: {
      optionCounts,
      percentages,
    },
  };
}

/**
 * Aggregate multiple-choice question results
 */
function aggregateMultipleChoice(answers: any[]): ResultData {
  const optionCounts: Record<string, number> = {};
  
  answers.forEach(answer => {
    const values = answer.value as string[];
    values.forEach(value => {
      optionCounts[value] = (optionCounts[value] || 0) + 1;
    });
  });

  return {
    multipleChoice: {
      optionCounts,
    },
  };
}

/**
 * Aggregate text question results
 */
function aggregateText(answers: any[]): ResultData {
  const responses = answers.map(answer => answer.value as string);
  
  return {
    text: {
      responses,
    },
  };
}

/**
 * Aggregate rating question results
 */
function aggregateRating(answers: any[]): ResultData {
  const distribution: Record<number, number> = {
    1: 0,
    2: 0,
    3: 0,
    4: 0,
    5: 0,
  };
  
  let sum = 0;
  answers.forEach(answer => {
    const rating = answer.value as number;
    distribution[rating] = (distribution[rating] || 0) + 1;
    sum += rating;
  });

  const average = answers.length > 0 ? sum / answers.length : 0;

  return {
    rating: {
      average: Math.round(average * 10) / 10, // Round to 1 decimal place
      distribution,
    },
  };
}
