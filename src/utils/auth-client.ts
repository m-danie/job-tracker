import { createAuthClient } from "better-auth/react";
import { anonymousClient } from "better-auth/client/plugins";

// Browser-side calls go through /api/auth, where Better Auth applies rate limits
export const authClient = createAuthClient({ plugins: [anonymousClient()] });
