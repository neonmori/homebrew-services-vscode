/* tslint:disable:no-duplicate-imports */

import * as vscode from 'vscode';
import { TreeDataProvider, TreeItem } from 'vscode';
import { upperFirst, toStatus } from './helpers';
// import { promisify } from 'util';
import * as fs from 'fs';
import expandTilde = require('expand-tilde');
import LaunchCtl from './helpers/LaunchCtl';

const brew = require('homebrew-services');

function readAllUserAgents(): string[] {
  const agentsFolder = expandTilde('~/Library/LaunchAgents/');
  return fs.readdirSync(agentsFolder).map((v: string) => `${agentsFolder}${v}`);
}

export default class BrewExplorer implements TreeDataProvider<any> {

  private onDidChange: vscode.EventEmitter<any> = new vscode.EventEmitter<any>();
  readonly onDidChangeTreeData = this.onDidChange.event;
  private items: string[];

  constructor(items?: string[]) {
    if (items) {
      this.items = items;
    } else {
      this.items = readAllUserAgents();
    }
  }

  refresh() {
    this.onDidChange.fire();
  }

  public async getChildren() {
    const { services } = await brew.list()
      .catch(() => ({ services: new Map() }));
    return [...services.entries()];
  }

  public getTreeItem(service: string[]): TreeItem {
    const status = service[1] === 'started' ? 'started' : 'stopped';
    const generatePath = (style: string) => `${__dirname}/../resources/${status}${style}.svg`;

    const iconPath = {
      light: generatePath('Light'),
      dark: generatePath('Dark'),
    };

    return {
      iconPath,
      label: `${upperFirst(service[0])}: ${upperFirst(service[1])}`,
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
