export interface JobTitle {
  id: string
  name: string
  systemRole: "admin" | "manager" | "supervisor" | "employee"
  isSystemDefault: boolean
  createdAt: string
  canViewSameRoleData?: boolean
}

declare module "../auth" {
  interface User {
    jobTitleId?: string
  }
}
