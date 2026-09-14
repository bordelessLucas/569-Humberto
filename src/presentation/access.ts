import type { UserRole } from '../domain/types.ts'

export type ScreenAccess = 'none' | 'read' | 'operate'

export interface AppRoute {
  path: string
  label: string
  group: 'Operação' | 'Frota' | 'Evidências' | 'Sistema'
  nav: boolean
  match: (pathname: string) => boolean
  access: Record<UserRole, ScreenAccess>
}

export const appRoutes: AppRoute[] = [
  route('/dashboard', 'Dashboard', 'Operação', true, { admin: 'operate', operador: 'operate', auditor: 'read', gestor: 'read' }),
  route('/connections', 'Conexões', 'Operação', true, { admin: 'operate', operador: 'operate', auditor: 'read', gestor: 'none' }),
  route('/synchronizations', 'Sincronizações', 'Operação', true, { admin: 'operate', operador: 'operate', auditor: 'read', gestor: 'none' }),
  route('/downloads', 'Downloads', 'Operação', true, { admin: 'operate', operador: 'operate', auditor: 'read', gestor: 'none' }),
  route('/processing', 'Processamento', 'Operação', true, { admin: 'operate', operador: 'operate', auditor: 'read', gestor: 'none' }),
  route('/fleet', 'Frota', 'Frota', true, { admin: 'operate', operador: 'operate', auditor: 'read', gestor: 'read' }),
  route('/garages', 'Garagens', 'Frota', true, { admin: 'operate', operador: 'read', auditor: 'none', gestor: 'none' }),
  route('/devices', 'Equipamentos', 'Frota', true, { admin: 'operate', operador: 'read', auditor: 'read', gestor: 'none' }),
  route('/cameras', 'Câmeras', 'Frota', true, { admin: 'operate', operador: 'operate', auditor: 'read', gestor: 'none' }),
  route('/media', 'Videoteca', 'Evidências', true, { admin: 'operate', operador: 'operate', auditor: 'operate', gestor: 'operate' }),
  route('/camera-audit', 'Auditoria', 'Evidências', true, { admin: 'operate', operador: 'operate', auditor: 'operate', gestor: 'none' }),
  route('/incidents', 'Ocorrências', 'Evidências', true, { admin: 'operate', operador: 'operate', auditor: 'read', gestor: 'none' }),
  route('/activity', 'Atividades', 'Evidências', true, { admin: 'operate', operador: 'operate', auditor: 'operate', gestor: 'none' }),
  route('/reports', 'Relatórios', 'Evidências', true, { admin: 'operate', operador: 'operate', auditor: 'operate', gestor: 'read' }),
  route('/storage', 'Armazenamento', 'Sistema', true, { admin: 'operate', operador: 'read', auditor: 'read', gestor: 'none' }),
  route('/users', 'Usuários', 'Sistema', true, { admin: 'operate', operador: 'none', auditor: 'none', gestor: 'none' }),
  route('/settings', 'Configurações', 'Sistema', true, { admin: 'operate', operador: 'none', auditor: 'none', gestor: 'none' }),
  detail('/synchronizations', 'Sincronização', 'Operação', { admin: 'operate', operador: 'operate', auditor: 'read', gestor: 'none' }),
  detail('/vehicles', 'Veículo', 'Frota', { admin: 'operate', operador: 'operate', auditor: 'read', gestor: 'read' }),
  detail('/media', 'Player', 'Evidências', { admin: 'operate', operador: 'operate', auditor: 'operate', gestor: 'operate' }),
]

export function findRoute(pathname: string): AppRoute | undefined {
  return appRoutes.find((item) => item.match(pathname))
}

export function accessFor(role: UserRole, pathname: string): ScreenAccess {
  return findRoute(pathname)?.access[role] ?? 'none'
}

export function navFor(role: UserRole): AppRoute[] {
  return appRoutes.filter((item) => item.nav && item.access[role] !== 'none')
}

export function canManageSetup(role: UserRole): boolean {
  return role === 'admin'
}

export function canOperateQueue(role: UserRole): boolean {
  return role === 'admin' || role === 'operador'
}

export function canResolveIncident(role: UserRole): boolean {
  return role === 'admin' || role === 'operador'
}

export function canExport(role: UserRole): boolean {
  return role === 'admin' || role === 'operador' || role === 'auditor'
}

export function roleLabel(role: UserRole): string {
  if (role === 'admin') return 'Administrador'
  if (role === 'operador') return 'Operador'
  if (role === 'auditor') return 'Auditor'
  return 'Gestor'
}

function route(
  path: string,
  label: string,
  group: AppRoute['group'],
  nav: boolean,
  access: Record<UserRole, ScreenAccess>,
): AppRoute {
  return { path, label, group, nav, access, match: (pathname) => pathname === path }
}

function detail(prefix: string, label: string, group: AppRoute['group'], access: Record<UserRole, ScreenAccess>): AppRoute {
  return {
    path: `${prefix}/:id`,
    label,
    group,
    nav: false,
    access,
    match: (pathname) => pathname.startsWith(`${prefix}/`) && pathname.length > prefix.length + 1 && !pathname.slice(prefix.length + 1).includes('/'),
  }
}
