/* tslint:disable:no-duplicate-imports */

import * as vscode from 'vscode';
import { TreeDataProvider, TreeItem } from 'vscode';
import expandTilde = require('expand-tilde');
import { LaunchCtl } from './helpers/LaunchCtl';
import { list as listServices } from './launchServices';

export default class BrewExplorer implements TreeDataProvider<any> {

  private onDidChange: vscode.EventEmitter<any> = new vscode.EventEmitter<any>();
  readonly onDidChangeTreeData = this.onDidChange.event;
  private agentsFolder = expandTilde('~/Library/LaunchAgents/');
  // private items: string[];

  constructor(items?: string[]) {
    // if (items) {
    //   this.items = items;
    // } else {
    //   this.items = readAllUserAgents();
    // }
  }

  refresh() {
    this.onDidChange.fire();
  }

  public async getChildren() {
    const services = await listServices(this.agentsFolder)
      .catch(() => ([]));
    return services;
  }

  public async getTreeItem(service: LaunchCtl): Promise<TreeItem> {
    const status = await service.update();
    const generatePath = 
    (style: string) => `${__dirname}/../resources/${status.toLowerCase()}${style}.svg`;

    const iconPath = {
      light: generatePath('Light'),
      dark: generatePath('Dark'),
    };

    return {
      iconPath,
      label: `${status} :: ${service.name}`,
      contextValue: `serviceItem${status}`,
    };
  }

  public async load(target: LaunchCtl) {
    const message = `LaunchCtl: Loading ${target.name}`;
    return vscode.window.setStatusBarMessage(message, target.load()
      .catch(() => ({ stderr: 'error', stdout: '' }))
      .then(() => this.refresh()));
  }

  public async unload(target: LaunchCtl) {
    const message = `LaunchCtl: Unloading ${target.name}`;
    return vscode.window.setStatusBarMessage(message, target.unload()
    .catch(() => ({ stderr: 'error', stdout: '' }))
    .then(() => this.refresh()));
  }

  public async restart(target: LaunchCtl) {
    const message = `LaunchCtl: Restarting ${target.name}`;
    return vscode.window.setStatusBarMessage(message, target.restart()
      .catch(() => ({ stderr: 'error', stdout: '' }))
      .then(() => this.refresh()));
  }

  public async start(target: LaunchCtl) {
    const message = `LaunchCtl: Restarting ${target.name}`;
    return vscode.window.setStatusBarMessage(message, target.start()
      .catch(() => ({ stderr: 'error', stdout: '' }))
      .then(() => this.refresh()));
  }

  public async stop(target: LaunchCtl) {
    const message = `LaunchCtl: Restarting ${target.name}`;
    return vscode.window.setStatusBarMessage(message, target.stop()
      .catch(() => ({ stderr: 'error', stdout: '' }))
      .then(() => this.refresh()));
  }

  public async openLog(stderr: boolean, target: LaunchCtl) {
    const message = `LaunchCtl: view ${stderr ? 'error ' : ' '}log for ${target.name}`;
    return vscode.window.setStatusBarMessage(message, target.viewLog(stderr)
      .catch(() => ({ status: 'error' }))
      .then(() => this.refresh()));
  }
}
