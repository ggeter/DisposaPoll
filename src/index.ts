// DisposaPoll Worker
// Main entry point for API routing

import { Env, CreatePollRequest, SubmitResponseRequest } from './types';
import { corsHeaders, errorResponse, jsonResponse, parseRequestBody, generateSessionId } from './utils';
import { validateMagicLink } from './services/magicLinks';
import { createPoll, getPollById, updatePoll, deletePoll, copyPoll } from './services/polls';
import { submitResponse, hasParticipated } from './services/responses';
import { getAggregatedResults } from './services/results';

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const { pathname } = url;
    const method = request.method;

    // Handle CORS preflight requests
    if (method === 'OPTIONS') {
      return new Response(null, {
        headers: corsHeaders(),
      });
    }

    try {
      // Route API requests
      if (pathname.startsWith('/api/')) {
        return await handleApiRequest(request, env, pathname, method);
      }

      // Static assets are served automatically by Workers Assets
      // If no asset found, return 404
      return new Response('Not found', { status: 404 });
    } catch (error) {
      console.error('Worker error:', error);
      const message = error instanceof Error ? error.message : 'Internal server error';
      return errorResponse(message, 500);
    }
  },
};

/**
 * Handle API requests
 */
async function handleApiRequest(
  request: Request,
  env: Env,
  pathname: string,
  method: string
): Promise<Response> {
  // POST /api/polls - Create new poll
  if (pathname === '/api/polls' && method === 'POST') {
    return await handleCreatePoll(request, env);
  }

  // GET /api/polls/:code - Fetch poll by magic link
  const pollMatch = pathname.match(/^\/api\/polls\/([^\/]+)$/);
  if (pollMatch && method === 'GET') {
    return await handleGetPoll(env, pollMatch[1]);
  }

  // PUT /api/polls/:code - Update poll
  if (pollMatch && method === 'PUT') {
    return await handleUpdatePoll(request, env, pollMatch[1]);
  }

  // DELETE /api/polls/:code - Delete poll
  if (pollMatch && method === 'DELETE') {
    return await handleDeletePoll(env, pollMatch[1]);
  }

  // POST /api/polls/:code/copy - Clone poll
  const copyMatch = pathname.match(/^\/api\/polls\/([^\/]+)\/copy$/);
  if (copyMatch && method === 'POST') {
    return await handleCopyPoll(env, copyMatch[1]);
  }

  // POST /api/responses - Submit poll answers
  if (pathname === '/api/responses' && method === 'POST') {
    return await handleSubmitResponse(request, env);
  }

  // GET /api/results/:code - Fetch aggregated results
  const resultsMatch = pathname.match(/^\/api\/results\/([^\/]+)$/);
  if (resultsMatch && method === 'GET') {
    return await handleGetResults(env, resultsMatch[1]);
  }

  // POST /api/validate - Check if user already participated
  if (pathname === '/api/validate' && method === 'POST') {
    return await handleValidateParticipation(request, env);
  }

  return errorResponse('Not found', 404);
}

/**
 * POST /api/polls - Create new poll
 */
async function handleCreatePoll(request: Request, env: Env): Promise<Response> {
  const body = await parseRequestBody<CreatePollRequest>(request);

  // Validate required fields
  if (!body.title || !body.questions || body.questions.length === 0) {
    return errorResponse('Title and at least one question are required');
  }

  // Validate questions
  for (const q of body.questions) {
    if (!q.questionText || !q.questionType) {
      return errorResponse('Each question must have text and type');
    }
    if ((q.questionType === 'single' || q.questionType === 'multiple') && (!q.options || q.options.length === 0)) {
      return errorResponse('Choice questions must have options');
    }
  }

  const result = await createPoll(env, body);

  return jsonResponse({
    success: true,
    poll: result.poll,
    magicLinks: result.magicLinks,
  }, 201);
}

/**
 * GET /api/polls/:code - Fetch poll by magic link
 */
async function handleGetPoll(env: Env, code: string): Promise<Response> {
  const linkData = await validateMagicLink(env, code);
  
  if (!linkData) {
    return errorResponse('Invalid or expired magic link', 404);
  }

  const poll = await getPollById(env, linkData.pollId);
  
  if (!poll) {
    return errorResponse('Poll not found', 404);
  }

  return jsonResponse({
    poll,
    mode: linkData.mode,
  });
}

/**
 * PUT /api/polls/:code - Update poll
 */
async function handleUpdatePoll(request: Request, env: Env, code: string): Promise<Response> {
  const linkData = await validateMagicLink(env, code);
  
  if (!linkData) {
    return errorResponse('Invalid or expired magic link', 404);
  }

  if (linkData.mode !== 'owner') {
    return errorResponse('Only poll owner can update poll', 403);
  }

  const body = await parseRequestBody<{ title?: string; description?: string }>(request);

  try {
    const updatedPoll = await updatePoll(env, linkData.pollId, body);
    
    if (!updatedPoll) {
      return errorResponse('Poll not found', 404);
    }

    return jsonResponse({
      success: true,
      poll: updatedPoll,
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes('locked')) {
      return errorResponse(error.message, 400);
    }
    throw error;
  }
}

/**
 * DELETE /api/polls/:code - Delete poll
 */
async function handleDeletePoll(env: Env, code: string): Promise<Response> {
  const linkData = await validateMagicLink(env, code);
  
  if (!linkData) {
    return errorResponse('Invalid or expired magic link', 404);
  }

  if (linkData.mode !== 'owner') {
    return errorResponse('Only poll owner can delete poll', 403);
  }

  const deleted = await deletePoll(env, linkData.pollId);
  
  if (!deleted) {
    return errorResponse('Poll not found', 404);
  }

  return jsonResponse({
    success: true,
    message: 'Poll deleted successfully',
  });
}

/**
 * POST /api/polls/:code/copy - Clone poll
 */
async function handleCopyPoll(env: Env, code: string): Promise<Response> {
  const linkData = await validateMagicLink(env, code);
  
  if (!linkData) {
    return errorResponse('Invalid or expired magic link', 404);
  }

  if (linkData.mode !== 'owner') {
    return errorResponse('Only poll owner can copy poll', 403);
  }

  const result = await copyPoll(env, linkData.pollId);
  
  if (!result) {
    return errorResponse('Poll not found', 404);
  }

  return jsonResponse({
    success: true,
    poll: result.poll,
    magicLinks: result.magicLinks,
  }, 201);
}

/**
 * POST /api/responses - Submit poll answers
 */
async function handleSubmitResponse(request: Request, env: Env): Promise<Response> {
  const body = await parseRequestBody<{ pollCode: string; answers: any[] }>(request);

  // Validate magic link
  const linkData = await validateMagicLink(env, body.pollCode);
  
  if (!linkData) {
    return errorResponse('Invalid or expired poll link', 404);
  }

  // Generate session ID from request
  const sessionId = await generateSessionId(request);

  const submitRequest: SubmitResponseRequest = {
    pollCode: linkData.pollId,
    sessionId,
    answers: body.answers,
  };

  try {
    const result = await submitResponse(env, submitRequest);
    
    return jsonResponse({
      success: true,
      participantId: result.participantId,
      message: 'Response submitted successfully',
    }, 201);
  } catch (error) {
    if (error instanceof Error && error.message.includes('already submitted')) {
      return errorResponse(error.message, 409);
    }
    throw error;
  }
}

/**
 * GET /api/results/:code - Fetch aggregated results
 */
async function handleGetResults(env: Env, code: string): Promise<Response> {
  const linkData = await validateMagicLink(env, code);
  
  if (!linkData) {
    return errorResponse('Invalid or expired magic link', 404);
  }

  if (linkData.mode !== 'viewer' && linkData.mode !== 'owner') {
    return errorResponse('Only poll owner or viewer can access results', 403);
  }

  const results = await getAggregatedResults(env, linkData.pollId);
  
  if (!results) {
    return errorResponse('Poll not found', 404);
  }

  return jsonResponse(results);
}

/**
 * POST /api/validate - Check if user already participated
 */
async function handleValidateParticipation(request: Request, env: Env): Promise<Response> {
  const body = await parseRequestBody<{ pollCode: string }>(request);

  // Validate magic link
  const linkData = await validateMagicLink(env, body.pollCode);
  
  if (!linkData) {
    return errorResponse('Invalid or expired poll link', 404);
  }

  // Generate session ID from request
  const sessionId = await generateSessionId(request);

  const alreadyParticipated = await hasParticipated(env, linkData.pollId, sessionId);

  return jsonResponse({
    alreadyParticipated,
  });
}
