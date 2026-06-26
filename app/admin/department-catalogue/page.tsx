"use client";

import React, { useEffect, useState, useRef } from "react";
import type { CataloguesData, CollectionItem, MasterLinks } from "@/lib/catalogues-data";

export default function AdminDepartmentCataloguePage() {
  const [data, setData] = useState<CataloguesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Edit / Add Form State
  const [editingIndex, setEditingIndex] = useState<number | null>(null); // null = adding new (if form active) or no form
  const [showForm, setShowForm] = useState(false);
  
  // Temporary Form Fields
  const [formTitle, setFormTitle] = useState("");
  const [formCount, setFormCount] = useState<number>(0);
  const [formHref, setFormHref] = useState("");
  const [formPdf, setFormPdf] = useState("");
  const [formImage, setFormImage] = useState("");
  const [formAccent, setFormAccent] = useState("#2563eb");
  
  // File upload state
  const [uploadingField, setUploadingField] = useState<string | null>(null); // e.g. 'fullCatalogPdf', 'stmPdf', 'journalsPubPdf', 'sheet', 'formPdf', 'formImage'

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load configuration from API
  async function loadData() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/catalogues");
      const json = await res.json();
      if (json.ok) {
        setData(json.data);
      } else {
        setError(json.error || "Failed to load department catalogues configuration.");
      }
    } catch (err) {
      setError("Network error loading catalogues data.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  // Save full configuration
  async function saveConfig(updatedData: CataloguesData) {
    setError("");
    setSuccess("");
    try {
      const res = await fetch("/api/admin/catalogues", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedData),
      });
      const json = await res.json();
      if (json.ok) {
        setSuccess("Configuration saved successfully!");
        setData(updatedData);
        // Clear message after 3s
        setTimeout(() => setSuccess(""), 3000);
      } else {
        setError(json.error || "Failed to save configuration.");
      }
    } catch (err) {
      setError("Network error saving configuration.");
    }
  }

  // Handle Master Links edit
  function handleMasterLinkChange(key: keyof MasterLinks, value: string) {
    if (!data) return;
    const updated = {
      ...data,
      masterLinks: {
        ...data.masterLinks,
        [key]: value
      }
    };
    setData(updated);
  }

  // Open form for adding new
  function openAddForm() {
    setEditingIndex(null);
    setFormTitle("");
    setFormCount(0);
    setFormHref("");
    setFormPdf("");
    setFormImage("");
    setFormAccent("#2563eb");
    setShowForm(true);
  }

  // Open form for editing existing
  function openEditForm(index: number) {
    if (!data) return;
    const item = data.collections[index];
    setEditingIndex(index);
    setFormTitle(item.title);
    setFormCount(item.count);
    setFormHref(item.href || "");
    setFormPdf(item.pdf);
    setFormImage(item.image);
    setFormAccent(item.accent);
    setShowForm(true);
  }

  // Submit add/edit form
  function handleFormSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!data) return;

    if (!formTitle.trim()) {
      setError("Title is required.");
      return;
    }

    // Auto-generate href if not specified
    const generatedHref = formHref.trim() || `https://shop.stmjournals.com/product-category/journals/${encodeURIComponent(formTitle.trim())}/`;

    const newItem: CollectionItem = {
      title: formTitle.trim(),
      count: Number(formCount),
      href: generatedHref,
      pdf: formPdf.trim(),
      image: formImage.trim() || "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&w=900&q=80",
      accent: formAccent
    };

    let updatedCollections = [...data.collections];
    if (editingIndex === null) {
      // Add new
      updatedCollections.push(newItem);
    } else {
      // Update existing
      updatedCollections[editingIndex] = newItem;
    }

    const updatedData = {
      ...data,
      collections: updatedCollections
    };

    setShowForm(false);
    setEditingIndex(null);
    saveConfig(updatedData);
  }

  // Delete a collection
  function handleDelete(index: number) {
    if (!data) return;
    if (!confirm(`Are you sure you want to delete "${data.collections[index].title}"?`)) return;

    const updatedCollections = data.collections.filter((_, i) => i !== index);
    const updatedData = {
      ...data,
      collections: updatedCollections
    };

    saveConfig(updatedData);
  }

  // Handle generic file upload
  async function triggerUpload(field: string) {
    setUploadingField(field);
    // Open file selector
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
      fileInputRef.current.click();
    }
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !uploadingField || !data) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/admin/catalogues/upload", {
        method: "POST",
        body: formData
      });
      const json = await res.json();
      if (json.ok) {
        const url = json.url;
        // Assign to corresponding field
        if (uploadingField === "fullCatalogPdf") handleMasterLinkChange("fullCatalogPdf", url);
        else if (uploadingField === "stmPdf") handleMasterLinkChange("stmPdf", url);
        else if (uploadingField === "journalsPubPdf") handleMasterLinkChange("journalsPubPdf", url);
        else if (uploadingField === "sheet") handleMasterLinkChange("sheet", url);
        else if (uploadingField === "formPdf") setFormPdf(url);
        else if (uploadingField === "formImage") setFormImage(url);
      } else {
        alert(json.error || "File upload failed.");
      }
    } catch (err) {
      alert("Error during file upload.");
    } finally {
      setUploadingField(null);
    }
  }

  if (loading) {
    return (
      <div style={{ padding: "40px", color: "#64748b", fontFamily: "Inter, sans-serif" }}>
        Loading department catalogues configuration...
      </div>
    );
  }

  return (
    <main style={{ padding: "24px", fontFamily: "Inter, sans-serif", color: "#1e293b", maxWidth: "1200px" }}>
      {/* Hidden file input */}
      <input 
        type="file" 
        ref={fileInputRef} 
        style={{ display: "none" }} 
        onChange={handleFileChange}
      />

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <div>
          <h1 style={{ fontSize: "28px", fontWeight: "800", color: "#0f172a", margin: 0 }}>Department Catalogues</h1>
          <p style={{ fontSize: "14px", color: "#64748b", marginTop: "4px" }}>
            Manage the department-wise PDF catalogues and the master catalogues displayed on the public Catalogues page.
          </p>
        </div>
        <button 
          onClick={loadData}
          style={{
            background: "none",
            border: "1px solid #cbd5e1",
            padding: "8px 12px",
            borderRadius: "6px",
            fontSize: "13px",
            fontWeight: "600",
            cursor: "pointer",
            color: "#475569"
          }}
        >
          Refresh Data
        </button>
      </div>

      {error && (
        <div style={{ background: "#fef2f2", border: "1px solid #fecaca", padding: "12px", borderRadius: "8px", color: "#991b1b", fontSize: "14px", marginBottom: "18px" }}>
          {error}
        </div>
      )}

      {success && (
        <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", padding: "12px", borderRadius: "8px", color: "#166534", fontSize: "14px", marginBottom: "18px" }}>
          {success}
        </div>
      )}

      {data && (
        <>
          {/* Master Links Section */}
          <section style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "10px", padding: "20px", marginBottom: "24px" }}>
            <h2 style={{ fontSize: "18px", fontWeight: "700", color: "#0f172a", marginTop: 0, marginBottom: "16px", borderBottom: "1px solid #f1f5f9", paddingBottom: "10px" }}>
              Global Master Files
            </h2>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#475569", marginBottom: "6px" }}>
                  Complete STM Master Catalogue PDF
                </label>
                <div style={{ display: "flex", gap: "8px" }}>
                  <input 
                    type="text" 
                    value={data.masterLinks.fullCatalogPdf}
                    onChange={(e) => handleMasterLinkChange("fullCatalogPdf", e.target.value)}
                    style={{ flex: 1, padding: "8px 10px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "13px" }}
                  />
                  <button 
                    onClick={() => triggerUpload("fullCatalogPdf")}
                    disabled={uploadingField !== null}
                    style={{ background: "#2563eb", color: "#fff", border: "none", padding: "8px 14px", borderRadius: "6px", fontSize: "13px", fontWeight: "600", cursor: "pointer" }}
                  >
                    {uploadingField === "fullCatalogPdf" ? "..." : "Upload"}
                  </button>
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#475569", marginBottom: "6px" }}>
                  STM Price List PDF
                </label>
                <div style={{ display: "flex", gap: "8px" }}>
                  <input 
                    type="text" 
                    value={data.masterLinks.stmPdf}
                    onChange={(e) => handleMasterLinkChange("stmPdf", e.target.value)}
                    style={{ flex: 1, padding: "8px 10px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "13px" }}
                  />
                  <button 
                    onClick={() => triggerUpload("stmPdf")}
                    disabled={uploadingField !== null}
                    style={{ background: "#2563eb", color: "#fff", border: "none", padding: "8px 14px", borderRadius: "6px", fontSize: "13px", fontWeight: "600", cursor: "pointer" }}
                  >
                    {uploadingField === "stmPdf" ? "..." : "Upload"}
                  </button>
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#475569", marginBottom: "6px" }}>
                  JournalsPub Price List PDF
                </label>
                <div style={{ display: "flex", gap: "8px" }}>
                  <input 
                    type="text" 
                    value={data.masterLinks.journalsPubPdf}
                    onChange={(e) => handleMasterLinkChange("journalsPubPdf", e.target.value)}
                    style={{ flex: 1, padding: "8px 10px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "13px" }}
                  />
                  <button 
                    onClick={() => triggerUpload("journalsPubPdf")}
                    disabled={uploadingField !== null}
                    style={{ background: "#2563eb", color: "#fff", border: "none", padding: "8px 14px", borderRadius: "6px", fontSize: "13px", fontWeight: "600", cursor: "pointer" }}
                  >
                    {uploadingField === "journalsPubPdf" ? "..." : "Upload"}
                  </button>
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#475569", marginBottom: "6px" }}>
                  Excel Price List Sheet (.xlsx)
                </label>
                <div style={{ display: "flex", gap: "8px" }}>
                  <input 
                    type="text" 
                    value={data.masterLinks.sheet}
                    onChange={(e) => handleMasterLinkChange("sheet", e.target.value)}
                    style={{ flex: 1, padding: "8px 10px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "13px" }}
                  />
                  <button 
                    onClick={() => triggerUpload("sheet")}
                    disabled={uploadingField !== null}
                    style={{ background: "#2563eb", color: "#fff", border: "none", padding: "8px 14px", borderRadius: "6px", fontSize: "13px", fontWeight: "600", cursor: "pointer" }}
                  >
                    {uploadingField === "sheet" ? "..." : "Upload"}
                  </button>
                </div>
              </div>
            </div>
            
            <div style={{ marginTop: "16px", display: "flex", justifyContent: "flex-end" }}>
              <button 
                onClick={() => saveConfig(data)}
                style={{
                  background: "#16a34a",
                  color: "#fff",
                  border: "none",
                  padding: "10px 18px",
                  borderRadius: "6px",
                  fontSize: "14px",
                  fontWeight: "600",
                  cursor: "pointer"
                }}
              >
                Save Master Links
              </button>
            </div>
          </section>

          {/* Form Modal / Panel (Add or Edit) */}
          {showForm && (
            <div style={{
              background: "#f8fafc",
              border: "2px solid #cbd5e1",
              borderRadius: "10px",
              padding: "20px",
              marginBottom: "24px"
            }}>
              <h3 style={{ margin: "0 0 16px 0", fontSize: "16px", fontWeight: "700", color: "#0f172a" }}>
                {editingIndex === null ? "Add New Department Catalogue" : `Edit Department: ${formTitle}`}
              </h3>
              
              <form onSubmit={handleFormSubmit}>
                <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: "16px", marginBottom: "16px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "#475569", marginBottom: "4px" }}>
                      Department Title *
                    </label>
                    <input 
                      type="text" 
                      value={formTitle}
                      onChange={(e) => setFormTitle(e.target.value)}
                      placeholder="e.g. Mechanical Engineering"
                      required
                      style={{ width: "100%", padding: "8px 10px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "13px" }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "#475569", marginBottom: "4px" }}>
                      Journal Count
                    </label>
                    <input 
                      type="number" 
                      min="0"
                      value={formCount}
                      onChange={(e) => setFormCount(Number(e.target.value))}
                      style={{ width: "100%", padding: "8px 10px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "13px" }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "#475569", marginBottom: "4px" }}>
                      Accent Color
                    </label>
                    <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                      <input 
                        type="color" 
                        value={formAccent}
                        onChange={(e) => setFormAccent(e.target.value)}
                        style={{ width: "40px", height: "34px", padding: 0, border: "1px solid #cbd5e1", borderRadius: "6px", cursor: "pointer" }}
                      />
                      <span style={{ fontSize: "12px", color: "#64748b" }}>{formAccent}</span>
                    </div>
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "#475569", marginBottom: "4px" }}>
                      Catalogue PDF Link
                    </label>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <input 
                        type="text" 
                        value={formPdf}
                        onChange={(e) => setFormPdf(e.target.value)}
                        placeholder="https://... or upload PDF file"
                        style={{ flex: 1, padding: "8px 10px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "13px" }}
                      />
                      <button 
                        type="button"
                        onClick={() => triggerUpload("formPdf")}
                        disabled={uploadingField !== null}
                        style={{ background: "#2563eb", color: "#fff", border: "none", padding: "8px 14px", borderRadius: "6px", fontSize: "13px", fontWeight: "600", cursor: "pointer" }}
                      >
                        {uploadingField === "formPdf" ? "..." : "Upload PDF"}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "#475569", marginBottom: "4px" }}>
                      Banner/Card Image Link
                    </label>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <input 
                        type="text" 
                        value={formImage}
                        onChange={(e) => setFormImage(e.target.value)}
                        placeholder="https://... or upload Banner Image"
                        style={{ flex: 1, padding: "8px 10px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "13px" }}
                      />
                      <button 
                        type="button"
                        onClick={() => triggerUpload("formImage")}
                        disabled={uploadingField !== null}
                        style={{ background: "#2563eb", color: "#fff", border: "none", padding: "8px 14px", borderRadius: "6px", fontSize: "13px", fontWeight: "600", cursor: "pointer" }}
                      >
                        {uploadingField === "formImage" ? "..." : "Upload Image"}
                      </button>
                    </div>
                  </div>
                </div>

                <div style={{ marginBottom: "16px" }}>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "#475569", marginBottom: "4px" }}>
                    Redirect Link/URL (Optional - defaults to public product category view)
                  </label>
                  <input 
                    type="text" 
                    value={formHref}
                    onChange={(e) => setFormHref(e.target.value)}
                    placeholder="https://shop.stmjournals.com/product-category/journals/..."
                    style={{ width: "100%", padding: "8px 10px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "13px" }}
                  />
                </div>

                <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
                  <button 
                    type="button" 
                    onClick={() => { setShowForm(false); setEditingIndex(null); }}
                    style={{
                      background: "none",
                      border: "1px solid #cbd5e1",
                      padding: "8px 16px",
                      borderRadius: "6px",
                      fontSize: "13px",
                      fontWeight: "600",
                      cursor: "pointer",
                      color: "#475569"
                    }}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    style={{
                      background: "#2563eb",
                      color: "#fff",
                      border: "none",
                      padding: "8px 16px",
                      borderRadius: "6px",
                      fontSize: "13px",
                      fontWeight: "600",
                      cursor: "pointer"
                    }}
                  >
                    {editingIndex === null ? "Add Department" : "Save Changes"}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Catalogues Table Section */}
          <section style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "10px", padding: "20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h2 style={{ fontSize: "18px", fontWeight: "700", color: "#0f172a", margin: 0 }}>
                Department Catalogues List ({data.collections.length})
              </h2>
              {!showForm && (
                <button 
                  onClick={openAddForm}
                  style={{
                    background: "#2563eb",
                    color: "#fff",
                    border: "none",
                    padding: "8px 14px",
                    borderRadius: "6px",
                    fontSize: "13px",
                    fontWeight: "600",
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px"
                  }}
                >
                  <svg fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" style={{ width: "16px", height: "16px" }}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                  Add Department Catalogue
                </button>
              )}
            </div>

            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                <thead>
                  <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                    <th style={{ textAlign: "left", padding: "12px", color: "#475569", fontWeight: "600" }}>Domain / Title</th>
                    <th style={{ textAlign: "center", padding: "12px", color: "#475569", fontWeight: "600", width: "100px" }}>Journals</th>
                    <th style={{ textAlign: "left", padding: "12px", color: "#475569", fontWeight: "600" }}>Catalogue PDF Link</th>
                    <th style={{ textAlign: "center", padding: "12px", color: "#475569", fontWeight: "600", width: "120px" }}>Accent Color</th>
                    <th style={{ textAlign: "right", padding: "12px", color: "#475569", fontWeight: "600", width: "140px" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {data.collections.length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ textAlign: "center", padding: "32px", color: "#94a3b8" }}>
                        No department catalogues configured. Click "Add Department Catalogue" to start.
                      </td>
                    </tr>
                  ) : (
                    data.collections.map((item, index) => (
                      <tr key={item.title} style={{ borderBottom: "1px solid #f1f5f9" }}>
                        <td style={{ padding: "12px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            {item.image && (
                              <img 
                                src={item.image} 
                                alt={item.title} 
                                style={{ width: "40px", height: "40px", borderRadius: "6px", objectFit: "cover", border: "1px solid #e2e8f0" }}
                              />
                            )}
                            <div>
                              <strong style={{ display: "block", color: "#0f172a" }}>{item.title}</strong>
                              <a href={item.href} target="_blank" rel="noreferrer" style={{ fontSize: "11px", color: "#3b82f6", textDecoration: "none" }}>
                                View Collection Page
                              </a>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: "12px", textAlign: "center", fontWeight: "600", color: "#475569" }}>
                          {item.count}
                        </td>
                        <td style={{ padding: "12px" }}>
                          {item.pdf ? (
                            <a 
                              href={item.pdf} 
                              target="_blank" 
                              rel="noreferrer" 
                              style={{ 
                                display: "inline-flex", 
                                alignItems: "center", 
                                gap: "6px", 
                                color: "#059669", 
                                textDecoration: "none",
                                fontWeight: "600"
                              }}
                            >
                              <svg fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" style={{ width: "14px", height: "14px" }}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                              </svg>
                              Download PDF
                            </a>
                          ) : (
                            <span style={{ color: "#94a3b8", fontStyle: "italic" }}>No PDF uploaded</span>
                          )}
                        </td>
                        <td style={{ padding: "12px", textAlign: "center" }}>
                          <div style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                            <div style={{ width: "14px", height: "14px", borderRadius: "50%", background: item.accent || "#2563eb", border: "1px solid #cbd5e1" }} />
                            <code style={{ fontSize: "11px", color: "#64748b" }}>{item.accent}</code>
                          </div>
                        </td>
                        <td style={{ padding: "12px", textAlign: "right" }}>
                          <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
                            <button 
                              onClick={() => openEditForm(index)}
                              style={{
                                background: "none",
                                border: "1px solid #cbd5e1",
                                padding: "5px 10px",
                                borderRadius: "4px",
                                cursor: "pointer",
                                fontSize: "12px",
                                color: "#475569",
                                fontWeight: "600"
                              }}
                            >
                              Edit
                            </button>
                            <button 
                              onClick={() => handleDelete(index)}
                              style={{
                                background: "none",
                                border: "1px solid #fecaca",
                                padding: "5px 10px",
                                borderRadius: "4px",
                                cursor: "pointer",
                                fontSize: "12px",
                                color: "#dc2626",
                                fontWeight: "600"
                              }}
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </main>
  );
}
