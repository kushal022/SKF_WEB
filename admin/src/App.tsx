import { Provider } from 'react-redux';
import { store } from './app/store';
import AppRouter from './app/router';
import { ToastProvider } from './components/ui/Toast';
import ServiceWorkerRegister from './components/ServiceWorkerRegister';

export function App() {
  return (
    <Provider store={store}>
      <ToastProvider>
        <AppRouter />
        <ServiceWorkerRegister />
      </ToastProvider>
    </Provider>
  );
}

export default App;
