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

// ============== NEW FEATURE APIs ==============

// Attachments API
export async function uploadAttachment(file: File, entityType: 'lead' | 'deal' | 'task', entityId: string) {
  const token = getAccessToken()
  const formData = new FormData()
  formData.append('file', file)

  const response = await fetch(`${API_BASE}/attachments/${entityType}/${entityId}`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
    credentials: 'include',
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || 'Upload failed')
  }

  return response.json()
}

export async function getAttachments(entityType: 'lead' | 'deal' | 'task', entityId: string) {
  return makeRequest(`/attachments/${entityType}/${entityId}`)
}

export async function deleteAttachment(id: string) {
  return makeRequest(`/attachments/${id}`, { method: 'DELETE' })
}

// Chat API
export async function getChatRooms() {
  return makeRequest('/chat/rooms')
}

export async function createChatRoom(data: { name?: string; type: string; memberIds: string[]; dealId?: string; leadId?: string }) {
  return makeRequest('/chat/rooms', { method: 'POST', body: JSON.stringify(data) })
}

export async function getChatMessages(roomId: string) {
  return makeRequest(`/chat/rooms/${roomId}/messages`)
}

export async function sendChatMessage(roomId: string, content: string, mentionIds?: string[]) {
  return makeRequest(`/chat/rooms/${roomId}/messages`, {
    method: 'POST',
    body: JSON.stringify({ content, mentionIds }),
  })
}

export async function markChatAsRead(roomId: string) {
  return makeRequest(`/chat/rooms/${roomId}/read`, { method: 'POST' })
}

export async function searchUsersForMention(query: string) {
  return makeRequest(`/chat/users/search?q=${encodeURIComponent(query)}`)
}

export async function getUnreadCount() {
  return makeRequest('/chat/unread')
}

// Analytics API
export async function getSalesForecast(months?: number) {
  return makeRequest(`/analytics/forecast${months ? `?months=${months}` : ''}`)
}

export async function getConversionFunnel() {
  return makeRequest('/analytics/funnel')
}

export async function getTeamLeaderboard() {
  return makeRequest('/analytics/leaderboard')
}

export async function getDashboardAnalytics() {
  return makeRequest('/analytics/dashboard')
}

export async function getActivityTimeline(entityType?: string, entityId?: string) {
  const params = new URLSearchParams()
  if (entityType) params.append('entityType', entityType)
  if (entityId) params.append('entityId', entityId)
  return makeRequest(`/analytics/timeline${params.toString() ? `?${params}` : ''}`)
}

// Export API
export async function exportData(entity: 'leads' | 'deals' | 'tasks' | 'report', format: 'json' | 'csv' = 'json') {
  return makeRequest(`/export/${entity}?format=${format}`)
}

// Widget API
export async function getWidgets() {
  return makeRequest('/widgets')
}

export async function createWidget(data: { widgetType: string; title: string; position?: number; size?: string; config?: any }) {
  return makeRequest('/widgets', { method: 'POST', body: JSON.stringify(data) })
}

export async function updateWidget(id: string, data: { title?: string; position?: number; size?: string; config?: any }) {
  return makeRequest(`/widgets/${id}`, { method: 'PUT', body: JSON.stringify(data) })
}

export async function deleteWidget(id: string) {
  return makeRequest(`/widgets/${id}`, { method: 'DELETE' })
}

export async function reorderWidgets(widgetIds: string[]) {
  return makeRequest('/widgets/reorder', { method: 'POST', body: JSON.stringify({ widgetIds }) })
}

export async function resetWidgets() {
  return makeRequest('/widgets/reset', { method: 'POST' })
}

// Filter Presets API
export async function getFilterPresets(entityType: string) {
  return makeRequest(`/filters/${entityType}`)
}

export async function createFilterPreset(data: { name: string; entityType: string; filters: any; isDefault?: boolean }) {
  return makeRequest('/filters', { method: 'POST', body: JSON.stringify(data) })
}

export async function updateFilterPreset(id: string, data: { name?: string; filters?: any; isDefault?: boolean }) {
  return makeRequest(`/filters/${id}`, { method: 'PUT', body: JSON.stringify(data) })
}

export async function deleteFilterPreset(id: string) {
  return makeRequest(`/filters/${id}`, { method: 'DELETE' })
}

// Call Log API
export async function getCallLogs(leadId?: string) {
  return makeRequest(`/calls${leadId ? `?leadId=${leadId}` : ''}`)
}

export async function createCallLog(data: { phoneNumber: string; direction: string; duration?: number; outcome?: string; notes?: string; leadId?: string }) {
  return makeRequest('/calls', { method: 'POST', body: JSON.stringify(data) })
}

export async function updateCallLog(id: string, data: any) {
  return makeRequest(`/calls/${id}`, { method: 'PUT', body: JSON.stringify(data) })
}

export async function deleteCallLog(id: string) {
  return makeRequest(`/calls/${id}`, { method: 'DELETE' })
}

export async function getCallStats() {
  return makeRequest('/calls/stats')
}

// Calendar API
export async function getCalendarEvents(start?: string, end?: string) {
  const params = new URLSearchParams()
  if (start) params.append('start', start)
  if (end) params.append('end', end)
  return makeRequest(`/calendar${params.toString() ? `?${params}` : ''}`)
}

export async function createCalendarEvent(data: { title: string; startTime: string; endTime: string; description?: string; allDay?: boolean; location?: string }) {
  return makeRequest('/calendar', { method: 'POST', body: JSON.stringify(data) })
}

export async function updateCalendarEvent(id: string, data: any) {
  return makeRequest(`/calendar/${id}`, { method: 'PUT', body: JSON.stringify(data) })
}

export async function deleteCalendarEvent(id: string) {
  return makeRequest(`/calendar/${id}`, { method: 'DELETE' })
}

// Webhook API
export async function getWebhookConfig() {
  return makeRequest('/webhooks/config')
}

export async function updateWebhookConfig(data: { webhookUrl?: string; webhookEvents?: string[]; webhookSecret?: string }) {
  return makeRequest('/webhooks/config', { method: 'PUT', body: JSON.stringify(data) })
}

export async function getWebhookLogs() {
  return makeRequest('/webhooks/logs')
}

export async function testWebhook() {
  return makeRequest('/webhooks/test', { method: 'POST' })
}

// Custom Fields API
export async function getCustomFields(entityType: string) {
  return makeRequest(`/custom-fields/${entityType}`)
}

export async function createCustomField(data: { name: string; fieldType: string; entityType: string; options?: string[]; required?: boolean }) {
  return makeRequest('/custom-fields', { method: 'POST', body: JSON.stringify(data) })
}

export async function updateCustomField(id: string, data: any) {
  return makeRequest(`/custom-fields/${id}`, { method: 'PUT', body: JSON.stringify(data) })
}

export async function deleteCustomField(id: string) {
  return makeRequest(`/custom-fields/${id}`, { method: 'DELETE' })
}

// Follow-up Sequences API
export async function getFollowUpSequences() {
  return makeRequest('/follow-up/sequences')
}

export async function createFollowUpSequence(data: { name: string; steps: Array<{ stepOrder: number; delayDays: number; actionType: string; subject?: string; content: string }> }) {
  return makeRequest('/follow-up/sequences', { method: 'POST', body: JSON.stringify(data) })
}

export async function updateFollowUpSequence(id: string, data: any) {
  return makeRequest(`/follow-up/sequences/${id}`, { method: 'PUT', body: JSON.stringify(data) })
}

export async function deleteFollowUpSequence(id: string) {
  return makeRequest(`/follow-up/sequences/${id}`, { method: 'DELETE' })
}

export async function enrollLeadInSequence(sequenceId: string, leadId: string) {
  return makeRequest('/follow-up/enroll', { method: 'POST', body: JSON.stringify({ leadId, sequenceId }) })
}

export async function unenrollLead(leadId: string, sequenceId: string) {
  return makeRequest('/follow-up/unenroll', { method: 'POST', body: JSON.stringify({ leadId, sequenceId }) })
}

export async function getLeadEnrollments(leadId: string) {
  return makeRequest(`/follow-up/enrollments/lead/${leadId}`)
}

// Organization Settings API
export async function getOrganizationSettings() {
  return makeRequest('/organizations/settings/current')
}

export async function updateOrganizationSettings(data: { currency?: string; logoLight?: string; logoDark?: string; name?: string }) {
  return makeRequest('/organizations/settings', { method: 'PUT', body: JSON.stringify(data) })
}

// Lead Scoring API  
export async function recalculateLeadScore(leadId: string) {
  return makeRequest(`/leads/${leadId}/recalculate-score`, { method: 'POST' })
}

// Bulk Actions API
export async function bulkDeleteLeads(ids: string[]) {
  return makeRequest('/leads/bulk/delete', { method: 'POST', body: JSON.stringify({ ids }) })
}

export async function bulkUpdateLeads(ids: string[], data: any) {
  return makeRequest('/leads/bulk/update', { method: 'POST', body: JSON.stringify({ ids, data }) })
}

export async function bulkAssignLeads(ids: string[], userId: string) {
  return makeRequest('/leads/bulk/assign', { method: 'POST', body: JSON.stringify({ ids, userId }) })
}

export async function bulkDeleteDeals(ids: string[]) {
  return makeRequest('/deals/bulk/delete', { method: 'POST', body: JSON.stringify({ ids }) })
}

export async function bulkUpdateDeals(ids: string[], data: any) {
  return makeRequest('/deals/bulk/update', { method: 'POST', body: JSON.stringify({ ids, data }) })
}

export async function bulkDeleteTasks(ids: string[]) {
  return makeRequest('/tasks/bulk/delete', { method: 'POST', body: JSON.stringify({ ids }) })
}

export async function bulkUpdateTasks(ids: string[], data: any) {
  return makeRequest('/tasks/bulk/update', { method: 'POST', body: JSON.stringify({ ids, data }) })
}

// Two-Factor Authentication API
export async function get2FAStatus() {
  return makeRequest('/2fa/status')
}

export async function setup2FA() {
  return makeRequest('/2fa/setup', { method: 'POST' })
}

export async function verify2FA(token: string) {
  return makeRequest('/2fa/verify', { method: 'POST', body: JSON.stringify({ token }) })
}

export async function disable2FA(token: string) {
  return makeRequest('/2fa/disable', { method: 'POST', body: JSON.stringify({ token }) })
}

export async function validate2FAToken(userId: string, token: string) {
  return makeRequest('/2fa/validate', { method: 'POST', body: JSON.stringify({ userId, token }) })
}
