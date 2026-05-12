"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useCart } from "@/app/components/cart-store";

declare global {
  interface Window {
    Razorpay: any;
  }
}

export default function CheckoutClient() {
  const params = useSearchParams();
  const { items, couponCode, discountPercent, clear } = useCart();

  const queryTotal = Number(params.get("total") || 0);
  
  // Form States
  const [name, setName] = useState(params.get("name") || "");
  const [email, setEmail] = useState(params.get("email") || "");
  const [organization, setOrganization] = useState(params.get("organization") || "");
  const [address, setAddress] = useState(params.get("address") || "");
  const [state, setState] = useState(params.get("state") || "");
  const [pincode, setPincode] = useState(params.get("pincode") || "");
  const [gst, setGst] = useState(params.get("gst") || "");
  const queryQuoteId = params.get("quoteId") || "";

  const [placingOrder, setPlacingOrder] = useState(false);
  const [orderMessage, setOrderMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  const [quoteData, setQuoteData] = useState<any>(null);
  const [isLoadingQuote, setIsLoadingQuote] = useState(!!queryQuoteId);

  // 1. Fetch Locked Quote if present in system to secure pricing & pre-fill.
  useEffect(() => {
    if (!queryQuoteId) return;
    
    async function fetchQuote() {
      try {
        const res = await fetch(`/api/proforma/${queryQuoteId}`);
        const json = await res.json();
        if (json.ok && json.quote) {
          setQuoteData(json.quote);
          // Auto-hydrate form so users don't have to retype everything.
          if (json.quote.contactName) setName(json.quote.contactName);
          if (json.quote.email) setEmail(json.quote.email);
          if (json.quote.organization) setOrganization(json.quote.organization);
          if (json.quote.address) setAddress(json.quote.address);
          if (json.quote.gstNumber) setGst(json.quote.gstNumber);
        }
      } catch (err) {
        console.error("Fatal proforma hydration failure:", err);
      } finally {
        setIsLoadingQuote(false);
      }
    }
    
    fetchQuote();
  }, [queryQuoteId]);

  // 2. Inject Razorpay Secure Protocol Layer
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const cartSubtotal = useMemo(() => items.reduce((s, i) => s + i.unitPrice * i.qty, 0), [items]);
  
  // Secure Pricing Hierarchy:
  const subtotal = quoteData ? quoteData.subtotal : (queryTotal > 0 ? queryTotal : cartSubtotal);
  const discount = quoteData ? quoteData.discount : (queryTotal > 0 ? 0 : Math.round((subtotal * discountPercent) / 100));
  
  const taxable = subtotal - discount;
  const cgst = Math.round(taxable * 0.09 * 10) / 10;
  const sgst = Math.round(taxable * 0.09 * 10) / 10;
  const total = Math.round((taxable + cgst + sgst) * 10) / 10;

  const money = (n: number) => `₹${n.toLocaleString("en-IN")}`;

  async function handlePaymentInitiation() {
    setOrderMessage("");
    if (!name || !email || !address || !state || !pincode) {
      setOrderMessage("⚠️ Please complete all required billing details.");
      return;
    }
    
    setPlacingOrder(true);

    try {
      // Step 1: Create Razorpay Order Intent on Server
      const orderIntRes = await fetch("/api/checkout/razorpay-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: total, currency: "INR" })
      });

      const orderIntData = await orderIntRes.json();
      
      if (!orderIntData.ok) {
        throw new Error(orderIntData.error || "Failed to register payment intent.");
      }

      // Step 2: Initialize Razorpay Secure Overlay
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: orderIntData.amount,
        currency: orderIntData.currency,
        name: "STM Journals",
        description: queryQuoteId ? `Proforma Quote Ref #${queryQuoteId}` : "Subscription Order",
        image: "/stmlogo.png",
        order_id: orderIntData.id,
        handler: async function (response: any) {
          // Step 3: Finalize Verification & Creation after frontend success
          await finalizeOrderCreation(response);
        },
        prefill: {
          name: name,
          email: email
        },
        theme: {
          color: "#0f2a57"
        },
        modal: {
          ondismiss: function() {
            setPlacingOrder(false);
          }
        }
      };

      const rzp1 = new window.Razorpay(options);
      rzp1.on("payment.failed", function (response: any) {
        setOrderMessage(`❌ Payment Failed: ${response.error.description || "Generic issue."}`);
        setPlacingOrder(false);
      });
      rzp1.open();

    } catch (err: any) {
      setOrderMessage(err.message || "Order creation sequence failed.");
      setPlacingOrder(false);
    }
  }

  async function finalizeOrderCreation(rzpResponse: any) {
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          customerName: name,
          email: email,
          organization: organization || null,
          address: address,
          state: state,
          pincode: pincode,
          gstNumber: gst || null,
          quoteId: queryQuoteId || null,
          currency: "INR",
          subtotal,
          discount,
          cgst,
          sgst,
          total,
          couponCode: couponCode || null,
          razorpayOrderId: rzpResponse.razorpay_order_id,
          razorpayPaymentId: rzpResponse.razorpay_payment_id,
          razorpaySignature: rzpResponse.razorpay_signature,
          items: items.map((it) => ({
            journalName: it.journalName,
            subject: it.subject,
            issn: it.issn,
            image: it.image,
            year: it.year,
            issue: it.issue || null,
            plan: it.plan,
            unitPrice: it.unitPrice,
            qty: it.qty
          }))
        })
      });

      const json = await res.json();
      if (!json.ok) {
        throw new Error(json.error || "Verification failed at registry server.");
      }

      setIsSuccess(true);
      clear();
      setOrderMessage(`🎉 Success! Order #${json.order?.id} has been paid & processed.`);
    } catch (err: any) {
      setOrderMessage(`⚠️ Warning: Payment received, but system error occurred during database logging: ${err.message}. Contact support with Ref: ${rzpResponse.razorpay_payment_id}`);
    } finally {
      setPlacingOrder(false);
    }
  }

  if (isLoadingQuote) {
    return (
      <main className="checkout-page">
        <div style={{ maxWidth: "600px", margin: "100px auto", textAlign: "center", color: "#475569" }}>
          <div className="loading-spinner" style={{ margin: "0 auto 20px", width: "40px", height: "40px", border: "4px solid #e2e8f0", borderTopColor: "#2563eb", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
          <p style={{fontWeight:"bold"}}>Securing invoice records...</p>
          <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
        </div>
      </main>
    );
  }

  if (isSuccess) {
    return (
      <main className="checkout-page">
        <div style={{ maxWidth: "600px", margin: "60px auto", textAlign: "center", background: "#fff", padding: "40px", borderRadius: "12px", boxShadow: "0 4px 20px rgba(0,0,0,0.05)" }}>
          <div style={{ fontSize: "60px", marginBottom: "15px" }}>✅</div>
          <h1 style={{ color: "#16a34a" }}>Order Confirmed!</h1>
          <p style={{ margin: "15px 0", fontSize: "16px", color: "#475569" }}>{orderMessage}</p>
          <p style={{ color: "#64748b", fontSize: "14px" }}>A confirmation receipt with access instructions has been dispatched to your inbox ({email}).</p>
          <Link href="/" style={{ display: "inline-block", marginTop: "30px", padding: "12px 24px", background: "#0f2a57", color: "#fff", textDecoration: "none", borderRadius: "6px", fontWeight: "bold" }}>Return Home</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="checkout-page">
      <Link href="/cart" className="checkout-back">← Back to Cart</Link>
      <div className="checkout-grid">
        <section className="checkout-card">
          <h1>Billing Details</h1>
          <p style={{ marginBottom: "20px", color: "#64748b", fontSize: "14px" }}>Confirm or update your final distribution specifics below.</p>
          <div className="checkout-fields">
            <div><label>FULL NAME *</label><input value={name} onChange={(e) => setName(e.target.value)} placeholder="E.g. Dr. Rajesh Singh" /></div>
            <div><label>EMAIL ADDRESS *</label><input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="user@institution.com" /></div>
            <div className="checkout-full"><label>ORGANIZATION / INSTITUTION NAME</label><input value={organization} onChange={(e) => setOrganization(e.target.value)} placeholder="Optional" /></div>
            <div className="checkout-full"><label>BILLING ADDRESS *</label><textarea value={address} onChange={(e) => setAddress(e.target.value)} rows={3} placeholder="Street address, building..." /></div>
            <div><label>STATE *</label><input value={state} onChange={(e) => setState(e.target.value)} /></div>
            <div><label>PINCODE *</label><input value={pincode} onChange={(e) => setPincode(e.target.value)} /></div>
            <div><label>GST NUMBER (OPTIONAL)</label><input value={gst} onChange={(e) => setGst(e.target.value)} /></div>
          </div>
          <div className="checkout-note">Payments secured & processed globally by Razorpay. SSL Encrypted.</div>
        </section>

        <aside className="checkout-summary">
          <h2>Order Summary</h2>
          <div className="summary-ledger">
            <p><span>Subtotal</span><strong>{money(subtotal)}</strong></p>
            {discount > 0 && <p><span>Discount {couponCode ? `(${couponCode})` : ""}</span><strong style={{ color: "#ef4444" }}>-{money(discount)}</strong></p>}
            <p><span>CGST (9%)</span><strong>{money(cgst)}</strong></p>
            <p><span>SGST (9%)</span><strong>{money(sgst)}</strong></p>
            <div style={{ margin: "15px 0", borderTop: "1px dashed #cbd5e1" }}></div>
            <p className="checkout-total"><span>Grand Total</span><strong>{money(total)}</strong></p>
          </div>

          <button 
            type="button" 
            className="razorpay-button"
            onClick={handlePaymentInitiation} 
            disabled={placingOrder}
            style={{
              width: "100%",
              padding: "16px",
              background: placingOrder ? "#94a3b8" : "#2563eb",
              color: "#fff",
              border: "none",
              borderRadius: "8px",
              fontSize: "16px",
              fontWeight: "bold",
              cursor: "pointer",
              transition: "all 0.2s",
              marginTop: "15px"
            }}
          >
            {placingOrder ? "Processing securely..." : `🔒 Secure Pay ${money(total)}`}
          </button>
          
          {orderMessage ? <div style={{ marginTop: "15px", padding: "12px", borderRadius: "6px", background: "#fef2f2", color: "#b91c1c", fontSize: "14px", border: "1px solid #fee2e2" }}>{orderMessage}</div> : null}
        </aside>
      </div>
    </main>
  );
}
