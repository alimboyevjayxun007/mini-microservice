import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';

export const hash = (value: string): string => createHash('sha256').update(value).digest('hex');

export const createSecret = (): string => randomBytes(32).toString('hex');

export const equal = (left: string, right: string): boolean =>
  timingSafeEqual(
    createHash('sha256').update(left).digest(),
    createHash('sha256').update(right).digest(),
  );
