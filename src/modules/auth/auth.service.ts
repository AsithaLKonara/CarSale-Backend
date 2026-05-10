import { UserRole } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import { prisma } from '../../lib/prisma';
import { TokenPayload, UserResponse } from './auth.types';

class AuthService {
  private get jwtSecret(): string {
    return process.env.JWT_SECRET || 'fallback_default_access_secret';
  }

  private get jwtRefreshSecret(): string {
    return process.env.JWT_REFRESH_SECRET || 'fallback_default_refresh_secret';
  }

  private get accessExpiration(): string {
    return process.env.JWT_ACCESS_EXPIRATION || '15m';
  }

  private get refreshExpiration(): string {
    return process.env.JWT_REFRESH_EXPIRATION || '7d';
  }

  // 1. Sign tokens
  public generateAccessToken(payload: TokenPayload): string {
    return jwt.sign(payload, this.jwtSecret, { expiresIn: this.accessExpiration as any });
  }

  public generateRefreshToken(payload: TokenPayload): string {
    return jwt.sign(payload, this.jwtRefreshSecret, { expiresIn: this.refreshExpiration as any });
  }

  // 2. Register User
  public async register(email: string, password_raw: string, role: UserRole): Promise<UserResponse> {
    const existing = await prisma.adminUser.findUnique({ where: { email } });
    if (existing) {
      const error: any = new Error('A user with this email address already exists');
      error.statusCode = 409;
      error.name = 'ConflictError';
      throw error;
    }

    // Resolve default organization
    let defaultOrg = await prisma.organization.findUnique({ where: { slug: 'ultradrive-hq' } });
    if (!defaultOrg) {
      defaultOrg = await prisma.organization.create({
        data: { name: 'UltraDrive HQ', slug: 'ultradrive-hq' }
      });
    }

    const hashedPassword = await bcrypt.hash(password_raw, 10);
    const user = await prisma.adminUser.create({
      data: {
        email,
        password: hashedPassword,
        role,
        organizationId: defaultOrg.id,
      },
    });

    return {
      id: user.id,
      email: user.email,
      role: user.role,
      organizationId: user.organizationId,
      createdAt: user.createdAt,
    };
  }

  // 3. Login User
  public async login(email: string, password_raw: string): Promise<{ accessToken: string; refreshToken: string; user: UserResponse }> {
    const user = await prisma.adminUser.findUnique({ where: { email } });
    if (!user) {
      const error: any = new Error('Invalid email or password credentials');
      error.statusCode = 401;
      error.name = 'UnauthorizedError';
      throw error;
    }

    const isMatch = await bcrypt.compare(password_raw, user.password);
    if (!isMatch) {
      const error: any = new Error('Invalid email or password credentials');
      error.statusCode = 401;
      error.name = 'UnauthorizedError';
      throw error;
    }

    const payload: TokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      organizationId: user.organizationId,
      roleId: user.roleId,
    };

    const accessToken = this.generateAccessToken(payload);
    const refreshToken = this.generateRefreshToken(payload);

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        organizationId: user.organizationId,
        roleId: user.roleId,
        createdAt: user.createdAt,
      },
    };
  }

  // 4. Refresh token cycle
  public async refresh(refreshToken: string): Promise<{ accessToken: string; newRefreshToken: string; user: TokenPayload }> {
    try {
      const decoded = jwt.verify(refreshToken, this.jwtRefreshSecret) as TokenPayload;
      
      // Verify user still exists in database
      const user = await prisma.adminUser.findUnique({ where: { id: decoded.userId } });
      if (!user) {
         const error: any = new Error('Authenticated user session has expired or been revoked');
         error.statusCode = 401;
         throw error;
      }

      const payload: TokenPayload = {
        userId: user.id,
        email: user.email,
        role: user.role,
        organizationId: user.organizationId,
        roleId: user.roleId,
      };

      const accessToken = this.generateAccessToken(payload);
      const newRefreshToken = this.generateRefreshToken(payload);

      return {
        accessToken,
        newRefreshToken,
        user: payload,
      };
    } catch (e) {
      const error: any = new Error('Invalid or expired refresh token session');
      error.statusCode = 401;
      error.name = 'TokenExpiredError';
      throw error;
    }
  }

  // 5. Get current profile details
  public async getMe(userId: string): Promise<UserResponse> {
    const user = await prisma.adminUser.findUnique({ where: { id: userId } });
    if (!user) {
      const error: any = new Error('The requested administrative user profile was not found');
      error.statusCode = 404;
      throw error;
    }

    return {
      id: user.id,
      email: user.email,
      role: user.role,
      organizationId: user.organizationId,
      roleId: user.roleId,
      createdAt: user.createdAt,
    };
  }
}

export const authService = new AuthService();
