import axios from 'axios'

const BASE_URL = '/api'

const client = axios.create({ baseURL: BASE_URL })

export const requestAllocation = (data) => client.post('/allocations/', data)
export const listAllocations = (params) => client.get('/allocations/', { params })
export const getAllocation = (id) => client.get(`/allocations/${id}`)
export const getCycleSummary = () => client.get('/allocations/cycle-summary')

export const listAuditLogs = (params) => client.get('/audit-logs/', { params })
export const getAuditLog = (logId) => client.get(`/audit-logs/${logId}`)

export const getReservoirStatus = (params) => client.get('/reservoir/status', { params })
export const healthCheck = () => client.get('/health')
