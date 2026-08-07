import { describe, it, expect, beforeEach } from 'vitest';
import { useAuthStore } from './authStore';

describe('authStore', () => {
  beforeEach(() => {
    // Reset store before each test
    useAuthStore.getState().logout();
  });

  it('initializes with unauthenticated state', () => {
    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(false);
    expect(state.user).toBeNull();
  });

  it('can login successfully', async () => {
    const store = useAuthStore.getState();
    await store.login('superadmin@Teamflow.com', 'password123');
    
    const newState = useAuthStore.getState();
    expect(newState.isAuthenticated).toBe(true);
    expect(newState.user?.role).toBe('SUPER_ADMIN');
    expect(newState.user?.email).toBe('superadmin@Teamflow.com');
  });

  it('fails to login with bad credentials', async () => {
    const store = useAuthStore.getState();
    
    try {
      await store.login('wrong@email.com', 'badpass');
    } catch (e: any) {
      expect(e.message).toBe('Invalid credentials');
    }
    
    const newState = useAuthStore.getState();
    expect(newState.isAuthenticated).toBe(false);
  });
});
