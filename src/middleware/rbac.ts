import { Request, Response, NextFunction } from 'express';

/**
 * Role-Based Access Control (RBAC) middleware
 * Validates user roles against required permissions for route access
 */

export enum Role {
  ADMIN = 'ADMIN',
  VENDOR = 'VENDOR',
  AFFILIATE = 'AFFILIATE',
  INFLUENCER = 'INFLUENCER',
  BUYER = 'BUYER'
}

// Role hierarchy - higher roles inherit permissions from lower ones
const ROLE_HIERARCHY: Record<Role, number> = {
  [Role.BUYER]: 1,
  [Role.AFFILIATE]: 2,
  [Role.INFLUENCER]: 2,
  [Role.VENDOR]: 3,
  [Role.ADMIN]: 4
};

// Extended request interface to include user info from auth middleware
interface AuthenticatedRequest extends Request {
  user?: {
    sub: string;
    role: Role;
    [key: string]: any;
  };
}

/**
 * Main RBAC middleware - allows access to users with specified roles
 * Checks direct role match OR hierarchy inheritance.
 */
export const allow = (...roles: Role[] | string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const authReq = req as AuthenticatedRequest;

    if (!authReq.user) {
      res.status(401).json({ message: 'Authentication required', error: 'UNAUTHORIZED' });
      return;
    }

    const userRole = authReq.user.role;
    const allowedRoles = roles as Role[];

    if (allowedRoles.includes(userRole)) {
      return next();
    }

    // Hierarchy check
    const userRoleLevel = ROLE_HIERARCHY[userRole];
    const hasPermission = allowedRoles.some(role => {
      const requiredLevel = ROLE_HIERARCHY[role as Role];
      return userRoleLevel >= requiredLevel;
    });

    if (hasPermission) return next();

    res.status(403).json({
      message: 'Insufficient permissions',
      error: 'FORBIDDEN',
      required: roles,
      current: userRole
    });
  };
};

/**
 * Strict role check - only allows exact role matches (no hierarchy)
 */
export const allowOnly = (...roles: Role[] | string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const authReq = req as AuthenticatedRequest;

    if (!authReq.user) {
      res.status(401).json({ message: 'Authentication required', error: 'UNAUTHORIZED' });
      return;
    }

    if (!(roles as Role[]).includes(authReq.user.role)) {
      res.status(403).json({
        message: 'Insufficient permissions',
        error: 'FORBIDDEN',
        required: roles,
        current: authReq.user.role
      });
      return;
    }

    next();
  };
};

/**
 * Resource ownership check - ensures user can only access their own resources
 */
export const allowOwner = (resourceUserIdField = 'userId', requestParamName = 'id') => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const authReq = req as AuthenticatedRequest;

    if (!authReq.user) {
      res.status(401).json({ message: 'Authentication required', error: 'UNAUTHORIZED' });
      return;
    }

    const userId = authReq.user.sub;
    const resourceId = req.params[requestParamName];

    // POST: check ownership in body
    if (req.method === 'POST' && req.body[resourceUserIdField]) {
      if (req.body[resourceUserIdField] !== userId) {
        res.status(403).json({ message: 'Can only access your own resources', error: 'FORBIDDEN' });
        return;
      }
    }

    (req as any).resourceOwnership = { userId, resourceId, resourceUserIdField };
    next();
  };
};

/**
 * Combination middleware - allows role-based access OR resource ownership
 */
export const allowRoleOrOwner = (
  roles: Role[] | string[],
  resourceUserIdField = 'userId',
  requestParamName = 'id'
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const authReq = req as AuthenticatedRequest;

    if (!authReq.user) {
      res.status(401).json({ message: 'Authentication required', error: 'UNAUTHORIZED' });
      return;
    }

    const userRole = authReq.user.role;
    if ((roles as Role[]).includes(userRole)) return next();

    const userId = authReq.user.sub;
    const resourceUserId = req.body[resourceUserIdField] || req.params[resourceUserIdField];

    if (resourceUserId && resourceUserId === userId) return next();

    res.status(403).json({ message: 'Insufficient permissions or not resource owner', error: 'FORBIDDEN' });
  };
};

/**
 * Helpers
 */
export const hasRole = (user: { role: Role }, ...roles: Role[]): boolean => {
  return roles.includes(user.role);
};

export const hasMinRole = (user: { role: Role }, minRole: Role): boolean => {
  return ROLE_HIERARCHY[user.role] >= ROLE_HIERARCHY[minRole];
};

/**
 * Prebuilt role middlewares
 */
export const requireAdmin = allow(Role.ADMIN);
export const requireVendorOrAdmin = allow(Role.VENDOR, Role.ADMIN);
export const requireAffiliateOrAdmin = allow(Role.AFFILIATE, Role.ADMIN);
export const requireInfluencerOrAdmin = allow(Role.INFLUENCER, Role.ADMIN);

/**
 * Middleware that allows any authenticated user (any role)
 */
export const requireAuthenticated = (req: Request, res: Response, next: NextFunction): void => {
  const authReq = req as AuthenticatedRequest;
  if (!authReq.user) {
    res.status(401).json({ message: 'Authentication required', error: 'UNAUTHORIZED' });
    return;
  }
  next();
};

export default {
  allow,
  allowOnly,
  allowOwner,
  allowRoleOrOwner,
  hasRole,
  hasMinRole,
  requireAdmin,
  requireVendorOrAdmin,
  requireAffiliateOrAdmin,
  requireInfluencerOrAdmin,
  requireAuthenticated,
  Role
};
