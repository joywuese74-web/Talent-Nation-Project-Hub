-- Migration: 001_add_collaborators_to_projects.sql
-- Description: Adds team collaboration and role tracking columns to the projects table.

ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS collaborators JSONB DEFAULT '[]'::jsonb;

ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS team_type TEXT DEFAULT 'Individual';

ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS fellow_ids TEXT[] DEFAULT '{}';

-- Refresh the PostgREST API schema cache
NOTIFY pgrst, 'reload schema';
