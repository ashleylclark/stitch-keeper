import type { HouseholdRole } from '../../types/models';
import type { AppPermissions } from '../state/app-data';

const householdRoles: HouseholdRole[] = ['owner', 'member', 'viewer'];

export function normalizeHouseholdRole(
  role?: HouseholdRole | string,
): HouseholdRole {
  return householdRoles.includes(role as HouseholdRole)
    ? (role as HouseholdRole)
    : 'viewer';
}

export function buildPermissions(
  role?: HouseholdRole | string,
): AppPermissions {
  const normalizedRole = normalizeHouseholdRole(role);
  const isOwner = normalizedRole === 'owner';
  const canCollaborate = isOwner || normalizedRole === 'member';

  return {
    canManageHousehold: isOwner,
    canManageStashCategories: isOwner,
    canCreateStash: canCollaborate,
    canEditStash: canCollaborate,
    canDeleteStash: isOwner,
    canCreatePatterns: canCollaborate,
    canEditPatterns: canCollaborate,
    canDeletePatterns: isOwner,
    canManageOwnProjects: canCollaborate,
  };
}
