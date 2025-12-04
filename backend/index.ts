import express, { type Request, Response, NextFunction } from "express";
import cors from "cors";
import { registerRoutes } from "./routes.js";

const app = express();

// CORS configuration for frontend deployment
const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    const allowedOrigins = [
      process.env.FRONTEND_URL || 'https://www.loadxafrica.com',
      'http://localhost:3000', // Local development
      'https://localhost:3000', // Local development with HTTPS
      'https://afri4-7fb5.vercel.app', // Production frontend
    ];
    
    console.log(`[CORS DEBUG] Incoming request from origin: ${origin || 'NO ORIGIN'}`);
    console.log(`[CORS DEBUG] Allowed origins:`, allowedOrigins);
    
    // Allow requests with no origin (like mobile apps or curl)
    if (!origin) {
      console.log('[CORS DEBUG] Request with no origin - ALLOWED');
      return callback(null, true);
    }
    
    if (allowedOrigins.includes(origin)) {
      console.log('[CORS DEBUG] Origin matched - ALLOWED');
      callback(null, true);
    } else {
      console.log('[CORS DEBUG] Origin not in allowlist - BLOCKED');
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'], 
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  // Log incoming request details
  if (path.startsWith("/api")) {
    console.log(`\n[REQUEST] ${req.method} ${path}`);
    console.log(`[REQUEST] Headers:`, JSON.stringify(req.headers, null, 2));
    if (req.body && Object.keys(req.body).length > 0) {
      console.log(`[REQUEST] Body:`, JSON.stringify(req.body, null, 2));
    }
    if (req.query && Object.keys(req.query).length > 0) {
      console.log(`[REQUEST] Query:`, JSON.stringify(req.query, null, 2));
    }
  }

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      const logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      
      console.log(`${new Date().toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
      })} [express] ${logLine}`);
      
      // Log response for debugging
      if (capturedJsonResponse) {
        console.log(`[RESPONSE] Status: ${res.statusCode}`);
        console.log(`[RESPONSE] Body:`, JSON.stringify(capturedJsonResponse, null, 2));
      }
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    console.error('[ERROR] ============================================');
    console.error('[ERROR] Status:', status);
    console.error('[ERROR] Message:', message);
    console.error('[ERROR] Stack:', err.stack);
    console.error('[ERROR] Full error:', JSON.stringify(err, null, 2));
    console.error('[ERROR] ============================================');

    res.status(status).json({ message });
    throw err;
  });

  // Health check endpoint
  app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // API not found handler
  app.use('/api/*', (req, res) => {
    res.status(404).json({ message: 'API endpoint not found' });
  });

  // Start server
  const port = parseInt(process.env.PORT || '5000', 10);
  
  console.log('\n[SERVER STARTUP] ===================================');
  console.log('[SERVER STARTUP] Environment:', process.env.NODE_ENV || 'development');
  console.log('[SERVER STARTUP] Frontend URL:', process.env.FRONTEND_URL || 'not set');
  console.log('[SERVER STARTUP] Port:', port);
  console.log('[SERVER STARTUP] Host: 0.0.0.0');
  console.log('[SERVER STARTUP] ===================================\n');
  
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    console.log(`${new Date().toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    })} [express] serving on port ${port}`);
    console.log('[SERVER] ✓ Server successfully started and listening for requests\n');
  });
})();
