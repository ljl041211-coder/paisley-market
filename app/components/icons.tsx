import type { ReactNode } from "react";

function Icon({ children, size = 24 }: { children: ReactNode; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="shrink-0"
    >
      {children}
    </svg>
  );
}

export const HomeIcon = () => (
  <Icon>
    <path d="M4 11.5 12 4l8 7.5" />
    <path d="M6.5 10v9.5h11V10" />
    <path d="M10 19.5v-5h4v5" />
  </Icon>
);

export const StallIcon = () => (
  <Icon>
    <path d="M4 9.5 5.5 4h13L20 9.5" />
    <path d="M4 9.5a2.7 2.7 0 0 0 5.3 0 2.7 2.7 0 0 0 5.4 0 2.7 2.7 0 0 0 5.3 0" />
    <path d="M5.5 12.5V20h13v-7.5" />
  </Icon>
);

export const MapIcon = () => (
  <Icon>
    <path d="M9 5 3.5 7v12L9 17l6 2 5.5-2V5L15 7 9 5Z" />
    <path d="M9 5v12M15 7v12" />
  </Icon>
);

export const ApplyIcon = () => (
  <Icon>
    <path d="M19.5 13v5a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6.5a2 2 0 0 1 2-2h5" />
    <path d="m10 14 .7-3.2L18 3.5a1.8 1.8 0 0 1 2.5 2.5l-7.3 7.3L10 14Z" />
  </Icon>
);

export const StatusIcon = () => (
  <Icon>
    <circle cx="12" cy="12" r="8.5" />
    <path d="m8.3 12.3 2.6 2.6 4.9-5.4" />
  </Icon>
);

export const ListIcon = () => (
  <Icon>
    <path d="M8.5 6.5h11M8.5 12h11M8.5 17.5h11" />
    <path d="M4.5 6.5h.01M4.5 12h.01M4.5 17.5h.01" />
  </Icon>
);

export const LockIcon = () => (
  <Icon>
    <rect x="5" y="10.5" width="14" height="9.5" rx="2.5" />
    <path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5" />
  </Icon>
);

export const ChevronIcon = () => (
  <svg
    width="8"
    height="14"
    viewBox="0 0 8 14"
    fill="none"
    stroke="#aeaeb2"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    className="shrink-0"
  >
    <path d="m1.5 1.5 5 5.5-5 5.5" />
  </svg>
);

export const CheckIcon = ({ size = 20 }: { size?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 20 20"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.4"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    className="shrink-0"
  >
    <path d="m4 10.5 4 4 8-9" />
  </svg>
);
