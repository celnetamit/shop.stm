"use client";

import { useEffect, useState, useMemo } from "react";
import { type JournalRow } from "@/lib/journal-data";

export default function AdminJournalsPage() {
  const [journals, setJournals] = useState<JournalRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  
  // Search & Pagination
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingJournal, setEditingJournal] = useState<Partial<JournalRow> | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  async function loadData() {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/journals", { cache: "no-store" });
      const json = (await res.json()) as { ok: boolean; journals?: JournalRow[]; error?: string };
      if (json.ok && json.journals) {
        setJournals(json.journals);
      } else {
        setError(json.error || "Failed to fetch journals");
      }
    } catch (err) {
      setError("Network error loaded data");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, []);

  // Clear success messages after 3s
  useEffect(() => {
    if (successMsg) {
      const timer = setTimeout(() => setSuccessMsg(""), 4000);
      return () => clearTimeout(timer);
    }
  }, [successMsg]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return journals;
    return journals.filter((j) => 
      j["Journal Name"].toLowerCase().includes(q) ||
      j.Subject.toLowerCase().includes(q) ||
      j.Abbreviation.toLowerCase().includes(q) ||
      (j.issn && j.issn.toLowerCase().includes(q))
    );
  }, [journals, search]);

  // Reset page when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  const paginated = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filtered.slice(start, start + itemsPerPage);
  }, [filtered, currentPage]);

  const totalPages = Math.ceil(filtered.length / itemsPerPage) || 1;

  const handleOpenAdd = () => {
    setEditingJournal({
      "Journal Name": "",
      Subject: "",
      Abbreviation: "",
      "Subscription\n[Print]": 0,
      "Subscription\n[Online]": 0,
      "Subscription\n[Print+Online]": 0,
      "Subscription\n[Print] USD": 0,
      "Subscription\n[Online] USD": 0,
      "Subscription\n[Print+Online] USD": 0,
      issn: "",
      frequency: "",
      Indexing: "",
      imageUrl: ""
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (journal: JournalRow) => {
    setEditingJournal({ ...journal });
    setIsModalOpen(true);
  };

  const handleDelete = async (journal: JournalRow) => {
    if (!confirm(`Are you sure you want to delete "${journal["Journal Name"]}"? This cannot be undone.`)) {
      return;
    }
    try {
      const res = await fetch(`/api/admin/journals/${journal["S/No"]}`, {
        method: "DELETE"
      });
      const json = await res.json();
      if (json.ok) {
        setSuccessMsg(`Successfully deleted "${journal["Journal Name"]}"`);
        void loadData();
      } else {
        alert(json.error || "Failed to delete journal");
      }
    } catch (err) {
      alert("Error occurred during deletion");
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingJournal || !editingJournal["Journal Name"]) return;

    try {
      setSubmitting(true);
      const res = await fetch("/api/admin/journals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingJournal)
      });
      const json = await res.json();
      if (json.ok) {
        setSuccessMsg(editingJournal["S/No"] ? "Journal updated successfully!" : "New journal created successfully!");
        setIsModalOpen(false);
        setEditingJournal(null);
        void loadData();
      } else {
        alert(json.error || "Failed to save journal");
      }
    } catch (err) {
      alert("Failed to communicate with backend server");
    } finally {
      setSubmitting(false);
    }
  };

  const handleFieldChange = (field: keyof JournalRow | string, value: any) => {
    if (!editingJournal) return;
    setEditingJournal(prev => ({
      ...prev!,
      [field]: value
    }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Invalid file type. Please upload an image (PNG, JPG, WEBP, etc.)");
      return;
    }

    try {
      setUploadingImage(true);
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData
      });

      const json = await res.json() as { ok: boolean; url?: string; error?: string };
      
      if (json.ok && json.url) {
        handleFieldChange("imageUrl", json.url);
      } else {
        alert(json.error || "Image upload failed. Please try again.");
      }
    } catch (err) {
      alert("Network error during image upload.");
    } finally {
      setUploadingImage(false);
      // Reset file input pointer so uploading the same file triggers change again if needed
      e.target.value = "";
    }
  };

  return (
    <section className="admin-page journals-management">
      <style>{`
        .journals-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
          gap: 1rem;
          flex-wrap: wrap;
        }
        .journals-controls {
          display: flex;
          gap: 1rem;
          align-items: center;
          margin-bottom: 1.5rem;
          width: 100%;
          flex-wrap: wrap;
        }
        .search-input {
          flex: 1;
          min-width: 280px;
          padding: 0.75rem 1rem;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          font-size: 0.95rem;
          background: white;
          transition: border-color 0.2s;
        }
        .search-input:focus {
          border-color: #2563eb;
          outline: none;
          box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
        }
        .btn-primary {
          background: #2563eb;
          color: white;
          border: none;
          padding: 0.75rem 1.5rem;
          border-radius: 8px;
          font-weight: 500;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          transition: background 0.2s;
        }
        .btn-primary:hover {
          background: #1d4ed8;
        }
        .btn-secondary {
          background: #f1f5f9;
          color: #334155;
          border: 1px solid #e2e8f0;
          padding: 0.75rem 1.5rem;
          border-radius: 8px;
          font-weight: 500;
          cursor: pointer;
        }
        .btn-secondary:hover {
          background: #e2e8f0;
        }
        .upload-btn-action:hover:not(:disabled) {
          background: #f1f5f9 !important;
          border-color: #cbd5e1 !important;
          color: #1e293b !important;
          box-shadow: 0 1px 3px rgba(0,0,0,0.05);
        }
        .upload-btn-action:disabled {
          opacity: 0.65;
          cursor: not-allowed;
        }
        .journals-table th {
          background: #f8fafc;
          font-weight: 600;
          color: #475569;
          text-transform: uppercase;
          font-size: 0.75rem;
          letter-spacing: 0.05em;
        }
        .badge {
          display: inline-block;
          padding: 0.25rem 0.5rem;
          font-size: 0.75rem;
          font-weight: 600;
          border-radius: 6px;
          background: #eff6ff;
          color: #1d4ed8;
        }
        .price-tag {
          display: block;
          font-size: 0.85rem;
          color: #64748b;
          margin-bottom: 2px;
        }
        .action-btn {
          border: none;
          background: transparent;
          cursor: pointer;
          padding: 4px 8px;
          font-size: 0.85rem;
          font-weight: 500;
          border-radius: 4px;
          margin-right: 4px;
        }
        .edit-btn {
          color: #2563eb;
        }
        .edit-btn:hover {
          background: #eff6ff;
        }
        .delete-btn {
          color: #dc2626;
        }
        .delete-btn:hover {
          background: #fef2f2;
        }
        
        /* Pagination */
        .pagination {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 1.5rem;
          padding-top: 1rem;
          border-top: 1px solid #f1f5f9;
        }
        .pagination-info {
          color: #64748b;
          font-size: 0.9rem;
        }
        .pagination-btns {
          display: flex;
          gap: 0.5rem;
        }
        .page-btn {
          padding: 0.5rem 1rem;
          border: 1px solid #e2e8f0;
          background: white;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s;
        }
        .page-btn:hover:not(:disabled) {
          background: #f8fafc;
          border-color: #cbd5e1;
        }
        .page-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .page-btn.active {
          background: #2563eb;
          color: white;
          border-color: #2563eb;
        }
        
        /* Notification Toast */
        .toast {
          position: fixed;
          bottom: 20px;
          right: 20px;
          background: #10b981;
          color: white;
          padding: 1rem 1.5rem;
          border-radius: 8px;
          box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1);
          z-index: 1000;
          animation: slideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
        @keyframes slideIn {
          from { transform: translateY(100%) scale(0.9); opacity: 0; }
          to { transform: translateY(0) scale(1); opacity: 1; }
        }

        /* Modal Styles */
        .modal-backdrop {
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(15, 23, 42, 0.65);
          backdrop-filter: blur(4px);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1000;
          padding: 1rem;
          animation: fadeIn 0.2s ease-out;
        }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        
        .modal-card {
          background: white;
          border-radius: 16px;
          width: 100%;
          max-width: 700px;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
          animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
        @keyframes slideUp { 
          from { transform: translateY(20px) scale(0.98); opacity: 0; } 
          to { transform: translateY(0) scale(1); opacity: 1; } 
        }

        .modal-head {
          padding: 1.5rem;
          border-bottom: 1px solid #e2e8f0;
          display: flex;
          justify-content: space-between;
          align-items: center;
          position: sticky;
          top: 0;
          background: white;
          z-index: 10;
        }
        .modal-head h2 {
          margin: 0;
          font-size: 1.25rem;
          color: #0f172a;
        }
        .modal-close {
          background: none;
          border: none;
          font-size: 1.5rem;
          color: #94a3b8;
          cursor: pointer;
          line-height: 1;
        }
        .modal-close:hover { color: #475569; }
        
        .modal-body {
          padding: 1.5rem;
        }
        
        .form-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1.25rem;
        }
        @media (max-width: 600px) {
          .form-grid { grid-template-columns: 1fr; }
        }
        .form-full {
          grid-column: 1 / -1;
        }
        .form-group {
          display: flex;
          flex-direction: column;
          gap: 0.375rem;
        }
        .form-group label {
          font-size: 0.85rem;
          font-weight: 600;
          color: #475569;
        }
        .form-group input, .form-group select, .form-group textarea {
          padding: 0.625rem 0.875rem;
          border: 1px solid #cbd5e1;
          border-radius: 8px;
          font-size: 0.9rem;
        }
        .form-group input:focus, .form-group textarea:focus {
          outline: none;
          border-color: #2563eb;
          box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
        }
        .form-section-title {
          margin: 1.5rem 0 0.75rem;
          font-size: 0.9rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: #64748b;
          border-bottom: 1px solid #e2e8f0;
          padding-bottom: 0.5rem;
          grid-column: 1 / -1;
        }
        
        .modal-footer {
          padding: 1.5rem;
          border-top: 1px solid #e2e8f0;
          display: flex;
          justify-content: flex-end;
          gap: 0.75rem;
          background: #f8fafc;
          border-bottom-left-radius: 16px;
          border-bottom-right-radius: 16px;
        }
      `}</style>

      {/* Top Notification Alert */}
      {successMsg && (
        <div className="toast">
          ✓ {successMsg}
        </div>
      )}

      <div className="journals-header">
        <div>
          <h1>Manage Journals & Prices</h1>
          <p style={{ color: "#64748b", marginTop: "4px" }}>Add, remove, and edit journal information and pricing catalogs.</p>
        </div>
        <button className="btn-primary" onClick={handleOpenAdd}>
          + Add New Journal
        </button>
      </div>

      {error && <p className="auth-error" style={{ marginBottom: "1.5rem" }}>{error}</p>}

      <div className="journals-controls">
        <input 
          type="text" 
          placeholder="Search by journal name, subject, abbreviation, or ISSN..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="search-input"
        />
      </div>

      {loading ? (
        <div style={{ padding: "3rem", textAlign: "center", color: "#64748b" }}>
          Loading journal catalog...
        </div>
      ) : (
        <>
          <div className="admin-table-wrap" style={{ border: "1px solid #e2e8f0", borderRadius: "12px", overflow: "hidden" }}>
            <table className="admin-table journals-table">
              <thead>
                <tr>
                  <th style={{ width: "50px" }}>S/No</th>
                  <th>Journal Details</th>
                  <th>Subject</th>
                  <th>ISSN / Freq</th>
                  <th>Pricing (INR)</th>
                  <th>Pricing (USD)</th>
                  <th style={{ textAlign: "right", width: "120px" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginated.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: "center", padding: "3rem", color: "#64748b" }}>
                      No journals found. Try refining your search terms.
                    </td>
                  </tr>
                ) : (
                  paginated.map((j) => (
                    <tr key={j["S/No"]}>
                      <td style={{ color: "#64748b" }}>{j["S/No"]}</td>
                      <td>
                        <div style={{ fontWeight: "600", color: "#0f172a", marginBottom: "2px" }}>{j["Journal Name"]}</div>
                        <div style={{ display: "flex", gap: "6px" }}>
                          <span className="badge" style={{ background: "#f1f5f9", color: "#475569" }}>{j.Abbreviation}</span>
                        </div>
                      </td>
                      <td>
                        <span className="badge">{j.Subject}</span>
                      </td>
                      <td style={{ fontSize: "0.85rem" }}>
                        {j.issn ? <div><strong style={{ color: "#475569" }}>ISSN:</strong> {j.issn}</div> : null}
                        {j.frequency ? <div><strong style={{ color: "#475569" }}>Freq:</strong> {j.frequency}</div> : null}
                      </td>
                      <td>
                        <span className="price-tag"><strong>Print:</strong> ₹{j["Subscription\n[Print]"]?.toLocaleString()}</span>
                        <span className="price-tag"><strong>Online:</strong> ₹{j["Subscription\n[Online]"]?.toLocaleString()}</span>
                        <span className="price-tag"><strong>Combined:</strong> ₹{j["Subscription\n[Print+Online]"]?.toLocaleString()}</span>
                      </td>
                      <td>
                        <span className="price-tag"><strong>Print:</strong> ${j["Subscription\n[Print] USD"]}</span>
                        <span className="price-tag"><strong>Online:</strong> ${j["Subscription\n[Online] USD"]}</span>
                        <span className="price-tag"><strong>Combined:</strong> ${j["Subscription\n[Print+Online] USD"]}</span>
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <div style={{ display: "flex", justifyContent: "flex-end", gap: "2px" }}>
                          <button 
                            className="action-btn edit-btn"
                            onClick={() => handleOpenEdit(j)}
                          >
                            Edit
                          </button>
                          <button 
                            className="action-btn delete-btn"
                            onClick={() => void handleDelete(j)}
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

          {filtered.length > 0 && (
            <div className="pagination">
              <div className="pagination-info">
                Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filtered.length)} of <strong>{filtered.length}</strong> journals
              </div>
              <div className="pagination-btns">
                <button 
                  className="page-btn" 
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </button>
                <button 
                  className="page-btn" 
                  disabled
                  style={{ background: "#f8fafc", color: "#475569", borderColor: "#e2e8f0" }}
                >
                  Page {currentPage} of {totalPages}
                </button>
                <button 
                  className="page-btn" 
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Form Modal for Add/Edit */}
      {isModalOpen && editingJournal && (
        <div className="modal-backdrop" onClick={() => setIsModalOpen(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <h2>{editingJournal["S/No"] ? `Edit Journal #${editingJournal["S/No"]}` : "Create New Journal"}</h2>
              <button className="modal-close" onClick={() => setIsModalOpen(false)}>&times;</button>
            </div>

            <form onSubmit={handleFormSubmit}>
              <div className="modal-body">
                <div className="form-grid">
                  <div className="form-group form-full">
                    <label htmlFor="journalName">Journal Full Name *</label>
                    <input 
                      id="journalName"
                      type="text" 
                      required
                      value={editingJournal["Journal Name"] || ""}
                      onChange={(e) => handleFieldChange("Journal Name", e.target.value)}
                      placeholder="e.g., International Journal of Engineering Trends"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="subject">Subject / Category *</label>
                    <input 
                      id="subject"
                      type="text" 
                      required
                      value={editingJournal.Subject || ""}
                      onChange={(e) => handleFieldChange("Subject", e.target.value)}
                      placeholder="e.g., Bio Technology"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="abbreviation">Slug / Abbreviation</label>
                    <input 
                      id="abbreviation"
                      type="text" 
                      value={editingJournal.Abbreviation || ""}
                      onChange={(e) => handleFieldChange("Abbreviation", e.target.value)}
                      placeholder="e.g., ijet (Auto-generated if left blank)"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="issn">ISSN Code</label>
                    <input 
                      id="issn"
                      type="text" 
                      value={editingJournal.issn || ""}
                      onChange={(e) => handleFieldChange("issn", e.target.value)}
                      placeholder="e.g., 2341-9082"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="frequency">Publishing Frequency</label>
                    <input 
                      id="frequency"
                      type="text" 
                      value={editingJournal.frequency || ""}
                      onChange={(e) => handleFieldChange("frequency", e.target.value)}
                      placeholder="e.g., 3 Issues, Monthly"
                    />
                  </div>

                  <div className="form-group form-full">
                    <label htmlFor="indexing">Indexing Platforms</label>
                    <input 
                      id="indexing"
                      type="text" 
                      value={editingJournal.Indexing || ""}
                      onChange={(e) => handleFieldChange("Indexing", e.target.value)}
                      placeholder="e.g., Google Scholar, Citefactor, Index Copernicus"
                    />
                  </div>

                  <div className="form-group form-full">
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2px" }}>
                      <label htmlFor="imageUrl">Journal Cover Image</label>
                      <span style={{ fontSize: "0.75rem", color: "#64748b" }}>Upload local file OR enter address</span>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      <div style={{ display: "flex", gap: "10px", width: "100%" }}>
                        <input 
                          type="file" 
                          accept="image/*" 
                          id="imageFileInput"
                          style={{ display: "none" }} 
                          onChange={handleImageUpload} 
                        />
                        <button 
                          type="button" 
                          onClick={() => document.getElementById("imageFileInput")?.click()}
                          disabled={uploadingImage}
                          style={{
                            flexShrink: 0,
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "6px",
                            padding: "0.625rem 1rem",
                            background: "#f8fafc",
                            border: "1px solid #cbd5e1",
                            borderRadius: "8px",
                            fontSize: "0.85rem",
                            fontWeight: "600",
                            color: "#334155",
                            cursor: "pointer",
                            transition: "all 0.15s ease"
                          }}
                          className="upload-btn-action"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                            <polyline points="17 8 12 3 7 8" />
                            <line x1="12" y1="3" x2="12" y2="15" />
                          </svg>
                          {uploadingImage ? "Uploading..." : "Upload File"}
                        </button>
                        <div style={{ flex: 1, display: "flex", gap: "12px", alignItems: "center" }}>
                          <input 
                            id="imageUrl"
                            type="text" 
                            value={editingJournal.imageUrl || ""}
                            onChange={(e) => handleFieldChange("imageUrl", e.target.value)}
                            placeholder="https://... or uploaded image URL"
                            style={{ flex: 1 }}
                          />
                          {editingJournal.imageUrl && (
                            <div style={{ 
                              width: "42px", 
                              height: "56px", 
                              border: "1.5px solid #e2e8f0", 
                              borderRadius: "6px", 
                              overflow: "hidden", 
                              background: "#f8fafc", 
                              display: "flex", 
                              justifyContent: "center", 
                              alignItems: "center",
                              boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
                              flexShrink: 0
                            }}>
                              <img 
                                src={editingJournal.imageUrl} 
                                alt="Preview" 
                                style={{ width: "100%", height: "100%", objectFit: "cover" }} 
                                onError={(e) => { (e.target as HTMLImageElement).src = "https://dummyimage.com/42x56/f1f5f9/94a3b8.png&text=X"; }} 
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Domestic Pricing Section */}
                  <h3 className="form-section-title">Indian Subscription Pricing (INR ₹)</h3>
                  
                  <div className="form-group">
                    <label htmlFor="printInr">Subscription [Print]</label>
                    <input 
                      id="printInr"
                      type="number" 
                      min="0"
                      value={editingJournal["Subscription\n[Print]"] || 0}
                      onChange={(e) => handleFieldChange("Subscription\n[Print]", Number(e.target.value))}
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="onlineInr">Subscription [Online]</label>
                    <input 
                      id="onlineInr"
                      type="number" 
                      min="0"
                      value={editingJournal["Subscription\n[Online]"] || 0}
                      onChange={(e) => handleFieldChange("Subscription\n[Online]", Number(e.target.value))}
                    />
                  </div>
                  <div className="form-group form-full">
                    <label htmlFor="combinedInr">Subscription [Print + Online Combined]</label>
                    <input 
                      id="combinedInr"
                      type="number" 
                      min="0"
                      value={editingJournal["Subscription\n[Print+Online]"] || 0}
                      onChange={(e) => handleFieldChange("Subscription\n[Print+Online]", Number(e.target.value))}
                    />
                  </div>

                  {/* International Pricing Section */}
                  <h3 className="form-section-title">International Subscription Pricing (USD $)</h3>
                  
                  <div className="form-group">
                    <label htmlFor="printUsd">Subscription [Print] USD</label>
                    <input 
                      id="printUsd"
                      type="number" 
                      min="0"
                      value={editingJournal["Subscription\n[Print] USD"] || 0}
                      onChange={(e) => handleFieldChange("Subscription\n[Print] USD", Number(e.target.value))}
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="onlineUsd">Subscription [Online] USD</label>
                    <input 
                      id="onlineUsd"
                      type="number" 
                      min="0"
                      value={editingJournal["Subscription\n[Online] USD"] || 0}
                      onChange={(e) => handleFieldChange("Subscription\n[Online] USD", Number(e.target.value))}
                    />
                  </div>
                  <div className="form-group form-full">
                    <label htmlFor="combinedUsd">Subscription [Print + Online] USD</label>
                    <input 
                      id="combinedUsd"
                      type="number" 
                      min="0"
                      value={editingJournal["Subscription\n[Print+Online] USD"] || 0}
                      onChange={(e) => handleFieldChange("Subscription\n[Print+Online] USD", Number(e.target.value))}
                    />
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setIsModalOpen(false)} disabled={submitting}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={submitting}>
                  {submitting ? "Saving..." : editingJournal["S/No"] ? "Save Changes" : "Create Journal"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
