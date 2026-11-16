import bcrypt from "bcryptjs";
import { createCookieSessionStorage, redirect, type SessionStorage } from "react-router";
import { connectDb } from "./db.server";
import { isProduction, loadEnv } from "./env.server";
import { User, type IUser } from "./models.server";

type SessionData = { userId: string };

export interface AdminUser {
  id: string;
  name: string;
  email: string;
}

let storage: SessionStorage<SessionData> | undefined;

function getStorage() {
  if (storage) return storage;
  loadEnv();
  let secret = process.env.SESSION_SECRET;
  if (!secret) {
    if (isProduction()) {
      throw new Error("SESSION_SECRET is not set. Add a long random value in the host's settings.");
    }
    secret = "development-only-secret-do-not-use-in-production";
  }
  storage = createCookieSessionStorage<SessionData>({
    cookie: {
      name: "__market_admin",
      httpOnly: true, // not readable by scripts in the page
      sameSite: "lax", // not sent with forms posted from other sites
      path: "/",
      maxAge: 60 * 60 * 8, // signed out after 8 hours
      secrets: [secret],
    },
  });
  return storage;
}

/** The cookie is marked Secure whenever the visitor is on HTTPS. */
function isHttps(request: Request) {
  return (
    new URL(request.url).protocol === "https:" ||
    request.headers.get("x-forwarded-proto") === "https"
  );
}

export async function getAdmin(request: Request): Promise<AdminUser | null> {
  const session = await getStorage().getSession(request.headers.get("Cookie"));
  const userId = session.get("userId");
  if (!userId) return null;
  await connectDb();
  const user = await User.findById(userId).select("name email").lean<IUser>();
  return user ? { id: String(user._id), name: user.name, email: user.email } : null;
}

/** Call at the top of every admin loader and action. */
export async function requireAdmin(request: Request): Promise<AdminUser> {
  const admin = await getAdmin(request);
  if (admin) return admin;
  const url = new URL(request.url);
  throw redirect(`/admin/login?next=${encodeURIComponent(url.pathname + url.search)}`);
}

// Compared against when the email is unknown, so a wrong email takes as long
// to reject as a wrong password.
const PLACEHOLDER_HASH = bcrypt.hashSync("placeholder-password", 10);

export async function verifyLogin(email: string, password: string): Promise<AdminUser | null> {
  await connectDb();
  const user = await User.findOne({ email: email.trim().toLowerCase() }).lean<IUser>();
  const matches = await bcrypt.compare(password, user?.passwordHash ?? PLACEHOLDER_HASH);
  if (!user || !matches) return null;
  return { id: String(user._id), name: user.name, email: user.email };
}

/** Only allow redirects back into the admin area after signing in. */
export function safeNext(next: string | null) {
  return next && next.startsWith("/admin") && !next.startsWith("/admin/login") ? next : "/admin";
}

export async function createAdminSession(request: Request, admin: AdminUser, next: string) {
  const session = await getStorage().getSession();
  session.set("userId", admin.id);
  return redirect(next, {
    headers: {
      "Set-Cookie": await getStorage().commitSession(session, { secure: isHttps(request) }),
    },
  });
}

export async function destroyAdminSession(request: Request) {
  const session = await getStorage().getSession(request.headers.get("Cookie"));
  return redirect("/admin/login", {
    headers: {
      "Set-Cookie": await getStorage().destroySession(session, { secure: isHttps(request) }),
    },
  });
}
