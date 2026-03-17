import { RouterProvider } from 'react-router-dom';
import { AppDataProvider } from './app/providers/AppDataProvider';
import { router } from './app/router';

function App() {
  return (
    <AppDataProvider>
      <RouterProvider router={router} />
    </AppDataProvider>
  );
}

export default App;
