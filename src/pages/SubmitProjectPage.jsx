import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { Plus, Trash2, User, Users, X } from "lucide-react";
import { CAMPUSES, CATEGORIES, STATUSES, fellowName } from "../lib/data";
import { C } from "../lib/theme";
import { Avatar, Badge, Field, GhostButton, PrimaryButton, SectionHeading, inputStyle } from "../components/ui";

const ROLE_SUGGESTIONS = [
  "Project Lead",
  "Frontend Developer",
  "Backend Developer",
  "Full-Stack Engineer",
  "UI/UX Designer",
  "ML / AI Engineer",
  "Data Scientist",
  "Hardware / IoT Lead",
  "Product Manager",
  "Mobile Developer",
];

export function SubmitProjectPage({ go, session, onSubmitted, editId, isMentor, profile, mentorCampusId, allFellows = [] }) {
  const [title, setTitle] = useState("");
  const [shortDesc, setShortDesc] = useState("");
  const [fullDesc, setFullDesc] = useState("");
  const [problem, setProblem] = useState("");
  const [solution, setSolution] = useState("");
  const [category, setCategory] = useState("");
  const [customCategory, setCustomCategory] = useState("");
  const [campusSlug, setCampusSlug] = useState("");
  const [status, setStatus] = useState("Ongoing");
  const [year, setYear] = useState(new Date().getFullYear());
  const [techText, setTechText] = useState("");
  const [githubUrl, setGithubUrl] = useState("");
  const [demoUrl, setDemoUrl] = useState("");
  const [coverFile, setCoverFile] = useState(null);
  const [coverPreview, setCoverPreview] = useState(null);
  const [existingCoverUrl, setExistingCoverUrl] = useState(null);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [loadingExisting, setLoadingExisting] = useState(!!editId);

  // Collaborators & Team State
  const [teamType, setTeamType] = useState("Individual");
  const [collaborators, setCollaborators] = useState([]);
  const [selectedFellowId, setSelectedFellowId] = useState("");
  const [customCollabName, setCustomCollabName] = useState("");
  const [collabRole, setCollabRole] = useState("");

  // Default creator info
  const creatorName = profile?.full_name || session?.user?.user_metadata?.full_name || session?.user?.email || "You";
  const creatorId = session?.user?.id || profile?.id || "creator";

  // Initialize creator as default primary collaborator if not loaded from existing
  useEffect(() => {
    if (!editId && collaborators.length === 0) {
      setCollaborators([
        {
          id: creatorId,
          name: creatorName,
          role: "Project Lead",
        },
      ]);
    }
  }, [editId, creatorName, creatorId]);

  // Editing an existing project: load its current data into the form.
  useEffect(() => {
    if (!editId) {
      setLoadingExisting(false);
      return;
    }
    setLoadingExisting(true);
    supabase
      .from("projects")
      .select("*")
      .eq("id", editId)
      .single()
      .then(({ data, error: fetchError }) => {
        setLoadingExisting(false);
        if (fetchError || !data) {
          setError("Couldn't load that project to edit it.");
          return;
        }
        const campus = CAMPUSES.find((c) => c.dbId === data.campus_id);
        setTitle(data.title || "");
        setShortDesc(data.short_description || "");
        setFullDesc(data.full_description || "");
        setProblem(data.problem_statement || "");
        setSolution(data.solution || "");
        if (data.category && !CATEGORIES.includes(data.category)) {
          setCategory("Others");
          setCustomCategory(data.category);
        } else {
          setCategory(data.category || "");
        }
        setCampusSlug(campus?.id || "");
        setStatus(data.status || "Ongoing");
        setYear(data.year || new Date().getFullYear());
        setTechText((data.technologies || []).join(", "));
        setGithubUrl(data.github_url || "");
        setDemoUrl(data.demo_url || "");
        setExistingCoverUrl(data.cover_image_url || null);

        // Load collaborators & team type
        if (data.collaborators && Array.isArray(data.collaborators) && data.collaborators.length > 0) {
          setCollaborators(data.collaborators);
          setTeamType(data.team_type || (data.collaborators.length > 1 ? "Team" : "Individual"));
        } else if (data.fellow_ids && Array.isArray(data.fellow_ids) && data.fellow_ids.length > 0) {
          const mapped = data.fellow_ids.map((fid) => {
            const found = allFellows.find((f) => f.id === fid);
            return {
              id: fid,
              name: found?.name || fellowName(fid),
              role: found?.title || "",
            };
          });
          setCollaborators(mapped);
          setTeamType(data.team_type || (mapped.length > 1 ? "Team" : "Individual"));
        }
      });
  }, [editId]);

  const handleCoverChange = (e) => {
    const file = e.target.files[0];
    setCoverFile(file || null);
    setCoverPreview(file ? URL.createObjectURL(file) : null);
  };

  const slugify = (s) =>
    s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") + "-" + Date.now().toString(36);

  // Add collaborator handler
  const handleAddCollaborator = () => {
    let nameToAdd = "";
    let idToAdd = null;

    if (selectedFellowId === "custom") {
      nameToAdd = customCollabName.trim();
    } else if (selectedFellowId) {
      const found = allFellows.find((f) => f.id === selectedFellowId);
      nameToAdd = found?.name || fellowName(selectedFellowId);
      idToAdd = selectedFellowId;
    } else if (customCollabName.trim()) {
      nameToAdd = customCollabName.trim();
    }

    if (!nameToAdd) {
      setError("Please select a fellow or enter a collaborator name.");
      return;
    }

    // Check for duplicates
    if (collaborators.some((c) => (idToAdd && c.id === idToAdd) || c.name.toLowerCase() === nameToAdd.toLowerCase())) {
      setError("That collaborator is already listed in this project.");
      return;
    }

    const newCollab = {
      id: idToAdd,
      name: nameToAdd,
      role: collabRole.trim() || "Contributor",
    };

    const updated = [...collaborators, newCollab];
    setCollaborators(updated);
    setTeamType("Team"); // Automatically switch to Team project
    setSelectedFellowId("");
    setCustomCollabName("");
    setCollabRole("");
    setError("");
  };

  const handleRemoveCollaborator = (index) => {
    const updated = collaborators.filter((_, i) => i !== index);
    setCollaborators(updated);
    if (updated.length <= 1) {
      setTeamType("Individual");
    }
  };

  const handleUpdateRole = (index, newRole) => {
    const updated = collaborators.map((c, i) => (i === index ? { ...c, role: newRole } : c));
    setCollaborators(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const finalCategory = category === "Others" ? customCategory.trim() : category;
    let campus = null;
    if (isMentor) {
      // Mentors and Heads only upload a portfolio: picture + links.
      if (!demoUrl.trim()) {
        setError("Please add the link to your live portfolio so people can view it.");
        return;
      }
      if (!coverFile && !existingCoverUrl) {
        setError("Please add a picture of your portfolio.");
        return;
      }
    } else {
      if (!title || !shortDesc || !category || !campusSlug) {
        setError("Please fill in the project title, short description, category, and campus.");
        return;
      }
      if (category === "Others" && !finalCategory) {
        setError("Please type your category.");
        return;
      }
      campus = CAMPUSES.find((c) => c.id === campusSlug);
      if (!campus?.dbId) {
        setError("That campus isn't available right now — try refreshing the page.");
        return;
      }
    }

    setSubmitting(true);

    // Upload project/portfolio picture if a new file was chosen.
    let coverImageUrl = existingCoverUrl;
    if (coverFile) {
      const fileExt = coverFile.name.split(".").pop();
      const fileName = `${slugify(title || "portfolio")}-${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from("project_image").upload(fileName, coverFile);
      if (uploadError) {
        setSubmitting(false);
        setError(`Image upload failed: ${uploadError.message}`);
        return;
      }
      const { data: urlData } = supabase.storage.from("project_image").getPublicUrl(fileName);
      coverImageUrl = urlData.publicUrl;
    }

    const mentorName = profile?.full_name || session?.user?.user_metadata?.full_name || "Mentor";
    const portfolioTitle = title || `${mentorName}'s portfolio`;

    // Ensure we have at least one collaborator defined
    const finalCollaborators = collaborators.length > 0
      ? collaborators
      : [{ id: creatorId, name: creatorName, role: "Project Lead" }];

    const fellowIds = finalCollaborators.map((c) => c.id).filter(Boolean);

    const payload = isMentor ? {
      title: portfolioTitle,
      slug: slugify(portfolioTitle),
      short_description: shortDesc || "Mentor portfolio",
      category: "Portfolio",
      campus_id: mentorCampusId || null,
      status: "Completed",
      year: Number(year) || new Date().getFullYear(),
      is_portfolio: true,
      technologies: techText.split(",").map((t) => t.trim()).filter(Boolean),
      github_url: githubUrl || null,
      demo_url: demoUrl.trim() ? (/^https?:\/\//i.test(demoUrl.trim()) ? demoUrl.trim() : `https://${demoUrl.trim()}`) : null,
      cover_image_url: coverImageUrl,
    } : {
      title,
      slug: slugify(title),
      short_description: shortDesc,
      full_description: fullDesc,
      problem_statement: problem,
      solution,
      category: finalCategory,
      campus_id: campus.dbId,
      status,
      year: Number(year),
      technologies: techText.split(",").map((t) => t.trim()).filter(Boolean),
      github_url: githubUrl || null,
      demo_url: demoUrl.trim() ? (/^https?:\/\//i.test(demoUrl.trim()) ? demoUrl.trim() : `https://${demoUrl.trim()}`) : null,
      cover_image_url: coverImageUrl,
      team_type: teamType,
      collaborators: finalCollaborators,
      fellow_ids: fellowIds,
      // Editing a declined project sends it back to the mentors for review.
      ...(editId ? { rejected: false, rejection_reason: null } : {}),
    };

    const { error: saveError } = editId
      ? await supabase.from("projects").update(payload).eq("id", editId).eq("created_by", session.user.id)
      : await supabase.from("projects").insert({ ...payload, created_by: session.user.id });
    setSubmitting(false);

    if (saveError) {
      setError(saveError.message);
      return;
    }
    onSubmitted?.();
    go("dashboard");
  };

  if (loadingExisting) {
    return (
      <div style={{ maxWidth: 700, margin: "0 auto", padding: "40px 24px 96px" }}>
        <p className="tn-body" style={{ fontSize: 13.5, color: C.slateLight }}>Loading…</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: "40px 24px 96px" }}>
      <SectionHeading
        eyebrow={editId ? "Edit submission" : isMentor ? "New portfolio" : "New submission"}
        title={editId ? (isMentor ? "Edit portfolio" : "Edit project") : isMentor ? "Upload portfolio" : "Submit a project"}
        sub={editId ? (isMentor ? "Update your portfolio details below." : "Update your project's details and collaborators below.") : isMentor ? "Add a picture of your portfolio and the link to it. Portfolios appear on your profile, not in Spotlight or Explore." : "Add your project to the Project Hub. You can specify team collaborators and roles."}
      />
      <form onSubmit={handleSubmit} style={{ border: `1px solid ${C.line}`, borderRadius: 16, padding: 28, display: "flex", flexDirection: "column", gap: 18, background: C.white }}>
        {!isMentor && (
          <>
            <Field label="Project title *">
              <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. FarmSense, PayFlow" className="tn-body" style={inputStyle} />
            </Field>

            <Field label="Short description *">
              <input value={shortDesc} onChange={(e) => setShortDesc(e.target.value)} placeholder="One or two sentences explaining the core concept" className="tn-body" style={inputStyle} />
            </Field>

            {/* Project Team Type & Collaborators Card */}
            <div style={{ border: `1px solid ${C.line}`, borderRadius: 14, padding: 20, background: C.paper, display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <Users size={16} color={C.teal} />
                    <p className="tn-display" style={{ fontSize: 14.5, fontWeight: 700, margin: 0, color: C.ink }}>
                      Project Team & Collaborators
                    </p>
                  </div>
                  <p className="tn-body" style={{ fontSize: 12.5, color: C.slateLight, margin: "2px 0 0" }}>
                    Was this project built solo or by a team of fellows?
                  </p>
                </div>

                <div style={{ display: "flex", gap: 6, background: C.white, padding: 4, borderRadius: 10, border: `1px solid ${C.line}` }}>
                  <button
                    type="button"
                    onClick={() => {
                      setTeamType("Individual");
                      // If setting to Individual, keep only primary creator if multiple
                      if (collaborators.length > 1) {
                        setCollaborators([collaborators[0]]);
                      }
                    }}
                    className="tn-body"
                    style={{
                      display: "inline-flex", alignItems: "center", gap: 5, padding: "6px 12px", borderRadius: 8,
                      fontSize: 12, fontWeight: 600, border: "none", cursor: "pointer",
                      background: teamType === "Individual" ? C.teal : "transparent",
                      color: teamType === "Individual" ? C.white : C.slate,
                      transition: "all 0.15s ease",
                    }}
                  >
                    <User size={13} /> Solo
                  </button>
                  <button
                    type="button"
                    onClick={() => setTeamType("Team")}
                    className="tn-body"
                    style={{
                      display: "inline-flex", alignItems: "center", gap: 5, padding: "6px 12px", borderRadius: 8,
                      fontSize: 12, fontWeight: 600, border: "none", cursor: "pointer",
                      background: teamType === "Team" ? C.teal : "transparent",
                      color: teamType === "Team" ? C.white : C.slate,
                      transition: "all 0.15s ease",
                    }}
                  >
                    <Users size={13} /> Team Project
                  </button>
                </div>
              </div>

              {/* Collaborators List */}
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <p className="tn-body" style={{ fontSize: 12.5, fontWeight: 600, color: C.slate, margin: 0 }}>
                  Current Contributors ({collaborators.length}):
                </p>

                {collaborators.map((c, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 12,
                      padding: "8px 12px",
                      borderRadius: 10,
                      background: C.white,
                      border: `1px solid ${C.line}`,
                      flexWrap: "wrap",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 160 }}>
                      <Avatar name={c.name} size={28} hue={idx === 0 ? C.ink : C.gold} />
                      <div>
                        <span className="tn-body" style={{ fontSize: 13, fontWeight: 600, color: C.ink, display: "block" }}>
                          {c.name} {idx === 0 && <span style={{ fontSize: 11, color: C.slateLight }}>(Lead)</span>}
                        </span>
                      </div>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: 8, flex: "1 1 200px" }}>
                      <input
                        value={c.role || ""}
                        onChange={(e) => handleUpdateRole(idx, e.target.value)}
                        placeholder="Optional role (e.g. Lead, Frontend, ML)"
                        className="tn-body"
                        style={{
                          ...inputStyle,
                          padding: "6px 10px",
                          fontSize: 12,
                          background: C.paper,
                        }}
                      />
                      {idx > 0 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveCollaborator(idx)}
                          title="Remove collaborator"
                          style={{
                            background: C.dangerPale,
                            border: "none",
                            borderRadius: 6,
                            padding: "6px",
                            cursor: "pointer",
                            color: C.danger,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <X size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Add Collaborator Section */}
              <div style={{ borderTop: `1px dashed ${C.line}`, paddingTop: 12 }}>
                <p className="tn-body" style={{ fontSize: 12.5, fontWeight: 600, color: C.ink, margin: "0 0 8px" }}>
                  Add team collaborator:
                </p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: 10, alignItems: "start" }}>
                  <div>
                    <select
                      value={selectedFellowId}
                      onChange={(e) => setSelectedFellowId(e.target.value)}
                      className="tn-body"
                      style={{ ...inputStyle, padding: "8px 10px", fontSize: 12.5 }}
                    >
                      <option value="">Select a registered fellow…</option>
                      {allFellows.map((f) => (
                        <option key={f.id} value={f.id}>
                          {f.name} ({f.title || "Fellow"} - {f.city || "Campus"})
                        </option>
                      ))}
                      <option value="custom">+ Other / External Collaborator</option>
                    </select>

                    {selectedFellowId === "custom" && (
                      <input
                        value={customCollabName}
                        onChange={(e) => setCustomCollabName(e.target.value)}
                        placeholder="Enter collaborator name"
                        className="tn-body"
                        style={{ ...inputStyle, marginTop: 6, padding: "8px 10px", fontSize: 12.5 }}
                      />
                    )}
                  </div>

                  <div>
                    <input
                      value={collabRole}
                      onChange={(e) => setCollabRole(e.target.value)}
                      placeholder="Role (e.g. Backend Engineer)"
                      className="tn-body"
                      style={{ ...inputStyle, padding: "8px 10px", fontSize: 12.5 }}
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleAddCollaborator}
                    className="tn-body"
                    style={{
                      background: C.teal,
                      color: C.white,
                      border: "none",
                      borderRadius: 10,
                      padding: "9px 14px",
                      fontWeight: 600,
                      fontSize: 12.5,
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 4,
                      whiteSpace: "nowrap",
                    }}
                  >
                    <Plus size={14} /> Add
                  </button>
                </div>

                {/* Role quick suggestion chips */}
                <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginTop: 8 }}>
                  <span style={{ fontSize: 11, color: C.slateLight, alignSelf: "center", marginRight: 2 }}>
                    Role presets:
                  </span>
                  {ROLE_SUGGESTIONS.slice(0, 5).map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setCollabRole(preset)}
                      className="tn-body"
                      style={{
                        background: collabRole === preset ? C.goldPale : C.white,
                        color: collabRole === preset ? C.goldDeep : C.slate,
                        border: `1px solid ${collabRole === preset ? C.gold : C.line}`,
                        borderRadius: 6,
                        padding: "2px 7px",
                        fontSize: 11,
                        cursor: "pointer",
                      }}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <Field label="Full description">
              <textarea value={fullDesc} onChange={(e) => setFullDesc(e.target.value)} rows={4} className="tn-body" style={{ ...inputStyle, resize: "vertical" }} />
            </Field>
            <Field label="Problem statement">
              <textarea value={problem} onChange={(e) => setProblem(e.target.value)} rows={2} className="tn-body" style={{ ...inputStyle, resize: "vertical" }} />
            </Field>
            <Field label="Proposed solution">
              <textarea value={solution} onChange={(e) => setSolution(e.target.value)} rows={2} className="tn-body" style={{ ...inputStyle, resize: "vertical" }} />
            </Field>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <Field label="Category *">
                <select value={category} onChange={(e) => setCategory(e.target.value)} className="tn-body" style={inputStyle}>
                  <option value="">Select a category</option>
                  {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                  <option value="Others">Others</option>
                </select>
                {category === "Others" && (
                  <input
                    value={customCategory}
                    onChange={(e) => setCustomCategory(e.target.value)}
                    placeholder="Type your category"
                    className="tn-body"
                    style={{ ...inputStyle, marginTop: 8 }}
                    autoFocus
                  />
                )}
              </Field>
              <Field label="Campus *">
                <select value={campusSlug} onChange={(e) => setCampusSlug(e.target.value)} className="tn-body" style={inputStyle}>
                  <option value="">Select a campus</option>
                  {CAMPUSES.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </Field>
              <Field label="Status">
                <select value={status} onChange={(e) => setStatus(e.target.value)} className="tn-body" style={inputStyle}>
                  {STATUSES.map((s) => <option key={s}>{s}</option>)}
                </select>
              </Field>
              <Field label="Year">
                <input type="number" value={year} onChange={(e) => setYear(e.target.value)} className="tn-body" style={inputStyle} />
              </Field>
            </div>
          </>
        )}

        {isMentor ? (
          <Field label="Portfolio picture">
            <label
              style={{
                display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 8,
                width: "100%", aspectRatio: "16 / 9", borderRadius: 14, overflow: "hidden", cursor: "pointer",
                border: `2px dashed ${C.line}`, background: C.paperDeep, position: "relative", boxSizing: "border-box",
              }}
            >
              {(coverPreview || existingCoverUrl) ? (
                <>
                  <img src={coverPreview || existingCoverUrl} alt="Portfolio preview" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
                  <span className="tn-body" style={{ position: "absolute", right: 12, bottom: 12, background: "rgba(27,16,146,0.85)", color: C.white, fontSize: 12.5, fontWeight: 600, padding: "6px 12px", borderRadius: 999 }}>
                    Change picture
                  </span>
                </>
              ) : (
                <>
                  <Plus size={28} color={C.slateLight} />
                  <span className="tn-body" style={{ fontSize: 14, fontWeight: 600, color: C.slate }}>Click to add a wide picture of your portfolio</span>
                  <span className="tn-body" style={{ fontSize: 12.5, color: C.slateLight }}>Landscape works best, for example 1600 × 900</span>
                </>
              )}
              <input type="file" accept="image/*" onChange={handleCoverChange} style={{ display: "none" }} />
            </label>
          </Field>
        ) : (
          <Field label="Project picture">
            <input type="file" accept="image/*" onChange={handleCoverChange} className="tn-body" style={{ fontSize: 13.5 }} />
            {(coverPreview || existingCoverUrl) && (
              <img src={coverPreview || existingCoverUrl} alt="Preview" style={{ marginTop: 10, width: "100%", maxHeight: 180, objectFit: "cover", borderRadius: 10, border: `1px solid ${C.line}` }} />
            )}
          </Field>
        )}

        <Field label="Technologies (comma-separated)">
          <input value={techText} onChange={(e) => setTechText(e.target.value)} placeholder="React, Node.js, PostgreSQL" className="tn-body" style={inputStyle} />
        </Field>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <Field label="GitHub link">
            <input value={githubUrl} onChange={(e) => setGithubUrl(e.target.value)} placeholder="https://github.com/…" className="tn-body" style={inputStyle} />
          </Field>
          <Field label={isMentor ? "Live portfolio link *" : "Live demo link"}>
            <input value={demoUrl} onChange={(e) => setDemoUrl(e.target.value)} placeholder={isMentor ? "https://yourportfolio.com" : "https://…"} className="tn-body" style={inputStyle} />
          </Field>
        </div>

        {error && <p className="tn-body" style={{ fontSize: 13, color: C.danger, margin: 0 }}>{error}</p>}

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 8 }}>
          <GhostButton small onClick={() => go("dashboard")}>Cancel</GhostButton>
          <PrimaryButton small disabled={submitting}>{submitting ? "Saving…" : editId ? "Save changes" : isMentor ? "Upload portfolio" : "Submit project"}</PrimaryButton>
        </div>
      </form>
    </div>
  );
}
