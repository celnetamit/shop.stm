'use client';

import React from 'react';

// A highly optimized flat vector background representing multiple shelves of colorful books,
// mimicking the wood shelf design and book styling of ship-banner-2.jpg with absolutely no text.
export default function VectorBookshelfBackground() {
  const colors = [
    '#1d4ed8', '#2563eb', '#3b82f6', // Blues
    '#15803d', '#16a34a', '#22c55e', // Greens
    '#c2410c', '#ea580c', '#f97316', // Oranges
    '#a16207', '#ca8a04', '#eab308', // Yellows
    '#be185d', '#db2777', '#ec4899', // Pinks
    '#6d28d9', '#7c3aed', '#8b5cf6', // Purples
    '#b91c1c', '#dc2626', '#ef4444', // Reds
    '#0f766e', '#0d9488', '#14b8a6', // Teals
    '#374151', '#4b5563', '#6b7280'  // Grays
  ];

  const getSpinePattern = (idx: number) => {
    if (idx % 5 === 0) return 'stripes';
    if (idx % 7 === 0) return 'dots';
    if (idx % 9 === 0) return 'accent';
    return 'none';
  };

  // Pre-seed mock books data for 3 shelves so they render deterministically
  const shelfBooks = [
    // Shelf 1 (top)
    Array.from({ length: 42 }).map((_, i) => ({
      height: `${75 + (Math.sin(i * 1.7) * 18)}px`,
      width: `${15 + (Math.cos(i * 2.3) * 5)}px`,
      color: colors[(i * 7) % colors.length],
      pattern: getSpinePattern(i),
      tilt: i % 12 === 0 ? 'rotate(-5deg)' : i % 15 === 0 ? 'rotate(4deg)' : 'none',
      offset: i % 12 === 0 ? '-3px' : '0px'
    })),
    // Shelf 2 (middle)
    Array.from({ length: 45 }).map((_, i) => ({
      height: `${80 + (Math.cos(i * 1.5) * 15)}px`,
      width: `${14 + (Math.sin(i * 3.1) * 6)}px`,
      color: colors[(i * 11) % colors.length],
      pattern: getSpinePattern(i + 2),
      tilt: i % 10 === 0 ? 'rotate(5deg)' : i % 17 === 0 ? 'rotate(-4deg)' : 'none',
      offset: i % 10 === 0 ? '-4px' : '0px'
    })),
    // Shelf 3 (bottom)
    Array.from({ length: 40 }).map((_, i) => ({
      height: `${72 + (Math.sin(i * 1.2) * 16)}px`,
      width: `${16 + (Math.cos(i * 2.7) * 4)}px`,
      color: colors[(i * 13) % colors.length],
      pattern: getSpinePattern(i + 4),
      tilt: i % 8 === 0 ? 'rotate(-6deg)' : i % 14 === 0 ? 'rotate(3deg)' : 'none',
      offset: i % 8 === 0 ? '-3px' : '0px'
    }))
  ];

  return (
    <div className="vector-bookshelf-bg" style={{
      position: "absolute",
      top: 0,
      left: 0,
      width: "100%",
      height: "100%",
      zIndex: 1,
      background: "#120e0c", // Rich deep chocolate wooden backdrop from ship-banner-2.jpg style
      overflow: "hidden",
      opacity: 0.28, // Dark dampened overlay effect to ensure perfect contrast
      display: "flex",
      flexDirection: "column",
      justifyContent: "space-between",
      padding: "20px 0 100px",
      pointerEvents: "none"
    }}>
      {/* Dynamic vector shelf structures */}
      <style dangerouslySetInnerHTML={{ __html: `
        .vector-shelf {
          display: flex;
          align-items: flex-end;
          justify-content: space-around;
          width: 108%;
          margin-left: -4%;
          position: relative;
          padding-bottom: 6px;
        }

        .vector-wood-beam {
          width: 100%;
          height: 8px;
          background: linear-gradient(180deg, #3d1a08 0%, #1c0b03 100%);
          box-shadow: 0 3px 5px rgba(0,0,0,0.6);
          position: absolute;
          bottom: 0;
          left: 0;
        }

        .vector-book {
          position: relative;
          border-radius: 1px;
          border-left: 1px solid rgba(255,255,255,0.05);
          border-right: 1px solid rgba(0,0,0,0.25);
          box-shadow: 1px 2px 4px rgba(0,0,0,0.45);
          transform-origin: bottom center;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          padding: 4px 0;
        }

        .vector-book-pattern-stripes {
          width: 100%;
          height: 1.5px;
          background: rgba(255,255,255,0.12);
          margin-top: 3px;
          box-shadow: 0 3px 0 rgba(255,255,255,0.12), 0 6px 0 rgba(255,255,255,0.12);
        }

        .vector-book-pattern-dots {
          width: 2px;
          height: 2px;
          border-radius: 50%;
          background: rgba(255,255,255,0.2);
          margin: 4px auto 0;
          box-shadow: 0 4px 0 rgba(255,255,255,0.2), 0 8px 0 rgba(255,255,255,0.2);
        }

        .vector-book-pattern-accent {
          width: 70%;
          height: 10px;
          background: rgba(255,255,255,0.1);
          border-radius: 1px;
          margin: 3px auto 0;
        }
      ` }} />

      {shelfBooks.map((shelf, shelfIdx) => (
        <div key={shelfIdx} className="vector-shelf">
          {shelf.map((book, bookIdx) => (
            <div
              key={bookIdx}
              className="vector-book"
              style={{
                height: book.height,
                width: book.width,
                background: book.color,
                transform: book.tilt,
                marginBottom: book.offset
              }}
            >
              <div style={{ width: '80%', height: '1px', background: 'rgba(255,255,255,0.15)', margin: '0 auto' }} />
              
              {book.pattern === 'stripes' && <div className="vector-book-pattern-stripes" />}
              {book.pattern === 'dots' && <div className="vector-book-pattern-dots" />}
              {book.pattern === 'accent' && <div className="vector-book-pattern-accent" />}
              
              <div style={{ width: '80%', height: '1px', background: 'rgba(0,0,0,0.2)', margin: '0 auto' }} />
            </div>
          ))}
          <div className="vector-wood-beam" />
        </div>
      ))}
    </div>
  );
}
