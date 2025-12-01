import { getAllUsers } from "./auth"
import { getJobTitleById } from "./job-titles"

/**
 * Checks if a user can view another user's data (leads, conversations, etc.)
 * Rules:
 * 1. Users higher in hierarchy can always see data from users below them
 * 2. Users with the same job title can see each other's data only if canViewSameRoleData is true
 * 3. Users cannot see data from users in different roles unless they're in the hierarchy
 */
export function canViewUserData(viewerId: string, targetUserId: string): boolean {
  // User can always view their own data
  if (viewerId === targetUserId) {
    return true
  }

  const users = getAllUsers()
  const viewer = users.find((u) => u.id === viewerId)
  const target = users.find((u) => u.id === targetUserId)

  if (!viewer || !target) {
    return false
  }

  // Check if viewer is higher in hierarchy (can see subordinates' data)
  if (isInHierarchy(viewerId, targetUserId, users)) {
    return true
  }

  // Check if they have the same job title and if that role allows data sharing
  if (viewer.jobTitleId && target.jobTitleId && viewer.jobTitleId === target.jobTitleId) {
    const jobTitle = getJobTitleById(viewer.jobTitleId)
    // Default to true if canViewSameRoleData is not set (for backward compatibility)
    return jobTitle?.canViewSameRoleData !== false
  }

  return false
}

/**
 * Checks if viewerId is above targetUserId in the organizational hierarchy
 */
function isInHierarchy(viewerId: string, targetUserId: string, users: any[]): boolean {
  const target = users.find((u) => u.id === targetUserId)
  if (!target) return false

  // Check if target reports to viewer (direct or indirect)
  let currentSupervisorId = target.supervisorId
  while (currentSupervisorId) {
    if (currentSupervisorId === viewerId) {
      return true
    }
    const supervisor = users.find((u) => u.id === currentSupervisorId)
    currentSupervisorId = supervisor?.supervisorId
  }

  return false
}

/**
 * Filters a list of items to only include those the user can view
 * Each item should have an ownerId or userId field
 */
export function filterByDataVisibility<T extends { ownerId?: string; userId?: string }>(
  items: T[],
  viewerId: string,
): T[] {
  return items.filter((item) => {
    const ownerId = item.ownerId || item.userId
    if (!ownerId) return true // If no owner, show to everyone
    return canViewUserData(viewerId, ownerId)
  })
}

/**
 * Gets all user IDs whose data the viewer can see
 */
export function getVisibleUserIds(viewerId: string): string[] {
  const users = getAllUsers()
  return users.filter((user) => canViewUserData(viewerId, user.id)).map((user) => user.id)
}
