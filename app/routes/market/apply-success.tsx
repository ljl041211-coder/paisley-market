import { data, Link } from "react-router";
import type { Route } from "./+types/apply-success";
import { CheckIcon } from "~/components/icons";
import { requireMarket } from "~/lib/http.server";

export async function loader({ params }: Route.LoaderArgs) {
  const market = await requireMarket(params.slug);
  const reference = params.reference.toUpperCase();
  if (!/^[A-Z0-9]{1,4}-[A-Z0-9]{6}$/.test(reference)) {
    throw data("We could not find that page.", { status: 404 });
  }
  return { market, reference };
}

export function meta() {
  return [{ title: "Application sent" }];
}

export default function ApplySuccess({ loaderData }: Route.ComponentProps) {
  const { market, reference } = loaderData;
  return (
    <div className="mx-auto max-w-2xl px-5 pt-10">
      <div className="panel px-6 py-10 text-center">
        <span className="mx-auto flex size-16 items-center justify-center rounded-full bg-[#34c759] text-white">
          <CheckIcon size={34} />
        </span>
        <h1 className="mt-5 text-[2.125rem]">Application sent</h1>
        <p className="mt-3 text-secondary">Your reference is</p>
        <p className="mt-1 font-mono text-3xl font-semibold tracking-wide">{reference}</p>
      </div>

      <h2 className="mt-8 px-1 text-xl">Keep this reference</h2>
      <p className="mt-2 max-w-prose px-1 text-secondary">
        You need it, together with your email address, to check progress, withdraw, or see and
        delete the details we hold about you. We do not show it again.
      </p>

      <h2 className="mt-6 px-1 text-xl">What happens next</h2>
      <p className="mt-2 max-w-prose px-1 text-secondary">
        The {market.name} team reviews every application. Your application shows as approved, on
        the waiting list or not successful as soon as they decide. If you are approved, your pitch
        number appears there too.
      </p>

      <div className="mt-8 grid gap-3 sm:grid-cols-2">
        <Link to="/status" className="btn btn-brand">
          Check an application
        </Link>
        <Link to={`/markets/${market.slug}`} className="btn btn-tinted">
          Back to {market.name}
        </Link>
      </div>
    </div>
  );
}
