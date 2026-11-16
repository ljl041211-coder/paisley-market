import { data, Form, Link, redirect, useNavigation } from "react-router";
import type { Route } from "./+types/apply";
import { ErrorSummary, Field, FormSection, Switch } from "~/components/forms";
import { CheckIcon } from "~/components/icons";
import { PRICE_BANDS } from "~/lib/constants";
import { createApplication } from "~/lib/data.server";
import { applicationWindow, formatDate, formatPrice } from "~/lib/format";
import { requireMarket } from "~/lib/http.server";
import { parseApplicationForm } from "~/lib/validation";

export async function loader({ params }: Route.LoaderArgs) {
  const market = await requireMarket(params.slug);
  return { market, applyWindow: applicationWindow(market) };
}

export async function action({ params, request }: Route.ActionArgs) {
  const market = await requireMarket(params.slug);
  if (applicationWindow(market) !== "open") {
    throw data("Applications for this market are not open.", { status: 403 });
  }

  const form = await request.formData();

  // Spam trap: people never see this field, so only a bot fills it in.
  if (form.get("fax")) return redirect(`/markets/${market.slug}`);

  const result = parseApplicationForm(form, market);
  if (!result.ok) {
    return data({ errors: result.errors, values: result.values }, { status: 400 });
  }

  const reference = await createApplication(market, result.data);
  return redirect(`/markets/${market.slug}/apply/success/${reference}`);
}

export function meta({ loaderData }: Route.MetaArgs) {
  return [{ title: `Apply for a pitch at ${loaderData?.market.name ?? "the market"}` }];
}

export default function Apply({ loaderData, actionData }: Route.ComponentProps) {
  const { market, applyWindow } = loaderData;
  const errors = actionData?.errors ?? {};
  const values = actionData?.values ?? {};
  const sending = useNavigation().state === "submitting";

  if (applyWindow !== "open") {
    return (
      <div className="mx-auto max-w-2xl px-5 pt-8">
        <h1 className="text-[2.125rem] sm:text-5xl">Apply for a pitch</h1>
        <div className="panel mt-6">
          <h2 className="text-xl">
            {applyWindow === "closed" ? "Applications have closed" : "Applications are not open yet"}
          </h2>
          <p className="mt-2 text-secondary">
            {applyWindow === "closed"
              ? `Applications for ${market.name} closed on ${formatDate(market.applicationsClose)}.`
              : `Applications for ${market.name} open on ${formatDate(market.applicationsOpen)}.`}{" "}
            If you have already applied, you can <Link to="/status">check your application</Link>.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-5 pt-8">
      <h1 className="text-[2.125rem] sm:text-5xl">Apply for a pitch</h1>
      <p className="mt-2 max-w-prose text-secondary">
        Tell us about your business and what you would like to sell at {market.name}. Applications
        close on {formatDate(market.applicationsClose)}.
      </p>

      {/* noValidate: the server's own messages are shown instead of the browser's. */}
      <Form method="post" noValidate className="mt-7 space-y-8">
        <ErrorSummary errors={actionData?.errors} />

        <FormSection title="Your business">
          <Field name="businessName" label="Business or trading name" error={errors.businessName}>
            {(props) => (
              <input {...props} type="text" defaultValue={values.businessName} autoComplete="organization" className="input" />
            )}
          </Field>
          <Field name="contactName" label="Contact name" error={errors.contactName}>
            {(props) => (
              <input {...props} type="text" defaultValue={values.contactName} autoComplete="name" className="input" />
            )}
          </Field>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field
              name="email"
              label="Email address"
              hint="You need this to check your application later."
              error={errors.email}
            >
              {(props) => (
                <input {...props} type="email" defaultValue={values.email} autoComplete="email" className="input" />
              )}
            </Field>
            <Field name="phone" label="Phone number" hint="For questions on market days." error={errors.phone}>
              {(props) => (
                <input {...props} type="tel" defaultValue={values.phone} autoComplete="tel" className="input" />
              )}
            </Field>
          </div>
          <Field name="website" label="Website or social media page (optional)" error={errors.website}>
            {(props) => (
              <input {...props} type="url" defaultValue={values.website} placeholder="https://" className="input" />
            )}
          </Field>
        </FormSection>

        <FormSection title="What you sell">
          <Field name="category" label="Category" error={errors.category}>
            {(props) => (
              <select {...props} defaultValue={values.category ?? ""} className="input">
                <option value="" disabled>
                  Choose a category
                </option>
                {market.categories.map((category) => (
                  <option key={category.name}>{category.name}</option>
                ))}
              </select>
            )}
          </Field>
          <Field
            name="description"
            label="Describe your stall"
            hint="Shown on the public stall list if you are approved. 20 to 600 characters."
            error={errors.description}
          >
            {(props) => (
              <textarea {...props} rows={4} defaultValue={values.description} maxLength={600} className="input" />
            )}
          </Field>
          <Field
            name="priceBand"
            label="Typical price of one item"
            hint="Helps visitors find gifts within their budget."
            error={errors.priceBand}
          >
            {(props) => (
              <select {...props} defaultValue={values.priceBand ?? ""} className="input">
                <option value="" disabled>
                  Choose a price range
                </option>
                {PRICE_BANDS.map((band) => (
                  <option key={band.key} value={band.key}>
                    {band.label}
                  </option>
                ))}
              </select>
            )}
          </Field>
          <Field
            name="foodHygieneNumber"
            label="Food business registration number"
            hint="Food and drink traders only. Leave empty for every other category."
            error={errors.foodHygieneNumber}
          >
            {(props) => (
              <input {...props} type="text" defaultValue={values.foodHygieneNumber} className="input" />
            )}
          </Field>
        </FormSection>

        <fieldset>
          <legend className="mb-2 px-1 font-display text-[1.375rem] font-bold tracking-tight">
            Your pitch
          </legend>
          {errors.stallType ? (
            <span id="stallType-error" className="error-text px-1">
              {errors.stallType}
            </span>
          ) : null}
          <div id="stallType" className="group-list">
            {market.stallTypes.map((type) => (
              <label
                key={type.key}
                className="group flex cursor-pointer items-center gap-4 px-5 py-3.5 has-focus-visible:bg-fill"
              >
                <input
                  type="radio"
                  name="stallType"
                  value={type.key}
                  defaultChecked={values.stallType === type.key}
                  className="sr-only"
                />
                <span className="flex-1">
                  <span className="font-semibold">
                    {type.label}, {type.size}
                  </span>
                  <span className="block text-[0.9375rem] text-secondary">{type.description}</span>
                </span>
                <span className="whitespace-nowrap font-semibold">{formatPrice(type.price)}</span>
                <span className="text-tint opacity-0 group-has-checked:opacity-100">
                  <CheckIcon />
                </span>
              </label>
            ))}
          </div>
          <div className="panel mt-4">
            <Switch
              name="needsPower"
              label="I need an electricity supply"
              defaultChecked={values.needsPower === "on"}
            />
          </div>
        </fieldset>

        <fieldset>
          <legend className="mb-2 px-1 font-display text-[1.375rem] font-bold tracking-tight">
            How we use your details
          </legend>
          <p className="mb-3 max-w-prose px-1 text-[0.9375rem] text-secondary">
            We use your answers to decide on your application and to run the market. We delete them
            12 months after the market ends. You can see, download or delete your details at any
            time.
          </p>
          <div className="group-list">
            <div className="px-5 py-3.5">
              <Switch
                name="privacy"
                error={errors.privacy}
                defaultChecked={values.privacy === "on"}
                label={
                  <>
                    I have read the{" "}
                    <Link to="/privacy" target="_blank" rel="noopener">
                      privacy notice
                    </Link>{" "}
                    and agree to my details being used to process this application.
                  </>
                }
              />
            </div>
            <div className="px-5 py-3.5">
              <Switch
                name="publicListing"
                defaultChecked={values.publicListing === "on"}
                label="Optional: if I am approved, show my business name and description on the public stall list and map."
              />
            </div>
            <div className="px-5 py-3.5">
              <Switch
                name="marketing"
                defaultChecked={values.marketing === "on"}
                label="Optional: email me about future markets run by the same organiser."
              />
            </div>
          </div>
        </fieldset>

        {/* Hidden from people and from assistive technology. See the action above. */}
        <div aria-hidden="true" className="hidden">
          <label>
            Fax number
            <input type="text" name="fax" tabIndex={-1} autoComplete="off" />
          </label>
        </div>

        <button
          type="submit"
          disabled={sending}
          className="btn btn-brand w-full disabled:opacity-60"
          data-umami-event="Apply: submit"
        >
          {sending ? "Sending your application" : "Send application"}
        </button>
      </Form>
    </div>
  );
}
