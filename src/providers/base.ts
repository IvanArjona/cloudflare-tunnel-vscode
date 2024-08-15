import * as vscode from "vscode";

export abstract class BaseProvider<T> implements vscode.TreeDataProvider<T> {
  private changeEvent = new vscode.EventEmitter<void>();

  public get onDidChangeTreeData(): vscode.Event<void> {
    return this.changeEvent.event;
  }

  abstract getTreeItem(element: T): vscode.TreeItem | Thenable<vscode.TreeItem>;

  abstract getChildren(element?: T): vscode.ProviderResult<T[]>;

  refresh(): void {
    this.changeEvent.fire();
  }
}
