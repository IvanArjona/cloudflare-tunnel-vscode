import * as vscode from 'vscode';
import { getApi, FileDownloader } from "@microsoft/vscode-file-downloader-api";

const util = require("util");
const { exec } = require("child_process");
const execProm = util.promisify(exec);
const os = require('os');
const fs = require('fs');


export class CloudflaredClient {
    context: vscode.ExtensionContext;
    executable: string = "";
    terminal: vscode.Terminal;

    constructor(context: vscode.ExtensionContext) {
        this.context = context;
        this.terminal = this.createTerminal();
    }

    async setUp() {
        this.executable = await this.getExecutable();
    }

    private createTerminal(): vscode.Terminal {
        const terminal = vscode.window.createTerminal({
            name: "cloudflared",
            hideFromUser: false,
        });
        terminal.show();
        return terminal;
    }

    async download(fileName: string) {
        const remotePath = vscode.Uri.parse(`https://github.com/cloudflare/cloudflared/releases/latest/download/${fileName}`);
        const fileDownloader: FileDownloader = await getApi();
        const downloadedFile: vscode.Uri = await fileDownloader.downloadFile(remotePath, 'cloudflared', this.context);
        return downloadedFile;
    }

    private async getExecutable(): Promise<string> {
        const localPath = "C:\\Users\\ivany\\Downloads";
        const arch = os.arch().replace('x', 'amd');
        const fileName = os.type() === 'Windows_NT' ? `cloudflared-windows-${arch}.exe` : `cloudflared-linux-${arch}`;
        const executable = `${localPath}\\${fileName}`;
        if (fs.existsSync(executable)) {
            await this.download(fileName);
        }
      return executable;
    }

    async cmd(args: string[]) {
        const command = [this.executable].concat(args).join(" ");
        // this.terminal.sendText(command);
        try {
            const { stdout } = await execProm(command);
            return stdout;
        } catch (ex) {
            console.error(ex);
            return "";
        }
    }

    version() {
        const response = this.cmd(["--version"]);
        console.log(response);
    }

    start(port: number) {
        this.cmd(["start"]);
    }

}
