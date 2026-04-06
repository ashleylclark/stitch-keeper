export const stashItems = [
  {
    id: 's1',
    category: 'yarn',
    name: 'Example Yarn',
    brand: 'Lion Brand',
    color: 'Charcoal',
    material: 'Acrylic',
    weight: 'bulky',
    quantity: 30,
    unit: 'yrds',
    status: 'in-stock',
  },
  {
    id: 's2',
    category: 'hook',
    name: '3.5 mm hook',
    brand: 'Example brand',
    quantity: 1,
    material: 'Aluminum',
    size: '3.5 mm',
    status: 'in-stock',
  },
  {
    id: 's3',
    category: 'yarn',
    name: 'Example yarn set - Assorted colors',
    brand: 'Example brand',
    color: 'Assorted',
    material: 'Acrylic',
    weight: 'light',
    quantity: 10,
    unit: 'yrds',
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
    notes: 'Example notes.',
    instructions:
      'Chain 60. Join with slip stitch to form a ring, being careful not to twist the chain. Round 1: Chain 2 (counts as first dc), dc in each chain around. Join with slst to top of beginning chain-2. Round 2: Chain 2, double crochet in each stitch around. Join with slst to top of beginning chain-2. Repeat Round 2 until cowl measures approximately 12 inches from the join, or desired length. Fasten off and weave in ends.',
    requirements: [
      {
        id: '101-yarn',
        category: 'yarn',
        name: 'Pattern example yarn',
        weight: 'bulky',
        quantityNeeded: 2,
        unit: 'skeins',
      },
      { id: '101-hook', category: 'hook', name: '8 mm hook', size: '8 mm' },
    ],
  },
];

export const projects = [
  {
    id: 'example-project',
    name: 'Example Project',
    patternId: '101',
    startDate: '2024-05-01',
    stashItemIds: ['s1', 's2'],
    stashUsages: [
      { stashItemId: 's1', quantityUsed: 1 },
      { stashItemId: 's2' },
    ],
    completedInstructionSteps: [],
    status: 'in-progress',
    notes: 'On round 12',
  },
];
