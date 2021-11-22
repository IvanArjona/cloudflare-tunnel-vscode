import * as vscode from 'vscode';
import { CloudflaredClient } from './cloudflared';
import { CloudflaredDownloader } from './downloader';
import { showErrorMessage } from './utils';

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
		const config = vscode.workspace.getConfiguration('cloudflaretunnel.tunnel');
		const defaultPort = config.get<number>('defaultPort', 8080);
		const askForPort = config.get<boolean>('askForPort', true);
		const hostname = config.get<string>('hostname');
		let port = defaultPort;

		if (askForPort) {
			const inputResponse = await vscode.window.showInputBox({
				title: "Port number",
				placeHolder: `Select a port. Default: ${defaultPort}`,
				ignoreFocusOut: true
			});
			if (!inputResponse) {
				return;
			}
			port = inputResponse ? parseInt(inputResponse) : defaultPort;
		}

		try {
			const tunnelUri = await cloudflared.start(port, hostname);
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
		} catch (ex) {
			showErrorMessage(ex);
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

	const login = vscode.commands.registerCommand('cloudflaretunnel.login', async () => {
		try {
			await cloudflared.login();
			vscode.window.showInformationMessage('Logged in successfully');
		} catch (ex) {
			showErrorMessage(ex);
		}
		await cloudflared.createTunnel();
	});

	context.subscriptions.push(version);
	context.subscriptions.push(start);
	context.subscriptions.push(isRunning);
	context.subscriptions.push(stop);
	context.subscriptions.push(login);
}

// this method is called when your extension is deactivated
export async function deactivate() {
	await cloudflared.stop();
}
