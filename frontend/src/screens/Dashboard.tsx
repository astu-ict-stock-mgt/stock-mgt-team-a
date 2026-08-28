import { useApp } from '../context/AppContext'
import AdminDashboard from './dashboards/AdminDashboard'
import RequesterDashboard from './dashboards/RequesterDashboard'
import StorekeeperDashboard from './dashboards/StorekeeperDashboard'
import PAODashboard from './dashboards/PAODashboard'
import DepartmentHeadDashboard from './dashboards/DepartmentHeadDashboard'
import SecurityDashboard from './dashboards/SecurityDashboard'
import AccountantDashboard from './dashboards/AccountantDashboard'
import TECDashboard from './dashboards/TECDashboard'

interface DashboardProps {
  loading?: boolean
}

const ROLE_DASHBOARD_MAP: Record<string, React.ComponentType<DashboardProps>> = {
  ADMIN: AdminDashboard,
  PAO: PAODashboard,
  STOREKEEPER: StorekeeperDashboard,
  DEPARTMENT_HEAD: DepartmentHeadDashboard,
  REQUESTER: RequesterDashboard,
  SECURITY_OFFICER: SecurityDashboard,
  ACCOUNTANT: AccountantDashboard,
  TEC: TECDashboard,
  PROPERTY_REGISTRATION_OFFICER: AccountantDashboard,
}

const FALLBACK_DASHBOARD = AdminDashboard

export default function Dashboard({ loading }: DashboardProps) {
  const { userRoles } = useApp()

  const primaryRole = userRoles[0] || 'ADMIN'
  const DashboardComponent = ROLE_DASHBOARD_MAP[primaryRole] || FALLBACK_DASHBOARD

  return <DashboardComponent loading={loading} />
}
