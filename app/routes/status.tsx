import { Form, Link } from "react-router";
import type { Route } from "./+types/status";
import { Field } from "~/components/forms";
import { StatusBadge } from "~/components/StatusBadge";
import { priceBandLabel, STATUS_EXPLANATIONS, STATUS_LABELS } from "~/lib/constants";
import {
  findTraderApplication,
  requestDeletion,
  withdrawApplication,
} from "~/lib/data.server";
import { formatDate, formatDateTime } from "~/lib/format";

/**
 * A trader proves an application is theirs with its reference and the email
 * address they applied with. Both are sent by POST, never in the address bar.
 */
export async function action({ request }: Route.ActionArgs) {
  const form = await request.formData();
  const reference = String(form.get("reference") ?? "");
  const email = String(form.get("email") ?? "");
  const intent = String(form.get("intent") ?? "lookup");

  let notice: string | null = null;
  if (intent === "withdraw" && (await withdrawApplication(reference, email))) {
    notice = "Your application has been withdrawn.";
  }
  if (intent === "request-deletion" && (await requestDeletion(reference, email))) {
    notice =
      "We have received your deletion request. The market team will erase your details within one month.";
  }

  const application = await findTraderApplication(reference, email);
  return { application, notice, reference, email, searched: true };
}

export function meta() {
  return [{ title: "Check an application" }];
}

export default function Status({ actionData }: Route.ComponentProps) {
  const application = actionData?.application ?? null;
  const canWithdraw =
    application !== null && ["submitted", "approved", "waitlisted"].includes(application.status);

  return (
    <div className="max-w-3xl">
      <h1 className="text-[2.125rem] sm:text-5xl">Check an application</h1>
      <p className="mt-2 max-w-prose text-secondary">
        Enter the reference from your confirmation page and the email address you applied with.
      </p>

      <Form method="post" className="panel mt-6 grid gap-4 sm:grid-cols-[1fr_1.4fr_auto] sm:items-end">
        <input type="hidden" name="intent" value="lookup" />
        <Field name="reference" label="Reference">
          {(props) => (
            <input
              {...props}
              type="text"
              required
              defaultValue={actionData?.reference}
              placeholder="PCM-ABC123"
              autoCapitalize="characters"
              className="input uppercase"
            />
          )}
        </Field>
        <Field name="email" label="Email address">
          {(props) => (
            <input
              {...props}
              type="email"
              required
              defaultValue={actionData?.email}
              autoComplete="email"
              className="input"
            />
          )}
        </Field>
        <button type="submit" className="btn btn-brand min-h-[46px]!">
          Find application
        </button>
      </Form>

      {actionData?.notice ? (
        <p role="status" className="notice mt-6">
          {actionData.notice}
        </p>
      ) : null}

      {actionData?.searched && !application ? (
        <div role="alert" className="panel mt-6 ring-2 ring-danger/50">
          <h2 className="text-xl text-danger">We could not find that application</h2>
          <p className="mt-2 text-secondary">
            Check the reference and use the same email address you applied with. Details that have
            been erased can no longer be looked up.
          </p>
        </div>
      ) : null}

      {application ? (
        <section className="mt-8 space-y-8" aria-label="Your application">
          <div className="panel">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-[1.75rem]">{application.businessName}</h2>
              <StatusBadge status={application.status} />
            </div>
            <p className="mt-1 text-secondary">
              {application.marketName}, reference {application.reference}
            </p>
            <p className="mt-4 max-w-prose">{STATUS_EXPLANATIONS[application.status]}</p>
            {application.pitchCode ? (
              <p className="mt-4 text-lg">
                Your pitch is <span className="font-semibold">{application.pitchCode}</span>.{" "}
                <Link to={`/markets/${application.marketSlug}/map?pitch=${application.pitchCode}`}>
                  See it on the map
                </Link>
              </p>
            ) : null}
          </div>

          <div>
            <h3 className="px-1 text-xl">Progress</h3>
            <ol className="group-list mt-3">
              {application.history.map((entry, index) => (
                <li key={index} className="px-5 py-3.5">
                  <span className="font-semibold">{STATUS_LABELS[entry.status]}</span>{" "}
                  <span className="text-secondary">on {formatDateTime(entry.at)}</span>
                  {entry.note ? <span className="block">{entry.note}</span> : null}
                </li>
              ))}
            </ol>
          </div>

          <div>
            <h3 className="px-1 text-xl">The details we hold about you</h3>
            <dl className="panel mt-3 grid gap-x-8 gap-y-4 sm:grid-cols-2">
              {[
                ["Contact name", application.contactName],
                ["Email address", application.email],
                ["Phone number", application.phone],
                ["Website", application.website || "Not given"],
                ["Category", application.category],
                ["Typical price", priceBandLabel(application.priceBand)],
                ["Electricity", application.needsPower ? "Needed" : "Not needed"],
                ["Food registration", application.foodHygieneNumber || "Not given"],
                ["Shown on public stall list", application.consent.publicListing ? "Yes" : "No"],
                ["Emails about future markets", application.consent.marketing ? "Yes" : "No"],
                ["Applied on", formatDate(application.createdAt)],
                ["Deleted automatically on", formatDate(application.retainUntil)],
              ].map(([term, value]) => (
                <div key={term}>
                  <dt className="text-[0.8125rem] text-secondary">{term}</dt>
                  <dd className="break-words">{value}</dd>
                </div>
              ))}
              <div className="sm:col-span-2">
                <dt className="text-[0.8125rem] text-secondary">Description</dt>
                <dd>{application.description}</dd>
              </div>
            </dl>
          </div>

          <div className="flex flex-wrap gap-3">
            {/* reloadDocument: the answer is a file download, not a page. */}
            <Form method="post" action="/status/export" reloadDocument>
              <input type="hidden" name="reference" value={application.reference} />
              <input type="hidden" name="email" value={application.email} />
              <button type="submit" className="btn btn-tinted" data-umami-event="Status: export">
                Download my details
              </button>
            </Form>
            {canWithdraw ? (
              <Form method="post">
                <input type="hidden" name="reference" value={application.reference} />
                <input type="hidden" name="email" value={application.email} />
                <button type="submit" name="intent" value="withdraw" className="btn btn-tinted">
                  Withdraw application
                </button>
              </Form>
            ) : null}
            {application.deletionRequestedAt ? (
              <p className="self-center">
                Deletion requested on {formatDate(application.deletionRequestedAt)}.
              </p>
            ) : (
              <Form method="post">
                <input type="hidden" name="reference" value={application.reference} />
                <input type="hidden" name="email" value={application.email} />
                <button
                  type="submit"
                  name="intent"
                  value="request-deletion"
                  className="btn btn-tinted text-danger"
                >
                  Ask us to delete my details
                </button>
              </Form>
            )}
          </div>
        </section>
      ) : null}
    </div>
  );
}
