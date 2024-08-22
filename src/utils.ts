import * as vscode from "vscode";

export function showErrorMessage(error: unknown) {
  let message = "";

  if (error instanceof Error) {
    message = error.message;
  }

  if (typeof error === "string") {
    message = error.toString();
  }

  vscode.window.showErrorMessage(message);
}

export async function showInformationMessage(
  message: string,
  url: string | null = null
) {
  if (url) {
    const action = await vscode.window.showInformationMessage(
      `${message}\n[${url}](${url})`,
      "Copy to clipboard",
      "Open in browser"
    );

    switch (action) {
      case "Copy to clipboard":
        vscode.env.clipboard.writeText(url);
        break;
      case "Open in browser":
        vscode.env.openExternal(vscode.Uri.parse(url));
        break;
    }
  } else {
    await vscode.window.showInformationMessage(message);
  }
}
