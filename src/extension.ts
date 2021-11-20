import * as vscode from 'vscode';
import { CloudflaredClient } from './cloudflared';

export async function activate(context: vscode.ExtensionContext) {

	const cloudflared = new CloudflaredClient(context);
	await cloudflared.setUp();

	const version = vscode.commands.registerCommand('cloudflaretunnel.version', () => {
		const version = cloudflared.version();
		const message = `Cloudflared version: ${version}`;
		vscode.window.showInformationMessage(message);
	});

	const start = vscode.commands.registerCommand('cloudflaretunnel.start', () => {
		vscode.window.showInformationMessage('Start');
		const port = 3000;
		cloudflared.start(port);
	});

	context.subscriptions.push(version);
	context.subscriptions.push(start);
}

// this method is called when your extension is deactivated
export function deactivate() {}
