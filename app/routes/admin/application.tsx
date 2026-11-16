import { data, Form, Link } from "react-router";
import type { Route } from "./+types/application";
import { StatusBadge } from "~/components/StatusBadge";
import { priceBandLabel, STATUS_LABELS } from "~/lib/constants";
import {
  adminAssignPitch,
  adminDecide,
  adminErase,
  adminFreePitches,
  adminGetApplication,
  adminSaveNotes,
  getMarket,
} from "~/lib/data.server";
import { formatDate, formatDateTime } from "~/lib/format";
import { requireAdmin } from "~/lib/session.server";

export async function loader({ params, request }: Route.LoaderArgs) {
  await requireAdmin(request);
  const application = await adminGetApplication(params.id);
  if (!application) throw data("We could not find that application.", { status: 404 });
  const [market, freePitches] = await Promise.all([
    getMarket(application.marketSlug),
    adminFreePitches(application.marketId),
  ]);
  return { application, market, freePitches };
}

export async function action({ params, request }: Route.ActionArgs) {
  const admin = await requireAdmin(request);
  const application = await adminGetApplication(params.id);
  if (!application) throw data("We could not find that application.", { status: 404 });

  const form = await request.formData();
  const intent = String(form.get("intent") ?? "");

  if (application.erasedAt) {
    return data({ ok: false, message: "This application has been erased and cannot be changed." }, { status: 400 });
  }

  switch (intent) {
    case "approved":
    case "waitlisted":
    case "rejected":
    case "submitted": {
      await adminDecide(application.id, intent, String(form.get("note") ?? ""), admin.name);
      return { ok: true, message: `Status changed to ${STATUS_LABELS[intent].toLowerCase()}.` };
    }
    case "assign": {
      const result = await adminAssignPitch(application.id, String(form.get("pitchId") ?? ""));
      if (!result.ok) return data({ ok: false, message: result.error }, { status: 400 });
      return { ok: true, message: "Pitch updated." };
    }
    case "notes": {
      await adminSaveNotes(application.id, String(form.get("adminNotes") ?? ""));
      return { ok: true, message: "Notes saved." };
    }
    case "erase": {
      if (form.get("confirm") !== "on") {
        return data(
          { ok: false, message: "Tick the box to confirm before erasing personal data." },
          { status: 400 },
        );
      }
      await adminErase(application.id, admin.name);
      return { ok: true, message: "Personal data erased." };
    }
    default:
      return data({ ok: false, message: "Unknown action." }, { status: 400 });
  }
}

export default function AdminApplication({ loaderData, actionData }: Route.ComponentProps) {
  const { application, market, freePitches } = loaderData;
  const stallType = market?.stallTypes.find((type) => type.key === application.stallType);
  const erased = application.erasedAt !== null;

  return (
    <>
      <p>
        <Link to={`/admin?market=${application.marketSlug}`}>Back to {application.marketName}</Link>
      </p>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-[2.125rem]">{application.businessName}</h1>
        <StatusBadge status={application.status} />
      </div>
      <p className="mt-1 text-secondary">
        Reference {application.reference}, received {formatDate(application.createdAt)}
      </p>

      {actionData ? (
        <p
          role={actionData.ok ? "status" : "alert"}
          className={`notice mt-6 ${actionData.ok ? "" : "notice-danger"}`}
        >
          {actionData.message}
        </p>
      ) : null}

      {application.deletionRequestedAt && !erased ? (
        <p role="alert" className="notice notice-danger mt-6 font-normal! text-ink!">
          <span className="font-semibold text-danger">
            The trader asked for their details to be deleted on{" "}
            {formatDate(application.deletionRequestedAt)}.
          </span>{" "}
          Erase their personal data below within one month of that date.
        </p>
      ) : null}

      <div className="mt-6 grid gap-5 lg:grid-cols-[3fr_2fr]">
        <div className="space-y-5">
          <section className="panel">
            <h2 className="text-[1.375rem]">Application</h2>
            {erased ? (
              <p className="mt-3">
                Personal data was erased on {formatDate(application.erasedAt!)}. Only the anonymous
                record below remains.
              </p>
            ) : null}
            <dl className="mt-4 grid gap-x-8 gap-y-3 sm:grid-cols-2">
              {[
                ["Contact name", application.contactName],
                ["Email address", application.email],
                ["Phone number", application.phone],
                ["Website", application.website],
                ["Category", application.category],
                ["Typical price", priceBandLabel(application.priceBand)],
                ["Pitch type", stallType ? `${stallType.label}, ${stallType.size}` : application.stallType],
                ["Electricity", application.needsPower ? "Needed" : "Not needed"],
                ["Food registration", application.foodHygieneNumber],
                ["Public stall list", application.consent.publicListing ? "Agreed" : "Not agreed"],
                ["Emails about future markets", application.consent.marketing ? "Agreed" : "Not agreed"],
                ["Kept until", formatDate(application.retainUntil)],
              ].map(([term, value]) => (
                <div key={term}>
                  <dt className="text-[0.8125rem] text-secondary">{term}</dt>
                  <dd className="break-words">{value || "Not given"}</dd>
                </div>
              ))}
              <div className="sm:col-span-2">
                <dt className="text-[0.8125rem] text-secondary">Description</dt>
                <dd>{application.description || "Not given"}</dd>
              </div>
            </dl>
          </section>

          <section className="panel">
            <h2 className="text-[1.375rem]">History</h2>
            <ol className="mt-3 divide-y-[0.5px] divide-line">
              {application.history.map((entry, index) => (
                <li key={index} className="py-3 first:pt-0 last:pb-0">
                  <span className="font-semibold">{STATUS_LABELS[entry.status]}</span>{" "}
                  <span className="text-secondary">
                    by {entry.by || "unknown"} on {formatDateTime(entry.at)}
                  </span>
                  {entry.note ? <span className="block">{entry.note}</span> : null}
                </li>
              ))}
            </ol>
          </section>
        </div>

        {erased ? null : (
          <div className="space-y-5">
            <section className="panel">
              <h2 className="text-[1.375rem]">Decision</h2>
              <Form method="post" className="mt-3 space-y-4">
                <div>
                  <label htmlFor="note" className="label">
                    Note to the trader (optional)
                  </label>
                  <span className="hint">The trader sees this when they check their application.</span>
                  <textarea id="note" name="note" rows={2} maxLength={300} className="input" />
                </div>
                <div className="flex flex-wrap gap-2">
                  <button type="submit" name="intent" value="approved" className="btn btn-brand btn-small">
                    Approve
                  </button>
                  <button type="submit" name="intent" value="waitlisted" className="btn btn-tinted btn-small">
                    Add to waiting list
                  </button>
                  <button type="submit" name="intent" value="rejected" className="btn btn-tinted btn-small">
                    Reject
                  </button>
                </div>
              </Form>
            </section>

            <section className="panel">
              <h2 className="text-[1.375rem]">Pitch</h2>
              <p className="mt-2">
                {application.pitchCode
                  ? `Currently on pitch ${application.pitchCode}.`
                  : "No pitch allocated."}
              </p>
              {application.status === "approved" ? (
                <Form method="post" className="mt-3 space-y-3">
                  <input type="hidden" name="intent" value="assign" />
                  <label htmlFor="pitchId" className="label">
                    {application.pitchCode ? "Move to another pitch" : "Allocate a pitch"}
                  </label>
                  <select id="pitchId" name="pitchId" defaultValue="" className="input">
                    <option value="">
                      {application.pitchCode ? "No pitch (release the current one)" : "Choose a free pitch"}
                    </option>
                    {freePitches.map((pitch) => {
                      const type = market?.stallTypes.find((t) => t.key === pitch.stallType);
                      return (
                        <option key={pitch.id} value={pitch.id}>
                          {pitch.code} ({pitch.zone}, {type?.label ?? pitch.stallType}
                          {pitch.hasPower ? ", power" : ""})
                          {pitch.stallType === application.stallType ? " matches request" : ""}
                        </option>
                      );
                    })}
                  </select>
                  <button type="submit" className="btn btn-brand btn-small">
                    Save pitch
                  </button>
                </Form>
              ) : (
                <p className="mt-2 text-secondary">Approve the application to allocate a pitch.</p>
              )}
            </section>

            <section className="panel">
              <h2 className="text-[1.375rem]">Team notes</h2>
              <Form method="post" className="mt-3 space-y-3">
                <input type="hidden" name="intent" value="notes" />
                <label htmlFor="adminNotes" className="sr-only">
                  Team notes
                </label>
                <span className="hint">Only the market team sees these.</span>
                <textarea
                  id="adminNotes"
                  name="adminNotes"
                  rows={3}
                  maxLength={1000}
                  defaultValue={application.adminNotes}
                  className="input"
                />
                <button type="submit" className="btn btn-tinted btn-small">
                  Save notes
                </button>
              </Form>
            </section>

            <section className="panel">
              <h2 className="text-[1.375rem]">Erase personal data</h2>
              <p className="mt-2">
                Removes the trader&rsquo;s name, contact details and description for good, and frees
                their pitch. An anonymous record is kept so the totals stay correct.
              </p>
              <Form method="post" className="mt-3 space-y-3">
                <input type="hidden" name="intent" value="erase" />
                <div className="flex items-center justify-between gap-4">
                  <label htmlFor="confirm" className="flex-1">
                    I understand this cannot be undone.
                  </label>
                  <input type="checkbox" role="switch" id="confirm" name="confirm" className="switch" />
                </div>
                <button type="submit" className="btn btn-tinted btn-small text-danger">
                  Erase personal data
                </button>
              </Form>
            </section>
          </div>
        )}
      </div>
    </>
  );
}
