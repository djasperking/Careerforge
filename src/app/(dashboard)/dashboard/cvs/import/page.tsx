import { redirect } from "next/navigation";

// The import flow now lives in the unified "New CV" screen.
export default function ImportRedirect() {
  redirect("/dashboard/cvs/new");
}
