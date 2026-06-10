import { requireContractor } from "@/lib/auth/session";
import { NewJobWizard } from "@/components/wizard/NewJobWizard";

export default async function NewJobPage() {
  await requireContractor();
  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold tracking-tight">New job</h1>
      <NewJobWizard />
    </div>
  );
}
