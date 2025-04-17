'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Session } from '@supabase/supabase-js';

interface SupabaseContextType {
  session: Session | null;
  isLoading: boolean;
}

const SupabaseContext = createContext<SupabaseContextType>({
  session: null,
  isLoading: true,
});

export const useSupabase = () => useContext(SupabaseContext);

export default function SupabaseProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchSession = async () => {
      const { data } = await supabase.auth.getSession();
      setSession(data.session);
      setIsLoading(false);

      const { data: authListener } = supabase.auth.onAuthStateChange(
        (_event, session) => {
          setSession(session);
        }
      );

      return () => {
        authListener.subscription.unsubscribe();
      };
    };

    fetchSession();
  }, []);

  return (
    <SupabaseContext.Provider value={{ session, isLoading }}>
      {children}
    </SupabaseContext.Provider>
  );
} 