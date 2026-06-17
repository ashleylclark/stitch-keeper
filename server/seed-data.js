const exampleInstructionSections = [
  {
    id: '101-section-setup',
    title: 'Instructions',
    steps: [
      {
        id: '101-step-1',
        text: 'Chain 60. Join with a slip stitch to form a ring, being careful not to twist the chain.',
      },
      {
        id: '101-step-2',
        text: 'Round 1: Chain 2, double crochet in each chain around, and join with a slip stitch.',
      },
      {
        id: '101-step-3',
        text: 'Repeat Round 1 until the cowl measures approximately 12 inches, then fasten off and weave in ends.',
      },
    ],
  },
];

function instructionsFromSections(sections) {
  return sections
    .map((section) =>
      [section.title, section.notes, ...section.steps.map((step) => step.text)]
        .filter(Boolean)
        .join('\n'),
    )
    .join('\n\n');
}

export const stashItems = [
  {
    id: 's1',
    category: 'yarn',
    name: 'Example Yarn',
    brand: 'Example brand',
    color: 'Charcoal',
    material: 'Acrylic',
    weight: 'bulky',
    quantity: 30,
    unit: 'yrds',
    status: 'in-stock',
    notes: 'Example stash notes.',
  },
  {
    id: 's2',
    category: 'hook',
    name: 'Example Hook',
    brand: 'Example brand',
    material: 'Aluminum',
    size: '8 mm',
    quantity: 1,
    status: 'in-stock',
  },
];

export const patterns = [
  {
    id: '101',
    name: 'Example Pattern',
    addedAt: '2026-03-02',
    isPlanned: true,
    category: 'accessory',
    difficulty: 'beginner',
    notes: 'Example pattern notes.',
    instructions: instructionsFromSections(exampleInstructionSections),
    instructionSections: exampleInstructionSections,
    requirements: [
      {
        id: '101-yarn',
        category: 'yarn',
        name: 'Example yarn',
        weight: 'bulky',
        quantityNeeded: 20,
        unit: 'yrds',
      },
      {
        id: '101-hook',
        category: 'hook',
        name: '8 mm hook',
        size: '8 mm',
      },
    ],
  },
];

export const projects = [
  {
    id: 'example-project',
    name: 'Example Project',
    patternId: '101',
    startDate: '2026-05-01',
    stashItemIds: ['s1', 's2'],
    stashUsages: [
      { stashItemId: 's1', quantityUsed: 10 },
      { stashItemId: 's2' },
    ],
    completedInstructionSteps: ['101-step-1'],
    status: 'in-progress',
    notes: 'Example project notes.',
  },
];
