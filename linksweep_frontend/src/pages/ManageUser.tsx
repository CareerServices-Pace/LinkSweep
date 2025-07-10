import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { UserPlus, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";
import AddUserDialog from "@/components/AddUserDialog";
import { AuthService } from "@/services/Auth";

interface User {
  id: string;
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  isAdmin: boolean;
}

interface Role {
  id: string;
  name: string;
}

const ManageUser = () => {
  const [activeTab, setActiveTab] = useState("Manage Users");
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);
  const [isAddUserDialogOpen, setIsAddUserDialogOpen] = useState(false);
  const [isLoadingRoles, setIsLoadingRoles] = useState(false);
  const [roles, setRoles] = useState<Role[]>([]);
  const { toast } = useToast();

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const usersData = await AuthService.getAllUsers();
      setUsers(usersData);
    } catch (error) {
      console.error("Failed to fetch users:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to load users. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleAdmin = async (
    userId: string,
    currentAdminStatus: boolean
  ) => {
    try {
      setUpdatingUserId(userId);
      const response = await AuthService.toggleUserAdmin(userId);

      if (response.success) {
        // Update the user in the local state
        setUsers((prevUsers) =>
          prevUsers.map((user) =>
            user.id === userId
              ? { ...user, isAdmin: !currentAdminStatus }
              : user
          )
        );

        toast({
          title: "Success",
          description: `User ${
            currentAdminStatus ? "demoted from" : "promoted to"
          } admin successfully.`,
        });
      } else {
        throw new Error(response.error || "Failed to update user admin status");
      }
    } catch (error) {
      console.error("Failed to update user admin status:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to update user admin status. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUpdatingUserId(null);
    }
  };

  const handleAddNewUser = () => {
    setIsAddUserDialogOpen(true);
  };

  const handleUserAdded = () => {
    fetchUsers(); // Refresh the users list
  };

  const fetchRoles = async () => {
    try {
      setIsLoadingRoles(true);
      const rolesData = await AuthService.getRoles();

      // Convert role.id to string immediately here
      const formattedRoles = rolesData.map((role: any) => ({
        id: String(role.id),
        name: role.name,
      }));

      setRoles(formattedRoles);
    } catch (error) {
      console.error("Failed to fetch roles:", error);
    } finally {
      setIsLoadingRoles(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchRoles();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="space-y-8">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">
                Manage Users
              </h1>
              <p className="text-gray-600 text-lg">
                Manage user accounts and permissions
              </p>
            </div>
            <Button
              onClick={handleAddNewUser}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Add New User
            </Button>
          </div>

          {/* Users Table */}
          <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                All Users
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <div key={index} className="animate-pulse">
                      <div className="flex items-center space-x-4 py-4">
                        <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                        <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                        <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                        <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                        <div className="h-6 bg-gray-200 rounded w-12"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>First Name</TableHead>
                      <TableHead>Last Name</TableHead>
                      <TableHead>Username</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Admin</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.length > 0 ? (
                      users.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell className="font-medium">
                            {user.firstName}
                          </TableCell>
                          <TableCell>{user.lastName}</TableCell>
                          <TableCell>{user.username}</TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>
                            <Switch
                              checked={user.isAdmin}
                              onCheckedChange={() =>
                                handleToggleAdmin(user.id, user.isAdmin)
                              }
                              disabled={updatingUserId === user.id}
                            />
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell
                          colSpan={5}
                          className="text-center py-8 text-gray-500"
                        >
                          No users found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      <AddUserDialog
        open={isAddUserDialogOpen}
        onOpenChange={setIsAddUserDialogOpen}
        onUserAdded={handleUserAdded}
        roles={roles}
        isLoadingRoles={isLoadingRoles}
      />
    </div>
  );
};

export default ManageUser;
