import * as vscode from "vscode";

export abstract class BaseProvider<T> implements vscode.TreeDataProvider<T> {
  private changeEvent = new vscode.EventEmitter<void>();

  public get onDidChangeTreeData(): vscode.Event<void> {
    return this.changeEvent.event;
  }

  abstract getTreeItem(
    element: T | vscode.TreeItem
  ): vscode.TreeItem | Thenable<vscode.TreeItem>;

  // @ts-expect-error: Returns a vscode.TreeItem[] instead of a T[]
  abstract getChildren(
    element?: T | vscode.TreeItem
  ): vscode.ProviderResult<T[] | vscode.TreeItem[]>;

  refresh(): void {
    this.changeEvent.fire();
  }
}
