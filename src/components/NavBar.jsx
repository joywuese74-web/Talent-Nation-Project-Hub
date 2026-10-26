import { Menu, X } from "lucide-react";
import { C } from "../lib/theme";
import { Avatar, GhostButton, PrimaryButton } from "./ui";

/* ---------------------------------- navbar ---------------------------------- */

export function NavBar({ view, go, role, displayName, avatarUrl, onLogout, mobileOpen, setMobileOpen, isMentor }) {
  const links = [
    ["home", "Home"],
    ["explore", "Explore projects"],
    ["fellows", "Fellows"],
    ["campuses", "Campuses"],
    ["mentors", "Coding Mentors"],
    ["anchors", "Meet the anchors"],
    ["about", "About"],
  ];
  return (
    <div style={{ position: "sticky", top: 0, zIndex: 50, background: C.white, borderBottom: `1px solid ${C.line}` }}>
      <div style={{ maxWidth: 1440, margin: "0 auto", padding: "0 24px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 68 }}>
        <div onClick={() => go("home")} style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
          <img src="/logo.png" alt="Talent Nation" style={{ height: 36, width: "auto", display: "block" }} />
          <div>
            <p className="tn-display" style={{ margin: 0, fontSize: 15.5, fontWeight: 700, color: C.ink, lineHeight: 1.1 }}>Talent Nation</p>
            <p className="tn-body" style={{ margin: 0, fontSize: 10.5, fontWeight: 600, color: C.slateLight, letterSpacing: 0.3 }}>Project Hub</p>
          </div>
        </div>

        <div className="tn-body" style={{ display: "flex", gap: 4 }}>
          {links.map(([key, label]) => (
            <button
              key={key}
              onClick={() => go(key)}
              style={{
                display: window.innerWidth < 900 ? "none" : "inline-block",
                border: "none", cursor: "pointer",
                padding: "8px 12px", borderRadius: 8, fontSize: 13.5, fontWeight: 600,
                color: view === key ? C.ink : C.slate,
                background: view === key ? C.paperDeep : "transparent",
              }}
            >
              {label}
            </button>
          ))}
        </div>

        <div style={{ display: window.innerWidth < 900 ? "none" : "flex", alignItems: "center", gap: 8 }}>
          {role === "visitor" ? (
            <>
              <GhostButton small onClick={() => go("login")}>Log in</GhostButton>
              <PrimaryButton small onClick={() => go("signup")}>Sign up</PrimaryButton>
            </>
          ) : (
            <>
              <PrimaryButton small onClick={() => go("submit")}>{isMentor ? "Upload portfolio" : "Submit a project"}</PrimaryButton>
              <button
                onClick={() => go(role === "admin" ? "admin" : "dashboard")}
                style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center" }}
                aria-label="Open dashboard"
              >
                <Avatar name={displayName || "Fellow"} size={34} hue={C.teal} photo={avatarUrl} />
              </button>
              <GhostButton small onClick={onLogout}>Log out</GhostButton>
            </>
          )}
        </div>

        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          style={{ display: window.innerWidth < 900 ? "flex" : "none", background: "none", border: "none", cursor: "pointer" }}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {mobileOpen && (
        <div className="tn-body" style={{ borderTop: `1px solid ${C.line}`, padding: 16, display: "flex", flexDirection: "column", gap: 4 }}>
          {links.map(([key, label]) => (
            <button
              key={key}
              onClick={() => { go(key); setMobileOpen(false); }}
              style={{ textAlign: "left", background: "none", border: "none", padding: "10px 8px", fontSize: 14.5, fontWeight: 600, color: C.ink, cursor: "pointer" }}
            >
              {label}
            </button>
          ))}
          <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
            {role === "visitor" ? (
              <>
                <GhostButton small onClick={() => { go("login"); setMobileOpen(false); }}>Log in</GhostButton>
                <PrimaryButton small onClick={() => { go("signup"); setMobileOpen(false); }}>Sign up</PrimaryButton>
              </>
            ) : (
              <>
                <PrimaryButton small onClick={() => { go("submit"); setMobileOpen(false); }}>{isMentor ? "Upload portfolio" : "Submit a project"}</PrimaryButton>
                <GhostButton small onClick={() => { onLogout(); setMobileOpen(false); }}>Log out</GhostButton>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
