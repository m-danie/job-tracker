"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/utils/auth";

export async function signOutAction() {
  const requestHeaders = await headers();
  const session = await auth.api.getSession({ headers: requestHeaders });
  if (session?.user.isAnonymous) {
    // Demo users are throwaway: delete them and their data (cascades) right away
    await auth.api.deleteAnonymousUser({ headers: requestHeaders });
  } else {
    await auth.api.signOut({ headers: requestHeaders });
  }
  redirect("/login");
}
