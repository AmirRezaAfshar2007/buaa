import dotenv from 'dotenv';

dotenv.config();

function required(name: string): string {
  const value = process.env[name];
  if (!value || value.trim() === '') {
    // Fail fast at boot rather than limping along with an undefined secret.
    throw new Error(
      `Missing required environment variable: ${name}. Copy .env.example to .env and fill it in.`
    );
  }
  return value;
}

export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000', 10),
  jwtSecret: required('JWT_SECRET'),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  mongoUri: required('MONGODB_URI'),
  // Alibaba Cloud Bailian / DashScope (Qwen models). Mainland-China-reachable,
  // no VPN required — this replaced the Google Gemini integration, which was
  // blocked in mainland China without one. Get a key at bailian.console.aliyun.com.
  dashscopeApiKey: process.env.DASHSCOPE_API_KEY || '',
  corsOrigin: process.env.CORS_ORIGIN || '',
  isProduction: process.env.NODE_ENV === 'production',
  // Optional outbound HTTPS proxy. Some corporate/school networks and VPNs
  // require all outbound traffic to go through a proxy — browsers usually
  // pick this up automatically from OS settings, but Node's fetch does not.
  // Set HTTPS_PROXY (or HTTP_PROXY) in .env if AI calls are timing out.
  httpsProxy: process.env.HTTPS_PROXY || process.env.https_proxy || process.env.HTTP_PROXY || process.env.http_proxy || '',
};
