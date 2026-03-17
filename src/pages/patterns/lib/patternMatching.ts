import type {
  ItemCategory,
  Pattern,
  PatternMatchStatus,
  PatternMatchSummary,
  PatternRequirement,
  RequirementMatch,
  StashItem,
} from '../../../types/models';

const availableStatuses = new Set(['in-stock', 'low-stock', 'not-replacing']);

export const patternMatchLabels: Record<PatternMatchStatus, string> = {
  'ready-to-start': 'Ready To Start',
  'review-supplies': 'Review Supplies',
  'need-supplies': 'Need More Supplies',
};

export const patternMatchBadgeClasses: Record<PatternMatchStatus, string> = {
  'ready-to-start':
    'bg-emerald-100 text-emerald-700 ring-1 ring-inset ring-emerald-200',
  'review-supplies':
    'bg-amber-100 text-amber-700 ring-1 ring-inset ring-amber-200',
  'need-supplies': 'bg-rose-100 text-rose-700 ring-1 ring-inset ring-rose-200',
};

export const requirementMatchLabels: Record<
  RequirementMatch['status'],
  string
> = {
  owned: 'Owned',
  partial: 'Partial',
  missing: 'Missing',
};

export const requirementMatchBadgeClasses: Record<
  RequirementMatch['status'],
  string
> = {
  owned: 'bg-emerald-100 text-emerald-700 ring-1 ring-inset ring-emerald-200',
  partial: 'bg-amber-100 text-amber-700 ring-1 ring-inset ring-amber-200',
  missing: 'bg-rose-100 text-rose-700 ring-1 ring-inset ring-rose-200',
};

export function buildPatternMatchSummaries(
  patterns: Pattern[],
  stashItems: StashItem[],
): PatternMatchSummary[] {
  return patterns.map((pattern) =>
    buildPatternMatchSummary(pattern, stashItems),
  );
}

export function buildPatternMatchSummary(
  pattern: Pattern,
  stashItems: StashItem[],
): PatternMatchSummary {
  if (pattern.requirements.length === 0) {
    return {
      patternId: pattern.id,
      status: 'review-supplies',
      detail: 'Add requirements to evaluate stash readiness.',
      matchedCount: 0,
      totalCount: 0,
      requirementMatches: [],
    };
  }

  const requirementMatches = pattern.requirements.map((requirement) =>
    buildRequirementMatch(requirement, stashItems),
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

  let status: PatternMatchStatus;
  let detail: string;

  if (hasMissing) {
    status = 'need-supplies';
    detail = 'You are missing one or more required supplies.';
  } else if (hasPartial) {
    status = 'review-supplies';
    detail = 'Some requirements are only partially matched in your stash.';
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
): RequirementMatch {
  const matchingItems = stashItems.filter((item) =>
    isMatchingItem(requirement, item),
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
      reason: buildMissingReason(requirement),
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

function isMatchingItem(requirement: PatternRequirement, item: StashItem) {
  if (item.category !== requirement.category) {
    return false;
  }

  if (
    item.quantity <= 0 ||
    (item.status && !availableStatuses.has(item.status))
  ) {
    return false;
  }

  if (requirement.category === 'yarn') {
    if (requirement.weight && item.weight !== requirement.weight) {
      return false;
    }

    return true;
  }

  if (needsSizeMatch(requirement.category) && requirement.size) {
    return item.size === requirement.size;
  }

  return true;
}

function needsSizeMatch(category: ItemCategory) {
  return category === 'hook' || category === 'needle' || category === 'eyes';
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
  if (requirement.category === 'eyes') {
    return 'eyes';
  }

  return requirement.unit ?? 'items';
}

function normalizeUnit(unit?: string) {
  return unit?.trim().toLowerCase().replace(/\.$/, '').replace(/s$/, '');
}

function buildMissingReason(requirement: PatternRequirement) {
  if (requirement.category === 'yarn' && requirement.weight) {
    return `No ${requirement.weight} yarn currently available.`;
  }

  if (needsSizeMatch(requirement.category) && requirement.size) {
    return `No ${requirement.size} ${requirement.category} currently available.`;
  }

  return `No matching ${requirement.category} currently available.`;
}
