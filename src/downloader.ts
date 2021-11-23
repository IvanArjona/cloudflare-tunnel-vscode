import * as vscode from 'vscode';
import { getApi, FileDownloader } from "@microsoft/vscode-file-downloader-api";

const os = require('os');
const fs = require('fs');


export class CloudflaredDownloader {
    context: vscode.ExtensionContext;

    constructor(context: vscode.ExtensionContext) {
        this.context = context;
    }

    private async setPermissions(uri: vscode.Uri) {
        fs.chmodSync(uri.fsPath, 0o750);
    }

    private async download(): Promise<vscode.Uri> {
        const arch = os.arch().replace('x', 'amd');
        const fileName = os.type() === 'Windows_NT' ? `cloudflared-windows-${arch}.exe` : `cloudflared-linux-${arch}`;
        const remotePath = vscode.Uri.parse(`https://github.com/cloudflare/cloudflared/releases/latest/download/${fileName}`);

        const fileDownloader: FileDownloader = await getApi();
        return await fileDownloader.downloadFile(remotePath, fileName, this.context);
    }

    async get(): Promise<vscode.Uri> {
        let uri = this.context.globalState.get<vscode.Uri>('cloudflaredUri');
        if (uri && fs.existsSync(uri)) {
            return uri;
        }

        uri = await this.download();
        await this.setPermissions(uri);
        this.context.globalState.update('cloudflaredUri', uri);
        return uri;
    }
}
