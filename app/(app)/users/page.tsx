import AppPage from "@/components/app/app-page";
import Users from "@/components/users/users";
import { getUsers } from "@/lib/users/server";
import { requireUser } from "@/lib/auth/require-user";

export default async function UsersPage() {
  const [users, currentUser] = await Promise.all([getUsers(), requireUser()]);

  return (
    <AppPage route="/users">
      <Users initialUsers={users} role={currentUser.role} />
    </AppPage>
  );
}
