import { useCallback } from "react";
import { trpc } from "@/providers/trpc";

export interface AuthUser {
  id: number;
  phone: string;
  nickname: string | null;
  role: string;
}

export function useAuth() {
  const utils = trpc.useUtils();
  const { data: user, isLoading } = trpc.auth.me.useQuery(undefined, {
    retry: false,
    refetchOnWindowFocus: false,
  });

  const logout = useCallback(() => {
    localStorage.removeItem("auth_token");
    utils.auth.me.invalidate();
    window.location.reload();
  }, [utils]);

  const setToken = useCallback((token: string) => {
    localStorage.setItem("auth_token", token);
    utils.auth.me.invalidate();
  }, [utils]);

  return {
    user: user as AuthUser | null | undefined,
    isLoading,
    isLoggedIn: !!user,
    logout,
    setToken,
  };
}
