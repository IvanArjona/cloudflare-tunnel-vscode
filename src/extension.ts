import * as vscode from 'vscode';
import { CloudflaredClient } from './cloudflared';

export async function activate(context: vscode.ExtensionContext) {

	const cloudflared = new CloudflaredClient(context);
	await cloudflared.setUp();

	const version = vscode.commands.registerCommand('cloudflaretunnel.version', async () => {
		const message = await cloudflared.version();
		vscode.window.showInformationMessage(message);
	});

	const start = vscode.commands.registerCommand('cloudflaretunnel.start', async () => {
		const port = 3000;
		const tunnelUri = await cloudflared.start(port);
		const action = await vscode.window.showInformationMessage(
			`Your quick Tunnel has been created! Visit it at ${tunnelUri}`,
			'Copy to clipboard',
			'Open in browser',
		);

		switch (action) {
			case 'Copy to clipboard':
				vscode.env.clipboard.writeText(tunnelUri);
				break;
			case 'Open in browser':
				vscode.env.openExternal(vscode.Uri.parse(tunnelUri));
				break;
		}
	});

	context.subscriptions.push(version);
	context.subscriptions.push(start);
}

// this method is called when your extension is deactivated
export function deactivate() {}
