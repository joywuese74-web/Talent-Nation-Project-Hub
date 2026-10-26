import { useEffect, useRef, useState } from "react";
import { supabase } from "./supabaseClient";
import { fetchAll } from "./lib/fetchAll";
import { DISCORD_FUNCTION } from "./lib/constants";
import { ANCHORS, CAMPUSES, PROJECTS, fellowName, fellowsByCampus, getCampus } from "./lib/data";
import { C, FONTS } from "./lib/theme";
import { NavBar } from "./components/NavBar";
import { HomePage } from "./pages/HomePage";
import { ExplorePage } from "./pages/ExplorePage";
import { ProjectDetailPage } from "./pages/ProjectDetailPage";
import { FellowsPage } from "./pages/FellowsPage";
import { FellowProfilePage } from "./pages/FellowProfilePage";
import { CampusesPage } from "./pages/CampusesPage";
import { CodingMentorsPage } from "./pages/CodingMentorsPage";
import { CampusDetailPage } from "./pages/CampusDetailPage";
import { AnchorsPage } from "./pages/AnchorsPage";
import { AnchorDetailPage } from "./pages/AnchorDetailPage";
import { AboutPage } from "./pages/AboutPage";
import { AuthPage } from "./pages/AuthPage";
import { FellowDashboard } from "./pages/FellowDashboard";
import { HeadRequestsPage } from "./pages/HeadRequestsPage";
import { ReviewPage } from "./pages/ReviewPage";
import { EditProfilePage } from "./pages/EditProfilePage";
import { AdminDashboard } from "./pages/AdminDashboard";
import { SubmitProjectPage } from "./pages/SubmitProjectPage";
import { Footer } from "./components/Footer";

/* ------------------------------------- app -------------------------------------- */

export default function App() {
  const [view, setView] = useState("home");
  const [selectedId, setSelectedId] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [liked, setLiked] = useState(new Set());
  const [bookmarked, setBookmarked] = useState(new Set());
  const [, forceRerender] = useState(0);

  // session = the logged-in Supabase Auth user (null when logged out).
  // profile = that user's row in our own "profiles" table (name, role, etc.).
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [editingProjectId, setEditingProjectId] = useState(null);

  // On first load, check if there's already a logged-in session (e.g. the
  // person refreshed the page). Then keep listening for login/logout events.
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));

    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  // Whenever the session changes, load (or clear) the matching profile row.
  const fetchProfile = () => {
    if (!session) {
      setProfile(null);
      return;
    }
    supabase
      .from("profiles")
      .select("*")
      .eq("id", session.user.id)
      .single()
      .then(({ data, error }) => {
        if (error) {
          console.error("Failed to load profile:", error);
          return;
        }
        setProfile(data);
      });
  };
  useEffect(fetchProfile, [session]);

  // Signup can't save the Discord username directly (there's no session yet
  // if email confirmation is on), so copy it from the signup details into the
  // private table the first time the person is logged in.
  useEffect(() => {
    const fromSignup = session?.user?.user_metadata?.discord_username;
    if (!session || !fromSignup) return;
    supabase
      .from("member_private")
      .select("user_id")
      .eq("user_id", session.user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (!data) {
          supabase
            .from("member_private")
            .upsert({ user_id: session.user.id, discord_username: fromSignup })
            .then(() => {});
        }
      });
  }, [session]);

  // ---- Discord connect: one click links the account and joins the TN server ----
  const [discordLink, setDiscordLink] = useState(null); // { connected, username }
  const [discordNotice, setDiscordNotice] = useState(null); // { ok, text }
  const [connectingDiscord, setConnectingDiscord] = useState(false);
  const discordCallbackDone = useRef(false);

  const fetchDiscordLink = () => {
    if (!session) { setDiscordLink(null); return; }
    supabase
      .from("member_private")
      .select("discord_user_id, discord_username")
      .eq("user_id", session.user.id)
      .maybeSingle()
      .then(({ data }) => setDiscordLink({ connected: !!data?.discord_user_id, username: data?.discord_username || "" }));
  };
  useEffect(fetchDiscordLink, [session]);

  const discordRedirectUri = () => `${window.location.origin}/`;

  const startDiscordConnect = async () => {
    setDiscordNotice(null);
    setConnectingDiscord(true);
    const { data, error } = await supabase.functions.invoke(DISCORD_FUNCTION, { body: { action: "discord_config" } });
    if (error || !data?.ok) {
      setConnectingDiscord(false);
      setDiscordNotice({ ok: false, text: data?.message || "Couldn't start the Discord connection. Please try again later." });
      return;
    }
    const state = Math.random().toString(36).slice(2) + Date.now().toString(36);
    try { sessionStorage.setItem("tn_discord_state", state); } catch (e) { /* private mode: state check is skipped */ }
    const params = new URLSearchParams({
      client_id: data.client_id,
      response_type: "code",
      redirect_uri: discordRedirectUri(),
      scope: "identify guilds.join",
      state,
    });
    window.location.href = `https://discord.com/oauth2/authorize?${params.toString()}`;
  };

  // Coming back from Discord: the address bar has ?code=...&state=...
  useEffect(() => {
    if (!session || discordCallbackDone.current) return;
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    const state = params.get("state");
    const denied = params.get("error");
    // Only Discord sends back a "state"; this keeps us from touching other
    // links that also use ?code= (for example Supabase email links).
    if (!state || (!code && !denied)) return;
    discordCallbackDone.current = true;
    window.history.replaceState({}, "", window.location.pathname);
    setView("dashboard");
    if (denied) {
      setDiscordNotice({ ok: false, text: "Discord connection was cancelled. You can try again any time." });
      return;
    }
    let saved = null;
    try { saved = sessionStorage.getItem("tn_discord_state"); sessionStorage.removeItem("tn_discord_state"); } catch (e) { /* ignore */ }
    if (saved && saved !== state) {
      setDiscordNotice({ ok: false, text: "That Discord sign-in didn't match. Please click Connect Discord again." });
      return;
    }
    setConnectingDiscord(true);
    supabase.functions
      .invoke(DISCORD_FUNCTION, { body: { action: "discord_connect", code, redirect_uri: discordRedirectUri() } })
      .then(({ data, error }) => {
        setConnectingDiscord(false);
        if (error || !data) {
          setDiscordNotice({ ok: false, text: "Couldn't connect Discord. Please try again." });
          return;
        }
        setDiscordNotice({ ok: !!data.ok, text: data.message });
        fetchDiscordLink();
      });
  }, [session]);

  // Which campuses is the logged-in person a mentor (or Head) of?
  const [myMentorships, setMyMentorships] = useState([]);
  const fetchMyMentorships = () => {
    if (!session) {
      setMyMentorships([]);
      return;
    }
    supabase
      .from("campus_mentors")
      .select("campus_id, is_head")
      .eq("user_id", session.user.id)
      .then(({ data, error }) => {
        if (error) {
          console.error("Failed to load mentorships:", error);
          return;
        }
        setMyMentorships(data || []);
      });
  };
  useEffect(fetchMyMentorships, [session]);

  // Head-of-Campus signup requests: the person's own request, and (for the
  // site owner only) how many are waiting for a decision.
  const [headRequest, setHeadRequest] = useState(null);
  const [isOwner, setIsOwner] = useState(false);
  const [pendingHeadCount, setPendingHeadCount] = useState(0);

  const fetchHeadRequest = () => {
    if (!session) { setHeadRequest(null); return; }
    supabase
      .from("head_requests")
      .select("*")
      .eq("user_id", session.user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .then(({ data }) => setHeadRequest((data && data[0]) || null));
  };
  useEffect(fetchHeadRequest, [session]);

  const fetchOwnerInfo = () => {
    if (!session) { setIsOwner(false); setPendingHeadCount(0); return; }
    supabase
      .from("site_owners")
      .select("user_id")
      .eq("user_id", session.user.id)
      .maybeSingle()
      .then(({ data }) => {
        const owner = !!data;
        setIsOwner(owner);
        if (!owner) { setPendingHeadCount(0); return; }
        supabase
          .from("head_requests")
          .select("id", { count: "exact", head: true })
          .eq("status", "pending")
          .then(({ count }) => setPendingHeadCount(count || 0));
      });
  };
  useEffect(fetchOwnerInfo, [session]);

  // Signing up as a Head of Campus files a request (once) the first time the
  // person is logged in.
  const filingHeadRequest = useRef(null);
  useEffect(() => {
    const meta = session?.user?.user_metadata;
    if (!session || !profile || meta?.member_type !== "head") return;
    // This effect can run twice in quick succession (session + profile load);
    // the flag makes sure only one request is filed per page load.
    if (filingHeadRequest.current === session.user.id) return;
    filingHeadRequest.current = session.user.id;
    supabase
      .from("head_requests")
      .select("id")
      .eq("user_id", session.user.id)
      .limit(1)
      .then(({ data }) => {
        if (data && data.length > 0) return;
        const campus = CAMPUSES.find((c) => c.id === meta.requested_campus);
        if (!campus) { filingHeadRequest.current = null; return; }
        supabase
          .from("head_requests")
          .insert({ user_id: session.user.id, campus_id: campus.dbId, note: meta.head_note || null })
          .then(({ error }) => {
            // 23505 = the database already has a pending request: that's fine.
            if (error && error.code !== "23505") { console.error("Failed to file Head request:", error); return; }
            fetchHeadRequest();
          });
      });
  }, [session, profile?.id, CAMPUSES.length]);

  // A "mentor" is anyone who signed up as one, or who a Head added to a campus.
  const isMentorUser = profile?.member_type === "mentor" || myMentorships.length > 0;

  // The Fellow/Mentor choice made at signup travels in the signup details;
  // copy it onto the profile once the profile exists.
  useEffect(() => {
    const chosen = session?.user?.user_metadata?.member_type;
    if (!session || !profile || chosen !== "mentor" || profile.member_type === "mentor") return;
    supabase
      .from("profiles")
      .update({ member_type: "mentor" })
      .eq("id", session.user.id)
      .then(({ error }) => {
        if (error) { console.error("Failed to save member type:", error); return; }
        fetchProfile();
        fetchFellows();
      });
  }, [session, profile?.id, profile?.member_type]);

  const role = !session ? "visitor" : (profile?.role === "administrator" || profile?.role === "super_administrator") ? "admin" : "fellow";
  const displayName = profile?.full_name || session?.user?.email;
  const handleLogout = () => supabase.auth.signOut();

  // If someone logs out while on a fellow/admin-only page, send them home.
  useEffect(() => {
    if (role === "visitor" && ["dashboard", "admin", "submit", "editProfile", "review", "headRequests"].includes(view)) {
      setView("home");
    }
  }, [role, view]);

  // Load real campuses from Supabase and swap them into the CAMPUSES array
  // that the rest of the app already reads from.
  useEffect(() => {
    supabase
      .from("campuses")
      .select("*")
      .order("name")
      .then(({ data, error }) => {
        if (error) {
          console.error("Failed to load campuses from database:", error);
          return;
        }
        const hues = [C.gold, C.teal];
        const live = data.map((row, i) => ({
          id: row.slug,
          dbId: row.id,
          name: row.name,
          city: row.city,
          country: row.country,
          desc: row.description,
          fellowCount: fellowsByCampus(row.slug).length,
          hue: hues[i % hues.length],
        }));
        CAMPUSES.splice(0, CAMPUSES.length, ...live);
        forceRerender((n) => n + 1);
      });
  }, []);

  // Load real anchors (founder/co-founders) from Supabase and swap them
  // into the ANCHORS array that the rest of the app already reads from.
  useEffect(() => {
    supabase
      .from("anchors")
      .select("*")
      .eq("active", true)
      .order("display_order")
      .then(({ data, error }) => {
        if (error) {
          console.error("Failed to load anchors from database:", error);
          return;
        }
        const live = data.map((row) => ({
          id: row.slug,
          name: row.name,
          role: row.role,
          tag: row.tag,
          photo: row.photo_url,
          shortBio: row.short_bio,
          background: row.background,
          expertise: row.expertise || [],
          contribution: row.contribution,
          vision: row.vision,
          linkedin: row.linkedin_url,
          gallery: row.gallery || [],
        }));
        ANCHORS.splice(0, ANCHORS.length, ...live);
        forceRerender((n) => n + 1);
      });
  }, []);

  // Load the most recently submitted real projects, for the home page
  // Spotlight section. Visitors who aren't logged in only ever see approved
  // ones here (the database enforces that, not this code).
  // Load real fellows (every signed-up user who isn't an admin) for the
  // Fellows directory and fellow profile pages, plus a project count per
  // fellow so cards can show "X projects" without a separate query each.
  const [fellows, setFellows] = useState([]);
  const [loadingFellows, setLoadingFellows] = useState(true);
  const [projectCounts, setProjectCounts] = useState({});
  // Per-fellow counts by project status, e.g. { [userId]: { Completed: 2, Ongoing: 1 } }.
  const [projectStatusCounts, setProjectStatusCounts] = useState({});
  const [allProjectsLite, setAllProjectsLite] = useState([]);

  // Real per-campus totals (by campus slug) for the home page, the campuses
  // list and the campus pages.
  const campusStats = { fellows: {}, projects: {}, totalFellows: fellows.filter((f) => !f.isMentor).length, totalProjects: allProjectsLite.length };
  fellows.forEach((f) => { if (f.campusId && !f.isMentor) campusStats.fellows[f.campusId] = (campusStats.fellows[f.campusId] || 0) + 1; });
  allProjectsLite.forEach((p) => {
    const c = CAMPUSES.find((x) => x.dbId === p.campus_id);
    if (c) campusStats.projects[c.id] = (campusStats.projects[c.id] || 0) + 1;
  });

  // Turn a row from the "profiles" table into the shape the pages use.
  const mapProfileRow = (row, mentorIds) => {
    const campus = CAMPUSES.find((c) => c.dbId === row.campus_id);
    const isMentor = row.member_type === "mentor" || mentorIds.has(row.id);
    return {
      id: row.id,
      name: row.full_name || "Fellow",
      userName: row.user_name || null,
      avatarUrl: row.avatar_url || null,
      isMentor,
      title: isMentor ? (row.title || "Mentor") : "Fellow",
      city: row.city || "",
      campusId: campus?.id || null,
      skills: row.skills || [],
      bio: row.bio || "",
      linkedin: row.linkedin_url || null,
      github: row.github_url || null,
    };
  };

  const fetchFellows = () => {
    // fetchAll loads in batches, so there is no 1,000-person limit.
    Promise.all([
      fetchAll(() => supabase.from("profiles").select("*").order("id")),
      fetchAll(() => supabase.from("campus_mentors").select("user_id").order("user_id")),
    ]).then(([{ data, error }, mentorRes]) => {
        const mentorIds = new Set((mentorRes.data || []).map((m) => m.user_id));
        setLoadingFellows(false);
        if (error) {
          console.error("Failed to load fellows:", error);
          return;
        }
        const mapped = (data || [])
          .filter((row) => row.role !== "administrator" && row.role !== "super_administrator")
          .map((row) => mapProfileRow(row, mentorIds));
        setFellows(mapped);
      });

    fetchAll(() =>
      supabase
        .from("projects")
        .select("id, created_by, campus_id, status")
        .eq("is_portfolio", false)
        .order("id"),
    ).then(({ data, error }) => {
        if (error) {
          console.error("Failed to load project counts:", error);
          return;
        }
        setAllProjectsLite(data || []);
        const counts = {};
        const statusCounts = {};
        (data || []).forEach((row) => {
          if (!row.created_by) return;
          counts[row.created_by] = (counts[row.created_by] || 0) + 1;
          if (row.status) {
            const byStatus = statusCounts[row.created_by] || (statusCounts[row.created_by] = {});
            byStatus[row.status] = (byStatus[row.status] || 0) + 1;
          }
        });
        setProjectCounts(counts);
        setProjectStatusCounts(statusCounts);
      });
  };
  useEffect(fetchFellows, []);

  const [recentProjects, setRecentProjects] = useState([]);
  const mapProjectRow = (row) => {
    const campus = CAMPUSES.find((c) => c.dbId === row.campus_id);
    const mockMatch = PROJECTS.find((p) => p.id === row.id || p.id === row.slug);
    const rawCollaborators = row.collaborators || mockMatch?.collaborators || [];
    const collaborators = rawCollaborators.length > 0 ? rawCollaborators : (
      (row.fellow_ids || mockMatch?.fellowIds || []).map((fid) => ({
        id: fid,
        name: fellowName(fid),
        role: "",
      }))
    );
    const fellowIds = row.fellow_ids || (collaborators.map((c) => c.id || c.fellowId).filter(Boolean).length > 0
      ? collaborators.map((c) => c.id || c.fellowId).filter(Boolean)
      : mockMatch?.fellowIds || (row.created_by ? [row.created_by] : []));
    const teamType = row.team_type || mockMatch?.teamType || (collaborators.length > 1 ? "Team" : "Individual");

    return {
      id: row.id,
      title: row.title,
      campusId: campus?.id || mockMatch?.campusId || null,
      fellowIds,
      collaborators,
      teamType,
      category: row.category || mockMatch?.category || "",
      technologies: row.technologies || mockMatch?.technologies || [],
      status: row.status || mockMatch?.status || "Ongoing",
      year: row.year || mockMatch?.year || new Date().getFullYear(),
      views: row.views || mockMatch?.views || 0,
      likes: mockMatch?.likes || 0,
      shortDesc: row.short_description || mockMatch?.shortDesc || "",
      problem: row.problem_statement || mockMatch?.problem || "",
      solution: row.solution || mockMatch?.solution || "",
      objectives: row.objectives || mockMatch?.objectives || "",
      audience: row.target_audience || mockMatch?.audience || "",
      challenges: mockMatch?.challenges || "",
      results: mockMatch?.results || "",
      impact: mockMatch?.impact || "",
      future: mockMatch?.future || "",
      github: row.github_url || mockMatch?.github || "#",
      demo: row.demo_url || mockMatch?.demo || "#",
      cover: row.cover_image_url || mockMatch?.cover || null,
      createdAt: row.created_at || null,
      createdBy: row.created_by || null,
    };
  };

  // Projects shown on Explore: only ones a campus mentor has approved.
  const [exploreProjects, setExploreProjects] = useState([]);
  const [loadingExplore, setLoadingExplore] = useState(true);
  const fetchExploreProjects = () => {
    supabase
      .from("projects")
      .select("*")
      .eq("approved", true)
      .eq("is_portfolio", false)
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        setLoadingExplore(false);
        if (error) {
          console.error("Failed to load projects for Explore:", error);
          return;
        }
        setExploreProjects((data || []).map(mapProjectRow));
      });
  };
  useEffect(() => {
    if (view === "explore") fetchExploreProjects();
  }, [view]);

  const fetchRecentProjects = () => {
    supabase
      .from("projects")
      .select("*")
      .eq("approved", true)
      .eq("is_portfolio", false)
      .order("created_at", { ascending: false })
      .limit(6)
      .then(({ data, error }) => {
        if (error) {
          console.error("Failed to load recent projects:", error);
          return;
        }
        setRecentProjects((data || []).map(mapProjectRow));
      });
  };
  useEffect(() => {
    fetchRecentProjects();
  }, []);

  // If the project someone is viewing isn't already in PROJECTS or
  // recentProjects (e.g. an older submission that fell off the top-6 list),
  // fetch it directly by id so "View" never shows a blank page.
  const [fetchedProject, setFetchedProject] = useState(null);
  useEffect(() => {
    if (view !== "project" || !selectedId) return;
    const already =
      PROJECTS.find((p) => p.id === selectedId) ||
      recentProjects.find((p) => p.id === selectedId) ||
      exploreProjects.find((p) => p.id === selectedId);
    if (already) {
      setFetchedProject(null);
      return;
    }
    supabase
      .from("projects")
      .select("*")
      .eq("id", selectedId)
      .single()
      .then(({ data, error }) => {
        if (error) {
          console.error("Failed to load project:", error);
          setFetchedProject(null);
          return;
        }
        setFetchedProject(mapProjectRow(data));
      });
  }, [view, selectedId, recentProjects, exploreProjects]);

  const go = (v, id) => {
    setView(v);
    if (id) setSelectedId(id);
    setMobileOpen(false);
    window.scrollTo?.(0, 0);
  };
  const openProject = (id) => go("project", id);
  const openFellow = (id) => go("fellow", id);

  // If a profile isn't in the loaded list (e.g. opened from a link before the
  // list finished loading), load that one person straight from the database.
  const [fetchedFellow, setFetchedFellow] = useState(null);
  useEffect(() => {
    if (view !== "fellow" || !selectedId) return;
    if (fellows.some((f) => f.id === selectedId)) return;
    if (fetchedFellow?.id === selectedId) return;
    Promise.all([
      supabase.from("profiles").select("*").eq("id", selectedId).maybeSingle(),
      supabase.from("campus_mentors").select("user_id").eq("user_id", selectedId),
    ]).then(([{ data, error }, mentorRes]) => {
      if (error || !data) {
        if (error) console.error("Failed to load profile:", error);
        return;
      }
      setFetchedFellow(mapProfileRow(data, new Set((mentorRes.data || []).map((m) => m.user_id))));
    });
  }, [view, selectedId, fellows, fetchedFellow?.id]);
  const openAnchor = (id) => go("anchor", id);

  const toggleSet = (setter) => (id) => setter((cur) => {
    const next = new Set(cur);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });
  const onLike = toggleSet(setLiked);
  const onBookmark = toggleSet(setBookmarked);

  const project =
    PROJECTS.find((p) => p.id === selectedId) ||
    recentProjects.find((p) => p.id === selectedId) ||
    exploreProjects.find((p) => p.id === selectedId) ||
    (fetchedProject?.id === selectedId ? fetchedProject : null);
  const fellow =
    fellows.find((f) => f.id === selectedId) ||
    (fetchedFellow?.id === selectedId ? fetchedFellow : null);
  const campus = getCampus(selectedId);
  const anchor = ANCHORS.find((a) => a.id === selectedId);

  return (
    <div className="tn-body" style={{ background: C.paper, minHeight: "100vh" }}>
      <style>{FONTS}</style>
      <NavBar view={view} go={go} role={role} displayName={displayName} avatarUrl={profile?.avatar_url} onLogout={handleLogout} mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} isMentor={isMentorUser} />

      {view === "home" && <HomePage go={go} openProject={openProject} liked={liked} bookmarked={bookmarked} onLike={onLike} onBookmark={onBookmark} recentProjects={recentProjects} campusStats={campusStats} />}
      {view === "explore" && <ExplorePage go={go} openProject={openProject} liked={liked} bookmarked={bookmarked} onLike={onLike} onBookmark={onBookmark} projects={exploreProjects} loading={loadingExplore} />}
      {view === "project" && <ProjectDetailPage project={project} go={go} openFellow={openFellow} liked={liked} bookmarked={bookmarked} onLike={onLike} onBookmark={onBookmark} allFellows={fellows} />}
      {view === "fellows" && <FellowsPage go={go} openFellow={openFellow} fellows={fellows} projectCounts={projectCounts} projectStatusCounts={projectStatusCounts} loadingFellows={loadingFellows} />}
      {view === "fellow" && <FellowProfilePage fellow={fellow} go={go} openProject={openProject} />}
      {view === "campuses" && <CampusesPage go={go} campusStats={campusStats} />}
      {view === "mentors" && <CodingMentorsPage openFellow={openFellow} allFellows={fellows} />}
      {view === "campus" && <CampusDetailPage campus={campus} go={go} openFellow={openFellow} openProject={openProject} allFellows={fellows} myMentorships={myMentorships} onMentorsChanged={fetchMyMentorships} />}
      {view === "anchors" && <AnchorsPage go={go} openAnchor={openAnchor} />}
      {view === "anchor" && <AnchorDetailPage anchor={anchor} go={go} />}
      {view === "about" && <AboutPage go={go} />}
      {view === "login" && <AuthPage mode="login" go={go} />}
      {view === "signup" && <AuthPage mode="signup" go={go} />}
      {view === "dashboard" && <FellowDashboard go={go} openProject={openProject} onEdit={setEditingProjectId} onProjectDeleted={fetchRecentProjects} session={session} profile={profile} isMentor={isMentorUser} headRequest={headRequest} isOwner={isOwner} pendingHeadCount={pendingHeadCount} discordLink={discordLink} discordNotice={discordNotice} connectingDiscord={connectingDiscord} onConnectDiscord={startDiscordConnect} onDismissDiscordNotice={() => setDiscordNotice(null)} />}
      {view === "headRequests" && isOwner && (
        <HeadRequestsPage
          go={go}
          openFellow={openFellow}
          onChanged={() => { fetchOwnerInfo(); fetchMyMentorships(); fetchProfile(); fetchFellows(); }}
        />
      )}
      {view === "review" && (
        <ReviewPage
          go={go}
          openProject={openProject}
          myMentorships={myMentorships}
          onChanged={() => { fetchRecentProjects(); fetchFellows(); }}
        />
      )}
      {view === "editProfile" && (
        <EditProfilePage
          isMentor={isMentorUser}
          go={go}
          session={session}
          profile={profile}
          onSaved={() => { fetchProfile(); fetchFellows(); }}
        />
      )}
      {view === "admin" && <AdminDashboard />}
      {view === "submit" && (
        <SubmitProjectPage
          go={go}
          session={session}
          onSubmitted={() => { fetchRecentProjects(); setEditingProjectId(null); }}
          editId={editingProjectId}
          isMentor={isMentorUser}
          profile={profile}
          mentorCampusId={myMentorships[0]?.campus_id || null}
          allFellows={fellows}
        />
      )}

      <Footer go={go} />
    </div>
  );
}