'use client';

import { useEffect, useMemo, useState } from 'react';
import { Loader2, Plus, SlidersHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useAuthStore } from '@/lib/store';
import type { UserRole } from '@/lib/types/database';
import {
  createStaffMember,
  getStaffMembers,
  setStaffActive,
  updateStaffRole,
  updateStaffModuleAccess,
  type StaffMember,
} from '@/lib/actions/staff';
import {
  STAFF_MODULE_LABELS,
  STAFF_MODULE_PREFIXES,
  getDefaultStaffModulesForRole,
  normalizeStaffModules,
  type StaffModuleKey,
} from '@/lib/auth/module-access';

const roleOptions: Array<Exclude<UserRole, 'super_admin'>> = [
  'admin',
  'manager',
  'salesperson',
  'accountant',
];

export function StaffSettings() {
  const { profile } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [staff, setStaff] = useState<StaffMember[]>([]);

  const canManage = useMemo(() => {
    return profile?.role === 'admin' || profile?.role === 'super_admin';
  }, [profile?.role]);

  const [newStaff, setNewStaff] = useState({
    email: '',
    full_name: '',
    role: 'salesperson' as Exclude<UserRole, 'super_admin'>,
    temporary_password: '',
    modules: getDefaultStaffModulesForRole('salesperson'),
  });

  const refresh = async () => {
    setLoading(true);
    setError(null);
    const res = await getStaffMembers();
    if (res.error) {
      setError(res.error);
    } else {
      setStaff(res.data ?? []);
    }
    setLoading(false);
  };

  useEffect(() => {
    refresh();
  }, []);

  const onCreate = async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);

    const res = await createStaffMember({
      email: newStaff.email,
      full_name: newStaff.full_name,
      role: newStaff.role,
      temporary_password: newStaff.temporary_password || undefined,
    });

    if (res.error) {
      setError(res.error);
      setSaving(false);
      return;
    }

    // If we can resolve the created user id, save module access override too.
    if ((res as any)?.staff_id) {
      const staffId = (res as any).staff_id as string;
      const modules = normalizeStaffModules(newStaff.modules);
      await updateStaffModuleAccess({ staff_id: staffId, modules });
    }

    setSuccess(
      newStaff.temporary_password?.trim()
        ? 'Staff created. Share the temporary password with them.'
        : 'Invite sent. Staff should check email to set their password.'
    );
    setNewStaff({
      email: '',
      full_name: '',
      role: 'salesperson',
      temporary_password: '',
      modules: getDefaultStaffModulesForRole('salesperson'),
    });
    await refresh();
    setSaving(false);
  };

  const onRoleChange = async (staffId: string, role: Exclude<UserRole, 'super_admin'>) => {
    setError(null);
    setSuccess(null);
    const res = await updateStaffRole({ staff_id: staffId, role });
    if (res.error) {
      setError(res.error);
      return;
    }
    setSuccess('Role updated');
    await refresh();
    setTimeout(() => setSuccess(null), 2000);
  };

  const onActiveChange = async (staffId: string, isActive: boolean) => {
    setError(null);
    setSuccess(null);
    const res = await setStaffActive({ staff_id: staffId, is_active: isActive });
    if (res.error) {
      setError(res.error);
      return;
    }
    setSuccess(isActive ? 'User activated' : 'User deactivated');
    await refresh();
    setTimeout(() => setSuccess(null), 2000);
  };

  const onModulesChange = async (staffId: string, modules: StaffModuleKey[] | null) => {
    setError(null);
    setSuccess(null);
    const res = await updateStaffModuleAccess({ staff_id: staffId, modules });
    if (res.error) {
      setError(res.error);
      return;
    }
    setSuccess('Access updated');
    await refresh();
    setTimeout(() => setSuccess(null), 2000);
  };

  if (loading) return <div className="space-y-4">Loading...</div>;

  return (
    <div className="space-y-4">
      {error && <div className="p-4 bg-destructive/10 text-destructive rounded-lg">{error}</div>}
      {success && (
        <div className="p-4 bg-green-500/10 text-green-600 dark:text-green-400 rounded-lg">
          {success}
        </div>
      )}

      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-sm text-muted-foreground">
            Manage staff accounts, roles, and access for your organization.
          </p>
        </div>

        {canManage && (
          <Dialog>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Staff
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add staff member</DialogTitle>
                <DialogDescription>
                  Create a login for a staff member and assign their role.
                </DialogDescription>
              </DialogHeader>

              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label htmlFor="staff-full-name">Full name</Label>
                  <Input
                    id="staff-full-name"
                    value={newStaff.full_name}
                    onChange={(e) => setNewStaff((s) => ({ ...s, full_name: e.target.value }))}
                    placeholder="e.g. Ali Khan"
                    disabled={saving}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="staff-email">Email</Label>
                  <Input
                    id="staff-email"
                    type="email"
                    value={newStaff.email}
                    onChange={(e) => setNewStaff((s) => ({ ...s, email: e.target.value }))}
                    placeholder="e.g. staff@dealership.com"
                    disabled={saving}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Role</Label>
                  <Select
                    value={newStaff.role}
                    onValueChange={(v) =>
                      setNewStaff((s) => ({
                        ...s,
                        role: v as Exclude<UserRole, 'super_admin'>,
                        modules: getDefaultStaffModulesForRole(v as UserRole),
                      }))
                    }
                    disabled={saving}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      {roleOptions.map((r) => (
                        <SelectItem key={r} value={r}>
                          {r.replace('_', ' ')}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Module access</Label>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" disabled={saving} className="w-full justify-between">
                        <span className="truncate">
                          {newStaff.modules?.length ? `${newStaff.modules.length} selected` : 'Select modules'}
                        </span>
                        <span className="text-muted-foreground text-xs">Customize</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-80 p-0">
                      <div className="px-4 py-3 border-b bg-muted/40">
                        <p className="text-sm font-medium">Module Access</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Toggle modules for this new staff member.
                        </p>
                      </div>
                      <div className="p-2 max-h-[60vh] overflow-y-auto space-y-1">
                        {(Object.keys(STAFF_MODULE_PREFIXES) as StaffModuleKey[]).map((key) => {
                          const locked = key === 'dashboard' || key === 'settings';
                          const selected = normalizeStaffModules(newStaff.modules);
                          const checked = locked ? true : selected.includes(key);
                          return (
                            <div
                              key={key}
                              className={`flex items-center justify-between p-2 rounded-md hover:bg-muted/50 ${locked ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                              onClick={(e) => {
                                if (locked) return;
                                e.preventDefault();
                                const current = new Set<StaffModuleKey>(selected);
                                if (!checked) current.add(key);
                                else current.delete(key);
                                setNewStaff((s) => ({ ...s, modules: Array.from(current) }));
                              }}
                            >
                              <div className="flex flex-col gap-0.5">
                                <span className="text-sm font-medium">{STAFF_MODULE_LABELS[key]}</span>
                                <span className="text-[10px] text-muted-foreground">
                                  {locked ? 'Required' : 'Enable access'}
                                </span>
                              </div>
                              <Switch checked={checked} disabled={locked} />
                            </div>
                          );
                        })}
                      </div>
                      <div className="p-2 border-t bg-muted/40">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full text-xs h-8"
                          onClick={() => setNewStaff((s) => ({ ...s, modules: [] }))}
                        >
                          Clear all (except required)
                        </Button>
                      </div>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <p className="text-xs text-muted-foreground">
                    Dashboard and Settings are always available to avoid lockouts.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="staff-temp-password">Temporary password (optional)</Label>
                  <Input
                    id="staff-temp-password"
                    type="password"
                    value={newStaff.temporary_password}
                    onChange={(e) => setNewStaff((s) => ({ ...s, temporary_password: e.target.value }))}
                    placeholder="Leave blank to send invite email"
                    disabled={saving}
                  />
                  <p className="text-xs text-muted-foreground">
                    If you set a password, the staff member can log in immediately. If left blank,
                    an invite email is sent (requires Supabase email setup).
                  </p>
                </div>
              </div>

              <DialogFooter>
                <Button onClick={onCreate} disabled={saving}>
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create'
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="rounded-md border overflow-x-auto">
        <Table className="min-w-[800px]">
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Modules</TableHead>
              <TableHead>Active</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {staff.map((m) => (
              <TableRow key={m.id}>
                <TableCell className="font-medium">{m.full_name}</TableCell>
                <TableCell className="text-muted-foreground">{m.email || '-'}</TableCell>
                <TableCell className="capitalize">
                  {canManage ? (
                    <Select
                      value={m.role === 'super_admin' ? 'admin' : (m.role as any)}
                      onValueChange={(v) =>
                        onRoleChange(m.id, v as Exclude<UserRole, 'super_admin'>)
                      }
                    >
                      <SelectTrigger className="h-8 w-[140px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {roleOptions.map((r) => (
                          <SelectItem key={r} value={r}>
                            {r.replace('_', ' ')}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    m.role.replace('_', ' ')
                  )}
                </TableCell>
                <TableCell>
                  {canManage ? (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" className="h-8 w-full max-w-[140px] justify-between">
                          <span className="truncate">
                            {(m as any)?.module_access?.length
                              ? `${(m as any).module_access.length} selected`
                              : 'Default'}
                          </span>
                          <SlidersHorizontal className="h-3.5 w-3.5 ml-2 opacity-50" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start" className="w-80 p-0">
                        <div className="px-4 py-3 border-b bg-muted/40">
                          <p className="text-sm font-medium">Module Access</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            Toggle modules for {m.full_name}
                          </p>
                        </div>
                        <div className="p-2 max-h-[60vh] overflow-y-auto space-y-1">
                          {(Object.keys(STAFF_MODULE_PREFIXES) as StaffModuleKey[]).map((key) => {
                            const locked = key === 'dashboard' || key === 'settings';
                            const selected: StaffModuleKey[] =
                              ((m as any)?.module_access as StaffModuleKey[] | null) ?? [];
                            const checked = locked ? true : selected.includes(key);
                            return (
                              <div
                                key={key}
                                className={`flex items-center justify-between p-2 rounded-md hover:bg-muted/50 ${locked ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                                onClick={(e) => {
                                  if (locked) return;
                                  e.preventDefault();
                                  const current = new Set<StaffModuleKey>(selected);
                                  if (!checked) current.add(key);
                                  else current.delete(key);
                                  onModulesChange(m.id, Array.from(current));
                                }}
                              >
                                <div className="flex flex-col gap-0.5">
                                  <span className="text-sm font-medium">{STAFF_MODULE_LABELS[key]}</span>
                                  <span className="text-[10px] text-muted-foreground">
                                    {locked ? 'Required' : 'Enable access'}
                                  </span>
                                </div>
                                <Switch checked={checked} disabled={locked} />
                              </div>
                            );
                          })}
                        </div>
                        <div className="p-2 border-t bg-muted/40">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="w-full text-xs h-8"
                            onClick={() => onModulesChange(m.id, null)}
                          >
                            Reset to role defaults
                          </Button>
                        </div>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={m.is_active}
                      onCheckedChange={(v) => onActiveChange(m.id, v)}
                      disabled={!canManage}
                    />
                    <span className="text-xs text-muted-foreground w-12">
                      {m.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </TableCell>
              </TableRow>
            ))}

            {staff.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-6">
                  No staff found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

