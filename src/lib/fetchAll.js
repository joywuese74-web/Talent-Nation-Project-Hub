// Supabase returns at most 1,000 rows per request by default.
// fetchAll keeps asking for the next batch until everything has arrived.
//
// Usage: const { data, error } = await fetchAll(() =>
//   supabase.from("profiles").select("*").order("id"));
// Always give the query an .order(...) so batches don't overlap.
export async function fetchAll(buildQuery, pageSize = 1000) {
  const rows = [];
  for (let from = 0; ; from += pageSize) {
    const { data, error } = await buildQuery().range(from, from + pageSize - 1);
    if (error) return { data: rows, error };
    rows.push(...(data || []));
    if (!data || data.length < pageSize) break;
  }
  return { data: rows, error: null };
}
