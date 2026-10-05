import { Provider } from 'react-redux';
import { store } from './app/store';
import AppRouter from './app/router';
import { ToastProvider } from './components/ui/Toast';
import ServiceWorkerRegister from './components/ServiceWorkerRegister';
import AuthInitializer from './features/auth/AuthInitializer';

export function App() {
  return (
    <Provider store={store}>
      <ToastProvider>
        <AuthInitializer>
          <AppRouter />
          <ServiceWorkerRegister />
        </AuthInitializer>
      </ToastProvider>
    </Provider>
  );
}

export default App;
