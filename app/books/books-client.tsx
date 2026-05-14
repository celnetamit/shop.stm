"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useCart } from "@/app/components/cart-store";
import { BookItem } from "@/lib/books-catalog";

type Props = {
  initialBooks: BookItem[];
  categories: string[];
};

function BookImage({ src, title, category }: { src: string | null; title: string; category: string }) {
  const [error, setError] = useState(false);

  if (!src || error) {
    return (
      <div style={{
        height: "220px",
        width: "156px",
        background: "linear-gradient(135deg, #1e3a8a 0%, #0f172a 100%)",
        borderRadius: "4px 8px 8px 4px",
        boxShadow: "5px 10px 25px rgba(15, 23, 42, 0.25), inset 1px 0 0 rgba(255,255,255,0.2)",
        borderLeft: "6px solid #3b82f6",
        padding: "16px 12px",
        color: "#ffffff",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        position: "relative",
        overflow: "hidden",
        userSelect: "none"
      }}>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, background: "url('data:image/svg+xml,%3Csvg width=\"30\" height=\"30\" viewBox=\"0 0 30 30\" xmlns=\"http://www.w3.org/2000/svg\"%3E%3Cg fill=\"%23ffffff\" fill-opacity=\"0.04\" fill-rule=\"evenodd\"%3E%3Cpath d=\"M15 0C6.716 0 0 6.716 0 15s6.716 15 15 15 15-6.716 15-15S23.284 0 15 0zm0 28C7.82 28 2 22.18 2 15S7.82 2 15 2s13 5.82 13 13-5.82 13-13 13z\"/%3E%3C/g%3E%3C/svg%3E')" }}></div>
        <div style={{ fontSize: "8px", textTransform: "uppercase", letterSpacing: "0.12em", color: "#60a5fa", fontWeight: "800", zIndex: 2 }}>STM REFERENCE</div>
        <div style={{
          fontSize: "11.5px",
          fontWeight: "700",
          lineHeight: "1.45",
          margin: "10px 0",
          display: "-webkit-box",
          WebkitLineClamp: 6,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
          zIndex: 2,
          color: "#f8fafc",
          textShadow: "0 1px 2px rgba(0,0,0,0.3)"
        }}>
          {title}
        </div>
        <div style={{ marginTop: "auto", fontSize: "9px", color: "#93c5fd", borderTop: "1px solid rgba(255,255,255,0.15)", paddingTop: "8px", fontWeight: "600", zIndex: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {category}
        </div>
      </div>
    );
  }

  return (
    <img 
      src={src} 
      alt={title}
      onError={() => setError(true)}
      style={{
        height: "100%",
        width: "auto",
        maxHeight: "220px",
        objectFit: "contain",
        borderRadius: "4px 8px 8px 4px",
        boxShadow: "5px 10px 20px rgba(0,0,0,0.15), inset 1px 0 0 rgba(255,255,255,0.2)",
        borderLeft: "4px solid rgba(0,0,0,0.1)"
      }} 
    />
  );
}


export default function BooksClient({ initialBooks, categories }: Props) {
  const { addItem, items } = useCart();
  const [query, setQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [addedAnimationId, setAddedAnimationId] = useState<string | null>(null);

  // Dynamic instantaneous filters
  const filteredBooks = useMemo(() => {
    return initialBooks.filter((book) => {
      const matchesQuery = 
        query === "" ||
        book.title.toLowerCase().includes(query.toLowerCase()) ||
        (book.isbn && book.isbn.includes(query)) ||
        book.category.toLowerCase().includes(query.toLowerCase());
      
      const matchesCategory = selectedCategory === null || book.category === selectedCategory;
      
      return matchesQuery && matchesCategory;
    });
  }, [initialBooks, query, selectedCategory]);

  // Helper to check how many of a particular book is already in the cart
  const getCartQuantity = (bookId: string) => {
    return items
      .filter((i) => i.id === `book-${bookId}`)
      .reduce((sum, i) => sum + i.qty, 0);
  };

  const handleAddToCart = (book: BookItem) => {
    addItem({
      id: `book-${book.id}`,
      journalName: book.title, // Map Book Title into existing order engine's journalName field
      subject: book.category, // Map Book Category into subject field
      issn: book.isbn, // Map ISBN to issn field
      image: book.imageUrl || "https://dummyimage.com/360x460/f1f5f9/94a3b8.png&text=STM+Book",
      year: "2026",
      plan: "PRINT", // Books are Physical Print by default
      unitPrice: book.salePriceInr
    });

    // Trigger a brief 1.5s success feedback state for good UX
    setAddedAnimationId(book.id);
    setTimeout(() => {
      setAddedAnimationId(null);
    }, 1500);
  };

  return (
    <main className="books-catalog-page" style={{
      minHeight: "100vh",
      background: "#f8fafc",
      fontFamily: "'Outfit', system-ui, -apple-system, sans-serif",
      color: "#0f172a",
      paddingBottom: "80px"
    }}>
      {/* Stylized Premium Hero Banner */}
      <section className="books-hero" style={{
        background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
        color: "#ffffff",
        padding: "64px 24px",
        textAlign: "center",
        position: "relative",
        overflow: "hidden"
      }}>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, opacity: 0.1, backgroundImage: "url('data:image/svg+xml,%3Csvg width=\"60\" height=\"60\" viewBox=\"0 0 60 60\" xmlns=\"http://www.w3.org/2000/svg\"%3E%3Cg fill=\"none\" fill-rule=\"evenodd\"%3E%3Cg fill=\"%23ffffff\" fill-opacity=\"0.4\"%3E%3Cpath d=\"M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')" }}></div>
        <div style={{ maxWidth: "1000px", margin: "0 auto", position: "relative", zIndex: 2 }}>
          <nav style={{ display: "flex", justifyContent: "center", gap: "8px", alignItems: "center", fontSize: "14px", color: "#94a3b8", marginBottom: "16px" }}>
            <Link href="/" style={{ textDecoration: "none", color: "#94a3b8" }}>Home</Link>
            <span>/</span>
            <span style={{ color: "#3b82f6", fontWeight: "600" }}>Books</span>
          </nav>
          <h1 style={{ fontSize: "clamp(2.5rem, 5vw, 3.5rem)", fontWeight: "800", letterSpacing: "-0.02em", marginBottom: "16px" }}>Scholarly Monographs & Reference Books</h1>
          <p style={{ color: "#94a3b8", fontSize: "1.1rem", maxWidth: "650px", margin: "0 auto 32px", lineHeight: "1.6" }}>
            Discover authoritative academic literature across Nanotechnology, Critical Care Nursing, and technical writing. Fast secure physical delivery.
          </p>

          {/* Search Engine input block */}
          <div style={{ position: "relative", maxWidth: "500px", margin: "0 auto" }}>
            <input 
              type="text"
              placeholder="Search titles, disciplines, or ISBNs..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              style={{
                width: "100%",
                padding: "16px 24px 16px 56px",
                borderRadius: "12px",
                border: "1px solid rgba(255,255,255,0.1)",
                background: "rgba(255,255,255,0.05)",
                backdropFilter: "blur(8px)",
                color: "#ffffff",
                fontSize: "16px",
                outline: "none",
                transition: "all 0.3s ease",
                boxShadow: "0 4px 6px rgba(0,0,0,0.1)"
              }}
              onFocus={(e) => {
                e.currentTarget.style.background = "rgba(255,255,255,0.1)";
                e.currentTarget.style.border = "1px solid #3b82f6";
                e.currentTarget.style.boxShadow = "0 0 0 4px rgba(59, 130, 246, 0.2)";
              }}
              onBlur={(e) => {
                e.currentTarget.style.background = "rgba(255,255,255,0.05)";
                e.currentTarget.style.border = "1px solid rgba(255,255,255,0.1)";
                e.currentTarget.style.boxShadow = "0 4px 6px rgba(0,0,0,0.1)";
              }}
            />
            <span style={{ position: "absolute", left: "22px", top: "50%", transform: "translateY(-50%)", opacity: 0.8, fontSize: "18px" }}>🔍</span>
          </div>
        </div>
      </section>

      {/* Main Layout Container */}
      <div style={{ maxWidth: "1300px", margin: "-30px auto 0", padding: "0 20px", position: "relative", zIndex: 10 }}>
        
        {/* Dynamic Category Filters Chips Row */}
        <div style={{ 
          display: "flex", 
          gap: "10px", 
          flexWrap: "wrap", 
          background: "rgba(255, 255, 255, 0.95)", 
          backdropFilter: "blur(12px)",
          border: "1px solid rgba(226, 232, 240, 0.8)",
          padding: "16px", 
          borderRadius: "16px",
          boxShadow: "0 10px 25px rgba(0,0,0,0.06), 0 4px 6px rgba(0,0,0,0.02)",
          marginBottom: "40px",
          justifyContent: "center",
          position: "sticky",
          top: "80px",
          zIndex: 45
        }}>
          <button
            onClick={() => setSelectedCategory(null)}
            style={{
              border: "none",
              padding: "10px 20px",
              borderRadius: "30px",
              fontSize: "14px",
              fontWeight: "600",
              cursor: "pointer",
              transition: "all 0.2s ease",
              background: selectedCategory === null ? "#3b82f6" : "#f1f5f9",
              color: selectedCategory === null ? "#ffffff" : "#475569"
            }}
          >
            All Books ({initialBooks.length})
          </button>
          {categories.map((cat) => {
            const count = initialBooks.filter(b => b.category === cat).length;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                style={{
                  border: "none",
                  padding: "10px 20px",
                  borderRadius: "30px",
                  fontSize: "14px",
                  fontWeight: "600",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  background: selectedCategory === cat ? "#3b82f6" : "#f1f5f9",
                  color: selectedCategory === cat ? "#ffffff" : "#475569"
                }}
              >
                {cat} ({count})
              </button>
            );
          })}
        </div>

        {/* Empty Filter States */}
        {filteredBooks.length === 0 ? (
          <div style={{ textAlign: "center", padding: "80px 20px", background: "#ffffff", borderRadius: "16px", boxShadow: "0 4px 6px rgba(0,0,0,0.02)" }}>
            <div style={{ fontSize: "48px", marginBottom: "16px" }}>📚</div>
            <h3 style={{ fontSize: "20px", color: "#1e293b", marginBottom: "8px" }}>No books found</h3>
            <p style={{ color: "#64748b", maxWidth: "400px", margin: "0 auto 24px" }}>We couldn't find any books matching your criteria. Try clearing your search query or choosing a different category.</p>
            <button 
              onClick={() => { setQuery(""); setSelectedCategory(null); }}
              style={{ background: "#0f172a", color: "#fff", border: "none", padding: "12px 24px", borderRadius: "8px", cursor: "pointer", fontWeight: "600" }}
            >
              Clear Filters
            </button>
          </div>
        ) : (
          /* Dynamic Book Jacket Card Grid System */
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: "32px"
          }}>
            {filteredBooks.map((book) => {
              const cartQty = getCartQuantity(book.id);
              const isAnimating = addedAnimationId === book.id;
              const isOnSale = book.originalPriceInr > book.salePriceInr;

              return (
                <article 
                  key={book.id} 
                  style={{
                    background: "#ffffff",
                    borderRadius: "20px",
                    border: "1px solid #e2e8f0",
                    overflow: "hidden",
                    display: "flex",
                    flexDirection: "column",
                    transition: "transform 0.3s ease, box-shadow 0.3s ease",
                    position: "relative"
                  }}
                  className="book-card-interactive"
                  onMouseOver={(e) => {
                    e.currentTarget.style.transform = "translateY(-8px)";
                    e.currentTarget.style.boxShadow = "0 20px 25px -5px rgba(0, 0, 0, 0.08), 0 10px 10px -5px rgba(0, 0, 0, 0.04)";
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.transform = "none";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                >
                  {/* Visual Container for Book Jacket */}
                  <div style={{
                    height: "280px",
                    background: "#f8fafc",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "24px",
                    position: "relative",
                    borderBottom: "1px solid #f1f5f9"
                  }}>
                    {isOnSale && (
                      <span style={{
                        position: "absolute",
                        top: "16px",
                        left: "16px",
                        background: "#ef4444",
                        color: "#ffffff",
                        fontSize: "12px",
                        fontWeight: "700",
                        padding: "4px 10px",
                        borderRadius: "30px",
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                        zIndex: 5
                      }}>
                        Sale
                      </span>
                    )}
                    <BookImage src={book.imageUrl} title={book.title} category={book.category} />
                  </div>

                  {/* Metadata details container */}
                  <div style={{ padding: "24px", flex: "1 0 auto", display: "flex", flexDirection: "column" }}>
                    <div style={{ color: "#64748b", fontSize: "13px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "8px" }}>
                      {book.category}
                    </div>
                    
                    <h3 style={{
                      fontSize: "17px",
                      fontWeight: "700",
                      lineHeight: "1.4",
                      color: "#0f172a",
                      marginBottom: "12px",
                      display: "-webkit-box",
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                      height: "72px"
                    }}>
                      {book.title}
                    </h3>

                    {book.description && (
                      <p style={{ 
                        color: "#64748b", 
                        fontSize: "14px", 
                        lineHeight: "1.5", 
                        marginBottom: "20px",
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden"
                      }}>
                        {book.description}
                      </p>
                    )}

                    <div style={{ marginTop: "auto" }}>
                      {book.isbn && (
                        <div style={{ color: "#94a3b8", fontSize: "12px", marginBottom: "16px" }}>
                          ISBN: <span style={{ fontWeight: "500" }}>{book.isbn}</span>
                        </div>
                      )}

                      {/* Pricing Display row */}
                      <div style={{ display: "flex", alignItems: "flex-end", gap: "12px", marginBottom: "20px" }}>
                        <span style={{ fontSize: "22px", fontWeight: "800", color: "#10b981" }}>
                          ₹{book.salePriceInr.toLocaleString("en-IN")}
                        </span>
                        {isOnSale && (
                          <span style={{ fontSize: "14px", color: "#94a3b8", textDecoration: "line-through", marginBottom: "3px" }}>
                            ₹{book.originalPriceInr.toLocaleString("en-IN")}
                          </span>
                        )}
                      </div>

                      {/* Interactive Add Action Trigger */}
                      <button
                        onClick={() => handleAddToCart(book)}
                        disabled={isAnimating}
                        style={{
                          width: "100%",
                          background: isAnimating ? "#10b981" : "#0f172a",
                          color: "#ffffff",
                          border: "none",
                          padding: "14px 20px",
                          borderRadius: "12px",
                          fontWeight: "700",
                          fontSize: "14px",
                          cursor: "pointer",
                          transition: "all 0.2s ease",
                          display: "flex",
                          justifyContent: "center",
                          alignItems: "center",
                          gap: "8px"
                        }}
                        onMouseOver={(e) => {
                          if (!isAnimating) {
                            e.currentTarget.style.background = "#1e293b";
                          }
                        }}
                        onMouseOut={(e) => {
                          if (!isAnimating) {
                            e.currentTarget.style.background = "#0f172a";
                          }
                        }}
                      >
                        {isAnimating ? (
                          <>
                            <span>✓</span> Added successfully!
                          </>
                        ) : (
                          <>
                            <svg style={{ width: "16px", height: "16px" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                            Add to Cart
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Visual badge when quantity present */}
                  {cartQty > 0 && (
                    <div style={{
                      position: "absolute",
                      top: "-8px",
                      right: "-8px",
                      background: "#f59e0b",
                      color: "#ffffff",
                      fontWeight: "800",
                      width: "28px",
                      height: "28px",
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      boxShadow: "0 4px 10px rgba(245, 158, 11, 0.4)",
                      fontSize: "12px",
                      border: "2px solid #ffffff",
                      zIndex: 10
                    }}>
                      {cartQty}
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
