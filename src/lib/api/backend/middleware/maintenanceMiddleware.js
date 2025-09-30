import db from '../connections/connection.js';

// Middleware to check maintenance mode and block access
export const checkMaintenanceMode = async (req, res, next) => {
  try {
    // Always allow these paths during maintenance (including login and auth)
    const allowedPaths = [
      '/api/admin', 
      '/api/system', 
      '/api/maintenance/status',
      '/api/login',
      '/api/auth',
      '/api/logout'
    ];
    const isAllowedPath = allowedPaths.some(path => req.path.startsWith(path));
    
    if (isAllowedPath) {
      return next();
    }

    // Check maintenance mode from database (flag or scheduled window)
    let isActive = false;
    try {
      const [rows] = await db.promise().execute(
        'SELECT maintenance_mode, maintenance_start_time, maintenance_end_time FROM system_settings WHERE id = 1'
      );
      if (rows.length > 0) {
        const row = rows[0];
        const flag = row.maintenance_mode === 1;
        const start = row.maintenance_start_time ? new Date(row.maintenance_start_time).getTime() : null;
        const end = row.maintenance_end_time ? new Date(row.maintenance_end_time).getTime() : null;
        const now = Date.now();
        const scheduled = (start !== null && now >= start) && (end === null || now < end);
        isActive = flag || scheduled;
      } else {
        isActive = false;
      }
    } catch (dbError) {
      console.log('System settings table not found, defaulting maintenance to inactive');
      isActive = false;
    }
    
    if (isActive) {
      // Check if user is authenticated and is admin
      const user = req.currentUser || req.user || (req.session && req.session.user);
      const isAdmin = user && (user.role && user.role.toLowerCase() === 'admin');
      
      if (isAdmin) {
        // Allow admin access during maintenance
        return next();
      }
      
      // Block non-admin users
      if (req.path.startsWith('/api/')) {
        return res.status(503).json({
          success: false,
          message: 'System is currently under maintenance. Only administrators can access the system.',
          maintenanceMode: true,
          code: 'MAINTENANCE_MODE'
        });
      }
      
      // For non-API requests, let the frontend handle the maintenance page
      return res.status(503).json({
        success: false,
        maintenanceMode: true,
        message: 'System is under maintenance'
      });
    }
    
    next();
  } catch (error) {
    console.error('Error checking maintenance mode:', error);
    // On error, allow request to proceed (fail-open)
    next();
  }
};

// Middleware specifically for frontend routes
export const checkMaintenanceModeForRoutes = async (req, res, next) => {
  try {
    // Skip for static assets and API routes
    if (req.path.startsWith('/api/') || 
        req.path.startsWith('/static/') || 
        req.path.includes('.')) {
      return next();
    }

    const [rows] = await db.promise().execute(
      'SELECT maintenance_mode FROM system_settings WHERE id = 1'
    );
    
    const maintenanceMode = rows.length > 0 ? rows[0].maintenance_mode === 1 : false;
    
    if (maintenanceMode) {
      // Redirect to maintenance page for frontend routes
      return res.redirect('/maintenance');
    }
    
    next();
  } catch (error) {
    console.error('Error checking maintenance mode for routes:', error);
    next();
  }
};
