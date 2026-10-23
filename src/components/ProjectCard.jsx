import { Bookmark, Eye, Heart, User, Users } from "lucide-react";
import { fellowName, getCampus } from "../lib/data";
import { C } from "../lib/theme";
import { Badge, GhostButton, StatusDot } from "./ui";

/* -------------------------------- project card ------------------------------- */

export function ProjectCard({ project, onOpen, liked, bookmarked, onLike, onBookmark, big }) {
  const campus = getCampus(project.campusId);
  const collaborators = project.collaborators || [];
  const isTeam = project.teamType === "Team" || collaborators.length > 1;

  const teamDisplay = collaborators.length > 0
    ? collaborators.map((c) => c.name + (c.role ? ` (${c.role})` : "")).join(" · ")
    : (project.fellowIds || []).map(fellowName).join(", ");

  return (
    <div
      style={{
        background: C.white, borderRadius: 16, border: `1px solid ${C.line}`,
        overflow: "hidden", display: "flex", flexDirection: "column", height: "100%",
      }}
    >
      <div
        onClick={() => onOpen(project.id)}
        style={{
          height: big ? 200 : 130, cursor: "pointer",
          background: project.cover
            ? `linear-gradient(to top, rgba(27,16,146,0.75), rgba(27,16,146,0.15)), url(${project.cover}) center/cover`
            : `linear-gradient(135deg, ${C.ink} 0%, ${C.inkSoft} 100%)`,
          position: "relative", display: "flex", alignItems: "flex-end", padding: 16,
        }}
      >
        <div style={{ position: "absolute", top: 14, right: 14, display: "flex", gap: 6 }}>
          {isTeam && (
            <Badge tone="teal" style={{ background: "rgba(255,255,255,0.92)", color: C.ink, boxShadow: "0 2px 6px rgba(0,0,0,0.15)" }}>
              <Users size={11} /> Team
            </Badge>
          )}
          <Badge tone="gold">{project.category}</Badge>
        </div>
        <p className="tn-display" style={{ color: "rgba(255,255,255,0.9)", fontSize: big ? 22 : 17, fontWeight: 700, margin: 0, maxWidth: "80%" }}>
          {project.title}
        </p>
      </div>
      <div style={{ padding: 18, display: "flex", flexDirection: "column", flex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8, fontSize: 12.5 }} className="tn-body">
          <StatusDot status={project.status} />
          <span style={{ color: C.slate, fontWeight: 600 }}>{project.status}</span>
          <span style={{ color: C.slateLight }}>·</span>
          <span style={{ color: C.slateLight }}>{campus?.city}</span>
        </div>
        <p className="tn-body" style={{ fontSize: 13.5, color: C.slate, lineHeight: 1.55, margin: "0 0 10px", flex: 1 }}>
          {project.shortDesc}
        </p>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 12, flexWrap: "wrap", fontSize: 12 }} className="tn-body">
          <span style={{ display: "inline-flex", alignItems: "center", gap: 4, color: C.slateLight, fontWeight: 600 }}>
            {isTeam ? <Users size={13} color={C.teal} /> : <User size={13} color={C.slateLight} />}
            <span>{isTeam ? "Team:" : "By:"}</span>
          </span>
          <span style={{ color: C.slate, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "85%" }} title={teamDisplay}>
            {teamDisplay}
          </span>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 14 }}>
          {project.technologies.slice(0, 3).map((t) => (
            <Badge key={t}>{t}</Badge>
          ))}
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "auto", paddingTop: 12, borderTop: `1px solid ${C.line}` }}>
          <div style={{ display: "flex", gap: 12, fontSize: 12.5, color: C.slateLight }} className="tn-body">
            <span style={{ display: "flex", alignItems: "center", gap: 4 }}><Eye size={13} /> {project.views.toLocaleString()}</span>
            <span style={{ display: "flex", alignItems: "center", gap: 4 }}><Heart size={13} /> {project.likes + (liked ? 1 : 0)}</span>
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            <button onClick={() => onLike(project.id)} aria-label="Like project" style={{ border: "none", background: liked ? C.dangerPale : C.paperDeep, borderRadius: 8, width: 30, height: 30, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
              <Heart size={14} color={liked ? C.danger : C.slate} fill={liked ? C.danger : "none"} />
            </button>
            <button onClick={() => onBookmark(project.id)} aria-label="Bookmark project" style={{ border: "none", background: bookmarked ? C.goldPale : C.paperDeep, borderRadius: 8, width: 30, height: 30, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
              <Bookmark size={14} color={bookmarked ? C.goldDeep : C.slate} fill={bookmarked ? C.goldDeep : "none"} />
            </button>
            <GhostButton small onClick={() => onOpen(project.id)}>View</GhostButton>
          </div>
        </div>
      </div>
    </div>
  );
}
