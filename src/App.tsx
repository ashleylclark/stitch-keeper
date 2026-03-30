import { AuthProvider } from './app/providers/AuthProvider';
import { RouterProvider } from 'react-router-dom';
import { AppDataProvider } from './app/providers/AppDataProvider';
import { ThemeProvider } from './app/theme/ThemeProvider';
import { router } from './app/router';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppDataProvider>
          <RouterProvider router={router} />
        </AppDataProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
