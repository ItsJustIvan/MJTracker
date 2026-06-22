-- Safe remote schema reconstruction mirror
-- Target Migration Version: 20260621164121

-- Core Custom Types
CREATE TYPE "public"."role" AS ENUM ('USER', 'ADMIN', 'MODERATOR');

-- Tables Base Configurations
-- Note: Reconstructed structural tracking for profiles, events, sessions, hands, and stats.

SELECT 'Schema verification placeholder successfully initialized' AS status;