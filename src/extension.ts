'use strict';
import * as vscode from 'vscode';
import * as copyPaste from 'copy-paste';
import * as css2rn from 'css-to-react-native';

export function activate(context: vscode.ExtensionContext) {
  let pasteCommand = new PasteCommand();
  let disposable = vscode.commands.registerCommand('extension.ueno.pasteReactNativeStyles', () => {
    pasteCommand.paste()
  });
  context.subscriptions.push(disposable);
}

export class PasteCommand {
  
  paste() {
    copyPaste.paste((error, content) => {
      if (content) {
        this.process(content)
      }
    })
  }

  format(input): String {
    try {
      const strrf = str => str.trim().replace(/^"/, "'").replace(/",?$/, "'");
      const rules = input.replace(/\/\*(.|\n)*?\*\//, '').split(';')
        .map(item => item.split(':').map(x => String(x).trim())).filter(x => x && x[0] !== '');
      const output = JSON.stringify(css2rn.default(rules), null, 2);
      const ok = output.replace(/  \"(.*)\":(.*)\n/g, (n, a, b) => { return `  ${a}: ${strrf(b)},\n`; }).replace(/,,/g, ',');
      return ok.substr(1, ok.length - 2).trim().replace(/\n\s+/g, '\n');
    } catch (err) {
      console.log('Error', err);
      return input;
    }
  }

  process(text) {
    const config = vscode.workspace.getConfiguration('pasteAndIndent');
    const editor = vscode.window.activeTextEditor;
    const document = editor.document;
    const selection = editor.selection;
    const start = selection.start;
    let offset = start.character;
    const indentChar = editor.options.insertSpaces ? ' ' : '\t';
    const selectedText = document.getText(selection);
    const isSelectionEmpty = selectedText.length == 0;
    const data = this.format(text).replace(/\n/g, `\n${indentChar.repeat(offset)}`);
    if (isSelectionEmpty) {
        this.insert(data)
    } else {
        this.replaceSelection(selection, data)
    }
  }

  insert(content): Thenable<boolean> {
    const startLine = vscode.window.activeTextEditor.selection.start.line;
    const selection = vscode.window.activeTextEditor.selection;
    const position = new vscode.Position(startLine, selection.start.character);
    return vscode.window.activeTextEditor.edit((editBuilder) => {
      editBuilder.insert(position, content);
    });
  }

  replaceSelection(selection, content) {
    const source = vscode.window.activeTextEditor.document.getText(selection);
    vscode.window.activeTextEditor.edit((editBuilder) => {
      editBuilder.replace(selection, content);
    });
  }
}