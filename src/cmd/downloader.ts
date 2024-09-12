import * as vscode from "vscode";
import * as os from "os";
import * as fs from "fs";
import * as tar from "tar";
import * as path from "path";
import { getApi, FileDownloader } from "@microsoft/vscode-file-downloader-api";
import { globalState } from "../state/global";
import * as constants from "../constants";

export default class CloudflaredDownloader {
  constructor(private context: vscode.ExtensionContext) {
    this.context = context;
  }

  private async setPermissions(uri: vscode.Uri): Promise<void> {
    fs.chmodSync(uri.fsPath, constants.cloudflaredPermissions);
  }

  private async getCloudflaredFileName(): Promise<string> {
    const arch = os.arch().replace("x", "amd").replace("ia32", "386"); // amd64, 386
    const osType = os.type().toLowerCase().replace("_nt", ""); // windows, linux, darwin
    const extension = osType === "windows" ? ".exe" : "";
    return `cloudflared-${osType}-${arch}${extension}`;
  }

  private async getDownloadUri(fileName: string): Promise<vscode.Uri> {
    return vscode.Uri.parse(constants.cloudflaredDownloadUrl + fileName);
  }

  private async unzipDarwin(
    fileName: string,
    uri: vscode.Uri
  ): Promise<vscode.Uri> {
    const cwd = path.dirname(uri.fsPath);
    const extractedFilePath = path.join(cwd, "cloudflared");
    const renamedFilePath = path.join(cwd, fileName);

    await tar.x({
      file: uri.fsPath,
      cwd,
      filter: (path) => path === "cloudflared",
    });

    // Renamed extracted "cloudflared" to fileName
    await fs.promises.rename(extractedFilePath, renamedFilePath);

    return vscode.Uri.file(renamedFilePath);
  }

  async downloadFromUri(
    uri: vscode.Uri,
    fileName: string
  ): Promise<vscode.Uri> {
    const fileDownloader: FileDownloader = await getApi();
    return vscode.window.withProgress<vscode.Uri>(
      {
        location: vscode.ProgressLocation.Window,
        title: "Downloading cloudfared client",
      },
      () => fileDownloader.downloadFile(uri, fileName, this.context)
    );
  }

  async download(fileName: string): Promise<vscode.Uri> {
    const isDarwin = fileName.includes("darwin");
    const downloadFileName = isDarwin ? `${fileName}.tgz` : fileName;
    const downloadUri = await this.getDownloadUri(downloadFileName);

    const uri = await this.downloadFromUri(downloadUri, downloadFileName);

    if (isDarwin) {
      return this.unzipDarwin(fileName, uri);
    }

    return uri;
  }

  async get(): Promise<vscode.Uri> {
    let uri = globalState.cloudflaredUri;
    if (uri && fs.existsSync(uri.fsPath)) {
      return uri;
    }

    const fileName = await this.getCloudflaredFileName();
    uri = await this.download(fileName);
    await this.setPermissions(uri);
    globalState.cloudflaredUri = uri;

    return uri;
  }
}
