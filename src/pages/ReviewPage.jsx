import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { ArrowLeft, MessageSquare, XCircle } from "lucide-react";
import { CAMPUSES } from "../lib/data";
import { C } from "../lib/theme";
import { GhostButton, PrimaryButton, SectionHeading } from "../components/ui";
import { ProjectComments } from "../components/ProjectComments";
import { fetchCommentCounts } from "../lib/comments";

/* ------------------------------------- review submissions -------------------------------------- */

// Where Heads of Campus and Coding Mentors approve (or hide) projects that
// fellows submitted under their campus. The database enforces who is allowed.
export function ReviewPage({ go, openProject, myMentorships, onChanged }) {
  const [rows, setRows] = useState([]);
  const [names, setNames] = useState({});
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState("");
  const [openComments, setOpenComments] = useState(null);
  const [commentCounts, setCommentCounts] = useState({});

  const campusIds = myMentorships.map((m) => m.campus_id);

  const load = () => {
    if (campusIds.length === 0) {
      setLoading(false);
      return;
    }
    supabase
      .from("projects")
      .select("*")
      .in("campus_id", campusIds)
      .eq("is_portfolio", false)
      .order("created_at", { ascending: false })
      .then(async ({ data, error: loadError }) => {
        setLoading(false);
        if (loadError) {
          setError(loadError.message);
          return;
        }
        const list = data || [];
        setRows(list);
        fetchCommentCounts(list.map((p) => p.id)).then(setCommentCounts);
        const ids = Array.from(new Set(list.map((p) => p.created_by).filter(Boolean)));
        if (ids.length > 0) {
          const { data: profs } = await supabase.from("profiles").select("id, full_name").in("id", ids);
          const map = {};
          (profs || []).forEach((p) => { map[p.id] = p.full_name; });
          setNames(map);
        }
      });
  };
  useEffect(load, [campusIds.join(",")]);

  // action: "approve" | "reject" | "hide". Fellows get a Discord DM about
  // approvals and declines from the database + Edge Function, not from here.
  const review = async (p, action) => {
    let patch;
    if (action === "approve") {
      patch = { approved: true, rejected: false, rejection_reason: null };
    } else if (action === "reject") {
      const reason = window.prompt(
        `Decline "${p.title}"?\n\nOptional: tell the fellow why (they will see this in their Discord message). Leave it blank to skip, or press Cancel to go back.`,
        "",
      );
      if (reason === null) return;
      patch = { approved: false, rejected: true, rejection_reason: reason.trim() || null };
    } else {
      patch = { approved: false };
    }
    setError("");
    setBusyId(p.id);
    const { error: updateError } = await supabase.from("projects").update(patch).eq("id", p.id);
    setBusyId(null);
    if (updateError) {
      setError(updateError.message);
      return;
    }
    setRows((cur) => cur.map((r) => (r.id === p.id ? { ...r, ...patch } : r)));
    onChanged?.();
  };

  const pending = rows.filter((r) => !r.approved && !r.rejected);
  const approved = rows.filter((r) => r.approved);
  const declined = rows.filter((r) => !r.approved && r.rejected);

  const toggleComments = (id) => setOpenComments((cur) => (cur === id ? null : id));

  const renderRow = (p, kind) => {
    const campus = CAMPUSES.find((c) => c.dbId === p.campus_id);
    const count = commentCounts[p.id] || 0;
    return (
      <div key={p.id} style={{ border: `1px solid ${C.line}`, borderRadius: 12, padding: 16 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <div style={{ cursor: "pointer", flex: "1 1 280px" }} onClick={() => openProject(p.id)}>
            <p className="tn-display" style={{ fontWeight: 700, fontSize: 14.5, margin: "0 0 3px" }}>{p.title}</p>
            <p className="tn-body" style={{ fontSize: 12.5, color: C.slateLight, margin: "0 0 4px" }}>
              {names[p.created_by] || "A fellow"} · {campus?.name || "Campus"} · {p.category}
            </p>
            <p className="tn-body" style={{ fontSize: 13, color: C.slate, margin: 0 }}>{p.short_description}</p>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <GhostButton small onClick={() => openProject(p.id)}>View</GhostButton>
            {kind !== "approved" && (
              <GhostButton small onClick={() => toggleComments(p.id)}>
                <MessageSquare size={13} /> Comments{count ? ` (${count})` : ""}
              </GhostButton>
            )}
            {kind === "pending" ? (
              <>
                <GhostButton small disabled={busyId === p.id} style={{ color: C.danger, borderColor: "#F0D3D3" }} onClick={() => review(p, "reject")}>
                  <XCircle size={13} /> Reject
                </GhostButton>
                <PrimaryButton small disabled={busyId === p.id} onClick={() => review(p, "approve")}>
                  {busyId === p.id ? "Saving…" : "Approve"}
                </PrimaryButton>
              </>
            ) : kind === "approved" ? (
              <GhostButton small disabled={busyId === p.id} onClick={() => review(p, "hide")}>Hide from Explore</GhostButton>
            ) : (
              <GhostButton small disabled={busyId === p.id} onClick={() => review(p, "approve")}>Approve instead</GhostButton>
            )}
          </div>
        </div>
        {openComments === p.id && (
          <ProjectComments
            project={p}
            onCountChange={(n) => setCommentCounts((cur) => ({ ...cur, [p.id]: n }))}
          />
        )}
      </div>
    );
  };

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "40px 24px 96px" }}>
      <GhostButton small onClick={() => go("dashboard")} style={{ marginBottom: 24 }}><ArrowLeft size={14} /> Back to dashboard</GhostButton>
      <SectionHeading eyebrow="Mentor tools" title="Review submissions" sub="Approve, decline or comment on projects from your campus. Fellows get a Discord message either way, and approved projects appear on Explore projects right away." />
      {error && <p className="tn-body" style={{ fontSize: 13, color: C.danger }}>{error}</p>}
      {loading ? (
        <p className="tn-body" style={{ fontSize: 13.5, color: C.slateLight }}>Loading…</p>
      ) : campusIds.length === 0 ? (
        <p className="tn-body" style={{ fontSize: 13.5, color: C.slateLight }}>You aren't a mentor for any campus yet.</p>
      ) : (
        <>
          <p className="tn-display" style={{ fontSize: 15, fontWeight: 700, margin: "0 0 12px" }}>Waiting for approval ({pending.length})</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 40 }}>
            {pending.length === 0 ? (
              <p className="tn-body" style={{ fontSize: 13.5, color: C.slateLight }}>Nothing waiting. You're all caught up.</p>
            ) : pending.map((p) => renderRow(p, "pending"))}
          </div>
          <p className="tn-display" style={{ fontSize: 15, fontWeight: 700, margin: "0 0 12px" }}>Approved ({approved.length})</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {approved.map((p) => renderRow(p, "approved"))}
          </div>
          {declined.length > 0 && (
            <>
              <p className="tn-display" style={{ fontSize: 15, fontWeight: 700, margin: "40px 0 12px" }}>Declined ({declined.length})</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {declined.map((p) => renderRow(p, "declined"))}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
