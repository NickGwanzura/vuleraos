import { auth } from "./config";

export { handlers, auth as authOptions } from "./config";

export async function getSession() {
  return auth();
}

export async function getCurrentUser() {
  const session = await getSession();
  return session?.user ?? null;
}
