import * as fs from 'fs';
import { promisify } from 'util';
import { LaunchCtl } from './launchctl';

const readdirp = promisify(fs.readdir);

export async function getLaunchCtl(path: string, results: string[]) {
  const services = results ? results : [];
  return await Promise.all(services.map(async (v: string): Promise<LaunchCtl> => {
    const launchctl = new LaunchCtl(`${path}${v}`);
    await launchctl.init();
    return launchctl;
  }));
}

/// return a map of services and their launchctl obj
export async function list(agentsFolder: string) {
  const output = await readdirp(agentsFolder);
  return getLaunchCtl(agentsFolder, output);
}
