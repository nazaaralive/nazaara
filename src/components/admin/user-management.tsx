"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { authClient } from "@/lib/auth-client"
import { Users, Plus, UserX, RefreshCw, Shield, Search, Filter, ChevronLeft, ChevronRight, Key, UserCog } from "lucide-react"
import { toast } from "sonner"

interface User {
  id: string
  name: string
  email: string
  role: string
  createdAt: string
}

export function UserManagement() {
  const [users, setUsers] = useState<User[]>([])
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [roleFilter, setRoleFilter] = useState<string>("all")
  const [currentPage, setCurrentPage] = useState(0)
  const [totalUsers, setTotalUsers] = useState(0)
  const [isCreateUserOpen, setIsCreateUserOpen] = useState(false)
  const [isUserDetailsOpen, setIsUserDetailsOpen] = useState(false)
  const [isPasswordResetOpen, setIsPasswordResetOpen] = useState(false)
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  
  // Form states
  const [createForm, setCreateForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "user"
  })

  const pageSize = 10

  async function loadUsers() {
    setLoading(true)
    try {
      const response = await authClient.admin.listUsers({
        query: {
          limit: pageSize,
          offset: currentPage * pageSize,
          searchValue: searchTerm || undefined,
          searchField: "email",
          searchOperator: "contains",
          filterField: roleFilter !== "all" ? "role" : undefined,
          filterValue: roleFilter !== "all" ? roleFilter : undefined,
          filterOperator: "eq"
        }
      })
      
      if (response.data) {
        // Ensure all users have a role field (default to "user" if undefined)
        const usersWithRole = response.data.users.map((user: {
          id: string;
          name: string;
          email: string;
          role?: string;
          createdAt: string | Date;
        }) => ({
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role || "user",
          createdAt: typeof user.createdAt === 'string' ? user.createdAt : user.createdAt.toISOString()
        }))
        setUsers(usersWithRole)
        setTotalUsers(response.data.total)
      }
    } catch (error) {
      toast.error("Failed to load users")
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  async function createUser() {
    if (!createForm.name || !createForm.email || !createForm.password) {
      toast.error("Please fill in all required fields")
      return
    }

    try {
      await authClient.admin.createUser({
        name: createForm.name,
        email: createForm.email,
        password: createForm.password,
        role: createForm.role as "admin" | "user",
        data: {}
      })
      
      toast.success("User created successfully")
      setCreateForm({ name: "", email: "", password: "", role: "user" })
      setIsCreateUserOpen(false)
      loadUsers()
    } catch (error) {
      toast.error("Failed to create user")
      console.error(error)
    }
  }

  async function setUserRole(userId: string, role: string) {
    try {
      await authClient.admin.setRole({
        userId,
        role: role as "admin" | "user"
      })
      toast.success(`User role updated to ${role}`)
      loadUsers()
      if (selectedUser?.id === userId) {
        setSelectedUser({ ...selectedUser, role })
      }
    } catch (error) {
      toast.error("Failed to update user role")
      console.error(error)
    }
  }

  async function resetUserPassword() {
    if (!selectedUser) return
    
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match")
      return
    }
    
    if (newPassword.length < 8) {
      toast.error("Password must be at least 8 characters long")
      return
    }
    
    try {
      await authClient.admin.setUserPassword({
        userId: selectedUser.id,
        newPassword
      })
      toast.success("Password reset successfully")
      setIsPasswordResetOpen(false)
      setNewPassword("")
      setConfirmPassword("")
    } catch (error) {
      toast.error("Failed to reset password")
      console.error(error)
    }
  }



  async function deleteUser(userId: string) {
    try {
      await authClient.admin.removeUser({
        userId
      })
      toast.success("User deleted successfully")
      loadUsers()
      setIsUserDetailsOpen(false)
      setSelectedUser(null)
    } catch (error) {
      toast.error("Failed to delete user")
      console.error(error)
    }
  }

  function openUserDetails(user: User) {
    setSelectedUser(user)
    setIsUserDetailsOpen(true)
  }

  useEffect(() => {
    loadUsers()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, searchTerm, roleFilter])

  const totalPages = Math.ceil(totalUsers / pageSize)
  const filteredUsers = users

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2 sm:gap-4">
          <div className="relative flex-1 min-w-[180px] sm:flex-none">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full sm:w-64"
            />
          </div>
          
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-32">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Roles</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="user">User</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Dialog open={isCreateUserOpen} onOpenChange={setIsCreateUserOpen}>
          <DialogTrigger asChild>
            <Button className="bg-[--gold] text-[--maroon-red] hover:bg-[--gold]/90">
              <Plus className="h-4 w-4 mr-2" />
              Create User
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New User</DialogTitle>
              <DialogDescription>Add a new user to the system</DialogDescription>
            </DialogHeader>
            <div className="space-y-4  ">
              <div className="space-y-4">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={createForm.name}
                  onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                  placeholder="Enter user's name"
                />
              </div>
              <div className="space-y-4">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={createForm.email}
                  onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                  placeholder="Enter user's email"
                />
              </div>
              <div className="space-y-4">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={createForm.password}
                  onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                  placeholder="Enter password"
                />
              </div>
              <div className="space-y-4">
                <Label htmlFor="role">Role</Label>
                <Select value={createForm.role} onValueChange={(role) => setCreateForm({ ...createForm, role })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">User</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsCreateUserOpen(false)}>
                Cancel
              </Button>
              <Button onClick={createUser}>Create User</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Users List */}
      <div className="space-y-4">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin" />
          </div>
        ) : (
          <>
            {filteredUsers.map((user) => (
              <Card 
                key={user.id} 
                className={`hover:bg-accent/5 transition-colors cursor-pointer ${
                  user.role === "admin" ? "border-[--gold]/30" : ""
                }`} 
                onClick={() => openUserDetails(user)}
              >
                <CardContent className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      user.role === "admin" ? "bg-[--gold]/20" : "bg-muted"
                    }`}>
                      {user.role === "admin" ? (
                        <Shield className="h-5 w-5 text-[--gold]" />
                      ) : (
                        <Users className="h-5 w-5" />
                      )}
                    </div>
                    <div>
                      <div className="font-medium flex items-center gap-2">
                        {user.name}
                        {user.role === "admin" && (
                          <Shield className="h-3 w-3 text-[--gold]" />
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground">{user.email}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={user.role === "admin" ? "default" : "secondary"}>
                      {user.role === "admin" && <Shield className="h-3 w-3 mr-1" />}
                      {user.role}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
            disabled={currentPage === 0}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {currentPage + 1} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(Math.min(totalPages - 1, currentPage + 1))}
            disabled={currentPage === totalPages - 1}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* User Details Dialog */}
      <Dialog open={isUserDetailsOpen} onOpenChange={setIsUserDetailsOpen}>
        <DialogContent className="max-w-4xl">
          {selectedUser && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  {selectedUser.name}
                </DialogTitle>
                <DialogDescription>Manage user account</DialogDescription>
              </DialogHeader>

              <Tabs defaultValue="details" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="details">Details</TabsTrigger>
                  <TabsTrigger value="actions">Actions</TabsTrigger>
                </TabsList>

                <TabsContent value="details" className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label>Name</Label>
                      <div className="font-medium">{selectedUser.name}</div>
                    </div>
                    <div>
                      <Label>Email</Label>
                      <div>{selectedUser.email}</div>
                    </div>
                    <div>
                      <Label>Role</Label>
                      <div className="flex items-center gap-2">
                        <Badge variant={selectedUser.role === "admin" ? "default" : "secondary"}>
                          {selectedUser.role === "admin" && <Shield className="h-3 w-3 mr-1" />}
                          {selectedUser.role}
                        </Badge>
                      </div>
                    </div>
                    <div>
                      <Label>Member Since</Label>
                      <div className="text-sm text-muted-foreground">
                        {new Date(selectedUser.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="actions" className="space-y-4">
                  <div className="space-y-4">
                    {/* Role Management Section */}
                    <div className="p-4 border rounded-lg space-y-3">
                      <h4 className="font-medium flex items-center gap-2">
                        <UserCog className="h-4 w-4" />
                        Role Management
                      </h4>
                      <div className="flex items-center gap-3">
                        <Label className="text-sm text-muted-foreground">Current Role:</Label>
                        <Badge variant={selectedUser.role === "admin" ? "default" : "secondary"}>
                          {selectedUser.role === "admin" && <Shield className="h-3 w-3 mr-1" />}
                          {selectedUser.role}
                        </Badge>
                      </div>
                      <div className="flex gap-2">
                        {selectedUser.role === "admin" ? (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="outline" className="flex-1">
                                <UserCog className="h-4 w-4 mr-2" />
                                Demote to User
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Remove Admin Privileges</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to remove admin privileges from {selectedUser.name}? They will lose access to the admin panel.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => setUserRole(selectedUser.id, "user")}>
                                  Remove Admin
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        ) : (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="outline" className="flex-1">
                                <Shield className="h-4 w-4 mr-2" />
                                Promote to Admin
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Grant Admin Privileges</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to grant admin privileges to {selectedUser.name}? They will have full access to the admin panel and user management.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => setUserRole(selectedUser.id, "admin")}>
                                  Grant Admin
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </div>
                    </div>

                    {/* Account Actions Section */}
                    <div className="p-4 border rounded-lg space-y-3">
                      <h4 className="font-medium">Account Actions</h4>
                      {/* Password Reset */}
                      <Dialog open={isPasswordResetOpen} onOpenChange={setIsPasswordResetOpen}>
                        <DialogTrigger asChild>
                          <Button variant="outline" className="w-full">
                            <Key className="h-4 w-4 mr-2" />
                            Reset Password
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Reset Password</DialogTitle>
                            <DialogDescription>
                              Set a new password for {selectedUser.name}
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div className="space-y-4">
                              <Label htmlFor="new-password">New Password</Label>
                              <Input
                                id="new-password"
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                placeholder="Enter new password"
                                minLength={8}
                              />
                            </div>
                            <div className="space-y-4"> 
                              <Label htmlFor="confirm-password">Confirm Password</Label>
                              <Input
                                id="confirm-password"
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="Confirm new password"
                                minLength={8}
                              />
                            </div>
                            <p className="text-sm text-muted-foreground">
                              Password must be at least 8 characters long
                            </p>
                          </div>
                          <div className="flex justify-end gap-2 mt-4">
                            <Button variant="outline" onClick={() => {
                              setIsPasswordResetOpen(false)
                              setNewPassword("")
                              setConfirmPassword("")
                            }}>
                              Cancel
                            </Button>
                            <Button onClick={resetUserPassword}>
                              Reset Password
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>

                    {/* Danger Zone */}
                    <div className="p-4 border border-destructive/20 rounded-lg space-y-3">
                      <h4 className="font-medium text-destructive">Danger Zone</h4>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive" className="w-full">
                            <UserX className="h-4 w-4 mr-2" />
                            Delete User
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete User</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to permanently delete {selectedUser.name}? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => deleteUser(selectedUser.id)}
                            >
                              Delete User
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </TabsContent>

              </Tabs>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}