"use client";

import Link from "next/link";
import { useState } from "react";
import { useCart } from "@/app/components/cart-store";

type DomainLink = { domain: string; count: number };
type HomeJournal = {
  id: string;
  slug: string;
  journalName: string;
  subject: string;
  issn: string | null;
  printInr: number;
  onlineInr: number;
  combinedInr: number;
  imageUrl: string | null;
};

export default function HomeSections({ domains, journals }: { domains: DomainLink[]; journals: HomeJournal[] }) {
  const { addItem } = useCart();
  const [planById, setPlanById] = useState<Record<string, "PRINT" | "ONLINE" | "PRINT_ONLINE">>({});

  const priceFor = (j: HomeJournal, plan: "PRINT" | "ONLINE" | "PRINT_ONLINE") =>
    plan === "ONLINE" ? j.onlineInr : plan === "PRINT_ONLINE" ? j.combinedInr : j.printInr;

  return (
    <section className="home-sections">
      <div className="home-section-block">
        <h2>Browse by Discipline</h2>
        <div className="home-discipline-grid">
          {domains.map((d) => (
            <a key={d.domain} href={`/product-category/journals/${encodeURIComponent(d.domain)}`}>
              {d.domain} ({d.count})
            </a>
          ))}
        </div>
      </div>

      <div className="home-section-block">
        <h2>Trending Subscriptions</h2>
        <div className="home-trending-grid">
          {journals.map((j) => {
            const plan = planById[j.id] || "PRINT";
            const price = priceFor(j, plan);
            return (
              <article className="home-trend-card" key={j.id}>
                <Link href={`/product/${j.slug}`}>
                  <img
                    src={j.imageUrl || "https://dummyimage.com/360x460/eaf0ff/17366f.png&text=STM+Journal"}
                    alt={j.journalName}
                  />
                </Link>
                <h3>
                  <Link href={`/product/${j.slug}`}>{j.journalName}</Link>
                </h3>
                <p>
                  {j.subject}
                  {j.issn ? ` | ISSN ${j.issn}` : ""}
                </p>
                <div className="home-trend-controls">
                  <select
                    value={plan}
                    onChange={(e) =>
                      setPlanById((prev) => ({
                        ...prev,
                        [j.id]: e.target.value as "PRINT" | "ONLINE" | "PRINT_ONLINE"
                      }))
                    }
                  >
                    <option value="PRINT">Print</option>
                    <option value="ONLINE">Online</option>
                    <option value="PRINT_ONLINE">Print + Online</option>
                  </select>
                  <strong>₹{price.toLocaleString("en-IN")}</strong>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    addItem({
                      id: `${j.id}-${plan}`,
                      journalName: j.journalName,
                      subject: j.subject,
                      issn: j.issn,
                      image: j.imageUrl || "https://dummyimage.com/360x460/eaf0ff/17366f.png&text=STM+Journal",
                      year: "2026",
                      plan,
                      unitPrice: price
                    })
                  }
                >
                  Add to Cart
                </button>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

