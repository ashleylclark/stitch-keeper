import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import cors from 'cors';
import express from 'express';
import { db, initializeDatabase } from './db.js';

initializeDatabase();

const app = express();
const port = Number(process.env.PORT ?? 3001);
const serverDir = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.resolve(serverDir, '../dist');
const indexHtmlPath = path.join(distDir, 'index.html');
const hasBuiltFrontend = fs.existsSync(indexHtmlPath);

app.use(cors());
app.use(express.json());

app.get('/api/health', (_request, response) => {
  response.json({ ok: true });
});

app.get('/api/stash', (_request, response) => {
  response.json(listStashItems());
});

app.post('/api/stash', (request, response) => {
  const item = normalizeStashItem(request.body);
  saveStashItem(item);
  response.status(201).json(item);
});

app.put('/api/stash/:id', (request, response) => {
  const item = normalizeStashItem({ ...request.body, id: request.params.id });
  saveStashItem(item, true);
  response.json(item);
});

app.delete('/api/stash/:id', (request, response) => {
  db.prepare('DELETE FROM stash_items WHERE id = ?').run(request.params.id);
  response.status(204).end();
});

app.get('/api/patterns', (_request, response) => {
  response.json(listPatterns());
});

app.post('/api/patterns', (request, response) => {
  const pattern = normalizePattern(request.body);
  savePattern(pattern);
  response.status(201).json(pattern);
});

app.put('/api/patterns/:id', (request, response) => {
  const pattern = normalizePattern({ ...request.body, id: request.params.id });
  savePattern(pattern, true);
  response.json(pattern);
});

app.delete('/api/patterns/:id', (request, response) => {
  db.prepare('DELETE FROM patterns WHERE id = ?').run(request.params.id);
  response.status(204).end();
});

app.get('/api/projects', (_request, response) => {
  response.json(listProjects());
});

app.post('/api/projects', (request, response) => {
  const project = normalizeProject(request.body);
  saveProject(project);
  response.status(201).json(project);
});

app.put('/api/projects/:id', (request, response) => {
  const project = normalizeProject({ ...request.body, id: request.params.id });
  saveProject(project, true);
  response.json(project);
});

app.delete('/api/projects/:id', (request, response) => {
  db.prepare('DELETE FROM projects WHERE id = ?').run(request.params.id);
  response.status(204).end();
});

if (hasBuiltFrontend) {
  app.use(express.static(distDir));

  app.get(/^\/(?!api\/).*/, (_request, response) => {
    response.sendFile(indexHtmlPath);
  });
}

app.listen(port, () => {
  console.log(`Stash Keeper server listening on http://localhost:${port}`);
});

function listStashItems() {
  return db
    .prepare(
      `
    SELECT id, name, category, status, material, weight, brand, color, quantity, unit, size, notes
    FROM stash_items
    ORDER BY rowid DESC
  `,
    )
    .all();
}

function listPatterns() {
  const patterns = db
    .prepare(
      `
    SELECT
      id,
      name,
      added_at AS addedAt,
      is_planned AS isPlanned,
      source,
      source_url AS sourceUrl,
      cover_image_url AS coverImageUrl,
      illustration_image_url AS illustrationImageUrl,
      category,
      difficulty,
      notes,
      instructions,
      instruction_sections AS instructionSections
    FROM patterns
    ORDER BY COALESCE(added_at, '') DESC, rowid DESC
  `,
    )
    .all();

  const requirements = db
    .prepare(
      `
    SELECT
      id,
      pattern_id AS patternId,
      category,
      name,
      weight,
      quantity_needed AS quantityNeeded,
      unit,
      size,
      notes
    FROM pattern_requirements
    ORDER BY rowid ASC
  `,
    )
    .all();

  const requirementsByPatternId = new Map();

  for (const requirement of requirements) {
    const current = requirementsByPatternId.get(requirement.patternId) ?? [];
    current.push({
      id: requirement.id,
      category: requirement.category,
      name: requirement.name,
      weight: requirement.weight ?? undefined,
      quantityNeeded: requirement.quantityNeeded ?? undefined,
      unit: requirement.unit ?? undefined,
      size: requirement.size ?? undefined,
      notes: requirement.notes ?? undefined,
    });
    requirementsByPatternId.set(requirement.patternId, current);
  }

  return patterns.map((pattern) => ({
    ...pattern,
    isPlanned: Boolean(pattern.isPlanned),
    instructionSections: parseInstructionSections(
      pattern.instructionSections,
      pattern.instructions,
    ),
    requirements: requirementsByPatternId.get(pattern.id) ?? [],
  }));
}

function listProjects() {
  const projects = db
    .prepare(
      `
    SELECT
      id,
      name,
      pattern_id AS patternId,
      start_date AS startDate,
      end_date AS endDate,
      status,
      notes,
      completed_instruction_steps AS completedInstructionSteps,
      stash_usage_applied_at AS stashUsageAppliedAt
    FROM projects
    ORDER BY rowid DESC
  `,
    )
    .all();

  const projectStashItems = db
    .prepare(
      `
    SELECT project_id AS projectId, stash_item_id AS stashItemId, quantity_used AS quantityUsed
    FROM project_stash_items
    ORDER BY rowid ASC
  `,
    )
    .all();

  const stashItemIdsByProjectId = new Map();
  const stashUsagesByProjectId = new Map();

  for (const row of projectStashItems) {
    const current = stashItemIdsByProjectId.get(row.projectId) ?? [];
    current.push(row.stashItemId);
    stashItemIdsByProjectId.set(row.projectId, current);

    const usageCurrent = stashUsagesByProjectId.get(row.projectId) ?? [];
    usageCurrent.push({
      stashItemId: row.stashItemId,
      quantityUsed: row.quantityUsed ?? undefined,
    });
    stashUsagesByProjectId.set(row.projectId, usageCurrent);
  }

  return projects.map((project) => ({
    ...project,
    patternId: project.patternId ?? undefined,
    startDate: project.startDate ?? undefined,
    endDate: project.endDate ?? undefined,
    notes: project.notes ?? undefined,
    completedInstructionSteps: parseCompletedInstructionSteps(
      project.completedInstructionSteps,
    ),
    stashItemIds: stashItemIdsByProjectId.get(project.id) ?? [],
    stashUsages: stashUsagesByProjectId.get(project.id) ?? [],
    stashUsageAppliedAt: project.stashUsageAppliedAt ?? undefined,
  }));
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
    coverImageUrl: emptyToUndefined(input.coverImageUrl),
    illustrationImageUrl: emptyToUndefined(input.illustrationImageUrl),
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

function saveStashItem(item, replace = false) {
  const sql = replace
    ? `
        INSERT OR REPLACE INTO stash_items (
          id, name, category, status, material, weight, brand, color, quantity, unit, size, notes
        ) VALUES (
          @id, @name, @category, @status, @material, @weight, @brand, @color, @quantity, @unit, @size, @notes
        )
      `
    : `
        INSERT INTO stash_items (
          id, name, category, status, material, weight, brand, color, quantity, unit, size, notes
        ) VALUES (
          @id, @name, @category, @status, @material, @weight, @brand, @color, @quantity, @unit, @size, @notes
        )
      `;

  db.prepare(sql).run(item);
}

function savePattern(pattern, replace = false) {
  db.transaction(() => {
    if (replace) {
      db.prepare('DELETE FROM patterns WHERE id = ?').run(pattern.id);
    }

    db.prepare(
      `
      INSERT INTO patterns (
        id, name, added_at, is_planned, source, source_url, cover_image_url, illustration_image_url, category, difficulty, notes, instructions, instruction_sections
      ) VALUES (
        @id, @name, @addedAt, @isPlanned, @source, @sourceUrl, @coverImageUrl, @illustrationImageUrl, @category, @difficulty, @notes, @instructions, @instructionSectionsJson
      )
    `,
    ).run({
      ...pattern,
      isPlanned: pattern.isPlanned ? 1 : 0,
      instructionSectionsJson: JSON.stringify(pattern.instructionSections),
    });

    const insertRequirement = db.prepare(`
      INSERT INTO pattern_requirements (
        id, pattern_id, category, name, weight, quantity_needed, unit, size, notes
      ) VALUES (
        @id, @patternId, @category, @name, @weight, @quantityNeeded, @unit, @size, @notes
      )
    `);

    for (const requirement of pattern.requirements) {
      insertRequirement.run({ ...requirement, patternId: pattern.id });
    }
  })();
}

function saveProject(project, replace = false) {
  db.transaction(() => {
    const existingProject = replace
      ? db
          .prepare(
            `
            SELECT id, status, stash_usage_applied_at AS stashUsageAppliedAt
            FROM projects
            WHERE id = ?
          `,
          )
          .get(project.id)
      : null;

    if (replace) {
      db.prepare('DELETE FROM projects WHERE id = ?').run(project.id);
    }

    const shouldApplyStashUsage =
      project.status === 'completed' && !existingProject?.stashUsageAppliedAt;

    const stashUsageAppliedAt = shouldApplyStashUsage
      ? new Date().toISOString()
      : (existingProject?.stashUsageAppliedAt ?? null);

    db.prepare(
      `
      INSERT INTO projects (
        id, name, pattern_id, start_date, end_date, status, notes, completed_instruction_steps, stash_usage_applied_at
      ) VALUES (
        @id, @name, @patternId, @startDate, @endDate, @status, @notes, @completedInstructionSteps, @stashUsageAppliedAt
      )
    `,
    ).run({
      ...project,
      completedInstructionSteps: JSON.stringify(
        project.completedInstructionSteps,
      ),
      stashUsageAppliedAt,
    });

    const insertLinkedItem = db.prepare(`
      INSERT INTO project_stash_items (project_id, stash_item_id, quantity_used)
      VALUES (@projectId, @stashItemId, @quantityUsed)
    `);

    for (const usage of project.stashUsages) {
      insertLinkedItem.run({
        projectId: project.id,
        stashItemId: usage.stashItemId,
        quantityUsed: usage.quantityUsed ?? null,
      });
    }

    if (shouldApplyStashUsage) {
      applyProjectStashUsage(project.stashUsages);
    }
  })();
}

function applyProjectStashUsage(stashUsages) {
  const updateStashQuantity = db.prepare(`
    UPDATE stash_items
    SET quantity = MAX(quantity - @quantityUsed, 0)
    WHERE id = @stashItemId
  `);

  for (const usage of stashUsages) {
    if (
      typeof usage.quantityUsed !== 'number' ||
      Number.isNaN(usage.quantityUsed) ||
      usage.quantityUsed <= 0
    ) {
      continue;
    }

    const stashItem = db
      .prepare('SELECT category FROM stash_items WHERE id = ?')
      .get(usage.stashItemId);

    if (!stashItem || !isConsumableCategory(stashItem.category)) {
      continue;
    }

    updateStashQuantity.run({
      stashItemId: usage.stashItemId,
      quantityUsed: usage.quantityUsed,
    });
  }
}

function isConsumableCategory(category) {
  return (
    category === 'yarn' ||
    category === 'eyes' ||
    category === 'stuffing' ||
    category === 'other'
  );
}

function emptyToUndefined(value) {
  if (value === undefined || value === null) {
    return undefined;
  }

  const trimmed = String(value).trim();
  return trimmed === '' ? undefined : trimmed;
}

function parseInstructionSections(value, legacyInstructions = '') {
  if (value) {
    try {
      return normalizeInstructionSections(
        JSON.parse(value),
        legacyInstructions,
      );
    } catch {
      return createInstructionSectionsFromText(legacyInstructions);
    }
  }

  return createInstructionSectionsFromText(legacyInstructions);
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

function parseCompletedInstructionSteps(value) {
  if (!value) {
    return [];
  }

  try {
    const parsed = JSON.parse(value);
    return normalizeCompletedInstructionSteps(parsed);
  } catch {
    return [];
  }
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
