export function getOwnerContext(request) {
  const sessionUser = request.sessionUser;

  if (!sessionUser) {
    throw new Error('Request user has not been resolved.');
  }

  return {
    userId: sessionUser.user.id,
    householdId: sessionUser.activeHousehold.id,
  };
}
