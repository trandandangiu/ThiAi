// backend/src/middlewares/permission.js

/**
 * requirePermission('perm:a', 'perm:b', 'perm:c')
 *
 * Logic OR: Cho phép nếu user có ÍT NHẤT 1 trong các quyền.
 *
 * VD: requirePermission('dispatch:view:all', 'dispatch:view:own')
 *   - User có 'dispatch:view:all' → PASS ✅
 *   - User có 'dispatch:view:own' → PASS ✅
 *   - User có cả 2 → PASS ✅
 *   - User không có cả 2 → 403 ❌
 */
export function requirePermission(...requiredPerms) {
  return (req, res, next) => {
    const user = req.user;

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Chưa đăng nhập',
      });
    }

    const userPerms = user.permissions || [];
    const userRoles = user.roles || [];

    // ADMIN bypass tất cả
    if (userRoles.includes('ADMIN')) {
      return next();
    }

    // Nếu route không yêu cầu quyền cụ thể → cho qua
    if (requiredPerms.length === 0) {
      return next();
    }

    // Check OR: có ÍT NHẤT 1 permission
    const hasAny = requiredPerms.some(perm => userPerms.includes(perm));

    if (!hasAny) {
      return res.status(403).json({
        success: false,
        message: 'Không có quyền truy cập',
        require: requiredPerms,
        userPerms,
      });
    }

    next();
  };
}