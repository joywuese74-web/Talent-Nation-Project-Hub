import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { CheckCircle2, ExternalLink, Eye, FolderKanban, Heart, MessageSquare, Pencil, Plus, Sparkles, Trash2, Users } from "lucide-react";
import { Avatar, Badge, GhostButton, PrimaryButton, StatusDot } from "../components/ui";
import { C } from "../lib/theme";
import { CAMPUSES } from "../lib/data";
import { ProjectComments } from "../components/ProjectComments";
import { fetchCommentCounts } from "../lib/comments";

/* -------------------------------- fellow dashboard ------------------------------- */

export function FellowDashboard({ go, openProject, onEdit, onProjectDeleted, session, profile, isMentor, headRequest, isOwner, pendingHeadCount, discordLink, discordNotice, connectingDiscord, onConnectDiscord, onDismissDiscordNotice }) {
  const [myProjects, setMyProjects] = useState([]);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [openComments, setOpenComments] = useState(null);
  const [commentCounts, setCommentCounts] = useState({});
  const [deletingId, setDeletingId] = useState(null);

  const handleDelete = async (p) => {
    const sure = window.confirm(`Delete "${p.title}"? This can't be undone.`);
    if (!sure) return;
    setDeletingId(p.id);
    const { error } = await supabase.from("projects").delete().eq("id", p.id).eq("created_by", session.user.id);
    setDeletingId(null);
    if (error) {
      window.alert(`Couldn't delete that project: ${error.message}`);
      return;
    }
    setMyProjects((cur) => cur.filter((row) => row.id !== p.id));
    onProjectDeleted?.();
  };

  // Load this fellow's real submitted projects (there's no "submit a
  // project" form wired up yet, so this will show 0 until that's built).
  useEffect(() => {
    if (!session) return;
    supabase
      .from("projects")
      .select("*")
      .eq("created_by", session.user.id)
      .then(({ data, error }) => {
        setLoadingProjects(false);
        if (error) {
          console.error("Failed to load your projects:", error);
          return;
        }
        setMyProjects(data || []);
        fetchCommentCounts((data || []).filter((p) => !p.is_portfolio).map((p) => p.id)).then(setCommentCounts);
      });
  }, [session]);

  const displayName = profile?.full_name || session?.user?.email || "Fellow";
  const firstName = displayName.split(" ")[0].split("@")[0];
  const totalViews = myProjects.reduce((s, p) => s + (p.views || 0), 0);
  const stats = [
    ["Total projects", myProjects.length, FolderKanban],
    ["Project views", totalViews.toLocaleString(), Eye],
    ["Likes", 0, Heart],
    ["Profile views", 0, Users],
  ];

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "40px 24px 96px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 32, flexWrap: "wrap", gap: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <Avatar name={displayName} size={54} hue={C.teal} photo={profile?.avatar_url} />
          <div>
            <p className="tn-display" style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>Welcome back, {firstName}</p>
            <p className="tn-body" style={{ fontSize: 13, color: C.slateLight, margin: 0 }}>{(isMentor ? (profile?.title || "Mentor") : "Fellow")}{profile?.campus_id ? "" : " · No campus set yet"}</p>
          </div>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          {isOwner && (
            <GhostButton onClick={() => go("headRequests")}>
              <Users size={14} /> Head requests{pendingHeadCount > 0 ? ` (${pendingHeadCount})` : ""}
            </GhostButton>
          )}
          {isMentor && <GhostButton onClick={() => go("review")}><Sparkles size={14} /> Review submissions</GhostButton>}
          <GhostButton onClick={() => go("editProfile")}><Pencil size={14} /> Edit profile</GhostButton>
          <PrimaryButton onClick={() => { onEdit?.(null); go("submit"); }}><Plus size={15} /> {isMentor ? "Upload portfolio" : "Submit a project"}</PrimaryButton>
        </div>
      </div>

      {headRequest?.status === "pending" && (
        <div className="tn-body" style={{ background: C.goldPale, border: `1px solid ${C.gold}`, borderRadius: 12, padding: "14px 18px", fontSize: 13.5, marginBottom: 24 }}>
          <b>Head of Campus request pending.</b> Your request to lead {CAMPUSES.find((c) => c.dbId === headRequest.campus_id)?.name || "your campus"} is waiting for approval from the Talent Nation team. Until then you have a regular account.
        </div>
      )}
      {headRequest?.status === "rejected" && (
        <div className="tn-body" style={{ background: C.dangerPale, border: `1px solid ${C.danger}`, borderRadius: 12, padding: "14px 18px", fontSize: 13.5, marginBottom: 24 }}>
          Your Head of Campus request wasn't approved. You still have a full account and can take part as a fellow.
        </div>
      )}

      {discordNotice && (
        <div className="tn-body" style={{ background: discordNotice.ok ? C.tealPale : C.dangerPale, border: `1px solid ${discordNotice.ok ? C.teal : C.danger}`, borderRadius: 12, padding: "14px 18px", fontSize: 13.5, marginBottom: 24, display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
          <span>{discordNotice.text}</span>
          <button onClick={onDismissDiscordNotice} aria-label="Dismiss" style={{ background: "none", border: "none", cursor: "pointer", color: C.slate, fontSize: 18, lineHeight: 1 }}>×</button>
        </div>
      )}
      {discordLink && !discordLink.connected && (
        <div style={{ background: "#5865F2", color: C.white, borderRadius: 14, padding: "18px 22px", marginBottom: 24, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 14 }}>
          <div style={{ flex: "1 1 320px" }}>
            <p className="tn-display" style={{ fontSize: 16, fontWeight: 700, margin: "0 0 4px" }}>Get your notifications on Discord</p>
            <p className="tn-body" style={{ fontSize: 13.5, margin: 0, opacity: 0.9, lineHeight: 1.5 }}>
              Connect your Discord account and we'll add you to the Talent Nation server automatically, so you hear about your projects right away.
            </p>
          </div>
          <button
            onClick={onConnectDiscord}
            disabled={connectingDiscord}
            className="tn-body"
            style={{ background: C.white, color: "#5865F2", border: "none", borderRadius: 10, padding: "11px 18px", fontWeight: 700, fontSize: 14, cursor: connectingDiscord ? "wait" : "pointer" }}
          >
            {connectingDiscord ? "Connecting…" : "Connect Discord"}
          </button>
        </div>
      )}
      {discordLink?.connected && (
        <p className="tn-body" style={{ fontSize: 12.5, color: C.slateLight, margin: "-8px 0 20px", display: "flex", alignItems: "center", gap: 6 }}>
          <CheckCircle2 size={14} color={C.teal} /> Discord connected{discordLink.username ? ` as @${discordLink.username}` : ""}. You'll get notifications there.
        </p>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 40 }}>
        {stats.map(([label, val, Icon]) => (
          <div key={label} style={{ border: `1px solid ${C.line}`, borderRadius: 14, padding: 18 }}>
            <Icon size={16} color={C.teal} style={{ marginBottom: 8 }} />
            <p className="tn-display" style={{ fontSize: 22, fontWeight: 700, margin: "0 0 2px" }}>{val}</p>
            <p className="tn-body" style={{ fontSize: 12, color: C.slateLight, margin: 0 }}>{label}</p>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <p className="tn-display" style={{ fontSize: 17, fontWeight: 700, margin: 0 }}>{isMentor ? "Your portfolio" : "Your projects"}</p>
      </div>
      {loadingProjects ? (
        <p className="tn-body" style={{ fontSize: 13.5, color: C.slateLight }}>Loading…</p>
      ) : myProjects.length === 0 ? (
        <div style={{ border: `1px dashed ${C.line}`, borderRadius: 14, padding: 32, textAlign: "center" }}>
          <p className="tn-body" style={{ fontSize: 13.5, color: C.slateLight, margin: "0 0 14px" }}>
            {isMentor ? "You haven't uploaded any portfolio work yet." : "You haven't submitted a project yet."}
          </p>
          <GhostButton small onClick={() => { onEdit?.(null); go("submit"); }}><Plus size={13} /> {isMentor ? "Upload your first portfolio item" : "Submit your first project"}</GhostButton>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {myProjects.map((p) => (
            <div key={p.id} style={{ border: `1px solid ${C.line}`, borderRadius: 12, padding: 16 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
              {isMentor && (
                <div
                  onClick={() => openProject(p.id)}
                  style={{ cursor: "pointer", width: 200, aspectRatio: "16 / 9", borderRadius: 10, overflow: "hidden", background: C.paperDeep, border: `1px solid ${C.line}`, flexShrink: 0 }}
                >
                  {p.cover_image_url && <img src={p.cover_image_url} alt={p.title} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />}
                </div>
              )}
              <div style={{ cursor: "pointer", flex: isMentor ? "1 1 220px" : undefined }} onClick={() => openProject(p.id)}>
                <p className="tn-display" style={{ fontWeight: 700, fontSize: 14.5, margin: "0 0 3px" }}>{p.title}</p>
                <p className="tn-body" style={{ fontSize: 12.5, color: C.slateLight, margin: 0, display: "flex", alignItems: "center", gap: 6 }}>
                  <StatusDot status={p.status} /> {p.status} · {(p.views || 0).toLocaleString()} views
                </p>
                <div style={{ marginTop: 8 }}>
                  {p.is_portfolio ? (
                    <Badge tone="neutral">Portfolio · shown on your profile</Badge>
                  ) : p.approved ? (
                    <Badge tone="teal">Approved · live on Explore</Badge>
                  ) : p.rejected ? (
                    <Badge tone="danger">Declined</Badge>
                  ) : (
                    <Badge tone="gold">Waiting for review</Badge>
                  )}
                </div>
                {p.rejected && !p.approved && !p.is_portfolio && (
                  <p className="tn-body" style={{ fontSize: 12.5, color: C.slate, margin: "8px 0 0", maxWidth: 480, lineHeight: 1.5 }}>
                    {p.rejection_reason ? `Mentor's note: ${p.rejection_reason}. ` : ""}Edit it and save to send it back for review.
                  </p>
                )}
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {isMentor && (
                  <PrimaryButton
                    small
                    onClick={() => (p.demo_url ? window.open(p.demo_url, "_blank", "noopener,noreferrer") : openProject(p.id))}
                  >
                    <ExternalLink size={13} /> View
                  </PrimaryButton>
                )}
                {!p.is_portfolio && (
                  <GhostButton small onClick={() => setOpenComments((cur) => (cur === p.id ? null : p.id))}>
                    <MessageSquare size={13} /> Mentor feedback{commentCounts[p.id] ? ` (${commentCounts[p.id]})` : ""}
                  </GhostButton>
                )}
                <GhostButton small onClick={() => { onEdit?.(p.id); go("submit"); }}><Pencil size={13} /> Edit</GhostButton>
                <GhostButton
                  small
                  disabled={deletingId === p.id}
                  style={{ color: C.danger, borderColor: "#F0D3D3" }}
                  onClick={() => handleDelete(p)}
                >
                  <Trash2 size={13} />
                </GhostButton>
              </div>
            </div>
            {openComments === p.id && (
              <ProjectComments
                project={p}
                onCountChange={(n) => setCommentCounts((cur) => ({ ...cur, [p.id]: n }))}
              />
            )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
