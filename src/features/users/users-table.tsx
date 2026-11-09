"use client";

import { useState } from "react";
import { toast } from "sonner";

import { ConfirmationDialog } from "@/components/shared/confirmation-dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatRelative, initials } from "@/lib/format";
import { userService } from "@/services";
import { useSessionStore } from "@/stores/session-store";
import type { Role, RoleId, User } from "@/types";

const replaceUser = (user: User) =>
  useSessionStore.setState((s) => ({ users: s.users.map((u) => (u.id === user.id ? user : u)) }));

export function UsersTable({ users, roles, currentUserId }: { users: User[]; roles: Role[]; currentUserId?: string }) {
  const [deactivating, setDeactivating] = useState<User | null>(null);

  const changeRole = async (user: User, roleId: RoleId) => {
    try {
      replaceUser(await userService.updateRole(user.id, roleId));
      toast.success("Rol actualizado", { description: `${user.name} ahora es ${roles.find((r) => r.id === roleId)?.name}.` });
    } catch (error) {
      toast.error("No se pudo cambiar el rol", { description: (error as Error).message });
    }
  };

  const setActive = async (user: User, active: boolean) => {
    try {
      replaceUser(await userService.setActive(user.id, active));
      toast.success(active ? "Usuario activado" : "Usuario desactivado", { description: user.name });
    } catch (error) {
      toast.error("No se pudo actualizar el usuario", { description: (error as Error).message });
      throw error;
    }
  };

  return (
    <div className="overflow-hidden rounded-xl border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="pl-4">Usuario</TableHead>
            <TableHead className="hidden md:table-cell">Cargo</TableHead>
            <TableHead>Rol</TableHead>
            <TableHead className="hidden lg:table-cell">Última actividad</TableHead>
            <TableHead className="pr-4 text-right">Activo</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => {
            const self = user.id === currentUserId;
            return (
              <TableRow key={user.id} className={user.active ? undefined : "opacity-60"}>
                <TableCell className="pl-4">
                  <div className="flex items-center gap-2.5">
                    <Avatar className="size-8">
                      <AvatarFallback className="bg-primary/12 text-xs font-semibold text-primary-ink">{initials(user.name)}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">
                        {user.name} {self && <span className="text-xs font-normal text-muted-foreground">(tú)</span>}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="hidden text-muted-foreground md:table-cell">{user.jobTitle}</TableCell>
                <TableCell>
                  <Select value={user.roleId} onValueChange={(v) => void changeRole(user, v as RoleId)} disabled={self}>
                    <SelectTrigger size="sm" className="w-36" aria-label={`Rol de ${user.name}`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {roles.map((role) => (
                        <SelectItem key={role.id} value={role.id}>
                          {role.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell className="tabular hidden text-muted-foreground lg:table-cell">{formatRelative(user.lastActiveAt)}</TableCell>
                <TableCell className="pr-4 text-right">
                  <Switch
                    checked={user.active}
                    disabled={self}
                    aria-label={`${user.active ? "Desactivar" : "Activar"} a ${user.name}`}
                    onCheckedChange={(checked) => (checked ? void setActive(user, true) : setDeactivating(user))}
                  />
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
      <ConfirmationDialog
        open={!!deactivating}
        onOpenChange={(o) => !o && setDeactivating(null)}
        title={`¿Desactivar a ${deactivating?.name ?? ""}?`}
        description="No podrá iniciar sesión ni ejecutar bots. Sus automatizaciones y su historial se conservan."
        confirmLabel="Desactivar"
        onConfirm={() => (deactivating ? setActive(deactivating, false) : undefined)}
      />
    </div>
  );
}
