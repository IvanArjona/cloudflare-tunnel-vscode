import * as vscode from 'vscode';

export function showErrorMessage(error: unknown) {
    if (error instanceof Error) {
        vscode.window.showErrorMessage(String(error.message));
    }
}
