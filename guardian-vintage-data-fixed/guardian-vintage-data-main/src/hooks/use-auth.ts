import { api } from "@/convex/_generated/api";
import { useAuthActions } from "@convex-dev/auth/react";
import { useConvexAuth, useQuery } from "convex/react";

interface SafeUser {
  _id: string;
  name?: string;
  email?: string;
  role?: "manager" | "employee";
  image?: string;
  isAnonymous?: boolean;
}

export function useAuth() {
  const { isLoading: isAuthLoading, isAuthenticated } = useConvexAuth();
  const rawUser = useQuery(api.users.currentUser);
  const { signIn, signOut } = useAuthActions();

  const user = rawUser as unknown as SafeUser | null | undefined;
  const isLoading = isAuthLoading || rawUser === undefined;

  return { isLoading, isAuthenticated, user, signIn, signOut };
}
