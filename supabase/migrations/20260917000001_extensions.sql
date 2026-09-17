-- FUTURISTE ACADÉMIE FC — extensions et schéma d'aide.
-- Voir docs/04-BASE-DE-DONNEES.md.

create extension if not exists pgcrypto;   -- gen_random_uuid()
create extension if not exists citext;     -- e-mails insensibles à la casse

-- Toutes les fonctions d'aide à la sécurité vivent ici, jamais dans public.
create schema if not exists futuriste;
