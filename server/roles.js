export const householdRoles = ['owner', 'member', 'viewer'];

export function normalizeHouseholdRole(role) {
  return householdRoles.includes(role) ? role : 'viewer';
}

export function hasHouseholdRole(role, allowedRoles) {
  return allowedRoles.includes(normalizeHouseholdRole(role));
}
