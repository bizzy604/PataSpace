import { AdminShell } from './components/layout/AdminShell';
import { DashboardPage } from './pages/DashboardPage';

export default function App() {
  return (
    <AdminShell>
      <DashboardPage />
    </AdminShell>
  );
}
