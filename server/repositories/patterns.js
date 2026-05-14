import { randomUUID } from 'node:crypto';
import { db } from '../db.js';
import { emptyToUndefined } from './utils.js';

export function listPatterns() {
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

export function savePattern(pattern, replace = false) {
  db.transaction(() => {
    if (replace) {
      db.prepare('DELETE FROM patterns WHERE id = ?').run(pattern.id);
    }

    db.prepare(
      `
      INSERT INTO patterns (
        id, name, added_at, is_planned, source, source_url, category, difficulty, notes, instructions, instruction_sections
      ) VALUES (
        @id, @name, @addedAt, @isPlanned, @source, @sourceUrl, @category, @difficulty, @notes, @instructions, @instructionSectionsJson
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

export function deletePattern(id) {
  db.prepare('DELETE FROM patterns WHERE id = ?').run(id);
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
