import { spawn, type ChildProcess } from 'child_process';
import { checkCommand } from '../../utils/process.js';
import { logger } from '../../utils/logger.js';

export type TunnelProvider = 'cloudflared' | 'tailscale';

export interface TunnelConfig {
  provider?: TunnelProvider;  // undefined = auto-detect
  path?: string;              // for tailscale funnel
}

export interface TunnelResult {
  url: string;
  cleanup: () => Promise<void>;
}

/**
 * Start tunnel (cloudflared or tailscale) with auto-detection
 */
export async function startTunnel(
  port: number,
  config: TunnelConfig = {},
): Promise<TunnelResult | null> {
  let provider = config.provider;

  // Auto-detect if not specified
  if (!provider) {
    if (await checkCommand('cloudflared')) {
      provider = 'cloudflared';
      logger.info('Auto-detected: cloudflared');
    } else if (await checkCommand('tailscale')) {
      provider = 'tailscale';
      logger.info('Auto-detected: tailscale');
    } else {
      logger.warn('No tunnel tool found (cloudflared/tailscale)');
      logger.info('Install one of:');
      logger.info('  cloudflared: brew install cloudflare/cloudflare/cloudflared');
      logger.info('  tailscale: https://tailscale.com/download');
      logger.info('Or use --no-tunnel to skip this step\n');
      return null;
    }
  }

  // Start appropriate tunnel
  return provider === 'tailscale'
    ? startTailscaleFunnel(port, config.path || '/webhook')
    : startCloudflaredTunnel(port);
}

/**
 * Start Cloudflared tunnel
 */
async function startCloudflaredTunnel(port: number): Promise<TunnelResult> {
  const hasCloudflared = await checkCommand('cloudflared');

  if (!hasCloudflared) {
    throw new Error('cloudflared not found');
  }

  const cloudflared = spawn('cloudflared', ['tunnel', '--url', `http://localhost:${port}`]);

  const url = await new Promise<string>((resolve, reject) => {
    let resolved = false;

    cloudflared.stderr.on('data', (data) => {
      const output = data.toString();

      // Look for the tunnel URL
      const urlMatch = output.match(/https:\/\/[^\s]+\.trycloudflare\.com/);
      if (urlMatch && !resolved) {
        resolved = true;
        resolve(urlMatch[0]);
      }
    });

    cloudflared.on('error', (error) => {
      if (!resolved) {
        resolved = true;
        reject(error);
      }
    });

    // Timeout after 30 seconds
    setTimeout(() => {
      if (!resolved) {
        resolved = true;
        cloudflared.kill();
        reject(new Error('Timeout waiting for cloudflared tunnel'));
      }
    }, 30000);
  });

  logger.success(`Cloudflared tunnel started: ${url}`);

  return {
    url,
    cleanup: async () => {
      logger.info('Stopping cloudflared tunnel...');
      cloudflared.kill();
    }
  };
}

/**
 * Start Tailscale funnel
 */
async function startTailscaleFunnel(
  port: number,
  path: string
): Promise<TunnelResult> {
  const hasTailscale = await checkCommand('tailscale');

  if (!hasTailscale) {
    throw new Error('tailscale not found');
  }

  // Start funnel: tailscale funnel --bg --set-path /webhook 6555
  const startArgs = ['funnel', '--bg'];
  if (path && path !== '/') {
    startArgs.push('--set-path', path);
  }
  startArgs.push(String(port));

  await execCommand('tailscale', startArgs);

  // Get URL from status: tailscale funnel status --json
  const url = await getTailscaleURL();

  logger.success(`Tailscale funnel started: ${url}${path}`);

  return {
    url: `${url}${path}`,
    cleanup: async () => {
      logger.info('Stopping tailscale funnel...');

      // Stop funnel: tailscale funnel --bg --set-path /webhook off
      const stopArgs = ['funnel', '--bg'];
      if (path && path !== '/') {
        stopArgs.push('--set-path', path);
      }
      stopArgs.push('off');

      await execCommand('tailscale', stopArgs);
    }
  };
}

/**
 * Execute command and return stdout
 */
async function execCommand(cmd: string, args: string[]): Promise<string> {
  return new Promise((resolve, reject) => {
    const proc = spawn(cmd, args);
    let stdout = '';
    let stderr = '';

    proc.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    proc.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    proc.on('close', (code) => {
      if (code === 0) {
        resolve(stdout);
      } else {
        reject(new Error(`Command failed (exit ${code}): ${stderr || stdout}`));
      }
    });

    proc.on('error', (error) => {
      reject(error);
    });
  });
}

/**
 * Get Tailscale funnel URL from status
 */
async function getTailscaleURL(): Promise<string> {
  try {
    // Try JSON format first
    const output = await execCommand('tailscale', ['funnel', 'status', '--json']);
    const status = JSON.parse(output);

    // Parse JSON structure
    // Example: { "BackendState": {...}, "Services": { "https://...": {...} } }
    if (status.Services) {
      const urls = Object.keys(status.Services);
      if (urls.length > 0) {
        return urls[0]; // First service URL
      }
    }

    throw new Error('No funnel URL found in status');
  } catch (jsonError) {
    // Fallback: parse plain text output
    const output = await execCommand('tailscale', ['funnel', 'status']);

    // Parse text output for URL (https://...)
    const match = output.match(/https:\/\/[^\s]+/);
    if (match) {
      return match[0];
    }

    throw new Error('Could not determine Tailscale funnel URL');
  }
}
