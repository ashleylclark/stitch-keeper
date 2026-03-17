import { createBrowserRouter } from 'react-router-dom';
import { AppShell } from './layout/AppShell';
import HomePage from '../pages/home/HomePage';
import StashPage from '../pages/stash/StashPage';
import PatternsPage from '../pages/patterns/PatternsPage';
import PatternDetailPage from '../pages/patterns/PatternDetailPage';
import ProjectsPage from '../pages/projects/ProjectsPage';
import ProjectDetailPage from '../pages/projects/ProjectDetailPage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppShell />,
    children: [
      {
        index: true,
        element: <HomePage />,
      },
      {
        path: 'stash',
        element: <StashPage />,
      },
      {
        path: 'patterns',
        element: <PatternsPage />,
      },
      {
        path: 'patterns/:patternId',
        element: <PatternDetailPage />,
      },
      {
        path: 'projects',
        element: <ProjectsPage />,
      },
      {
        path: 'projects/:projectId',
        element: <ProjectDetailPage />,
      },
    ],
  },
]);
