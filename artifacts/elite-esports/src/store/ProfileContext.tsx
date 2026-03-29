import React, { createContext, useContext } from 'react';
import { useAuth } from './AuthContext';
import { useProfile } from '@/features/profile/hooks/useProfile';
import { ProfileData } from '@/utils/types';

interface ProfileContextType {
  profile: ProfileData;
  loading: boolean;
  fetchError: string | null;
  save: (updates: Partial<ProfileData>) => Promise<{ error: Error | null }>;
  refresh: () => void;
}

const ProfileContext = createContext<ProfileContextType>({
  profile: {},
  loading: true,
  fetchError: null,
  save: async () => ({ error: null }),
  refresh: () => {},
});

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const profileData = useProfile(user?.id);

  return (
    <ProfileContext.Provider value={profileData}>
      {children}
    </ProfileContext.Provider>
  );
}

export const useProfileCtx = () => useContext(ProfileContext);
