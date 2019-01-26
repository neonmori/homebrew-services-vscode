/* tslint:disable:no-duplicate-imports */

import * as vscode from 'vscode';
import { TreeDataProvider, TreeItem } from 'vscode';
import { upperFirst, toStatus } from './helpers';
import expandTilde = require('expand-tilde');
import LaunchCtl from './helpers/LaunchCtl';
import { list as listServices } from './launchServices';

const brew = require('homebrew-services');

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
    const status: string = (await service.isRunning()) ? 'started' : 'stopped';
    const generatePath = (style: string) => `${__dirname}/../resources/${status}${style}.svg`;

    const iconPath = {
      light: generatePath('Light'),
      dark: generatePath('Dark'),
    };

    return {
      iconPath,
      label: service.name,
      contextValue: 'serviceItem',
    };
  }

  public async execute(command: string, args: string[]) {
    const message = `Brew: ${toStatus[command]} ${upperFirst(args[0])}`;
    return vscode.window.setStatusBarMessage(message, brew[command]({ service: args[0] })
      .catch(() => ({ status: 'error' }))
      .then(() => this.refresh()));
  }
}
