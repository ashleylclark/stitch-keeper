import type { Pattern, PatternDashboardMeta } from '../types/models'

export const mockPatterns: Pattern[] = [
  {
    id: '101',
    name: 'Chunky Cowl',
    addedAt: '2026-03-02',
    category: 'accessory',
    difficulty: 'beginner',
    requirements: [
      {
        id: '101-yarn',
        category: 'yarn',
        name: 'Bulky acrylic yarn',
        weight: 'bulky',
        quantityNeeded: 2,
        unit: 'skeins',
      },
      {
        id: '101-hook',
        category: 'hook',
        name: '8 mm hook',
      },
    ],
    notes: 'Soft, quick project for winter gifting.',
    instructions: 'Chain 60. Join with slip stitch to form a ring, being careful not to twist the chain. Round 1: Chain 2 (counts as first dc), dc in each chain around. Join with slst to top of beginning chain-2. Round 2: Chain 2, double crochet in each stitch around. Join with slst to top of beginning chain-2. Repeat Round 2 until cowl measures approximately 12 inches from the join, or desired length. Fasten off and weave in ends.'
  },
  {
    id: '102',
    name: 'Granny Square Blanket',
    addedAt: '2026-02-20',
    category: 'blanket',
    difficulty: 'intermediate',
    requirements: [
      {
        id: '102-yarn',
        category: 'yarn',
        name: 'DK weight yarn set',
        weight: 'dk',
        quantityNeeded: 8,
        unit: 'skeins',
      },
      {
        id: '102-hook',
        category: 'hook',
        name: '4 mm hook',
      },
    ],
    notes: 'Great stash-buster with lots of color flexibility.',
    instructions: 'Chain 60. Join with slip stitch to form a ring, being careful not to twist the chain. Round 1: Chain 2 (counts as first dc), double crochet in each chain around. Join with slip stitch to top of beginning chain-2. Round 2: Chain 2, double crochet in each stitch around. Join with slip stitch to top of beginning chain-2. Repeat Round 2 until blanket measures approximately 36 inches from the join, or desired length. Fasten off and weave in ends.'
  },
  {
    id: '103',
    name: 'Market Tote',
    addedAt: '2026-03-08',
    category: 'bag',
    difficulty: 'beginner',
    requirements: [
      {
        id: '103-yarn',
        category: 'yarn',
        name: 'Cotton yarn',
        weight: 'worsted',
        quantityNeeded: 3,
        unit: 'skeins',
      },
      {
        id: '103-hook',
        category: 'hook',
        name: '5 mm hook',
      },
    ],
    notes: 'Simple everyday tote with sturdy handles.',
    instructions: 'Chain 40. Join with slip stitch to form a ring, being careful not to twist the chain. Round 1: Chain 2 (counts as first dc), double crochet in each chain around. Join with slip stitch to top of beginning chain-2. Round 2: Chain 2, double crochet in each stitch around. Join with slip stitch to top of beginning chain-2. Repeat Round 2 until tote measures approximately 12 inches from the join, or desired length. Fasten off and weave in ends.'
  },
  {
    id: '104',
    name: 'Patchwork Cardigan',
    addedAt: '2026-03-10',
    category: 'garment',
    difficulty: 'advanced',
    requirements: [
      {
        id: '104-yarn',
        category: 'yarn',
        name: 'Worsted wool blend',
        weight: 'worsted',
        quantityNeeded: 10,
        unit: 'skeins',
      },
      {
        id: '104-hook',
        category: 'hook',
        name: '6 mm hook',
      },
    ],
    notes: 'Color-blocked cardigan made from joined crochet panels.',
    instructions: 'Chain 60. Join with slip stitch to form a ring, being careful not to twist the chain. Round 1: Chain 2 (counts as first dc), double crochet in each chain around. Join with slip stitch to top of beginning chain-2. Round 2: Chain 2, double crochet in each stitch around. Join with slip stitch to top of beginning chain-2. Repeat Round 2 until cardigan measures approximately 24 inches from the join, or desired length. Fasten off and weave in ends.'
  },
  {
    id: '105',
    name: 'Weekend Bucket Hat',
    addedAt: '2026-03-11',
    category: 'accessory',
    difficulty: 'beginner',
    requirements: [
      {
        id: '105-yarn',
        category: 'yarn',
        name: 'Cotton yarn',
        weight: 'worsted',
        quantityNeeded: 2,
        unit: 'skeins',
      },
      {
        id: '105-hook',
        category: 'hook',
        name: '5 mm hook',
      },
    ],
    notes: 'Quick warm-weather make with a structured brim.',
    instructions: 'Chain 60. Join with slip stitch to form a ring, being careful not to twist the chain. Round 1: Chain 2 (counts as first dc), double crochet in each chain around. Join with slip stitch to top of beginning chain-2. Round 2: Chain 2, double crochet in each stitch around. Join with slip stitch to top of beginning chain-2. Repeat Round 2 until hat measures approximately 8 inches from the join, or desired length. Fasten off and weave in ends.'
  },
  {
    id: '106',
    name: 'Flower Coaster Set',
    addedAt: '2026-03-06',
    category: 'home',
    difficulty: 'beginner',
    requirements: [
      {
        id: '106-yarn',
        category: 'yarn',
        name: 'Cotton scraps',
        weight: 'dk',
        quantityNeeded: 1,
        unit: 'set',
      },
      {
        id: '106-hook',
        category: 'hook',
        name: '4 mm hook',
      },
    ],
    notes: 'Small scrap project that works up fast.',
    instructions: 'Chain 20. Join with slip stitch to form a ring, being careful not to twist the chain. Round 1: Chain 2 (counts as first dc), double crochet in each chain around. Join with slip stitch to top of beginning chain-2. Round 2: Chain 2, double crochet in each stitch around. Join with slip stitch to top of beginning chain-2. Repeat Round 2 until coaster measures approximately 4 inches from the join, or desired size. Fasten off and weave in ends.'
  },
]

export const mockPatternDashboardMeta: PatternDashboardMeta[] = [
  {
    patternId: '101',
    status: 'ready-to-start',
    detail: 'All yarn and hook sizes already match your stash.',
  },
  {
    patternId: '103',
    status: 'planned',
    detail: 'Lined up as a gift project for next month.',
  },
  {
    patternId: '104',
    status: 'need-supplies',
    detail: 'You still need a few more worsted skeins.',
  },
  {
    patternId: '105',
    status: 'ready-to-start',
    detail: 'Everything needed is already on hand.',
  },
  {
    patternId: '106',
    status: 'review-supplies',
    detail: 'Double-check scrap colors before you begin.',
  },
]
