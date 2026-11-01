import { requireSuperAdmin } from "@/lib/require-super-admin";
import { UserManager } from "./user-manager";

export default async function UsersPage() {
  await requireSuperAdmin();
  return <UserManager />;
}
