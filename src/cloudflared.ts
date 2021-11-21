import * as vscode from 'vscode';
import { getApi, FileDownloader } from "@microsoft/vscode-file-downloader-api";
import { ChildProcess, execFileSync, spawn } from 'child_process';

const os = require('os');
const fs = require('fs');


export class CloudflaredClient {
    context: vscode.ExtensionContext;
    cloudflaredUri!: vscode.Uri;
    runProcess!: ChildProcess;

    constructor(context: vscode.ExtensionContext) {
        this.context = context;
    }

    async setUp() {
        this.cloudflaredUri = await this.getExecutable();
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

    async exec(args: string[]): Promise<string> {
        const path = this.cloudflaredUri.fsPath;
        try {
            const stdout = execFileSync(path, args);
            return stdout.toString();
        } catch (ex) {
            console.error(ex);
            return "";
        }
    }

    async spawn(args: string[]): Promise<ChildProcess> {
        const path = this.cloudflaredUri.fsPath;
        return spawn(path, args);
    }

    async version(): Promise<string> {
        return await this.exec(["--version"]);
    }

    async start(port: number): Promise<string> {
        this.runProcess = await this.spawn(["tunnel", "--url", `localhost:${port}`]);
        return new Promise((resolve) => {
            if (this.runProcess.stdout && this.runProcess.stderr) {
                this.runProcess.stderr.on('data', (data) => {
                    const lines = data.toString().split('\n');
                    const linkColumn = lines.map((line: string) => line.split(' ')[4]);
                    const link = linkColumn.find((line: string) => line?.startsWith('https://'));
                    if (link) {
                        resolve(link);
                    }
                });
            }
        });
    }

    async isRunning(): Promise<boolean> {
        return this.runProcess && !this.runProcess.killed;
    }

}
