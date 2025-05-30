"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Users, Plus, Settings, Shield, Trash2, Zap } from "lucide-react"
import Link from "next/link"

interface TeamMember {
  id: string
  name: string
  email: string
  role: "admin" | "editor" | "viewer"
  joinedAt: string
  status: "active" | "pending"
}

interface Department {
  id: string
  name: string
  botCount: number
  members: number
}

export default function Workspace() {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([
    {
      id: "1",
      name: "John Doe",
      email: "john@company.com",
      role: "admin",
      joinedAt: "2024-01-15",
      status: "active",
    },
    {
      id: "2",
      name: "Jane Smith",
      email: "jane@company.com",
      role: "editor",
      joinedAt: "2024-01-20",
      status: "active",
    },
    {
      id: "3",
      name: "Bob Wilson",
      email: "bob@company.com",
      role: "viewer",
      joinedAt: "2024-01-25",
      status: "pending",
    },
  ])

  const [departments] = useState<Department[]>([
    { id: "hr", name: "Human Resources", botCount: 3, members: 5 },
    { id: "it", name: "Information Technology", botCount: 2, members: 8 },
    { id: "sales", name: "Sales", botCount: 1, members: 12 },
    { id: "legal", name: "Legal", botCount: 1, members: 3 },
  ])

  const [inviteEmail, setInviteEmail] = useState("")
  const [inviteRole, setInviteRole] = useState<"admin" | "editor" | "viewer">("viewer")

  const handleInvite = () => {
    if (inviteEmail) {
      const newMember: TeamMember = {
        id: Math.random().toString(36).substr(2, 9),
        name: inviteEmail.split("@")[0],
        email: inviteEmail,
        role: inviteRole,
        joinedAt: new Date().toISOString(),
        status: "pending",
      }
      setTeamMembers([...teamMembers, newMember])
      setInviteEmail("")
    }
  }

  const updateMemberRole = (memberId: string, newRole: "admin" | "editor" | "viewer") => {
    setTeamMembers((members) =>
      members.map((member) => (member.id === memberId ? { ...member, role: newRole } : member)),
    )
  }

  const removeMember = (memberId: string) => {
    setTeamMembers((members) => members.filter((member) => member.id !== memberId))
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16">
            <Link href="/" className="flex items-center space-x-3">
              <ArrowLeft className="w-5 h-5 text-gray-600" />
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">Promptly</h1>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900">Workspace Management</h2>
          <p className="text-gray-600 mt-2">Manage your team, departments, and permissions</p>
        </div>

        <Tabs defaultValue="team" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="team" className="flex items-center space-x-2">
              <Users className="w-4 h-4" />
              <span>Team</span>
            </TabsTrigger>
            <TabsTrigger value="departments" className="flex items-center space-x-2">
              <Settings className="w-4 h-4" />
              <span>Departments</span>
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center space-x-2">
              <Shield className="w-4 h-4" />
              <span>Security</span>
            </TabsTrigger>
          </TabsList>

          {/* Team Management */}
          <TabsContent value="team">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Team Members</CardTitle>
                    <CardDescription>Manage your team members and their permissions</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {teamMembers.map((member) => (
                        <div key={member.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-medium">
                              {member.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-medium">{member.name}</p>
                              <p className="text-sm text-gray-600">{member.email}</p>
                            </div>
                            <Badge variant={member.status === "active" ? "default" : "secondary"}>
                              {member.status}
                            </Badge>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Select
                              value={member.role}
                              onValueChange={(value: "admin" | "editor" | "viewer") =>
                                updateMemberRole(member.id, value)
                              }
                            >
                              <SelectTrigger className="w-24">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="admin">Admin</SelectItem>
                                <SelectItem value="editor">Editor</SelectItem>
                                <SelectItem value="viewer">Viewer</SelectItem>
                              </SelectContent>
                            </Select>
                            <Button variant="outline" size="sm" onClick={() => removeMember(member.id)}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Invite Team Member</CardTitle>
                  <CardDescription>Add new members to your workspace</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="colleague@company.com"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="role">Role</Label>
                    <Select value={inviteRole} onValueChange={setInviteRole}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Admin - Full access</SelectItem>
                        <SelectItem value="editor">Editor - Can edit bots</SelectItem>
                        <SelectItem value="viewer">Viewer - Read only</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={handleInvite} className="w-full">
                    <Plus className="w-4 h-4 mr-2" />
                    Send Invitation
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Departments */}
          <TabsContent value="departments">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {departments.map((dept) => (
                <Card key={dept.id}>
                  <CardHeader>
                    <CardTitle className="text-lg">{dept.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Bots:</span>
                        <span className="font-medium">{dept.botCount}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Members:</span>
                        <span className="font-medium">{dept.members}</span>
                      </div>
                      <Button variant="outline" size="sm" className="w-full">
                        Manage
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Security */}
          <TabsContent value="security">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Data Retention</CardTitle>
                  <CardDescription>Configure how long data is stored</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Chat History Retention</Label>
                    <Select defaultValue="90">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="30">30 days</SelectItem>
                        <SelectItem value="90">90 days</SelectItem>
                        <SelectItem value="365">1 year</SelectItem>
                        <SelectItem value="forever">Forever</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Document Storage</Label>
                    <Select defaultValue="forever">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="365">1 year</SelectItem>
                        <SelectItem value="forever">Forever</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>GDPR Compliance</CardTitle>
                  <CardDescription>Data protection and privacy settings</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Data Processing Agreement</span>
                    <Badge variant="outline">Active</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Right to be Forgotten</span>
                    <Badge variant="outline">Enabled</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Data Export</span>
                    <Button variant="outline" size="sm">
                      Export
                    </Button>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Delete All Data</span>
                    <Button variant="destructive" size="sm">
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
