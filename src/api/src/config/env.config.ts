export const resolveAppEnv = (): string =>
  process.env.APP_ENV ?? process.env.NODE_ENV ?? 'local';

export const resolveEnvFilePaths = (): string[] => {
  const appEnv = resolveAppEnv();
  return [`.env.${appEnv}`, '.env', '../.env'];
};

export const maskMongoUri = (uri: string): string => {
  try {
    const parsed = new URL(uri);
    if (parsed.password) {
      parsed.password = '***';
    }
    return parsed.toString();
  } catch {
    return uri.replace(/:([^:@/]+)@/, ':***@');
  }
};
