import Link from "next/link";

import { ProductShell } from "../components/product-shell";

export default function NotFound() {
  return (
    <ProductShell activeSection="investigations">
      <section className="empty-state">
        <span className="eyebrow">Incident unavailable</span>
        <h1>That synthetic incident could not be found.</h1>
        <p>Return to the fleet view and choose one of the seeded event records.</p>
        <Link className="primary-button" href="/fleet">
          Back to fleet
        </Link>
      </section>
    </ProductShell>
  );
}
