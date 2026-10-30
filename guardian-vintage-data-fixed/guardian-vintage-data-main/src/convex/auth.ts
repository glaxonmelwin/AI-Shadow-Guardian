// THIS FILE IS READ ONLY. Do not touch this file unless you are correctly adding a new auth provider in accordance to the vly auth documentation

import { convexAuth } from "@convex-dev/auth/server";
import { Anonymous } from "@convex-dev/auth/providers/Anonymous";
import { Password } from "@convex-dev/auth/providers/Password";
import { emailOtp } from "./auth/emailOtp";

// Both providers below set `role` directly on the user document at the
// moment the account is created, using the `role` value passed in from the
// client (formData for Password, a plain object for Anonymous). This avoids
// a separate setMyRole mutation call after sign-in, which was racing with
// the redirect to /dashboard and intermittently leaving new accounts with
// no role (defaulting to the Employee view) if it fired even slightly late
// or failed silently.
export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [
    Password({
      profile(params) {
        const role = params.role as "manager" | "employee" | undefined;
        return {
          email: params.email as string,
          ...(role === "manager" || role === "employee" ? { role } : {}),
        };
      },
    }),
    emailOtp,
    Anonymous({
      profile(params) {
        const role = params.role as "manager" | "employee" | undefined;
        return {
          isAnonymous: true,
          ...(role === "manager" || role === "employee" ? { role } : {}),
        };
      },
    }),
  ],
});