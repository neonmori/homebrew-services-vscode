import * as vscode from 'vscode';
import brewExplorer from './brewExplorer';

export function activate(context: vscode.ExtensionContext) {
  const explorer = new brewExplorer(vscode.workspace.getConfiguration().get('brewer.labels'));

  vscode.window.registerTreeDataProvider('brewExplorer', explorer);

  vscode.commands.registerCommand('viewLog', explorer.openLog.bind(explorer, false));
  vscode.commands.registerCommand('viewErrorLog', explorer.openLog.bind(explorer, true));

  vscode.commands.registerCommand('loadService', explorer.load.bind(explorer));
  vscode.commands.registerCommand('unloadService', explorer.unload.bind(explorer));
  vscode.commands.registerCommand('reloadService', explorer.reload.bind(explorer));

  vscode.commands.registerCommand('startService', explorer.start.bind(explorer));
  vscode.commands.registerCommand('stopService', explorer.stop.bind(explorer));
  // vscode.commands.registerCommand('restartService', explorer.restart.bind(explorer));

  vscode.commands.registerCommand('refreshButton', explorer.refresh.bind(explorer));
}
