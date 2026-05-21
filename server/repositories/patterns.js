import { randomUUID } from 'node:crypto';
import { and, desc, eq, inArray, sql } from 'drizzle-orm';
import { orm } from '../db.js';
import { patternRequirements, patterns } from '../schema.js';
import { emptyToUndefined } from './utils.js';

export function listPatterns(ownerContext) {
  const patternRows = orm
    .select()
    .from(patterns)
    .where(eq(patterns.householdId, ownerContext.householdId))
    .orderBy(desc(sql`COALESCE(${patterns.addedAt}, '')`), desc(sql`rowid`))
    .all();

  const patternIds = patternRows.map((pattern) => pattern.id);
  const requirements =
    patternIds.length === 0
      ? []
      : orm
          .select()
          .from(patternRequirements)
          .where(inArray(patternRequirements.patternId, patternIds))
          .orderBy(sql`rowid`)
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

  return patternRows.map((pattern) => {
    const patternFields = { ...pattern };
    delete patternFields.householdId;

    return {
      ...patternFields,
      isPlanned: Boolean(pattern.isPlanned),
      instructionSections: parseInstructionSections(
        pattern.instructionSections,
        pattern.instructions,
      ),
      requirements: requirementsByPatternId.get(pattern.id) ?? [],
    };
  });
}

export function savePattern(ownerContext, pattern, replace = false) {
  orm.transaction((tx) => {
    if (replace) {
      tx.delete(patterns)
        .where(
          and(
            eq(patterns.id, pattern.id),
            eq(patterns.householdId, ownerContext.householdId),
          ),
        )
        .run();
    }

    tx.insert(patterns).values(toPatternRow(ownerContext, pattern)).run();

    for (const requirement of pattern.requirements) {
      tx.insert(patternRequirements)
        .values(toRequirementRow(requirement, pattern.id))
        .run();
    }
  });
}

export function deletePattern(ownerContext, id) {
  orm
    .delete(patterns)
    .where(
      and(
        eq(patterns.id, id),
        eq(patterns.householdId, ownerContext.householdId),
      ),
    )
    .run();
}

function toPatternRow(ownerContext, pattern) {
  return {
    id: pattern.id,
    householdId: ownerContext.householdId,
    name: pattern.name,
    addedAt: pattern.addedAt ?? null,
    isPlanned: pattern.isPlanned ? 1 : 0,
    source: pattern.source ?? null,
    sourceUrl: pattern.sourceUrl ?? null,
    category: pattern.category ?? null,
    difficulty: pattern.difficulty ?? null,
    notes: pattern.notes ?? null,
    instructions: pattern.instructions,
    instructionSections: JSON.stringify(pattern.instructionSections),
  };
}

function toRequirementRow(requirement, patternId) {
  return {
    id: requirement.id,
    patternId,
    category: requirement.category,
    name: requirement.name,
    weight: requirement.weight ?? null,
    quantityNeeded: requirement.quantityNeeded ?? null,
    unit: requirement.unit ?? null,
    size: requirement.size ?? null,
    notes: requirement.notes ?? null,
  };
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
