import { data, Link, redirect } from "react-router";
import type { Route } from "./+types/market-new";
import { Field, FormSection } from "~/components/forms";
import { MarketForm } from "~/components/MarketForm";
import { createMarket } from "~/lib/data.server";
import { requireAdmin } from "~/lib/session.server";
import { parseMarketForm } from "~/lib/validation";

export async function loader({ request }: Route.LoaderArgs) {
  await requireAdmin(request);
  return null;
}

export async function action({ request }: Route.ActionArgs) {
  await requireAdmin(request);
  const form = await request.formData();
  const result = parseMarketForm(form);
  if (!result.ok) {
    return data({ errors: result.errors, values: result.values }, { status: 400 });
  }

  const created = await createMarket(result.data, {
    rows: Number(form.get("rows")) || 2,
    perRow: Number(form.get("perRow")) || 6,
  });
  if ("error" in created) {
    const values = Object.fromEntries(
      [...form.entries()].filter((entry): entry is [string, string] => typeof entry[1] === "string"),
    );
    return data({ errors: { name: created.error }, values }, { status: 400 });
  }
  return redirect(`/admin?market=${created.slug}`);
}

export default function MarketNew({ actionData }: Route.ComponentProps) {
  return (
    <>
      <p>
        <Link to="/admin">Back to the organiser area</Link>
      </p>
      <h1 className="mt-3 text-[2.125rem]">Add a market</h1>
      <p className="mt-2 max-w-prose text-secondary">
        A new market starts with the standard categories and pitch types and a simple grid of
        pitches. It gets its own public pages, application form and map straight away.
      </p>
      <MarketForm errors={actionData?.errors} values={actionData?.values} submitLabel="Create market">
        <FormSection title="Pitch plan">
          <div className="grid gap-5 sm:grid-cols-2">
            <Field name="rows" label="Rows of pitches" hint="1 to 6. The first row is for food.">
              {(props) => (
                <input {...props} type="number" min={1} max={6} defaultValue={actionData?.values?.rows ?? "2"} className="input" />
              )}
            </Field>
            <Field name="perRow" label="Pitches in each row" hint="1 to 12.">
              {(props) => (
                <input {...props} type="number" min={1} max={12} defaultValue={actionData?.values?.perRow ?? "6"} className="input" />
              )}
            </Field>
          </div>
        </FormSection>
      </MarketForm>
    </>
  );
}
