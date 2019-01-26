import * as fs from 'fs';
import expandTilde = require('expand-tilde');
import { parse } from 'fast-plist';
import { exec, execSync } from 'child_process';
import { promisify } from 'util';

const readFile = promisify(fs.readFile);
const execp = promisify(exec);

export enum LaunchCtlStatus {
  UNLOADED = 'UNLOADED',
  // loaded
  IDLE = 'IDLE',
  RUNNING = 'RUNNING', 
  ERROR = 'ERROR',
}

export class LaunchCtl {
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
   * Checks if service currently running (asynchronous).
   * @return {Promise}
   */
  public async isRunning(): Promise<boolean> {
    const result = await execp('launchctl list');
    return result.stdout.includes(this.name);
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

  public async update(): Promise<LaunchCtlStatus> {
    const output = await execp(`launchctl list`);
    const lines = output.stdout ? output.stdout.split('\n').slice(1) : [];
    const line = lines.filter(line => line.includes(this.name));
    if (!line.length) {
      // --load
      // "--Unloaded"
      return LaunchCtlStatus.UNLOADED;
    }
    const data = line[0].split(/\s+/);
    const pid = (data[0] === '-') ? -1 : data[0];
    const status = +data[1];
    if (pid === -1 && status === 0) {
      return LaunchCtlStatus.IDLE;
      // echo --Unload
      // echo --Reload
      // echo --Start
      // echo "--Idle"
      // echo "--No Errors"
    }
    if (pid > 0 && status === 0) {
      return LaunchCtlStatus.RUNNING;
      // echo --Unload
      // echo --Reload
      // echo --Stop
      // echo "--Running ($pid)"
      // echo "--No Errors"
    }
    if (status > 0) {
      return LaunchCtlStatus.ERROR;
      // echo --Unload
      // echo --Reload
      // echo --Start
      // echo "--Stopped"
      // echo "--Errors"
    }
  }

  public async start() {
    return await execp(`launchctl start ${this.name}`);
  }

  public async stop() {
    return await execp(`launchctl stop ${this.name}`);
  }

  public async restart() {
    const ag = await this.update();
    
  }

  public async viewLog(stderr: boolean) {
    return await execp(`open -a Console ${stderr ? this.errorlog : this.log}`);
  }
}
