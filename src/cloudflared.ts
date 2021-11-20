import * as vscode from 'vscode';
import { getApi, FileDownloader } from "@microsoft/vscode-file-downloader-api";

const util = require("util");
const { exec } = require("child_process");
const execProm = util.promisify(exec);
const os = require('os');
const fs = require('fs');


export class CloudflaredClient {
    context: vscode.ExtensionContext;
    cloudflaredUri!: vscode.Uri;
    terminal: vscode.Terminal;

    constructor(context: vscode.ExtensionContext) {
        this.context = context;
        this.terminal = this.createTerminal();
    }

    async setUp() {
        this.cloudflaredUri = await this.getExecutable();
    }

    private createTerminal(): vscode.Terminal {
        const terminal = vscode.window.createTerminal({
            name: "cloudflared",
            hideFromUser: false,
        });
        terminal.show();
        return terminal;
    }

    async download(): Promise<vscode.Uri> {
        const arch = os.arch().replace('x', 'amd');
        const fileName = os.type() === 'Windows_NT' ? `cloudflared-windows-${arch}.exe` : `cloudflared-linux-${arch}`;
        const remotePath = vscode.Uri.parse(`https://github.com/cloudflare/cloudflared/releases/latest/download/${fileName}`);

        const fileDownloader: FileDownloader = await getApi();
        return await fileDownloader.downloadFile(remotePath, fileName, this.context);
    }

    private async getExecutable(): Promise<vscode.Uri> {
        let uri = this.context.globalState.get<vscode.Uri>('cloudflaredUri');
        if (uri && fs.existsSync(uri)) {
            return uri;
        }

        uri = await this.download();
        this.context.globalState.update('cloudflaredUri', uri);
        return uri;
    }

    async cmd(args: string[]): Promise<string> {
        const path = this.cloudflaredUri.fsPath;
        const command = [path].concat(args).join(" ");
        // this.terminal.sendText(command);
        try {
            const { stdout } = await execProm(command);
            return stdout;
        } catch (ex) {
            console.error(ex);
            return "";
        }
    }

    async version(): Promise<string> {
        return await this.cmd(["--version"]);
    }

    start(port: number) {
        this.cmd(["start"]);
    }

}
