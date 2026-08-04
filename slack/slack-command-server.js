'use strict';

const crypto = require('crypto');
const http = require('http');
const { URLSearchParams } = require('url');

const PORT = Number(process.env.PORT || 3000);
const {
  GITHUB_OWNER,
  GITHUB_REPO,
  GITHUB_TOKEN,
  GITHUB_WORKFLOW_ID = 'playwright.yml',
  GITHUB_REF = 'main',
  SLACK_SIGNING_SECRET,
} = process.env;

const MAX_SLACK_AGE_SECONDS = 60 * 5;
const VALID_SUITE_VALUES = new Set(['all', 'login', 'cart']);
const TEST_PATH_PATTERN = /^tests\/[A-Za-z0-9._/-]+\.spec\.(js|ts)$/;

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];

    req.on('data', (chunk) => {
      chunks.push(chunk);
    });

    req.on('end', () => {
      resolve(Buffer.concat(chunks));
    });

    req.on('error', reject);
  });
}

function timingSafeCompare(left, right) {
  const leftBuffer = Buffer.from(left, 'utf8');
  const rightBuffer = Buffer.from(right, 'utf8');

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(leftBuffer, rightBuffer);
}

function verifySlackRequest(headers, rawBody) {
  const timestamp = headers['x-slack-request-timestamp'];
  const signature = headers['x-slack-signature'];

  if (!SLACK_SIGNING_SECRET) {
    throw new Error('Missing SLACK_SIGNING_SECRET.');
  }

  if (!timestamp || !signature) {
    return false;
  }

  const currentTimestamp = Math.floor(Date.now() / 1000);
  if (Math.abs(currentTimestamp - Number(timestamp)) > MAX_SLACK_AGE_SECONDS) {
    return false;
  }

  const baseString = `v0:${timestamp}:${rawBody.toString('utf8')}`;
  const expectedSignature = `v0=${crypto
    .createHmac('sha256', SLACK_SIGNING_SECRET)
    .update(baseString)
    .digest('hex')}`;

  return timingSafeCompare(expectedSignature, signature);
}

function parseSlackText(text) {
  const normalizedText = (text || '').trim();
  if (!normalizedText || normalizedText === 'help') {
    return {
      ok: false,
      statusCode: 200,
      message:
        'Usage: /pos-test all | login | cart | tests/login.spec.js | tests/login.spec.js,tests/cart.spec.js',
    };
  }

  if (VALID_SUITE_VALUES.has(normalizedText)) {
    return {
      ok: true,
      inputs: {
        suite: normalizedText,
        test_paths: '',
      },
      summary: `suite=${normalizedText}`,
    };
  }

  const requestedPaths = normalizedText
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);

  if (requestedPaths.length === 0) {
    return {
      ok: false,
      statusCode: 200,
      message:
        'Please provide `all`, `login`, `cart`, or one or more comma-separated spec paths under tests/.',
    };
  }

  for (const testPath of requestedPaths) {
    if (!TEST_PATH_PATTERN.test(testPath)) {
      return {
        ok: false,
        statusCode: 200,
        message:
          `Invalid test path: ${testPath}. Use values like tests/login.spec.js or tests/cart.spec.js.`,
      };
    }
  }

  return {
    ok: true,
    inputs: {
      suite: 'custom',
      test_paths: requestedPaths.join(','),
    },
    summary: `custom tests=${requestedPaths.join(', ')}`,
  };
}

async function dispatchWorkflow(inputs) {
  if (!GITHUB_OWNER || !GITHUB_REPO || !GITHUB_TOKEN) {
    throw new Error('Missing one of GITHUB_OWNER, GITHUB_REPO, or GITHUB_TOKEN.');
  }

  const endpoint = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/actions/workflows/${GITHUB_WORKFLOW_ID}/dispatches`;
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${GITHUB_TOKEN}`,
      'Content-Type': 'application/json',
      'User-Agent': 'pallet-pos-slack-dispatcher',
      'X-GitHub-Api-Version': '2022-11-28',
    },
    body: JSON.stringify({
      ref: GITHUB_REF,
      inputs,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`GitHub dispatch failed (${response.status}): ${errorBody}`);
  }
}

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(payload));
}

const server = http.createServer(async (req, res) => {
  if (req.method === 'GET' && req.url === '/health') {
    return sendJson(res, 200, { ok: true });
  }

  if (req.method !== 'POST' || req.url !== '/slack/commands/pos-test') {
    return sendJson(res, 404, { ok: false, error: 'Not found' });
  }

  try {
    const rawBody = await readBody(req);

    if (!verifySlackRequest(req.headers, rawBody)) {
      return sendJson(res, 401, {
        response_type: 'ephemeral',
        text: 'Slack signature verification failed.',
      });
    }

    const params = new URLSearchParams(rawBody.toString('utf8'));
    const commandText = params.get('text');
    const slackUser = params.get('user_name') || 'unknown-user';

    const parsedCommand = parseSlackText(commandText);
    if (!parsedCommand.ok) {
      return sendJson(res, parsedCommand.statusCode, {
        response_type: 'ephemeral',
        text: parsedCommand.message,
      });
    }

    await dispatchWorkflow(parsedCommand.inputs);

    return sendJson(res, 200, {
      response_type: 'ephemeral',
      text: `Triggered GitHub Actions for ${parsedCommand.summary} by ${slackUser} on ref ${GITHUB_REF}.`,
    });
  } catch (error) {
    return sendJson(res, 500, {
      response_type: 'ephemeral',
      text: `Unable to start the workflow: ${error.message}`,
    });
  }
});

server.listen(PORT, () => {
  console.log(`Slack command server listening on port ${PORT}`);
});
