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
  link: string | null = null
) {
  if (link) {
    const action = await vscode.window.showInformationMessage(
      `${message}\n${link}`,
      "Copy to clipboard",
      "Open in browser"
    );

    switch (action) {
      case "Copy to clipboard":
        vscode.env.clipboard.writeText(link);
        break;
      case "Open in browser":
        vscode.env.openExternal(vscode.Uri.parse(link));
        break;
    }
  } else {
    await vscode.window.showInformationMessage(message);
  }
}
