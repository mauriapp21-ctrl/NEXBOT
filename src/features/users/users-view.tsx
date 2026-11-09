"use client";

import { Check, Minus, Users } from "lucide-react";

import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useSessionStore } from "@/stores/session-store";
import type { Permission } from "@/types";

import { InviteUserDialog } from "./invite-user-dialog";
import { UsersTable } from "./users-table";

const permissionLabels: Record<Permission, string> = {
  "automations.view": "Ver automatizaciones y ejecuciones",
  "automations.run": "Ejecutar bots",
  "automations.edit": "Crear, grabar y editar bots",
  "automations.delete": "Eliminar bots",
  "versions.publish": "Publicar y restaurar versiones",
  "users.manage": "Administrar usuarios y roles",
  "settings.manage": "Cambiar la configuración",
};

export function UsersView() {
  const users = useSessionStore((s) => s.users);
  const roles = useSessionStore((s) => s.roles);
  const currentUser = useSessionStore((s) => s.currentUser);
  const ready = useSessionStore((s) => s.status === "ready");
  const active = users.filter((u) => u.active).length;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader
        title="Usuarios y permisos"
        description={ready ? `${users.length} usuarios · ${active} activos` : "Equipo, roles y permisos."}
        actions={<InviteUserDialog roles={roles} />}
      />
      {!ready ? (
        <Skeleton className="h-72 w-full" aria-busy="true" />
      ) : users.length === 0 ? (
        <EmptyState icon={Users} title="Aún no hay usuarios" description="Invita a tu equipo para compartir las automatizaciones." />
      ) : (
        <UsersTable users={users} roles={roles} currentUserId={currentUser?.id} />
      )}

      <section className="space-y-3" aria-labelledby="roles-title">
        <div>
          <h2 id="roles-title" className="text-base font-semibold">
            Roles y permisos
          </h2>
          <p className="text-sm text-muted-foreground">Qué puede hacer cada rol en la plataforma.</p>
        </div>
        <div className="overflow-x-auto rounded-xl border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-4">Permiso</TableHead>
                {roles.map((role) => (
                  <TableHead key={role.id} className="text-center">
                    {role.name}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {(Object.keys(permissionLabels) as Permission[]).map((permission) => (
                <TableRow key={permission}>
                  <TableCell className="pl-4">{permissionLabels[permission]}</TableCell>
                  {roles.map((role) => (
                    <TableCell key={role.id} className="text-center">
                      {role.permissions.includes(permission) ? (
                        <Check className="mx-auto size-4 text-success-ink" aria-label="Permitido" />
                      ) : (
                        <Minus className="mx-auto size-4 text-muted-foreground/60" aria-label="No permitido" />
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <ul className="grid gap-3 md:grid-cols-3">
          {roles.map((role) => (
            <li key={role.id} className="rounded-xl border bg-card p-4">
              <p className="text-sm font-semibold">{role.name}</p>
              <p className="text-xs text-muted-foreground">{role.description}</p>
              <p className="tabular mt-2 text-xs text-muted-foreground">{users.filter((u) => u.roleId === role.id).length} usuarios</p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
