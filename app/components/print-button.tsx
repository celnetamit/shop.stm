"use client";

export default function PrintButton() {
  return (
    <button 
      onClick={() => typeof window !== "undefined" && window.print()} 
      style={{ padding: "10px 20px", background: "#0F172A", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "bold" }}
    >
      🖨️ Print / Download PDF
    </button>
  );
}
