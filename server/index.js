import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import cors from 'cors';
import express from 'express';
import { handleLocalLogin, handleLocalRegistration } from './auth/local.js';
import { handleCallback, handleLogin } from './auth/oidc.js';
import {
  clearAuthCookie,
  clearSessionCookie,
  readAuthConfig,
  readSessionCookie,
} from './auth/session.js';
import { initializeDatabase } from './db.js';
import { getOwnerContext } from './owner-context.js';
import {
  findSessionUser,
  isLocalRegistrationEnabled,
  updateUserSettings,
} from './repositories/users.js';
import {
  deletePattern,
  listPatterns,
  savePattern,
} from './repositories/patterns.js';
import {
  deleteProject,
  listProjects,
  saveProject,
} from './repositories/projects.js';
import {
  deleteStashItem,
  listStashItems,
  saveStashItem,
} from './repositories/stash.js';
import {
  archiveStashCategory,
  createStashCategory,
  findStashCategory,
  listStashCategories,
  updateStashCategory,
} from './repositories/stash-categories.js';
import {
  allowedImageMimeTypes,
  createMediaAsset,
  deleteMediaAsset,
  findMediaAsset,
  maxImageUploadBytes,
} from './repositories/media.js';
import { hasHouseholdRole } from './roles.js';
import {
  createApiToken,
  findSessionUserForApiToken,
  listApiTokens,
  revokeApiToken,
} from './repositories/api-tokens.js';

import { mountMcp, readMcpConfig } from './mcp/http.js';
import { createMcpData } from './mcp/data.js';

const authConfig = readAuthConfig();
const mcpConfig = readMcpConfig();

initializeDatabase();

const app = express();
const port = Number(process.env.PORT ?? 3001);
const serverDir = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.resolve(serverDir, '../dist');
const indexHtmlPath = path.join(distDir, 'index.html');
const hasBuiltFrontend = fs.existsSync(indexHtmlPath);

app.set('trust proxy', 1);
app.use(cors({ credentials: true, origin: true }));
app.use(express.json());

mountMcp(app, {
  config: mcpConfig,
  resolveToken: findSessionUserForApiToken,
  version: JSON.parse(
    fs.readFileSync(path.resolve(serverDir, '../package.json'), 'utf8'),
  ).version,
  createData: createMcpData,
});

app.get('/api/health', (_request, response) => {
  response.json({ ok: true });
});

app.get('/api/auth/config', (_request, response) => {
  response.json({
    oidcEnabled: Boolean(authConfig.oidc),
    registrationEnabled: isLocalRegistrationEnabled(authConfig),
  });
});

app.post('/auth/login', async (request, response, next) => {
  try {
    await handleLocalLogin(request, response, authConfig);
  } catch (error) {
    next(error);
  }
});

app.post('/auth/register', async (request, response, next) => {
  try {
    await handleLocalRegistration(request, response, authConfig);
  } catch (error) {
    next(error);
  }
});

app.get('/auth/login', (_request, response, next) => {
  if (!authConfig.oidc) {
    response.redirect('/');
    return;
  }

  next();
});

app.get('/auth/login', async (request, response, next) => {
  try {
    await handleLogin(request, response, authConfig);
  } catch (error) {
    next(error);
  }
});

app.get('/auth/oidc/login', async (request, response, next) => {
  try {
    await handleLogin(request, response, authConfig);
  } catch (error) {
    next(error);
  }
});

app.get('/auth/callback', async (_request, response, next) => {
  if (!authConfig.oidc) {
    response.redirect('/');
    return;
  }

  next();
});

app.get('/auth/callback', async (request, response, next) => {
  try {
    await handleCallback(request, response, authConfig);
  } catch (error) {
    logOidcCallbackError(error);
    clearAuthCookie(response, authConfig);
    next(error);
  }
});

app.get('/auth/oidc/callback', async (request, response, next) => {
  try {
    await handleCallback(request, response, authConfig);
  } catch (error) {
    logOidcCallbackError(error);
    clearAuthCookie(response, authConfig);
    next(error);
  }
});

app.post('/auth/logout', (_request, response) => {
  clearSessionCookie(response, authConfig);
  response.status(204).end();
});

app.get('/auth/logout', (_request, response) => {
  clearSessionCookie(response, authConfig);
  response.redirect('/');
});

app.get('/api/me/tokens', requireSessionUser, (request, response) => {
  response.json(listApiTokens(getOwnerContext(request)));
});

app.post('/api/me/tokens', requireSessionUser, (request, response) => {
  const name = normalizeApiTokenName(request.body?.name);
  response.status(201).json(createApiToken(getOwnerContext(request), name));
});

app.delete('/api/me/tokens/:id', requireSessionUser, (request, response) => {
  if (!revokeApiToken(getOwnerContext(request), request.params.id)) {
    response.status(404).send('API token not found.');
    return;
  }

  response.status(204).end();
});

app.use('/api', requireAuthenticatedUser);

app.get('/api/me', (request, response) => {
  response.json(request.sessionUser);
});

app.put('/api/me/settings', (request, response) => {
  const user = updateUserSettings(request.sessionUser.user.id, {
    theme: request.body?.theme,
    colorTheme: request.body?.colorTheme,
  });

  response.json(user);
});

app.get('/api/media/:id', (request, response) => {
  const asset = findMediaAsset(getOwnerContext(request), request.params.id);

  if (!asset) {
    response.status(404).send('Media not found.');
    return;
  }

  response.type(asset.mimeType);
  response.sendFile(asset.absolutePath, (error) => {
    if (error && !response.headersSent) {
      response.status(error.status ?? 404).send('Media file not found.');
    }
  });
});

app.post('/api/media', async (request, response, next) => {
  if (!ensurePermission(request, response, ['owner', 'member'])) {
    return;
  }

  try {
    const file = await readMultipartImage(request);
    const asset = createMediaAsset(getOwnerContext(request), file);
    response.status(201).json(asset);
  } catch (error) {
    next(error);
  }
});

app.delete('/api/media/:id', (request, response) => {
  if (!ensurePermission(request, response, ['owner', 'member'])) {
    return;
  }

  if (!deleteMediaAsset(getOwnerContext(request), request.params.id)) {
    response.status(404).send('Media not found.');
    return;
  }

  response.status(204).end();
});

app.get('/api/stash', (request, response) => {
  response.json(listStashItems(getOwnerContext(request)));
});

app.get('/api/stash-categories', (request, response) => {
  response.json(listStashCategories(getOwnerContext(request)));
});

app.post('/api/stash-categories', (request, response) => {
  if (!ensurePermission(request, response, ['owner'])) {
    return;
  }

  const category = createStashCategory(
    getOwnerContext(request),
    normalizeStashCategory(request.body),
  );
  response.status(201).json(category);
});

app.put('/api/stash-categories/:id', (request, response) => {
  if (!ensurePermission(request, response, ['owner'])) {
    return;
  }

  const category = updateStashCategory(
    getOwnerContext(request),
    request.params.id,
    normalizeStashCategory(request.body),
  );

  if (!category) {
    response.status(404).send('Category not found.');
    return;
  }

  response.json(category);
});

app.delete('/api/stash-categories/:id', (request, response) => {
  if (!ensurePermission(request, response, ['owner'])) {
    return;
  }

  const category = archiveStashCategory(
    getOwnerContext(request),
    request.params.id,
  );

  if (!category) {
    response.status(404).send('Category not found.');
    return;
  }

  response.json(category);
});

app.post('/api/stash', (request, response) => {
  if (!ensurePermission(request, response, ['owner', 'member'])) {
    return;
  }

  const ownerContext = getOwnerContext(request);
  const item = normalizeStashItem(request.body);
  validateStashCategory(ownerContext, item.category);
  saveStashItem(ownerContext, item);
  response.status(201).json(item);
});

app.put('/api/stash/:id', (request, response) => {
  if (!ensurePermission(request, response, ['owner', 'member'])) {
    return;
  }

  const ownerContext = getOwnerContext(request);
  const item = normalizeStashItem({ ...request.body, id: request.params.id });
  validateStashCategory(ownerContext, item.category);
  saveStashItem(ownerContext, item, true);
  response.json(item);
});

app.delete('/api/stash/:id', (request, response) => {
  if (!ensurePermission(request, response, ['owner'])) {
    return;
  }

  deleteStashItem(getOwnerContext(request), request.params.id);
  response.status(204).end();
});

app.get('/api/patterns', (request, response) => {
  response.json(listPatterns(getOwnerContext(request)));
});

app.post('/api/patterns', (request, response) => {
  if (!ensurePermission(request, response, ['owner', 'member'])) {
    return;
  }

  const ownerContext = getOwnerContext(request);
  const pattern = normalizePattern(request.body);
  validatePatternRequirementCategories(ownerContext, pattern);
  savePattern(ownerContext, pattern);
  response.status(201).json(pattern);
});

app.put('/api/patterns/:id', (request, response) => {
  if (!ensurePermission(request, response, ['owner', 'member'])) {
    return;
  }

  const ownerContext = getOwnerContext(request);
  const pattern = normalizePattern({ ...request.body, id: request.params.id });
  validatePatternRequirementCategories(ownerContext, pattern);
  savePattern(ownerContext, pattern, true);
  response.json(pattern);
});

app.delete('/api/patterns/:id', (request, response) => {
  if (!ensurePermission(request, response, ['owner'])) {
    return;
  }

  deletePattern(getOwnerContext(request), request.params.id);
  response.status(204).end();
});

app.get('/api/projects', (request, response) => {
  response.json(listProjects(getOwnerContext(request)));
});

app.post('/api/projects', (request, response) => {
  if (!ensurePermission(request, response, ['owner', 'member'])) {
    return;
  }

  const project = normalizeProject(request.body);
  saveProject(getOwnerContext(request), project);
  response.status(201).json(project);
});

app.put('/api/projects/:id', (request, response) => {
  if (!ensurePermission(request, response, ['owner', 'member'])) {
    return;
  }

  const project = normalizeProject({ ...request.body, id: request.params.id });
  saveProject(getOwnerContext(request), project, true);
  response.json(project);
});

app.delete('/api/projects/:id', (request, response) => {
  if (!ensurePermission(request, response, ['owner', 'member'])) {
    return;
  }

  deleteProject(getOwnerContext(request), request.params.id);
  response.status(204).end();
});

if (hasBuiltFrontend) {
  app.use(express.static(distDir));

  app.get(/^\/(?!api\/).*/, (_request, response) => {
    response.sendFile(indexHtmlPath);
  });
}

app.use('/api', (error, _request, response, _next) => {
  void _next;

  const status = error?.status ?? 500;
  const message =
    status === 500 ? 'Something went wrong.' : (error?.message ?? 'Error.');

  response.status(status).send(message);
});

app.listen(port, () => {
  console.log(`Stitch Keeper server listening on http://localhost:${port}`);
});

function requireAuthenticatedUser(request, response, next) {
  const bearerToken = readBearerToken(request);

  if (bearerToken) {
    const sessionUser = findSessionUserForApiToken(bearerToken);

    if (!sessionUser) {
      response.status(401).send('Invalid API token.');
      return;
    }

    if (!['GET', 'HEAD'].includes(request.method)) {
      response.status(403).send('API tokens are read-only.');
      return;
    }

    request.sessionUser = sessionUser;
    next();
    return;
  }

  requireSessionUser(request, response, next);
}

function requireSessionUser(request, response, next) {
  const session = readSessionCookie(request, authConfig);

  if (!session) {
    response.status(401).send('Authentication required.');
    return;
  }

  const sessionUser = findSessionUser(session);

  if (!sessionUser) {
    clearSessionCookie(response, authConfig);
    response.status(401).send('Authentication required.');
    return;
  }

  request.sessionUser = sessionUser;
  next();
}

function readBearerToken(request) {
  const authorization = String(request.headers.authorization ?? '');
  const match = authorization.match(/^Bearer ([^\s]+)$/i);
  return match?.[1] ?? null;
}

function normalizeApiTokenName(input) {
  const name = String(input ?? '').trim();

  if (!name || name.length > 80) {
    const error = new Error(
      'API token name must be between 1 and 80 characters.',
    );
    error.status = 400;
    throw error;
  }

  return name;
}

function ensurePermission(request, response, allowedRoles) {
  if (
    hasHouseholdRole(request.sessionUser?.activeHousehold?.role, allowedRoles)
  ) {
    return true;
  }

  response.status(403).send('You do not have permission to do that.');
  return false;
}

function logOidcCallbackError(error) {
  if (!error?.error && !error?.error_description) {
    return;
  }

  console.error('OIDC authorization failed', {
    error: error.error,
    errorDescription: error.error_description,
  });
}

function normalizeStashItem(input) {
  return {
    id: String(input.id ?? `stash-${randomUUID()}`),
    name: String(input.name ?? '').trim(),
    category: String(input.category),
    status: emptyToUndefined(input.status),
    material: emptyToUndefined(input.material),
    weight: emptyToUndefined(input.weight),
    brand: emptyToUndefined(input.brand),
    color: emptyToUndefined(input.color),
    quantity: Number(input.quantity ?? 0),
    unit: emptyToUndefined(input.unit),
    size: emptyToUndefined(input.size),
    notes: emptyToUndefined(input.notes),
  };
}

function normalizeStashCategory(input) {
  return {
    nameSingular: String(input.nameSingular ?? '').trim(),
    namePlural: String(input.namePlural ?? '').trim(),
    defaultUnit: emptyToUndefined(input.defaultUnit),
    showWeight: Boolean(input.showWeight),
    showBrand: Boolean(input.showBrand),
    showColor: Boolean(input.showColor),
    showSize: Boolean(input.showSize),
    showMaterial: Boolean(input.showMaterial),
    showUnit: Boolean(input.showUnit),
    showNotes: Boolean(input.showNotes),
    isConsumable: Boolean(input.isConsumable),
    archivedAt: input.archivedAt,
  };
}

function validateStashCategory(ownerContext, categoryId) {
  const category = findStashCategory(ownerContext, categoryId);

  if (!category) {
    const error = new Error(`Unknown stash category: ${categoryId}`);
    error.status = 400;
    throw error;
  }
}

function validatePatternRequirementCategories(ownerContext, pattern) {
  for (const requirement of pattern.requirements) {
    validateStashCategory(ownerContext, requirement.category);
  }
}

function normalizePattern(input) {
  const instructionSections = normalizeInstructionSections(
    input.instructionSections,
    input.instructions,
  );

  return {
    id: String(input.id ?? `pattern-${randomUUID()}`),
    name: String(input.name ?? '').trim(),
    addedAt:
      emptyToUndefined(input.addedAt) ?? new Date().toISOString().slice(0, 10),
    isPlanned: Boolean(input.isPlanned),
    source: emptyToUndefined(input.source),
    sourceUrl: emptyToUndefined(input.sourceUrl),
    coverImageUrl: emptyToUndefined(input.coverImageUrl),
    patternChartUrl: emptyToUndefined(input.patternChartUrl),
    category: emptyToUndefined(input.category),
    difficulty: emptyToUndefined(input.difficulty),
    notes: emptyToUndefined(input.notes),
    instructions: deriveInstructionsFromSections(instructionSections),
    instructionSections,
    requirements: Array.isArray(input.requirements)
      ? input.requirements.map((requirement) => ({
          id: String(requirement.id ?? `requirement-${randomUUID()}`),
          category: String(requirement.category),
          name: String(requirement.name ?? '').trim(),
          weight: emptyToUndefined(requirement.weight),
          quantityNeeded:
            requirement.quantityNeeded === undefined ||
            requirement.quantityNeeded === null ||
            requirement.quantityNeeded === ''
              ? undefined
              : Number(requirement.quantityNeeded),
          unit: emptyToUndefined(requirement.unit),
          size: emptyToUndefined(requirement.size),
          notes: emptyToUndefined(requirement.notes),
        }))
      : [],
  };
}

function normalizeProject(input) {
  const normalizedStashUsages = Array.isArray(input.stashUsages)
    ? input.stashUsages
        .map((usage) => ({
          stashItemId: String(usage.stashItemId),
          quantityUsed:
            usage.quantityUsed === undefined ||
            usage.quantityUsed === null ||
            usage.quantityUsed === ''
              ? undefined
              : Number(usage.quantityUsed),
        }))
        .filter((usage) => usage.stashItemId)
    : Array.isArray(input.stashItemIds)
      ? input.stashItemIds.map((stashItemId) => ({
          stashItemId: String(stashItemId),
          quantityUsed: undefined,
        }))
      : [];

  const completedInstructionSteps = normalizeCompletedInstructionSteps(
    input.completedInstructionSteps,
  );

  return {
    id: String(input.id ?? `project-${randomUUID()}`),
    name: String(input.name ?? '').trim(),
    patternId: emptyToUndefined(input.patternId),
    startDate: emptyToUndefined(input.startDate),
    endDate: emptyToUndefined(input.endDate),
    status: String(input.status),
    notes: emptyToUndefined(input.notes),
    finishedImageUrl: emptyToUndefined(input.finishedImageUrl),
    stashItemIds: normalizedStashUsages.map((usage) => usage.stashItemId),
    stashUsages: normalizedStashUsages,
    completedInstructionSteps,
  };
}

async function readMultipartImage(request) {
  const contentType = String(request.headers['content-type'] ?? '');
  const boundaryMatch = contentType.match(/boundary=(?:"([^"]+)"|([^;]+))/);

  if (!contentType.startsWith('multipart/form-data') || !boundaryMatch) {
    throwHttpError(400, 'Expected a multipart form upload.');
  }

  const body = await readRequestBody(request, maxImageUploadBytes);
  const file = extractMultipartFile(body, boundaryMatch[1] ?? boundaryMatch[2]);

  if (!file) {
    throwHttpError(400, 'Upload must include one image file.');
  }

  if (!allowedImageMimeTypes.has(file.mimeType)) {
    throwHttpError(400, 'Upload must be a JPEG, PNG, WebP, or GIF image.');
  }

  if (file.buffer.length === 0) {
    throwHttpError(400, 'Uploaded image cannot be empty.');
  }

  return file;
}

async function readRequestBody(request, maxBytes) {
  const chunks = [];
  let totalBytes = 0;

  for await (const chunk of request) {
    totalBytes += chunk.length;

    if (totalBytes > maxBytes) {
      throwHttpError(413, 'Uploaded image must be 8 MB or smaller.');
    }

    chunks.push(chunk);
  }

  return Buffer.concat(chunks);
}

function extractMultipartFile(body, boundary) {
  const boundaryBuffer = Buffer.from(`--${boundary}`);
  let cursor = 0;

  while (cursor < body.length) {
    const boundaryStart = body.indexOf(boundaryBuffer, cursor);

    if (boundaryStart === -1) {
      return null;
    }

    let partStart = boundaryStart + boundaryBuffer.length;

    if (body[partStart] === 45 && body[partStart + 1] === 45) {
      return null;
    }

    if (body[partStart] === 13 && body[partStart + 1] === 10) {
      partStart += 2;
    }

    const nextBoundary = body.indexOf(boundaryBuffer, partStart);

    if (nextBoundary === -1) {
      return null;
    }

    const part = trimTrailingCrlf(body.subarray(partStart, nextBoundary));
    const headersEnd = part.indexOf(Buffer.from('\r\n\r\n'));

    if (headersEnd === -1) {
      cursor = nextBoundary;
      continue;
    }

    const rawHeaders = part.subarray(0, headersEnd).toString('utf8');
    const contentDisposition = getMultipartHeader(
      rawHeaders,
      'content-disposition',
    );

    if (
      !contentDisposition?.includes('name="file"') ||
      !contentDisposition.includes('filename=')
    ) {
      cursor = nextBoundary;
      continue;
    }

    return {
      fileName: getMultipartFileName(contentDisposition),
      mimeType:
        getMultipartHeader(rawHeaders, 'content-type') ??
        'application/octet-stream',
      buffer: part.subarray(headersEnd + 4),
    };
  }

  return null;
}

function trimTrailingCrlf(buffer) {
  if (
    buffer.length >= 2 &&
    buffer[buffer.length - 2] === 13 &&
    buffer[buffer.length - 1] === 10
  ) {
    return buffer.subarray(0, buffer.length - 2);
  }

  return buffer;
}

function getMultipartHeader(rawHeaders, headerName) {
  const lowerHeaderName = headerName.toLowerCase();
  const line = rawHeaders
    .split('\r\n')
    .find((header) => header.toLowerCase().startsWith(`${lowerHeaderName}:`));

  return line ? line.slice(line.indexOf(':') + 1).trim() : undefined;
}

function getMultipartFileName(contentDisposition) {
  const fileNameMatch = contentDisposition.match(/filename="([^"]*)"/);
  const fileName = path.basename(fileNameMatch?.[1] ?? 'upload');

  return fileName || 'upload';
}

function throwHttpError(status, message) {
  const error = new Error(message);
  error.status = status;
  throw error;
}

function emptyToUndefined(value) {
  if (value === undefined || value === null) {
    return undefined;
  }

  const trimmed = String(value).trim();
  return trimmed === '' ? undefined : trimmed;
}

function normalizeInstructionSections(value, legacyInstructions = '') {
  const sections = Array.isArray(value)
    ? value
    : createInstructionSectionsFromText(String(legacyInstructions ?? ''));

  return sections.map((section, sectionIndex) => {
    const sectionId = String(section?.id ?? `section-${randomUUID()}`);
    const steps = Array.isArray(section?.steps)
      ? section.steps
          .map((step) => ({
            id: String(step?.id ?? `step-${randomUUID()}`),
            text: String(step?.text ?? '').trim(),
            imageUrl: emptyToUndefined(step?.imageUrl),
          }))
          .filter((step) => step.text)
      : [];

    return {
      id: sectionId,
      title: emptyToUndefined(section?.title) ?? `Section ${sectionIndex + 1}`,
      notes: emptyToUndefined(section?.notes),
      steps,
    };
  });
}

function createInstructionSectionsFromText(instructions) {
  const steps = String(instructions ?? '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((text, index) => ({
      id: `legacy-step-${index}`,
      text,
    }));

  return [
    {
      id: 'legacy-section-0',
      title: 'Instructions',
      notes: undefined,
      steps,
    },
  ];
}

function deriveInstructionsFromSections(sections) {
  return sections
    .map((section) =>
      [section.title, section.notes, ...section.steps.map((step) => step.text)]
        .map((value) => emptyToUndefined(value))
        .filter(Boolean)
        .join('\n'),
    )
    .filter(Boolean)
    .join('\n\n');
}

function normalizeCompletedInstructionSteps(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((stepId) => {
      if (Number.isInteger(stepId) && stepId >= 0) {
        return `legacy-step-${stepId}`;
      }

      return emptyToUndefined(stepId);
    })
    .filter(
      (stepId, index, current) =>
        typeof stepId === 'string' && current.indexOf(stepId) === index,
    )
    .sort();
}
