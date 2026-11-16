import { STATUS_LABELS, type ApplicationStatus } from "~/lib/constants";

const styles: Record<ApplicationStatus, string> = {
  submitted: "bg-[#e3ecff] text-[#0040dd]",
  approved: "bg-[#dff5e4] text-[#1b6e30]",
  waitlisted: "bg-[#fff0d1] text-[#8f4f00]",
  rejected: "bg-[#ffe3e6] text-[#c4001a]",
  withdrawn: "bg-[#e5e5ea] text-[#48484a]",
};

export function StatusBadge({ status }: { status: ApplicationStatus }) {
  return (
    <span
      className={`inline-block whitespace-nowrap rounded-full px-2.5 py-0.5 text-[0.8125rem] font-semibold ${styles[status]}`}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}
