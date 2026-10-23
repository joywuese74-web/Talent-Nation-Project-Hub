import { ArrowLeft, Bookmark, Code2, ExternalLink, FileText, Globe, Heart, PlayCircle, Share2, User, Users } from "lucide-react";
import { fellowName, getCampus } from "../lib/data";
import { Avatar, Badge, GhostButton, PrimaryButton, StatusDot } from "../components/ui";
import { C } from "../lib/theme";

/* -------------------------------- project detail -------------------------------- */

export function ProjectDetailPage({ project, go, openFellow, liked, bookmarked, onLike, onBookmark, allFellows = [] }) {
  if (!project) return null;
  const campus = getCampus(project.campusId);
  const isLiked = liked.has(project.id);
  const isBookmarked = bookmarked.has(project.id);

  // Normalize collaborators list
  const collaborators = (project.collaborators && project.collaborators.length > 0)
    ? project.collaborators
    : (project.fellowIds || []).map((fid) => {
        const found = allFellows.find((f) => f.id === fid);
        return {
          id: fid,
          name: found?.name || fellowName(fid),
          role: found?.title || "",
        };
      });

  const isTeam = project.teamType === "Team" || collaborators.length > 1;

  const fields = [
    ["Problem statement", project.problem],
    ["Proposed solution", project.solution],
    ["Objectives", project.objectives],
    ["Target audience", project.audience],
    ["Challenges", project.challenges],
    ["Results", project.results],
    ["Impact", project.impact],
    ["Future plans", project.future],
  ];

  return (
    <div style={{ maxWidth: 1000, margin: "0 auto", padding: "40px 24px 96px" }}>
      <GhostButton small onClick={() => go("explore")} style={{ marginBottom: 24 }}><ArrowLeft size={14} /> Back to projects</GhostButton>

      <div style={{
        borderRadius: 20,
        background: project.cover
          ? `linear-gradient(to top, rgba(27,16,146,0.9), rgba(27,16,146,0.55)), url(${project.cover}) center/cover`
          : `linear-gradient(135deg, ${C.ink}, ${C.inkSoft})`,
        padding: 40, marginBottom: 32,
      }}>
        <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}>
          <Badge tone="gold">{project.category}</Badge>
          <Badge tone="ink" style={{ border: "1px solid rgba(255,255,255,0.25)" }}><StatusDot status={project.status} /> {project.status}</Badge>
          <Badge tone="ink" style={{ border: "1px solid rgba(255,255,255,0.25)" }}>{project.year}</Badge>
          {isTeam ? (
            <Badge tone="teal" style={{ background: "rgba(255,255,255,0.2)", color: C.white, border: "1px solid rgba(255,255,255,0.3)" }}>
              <Users size={12} /> Team Project ({collaborators.length})
            </Badge>
          ) : (
            <Badge tone="neutral" style={{ background: "rgba(255,255,255,0.15)", color: C.white, border: "1px solid rgba(255,255,255,0.2)" }}>
              <User size={12} /> Individual Project
            </Badge>
          )}
        </div>
        <h1 className="tn-display" style={{ color: C.white, fontSize: 34, fontWeight: 700, margin: "0 0 12px" }}>{project.title}</h1>
        <p className="tn-body" style={{ color: "rgba(255,255,255,0.7)", fontSize: 15, maxWidth: 640, lineHeight: 1.6, margin: "0 0 24px" }}>{project.shortDesc}</p>
        
        {/* Collaborators row in header banner */}
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap", alignItems: "center" }}>
          {collaborators.map((c, idx) => (
            <button
              key={c.id || idx}
              onClick={() => c.id && openFellow(c.id)}
              style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.2)",
                borderRadius: 999, padding: "5px 12px 5px 6px", cursor: c.id ? "pointer" : "default",
                transition: "background 0.2s ease",
              }}
              onMouseEnter={(e) => { if (c.id) e.currentTarget.style.background = "rgba(255,255,255,0.22)"; }}
              onMouseLeave={(e) => { if (c.id) e.currentTarget.style.background = "rgba(255,255,255,0.12)"; }}
            >
              <Avatar name={c.name} size={28} hue={C.gold} />
              <div style={{ textAlign: "left" }}>
                <span className="tn-body" style={{ color: C.white, fontSize: 13, fontWeight: 600, display: "block", lineHeight: 1.2 }}>
                  {c.name}
                </span>
                {c.role && (
                  <span className="tn-body" style={{ color: "rgba(255,255,255,0.75)", fontSize: 11, display: "block" }}>
                    {c.role}
                  </span>
                )}
              </div>
            </button>
          ))}
          <span className="tn-body" style={{ color: "rgba(255,255,255,0.5)", fontSize: 13 }}>· {campus?.name}</span>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 32 }}>
        <div>
          <p className="tn-body" style={{ fontSize: 15, color: C.slate, lineHeight: 1.7, marginBottom: 32 }}>{project.solution} {project.problem}</p>
          {fields.map(([label, val]) => (
            <div key={label} style={{ marginBottom: 22 }}>
              <p className="tn-display" style={{ fontSize: 14.5, fontWeight: 700, color: C.ink, margin: "0 0 6px" }}>{label}</p>
              <p className="tn-body" style={{ fontSize: 14, color: C.slate, lineHeight: 1.65, margin: 0 }}>{val}</p>
            </div>
          ))}

          <div style={{ marginTop: 32, padding: 20, borderRadius: 14, background: C.paper, border: `1px solid ${C.line}` }}>
            <p className="tn-display" style={{ fontSize: 14, fontWeight: 700, margin: "0 0 12px" }}>Media</p>
            <div style={{ display: "flex", gap: 12 }}>
              <div style={{ flex: 1, background: C.white, borderRadius: 10, padding: 14, display: "flex", alignItems: "center", gap: 8, border: `1px solid ${C.line}` }}>
                <PlayCircle size={16} color={C.teal} /> <span className="tn-body" style={{ fontSize: 12.5, color: C.slate }}>Demo video</span>
              </div>
              <div style={{ flex: 1, background: C.white, borderRadius: 10, padding: 14, display: "flex", alignItems: "center", gap: 8, border: `1px solid ${C.line}` }}>
                <FileText size={16} color={C.teal} /> <span className="tn-body" style={{ fontSize: 12.5, color: C.slate }}>Project deck</span>
              </div>
            </div>
          </div>
        </div>

        <div>
          {/* Action box */}
          <div style={{ border: `1px solid ${C.line}`, borderRadius: 16, padding: 20, marginBottom: 16 }}>
            <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
              <PrimaryButton small onClick={() => onLike(project.id)} style={{ flex: 1, justifyContent: "center", background: isLiked ? C.dangerPale : C.gold, color: isLiked ? C.danger : C.ink }}>
                <Heart size={14} fill={isLiked ? C.danger : "none"} /> {project.likes + (isLiked ? 1 : 0)}
              </PrimaryButton>
              <GhostButton small onClick={() => onBookmark(project.id)} style={{ borderColor: isBookmarked ? C.goldDeep : C.line }}>
                <Bookmark size={14} fill={isBookmarked ? C.goldDeep : "none"} color={isBookmarked ? C.goldDeep : C.ink} />
              </GhostButton>
              <GhostButton small><Share2 size={14} /></GhostButton>
            </div>
            <p className="tn-body" style={{ fontSize: 12, color: C.slateLight, textAlign: "center", margin: 0 }}>{project.views.toLocaleString()} views</p>
          </div>

          {/* Team & Collaborators Card */}
          <div style={{ border: `1px solid ${C.line}`, borderRadius: 16, padding: 20, marginBottom: 16, background: C.white }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {isTeam ? <Users size={16} color={C.teal} /> : <User size={16} color={C.teal} />}
                <p className="tn-display" style={{ fontSize: 14, fontWeight: 700, margin: 0, color: C.ink }}>
                  {isTeam ? "Team Collaborators" : "Project Creator"}
                </p>
              </div>
              <Badge tone={isTeam ? "gold" : "neutral"} style={{ fontSize: 11 }}>
                {collaborators.length} {collaborators.length === 1 ? "member" : "members"}
              </Badge>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {collaborators.map((c, i) => {
                const foundFellow = allFellows.find((f) => f.id === c.id);
                return (
                  <div
                    key={c.id || i}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "10px 12px",
                      borderRadius: 12,
                      background: C.paper,
                      border: `1px solid ${C.line}`,
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                      <Avatar name={c.name} size={36} hue={i % 2 === 0 ? C.teal : C.gold} photo={foundFellow?.avatarUrl} />
                      <div style={{ minWidth: 0 }}>
                        <p className="tn-body" style={{ fontSize: 13.5, fontWeight: 600, color: C.ink, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {c.name}
                        </p>
                        {c.role ? (
                          <span
                            className="tn-body"
                            style={{
                              fontSize: 11.5,
                              color: C.goldDeep,
                              background: C.goldPale,
                              padding: "2px 7px",
                              borderRadius: 6,
                              fontWeight: 600,
                              display: "inline-block",
                              marginTop: 2,
                            }}
                          >
                            {c.role}
                          </span>
                        ) : (
                          <span className="tn-body" style={{ fontSize: 11.5, color: C.slateLight, display: "block" }}>
                            Contributor
                          </span>
                        )}
                      </div>
                    </div>
                    {c.id && (
                      <button
                        onClick={() => openFellow(c.id)}
                        className="tn-body"
                        style={{
                          background: "none",
                          border: `1px solid ${C.line}`,
                          borderRadius: 8,
                          padding: "4px 8px",
                          fontSize: 11,
                          fontWeight: 600,
                          color: C.teal,
                          cursor: "pointer",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 3,
                          flexShrink: 0,
                          marginLeft: 8,
                        }}
                      >
                        Profile <ExternalLink size={10} />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div style={{ border: `1px solid ${C.line}`, borderRadius: 16, padding: 20, marginBottom: 16 }}>
            <p className="tn-display" style={{ fontSize: 13.5, fontWeight: 700, margin: "0 0 12px" }}>Links</p>
            {[["Github repository", Code2, project.github], ["Live demo", Globe, project.demo]]
              .filter(([, , url]) => url && url !== "#")
              .map(([label, Icon, url], i) => (
                <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="tn-body" style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: C.teal, textDecoration: "none", padding: "8px 0", borderTop: i > 0 ? `1px solid ${C.line}` : "none" }}>
                  <Icon size={14} /> {label}
                </a>
              ))}
            {(!project.github || project.github === "#") && (!project.demo || project.demo === "#") && (
              <p className="tn-body" style={{ fontSize: 13, color: C.slate, margin: 0 }}>No links added yet.</p>
            )}
          </div>

          <div style={{ border: `1px solid ${C.line}`, borderRadius: 16, padding: 20 }}>
            <p className="tn-display" style={{ fontSize: 13.5, fontWeight: 700, margin: "0 0 12px" }}>Technologies</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {project.technologies.map((t) => <Badge key={t}>{t}</Badge>)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

