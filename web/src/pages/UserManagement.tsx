import { useEffect, useState } from "react";
import { getUsers, createUser, updateUserRole } from "../lib/api";
import { useForm } from "@tanstack/react-form";
import { z } from "zod";

const userSchema = z.object({
  username: z.string().min(3, "ชื่อผู้ใช้ต้องมีความยาวอย่างน้อย 3 ตัวอักษร"),
  password: z.string().min(6, "รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร"),
  role: z.enum(["user", "admin", "super_admin"]),
});

type User = {
  id: number;
  username: string;
  role: string;
  created_at: string;
};

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [submitError, setSubmitError] = useState("");

  const form = useForm({
    defaultValues: {
      username: "",
      password: "",
      role: "user",
    },
    validators: {
      onChange: userSchema,
    },
    onSubmit: async ({ value }) => {
      setSubmitError("");
      try {
        await createUser(value);
        form.reset();
        fetchUsers();
      } catch (err: unknown) {
        const e = err as { response?: { data?: { message?: string } } };
        setSubmitError(e.response?.data?.message || "Failed to create user");
      }
    },
  });

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await getUsers();
      setUsers(res.data);
      setError(null);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e.response?.data?.message || "Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleRoleChange = async (userId: number, newRole: string) => {
    try {
      await updateUserRole(userId, newRole);
      fetchUsers(); // Refresh to ensure correct state
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      alert(e.response?.data?.message || "Failed to update role");
    }
  };

  if (loading) return <div className="p-8 text-center">Loading users...</div>;
  if (error)
    return <div className="p-8 text-center text-red-500">Error: {error}</div>;

  return (
    <div className="container mx-auto p-6 space-y-8 max-w-5xl">
      <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
      <p className="text-muted-foreground mt-2">
        Manage system users and their access roles across the platform. (Super
        Admin Only)
      </p>

      {/* Create User Form */}
      <div className="bg-card text-card-foreground rounded-xl border shadow-sm p-6">
        <h2 className="text-xl font-semibold mb-4">Create New User</h2>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            form.handleSubmit();
          }}
          className="space-y-4"
        >
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <form.Field
              name="username"
              children={(field) => (
                <div>
                  <label className="text-sm font-medium leading-none mb-2 block">
                    Username
                  </label>
                  <input
                    name={field.name}
                    type="text"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                    placeholder="New username"
                  />
                  {field.state.meta.errors ? (
                    <em
                      role="alert"
                      className="text-[13px] text-destructive font-medium block mt-1"
                    >
                      {field.state.meta.errors
                        .map((e) =>
                          typeof e === "string"
                            ? e
                            : (e as { message?: string })?.message || String(e),
                        )
                        .join(", ")}
                    </em>
                  ) : null}
                </div>
              )}
            />

            <form.Field
              name="password"
              children={(field) => (
                <div>
                  <label className="text-sm font-medium leading-none mb-2 block">
                    Password
                  </label>
                  <input
                    name={field.name}
                    type="password"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                    placeholder="Secure password"
                  />
                  {field.state.meta.errors ? (
                    <em
                      role="alert"
                      className="text-[13px] text-destructive font-medium block mt-1"
                    >
                      {field.state.meta.errors
                        .map((e) =>
                          typeof e === "string"
                            ? e
                            : (e as { message?: string })?.message || String(e),
                        )
                        .join(", ")}
                    </em>
                  ) : null}
                </div>
              )}
            />

            <form.Field
              name="role"
              children={(field) => (
                <div>
                  <label className="text-sm font-medium leading-none mb-2 block">
                    Role
                  </label>
                  <select
                    name={field.name}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                  >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                    <option value="super_admin">Super Admin</option>
                  </select>
                  {field.state.meta.errors ? (
                    <em
                      role="alert"
                      className="text-[13px] text-destructive font-medium block mt-1"
                    >
                      {field.state.meta.errors
                        .map((e) =>
                          typeof e === "string"
                            ? e
                            : (e as { message?: string })?.message || String(e),
                        )
                        .join(", ")}
                    </em>
                  ) : null}
                </div>
              )}
            />

            <div className="flex items-end mb-[2px]">
              <form.Subscribe
                selector={(state) => [state.canSubmit, state.isSubmitting]}
                children={([canSubmit, isSubmitting]) => (
                  <button
                    type="submit"
                    disabled={!canSubmit || isSubmitting}
                    className="h-10 px-4 py-2 w-full bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors disabled:opacity-50"
                  >
                    {isSubmitting ? "Creating..." : "Create"}
                  </button>
                )}
              />
            </div>
          </div>
          {submitError && (
            <div className="text-sm text-red-500 mt-2">{submitError}</div>
          )}
        </form>
      </div>

      {/* Users Table */}
      <div className="bg-card text-card-foreground rounded-xl border shadow-sm overflow-hidden">
        <div className="relative w-full overflow-auto">
          <table className="w-full caption-bottom text-sm">
            <thead className="[&_tr]:border-b bg-muted/50">
              <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground w-[100px]">
                  ID
                </th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                  Username
                </th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                  Joined Date
                </th>
                <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">
                  Role Assignment
                </th>
              </tr>
            </thead>
            <tbody className="[&_tr:last-child]:border-0">
              {users.map((user) => (
                <tr
                  key={user.id}
                  className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted"
                >
                  <td className="p-4 align-middle font-medium">{user.id}</td>
                  <td className="p-4 align-middle">{user.username}</td>
                  <td className="p-4 align-middle text-muted-foreground">
                    {new Date(user.created_at).toLocaleDateString()}
                  </td>
                  <td className="p-4 align-middle text-right">
                    <select
                      value={user.role}
                      onChange={(e) =>
                        handleRoleChange(user.id, e.target.value)
                      }
                      className="inline-flex h-9 w-[140px] appearance-none rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <option value="user">User</option>
                      <option value="admin">Admin</option>
                      <option value="super_admin">Super Admin</option>
                    </select>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td
                    colSpan={4}
                    className="p-4 text-center text-muted-foreground"
                  >
                    No users found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
