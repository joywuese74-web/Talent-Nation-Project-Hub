import { supabase } from "../supabaseClient";

// How many comments each project has: { [projectId]: count }.
// Returns {} quietly if the comments table hasn't been created yet.
export async function fetchCommentCounts(projectIds) {
  if (!projectIds || projectIds.length === 0) return {};
  const { data, error } = await supabase
    .from("project_comments")
    .select("project_id")
    .in("project_id", projectIds);
  if (error) return {};
  const counts = {};
  (data || []).forEach((row) => { counts[row.project_id] = (counts[row.project_id] || 0) + 1; });
  return counts;
}
