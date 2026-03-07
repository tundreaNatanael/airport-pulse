import { supabase } from "./client.js";

function assertTable(table) {
  if (!table || typeof table !== "string") {
    throw new Error("A valid table name is required.");
  }
}

export async function retrieveRows(
  table,
  { columns = "*", filters = {}, limit } = {},
) {
  assertTable(table);

  let query = supabase.from(table).select(columns);

  for (const [column, value] of Object.entries(filters)) {
    query = query.eq(column, value);
  }

  if (typeof limit === "number") {
    query = query.limit(limit);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(
      `Failed to retrieve rows from "${table}": ${error.message}`,
    );
  }

  return data;
}

export async function pushRows(table, values) {
  assertTable(table);

  const { data, error } = await supabase.from(table).insert(values).select();

  if (error) {
    throw new Error(`Failed to insert rows into "${table}": ${error.message}`);
  }

  return data;
}
