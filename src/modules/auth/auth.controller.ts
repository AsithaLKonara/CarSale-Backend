import { Request, Response, NextFunction } from 'express';
import { authService } from './auth.service';
import { logAction } from '../audit/audit.service';

const COOKIE_NAME = 'refreshToken';

const getCookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const, // Compatible for localized frontends in monorepos
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
});

class AuthController {
  public register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { email, password, role } = req.body;
      const user = await authService.register(email, password, role);
      
      await logAction({
        action: 'admin_register',
        entity: 'AdminUser',
        entityId: user.id,
        metadata: { ip: req.ip, userAgent: req.headers['user-agent'], creator: req.user?.email },
      });

      res.status(201).json({
        status: 'success',
        message: 'Administrative user registered successfully',
        data: { user },
      });
    } catch (error) {
      next(error);
    }
  };

  public login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { email } = req.body;
    try {
      const { email: email_raw, password } = req.body;
      const { accessToken, refreshToken, user } = await authService.login(email_raw, password);

      // Set refresh token in secure HTTP-only cookie
      res.cookie(COOKIE_NAME, refreshToken, getCookieOptions());

      await logAction({
        action: 'login_success',
        entity: 'AdminUser',
        entityId: user.id,
        userId: user.id,
        metadata: { ip: req.ip, userAgent: req.headers['user-agent'] },
      });

      res.status(200).json({
        status: 'success',
        message: 'Authentication handshake completed successfully',
        data: {
          accessToken,
          user,
        },
      });
    } catch (error) {
      await logAction({
        action: 'login_fail',
        entity: 'AdminUser',
        metadata: { email, ip: req.ip, userAgent: req.headers['user-agent'], error: (error as Error).message },
      });
      next(error);
    }
  };

  public refresh = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const tokenInCookie = req.cookies[COOKIE_NAME];
      if (!tokenInCookie) {
        const error: any = new Error('Refresh token session cookie is missing');
        error.statusCode = 401;
        error.name = 'UnauthorizedError';
        throw error;
      }

      const { accessToken, newRefreshToken, user } = await authService.refresh(tokenInCookie);

      // Rotate refresh token cookie
      res.cookie(COOKIE_NAME, newRefreshToken, getCookieOptions());

      res.status(200).json({
        status: 'success',
        message: 'Access session rotated successfully',
        data: {
          accessToken,
          user,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  public logout = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (req.user) {
        await logAction({
          action: 'logout',
          entity: 'AdminUser',
          userId: req.user.userId,
          metadata: { ip: req.ip, userAgent: req.headers['user-agent'] },
        });
      }

      res.clearCookie(COOKIE_NAME, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
      });

      res.status(200).json({
        status: 'success',
        message: 'Active admin session has been successfully revoked',
      });
    } catch (error) {
      next(error);
    }
  };

  public me = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        const error: any = new Error('Unauthenticated user context');
        error.statusCode = 401;
        throw error;
      }

      const profile = await authService.getMe(req.user.userId);

      res.status(200).json({
        status: 'success',
        data: { user: profile },
      });
    } catch (error) {
      next(error);
    }
  };
}

export const authController = new AuthController();
