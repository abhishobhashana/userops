import AppPage from "@/components/app/app-page";
import Users from "@/components/users/users";
import { getUsers } from "@/lib/users/server";

export default async function UsersPage() {
  const users = await getUsers();

  return (
    <AppPage route="/users">
      <Users initialUsers={users} />
    </AppPage>
  );
}
