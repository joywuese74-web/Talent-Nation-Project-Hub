import { useState } from "react";
import { MapPin, Search } from "lucide-react";
import { C } from "../lib/theme";
import { Avatar, Badge, SectionHeading, StatusDot } from "../components/ui";
import { CAMPUSES, STATUSES, getCampus } from "../lib/data";

/* ----------------------------------- fellows ---------------------------------- */

export function FellowsPage({ go, openFellow, fellows: everyone, projectCounts, projectStatusCounts = {}, loadingFellows }) {
  // Mentors and Heads of Campus have their own page (Coding Mentors).
  const fellows = everyone.filter((f) => !f.isMentor);
  const [query, setQuery] = useState("");
  const [campus, setCampus] = useState("All");
  const [skill, setSkill] = useState("All");
  const allSkills = Array.from(new Set(fellows.flatMap((f) => f.skills)));

  const filtered = fellows.filter((f) => {
    const matchQuery = query.trim() === "" || f.name.toLowerCase().includes(query.toLowerCase());
    const matchCampus = campus === "All" || f.campusId === campus;
    const matchSkill = skill === "All" || f.skills.includes(skill);
    return matchQuery && matchCampus && matchSkill;
  });

  const selectStyle = { padding: "10px 12px", borderRadius: 10, border: `1px solid ${C.line}`, fontSize: 13, background: C.white };

  return (
    <div style={{ maxWidth: 1440, margin: "0 auto", padding: "48px 24px 96px" }}>
      <SectionHeading eyebrow="Community" title="Fellows" sub="Search and filter fellows across all Talent Nation campuses." />
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 28 }}>
        <div style={{ position: "relative", flex: "1 1 260px" }}>
          <Search size={16} color={C.slateLight} style={{ position: "absolute", left: 12, top: 12 }} />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search fellows by name" className="tn-body" style={{ width: "100%", padding: "10px 12px 10px 36px", borderRadius: 10, border: `1px solid ${C.line}`, fontSize: 13.5, boxSizing: "border-box" }} />
        </div>
        <select value={campus} onChange={(e) => setCampus(e.target.value)} className="tn-body" style={selectStyle}>
          <option value="All">All campuses</option>
          {CAMPUSES.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select value={skill} onChange={(e) => setSkill(e.target.value)} className="tn-body" style={selectStyle}>
          <option value="All">All skills</option>
          {allSkills.map((s) => <option key={s}>{s}</option>)}
        </select>
      </div>
      {loadingFellows ? (
        <p className="tn-body" style={{ fontSize: 13.5, color: C.slateLight }}>Loading…</p>
      ) : (
        <>
          <p className="tn-body" style={{ fontSize: 13, color: C.slateLight, marginBottom: 20 }}>{filtered.length} fellow{filtered.length !== 1 ? "s" : ""} found</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
            {filtered.map((f) => {
              const campusObj = getCampus(f.campusId);
              const byStatus = projectStatusCounts[f.id] || {};
              const statusBreakdown = STATUSES.filter((s) => byStatus[s] > 0);
              return (
                <div key={f.id} onClick={() => openFellow(f.id)} style={{ cursor: "pointer", border: `1px solid ${C.line}`, borderRadius: 16, padding: 18, background: C.white }}>
                  <Avatar name={f.name} size={44} hue={campusObj?.hue || C.teal} photo={f.avatarUrl} />
                  <p className="tn-display" style={{ fontWeight: 700, fontSize: 14.5, margin: "12px 0 2px" }}>{f.name}</p>
                  <p className="tn-body" style={{ fontSize: 12.5, color: C.slateLight, margin: "0 0 10px" }}>{f.userName ? `@${f.userName} · ` : ""}{f.title}</p>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 12 }}>
                    {f.skills.slice(0, 2).map((s) => <Badge key={s}>{s}</Badge>)}
                  </div>
                  <p className="tn-body" style={{ fontSize: 12, color: C.slate, display: "flex", alignItems: "center", gap: 4, margin: 0 }}>
                    <MapPin size={11} /> {f.city || campusObj?.city || "—"} · {projectCounts[f.id] || 0} {projectCounts[f.id] === 1 ? "project" : "projects"}
                  </p>
                  {statusBreakdown.length > 0 && (
                    <div className="tn-body" style={{ display: "flex", flexWrap: "wrap", gap: "4px 12px", marginTop: 10, fontSize: 11.5, color: C.slate }}>
                      {statusBreakdown.map((s) => (
                        <span key={s} style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
                          <StatusDot status={s} /> {s}: {byStatus[s]}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}