import * as vscode from 'vscode';
import { CloudflaredClient } from './cloudflared';
import { CloudflaredDownloader } from './downloader';

let cloudflared: CloudflaredClient;

export async function activate(context: vscode.ExtensionContext) {

	// Download cloudflared
	const cloudflaredDownloader = new CloudflaredDownloader(context);
	const cloudflaredUri = await cloudflaredDownloader.get();
	// Setup Cloudflared client
	cloudflared = new CloudflaredClient(cloudflaredUri, context);

	const version = vscode.commands.registerCommand('cloudflaretunnel.version', async () => {
		const message = await cloudflared.version();
		vscode.window.showInformationMessage(message);
	});

	const start = vscode.commands.registerCommand('cloudflaretunnel.start', async () => {
		const inputResponse = await vscode.window.showInputBox({
			title: "Port",
			placeHolder: "Select a port. Default: 80",
			ignoreFocusOut: true
		});
		const port = inputResponse ? parseInt(inputResponse) : 80;

		const tunnelUri = await cloudflared.start(port);
		const action = await vscode.window.showInformationMessage(
			`Your quick Tunnel has been created!\n${tunnelUri}`,
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

	const stop = vscode.commands.registerCommand('cloudflaretunnel.stop', async () => {
		await cloudflared.stop();
		const message = 'Cloudflare tunnel stopped';
		vscode.window.showInformationMessage(message);
	});

	const isRunning = vscode.commands.registerCommand('cloudflaretunnel.isRunning', async () => {
		const isRunningResponse = await cloudflared.isRunning();
		const message = `Cloudflare tunnel is${isRunningResponse ? '' : ' not'} running`;
		vscode.window.showInformationMessage(message);
	});

	context.subscriptions.push(version);
	context.subscriptions.push(start);
	context.subscriptions.push(isRunning);
	context.subscriptions.push(stop);
}

// this method is called when your extension is deactivated
export async function deactivate() {
	await cloudflared.stop();
}
