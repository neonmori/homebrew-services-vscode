import * as fs from 'fs';
import expandTilde = require('expand-tilde');
import { parse } from 'fast-plist';
import { exec, execSync } from 'child_process';

export class LaunchCtl {
  path: string;
  name: string;
  constructor(path: string) {
    this.path = expandTilde(path);
    this.name = 'Unknown';
  }

  init(): Promise<any> {
    return new Promise((resolve, reject) => {
      fs.readFile(this.path, 'utf8', (err, plist) => {
        if (err) {
          return reject(err);
        }
        const parsedPlist = parse(plist);
        if (!parsedPlist) {
          reject(new Error('Cannot parse plist!'));
        }
        if (!parsedPlist.hasOwnProperty('Label')) {
          reject(Error('Property list has no label'));
        }
        this.name = parsedPlist.Label;
        resolve();
      });
    });
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
  running(): Promise<any> {
    return new Promise((resolve, reject) => {
      exec('launchctl list', (err, result) => {
        if (err) {
          return reject(err);
        }
        resolve(result.includes(this.name));
      });
    });
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
  unload(): Promise<any> {
    return new Promise((resolve, reject) => {
      exec(`launchctl unload ${this.path}`, (err, data) => {
        if (err) {
          return reject(err);
        }
        resolve();
      });
    });
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
  load(): Promise<any> {
    return new Promise((resolve, reject) => {
      exec(`launchctl load ${this.path}`, (err, data) => {
        if (err) {
          return reject(err);
        }
        resolve();
      });
    });
  }

  /**
   * Loads service (synchronous).
   */
  loadSync() {
    execSync(`launchctl load ${this.path}`);
  }
}
