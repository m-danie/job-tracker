import { toNextJsHandler } from "better-auth/next-js";
import { auth } from "@/utils/auth";

// Serves Better Auth's endpoints under /api/auth/* (sign-up, sign-in, session, ...)
export const { GET, POST } = toNextJsHandler(auth);
