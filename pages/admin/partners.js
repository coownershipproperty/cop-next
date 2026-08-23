import AdminLayout from '@/components/admin/AdminLayout';
import PartnerHubWorkspace from '@/components/PartnerHubWorkspace';

export default function PartnerHubAdminPage() {
  return (
    <AdminLayout fullBleed>
      <PartnerHubWorkspace entry="admin" />
    </AdminLayout>
  );
}
