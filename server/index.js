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

const authConfig = readAuthConfig();

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

app.use('/api', requireAuthenticatedUser);

app.get('/api/me', (request, response) => {
  response.json(request.sessionUser);
});

app.get('/api/stash', (request, response) => {
  response.json(listStashItems(getOwnerContext(request)));
});

app.post('/api/stash', (request, response) => {
  const item = normalizeStashItem(request.body);
  saveStashItem(getOwnerContext(request), item);
  response.status(201).json(item);
});

app.put('/api/stash/:id', (request, response) => {
  const item = normalizeStashItem({ ...request.body, id: request.params.id });
  saveStashItem(getOwnerContext(request), item, true);
  response.json(item);
});

app.delete('/api/stash/:id', (request, response) => {
  deleteStashItem(getOwnerContext(request), request.params.id);
  response.status(204).end();
});

app.get('/api/patterns', (request, response) => {
  response.json(listPatterns(getOwnerContext(request)));
});

app.post('/api/patterns', (request, response) => {
  const pattern = normalizePattern(request.body);
  savePattern(getOwnerContext(request), pattern);
  response.status(201).json(pattern);
});

app.put('/api/patterns/:id', (request, response) => {
  const pattern = normalizePattern({ ...request.body, id: request.params.id });
  savePattern(getOwnerContext(request), pattern, true);
  response.json(pattern);
});

app.delete('/api/patterns/:id', (request, response) => {
  deletePattern(getOwnerContext(request), request.params.id);
  response.status(204).end();
});

app.get('/api/projects', (request, response) => {
  response.json(listProjects(getOwnerContext(request)));
});

app.post('/api/projects', (request, response) => {
  const project = normalizeProject(request.body);
  saveProject(getOwnerContext(request), project);
  response.status(201).json(project);
});

app.put('/api/projects/:id', (request, response) => {
  const project = normalizeProject({ ...request.body, id: request.params.id });
  saveProject(getOwnerContext(request), project, true);
  response.json(project);
});

app.delete('/api/projects/:id', (request, response) => {
  deleteProject(getOwnerContext(request), request.params.id);
  response.status(204).end();
});

if (hasBuiltFrontend) {
  app.use(express.static(distDir));

  app.get(/^\/(?!api\/).*/, (_request, response) => {
    response.sendFile(indexHtmlPath);
  });
}

app.listen(port, () => {
  console.log(`Stitch Keeper server listening on http://localhost:${port}`);
});

function requireAuthenticatedUser(request, response, next) {
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
    stashItemIds: normalizedStashUsages.map((usage) => usage.stashItemId),
    stashUsages: normalizedStashUsages,
    completedInstructionSteps,
  };
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
