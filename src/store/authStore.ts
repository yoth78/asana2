import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, Role, Invitation, InvitationStatus } from '../types';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  allUsers: User[];
  invitations: Invitation[];
  
  // Actions
  login: (email: string, password?: string) => Promise<void>;
  signup: (email: string, name: string, password?: string) => Promise<void>;
  logout: () => void;
  updateProfile: (data: Partial<User>) => void;
  setUser: (user: User | null) => void;
  inviteUser: (email: string, name: string, role: Role, departmentId: string) => Promise<void>;
  acceptInvitation: (invitationId: string) => Promise<void>;
  declineInvitation: (invitationId: string) => Promise<void>;
  updateUserRole: (userId: string, newRole: Role, departmentId?: string) => void;
  removeUser: (userId: string) => void;
  getUsersByDepartment: (departmentId: string) => User[];
  fetchUsers: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      allUsers: [],
      invitations: [],

      login: async (email: string, password?: string) => {
        set({ isLoading: true });
        try {
          const res = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
          });
          if (!res.ok) {
            const data = await res.json();
            throw new Error(data.error || 'Login failed');
          }
          const { user, token } = await res.json();
          localStorage.setItem('token', token);
          set({ user, isAuthenticated: true, isLoading: false });
          get().fetchUsers();
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      signup: async (email: string, name: string, password?: string) => {
        set({ isLoading: true });
        try {
          const res = await fetch('/api/auth/signup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, name, password })
          });
          if (!res.ok) {
            const data = await res.json();
            throw new Error(data.error || 'Signup failed');
          }
          const { user, token } = await res.json();
          localStorage.setItem('token', token);
          set({ user, isAuthenticated: true, isLoading: false });
          get().fetchUsers();
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      logout: () => {
        localStorage.removeItem('token');
        set({ user: null, isAuthenticated: false, allUsers: [] });
      },

      updateProfile: (data: Partial<User>) => {
        // Mock update for now
        set((state) => {
          if (!state.user) return state;
          const updatedUser = { ...state.user, ...data };
          return { user: updatedUser };
        });
      },

      setUser: (user: User | null) => {
        set({ user, isAuthenticated: !!user });
      },

      inviteUser: async (email: string, name: string, role: Role, departmentId: string) => {
        const token = localStorage.getItem('token');
        if (!token) return;
        
        try {
          const res = await fetch('/api/auth/invite', {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ email, name, role, departmentId })
          });
          
          if (!res.ok) {
            const data = await res.json();
            throw new Error(data.error || 'Failed to send invite');
          }
          
          // Also fetch users to update the UI
          await get().fetchUsers();
        } catch (error) {
          console.error(error);
          throw error;
        }
      },

      fetchUsers: async () => {
        const token = localStorage.getItem('token');
        if (!token) return;
        try {
          const res = await fetch('/api/auth/users', {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (res.ok) {
            const users = await res.json();
            
            const verifiedUsers = users.filter((u: any) => u.isVerified);
            const pendingInvitations = users.filter((u: any) => !u.isVerified).map((u: any) => ({
              id: u.id,
              email: u.email,
              name: u.name,
              role: u.role,
              departmentId: u.teamId,
              status: 'pending',
              invitedBy: 'admin',
              createdAt: u.createdAt
            }));

            set({ allUsers: verifiedUsers, invitations: pendingInvitations });
          }
        } catch (error) {
          console.error('Failed to fetch users', error);
        }
      },

      acceptInvitation: async (invitationId: string) => {
        const token = localStorage.getItem('token');
        if (!token) return;
        try {
          const res = await fetch(`/api/auth/invitations/${invitationId}/accept`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (res.ok) {
            await get().fetchUsers();
          }
        } catch (error) {
          console.error(error);
        }
      },

      declineInvitation: async (invitationId: string) => {
        const token = localStorage.getItem('token');
        if (!token) return;
        try {
          const res = await fetch(`/api/auth/invitations/${invitationId}/decline`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (res.ok) {
            await get().fetchUsers();
          }
        } catch (error) {
          console.error(error);
        }
      },

      updateUserRole: (userId: string, newRole: Role, departmentId?: string) => {
        // Implement API call
      },

      removeUser: (userId: string) => {
        // Implement API call
      },

      getUsersByDepartment: (departmentId: string) => {
        return get().allUsers.filter(u => (u as any).teamId === departmentId || u.departmentId === departmentId);
      }
    }),
    {
      name: 'auth-storage-v3',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated
      })
    }
  )
);
