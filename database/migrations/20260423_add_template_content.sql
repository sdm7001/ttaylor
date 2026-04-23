-- Migration: 20260423_add_template_content
-- Adds the `content` column to the templates table so that template bodies
-- (e.g. Handlebars source or plaintext) can be stored alongside template
-- metadata. Matches the `content String? @db.Text` field added to the
-- Prisma Template model.

ALTER TABLE templates ADD COLUMN IF NOT EXISTS content TEXT;
