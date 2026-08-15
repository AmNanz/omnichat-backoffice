export interface PermissionModule {
  module: string;
  label?: string;
  permissions: string[];
}

export interface PermissionCatalog {
  modules: PermissionModule[] | Record<string, string[]>;
  all: string[];
}
