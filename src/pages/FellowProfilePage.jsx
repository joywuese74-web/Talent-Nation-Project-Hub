import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { fetchAll } from "../lib/fetchAll";
import { ArrowLeft, Code2, Link2, MapPin } from "lucide-react";
import { CAMPUSES, getCampus } from "../lib/data";
import { Avatar, Badge, GhostButton, PhotoLightbox } from "../components/ui";
import { C } from "../lib/theme";

export function FellowProfilePage({ fellow, go, openProject }) {
  const [projects, setProjects] = useState([]);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [showPhoto, setShowPhoto] = useState(false);
  const [roles, setRoles] = useState([]);

  useEffect(() => {
    if (!fellow) return;
    supabase
      .from("campus_mentors")
      .select("is_head, campus_id")
      .eq("user_id", fellow.id)
      .then(({ data, error }) => {
        if (error) { console.error("Failed to load roles:", error); return; }
        setRoles(data || []);
      });
  }, [fellow?.id]);

  useEffect(() => {
    if (!fellow) return;
    setLoadingProjects(true);
    // fetchAll loads in batches, so projects beyond the first 1,000 are included.
    fetchAll(() => supabase.from("projects").select("*").order("id"))
      .then(({ data, error }) => {
        setLoadingProjects(false);
        if (error) {
          console.error("Failed to load this fellow's projects:", error);
          return;
        }
        const filtered = (data || []).filter(
          (p) =>
            p.created_by === fellow.id ||
            p.fellow_ids?.includes(fellow.id) ||
            p.collaborators?.some((c) => c.id === fellow.id || c.name?.toLowerCase() === fellow.name?.toLowerCase())
        );
        setProjects(filtered);
      });
  }, [fellow?.id, fellow?.name]);

  if (!fellow) return null;
  const campus = getCampus(fellow.campusId);
  const skills = fellow.skills || [];

  return (
    <div style={{ maxWidth: 1000, margin: "0 auto", padding: "40px 24px 96px" }}>
      <GhostButton small onClick={() => go("fellows")} style={{ marginBottom: 24 }}><ArrowLeft size={14} /> Back to fellows</GhostButton>
      <div style={{ display: "flex", gap: 24, marginBottom: 36, flexWrap: "wrap" }}>
        <div
          onClick={() => fellow.avatarUrl && setShowPhoto(true)}
          style={{ cursor: fellow.avatarUrl ? "zoom-in" : "default" }}
          title={fellow.avatarUrl ? "Click to view full picture" : undefined}
        >
          <Avatar name={fellow.name} size={160} hue={campus?.hue || C.teal} photo={fellow.avatarUrl} />
        </div>
        {showPhoto && <PhotoLightbox src={fellow.avatarUrl} onClose={() => setShowPhoto(false)} />}
        <div style={{ flex: 1, minWidth: 260 }}>
          <h1 className="tn-display" style={{ fontSize: 28, fontWeight: 700, margin: "0 0 4px" }}>{fellow.name}</h1>
          {fellow.userName && <p className="tn-body" style={{ fontSize: 13, color: C.slateLight, margin: "0 0 4px" }}>@{fellow.userName}</p>}
          <p className="tn-body" style={{ fontSize: 15, color: C.teal, fontWeight: 600, margin: "0 0 10px" }}>{fellow.title}</p>
          {roles.map((r, i) => {
            const rc = CAMPUSES.find((c) => c.dbId === r.campus_id);
            return (
              <p key={i} className="tn-body" style={{ display: "inline-block", fontSize: 12.5, fontWeight: 700, color: C.ink, background: C.gold, borderRadius: 999, padding: "4px 12px", margin: "0 8px 10px 0" }}>
                {r.is_head ? "Head of Campus" : "Coding Mentor"}{rc ? ` · ${rc.name}` : ""}
              </p>
            );
          })}
          <p className="tn-body" style={{ fontSize: 13.5, color: C.slate, display: "flex", alignItems: "center", gap: 6, margin: "0 0 14px" }}>
            <MapPin size={13} /> {fellow.city || "—"} {campus && <><span style={{ color: C.slateLight }}>·</span> {campus.name}</>}
          </p>
          <div style={{ display: "flex", gap: 8 }}>
            {fellow.linkedin && <GhostButton small onClick={() => window.open(fellow.linkedin, "_blank")}><Link2 size={14} /> LinkedIn</GhostButton>}
            {fellow.github && <GhostButton small onClick={() => window.open(fellow.github, "_blank")}><Code2 size={14} /> GitHub</GhostButton>}
          </div>
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 32 }}>
        <div>
          <p className="tn-display" style={{ fontSize: 15, fontWeight: 700, margin: "0 0 10px" }}>About</p>
          <p className="tn-body" style={{ fontSize: 14, color: C.slate, lineHeight: 1.7, marginBottom: 32 }}>{fellow.bio || "This fellow hasn't added a bio yet."}</p>
          <p className="tn-display" style={{ fontSize: 15, fontWeight: 700, margin: "0 0 16px" }}>Projects ({projects.length})</p>
          {loadingProjects ? (
            <p className="tn-body" style={{ fontSize: 13.5, color: C.slateLight }}>Loading…</p>
          ) : projects.length === 0 ? (
            <p className="tn-body" style={{ fontSize: 13.5, color: C.slateLight }}>No projects submitted yet.</p>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              {projects.map((p) => {
                const userCollab = p.collaborators?.find((c) => c.id === fellow.id || c.name?.toLowerCase() === fellow.name?.toLowerCase());
                return (
                  <div key={p.id} onClick={() => openProject(p.id)} style={{ cursor: "pointer", border: `1px solid ${C.line}`, borderRadius: 14, padding: 16, background: C.white }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8, marginBottom: 4 }}>
                      <p className="tn-display" style={{ fontWeight: 700, fontSize: 14, margin: 0, color: C.ink }}>{p.title}</p>
                      {userCollab?.role && (
                        <span style={{ fontSize: 11, background: C.goldPale, color: C.goldDeep, padding: "2px 6px", borderRadius: 6, fontWeight: 600, flexShrink: 0 }}>
                          {userCollab.role}
                        </span>
                      )}
                    </div>
                    <p className="tn-body" style={{ fontSize: 12.5, color: C.slateLight, margin: 0 }}>{p.category} · {p.status}</p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        <div>
          <div style={{ border: `1px solid ${C.line}`, borderRadius: 16, padding: 20 }}>
            <p className="tn-display" style={{ fontSize: 13.5, fontWeight: 700, margin: "0 0 12px" }}>Skills</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {skills.length > 0 ? skills.map((s) => <Badge key={s} tone="teal">{s}</Badge>) : (
                <p className="tn-body" style={{ fontSize: 13, color: C.slateLight, margin: 0 }}>No skills listed yet.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
