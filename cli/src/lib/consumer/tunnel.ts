import { spawn, type ChildProcess } from 'child_process';
import { checkCommand } from '../../utils/process.js';
import { logger } from '../../utils/logger.js';

export async function startCloudflaredTunnel(
  port: number
): Promise<{ url: string; process: ChildProcess } | null> {
  const hasCloudflared = await checkCommand('cloudflared');

  if (!hasCloudflared) {
    logger.warn('cloudflared not found. Install it to get public webhook URL:');
    logger.info('  macOS: brew install cloudflare/cloudflare/cloudflared');
    logger.info('  Linux: https://pkg.cloudflare.com/');
    logger.info('Or use --no-tunnel to skip this step\n');
    return null;
  }

  const cloudflared = spawn('cloudflared', ['tunnel', '--url', `http://localhost:${port}`]);

  return new Promise((resolve, reject) => {
    let resolved = false;

    cloudflared.stderr.on('data', (data) => {
      const output = data.toString();
      
      // Look for the tunnel URL
      const urlMatch = output.match(/https:\/\/[^\s]+\.trycloudflare\.com/);
      if (urlMatch && !resolved) {
        resolved = true;
        resolve({ url: urlMatch[0], process: cloudflared });
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
}
