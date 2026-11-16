import { Link } from "react-router";
import type { Route } from "./+types/dashboard";
import { StatusBadge } from "~/components/StatusBadge";
import { STATUSES, STATUS_LABELS, type ApplicationStatus } from "~/lib/constants";
import { adminListApplications, adminOverview, listMarkets } from "~/lib/data.server";
import { formatDate, formatDateRange } from "~/lib/format";
import { requireAdmin } from "~/lib/session.server";

export async function loader({ request }: Route.LoaderArgs) {
  await requireAdmin(request);
  const search = new URL(request.url).searchParams;
  const markets = await listMarkets();
  const market =
    markets.find((m) => m.slug === search.get("market")) ??
    markets.find((m) => m.featured) ??
    markets[0] ??
    null;
  if (!market) return { markets, market: null, overview: null, applications: [], status: null };

  const wanted = search.get("status");
  const status = STATUSES.includes(wanted as ApplicationStatus) ? (wanted as ApplicationStatus) : null;
  const [overview, applications] = await Promise.all([
    adminOverview(market.id),
    adminListApplications(market.id, status ?? undefined),
  ]);
  return { markets, market, overview, applications, status };
}

export default function Dashboard({ loaderData }: Route.ComponentProps) {
  const { markets, market, overview, applications, status } = loaderData;

  if (!market || !overview) {
    return (
      <div className="panel max-w-prose">
        <h1 className="text-[1.75rem]">No markets yet</h1>
        <p className="mt-2 text-secondary">Add your first market to start taking trader applications.</p>
        <Link to="/admin/markets/new" className="btn btn-brand mt-4">
          Add a market
        </Link>
      </div>
    );
  }

  const total = STATUSES.reduce((sum, s) => sum + overview.byStatus[s], 0);
  const filterLink = (s: ApplicationStatus | null) =>
    `/admin?market=${market.slug}${s ? `&status=${s}` : ""}`;

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <nav aria-label="Markets" className="segmented">
          {markets.map((m) => (
            <Link
              key={m.id}
              to={`/admin?market=${m.slug}`}
              aria-current={m.id === market.id ? "page" : undefined}
              className="segment"
            >
              {m.name}
            </Link>
          ))}
        </nav>
        <Link to="/admin/markets/new" className="font-semibold">
          Add a market
        </Link>
      </div>

      <div className="mt-7 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[2.125rem]">{market.name}</h1>
          <p className="mt-1 text-secondary">
            {formatDateRange(market.startDate, market.endDate)}. Applications close{" "}
            {formatDate(market.applicationsClose)}.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link to={`/admin/markets/${market.slug}/edit`} className="btn btn-tinted btn-small">
            Edit market details
          </Link>
          <Link to={`/markets/${market.slug}`} className="btn btn-tinted btn-small">
            View public pages
          </Link>
        </div>
      </div>

      <dl className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {[
          ["Waiting for a decision", overview.byStatus.submitted],
          ["Approved", overview.byStatus.approved],
          ["Waiting list", overview.byStatus.waitlisted],
          ["Pitches allocated", `${overview.pitches.taken} of ${overview.pitches.total}`],
        ].map(([label, value]) => (
          <div key={label} className="panel flex flex-col-reverse justify-end">
            <dt className="text-[0.8125rem] font-medium text-secondary">{label}</dt>
            <dd className="text-[2rem] font-bold tracking-tight">{value}</dd>
          </div>
        ))}
        <div
          className={`panel flex flex-col-reverse justify-end ${
            overview.deletionRequests > 0 ? "ring-2 ring-danger/60" : ""
          }`}
        >
          <dt className="text-[0.8125rem] font-medium text-secondary">Deletion requests</dt>
          <dd
            className={`text-[2rem] font-bold tracking-tight ${
              overview.deletionRequests > 0 ? "text-danger" : ""
            }`}
          >
            {overview.deletionRequests}
          </dd>
        </div>
      </dl>

      <h2 className="mt-10 px-1 text-[1.375rem]">Applications</h2>
      <nav aria-label="Filter by status" className="segmented mt-3">
        <Link to={filterLink(null)} aria-current={status === null ? "true" : undefined} className="segment">
          All ({total})
        </Link>
        {STATUSES.map((s) => (
          <Link key={s} to={filterLink(s)} aria-current={status === s ? "true" : undefined} className="segment">
            {STATUS_LABELS[s]} ({overview.byStatus[s]})
          </Link>
        ))}
      </nav>

      {applications.length === 0 ? (
        <p className="panel mt-4">
          {status ? "No applications with this status." : "No applications yet."}
        </p>
      ) : (
        <div className="mt-4 overflow-x-auto rounded-[20px] bg-white">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b-[0.5px] border-line text-[0.8125rem] text-secondary">
                <th scope="col" className="px-5 py-3 font-medium">Business</th>
                <th scope="col" className="px-5 py-3 font-medium">Category</th>
                <th scope="col" className="px-5 py-3 font-medium">Pitch type</th>
                <th scope="col" className="px-5 py-3 font-medium">Status</th>
                <th scope="col" className="px-5 py-3 font-medium">Pitch</th>
                <th scope="col" className="px-5 py-3 font-medium">Received</th>
              </tr>
            </thead>
            <tbody>
              {applications.map((application) => (
                <tr key={application.id} className="border-b-[0.5px] border-line last:border-0">
                  <th scope="row" className="px-5 py-3 font-semibold">
                    <Link to={`/admin/applications/${application.id}`}>
                      {application.businessName}
                    </Link>
                    <span className="block font-mono text-[0.8125rem] font-normal text-secondary">
                      {application.reference}
                    </span>
                    {application.deletionRequestedAt && !application.erasedAt ? (
                      <span className="block text-[0.8125rem] font-semibold text-danger">
                        Deletion requested
                      </span>
                    ) : null}
                  </th>
                  <td className="px-5 py-3">{application.category}</td>
                  <td className="px-5 py-3">
                    {market.stallTypes.find((t) => t.key === application.stallType)?.label ??
                      application.stallType}
                  </td>
                  <td className="px-5 py-3">
                    <StatusBadge status={application.status} />
                  </td>
                  <td className="px-5 py-3">{application.pitchCode ?? "None"}</td>
                  <td className="whitespace-nowrap px-5 py-3 text-secondary">{formatDate(application.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
