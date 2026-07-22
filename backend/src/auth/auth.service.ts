import path from 'node:path';

import { Injectable, UnauthorizedException } from '@nestjs/common';
import jwt, { type JwtPayload } from 'jsonwebtoken';

import { createSecret, equal, hash } from '../common/crypto';
import { JsonStore } from '../common/json-store';
import { config } from '../config';

type RefreshRow = {
  expiresAt: number;
  hash: string;
  id: string;
  revoked: boolean;
};

export type TokenPair = {
  accessToken: string;
  accessTokenExpiresIn: number;
  refreshToken: string;
  refreshTokenExpiresIn: number;
};

@Injectable()
export class AuthService {
  private readonly store = new JsonStore<RefreshRow[]>(
    path.join(config.dataDir, 'refresh-tokens.json'),
    [],
  );

  async login(username: string, password: string): Promise<TokenPair> {
    if (!equal(username, config.adminUsername) || !equal(password, config.adminPassword)) {
      throw new UnauthorizedException('Login yoki parol noto‘g‘ri');
    }

    return this.issue();
  }

  async refresh(token: string): Promise<TokenPair> {
    const payload = this.verifyRefresh(token);

    await this.store.update((rows) => {
      const row = rows.find(
        (candidate) =>
          candidate.id === payload.jti &&
          !candidate.revoked &&
          candidate.expiresAt > Date.now() &&
          equal(candidate.hash, hash(token)),
      );

      if (!row) {
        throw new UnauthorizedException('Refresh token revoked yoki muddati tugagan');
      }

      row.revoked = true;
    });

    return this.issue();
  }

  async logout(token: string): Promise<{ loggedOut: true }> {
    let payload: JwtPayload & { jti: string };

    try {
      payload = this.verifyRefresh(token);
    } catch {
      return { loggedOut: true };
    }

    await this.store.update((rows) => {
      const row = rows.find((candidate) => candidate.id === payload.jti);

      if (row) {
        row.revoked = true;
      }
    });

    return { loggedOut: true };
  }

  verifyAccess(token: string): string | JwtPayload {
    try {
      return jwt.verify(token, config.accessSecret);
    } catch {
      throw new UnauthorizedException('Access token invalid yoki muddati tugagan');
    }
  }

  private verifyRefresh(token: string): JwtPayload & { jti: string } {
    try {
      const payload = jwt.verify(token, config.refreshSecret);

      if (typeof payload === 'string' || typeof payload.jti !== 'string') {
        throw new Error('Refresh token payload invalid');
      }

      return payload as JwtPayload & { jti: string };
    } catch {
      throw new UnauthorizedException('Refresh token invalid yoki muddati tugagan');
    }
  }

  private async issue(): Promise<TokenPair> {
    const jti = createSecret();
    const accessToken = jwt.sign({ role: 'admin', sub: 'admin' }, config.accessSecret, {
      expiresIn: config.accessTtl,
    });
    const refreshToken = jwt.sign({ jti, sub: 'admin' }, config.refreshSecret, {
      expiresIn: config.refreshTtl,
    });
    const expiresAt = Date.now() + config.refreshTtl * 1_000;

    await this.store.update((rows) => {
      const activeRows = rows.filter((row) => row.expiresAt > Date.now());
      rows.splice(0, rows.length, ...activeRows, {
        expiresAt,
        hash: hash(refreshToken),
        id: jti,
        revoked: false,
      });
    });

    return {
      accessToken,
      accessTokenExpiresIn: config.accessTtl,
      refreshToken,
      refreshTokenExpiresIn: config.refreshTtl,
    };
  }
}
