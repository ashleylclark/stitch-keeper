import { RouterProvider } from 'react-router-dom';
import { AppDataProvider } from './app/providers/AppDataProvider';
import { ThemeProvider } from './app/theme/ThemeProvider';
import { router } from './app/router';

function App() {
  return (
    <ThemeProvider>
      <AppDataProvider>
        <RouterProvider router={router} />
      </AppDataProvider>
    </ThemeProvider>
  );
}

export default App;
