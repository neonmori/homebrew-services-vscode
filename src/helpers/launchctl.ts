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
   * Unloads service (synchronous).
   */
  unloadSync() {
    execSync(`launchctl unload ${this.path}`);
  }

  /**
   * Loads service (asynchronous).
   */
  public async load() {
    return await execp(`launchctl load ${this.path}`);
  }

  /**
   * Loads service (synchronous).
   */
  loadSync() {
    execSync(`launchctl load ${this.path}`);
  }
}
