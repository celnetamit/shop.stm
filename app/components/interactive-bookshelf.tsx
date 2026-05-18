'use client';

import React from 'react';

const booksData = [
  {
    title: "COMPUTER & IT",
    category: "Computer/IT",
    color: "linear-gradient(180deg, #1e3a8a 0%, #3b82f6 100%)",
    accentColor: "#60a5fa",
    tilt: "-1.5deg",
    height: "230px",
    width: "48px",
    pattern: "dots"
  },
  {
    title: "MEDICAL SCIENCES",
    category: "Medical Sciences",
    color: "linear-gradient(180deg, #0f766e 0%, #14b8a6 100%)",
    accentColor: "#2dd4bf",
    tilt: "0.5deg",
    height: "245px",
    width: "52px",
    pattern: "stripes"
  },
  {
    title: "PHARMACY",
    category: "Pharmacy",
    color: "linear-gradient(180deg, #6d28d9 0%, #a78bfa 100%)",
    accentColor: "#c084fc",
    tilt: "-2deg",
    height: "220px",
    width: "46px",
    pattern: "stars"
  },
  {
    title: "BIOTECHNOLOGY",
    category: "Bio Technology",
    color: "linear-gradient(180deg, #15803d 0%, #22c55e 100%)",
    accentColor: "#4ade80",
    tilt: "1deg",
    height: "250px",
    width: "54px",
    pattern: "rings"
  },
  {
    title: "CIVIL & STRUCTURAL",
    category: "Civil/Construction Engineering",
    color: "linear-gradient(180deg, #b45309 0%, #f59e0b 100%)",
    accentColor: "#fbbf24",
    tilt: "-0.8deg",
    height: "235px",
    width: "50px",
    pattern: "waves"
  },
  {
    title: "MECHANICAL ENG.",
    category: "Mechanical Engineering",
    color: "linear-gradient(180deg, #374151 0%, #6b7280 100%)",
    accentColor: "#9ca3af",
    tilt: "1.8deg",
    height: "240px",
    width: "49px",
    pattern: "stripes"
  },
  {
    title: "CHEMICAL SCIENCES",
    category: "Chemical Sciences",
    color: "linear-gradient(180deg, #be185d 0%, #ec4899 100%)",
    accentColor: "#f472b6",
    tilt: "-1.2deg",
    height: "225px",
    width: "45px",
    pattern: "dots"
  },
  {
    title: "LIFE SCIENCES",
    category: "Life Sciences",
    color: "linear-gradient(180deg, #047857 0%, #10b981 100%)",
    accentColor: "#34d399",
    tilt: "0.2deg",
    height: "248px",
    width: "51px",
    pattern: "rings"
  },
  {
    title: "AGRICULTURAL SCI.",
    category: "Agricultural Sciences",
    color: "linear-gradient(180deg, #78350f 0%, #d97706 100%)",
    accentColor: "#fbbf24",
    tilt: "-2.5deg",
    height: "215px",
    width: "47px",
    pattern: "stripes"
  },
  {
    title: "SOCIAL SCIENCES",
    category: "Social Sciences",
    color: "linear-gradient(180deg, #1e293b 0%, #475569 100%)",
    accentColor: "#94a3b8",
    tilt: "1.5deg",
    height: "230px",
    width: "48px",
    pattern: "dots"
  }
];

export default function InteractiveBookshelf() {
  return (
    <div className="bookshelf-wrapper" style={{
      width: "100%",
      maxWidth: "960px",
      margin: "40px auto 0",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      position: "relative",
      zIndex: "5"
    }}>
      {/* Books row */}
      <div className="bookshelf-row" style={{
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
        gap: "10px",
        width: "100%",
        padding: "0 20px",
        overflowX: "auto",
        scrollbarWidth: "none", // For Firefox
        msOverflowStyle: "none", // For IE
        WebkitOverflowScrolling: "touch"
      }}>
        {/* CSS styles to enable beautiful interactive transitions */}
        <style dangerouslySetInnerHTML={{ __html: `
          .bookshelf-row::-webkit-scrollbar {
            display: none;
          }
          
          .book-spine-item {
            position: relative;
            cursor: pointer;
            transition: all 0.4s cubic-bezier(0.25, 0.8, 0.25, 1);
            transform-origin: bottom center;
            box-shadow: 4px 6px 12px rgba(0,0,0,0.35), inset -2px 0 5px rgba(0,0,0,0.2), inset 2px 0 5px rgba(255,255,255,0.15);
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            align-items: center;
            padding: 18px 4px;
            color: #ffffff;
            text-decoration: none !important;
          }

          .book-spine-item:hover {
            transform: translateY(-25px) rotate(0deg) scale(1.06);
            box-shadow: 0 18px 30px rgba(0,0,0,0.5), 
                        inset -2px 0 5px rgba(0,0,0,0.15), 
                        inset 2px 0 8px rgba(255,255,255,0.35);
            z-index: 10;
          }
          
          .book-spine-item::after {
            content: '';
            position: absolute;
            top: 0;
            left: 25%;
            width: 50%;
            height: 100%;
            background: linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.1) 20%, rgba(255,255,255,0.15) 50%, rgba(255,255,255,0.08) 80%, rgba(255,255,255,0) 100%);
            pointer-events: none;
          }

          .book-text {
            writing-mode: vertical-rl;
            text-orientation: mixed;
            transform: rotate(180deg);
            font-family: 'Plus Jakarta Sans', sans-serif;
            font-weight: 800;
            font-size: 11px;
            letter-spacing: 0.12em;
            text-align: center;
            text-shadow: 1px 1px 2px rgba(0,0,0,0.8);
            white-space: nowrap;
          }
          
          .book-band-top, .book-band-bottom {
            width: 80%;
            height: 4px;
            background: linear-gradient(90deg, #b45309 0%, #fbbf24 50%, #b45309 100%);
            border-radius: 1px;
            opacity: 0.85;
            box-shadow: 0 1px 2px rgba(0,0,0,0.4);
          }
          
          /* Visual patterns inside book spines */
          .book-pattern-dots {
            width: 6px;
            height: 25px;
            border-radius: 50%;
            background: currentColor;
            opacity: 0.35;
            margin: 8px 0;
            box-shadow: 0 8px 0 currentColor, 0 16px 0 currentColor;
          }
          
          .book-pattern-rings {
            width: 12px;
            height: 12px;
            border: 2px solid currentColor;
            border-radius: 50%;
            opacity: 0.4;
            margin: 8px 0;
            box-shadow: 0 8px 0 currentColor;
          }
          
          .book-pattern-stripes {
            width: 14px;
            height: 1.5px;
            background: currentColor;
            opacity: 0.45;
            margin: 8px 0;
            box-shadow: 0 4px 0 currentColor, 0 8px 0 currentColor, 0 12px 0 currentColor;
          }

          .bookshelf-wood-bar {
            width: 100%;
            height: 12px;
            background: linear-gradient(180deg, #78350f 0%, #451a03 100%);
            border-radius: 4px;
            box-shadow: 0 4px 10px rgba(0,0,0,0.5), inset 0 1px 2px rgba(255,255,255,0.25);
            position: relative;
            z-index: 6;
          }
          
          .bookshelf-wood-bar::after {
            content: '';
            position: absolute;
            top: 100%;
            left: 5%;
            width: 90%;
            height: 8px;
            background: rgba(0,0,0,0.45);
            filter: blur(4px);
            border-radius: 50%;
          }
        ` }} />

        {booksData.map((book, idx) => (
          <a
            key={idx}
            href={`/product-category/journals/${encodeURIComponent(book.category)}`}
            className="book-spine-item"
            style={{
              background: book.color,
              height: book.height,
              width: book.width,
              minWidth: book.width,
              transform: `rotate(${book.tilt})`,
              borderLeft: `1px solid rgba(255,255,255,0.12)`,
              borderRight: `1px solid rgba(0,0,0,0.25)`
            }}
          >
            {/* Top gold spine band */}
            <div className="book-band-top" />
            
            {/* Subject visual patterns */}
            {book.pattern === "dots" && <div className="book-pattern-dots" style={{ color: book.accentColor }} />}
            {book.pattern === "rings" && <div className="book-pattern-rings" style={{ color: book.accentColor }} />}
            {book.pattern === "stripes" && <div className="book-pattern-stripes" style={{ color: book.accentColor }} />}
            {book.pattern === "stars" && (
              <div style={{ color: book.accentColor, fontSize: '10px', opacity: 0.5, margin: '8px 0' }}>★</div>
            )}
            
            {/* Spine vertical Text */}
            <span className="book-text">{book.title}</span>

            {/* Bottom visual pattern */}
            {book.pattern === "waves" && (
              <div style={{ color: book.accentColor, fontSize: '8px', opacity: 0.5, margin: '8px 0', letterSpacing: '2px' }}>≋</div>
            )}
            
            {/* Bottom gold spine band */}
            <div className="book-band-bottom" />
          </a>
        ))}
      </div>

      {/* Wooden bookshelf bar */}
      <div className="bookshelf-wood-bar" />
    </div>
  );
}
