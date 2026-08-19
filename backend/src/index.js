import express from 'express'
import cors from 'cors'
import { ROLES, PERMISSIONS, ROLE_PERMISSIONS_MATRIX, getPermissionsForRole } from './config/rbac.js'

const app = express()
const PORT = process.env.PORT || 3001

app.use(cors())
app.use(express.json())

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// RBAC Roles & Permission Matrix API Endpoints (BE-002)
app.get('/api/rbac/roles', (req, res) => {
  res.json({ success: true, data: ROLES })
})

app.get('/api/rbac/permissions', (req, res) => {
  res.json({ success: true, data: PERMISSIONS })
})

app.get('/api/rbac/matrix', (req, res) => {
  res.json({ success: true, data: ROLE_PERMISSIONS_MATRIX })
})

app.get('/api/rbac/roles/:roleCode', (req, res) => {
  const roleCode = req.params.roleCode.toUpperCase()
  if (!ROLES[roleCode]) {
    return res.status(404).json({ success: false, error: 'Role not found' })
  }
  res.json({
    success: true,
    data: {
      role: ROLES[roleCode],
      permissions: getPermissionsForRole(roleCode)
    }
  })
})

app.use((req, res) => {
  res.status(404).json({ error: 'Not found' })
})

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})

