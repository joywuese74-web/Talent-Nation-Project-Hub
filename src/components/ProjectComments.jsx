import { useEffect, useState } from "react";
import { Send, Trash2 } from "lucide-react";
import { supabase } from "../supabaseClient";
import { C } from "../lib/theme";
import { Avatar, Badge, PrimaryButton } from "./ui";

// Conversation between a fellow and their campus mentors about one project.
// The database decides who may read or write (see migrations/002_project_comments.sql).
export function ProjectComments({ project, onCountChange }) {
  const [me, setMe] = useState(null);
  const [comments, setComments] = useState([]);
  const [people, setPeople] = useState({});
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setMe(data.session?.user?.id || null));
  }, []);

  const loadPeople = async (ids) => {
    const missing = ids.filter((id) => !people[id]);
    if (missing.length === 0) return;
    const { data } = await supabase.from("profiles").select("id, full_name, avatar_url").in("id", missing);
    setPeople((cur) => {
      const next = { ...cur };
      (data || []).forEach((p) => { next[p.id] = p; });
      return next;
    });
  };

  useEffect(() => {
    supabase
      .from("project_comments")
      .select("id, author_id, body, created_at")
      .eq("project_id", project.id)
      .order("created_at", { ascending: true })
      .then(({ data, error: loadError }) => {
        setLoading(false);
        if (loadError) {
          setError("Comments aren't available yet. Please try again later.");
          return;
        }
        setComments(data || []);
        loadPeople(Array.from(new Set((data || []).map((c) => c.author_id))));
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project.id]);

  const send = async (e) => {
    e.preventDefault();
    const body = text.trim();
    if (!body) return;
    setSending(true);
    setError("");
    const { data, error: sendError } = await supabase
      .from("project_comments")
      .insert({ project_id: project.id, body })
      .select("id, author_id, body, created_at")
      .single();
    setSending(false);
    if (sendError) {
      setError(`Couldn't send your comment: ${sendError.message}`);
      return;
    }
    const next = [...comments, data];
    setComments(next);
    setText("");
    loadPeople([data.author_id]);
    onCountChange?.(next.length);
  };

  const remove = async (c) => {
    if (!window.confirm("Delete this comment?")) return;
    const { error: delError } = await supabase.from("project_comments").delete().eq("id", c.id);
    if (delError) {
      setError(`Couldn't delete: ${delError.message}`);
      return;
    }
    const next = comments.filter((x) => x.id !== c.id);
    setComments(next);
    onCountChange?.(next.length);
  };

  const when = (iso) =>
    new Date(iso).toLocaleString(undefined, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

  return (
    <div style={{ borderTop: `1px solid ${C.line}`, marginTop: 14, paddingTop: 14 }}>
      {loading ? (
        <p className="tn-body" style={{ fontSize: 13, color: C.slateLight, margin: 0 }}>Loading comments…</p>
      ) : (
        <>
          {comments.length === 0 && !error && (
            <p className="tn-body" style={{ fontSize: 13, color: C.slateLight, margin: "0 0 12px" }}>
              No comments yet. Start the conversation below.
            </p>
          )}
          <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 12 }}>
            {comments.map((c) => {
              const person = people[c.author_id];
              const isFellow = c.author_id === project.created_by;
              return (
                <div key={c.id} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                  <Avatar name={person?.full_name || "?"} size={30} hue={isFellow ? C.gold : C.teal} photo={person?.avatar_url} />
                  <div style={{ flex: 1, background: isFellow ? C.paperDeep : C.tealPale, borderRadius: 12, padding: "10px 12px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 4 }}>
                      <span className="tn-body" style={{ fontSize: 13, fontWeight: 700, color: C.ink }}>{person?.full_name || "Member"}</span>
                      <Badge tone={isFellow ? "gold" : "teal"}>{isFellow ? "Fellow" : "Mentor"}</Badge>
                      <span className="tn-body" style={{ fontSize: 11.5, color: C.slateLight }}>{when(c.created_at)}</span>
                      {c.author_id === me && (
                        <button
                          onClick={() => remove(c)}
                          aria-label="Delete comment"
                          title="Delete comment"
                          style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer", color: C.slateLight, display: "flex" }}
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                    <p className="tn-body" style={{ fontSize: 13.5, color: C.slate, margin: 0, lineHeight: 1.55, whiteSpace: "pre-wrap" }}>{c.body}</p>
                  </div>
                </div>
              );
            })}
          </div>
          <form onSubmit={send} style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Write a comment…"
              rows={2}
              maxLength={2000}
              className="tn-body"
              style={{ flex: 1, padding: "10px 12px", borderRadius: 10, border: `1px solid ${C.line}`, fontSize: 13.5, resize: "vertical", fontFamily: "inherit" }}
            />
            <PrimaryButton small disabled={sending || !text.trim()}>
              <Send size={13} /> {sending ? "Sending…" : "Send"}
            </PrimaryButton>
          </form>
          {error && <p className="tn-body" style={{ fontSize: 12.5, color: C.danger, margin: "8px 0 0" }}>{error}</p>}
        </>
      )}
    </div>
  );
}
