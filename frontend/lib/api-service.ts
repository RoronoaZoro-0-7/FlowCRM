const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api'

export interface ApiResponse<T> {
  data?: T
  error?: string
  message?: string
}

// Token getter/setter for api-service to use (set by auth context)
let getAccessToken: () => string | null = () => null
let refreshToken: () => Promise<string | null> = async () => null

export function setTokenHandlers(
  getter: () => string | null,
  refresher: () => Promise<string | null>
) {
  getAccessToken = getter
  refreshToken = refresher
}

export async function makeRequest<T>(
  endpoint: string,
  options: RequestInit = {},
  retry = true
): Promise<T> {
  const token = getAccessToken()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
    credentials: 'include',
  })

  // Handle 401 - try to refresh token and retry once
  if (response.status === 401 && retry) {
    const newToken = await refreshToken()
    if (newToken) {
      // Retry the request with new token
      return makeRequest(endpoint, options, false)
    }
    // Refresh failed - throw error
    throw new Error('Session expired. Please login again.')
  }

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || `API error: ${response.status}`)
  }

  return response.json()
}

// Leads API
export async function getLeads() {
  return makeRequest('/leads')
}

export async function getLeadById(id: string) {
  return makeRequest(`/leads/${id}`)
}

export async function createLead(data: any) {
  return makeRequest('/leads', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function updateLead(id: string, data: any) {
  return makeRequest(`/leads/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

export async function deleteLead(id: string) {
  return makeRequest(`/leads/${id}`, {
    method: 'DELETE',
  })
}

// Deals API
export async function getDeals() {
  return makeRequest('/deals')
}

export async function getDealById(id: string) {
  return makeRequest(`/deals/${id}`)
}

export async function createDeal(data: any) {
  return makeRequest('/deals', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function updateDeal(id: string, data: any) {
  return makeRequest(`/deals/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

export async function deleteDeal(id: string) {
  return makeRequest(`/deals/${id}`, {
    method: 'DELETE',
  })
}

// Tasks API
export async function getTasks() {
  return makeRequest('/tasks')
}

export async function getTaskById(id: string) {
  return makeRequest(`/tasks/${id}`)
}

export async function createTask(data: any) {
  return makeRequest('/tasks', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function updateTask(id: string, data: any) {
  return makeRequest(`/tasks/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

export async function deleteTask(id: string) {
  return makeRequest(`/tasks/${id}`, {
    method: 'DELETE',
  })
}

// Notifications API
export async function getNotifications() {
  return makeRequest('/notifications')
}

export async function markNotificationAsRead(id: string) {
  return makeRequest(`/notifications/${id}/read`, {
    method: 'POST',
  })
}

// Users API
export async function getUsers() {
  const response = await makeRequest<{ employees: any[] }>('/users')
  return response.employees
}

export async function getUserById(id: string) {
  const response = await makeRequest<{ employee: any }>(`/users/${id}`)
  return response.employee
}

export async function createUser(data: any) {
  return makeRequest('/users/add', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function updateUser(id: string, data: any) {
  return makeRequest(`/users/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

export async function deleteUser(id: string) {
  return makeRequest(`/users/${id}`, {
    method: 'DELETE',
  })
}

// Organizations API (OWNER only)
export async function getOrganizations() {
  return makeRequest('/organizations')
}

export async function getOrganizationById(id: string) {
  return makeRequest(`/organizations/${id}`)
}

// Dashboard API
export async function getDashboardStats() {
  return makeRequest('/dashboard/stats')
}

export async function getWeeklyStats() {
  return makeRequest('/dashboard/weekly')
}

export async function getPipelineStats() {
  return makeRequest('/dashboard/pipeline')
}

export async function getLeadStatusStats() {
  return makeRequest('/dashboard/lead-status')
}
