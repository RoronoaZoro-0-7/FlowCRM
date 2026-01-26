const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api'

export interface ApiResponse<T> {
  data?: T
  error?: string
  message?: string
}

export async function makeRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem('accessToken')
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
