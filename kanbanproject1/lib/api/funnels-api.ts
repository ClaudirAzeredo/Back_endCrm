import { Funnel, CreateFunnelRequest, UpdateFunnelRequest, UpdateColumnsRequest } from "./funnels-api-types"

// Helper to handle API responses
async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(error.message || `API Error: ${response.status}`);
  }
  return response.json();
}

export const funnelsApi = {
  // Get all funnels
  async getFunnels(): Promise<Funnel[]> {
    const response = await fetch("/api/funnels");
    return handleResponse<Funnel[]>(response);
  },

  // Get single funnel
  async getFunnel(id: string): Promise<Funnel> {
    const response = await fetch(`/api/funnels/${id}`);
    return handleResponse<Funnel>(response);
  },

  // Create funnel
  async createFunnel(data: CreateFunnelRequest): Promise<Funnel> {
    const response = await fetch("/api/funnels", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return handleResponse<Funnel>(response);
  },

  // Update funnel
  async updateFunnel(id: string, data: UpdateFunnelRequest): Promise<Funnel> {
    const response = await fetch(`/api/funnels/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return handleResponse<Funnel>(response);
  },

  // Delete funnel
  async deleteFunnel(id: string): Promise<{ success: boolean; message: string }> {
    const response = await fetch(`/api/funnels/${id}`, {
      method: "DELETE",
    });
    return handleResponse<{ success: boolean; message: string }>(response);
  },

  // Update funnel columns
  async updateColumns(id: string, data: UpdateColumnsRequest): Promise<Funnel> {
    // Note: You might need to implement a specific route for this or handle it in PUT /funnels/[id]
    // For now, assuming PUT /funnels/[id] handles it or we implement /api/funnels/[id]/columns
    // Let's implement /api/funnels/[id]/columns/route.ts if needed, but for now fallback to PUT
    const response = await fetch(`/api/funnels/${id}/columns`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return handleResponse<Funnel>(response);
  },
}

// Re-export types
export type { Funnel, FunnelColumn, CreateFunnelRequest, UpdateFunnelRequest, UpdateColumnsRequest } from "./funnels-api-types";
