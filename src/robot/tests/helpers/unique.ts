export function uniqueLabel(prefix: string): string {
  return `${prefix} ${Date.now()}`;
}

export function uniqueCode(prefix = 'pw'): string {
  return `${prefix}${Date.now()}`;
}

export function uniqueEmail(prefix = 'pw.user'): string {
  return `${prefix}.${Date.now()}@backoffice.local`;
}
