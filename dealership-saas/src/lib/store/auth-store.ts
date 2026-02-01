import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Profile, Organization } from '@/lib/types/database';

interface AuthState {
    user: { id: string; email: string } | null;
    profile: Profile | null;
    organization: Organization | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    setUser: (user: AuthState['user']) => void;
    setProfile: (profile: Profile | null) => void;
    setOrganization: (organization: Organization | null) => void;
    setLoading: (isLoading: boolean) => void;
    reset: () => void;
}

const initialState = {
    user: null,
    profile: null,
    organization: null,
    isLoading: true,
    isAuthenticated: false,
};

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            ...initialState,
            setUser: (user) =>
                set({
                    user,
                    isAuthenticated: !!user,
                }),
            setProfile: (profile) => set({ profile }),
            setOrganization: (organization) => set({ organization }),
            setLoading: (isLoading) => set({ isLoading }),
            reset: () => set(initialState),
        }),
        {
            name: 'auth-storage',
            partialize: (state) => ({
                user: state.user,
                profile: state.profile,
                organization: state.organization,
                isAuthenticated: state.isAuthenticated,
            }),
        }
    )
);
