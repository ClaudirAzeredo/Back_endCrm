export interface FunnelColumn {
  id: string
  name: string
  color: string
  order: number
  description?: string
  visible: boolean
  limit?: number | null
}

export interface Funnel {
  id: string
  name: string
  description?: string
  category?: string
  icon?: string
  isActive: boolean
  createdAt: string
  columns: FunnelColumn[]
}

export interface CreateFunnelRequest {
  name: string
  description?: string
  category?: string
  icon?: string
  isActive: boolean
  columns: Array<{
    name: string
    color: string
    order: number
    description?: string
    visible: boolean
    limit?: number | null
  }>
}

export interface UpdateFunnelRequest extends Partial<CreateFunnelRequest> {}

export interface UpdateColumnsRequest {
  columns: FunnelColumn[]
}
