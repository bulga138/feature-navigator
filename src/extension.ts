import * as vscode from "vscode";
import { FeatureDefinitionProvider } from "./FeatureDefinitionProvider";

export function activate(context: vscode.ExtensionContext) {
  console.log('FeatureNavigator: "activate" function started.');
  const provider = new FeatureDefinitionProvider();    
  const disposable = vscode.languages.registerDefinitionProvider(
      [
          { scheme: 'file', language: 'plaintext' },
          { scheme: 'file', language: 'javascript' },
          { scheme: 'file', language: 'typescript' },
          { scheme: 'file', language: 'gherkin' },
          { scheme: 'file', pattern: '**/*.feature' }
      ],
      provider
  );
  context.subscriptions.push(disposable);
  console.log("FeatureNavigator: DefinitionProvider registered successfully.");
}

export function deactivate() {}
