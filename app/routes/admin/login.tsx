import { data, Form, Link, redirect, useNavigation } from "react-router";
import type { Route } from "./+types/login";
import { Field } from "~/components/forms";
import { PLATFORM_NAME } from "~/lib/constants";
import { createAdminSession, getAdmin, safeNext, verifyLogin } from "~/lib/session.server";

export async function loader({ request }: Route.LoaderArgs) {
  if (await getAdmin(request)) return redirect("/admin");
  return null;
}

export async function action({ request }: Route.ActionArgs) {
  const form = await request.formData();
  const email = String(form.get("email") ?? "");
  const password = String(form.get("password") ?? "");

  const admin = await verifyLogin(email, password);
  if (!admin) {
    // One message for both cases, so nobody can test which emails exist.
    return data({ error: "The email address or password is not right.", email }, { status: 401 });
  }
  const next = new URL(request.url).searchParams.get("next");
  return createAdminSession(request, admin, safeNext(next));
}

export function meta() {
  return [{ title: "Organiser sign in" }];
}

export default function Login({ actionData }: Route.ComponentProps) {
  const sending = useNavigation().state === "submitting";
  return (
    <main id="main" className="mx-auto max-w-md px-5 py-16">
      <p className="font-semibold text-secondary">{PLATFORM_NAME}</p>
      <h1 className="mt-1 text-[2.125rem]">Organiser sign in</h1>
      <p className="mt-2 text-secondary">
        For members of the market team. Traders do not need an account.
      </p>

      <Form method="post" className="panel mt-6 space-y-5">
        {actionData?.error ? (
          <p role="alert" className="error-text text-[0.9375rem]">
            {actionData.error}
          </p>
        ) : null}
        <Field name="email" label="Email address">
          {(props) => (
            <input
              {...props}
              type="email"
              required
              defaultValue={actionData?.email}
              autoComplete="username"
              className="input"
            />
          )}
        </Field>
        <Field name="password" label="Password">
          {(props) => (
            <input {...props} type="password" required autoComplete="current-password" className="input" />
          )}
        </Field>
        <button type="submit" disabled={sending} className="btn btn-brand w-full disabled:opacity-60">
          {sending ? "Signing in" : "Sign in"}
        </button>
      </Form>

      <p className="mt-6 text-center">
        <Link to="/">Back to the public site</Link>
      </p>
    </main>
  );
}
