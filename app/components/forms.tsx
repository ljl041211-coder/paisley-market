import type { ReactNode } from "react";
import type { FieldErrors } from "~/lib/types";

/**
 * Lists every problem at the top of a form, each linking to its field.
 * It takes focus when it appears so screen-reader users hear it straight away.
 */
export function ErrorSummary({ errors }: { errors: FieldErrors | undefined }) {
  const entries = Object.entries(errors ?? {});
  if (entries.length === 0) return null;
  return (
    <div
      role="alert"
      tabIndex={-1}
      ref={(node) => node?.focus()}
      className="panel mb-8 outline-none ring-2 ring-danger/50"
    >
      <h2 className="text-xl text-danger">
        {entries.length === 1
          ? "There is a problem with one answer"
          : `There are problems with ${entries.length} answers`}
      </h2>
      <ul className="mt-3 space-y-1.5">
        {entries.map(([field, message]) => (
          <li key={field}>
            <a href={`#${field}`} className="font-semibold text-danger underline">
              {message}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function FormSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <fieldset>
      <legend className="mb-2 px-1 font-display text-[1.375rem] font-bold tracking-tight">
        {title}
      </legend>
      <div className="panel space-y-5">{children}</div>
    </fieldset>
  );
}

interface FieldProps {
  name: string;
  label: string;
  hint?: string;
  error?: string;
  children: (props: {
    id: string;
    name: string;
    "aria-invalid": boolean;
    "aria-describedby": string | undefined;
  }) => ReactNode;
}

/** Label, optional hint, error message and the control itself, wired up for accessibility. */
export function Field({ name, label, hint, error, children }: FieldProps) {
  const describedBy =
    [hint ? `${name}-hint` : "", error ? `${name}-error` : ""].filter(Boolean).join(" ") ||
    undefined;
  return (
    <div>
      <label htmlFor={name} className="label">
        {label}
      </label>
      {hint ? (
        <span id={`${name}-hint`} className="hint">
          {hint}
        </span>
      ) : null}
      {error ? (
        <span id={`${name}-error`} className="error-text">
          {error}
        </span>
      ) : null}
      {children({ id: name, name, "aria-invalid": Boolean(error), "aria-describedby": describedBy })}
    </div>
  );
}

interface SwitchProps {
  name: string;
  label: ReactNode;
  defaultChecked?: boolean;
  error?: string;
}

/**
 * A yes/no choice shown as an iOS switch. Underneath it is an ordinary
 * checkbox, so it submits with the form and works with a keyboard.
 */
export function Switch({ name, label, defaultChecked, error }: SwitchProps) {
  return (
    <div>
      {error ? (
        <span id={`${name}-error`} className="error-text">
          {error}
        </span>
      ) : null}
      <div className="flex items-center justify-between gap-4">
        <label htmlFor={name} className="flex-1">
          {label}
        </label>
        <input
          type="checkbox"
          role="switch"
          id={name}
          name={name}
          defaultChecked={defaultChecked}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${name}-error` : undefined}
          className="switch"
        />
      </div>
    </div>
  );
}
