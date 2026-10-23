import { createClient } from "@supabase/supabase-js";
import { CAMPUSES, ANCHORS, FELLOWS, PROJECTS } from "./lib/data";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const isValidSupabaseConfig =
  Boolean(supabaseUrl) &&
  typeof supabaseUrl === "string" &&
  supabaseUrl.startsWith("http") &&
  !supabaseUrl.includes("your-project") &&
  Boolean(supabaseAnonKey) &&
  !supabaseAnonKey.includes("your-anon-key");

function createMockSupabase() {
  const STORAGE_KEY = "tn_hub_mock_db_v2";

  // Initial seed state
  const getInitialStore = () => {
    const campusRows = CAMPUSES.map((c) => ({
      id: c.dbId || `campus-${c.id}`,
      slug: c.id,
      name: c.name,
      city: c.city,
      country: c.country,
      description: c.desc,
    }));

    const anchorRows = ANCHORS.map((a, i) => ({
      id: a.id,
      slug: a.id,
      name: a.name,
      role: a.role,
      tag: a.tag,
      photo_url: a.photo,
      short_bio: a.shortBio,
      background: a.background,
      expertise: a.expertise || [],
      contribution: a.contribution,
      vision: a.vision,
      linkedin_url: a.linkedin,
      gallery: a.gallery || [],
      active: true,
      display_order: i + 1,
    }));

    const profileRows = FELLOWS.map((f, i) => {
      const c = CAMPUSES.find((camp) => camp.id === f.campusId);
      const isLead = i < 4;
      return {
        id: f.id,
        full_name: f.name,
        user_name: f.name.toLowerCase().replace(/\s+/g, ""),
        avatar_url: null,
        member_type: isLead ? "mentor" : "fellow",
        role: i === 0 ? "super_administrator" : "user",
        title: f.title,
        city: f.city,
        campus_id: c?.dbId || `campus-${f.campusId}`,
        skills: f.skills || [],
        bio: f.bio || "",
        linkedin_url: f.linkedin || null,
        github_url: f.github || null,
      };
    });

    const projectRows = PROJECTS.map((p, idx) => {
      const c = CAMPUSES.find((camp) => camp.id === p.campusId);
      return {
        id: p.id,
        title: p.title,
        slug: p.id,
        campus_id: c?.dbId || `campus-${p.campusId}`,
        category: p.category,
        technologies: p.technologies || [],
        status: p.status,
        year: p.year,
        views: p.views || 10,
        short_description: p.shortDesc,
        full_description: p.shortDesc,
        problem_statement: p.problem,
        solution: p.solution,
        objectives: p.objectives,
        target_audience: p.audience,
        github_url: p.github,
        demo_url: p.demo,
        cover_image_url: null,
        created_by: p.fellowIds?.[0] || "amaka-obi",
        collaborators: p.collaborators || [],
        fellow_ids: p.fellowIds || [],
        team_type: p.teamType || (p.collaborators?.length > 1 ? "Team" : "Individual"),
        approved: true,
        rejected: false,
        rejection_reason: null,
        is_portfolio: false,
        created_at: new Date(Date.now() - (PROJECTS.length - idx) * 3600000 * 24).toISOString(),
      };
    });

    return {
      campuses: campusRows,
      anchors: anchorRows,
      profiles: profileRows,
      projects: projectRows,
      campus_mentors: [
        { id: "cm-1", campus_id: "campus-lagos", user_id: "amaka-obi", is_head: true },
        { id: "cm-2", campus_id: "campus-abuja", user_id: "ibrahim-yusuf", is_head: true },
        { id: "cm-3", campus_id: "campus-enugu", user_id: "ngozi-eke", is_head: true },
        { id: "cm-4", campus_id: "campus-kano", user_id: "fatima-sani", is_head: true },
      ],
      head_requests: [
        {
          id: "hr-1",
          user_id: "tunde-bakare",
          campus_id: "campus-lagos",
          note: "Excited to support software engineering and fintech fellows in Yaba.",
          status: "pending",
          created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
          full_name: "Tunde Bakare",
          email: "tunde.bakare@talentnation.dev",
          current_head: "Amaka Obi",
        },
      ],
      site_owners: [{ id: "so-1", user_id: "amaka-obi" }],
      member_private: [
        { user_id: "amaka-obi", discord_user_id: "disc_101", discord_username: "amaka_codes" },
      ],
      storage: {},
    };
  };

  const loadStore = () => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      // Ignore
    }
    const init = getInitialStore();
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(init));
    } catch (e) {}
    return init;
  };

  const saveStore = (data) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {}
  };

  const listeners = new Set();
  let currentSession = null;
  try {
    const savedSession = localStorage.getItem("tn_mock_session");
    if (savedSession) currentSession = JSON.parse(savedSession);
  } catch (e) {}

  const notifyAuthChange = (event, session) => {
    listeners.forEach((fn) => {
      try {
        fn(event, session);
      } catch (err) {
        console.error("Auth listener error:", err);
      }
    });
  };

  return {
    auth: {
      getSession: async () => ({ data: { session: currentSession }, error: null }),
      onAuthStateChange: (callback) => {
        listeners.add(callback);
        return {
          data: {
            subscription: {
              unsubscribe: () => listeners.delete(callback),
            },
          },
        };
      },
      signUp: async ({ email, password, options = {} }) => {
        const store = loadStore();
        const userId = "user-" + Math.random().toString(36).substring(2, 9);
        const meta = options.data || {};
        const campus = CAMPUSES.find((c) => c.id === meta.requested_campus);

        const newProfile = {
          id: userId,
          full_name: meta.full_name || email.split("@")[0],
          user_name: email.split("@")[0],
          avatar_url: null,
          member_type: meta.member_type || "fellow",
          role: "user",
          title: meta.member_type === "mentor" ? "Coding Mentor" : "Fellow",
          city: campus?.city || "Lagos",
          campus_id: campus?.dbId || null,
          skills: ["React", "JavaScript"],
          bio: "",
          linkedin_url: null,
          github_url: null,
        };

        store.profiles.push(newProfile);

        if (meta.discord_username) {
          store.member_private.push({
            user_id: userId,
            discord_user_id: "mock_disc_" + userId,
            discord_username: meta.discord_username,
          });
        }

        if (meta.member_type === "head" && campus) {
          store.head_requests.push({
            id: "hr-" + Math.random().toString(36).substring(2, 8),
            user_id: userId,
            campus_id: campus.dbId,
            note: meta.head_note || "Requesting to lead campus",
            status: "pending",
            created_at: new Date().toISOString(),
            full_name: newProfile.full_name,
            email,
            current_head: null,
          });
        }

        saveStore(store);

        const newSession = {
          user: {
            id: userId,
            email,
            user_metadata: meta,
          },
          access_token: "mock_token_" + Date.now(),
        };

        currentSession = newSession;
        try {
          localStorage.setItem("tn_mock_session", JSON.stringify(newSession));
        } catch (e) {}
        notifyAuthChange("SIGNED_IN", newSession);

        return { data: { user: newSession.user, session: newSession }, error: null };
      },
      signInWithPassword: async ({ email }) => {
        const store = loadStore();
        let profile = store.profiles.find((p) =>
          p.full_name?.toLowerCase() === email.toLowerCase() ||
          p.user_name?.toLowerCase() === email.toLowerCase() ||
          p.id === email
        );

        if (!profile && store.profiles.length > 0) {
          profile = store.profiles[0];
        }

        const userId = profile ? profile.id : "user-demo";
        const session = {
          user: {
            id: userId,
            email,
            user_metadata: {
              full_name: profile?.full_name || email.split("@")[0],
              member_type: profile?.member_type || "fellow",
            },
          },
          access_token: "mock_token_" + Date.now(),
        };

        currentSession = session;
        try {
          localStorage.setItem("tn_mock_session", JSON.stringify(session));
        } catch (e) {}
        notifyAuthChange("SIGNED_IN", session);

        return { data: { user: session.user, session }, error: null };
      },
      signOut: async () => {
        currentSession = null;
        try {
          localStorage.removeItem("tn_mock_session");
        } catch (e) {}
        notifyAuthChange("SIGNED_OUT", null);
        return { error: null };
      },
    },

    from: (table) => {
      let filters = [];
      let sortCol = null;
      let sortAsc = true;
      let limitCount = null;
      let selectFields = "*";
      let countExact = false;
      let isHeadOnly = false;

      const builder = {
        select: (fields = "*", opts = {}) => {
          selectFields = fields;
          if (opts?.count === "exact") countExact = true;
          if (opts?.head) isHeadOnly = true;
          return builder;
        },
        eq: (col, val) => {
          filters.push((row) => row[col] === val);
          return builder;
        },
        in: (col, values) => {
          const set = new Set(values || []);
          filters.push((row) => set.has(row[col]));
          return builder;
        },
        order: (col, opts = {}) => {
          sortCol = col;
          sortAsc = opts.ascending !== false;
          return builder;
        },
        limit: (n) => {
          limitCount = n;
          return builder;
        },
        single: async () => {
          const res = await builder.then((r) => r);
          return {
            data: res.data?.[0] || null,
            error: res.data?.[0] ? null : { message: "No rows found" },
          };
        },
        maybeSingle: async () => {
          const res = await builder.then((r) => r);
          return { data: res.data?.[0] || null, error: null };
        },
        insert: async (records) => {
          const store = loadStore();
          const items = Array.isArray(records) ? records : [records];
          const created = items.map((item) => ({
            id: item.id || `item-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            created_at: new Date().toISOString(),
            ...item,
          }));

          if (!store[table]) store[table] = [];
          store[table].push(...created);
          saveStore(store);

          return { data: Array.isArray(records) ? created : created[0], error: null };
        },
        upsert: async (record) => {
          const store = loadStore();
          if (!store[table]) store[table] = [];
          const idx = store[table].findIndex(
            (r) => (record.id && r.id === record.id) || (record.user_id && r.user_id === record.user_id)
          );
          if (idx >= 0) {
            store[table][idx] = { ...store[table][idx], ...record };
          } else {
            store[table].push({
              id: record.id || `item-${Date.now()}`,
              ...record,
            });
          }
          saveStore(store);
          return { data: record, error: null };
        },
        update: (patch) => {
          return {
            eq: async (col, val) => {
              const store = loadStore();
              if (store[table]) {
                store[table] = store[table].map((row) => {
                  if (row[col] === val) {
                    return { ...row, ...patch };
                  }
                  return row;
                });
                saveStore(store);
              }
              return { data: patch, error: null };
            },
          };
        },
        delete: () => {
          return {
            eq: (col, val) => {
              return {
                eq: async (col2, val2) => {
                  const store = loadStore();
                  if (store[table]) {
                    store[table] = store[table].filter(
                      (row) => !(row[col] === val && row[col2] === val2)
                    );
                    saveStore(store);
                  }
                  return { error: null };
                },
                then: async (resolve) => {
                  const store = loadStore();
                  if (store[table]) {
                    store[table] = store[table].filter((row) => row[col] !== val);
                    saveStore(store);
                  }
                  const res = { error: null };
                  return resolve ? resolve(res) : res;
                },
              };
            },
          };
        },
        then: (resolve) => {
          const store = loadStore();
          let rows = (store[table] || []).slice();

          for (const f of filters) {
            rows = rows.filter(f);
          }

          if (sortCol) {
            rows.sort((a, b) => {
              const av = a[sortCol];
              const bv = b[sortCol];
              if (av === bv) return 0;
              if (av == null) return 1;
              if (bv == null) return -1;
              return sortAsc ? (av > bv ? 1 : -1) : (av < bv ? 1 : -1);
            });
          }

          const count = rows.length;
          if (limitCount != null) {
            rows = rows.slice(0, limitCount);
          }

          let projected = rows;
          if (selectFields && selectFields !== "*" && !isHeadOnly) {
            const keys = selectFields.split(",").map((s) => s.trim());
            projected = rows.map((r) => {
              const res = {};
              keys.forEach((k) => {
                if (r[k] !== undefined) res[k] = r[k];
              });
              return res;
            });
          }

          const result = {
            data: isHeadOnly ? [] : projected,
            count: countExact ? count : undefined,
            error: null,
          };

          return resolve ? resolve(result) : result;
        },
      };

      return builder;
    },

    storage: {
      from: (bucket) => ({
        upload: async (fileName, file) => {
          const store = loadStore();
          if (!store.storage) store.storage = {};
          const fakeUrl = typeof file === "string" ? file : (file ? URL.createObjectURL(file) : "");
          store.storage[fileName] = fakeUrl;
          saveStore(store);
          return { data: { path: fileName }, error: null };
        },
        getPublicUrl: (fileName) => {
          const store = loadStore();
          const savedUrl = store.storage?.[fileName];
          return { data: { publicUrl: savedUrl || `/icons.svg` } };
        },
      }),
    },

    functions: {
      invoke: async (fnName, { body = {} } = {}) => {
        if (body.action === "discord_config") {
          return {
            data: {
              ok: true,
              client_id: "demo_discord_client_id",
            },
            error: null,
          };
        }
        if (body.action === "discord_connect") {
          return {
            data: {
              ok: true,
              message: "Connected to Talent Nation Discord community server successfully!",
            },
            error: null,
          };
        }
        return { data: { ok: true }, error: null };
      },
    },

    rpc: async (fnName, args = {}) => {
      const store = loadStore();
      if (fnName === "list_head_requests") {
        return { data: store.head_requests || [], error: null };
      }
      if (fnName === "approve_head_request") {
        const req = (store.head_requests || []).find((r) => r.id === args.p_request);
        if (req) {
          req.status = "approved";
          // add to campus_mentors
          store.campus_mentors.push({
            id: `cm-${Date.now()}`,
            campus_id: req.campus_id,
            user_id: req.user_id,
            is_head: true,
          });
          const prof = store.profiles.find((p) => p.id === req.user_id);
          if (prof) {
            prof.member_type = "mentor";
            prof.campus_id = req.campus_id;
            prof.title = "Head of Campus";
          }
          saveStore(store);
        }
        return { error: null };
      }
      if (fnName === "reject_head_request") {
        const req = (store.head_requests || []).find((r) => r.id === args.p_request);
        if (req) {
          req.status = "rejected";
          saveStore(store);
        }
        return { error: null };
      }
      if (fnName === "add_campus_mentor") {
        const prof = store.profiles.find((p) =>
          p.user_name?.toLowerCase() === args.p_email?.toLowerCase() ||
          p.id === args.p_email
        );
        if (prof) {
          store.campus_mentors.push({
            id: `cm-${Date.now()}`,
            campus_id: args.p_campus,
            user_id: prof.id,
            is_head: false,
          });
          prof.member_type = "mentor";
          saveStore(store);
          return { error: null };
        }
        return { error: { message: "Fellow with that email was not found." } };
      }
      if (fnName === "remove_campus_mentor") {
        store.campus_mentors = (store.campus_mentors || []).filter(
          (m) => !(m.campus_id === args.p_campus && m.user_id === args.p_user)
        );
        saveStore(store);
        return { error: null };
      }
      if (fnName === "delete_my_account") {
        return { error: null };
      }
      return { data: null, error: null };
    },
  };
}

let client;
if (isValidSupabaseConfig) {
  try {
    client = createClient(supabaseUrl, supabaseAnonKey);
  } catch (e) {
    console.warn("Could not connect to live Supabase, using mock store:", e);
    client = createMockSupabase();
  }
} else {
  client = createMockSupabase();
}

export const supabase = client;