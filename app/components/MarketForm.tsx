import { Form, useNavigation } from "react-router";
import { ErrorSummary, Field, FormSection, Switch } from "~/components/forms";
import { toDateInput } from "~/lib/format";
import type { FieldErrors, MarketDTO } from "~/lib/types";

interface MarketFormProps {
  market?: MarketDTO;
  errors?: FieldErrors;
  values?: Record<string, string>;
  submitLabel: string;
  children?: React.ReactNode;
}

export function MarketForm({ market, errors = {}, values, submitLabel, children }: MarketFormProps) {
  const sending = useNavigation().state === "submitting";

  const value = (name: string, saved: string | undefined, fallback = "") =>
    values?.[name] ?? saved ?? fallback;
  const date = (name: string, saved: Date | undefined) =>
    values?.[name] ?? (saved ? toDateInput(saved) : "");
  const featured = values ? values.featured === "on" : (market?.featured ?? false);

  return (
    <Form method="post" noValidate className="mt-7 max-w-2xl space-y-8">
      <ErrorSummary errors={errors} />

      <FormSection title="Public details">
        <Field name="name" label="Market name" error={errors.name}>
          {(props) => <input {...props} type="text" defaultValue={value("name", market?.name)} className="input" />}
        </Field>
        <Field name="tagline" label="Tagline" hint="One sentence shown under the name." error={errors.tagline}>
          {(props) => <input {...props} type="text" defaultValue={value("tagline", market?.tagline)} className="input" />}
        </Field>
        <Field name="description" label="About the market" hint="Leave an empty line between paragraphs." error={errors.description}>
          {(props) => (
            <textarea {...props} rows={6} defaultValue={value("description", market?.description)} className="input" />
          )}
        </Field>
        <Field
          name="announcement"
          label="Announcement (optional)"
          hint="Shown in a bar at the top of every page of this market, for example a weather closure."
          error={errors.announcement}
        >
          {(props) => (
            <input {...props} type="text" defaultValue={value("announcement", market?.announcement)} className="input" />
          )}
        </Field>
      </FormSection>

      <FormSection title="Where and when">
        <div className="grid gap-5 sm:grid-cols-2">
          <Field name="venue" label="Venue" error={errors.venue}>
            {(props) => <input {...props} type="text" defaultValue={value("venue", market?.venue)} className="input" />}
          </Field>
          <Field name="address" label="Address" error={errors.address}>
            {(props) => <input {...props} type="text" defaultValue={value("address", market?.address)} className="input" />}
          </Field>
          <Field name="startDate" label="First day" error={errors.startDate}>
            {(props) => <input {...props} type="date" defaultValue={date("startDate", market?.startDate)} className="input" />}
          </Field>
          <Field name="endDate" label="Last day" error={errors.endDate}>
            {(props) => <input {...props} type="date" defaultValue={date("endDate", market?.endDate)} className="input" />}
          </Field>
        </div>
        <Field name="openingHours" label="Opening hours" error={errors.openingHours}>
          {(props) => (
            <input {...props} type="text" defaultValue={value("openingHours", market?.openingHours)} className="input" />
          )}
        </Field>
      </FormSection>

      <FormSection title="Trader applications">
        <div className="grid gap-5 sm:grid-cols-2">
          <Field name="applicationsOpen" label="Applications open" error={errors.applicationsOpen}>
            {(props) => (
              <input {...props} type="date" defaultValue={date("applicationsOpen", market?.applicationsOpen)} className="input" />
            )}
          </Field>
          <Field name="applicationsClose" label="Applications close" hint="Open until 11pm UK time on this day." error={errors.applicationsClose}>
            {(props) => (
              <input {...props} type="date" defaultValue={date("applicationsClose", market?.applicationsClose)} className="input" />
            )}
          </Field>
        </div>
      </FormSection>

      <FormSection title="Look and feel">
        <p className="max-w-prose text-[0.9375rem] text-secondary">
          Text colours are chosen automatically so they stay readable on whatever you pick.
        </p>
        <div className="grid gap-5 sm:grid-cols-3">
          <Field name="ground" label="Card colour" hint="The large card on the home page." error={errors.ground}>
            {(props) => (
              <input {...props} type="color" defaultValue={value("ground", market?.theme.ground, "#1c1c1e")} className="h-11 w-full cursor-pointer rounded-xl bg-fill p-1" />
            )}
          </Field>
          <Field name="brand" label="Tint colour" hint="Buttons, links and the active tab." error={errors.brand}>
            {(props) => (
              <input {...props} type="color" defaultValue={value("brand", market?.theme.brand, "#0066cc")} className="h-11 w-full cursor-pointer rounded-xl bg-fill p-1" />
            )}
          </Field>
          <Field name="accent" label="Highlight colour" hint="Dates and filled pitches on the card." error={errors.accent}>
            {(props) => (
              <input {...props} type="color" defaultValue={value("accent", market?.theme.accent, "#ffd60a")} className="h-11 w-full cursor-pointer rounded-xl bg-fill p-1" />
            )}
          </Field>
        </div>
        <Switch
          name="featured"
          defaultChecked={featured}
          label="Make this the market people see first when they open the site."
        />
      </FormSection>

      {children}

      <button type="submit" disabled={sending} className="btn btn-brand w-full disabled:opacity-60 sm:w-auto">
        {sending ? "Saving" : submitLabel}
      </button>
    </Form>
  );
}
