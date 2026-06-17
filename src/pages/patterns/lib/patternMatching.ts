import type {
  ItemCategory,
  Pattern,
  PatternMatchStatus,
  PatternMatchSummary,
  PatternRequirement,
  RequirementMatch,
  StashCategory,
  StashItem,
} from '../../../types/models';

const availableStatuses = new Set(['in-stock', 'low-stock', 'not-replacing']);
const yarnCategoryId = 'yarn';
const hookCategoryId = 'hook';
const yardsUnitLabel = 'yards';

const hookSizeEquivalents = new Map<string, number>([
  ['b', 2.25],
  ['c', 2.75],
  ['d', 3.25],
  ['e', 3.5],
  ['f', 3.75],
  ['g', 4],
  ['7', 4.5],
  ['h', 5],
  ['i', 5.5],
  ['j', 6],
  ['k', 6.5],
  ['l', 8],
  ['m', 9],
  ['n', 10],
  ['p', 11.5],
  ['q', 15],
  ['s', 19],
]);

export const patternMatchLabels: Record<PatternMatchStatus, string> = {
  'ready-to-start': 'Ready To Start',
  'review-supplies': 'Review Supplies',
  'need-supplies': 'Need More Supplies',
};

export const patternMatchBadgeClasses: Record<PatternMatchStatus, string> = {
  'ready-to-start':
    'bg-emerald-100 text-emerald-700 ring-1 ring-inset ring-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-200 dark:ring-emerald-900',
  'review-supplies':
    'bg-amber-100 text-amber-700 ring-1 ring-inset ring-amber-200 dark:bg-amber-950/40 dark:text-amber-200 dark:ring-amber-900',
  'need-supplies':
    'bg-rose-100 text-rose-700 ring-1 ring-inset ring-rose-200 dark:bg-rose-950/40 dark:text-rose-200 dark:ring-rose-900',
};

export const requirementMatchLabels: Record<
  RequirementMatch['status'],
  string
> = {
  owned: 'Owned',
  review: 'Review',
  partial: 'Partial',
  missing: 'Missing',
};

export const requirementMatchBadgeClasses: Record<
  RequirementMatch['status'],
  string
> = {
  owned:
    'bg-emerald-100 text-emerald-700 ring-1 ring-inset ring-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-200 dark:ring-emerald-900',
  review:
    'bg-amber-100 text-amber-700 ring-1 ring-inset ring-amber-200 dark:bg-amber-950/40 dark:text-amber-200 dark:ring-amber-900',
  partial:
    'bg-amber-100 text-amber-700 ring-1 ring-inset ring-amber-200 dark:bg-amber-950/40 dark:text-amber-200 dark:ring-amber-900',
  missing:
    'bg-rose-100 text-rose-700 ring-1 ring-inset ring-rose-200 dark:bg-rose-950/40 dark:text-rose-200 dark:ring-rose-900',
};

export function buildPatternMatchSummaries(
  patterns: Pattern[],
  stashItems: StashItem[],
  stashCategories: StashCategory[],
): PatternMatchSummary[] {
  return patterns.map((pattern) =>
    buildPatternMatchSummary(pattern, stashItems, stashCategories),
  );
}

export function buildPatternMatchSummary(
  pattern: Pattern,
  stashItems: StashItem[],
  stashCategories: StashCategory[],
): PatternMatchSummary {
  const categoryById = new Map(
    stashCategories.map((category) => [category.id, category]),
  );

  if (pattern.requirements.length === 0) {
    return {
      patternId: pattern.id,
      status: 'ready-to-start',
      detail:
        'No fixed requirements; choose supplies based on your project goals.',
      matchedCount: 0,
      totalCount: 0,
      requirementMatches: [],
    };
  }

  const requirementMatches = pattern.requirements.map((requirement) =>
    buildRequirementMatch(requirement, stashItems, categoryById),
  );

  const matchedCount = requirementMatches.filter(
    (match) => match.status === 'owned',
  ).length;
  const hasMissing = requirementMatches.some(
    (match) => match.status === 'missing',
  );
  const hasPartial = requirementMatches.some(
    (match) => match.status === 'partial',
  );
  const hasReview = requirementMatches.some(
    (match) => match.status === 'review',
  );

  let status: PatternMatchStatus;
  let detail: string;

  if (hasMissing) {
    status = 'need-supplies';
    detail = 'You are missing one or more required supplies.';
  } else if (hasPartial || hasReview) {
    status = 'review-supplies';
    detail = 'Some requirements need a closer stash review.';
  } else {
    status = 'ready-to-start';
    detail = 'All requirements are available in your stash.';
  }

  return {
    patternId: pattern.id,
    status,
    detail,
    matchedCount,
    totalCount: pattern.requirements.length,
    requirementMatches,
  };
}

export function buildRequirementMatch(
  requirement: PatternRequirement,
  stashItems: StashItem[],
  categoryById = new Map<ItemCategory, StashCategory>(),
): RequirementMatch {
  if (requirement.category === yarnCategoryId) {
    return buildYarnRequirementMatch(requirement, stashItems, categoryById);
  }

  if (requirement.category === hookCategoryId) {
    return buildHookRequirementMatch(requirement, stashItems, categoryById);
  }

  const matchingItems = stashItems.filter((item) =>
    isMatchingItem(requirement, item, categoryById.get(requirement.category)),
  );
  const matchedItemIds = matchingItems.map((item) => item.id);
  const quantityMatched = matchingItems.reduce(
    (sum, item) =>
      sum + getComparableQuantity(item.category, item.quantity, item.unit),
    0,
  );

  if (matchingItems.length === 0) {
    return {
      requirementId: requirement.id,
      matchedItemIds: [],
      status: 'missing',
      quantityMatched: 0,
      reason: buildMissingReason(
        requirement,
        categoryById.get(requirement.category),
      ),
    };
  }

  if (typeof requirement.quantityNeeded === 'number') {
    const comparableQuantityNeeded = getComparableQuantity(
      requirement.category,
      requirement.quantityNeeded,
      requirement.unit,
    );

    if (quantityMatched >= comparableQuantityNeeded) {
      return {
        requirementId: requirement.id,
        matchedItemIds,
        status: 'owned',
        quantityMatched,
        reason: `Matched ${quantityMatched} ${getComparableUnitLabel(requirement)}.`,
      };
    }

    return {
      requirementId: requirement.id,
      matchedItemIds,
      status: 'partial',
      quantityMatched,
      reason: `Only ${quantityMatched} of ${comparableQuantityNeeded} ${getComparableUnitLabel(requirement)} available.`,
    };
  }

  return {
    requirementId: requirement.id,
    matchedItemIds,
    status: 'owned',
    quantityMatched,
    reason: 'Matching item found in stash.',
  };
}

function buildYarnRequirementMatch(
  requirement: PatternRequirement,
  stashItems: StashItem[],
  categoryById: Map<ItemCategory, StashCategory>,
): RequirementMatch {
  const matchingItems = stashItems.filter((item) => {
    if (!isAvailableCategoryItem(requirement, item)) {
      return false;
    }

    return !requirement.weight || item.weight === requirement.weight;
  });
  const matchedItemIds = matchingItems.map((item) => item.id);
  const quantityMatched = matchingItems.reduce(
    (sum, item) =>
      sum + getComparableQuantity(item.category, item.quantity, item.unit),
    0,
  );

  if (matchingItems.length === 0) {
    return {
      requirementId: requirement.id,
      matchedItemIds: [],
      status: 'missing',
      quantityMatched: 0,
      reason: buildMissingReason(
        requirement,
        categoryById.get(requirement.category),
      ),
    };
  }

  if (typeof requirement.quantityNeeded !== 'number') {
    if (!requirement.weight) {
      return {
        requirementId: requirement.id,
        matchedItemIds,
        status: 'review',
        quantityMatched,
        reason: 'Requirement has no yarn weight, so matching yarn needs review.',
      };
    }

    return {
      requirementId: requirement.id,
      matchedItemIds,
      status: 'owned',
      quantityMatched,
      reason: 'Matching yarn weight found in stash.',
    };
  }

  const comparableQuantityNeeded = getComparableQuantity(
    requirement.category,
    requirement.quantityNeeded,
    requirement.unit,
  );

  if (quantityMatched < comparableQuantityNeeded) {
    return {
      requirementId: requirement.id,
      matchedItemIds,
      status: 'partial',
      quantityMatched,
      reason: `Only ${quantityMatched} of ${comparableQuantityNeeded} ${getComparableUnitLabel(requirement)} available.`,
    };
  }

  if (!requirement.weight) {
    return {
      requirementId: requirement.id,
      matchedItemIds,
      status: 'review',
      quantityMatched,
      reason: 'Requirement has no yarn weight, so matching yarn needs review.',
    };
  }

  const hasSingleEntryMatch = matchingItems.some(
    (item) =>
      getComparableQuantity(item.category, item.quantity, item.unit) >=
      comparableQuantityNeeded,
  );

  if (hasSingleEntryMatch) {
    return {
      requirementId: requirement.id,
      matchedItemIds,
      status: 'owned',
      quantityMatched,
      reason: `Matched ${quantityMatched} ${getComparableUnitLabel(requirement)}.`,
    };
  }

  return {
    requirementId: requirement.id,
    matchedItemIds,
    status: 'review',
    quantityMatched,
    reason: `Matched ${quantityMatched} ${getComparableUnitLabel(requirement)} across ${matchingItems.length} yarn entries; review colors/brands before starting.`,
  };
}

function buildHookRequirementMatch(
  requirement: PatternRequirement,
  stashItems: StashItem[],
  categoryById: Map<ItemCategory, StashCategory>,
): RequirementMatch {
  const category = categoryById.get(requirement.category);
  const matchingItems = stashItems.filter((item) =>
    isMatchingItem(requirement, item, category),
  );
  const matchedItemIds = matchingItems.map((item) => item.id);

  if (matchingItems.length === 0) {
    return {
      requirementId: requirement.id,
      matchedItemIds: [],
      status: 'missing',
      quantityMatched: 0,
      reason: buildMissingReason(requirement, category),
    };
  }

  return {
    requirementId: requirement.id,
    matchedItemIds,
    status: 'owned',
    quantityMatched: matchingItems.length,
    reason: buildHookMatchReason(requirement, matchingItems[0]),
  };
}

function isMatchingItem(
  requirement: PatternRequirement,
  item: StashItem,
  category?: StashCategory,
) {
  if (!isAvailableCategoryItem(requirement, item)) {
    return false;
  }

  if (category?.showWeight) {
    if (requirement.weight && item.weight !== requirement.weight) {
      return false;
    }

    return true;
  }

  if (category?.showSize && requirement.size) {
    if (requirement.category === hookCategoryId) {
      return areHookSizesEquivalent(requirement.size, item.size);
    }

    return normalizeSizeText(item.size) === normalizeSizeText(requirement.size);
  }

  return true;
}

function isAvailableCategoryItem(
  requirement: PatternRequirement,
  item: StashItem,
) {
  return (
    item.category === requirement.category &&
    item.quantity > 0 &&
    (!item.status || availableStatuses.has(item.status))
  );
}

function getComparableQuantity(
  category: ItemCategory,
  quantity: number,
  unit?: string,
) {
  if (category !== 'eyes') {
    return quantity;
  }

  const normalizedUnit = normalizeUnit(unit);

  if (normalizedUnit === 'pair') {
    return quantity * 2;
  }

  return quantity;
}

function getComparableUnitLabel(requirement: PatternRequirement) {
  if (
    requirement.category === yarnCategoryId &&
    isYardsUnit(requirement.unit)
  ) {
    return yardsUnitLabel;
  }

  if (requirement.category === 'eyes') {
    return 'eyes';
  }

  return requirement.unit ?? 'items';
}

function normalizeUnit(unit?: string) {
  return unit?.trim().toLowerCase().replace(/\.$/, '').replace(/s$/, '');
}

function isYardsUnit(unit?: string) {
  const normalizedUnit = normalizeUnit(unit);

  return (
    normalizedUnit === 'yrd' ||
    normalizedUnit === 'yd' ||
    normalizedUnit === 'yard'
  );
}

function areHookSizesEquivalent(requiredSize: string, itemSize?: string) {
  if (!itemSize) {
    return false;
  }

  const requiredHookSize = parseHookSize(requiredSize);
  const itemHookSize = parseHookSize(itemSize);

  if (
    requiredHookSize.millimeters !== undefined &&
    itemHookSize.millimeters !== undefined
  ) {
    return requiredHookSize.millimeters === itemHookSize.millimeters;
  }

  return requiredHookSize.normalizedText === itemHookSize.normalizedText;
}

function buildHookMatchReason(
  requirement: PatternRequirement,
  matchedItem?: StashItem,
) {
  if (!requirement.size) {
    return 'Matching hook found in stash.';
  }

  const requiredHookSize = parseHookSize(requirement.size);
  const matchedHookSize = parseHookSize(matchedItem?.size);

  if (
    requiredHookSize.millimeters !== undefined &&
    matchedHookSize.millimeters !== undefined &&
    requiredHookSize.normalizedText !== matchedHookSize.normalizedText
  ) {
    return `Matched equivalent hook size: ${requirement.size} / ${formatMillimeters(requiredHookSize.millimeters)}.`;
  }

  return `Matched hook size: ${requirement.size}.`;
}

function parseHookSize(size?: string) {
  const normalizedText = normalizeSizeText(size);
  const millimeterMatch = normalizedText.match(/(\d+(?:\.\d+)?)mm/);

  if (millimeterMatch) {
    return {
      normalizedText,
      millimeters: Number(millimeterMatch[1]),
    };
  }

  const letterMatch = normalizedText.match(/[a-z]/);
  const letterMillimeters = letterMatch
    ? hookSizeEquivalents.get(letterMatch[0])
    : undefined;

  return {
    normalizedText,
    millimeters: letterMillimeters ?? hookSizeEquivalents.get(normalizedText),
  };
}

function normalizeSizeText(size?: string) {
  return size?.trim().toLowerCase().replace(/\s+/g, '') ?? '';
}

function formatMillimeters(millimeters: number) {
  if (Number.isInteger(millimeters)) {
    return `${millimeters} mm`;
  }

  return `${millimeters.toFixed(2).replace(/0+$/, '').replace(/\.$/, '')} mm`;
}

function buildMissingReason(
  requirement: PatternRequirement,
  category?: StashCategory,
) {
  const categoryName =
    category?.nameSingular.toLowerCase() ?? requirement.category;

  if (category?.showWeight && requirement.weight) {
    return `No ${requirement.weight} ${categoryName} currently available.`;
  }

  if (category?.showSize && requirement.size) {
    return `No ${requirement.size} ${categoryName} currently available.`;
  }

  return `No matching ${categoryName} currently available.`;
}
