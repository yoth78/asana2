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
  inviteUser: (email: string, name: string, role: Role, departmentId: string) => void;
  acceptInvitation: (invitationId: string) => void;
  declineInvitation: (invitationId: string) => void;
  updateUserRole: (userId: string, newRole: Role, departmentId?: string) => void;
  removeUser: (userId: string) => void;
  getUsersByDepartment: (departmentId: string) => User[];
}

const initialMockUsers: User[] = [
  { id: 'u1', email: 'superadmin@Teamflow.com', name: 'Sarah Johnson', role: 'SUPER_ADMIN', isVerified: true, createdAt: new Date().toISOString() },
  { id: 'u2', email: 'admin@Teamflow.com', name: 'Michael Chen', role: 'ADMIN', departmentId: 'dept1', isVerified: true, createdAt: new Date().toISOString() },
  { id: 'u3', email: 'admin2@Teamflow.com', name: 'Emily Davis', role: 'ADMIN', departmentId: 'dept2', isVerified: true, createdAt: new Date().toISOString() },
  { id: 'u4', email: 'member@Teamflow.com', name: 'James Wilson', role: 'MEMBER', departmentId: 'dept1', isVerified: true, createdAt: new Date().toISOString() },
  { id: 'u5', email: 'member2@Teamflow.com', name: 'Alex Turner', role: 'MEMBER', departmentId: 'dept1', isVerified: true, createdAt: new Date().toISOString() },
  { id: 'u6', email: 'member3@Teamflow.com', name: 'Lisa Park', role: 'MEMBER', departmentId: 'dept2', isVerified: true, createdAt: new Date().toISOString() },
  { id: 'u7', email: 'member4@Teamflow.com', name: 'David Kim', role: 'MEMBER', departmentId: 'dept2', isVerified: true, createdAt: new Date().toISOString() },
];

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      allUsers: initialMockUsers,
      invitations: [],

      login: async (email: string, password?: string) => {
        set({ isLoading: true });
        try {
          // Simulate network delay
          await new Promise(resolve => setTimeout(resolve, 500));
          
          if (password && password !== 'password123') {
            throw new Error('Invalid credentials');
          }
          
          const foundUser = get().allUsers.find(u => u.email === email);
          if (!foundUser) {
            throw new Error('User not found');
          }
          
          set({ user: foundUser, isAuthenticated: true, isLoading: false });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      signup: async (email: string, name: string, password?: string) => {
        set({ isLoading: true });
        try {
          await new Promise(resolve => setTimeout(resolve, 500));
          
          const existingUser = get().allUsers.find(u => u.email === email);
          if (existingUser) {
            throw new Error('User already exists');
          }

          const newUser: User = {
            id: `u${Date.now()}`,
            email,
            name,
            role: 'SUPER_ADMIN',
            isVerified: true,
            createdAt: new Date().toISOString()
          };

          set((state) => ({
            allUsers: [...state.allUsers, newUser],
            user: newUser,
            isAuthenticated: true,
            isLoading: false
          }));
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      logout: () => {
        set({ user: null, isAuthenticated: false });
      },

      updateProfile: (data: Partial<User>) => {
        set((state) => {
          if (!state.user) return state;
          
          const updatedUser = { ...state.user, ...data };
          
          // Update user in allUsers as well
          const updatedAllUsers = state.allUsers.map(u => 
            u.id === updatedUser.id ? updatedUser : u
          );
          
          return {
            user: updatedUser,
            allUsers: updatedAllUsers
          };
        });
      },

      setUser: (user: User | null) => {
        set({ user, isAuthenticated: !!user });
      },

      inviteUser: (email: string, name: string, role: Role, departmentId: string) => {
        const currentUser = get().user;
        if (!currentUser) return;

        const newInvitation: Invitation = {
          id: `inv${Date.now()}`,
          email,
          name,
          role,
          departmentId,
          status: 'pending',
          invitedBy: currentUser.id,
          createdAt: new Date().toISOString()
        };

        set((state) => ({
          invitations: [...state.invitations, newInvitation]
        }));
      },

      acceptInvitation: (invitationId: string) => {
        set((state) => {
          const invitation = state.invitations.find(i => i.id === invitationId);
          if (!invitation) return state;

          const updatedInvitations = state.invitations.map(i => 
            i.id === invitationId ? { ...i, status: 'accepted' as InvitationStatus } : i
          );

          const newUser: User = {
            id: `u${Date.now()}`,
            email: invitation.email,
            name: invitation.name,
            role: invitation.role,
            departmentId: invitation.departmentId,
            isVerified: true,
            createdAt: new Date().toISOString()
          };

          return {
            invitations: updatedInvitations,
            allUsers: [...state.allUsers, newUser]
          };
        });
      },

      declineInvitation: (invitationId: string) => {
        set((state) => ({
          invitations: state.invitations.map(i => 
            i.id === invitationId ? { ...i, status: 'declined' as InvitationStatus } : i
          )
        }));
      },

      updateUserRole: (userId: string, newRole: Role, departmentId?: string) => {
        set((state) => ({
          allUsers: state.allUsers.map(u => {
            if (u.id === userId) {
              const updatedUser = { ...u, role: newRole };
              if (departmentId !== undefined) {
                updatedUser.departmentId = departmentId;
              }
              // If user is currently logged in, update their session too
              if (state.user?.id === userId) {
                // This doesn't strictly update the current state.user, so we do it below
              }
              return updatedUser;
            }
            return u;
          }),
          user: state.user?.id === userId ? { ...state.user, role: newRole, ...(departmentId !== undefined ? { departmentId } : {}) } : state.user
        }));
      },

      removeUser: (userId: string) => {
        set((state) => ({
          allUsers: state.allUsers.filter(u => u.id !== userId)
        }));
      },

      getUsersByDepartment: (departmentId: string) => {
        return get().allUsers.filter(u => u.departmentId === departmentId);
      }
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        allUsers: state.allUsers,
        invitations: state.invitations
      })
    }
  )
);
