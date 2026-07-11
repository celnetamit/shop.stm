type Props = {
  brandTitle: string;
  signatoryLabel?: string;
  signatureSrc?: string;
  stampSrc?: string;
};

export default function SignatureBlock({
  brandTitle,
  signatoryLabel = "AUTHORISED SIGNATORY",
  signatureSrc = "/authorized-signature.png",
  stampSrc = "/invoice-stamp.png"
}: Props) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end", textAlign: "center" }}>
      <strong style={{ color: "#0f172a", fontSize: "11px", marginBottom: "8px" }}>For, {brandTitle.toUpperCase()}</strong>
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "center", gap: "10px", marginBottom: "6px" }}>
        <img
          src={stampSrc}
          alt="Invoice Stamp"
          style={{ width: "92px", height: "auto", objectFit: "contain" }}
        />
        <img
          src={signatureSrc}
          alt="Authorised Signature"
          style={{ width: "130px", height: "auto", objectFit: "contain" }}
        />
      </div>
      <div style={{ width: "220px", borderBottom: "1px solid #64748b" }}></div>
      <span style={{ fontSize: "9px", fontWeight: "800", textTransform: "uppercase", marginTop: "5px", letterSpacing: "0.05em", color: "#334155" }}>
        {signatoryLabel}
      </span>
    </div>
  );
}
