/**
 * @file Extension entry point
 */

import * as vscode from 'vscode';
import { TestHub, testExplorerExtensionId } from 'vscode-test-adapter-api';
import { Log, TestAdapterRegistrar } from 'vscode-test-adapter-util';
import { CmakeAdapter } from './cmake-adapter';

/**
 * Main extension entry point
 *
 * Code is from the vscode-example-test-adapter extension template
 */
export async function activate(context: vscode.ExtensionContext) {
  const workspaceFolder = (vscode.workspace.workspaceFolders || [])[0];

  // create a simple logger that can be configured with the configuration variables
  // `cmakeExplorer.logpanel` and `cmakeExplorer.logfile`
  const log = new Log('cmakeExplorer', workspaceFolder, 'CMake Explorer Log');
  context.subscriptions.push(log);

  const config = vscode.workspace.getConfiguration(
    'cmakeExplorer',
    workspaceFolder.uri
  );

  const cmakeIntegration = config.get<boolean>('cmakeIntegration') || false;

  if (cmakeIntegration) {
    // Check for CMake Tools extension
    let cmakeExtension = vscode.extensions.getExtension(
      'ms-vscode.cmake-tools'
    );
    if (!cmakeExtension) {
      const message = `CMake integration is enabled but the CMake Tools extension is not installed`;
      log.warn(message);
      vscode.window.showErrorMessage(message);
    } else if (!cmakeExtension.isActive) {
      log.warn(
        `CMake integration is enabled but the CMake Tools extension is not active`
      );
      await cmakeExtension.activate();
    }
  }

  // get the Test Explorer extension
  const testExplorerExtension = vscode.extensions.getExtension<TestHub>(
    testExplorerExtensionId
  );
  if (log.enabled)
    log.info(`Test Explorer ${testExplorerExtension ? '' : 'not '}found`);

  if (testExplorerExtension) {
    const testHub = testExplorerExtension.exports;

    // this will register a CmakeAdapter for each WorkspaceFolder
    context.subscriptions.push(
      new TestAdapterRegistrar(
        testHub,
        (workspaceFolder) => new CmakeAdapter(workspaceFolder, log),
        log
      )
    );
  }
}

export function deactivate() {}
