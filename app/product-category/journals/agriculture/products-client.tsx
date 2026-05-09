"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useCart } from "@/app/components/cart-store";

type Journal = {
  id: string;
  slug: string;
  journalName: string;
  subject: string;
  issn: string | null;
  frequency: string | null;
  printInr: number;
  onlineInr: number;
  combinedInr: number;
  imageUrl: string | null;
  aboutJournal: string | null;
  focusAndScope: string | null;
};

export default function AgricultureCatalogClient({ journals }: { journals: Journal[] }) {
  const { addItem, items } = useCart();
  const [query, setQuery] = useState("");
  const [planById, setPlanById] = useState<Record<string, "PRINT" | "ONLINE" | "PRINT_ONLINE">>({});

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return journals;
    return journals.filter((j) => `${j.journalName} ${j.subject} ${j.issn || ""}`.toLowerCase().includes(q));
  }, [journals, query]);

  const getPrice = (j: Journal, plan: "PRINT" | "ONLINE" | "PRINT_ONLINE") =>
    plan === "ONLINE" ? j.onlineInr : plan === "PRINT_ONLINE" ? j.combinedInr : j.printInr;

  return (
    <main className="agri-page">
      <section className="agri-hero">
        <div>
          <p className="agri-breadcrumb">Home / Shop / Journals / Agriculture</p>
          <h1>Agriculture Journals</h1>
          <p>Modern catalog UI with fixed annual pricing from local `journal-price.json`.</p>
        </div>
        <div className="agri-hero-actions">
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search journal, ISSN..." />
          <Link href="/cart" className="agri-cart-link">Go to Cart</Link>
        </div>
      </section>

      <section className="agri-grid">
        {filtered.map((j) => {
          const plan = planById[j.id] || "PRINT";
          const price = getPrice(j, plan);
          const qty = items
            .filter((it) => it.id.startsWith(`${j.id}-`))
            .reduce((sum, it) => sum + it.qty, 0);
          return (
            <article className="agri-card" key={j.id}>
              <Link href={`/product/${j.slug}`}>
                <img src={j.imageUrl || "https://dummyimage.com/360x460/eaf0ff/17366f.png&text=STM+Journal"} alt={j.journalName} />
              </Link>
              <div className="agri-card-body">
                <h3><Link href={`/product/${j.slug}`}>{j.journalName}</Link></h3>
                <p>{j.subject} {j.issn ? `| ISSN ${j.issn}` : ""}</p>
                <div className="agri-controls">
                  <select
                    value={plan}
                    onChange={(e) => setPlanById((prev) => ({ ...prev, [j.id]: e.target.value as "PRINT" | "ONLINE" | "PRINT_ONLINE" }))}
                  >
                    <option value="PRINT">Print</option>
                    <option value="ONLINE">Online</option>
                    <option value="PRINT_ONLINE">Print + Online</option>
                  </select>
                  <span className="agri-price">₹{price.toLocaleString("en-IN")}</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    addItem({
                      id: `${j.id}-${plan}`,
                      journalName: j.journalName,
                      subject: j.subject,
                      issn: j.issn,
                      image: j.imageUrl || "https://dummyimage.com/360x460/eaf0ff/17366f.png&text=STM+Journal",
                      year: "2026",
                      plan,
                      unitPrice: price
                    });
                  }}
                >
                  Add to Cart
                </button>
                {qty > 0 ? <div className="agri-qty-badge">{qty}</div> : null}
              </div>
            </article>
          );
        })}
      </section>
    </main>
  );
}
