import * as vscode from 'vscode';

export function showErrorMessage(error: unknown) {
    let message = '';

    if (error instanceof Error) {
        message = error.message;
    }

    if (typeof error === 'string') {
        message = error.toString();
    }

    vscode.window.showErrorMessage(message);
}
