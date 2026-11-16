import { Link } from "react-router";
import { PLATFORM_NAME } from "~/lib/constants";

export function meta() {
  return [{ title: "Privacy notice" }];
}

export default function Privacy() {
  return (
    <article className="max-w-prose space-y-7">
      <header>
        <h1 className="text-[2.125rem] sm:text-5xl">Privacy notice</h1>
        <p className="mt-3 text-secondary">
          This notice explains what {PLATFORM_NAME} and the market organisers who use it do with
          personal details. This site is a student proof of concept for a fictional client, so no
          real applications are processed.
        </p>
      </header>

      <section>
        <h2 className="text-xl">Visitors</h2>
        <p className="mt-2">
          You can browse every market, stall list and map without giving any personal details. We
          do not set cookies for visitors and we do not show advertising.
        </p>
      </section>

      <section>
        <h2 className="text-xl">Traders who apply for a pitch</h2>
        <p className="mt-2">When you apply we collect:</p>
        <ul className="mt-2 list-disc space-y-1 pl-6">
          <li>your business name, contact name, email address and phone number</li>
          <li>what you sell, your typical prices and the pitch you want</li>
          <li>your food business registration number, if you sell food or drink</li>
          <li>the choices you make about the public stall list and future emails</li>
        </ul>
        <p className="mt-3">
          The organiser uses these details to decide on your application and run the market. That
          is necessary to take steps towards a contract with you at your request (UK GDPR Article
          6(1)(b)).
        </p>
        <p className="mt-3">
          Showing your business on the public stall list and emailing you about future markets
          happen only if you tick those boxes. They rely on your consent (Article 6(1)(a)), and
          saying no does not affect your application.
        </p>
      </section>

      <section>
        <h2 className="text-xl">How long we keep it</h2>
        <p className="mt-2">
          Applications are deleted automatically 12 months after the market ends. The exact date
          is shown when you check your application.
        </p>
      </section>

      <section>
        <h2 className="text-xl">Your rights</h2>
        <p className="mt-2">
          On the <Link to="/status">check an application</Link> page you can, at any time:
        </p>
        <ul className="mt-2 list-disc space-y-1 pl-6">
          <li>see every detail we hold about you</li>
          <li>download those details as a file</li>
          <li>withdraw your application</li>
          <li>ask us to delete your details, which the organiser does within one month</li>
        </ul>
        <p className="mt-3">
          You can also complain to the Information Commissioner&rsquo;s Office at ico.org.uk.
        </p>
      </section>

      <section>
        <h2 className="text-xl">Who can see your details</h2>
        <p className="mt-2">
          Only signed-in members of the market team. Your contact details are never shown to the
          public. They are stored with our hosting and database providers, who act on our
          instructions.
        </p>
      </section>

      <section>
        <h2 className="text-xl">Cookies and statistics</h2>
        <p className="mt-2">
          One cookie is used, only for organisers, to keep them signed in. It is strictly
          necessary, so no consent banner is needed. If visit statistics are switched on, they are
          collected without cookies and without storing IP addresses, and they respect your
          browser&rsquo;s Do Not Track setting.
        </p>
      </section>
    </article>
  );
}
