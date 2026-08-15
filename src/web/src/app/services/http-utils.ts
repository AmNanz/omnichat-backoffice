import { HttpParams } from '@angular/common/http';
import { ListQuery } from '../models/common.model';

export function toHttpParams(query: ListQuery = {}): HttpParams {
  let params = new HttpParams();
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null || value === '') {
      continue;
    }
    params = params.set(key, String(value));
  }
  return params;
}

export function toIsoDate(value: unknown): string | undefined {
  if (!value) {
    return undefined;
  }
  if (value instanceof Date) {
    return value.toISOString();
  }
  if (typeof value === 'string') {
    return value;
  }
  return undefined;
}

export function apiErrorMessage(error: unknown, fallback = 'ดำเนินการไม่สำเร็จ'): string {
  const err = error as {
    error?: { message?: string | string[] };
    message?: string;
  };
  const msg = err?.error?.message ?? err?.message;
  if (Array.isArray(msg)) {
    return msg.join(', ');
  }
  if (typeof msg === 'string' && msg.trim()) {
    return msg;
  }
  return fallback;
}
