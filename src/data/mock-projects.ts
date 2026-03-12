import type { Project } from "../types/models";

export const mockProjects: Project[] = [
  {
    id: 'chunky-cowl',
    name: 'Chunky Cowl',
    patternId: '101',
    startDate: '2024-05-01',
    stashItemIds: ['s1', 's2'],
    status: 'in-progress',
    notes: 'On round 12',
  },
  {
    id: 'granny-square-blanket',
    name: 'Granny Square Blanket',
    patternId: '102',
    startDate: '2024-04-15',
    stashItemIds: ['s3', 's4', 's5'],
    status: 'in-progress',
    notes: '24 of 80 squares joined',
  },
  {
    id: 'market-tote',
    name: 'Market Tote',
    patternId: '103',
    stashItemIds: ['s6'],
    status: 'planned',
    notes: 'For a birthday gift',
  },
  {
    id: 'patchwork-cardigan',
    name: 'Patchwork Cardigan',
    patternId: '104',
    stashItemIds: ['s7', 's8'],
    status: 'need-supplies',
    notes: 'Need two more skeins of cream yarn',
  },
  {
    id: 'striped-baby-blanket',
    name: 'Striped Baby Blanket',
    patternId: '107',
    startDate: '2025-11-18',
    endDate: '2025-12-10',
    stashItemIds: ['s9', 's10'],
    status: 'completed',
    notes: 'Finished and gifted last winter.',
  },
]
