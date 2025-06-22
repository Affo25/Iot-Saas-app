'use client';

import { Provider } from 'react-redux';
import { store } from './store';
import { ToastProvider } from '../providers/ToastProvider';

export function Providers({ children }) {
  return (
    <Provider store={store}>
      {children}
      <ToastProvider />
    </Provider>
  );
} 