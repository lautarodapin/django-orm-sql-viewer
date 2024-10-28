// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { spawn } from 'child_process';
import path from 'path';

export function activate(context: vscode.ExtensionContext) {
    const outputChannel = vscode.window.createOutputChannel('Django ORM SQL');

    const viewSQL = vscode.commands.registerCommand('django-orm-sql-viewer.viewSQL', async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            return;
        }

        const document = editor.document;
        const selection = editor.selection;
        const text = document.getText(selection);

        try {
            const sql = await getDjangoORMSQL(text);
            outputChannel.show();
            outputChannel.appendLine(sql);
        } catch (err) {
            vscode.window.showErrorMessage('Error getting SQL: ' + err);
        }
    });

    context.subscriptions.push(viewSQL);
}

export function deactivate() {}

async function getDjangoORMSQL(query: string): Promise<string> {
    const pythonScript = `
  import django
  from django.conf import settings
  settings.configure()
  django.setup()
  
  import sys
  from io import StringIO
  
  original_stdout = sys.stdout
  sys.stdout = buffer = StringIO()
  
  ${query}
  
  sys.stdout = original_stdout
  print(buffer.getvalue())
  `;

    return new Promise((resolve, reject) => {
        const pythonPath = vscode.workspace.getConfiguration('python').get('pythonPath', 'python');
        const scriptPath = path.join(__dirname, 'get_sql.py');

        const child = spawn(pythonPath, [scriptPath], {
            env: {
                PYTHONPATH: vscode.workspace.getConfiguration('python').get('pythonPath', ''),
            },
        });

        let output = '';
        child.stdout.on('data', (data) => {
            output += data.toString();
        });

        child.stderr.on('data', (data) => {
            reject(`Error getting SQL: ${data.toString()}`);
        });

        child.on('close', (code) => {
            if (code === 0) {
                resolve(output.trim());
            } else {
                reject(`Error getting SQL (code ${code})`);
            }
        });

        child.stdin.write(pythonScript);
        child.stdin.end();
    });
}
