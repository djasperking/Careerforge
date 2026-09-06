-- Optional profile links on an instructor application, so admins can vet applicants.
ALTER TABLE "InstructorProfile" ADD COLUMN "linkedinUrl" TEXT;
ALTER TABLE "InstructorProfile" ADD COLUMN "portfolioUrl" TEXT;
