-- Add the 'content' column to the 'documents' table
ALTER TABLE public.documents
ADD COLUMN IF NOT EXISTS content TEXT;

-- Optional: If you want to set a default value for existing rows, you can do so here.
-- For example, to set it to an empty string:
-- UPDATE public.documents SET content = '' WHERE content IS NULL;
