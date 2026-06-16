import { requireRole } from "@/lib/session";
import { db } from "@/lib/db";
import { fromNow } from "@/lib/format";
import { roleLabel } from "@/lib/nav";
import { PageHeader } from "@/components/app/page-header";
import { CreateUserDialog } from "@/components/forms/create-user-dialog";
import { EditMemberDialog } from "@/components/forms/edit-member-dialog";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default async function AdminUsersPage() {
  const { orgId, id: currentUserId } = await requireRole("ADMIN");
  const members = await db.membership.findMany({
    where: { orgId },
    orderBy: { createdAt: "desc" },
    include: { user: { select: { id: true, name: true, email: true } } },
  });

  return (
    <div className="space-y-7">
      <PageHeader
        title="Users"
        description="Manage student, teacher and admin accounts."
        action={<CreateUserDialog />}
      />

      <Card className="overflow-hidden p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Joined</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {members.map((m) => (
              <TableRow key={m.id}>
                <TableCell className="font-medium">{m.user.name}</TableCell>
                <TableCell className="text-muted-foreground">{m.user.email}</TableCell>
                <TableCell>
                  <Badge variant="secondary">{roleLabel[m.role]}</Badge>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{m.status.toLowerCase()}</Badge>
                </TableCell>
                <TableCell className="text-right text-xs text-muted-foreground">
                  {fromNow(m.createdAt)}
                </TableCell>
                <TableCell className="text-right">
                  <EditMemberDialog
                    member={{
                      membershipId: m.id,
                      name: m.user.name,
                      email: m.user.email,
                      role: m.role,
                      status: m.status,
                      zoomUserId: m.zoomUserId,
                    }}
                    isSelf={m.user.id === currentUserId}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
