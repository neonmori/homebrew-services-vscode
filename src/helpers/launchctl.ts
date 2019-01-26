import * as fs from 'fs';
import expandTilde = require('expand-tilde');
import { parse } from 'fast-plist';
import { exec, execSync } from 'child_process';
import { promisify } from 'util';

const readFile = promisify(fs.readFile);
const execp = promisify(exec);

export default class LaunchCtl {
  path: string;
  name: string;
  log: string = '';
  errorlog: string = '';

  constructor(path: string) {
    this.path = expandTilde(path);
    this.name = 'Unknown';
  }

  public async init() {
    const plist = await readFile(this.path, 'utf8');
    const parsedPlist = parse(plist);
    if (!parsedPlist) {
      throw new Error('Cannot parse plist!');
    }
    if (!parsedPlist.hasOwnProperty('Label')) {
      throw new Error('Property list has no field "label"');
    }
    this.name = parsedPlist.Label;
    this.log = parsedPlist.StandardOutPath;
    this.errorlog = parsedPlist.StandardErrorPath;

  }

  /**
   * Initiates class object to use with specified agent (synchronous).
   */
  initSync() {
    if (!fs.existsSync(this.path)) {
      throw new Error(`${this.path} does not exists`);
    }
    const plist: string = fs.readFileSync(this.path, 'utf8');
    const parsedPlist: any = parse(plist);
    if (!parsedPlist) {
      throw new Error('Can not parse property list');
    }
    if (!parsedPlist.hasOwnProperty('Label')) {
      throw new Error('Property list has no label');
    }
    this.name = parsedPlist.Label;
  }

  /**
   * Checks if service currently running (asynchronous).
   * @return {Promise}
   */
  public async isRunning(): Promise<boolean> {
    const result = await execp('launchctl list');
    return result.stdout.includes(this.name);
  }

  /**
   * Checks if service currently running (synchronous).
   */
  runningSync(): boolean {
    const result: Buffer = execSync('launchctl list');
    return result.includes(this.name);
  }

  /**
   * Unloads service (asynchronous).
   */
  public async unload() {
    return await execp(`launchctl unload ${this.path}`);
  }

  /**
   * Loads service (asynchronous).
   */
  public async load() {
    return await execp(`launchctl load ${this.path}`);
  }


  public async reload() {
    await this.unload();
    return await this.load();
  }

  public async update() {
    const output = await execp(`launchctl list`);
    const lines = output.stdout ? output.stdout.split('\n').slice(1) : [];
    const line = lines.filter(line => line.includes(this.name));
    if (!line.length) {
      return { pid: -1, status: -1, loaded: false };
    }
    const data = line[0].split(/\s+/);
    const pid = (data[0] === '-') ? -1 : data[0];
    return { pid, status: +data[1], loaded: true };
  }

  public async start() {
    return await execp(`launchctl start ${this.name}`);
  }

  public async stop() {
    return await execp(`launchctl stop ${this.name}`);
  }

  public async restart() {
    const ag = await this.update();
    if (ag.loaded) {
      if (ag.pid === -1 && ag.status === 0) {
        // echo --Unload
        // echo --Reload
        // echo --Start
        // echo "--Idle"
        // echo "--No Errors"
      } else if (ag.pid > 0 && ag.status === 0) {
        // echo --Unload
        // echo --Reload
        // echo --Stop
        // echo "--Running ($pid)"
        // echo "--No Errors"
      } else if (ag.status > 0) {
        // echo --Unload
        // echo --Reload
        // echo --Start
        // echo "--Stopped"
        // echo "--Errors"
      }
    } else {
      // --load
      // "--Unloaded"
    }
  }

  public async viewLog() {
    return await execp(`open -a Console ${this.log}`);
  }

  public async viewErrorLog() {
    return await execp(`open -a Console ${this.errorlog}`);
  }
}
