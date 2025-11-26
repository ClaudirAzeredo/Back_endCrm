export type UserRole = "admin" | "client"

// Mock function to get user role - in real app, this would come from authentication
export const getUserRole = (): UserRole => {
  // For demo purposes, you can change this to "client" to test client view
  // In production, this would come from your authentication system
  return (localStorage.getItem("user_role") as UserRole) || "client"
}

// Function to set user role (for testing purposes)
export const setUserRole = (role: UserRole): void => {
  localStorage.setItem("user_role", role)
}

// Function to check if user is admin
export const isAdmin = (): boolean => {
  return getUserRole() === "admin"
}

// Function to check if user is client
export const isClient = (): boolean => {
  return getUserRole() === "client"
}
