import type {
  PatternInstructionSection,
  PatternInstructionStep,
} from '../../../types/models';

export type FlatInstructionStep = PatternInstructionStep & {
  sectionId: string;
  sectionTitle: string;
  stepNumber: number;
};

export function createInstructionSection(
  index: number,
): PatternInstructionSection {
  return {
    id: createInstructionId('section'),
    title: `Section ${index + 1}`,
    notes: undefined,
    steps: [createInstructionStep()],
  };
}

export function createInstructionStep(): PatternInstructionStep {
  return {
    id: createInstructionId('step'),
    text: '',
  };
}

export function createStepsFromText(text: string): PatternInstructionStep[] {
  const steps = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => ({
      id: createInstructionId('step'),
      text: line,
    }));

  return steps.length > 0 ? steps : [createInstructionStep()];
}

export function createInstructionSectionsFromText(
  instructions: string,
): PatternInstructionSection[] {
  const steps = instructions
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
      steps: steps.length > 0 ? steps : [createInstructionStep()],
    },
  ];
}

export function getPatternInstructionSections(input: {
  instructions?: string;
  instructionSections?: PatternInstructionSection[];
}): PatternInstructionSection[] {
  if (input.instructionSections?.length) {
    return input.instructionSections.map((section, sectionIndex) => ({
      id: section.id || `section-${sectionIndex}`,
      title: section.title || `Section ${sectionIndex + 1}`,
      notes: section.notes,
      steps:
        section.steps.length > 0
          ? section.steps.map((step, stepIndex) => ({
              id:
                step.id ||
                `${section.id || `section-${sectionIndex}`}-step-${stepIndex}`,
              text: step.text,
            }))
          : [createInstructionStep()],
    }));
  }

  return createInstructionSectionsFromText(input.instructions ?? '');
}

export function normalizeInstructionSections(
  sections: PatternInstructionSection[],
): PatternInstructionSection[] {
  return sections.map((section, sectionIndex) => ({
    id: section.id || createInstructionId('section'),
    title: section.title.trim() || `Section ${sectionIndex + 1}`,
    notes: section.notes?.trim() || undefined,
    steps: section.steps
      .map((step) => ({
        id: step.id || createInstructionId('step'),
        text: step.text.trim(),
      }))
      .filter((step) => step.text),
  }));
}

export function deriveInstructionsFromSections(
  sections: PatternInstructionSection[],
): string {
  return sections
    .map((section) =>
      [section.title, section.notes, ...section.steps.map((step) => step.text)]
        .map((value) => value?.trim())
        .filter(Boolean)
        .join('\n'),
    )
    .filter(Boolean)
    .join('\n\n');
}

export function getInstructionStepsText(
  steps: PatternInstructionStep[],
): string {
  return steps.map((step) => step.text).join('\n');
}

export function flattenInstructionSteps(
  sections: PatternInstructionSection[],
): FlatInstructionStep[] {
  return sections.flatMap((section) =>
    section.steps.map((step, index) => ({
      ...step,
      sectionId: section.id,
      sectionTitle: section.title,
      stepNumber: index + 1,
    })),
  );
}

export function countInstructionSteps(section: PatternInstructionSection) {
  return section.steps.length;
}

function createInstructionId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}
