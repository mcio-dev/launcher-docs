import { buildSite } from './build.mjs';
import { startServer } from './server.mjs';

const [command = 'dev', ...args] = process.argv.slice(2);
const portIndex = args.indexOf('--port');
const defaultPort = command === 'dev' ? 5173 : 4173;
const port = portIndex >= 0 ? Number(args[portIndex + 1]) : defaultPort;

try {
  if (command === 'build') {
    await buildSite();
  } else if (command === 'dev' || command === 'preview') {
    if (!Number.isInteger(port) || port < 1 || port > 65535) {
      throw new Error('--port 必须是 1 到 65535 之间的整数');
    }

    await startServer({ dev: command === 'dev', port });
  } else {
    throw new Error(`未知命令：${command}。可用命令：dev、build、preview。`);
  }
} catch (error) {
  console.error(error.stack || error.message);
  process.exitCode = 1;
}
