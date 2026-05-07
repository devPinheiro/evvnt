-- Drop per-organisation email uniqueness; enforce globally unique email for passwordless org lookup.
DROP INDEX IF EXISTS "User_organisationId_email_key";

CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
