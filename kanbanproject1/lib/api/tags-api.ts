import { apiClient } from "@/lib/api-client"

export type Tag = {
  id: string
  name: string
  color: string
  description?: string
  createdAt: string
}

export type CreateTagRequest = {
  name: string
  color?: string
  description?: string
}

export type UpdateTagRequest = Partial<CreateTagRequest>

export const tagsApi = {
  // Get all tags
  async getTags(): Promise<Tag[]> {
    return apiClient.get<Tag[]>("/tags");
  },

  // Create tag
  async createTag(data: CreateTagRequest): Promise<Tag> {
    return apiClient.post<Tag>("/tags", data);
  },

  // Update tag
  async updateTag(id: string, data: UpdateTagRequest): Promise<Tag> {
    return apiClient.put<Tag>(`/tags/${id}`, data);
  },

  // Delete tag
  async deleteTag(id: string): Promise<void> {
    return apiClient.delete(`/tags/${id}`);
  },
}
