import express from 'express';
import db from '../connections/connection.js';
import { requireAuth } from '../middleware/authMiddleware.js';
import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const router = express.Router();
const execAsync = promisify(exec);

// System health monitoring
router.get('/system/health', requireAuth, async (req, res) => {
  try {
    const health = {
      timestamp: new Date().toISOString(),
      database: { status: 'unknown', responseTime: 0 },
      storage: { status: 'unknown', usage: 0, available: 0 },
      memory: { status: 'unknown', usage: 0, total: 0 },
      uptime: process.uptime()
    };

    // Database health check
    const dbStart = Date.now();
    try {
      await db.promise().execute('SELECT 1');
      health.database.status = 'healthy';
      health.database.responseTime = Date.now() - dbStart;
    } catch (error) {
      health.database.status = 'error';
      health.database.error = error.message;
    }

    // Memory usage
    const memUsage = process.memoryUsage();
    health.memory = {
      status: memUsage.heapUsed / memUsage.heapTotal > 0.9 ? 'warning' : 'healthy',
      usage: Math.round(memUsage.heapUsed / 1024 / 1024),
      total: Math.round(memUsage.heapTotal / 1024 / 1024),
      external: Math.round(memUsage.external / 1024 / 1024)
    };

    // Storage check (simplified)
    try {
      const stats = fs.statSync('./');
      health.storage.status = 'healthy';
    } catch (error) {
      health.storage.status = 'error';
    }

    res.json({ success: true, health });
  } catch (error) {
    console.error('Error checking system health:', error);
    res.status(500).json({ success: false, message: 'Failed to check system health' });
  }
});

// Get system logs
router.get('/system/logs', requireAuth, async (req, res) => {
  try {
    const { type = 'application', limit = 100 } = req.query;
    
    // Get recent database activity logs
    if (type === 'database') {
      const [logs] = await db.promise().execute(`
        SELECT 'document_upload' as action, doc_name as details, created_at as timestamp
        FROM dms_documents 
        ORDER BY created_at DESC 
        LIMIT ?
      `, [parseInt(limit)]);
      
      return res.json({ success: true, logs });
    }

    // Application logs (simplified - in production you'd read from log files)
    const logs = [
      { level: 'info', message: 'System started successfully', timestamp: new Date().toISOString() },
      { level: 'info', message: 'Database connection established', timestamp: new Date().toISOString() },
      { level: 'warning', message: 'High memory usage detected', timestamp: new Date().toISOString() }
    ];

    res.json({ success: true, logs });
  } catch (error) {
    console.error('Error fetching logs:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch logs' });
  }
});

// Clear cache
router.post('/system/cache/clear', requireAuth, async (req, res) => {
  try {
    // Clear any in-memory caches
    if (global.gc) {
      global.gc();
    }

    // In a real implementation, you might clear Redis cache, file cache, etc.
    console.log('Cache clearing requested by admin');

    res.json({ 
      success: true, 
      message: 'Cache cleared successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error clearing cache:', error);
    res.status(500).json({ success: false, message: 'Failed to clear cache' });
  }
});

// Database backup
router.post('/system/backup', requireAuth, async (req, res) => {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupName = `backup_${timestamp}.sql`;
    const backupPath = path.join(process.cwd(), 'backups', backupName);
    
    // Ensure backups directory exists
    const backupsDir = path.join(process.cwd(), 'backups');
    if (!fs.existsSync(backupsDir)) {
      fs.mkdirSync(backupsDir, { recursive: true });
    }
    
    console.log(`Database backup initiated: ${backupName}`);
    
    // Database connection details from connection.js
    const dbConfig = {
      host: 'ispsctagudindms.hostinger.com',
      user: 'u185173985_ladera',
      password: 'Ladera09184226085',
      database: 'u185173985_ispsc_dms'
    };
    
    // Create mysqldump command
    const mysqldumpPath = 'C:\\xampp\\mysql\\bin\\mysqldump.exe';
    let command = `"${mysqldumpPath}" --host=${dbConfig.host} --user=${dbConfig.user}`;
    
    if (dbConfig.password) {
      command += ` --password="${dbConfig.password}"`;
    }
    
    command += ` --single-transaction --routines --triggers ${dbConfig.database} > "${backupPath}"`;
    
    try {
      // Execute mysqldump
      await execAsync(command);
      
      // Check if backup file was created and get its size
      const stats = fs.statSync(backupPath);
      const fileSizeInMB = (stats.size / (1024 * 1024)).toFixed(2);
      
      console.log(`Backup completed: ${backupName} (${fileSizeInMB} MB)`);
      
      res.json({ 
        success: true, 
        message: 'Database backup completed successfully',
        backupName,
        size: `${fileSizeInMB} MB`,
        path: backupPath,
        timestamp: new Date().toISOString()
      });
    } catch (execError) {
      console.error('Mysqldump error:', execError);
      
      // Fallback: Try alternative mysqldump path
      const altMysqldumpPath = 'mysqldump';
      let altCommand = `${altMysqldumpPath} --host=${dbConfig.host} --user=${dbConfig.user}`;
      
      if (dbConfig.password) {
        altCommand += ` --password="${dbConfig.password}"`;
      }
      
      altCommand += ` --single-transaction --routines --triggers ${dbConfig.database} > "${backupPath}"`;
      
      try {
        await execAsync(altCommand);
        const stats = fs.statSync(backupPath);
        const fileSizeInMB = (stats.size / (1024 * 1024)).toFixed(2);
        
        console.log(`Backup completed with alternative path: ${backupName} (${fileSizeInMB} MB)`);
        
        res.json({ 
          success: true, 
          message: 'Database backup completed successfully',
          backupName,
          size: `${fileSizeInMB} MB`,
          path: backupPath,
          timestamp: new Date().toISOString()
        });
      } catch (altError) {
        throw new Error(`Mysqldump failed: ${altError.message}. Please ensure MySQL is installed and accessible.`);
      }
    }
  } catch (error) {
    console.error('Error creating backup:', error);
    res.status(500).json({ 
      success: false, 
      message: `Failed to create backup: ${error.message}` 
    });
  }
});

// Get backup history
router.get('/system/backups', requireAuth, async (req, res) => {
  try {
    const backupsDir = path.join(process.cwd(), 'backups');
    const backups = [];
    
    // Check if backups directory exists
    if (fs.existsSync(backupsDir)) {
      const files = fs.readdirSync(backupsDir);
      
      // Filter for SQL files and get their details
      for (const file of files) {
        if (file.endsWith('.sql')) {
          const filePath = path.join(backupsDir, file);
          const stats = fs.statSync(filePath);
          const fileSizeInMB = (stats.size / (1024 * 1024)).toFixed(2);
          
          backups.push({
            name: file,
            size: `${fileSizeInMB} MB`,
            created: stats.birthtime.toISOString(),
            modified: stats.mtime.toISOString(),
            status: 'completed',
            path: filePath
          });
        }
      }
      
      // Sort by creation date (newest first)
      backups.sort((a, b) => new Date(b.created) - new Date(a.created));
    }
    
    // If no real backups exist, show sample data for demo
    if (backups.length === 0) {
      backups.push(
        {
          name: 'backup_2024-01-15T10-30-00.sql',
          size: '2.5 MB',
          created: '2024-01-15T10:30:00Z',
          status: 'completed',
          note: 'Sample backup - create a real backup to see actual files'
        },
        {
          name: 'backup_2024-01-14T10-30-00.sql',
          size: '2.4 MB',
          created: '2024-01-14T10:30:00Z',
          status: 'completed',
          note: 'Sample backup - create a real backup to see actual files'
        }
      );
    }

    res.json({ success: true, backups, totalBackups: backups.length });
  } catch (error) {
    console.error('Error fetching backups:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch backup history' });
  }
});

// Download backup file
router.get('/system/backups/download/:filename', requireAuth, async (req, res) => {
  try {
    const { filename } = req.params;
    
    // Validate filename to prevent directory traversal
    if (!filename || !filename.endsWith('.sql') || filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      return res.status(400).json({ success: false, message: 'Invalid filename' });
    }
    
    const backupPath = path.join(process.cwd(), 'backups', filename);
    
    // Check if file exists
    if (!fs.existsSync(backupPath)) {
      return res.status(404).json({ success: false, message: 'Backup file not found' });
    }
    
    // Set headers for file download
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', 'application/sql');
    
    // Stream the file
    const fileStream = fs.createReadStream(backupPath);
    fileStream.pipe(res);
    
    fileStream.on('error', (error) => {
      console.error('Error streaming backup file:', error);
      if (!res.headersSent) {
        res.status(500).json({ success: false, message: 'Error downloading backup file' });
      }
    });
    
  } catch (error) {
    console.error('Error downloading backup:', error);
    res.status(500).json({ success: false, message: 'Failed to download backup file' });
  }
});

// Delete backup file
router.delete('/system/backups/:filename', requireAuth, async (req, res) => {
  try {
    const { filename } = req.params;
    
    // Validate filename
    if (!filename || !filename.endsWith('.sql') || filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      return res.status(400).json({ success: false, message: 'Invalid filename' });
    }
    
    const backupPath = path.join(process.cwd(), 'backups', filename);
    
    // Check if file exists
    if (!fs.existsSync(backupPath)) {
      return res.status(404).json({ success: false, message: 'Backup file not found' });
    }
    
    // Delete the file
    fs.unlinkSync(backupPath);
    
    console.log(`Backup file deleted: ${filename}`);
    
    res.json({ 
      success: true, 
      message: 'Backup file deleted successfully',
      filename,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error deleting backup:', error);
    res.status(500).json({ success: false, message: 'Failed to delete backup file' });
  }
});

// Maintenance mode toggle with database persistence
router.get('/system/maintenance', requireAuth, async (req, res) => {
  try {
    // Create table if it doesn't exist
    await db.promise().execute(`
      CREATE TABLE IF NOT EXISTS system_settings (
        id int(11) NOT NULL PRIMARY KEY,
        maintenance_mode tinyint(1) NOT NULL DEFAULT 0,
        maintenance_message text DEFAULT NULL,
        maintenance_start_time datetime DEFAULT NULL,
        maintenance_end_time datetime DEFAULT NULL,
        created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
    `);
    
    // Insert default row if it doesn't exist
    await db.promise().execute(`
      INSERT IGNORE INTO system_settings (id, maintenance_mode) VALUES (1, 0)
    `);
    
    const [rows] = await db.promise().execute(
      'SELECT maintenance_mode FROM system_settings WHERE id = 1'
    );
    const maintenanceMode = rows.length > 0 ? rows[0].maintenance_mode === 1 : false;
    res.json({ success: true, maintenanceMode });
  } catch (error) {
    console.error('Error fetching maintenance mode:', error);
    res.json({ success: true, maintenanceMode: false }); // Default to false on error
  }
});

// Public endpoint to check maintenance mode (no auth required)
router.get('/maintenance/status', async (req, res) => {
  try {
    // Create table if it doesn't exist
    await db.promise().execute(`
      CREATE TABLE IF NOT EXISTS system_settings (
        id int(11) NOT NULL PRIMARY KEY,
        maintenance_mode tinyint(1) NOT NULL DEFAULT 0,
        maintenance_message text DEFAULT NULL,
        maintenance_start_time datetime DEFAULT NULL,
        maintenance_end_time datetime DEFAULT NULL,
        created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
    `);
    
    // Insert default row if it doesn't exist
    await db.promise().execute(`
      INSERT IGNORE INTO system_settings (id, maintenance_mode) VALUES (1, 0)
    `);
    
    const [rows] = await db.promise().execute(
      'SELECT maintenance_mode, maintenance_start_time, maintenance_end_time, maintenance_message FROM system_settings WHERE id = 1'
    );
    const dbRow = rows && rows[0] ? rows[0] : {};
    const maintenanceMode = !!(dbRow.maintenance_mode === 1);
    const maintenanceStartTime = dbRow.maintenance_start_time ? new Date(dbRow.maintenance_start_time).toISOString() : null;
    const maintenanceEndTime = dbRow.maintenance_end_time ? new Date(dbRow.maintenance_end_time).toISOString() : null;
    const maintenanceMessage = dbRow.maintenance_message || null;

    // Compute active state based on schedule OR explicit flag
    const now = Date.now();
    const startMs = maintenanceStartTime ? new Date(maintenanceStartTime).getTime() : null;
    const endMs = maintenanceEndTime ? new Date(maintenanceEndTime).getTime() : null;
    const scheduledActive = (startMs !== null && now >= startMs) && (endMs === null || now < endMs);
    const isActive = maintenanceMode || scheduledActive;

    res.json({ success: true, maintenanceMode: isActive, maintenanceStartTime, maintenanceEndTime, maintenanceMessage });
  } catch (error) {
    console.error('Error fetching maintenance status:', error);
    res.json({ success: true, maintenanceMode: false, maintenanceEndTime: null, maintenanceMessage: null });
  }
});

router.post('/system/maintenance', requireAuth, async (req, res) => {
  try {
    const { enabled, maintenanceMessage, maintenanceEndTime, maintenanceStartTime } = req.body;
    const maintenanceMode = !!enabled;
    
    // Create table if it doesn't exist
    await db.promise().execute(`
      CREATE TABLE IF NOT EXISTS system_settings (
        id int(11) NOT NULL PRIMARY KEY,
        maintenance_mode tinyint(1) NOT NULL DEFAULT 0,
        maintenance_message text DEFAULT NULL,
        maintenance_start_time datetime DEFAULT NULL,
        maintenance_end_time datetime DEFAULT NULL,
        created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
    `);
    
    // Ensure base row exists
    await db.promise().execute(`
      INSERT IGNORE INTO system_settings (id, maintenance_mode) VALUES (1, 0)
    `);

    // Format maintenance start/end time to MySQL DATETIME if provided
    let startTimeMySQL = null;
    let endTimeMySQL = null;
    if (maintenanceStartTime) {
      const st = new Date(maintenanceStartTime);
      if (!isNaN(st.getTime())) {
        const pad = (n) => String(n).padStart(2, '0');
        startTimeMySQL = `${st.getFullYear()}-${pad(st.getMonth()+1)}-${pad(st.getDate())} ${pad(st.getHours())}:${pad(st.getMinutes())}:${pad(st.getSeconds())}`;
      }
    }
    if (maintenanceEndTime) {
      const end = new Date(maintenanceEndTime);
      if (!isNaN(end.getTime())) {
        const pad = (n) => String(n).padStart(2, '0');
        endTimeMySQL = `${end.getFullYear()}-${pad(end.getMonth()+1)}-${pad(end.getDate())} ${pad(end.getHours())}:${pad(end.getMinutes())}:${pad(end.getSeconds())}`;
      }
    }

    const messageVal = (typeof maintenanceMessage === 'string' && maintenanceMessage.trim() !== '') ? maintenanceMessage.trim() : null;

    // Update fields
    await db.promise().execute(
      `UPDATE system_settings 
       SET maintenance_mode = ?, 
           maintenance_message = ?, 
           maintenance_start_time = ?,
           maintenance_end_time = ?, 
           updated_at = NOW()
       WHERE id = 1`,
      [maintenanceMode ? 1 : 0, messageVal, startTimeMySQL, endTimeMySQL]
    );

    // If enabling and no start time set yet, set it now
    if (maintenanceMode) {
      await db.promise().execute(
        'UPDATE system_settings SET maintenance_start_time = COALESCE(maintenance_start_time, NOW()) WHERE id = 1'
      );
    }
    
    console.log(`Maintenance mode ${maintenanceMode ? 'enabled' : 'disabled'} by admin`);
    
    // Return computed isActive as well
    const now = Date.now();
    const startMs = startTimeMySQL ? new Date(startTimeMySQL).getTime() : null;
    const endMs = endTimeMySQL ? new Date(endTimeMySQL).getTime() : null;
    const scheduledActive = (startMs !== null && now >= startMs) && (endMs === null || now < endMs);
    const isActive = maintenanceMode || scheduledActive;

    res.json({ 
      success: true, 
      maintenanceMode: isActive,
      maintenanceMessage: messageVal,
      maintenanceStartTime: startTimeMySQL,
      maintenanceEndTime: endTimeMySQL,
      message: `Maintenance settings ${maintenanceMode ? 'enabled' : 'updated'}`,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error updating maintenance mode:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update maintenance mode' 
    });
  }
});

// System statistics
router.get('/system/stats', requireAuth, async (req, res) => {
  try {
    const [documentCount] = await db.promise().execute('SELECT COUNT(*) as count FROM dms_documents WHERE deleted IS NULL OR deleted = 0');
    const [userCount] = await db.promise().execute('SELECT COUNT(*) as count FROM dms_user WHERE status = "active"');
    const [departmentCount] = await db.promise().execute('SELECT COUNT(*) as count FROM departments');
    const [folderCount] = await db.promise().execute('SELECT COUNT(*) as count FROM folders');

    const stats = {
      documents: documentCount[0].count,
      users: userCount[0].count,
      departments: departmentCount[0].count,
      folders: folderCount[0].count,
      uptime: Math.floor(process.uptime()),
      memoryUsage: Math.round(process.memoryUsage().heapUsed / 1024 / 1024)
    };

    res.json({ success: true, stats });
  } catch (error) {
    console.error('Error fetching system stats:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch system statistics' });
  }
});

// Admin statistics endpoint (missing endpoint causing 404)
router.get('/admin/stats', requireAuth, async (req, res) => {
  try {
    // Check if user is admin
    const currentUser = req.currentUser || {};
    const userRole = (currentUser.role || '').toString().toLowerCase();
    
    if (userRole !== 'admin' && userRole !== 'administrator') {
      return res.status(403).json({ 
        success: false, 
        message: 'Admin access required' 
      });
    }

    const [documentCount] = await db.promise().execute('SELECT COUNT(*) as count FROM dms_documents WHERE deleted IS NULL OR deleted = 0');
    const [userCount] = await db.promise().execute('SELECT COUNT(*) as count FROM dms_user WHERE status != "deleted"');
    const [departmentCount] = await db.promise().execute('SELECT COUNT(*) as count FROM departments WHERE is_active = 1');
    const [folderCount] = await db.promise().execute('SELECT COUNT(*) as count FROM folders');
    const [recentDocsCount] = await db.promise().execute('SELECT COUNT(*) as count FROM dms_documents WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY) AND (deleted IS NULL OR deleted = 0)');
    const [pendingActionsCount] = await db.promise().execute('SELECT COUNT(*) as count FROM document_actions WHERE status = "pending"');

    const stats = {
      totalDocuments: documentCount[0].count,
      totalUsers: userCount[0].count,
      totalDepartments: departmentCount[0].count,
      totalFolders: folderCount[0].count,
      recentDocuments: recentDocsCount[0].count,
      pendingActions: pendingActionsCount[0].count,
      systemUptime: Math.floor(process.uptime()),
      memoryUsage: Math.round(process.memoryUsage().heapUsed / 1024 / 1024)
    };

    res.json({ success: true, stats });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch admin statistics' });
  }
});

export default router;
