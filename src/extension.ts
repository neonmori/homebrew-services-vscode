import * as vscode from 'vscode';
import brewExplorer from './brewExplorer';

export function activate(context: vscode.ExtensionContext) {
  const explorer = new brewExplorer(vscode.workspace.getConfiguration().get('brewer.labels'));

  vscode.window.registerTreeDataProvider('brewExplorer', explorer);

  vscode.commands.registerCommand('viewLog', explorer.openLog.bind(explorer, false));
  vscode.commands.registerCommand('viewErrorLog', explorer.openLog.bind(explorer, true));

  vscode.commands.registerCommand('loadService', explorer.load.bind(explorer));
  
  vscode.commands.registerCommand('startService', explorer.execute.bind(explorer, 'start'));
  vscode.commands.registerCommand('stopService', explorer.execute.bind(explorer, 'stop'));
  vscode.commands.registerCommand('restartService', explorer.execute.bind(explorer, 'restart'));

  vscode.commands.registerCommand('refreshButton', explorer.refresh.bind(explorer));
}
