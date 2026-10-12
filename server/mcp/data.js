import { getOwnerContext } from '../owner-context.js';
import { listStashItems } from '../repositories/stash.js';
import { listProjects } from '../repositories/projects.js';
import { listPatterns } from '../repositories/patterns.js';

export function createMcpData(sessionUser) {
  const owner = getOwnerContext({ sessionUser });
  return {
    listYarn: () =>
      listStashItems(owner).filter((item) => item.category === 'yarn'),
    listProjects: () => listProjects(owner),
    listPatterns: () => listPatterns(owner),
  };
}
