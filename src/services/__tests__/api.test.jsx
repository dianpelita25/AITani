import React from 'react';
import { describe, it, expect, beforeAll, beforeEach, afterEach, vi } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';

import { api } from '../api';
import authReducer, { setCredentials } from '../authSlice';
import { useGetAlertsQuery } from '../alertsApi';

// Mock Routes so mounting <App /> triggers an RTK Query call immediately.
vi.mock('../../Routes', () => ({
  __esModule: true,
  default: function MockRoutes() {
    useGetAlertsQuery();
    return <div data-testid="mock-routes" />;
  },
}));

// Mock the offline queue module to avoid touching IndexedDB in tests.
vi.mock('../../offline/queueService', () => ({
  __esModule: true,
  retryQueue: vi.fn(),
}));

class MockBroadcastChannel {
  constructor() {
    this.onmessage = null;
  }
  postMessage() {}
  close() {}
}

if (!globalThis.BroadcastChannel) {
  globalThis.BroadcastChannel = MockBroadcastChannel;
}

let App;

beforeAll(async () => {
  ({ default: App } = await import('../../App'));
});

describe('api auto logout integration', () => {
  let store;
  let fetchSpy;

  beforeEach(() => {
    localStorage.clear();

    store = configureStore({
      reducer: {
        [api.reducerPath]: api.reducer,
        auth: authReducer,
      },
      middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware().concat(api.middleware),
    });

    fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ message: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      })
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it('should auto-logout when a 401 response is received', async () => {
    const fakeUser = { userId: 'user-123', name: 'Test User' };

    store.dispatch(setCredentials({ user: fakeUser, token: 'invalid-token' }));
    localStorage.setItem('sessionToken', 'invalid-token');
    localStorage.setItem('userProfile', JSON.stringify(fakeUser));

    render(
      <Provider store={store}>
        <App />
      </Provider>
    );

    await waitFor(() => {
      const authState = store.getState().auth;
      expect(authState.user).toBeNull();
      expect(authState.token).toBeNull();
      expect(authState.isAuthenticated).toBe(false);
    });

    expect(localStorage.getItem('sessionToken')).toBeNull();
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });
});
