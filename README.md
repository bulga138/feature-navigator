# 🧭 Feature Navigator

Jump to related files in your project by clicking on feature tags like `#123456`, `case-123456`, or custom patterns — right from your editor!

This extension enhances navigation for developers working with issue-trackers, test cases, or feature tracking systems. It supports navigating both by filename pattern or file content matching.
## ✅ Features

- ⚡**Go to Definition**: Ctrl+click (Cmd+click on macOS) on any tag (like `#123456`) to jump to associated `.feature` or other relevant files.
- 🔧**Configurable Tag Pattern**: Define what constitutes a valid tag.
- 🗂️**Filename-based Lookup**: Specify glob patterns that use the case number to find related files.
- 📄**Content-based Fallback** (Optional): Optionally scan file contents for matches when no filename match is found.
- 🌐**Workspace-aware Search Roots**: Search can be limited relative to workspace folders.

## 🛠️ Installation

Search for **"Feature Navigator"** in the VS Code Marketplace or install it directly from within Visual Studio Code:

- Press `Ctrl+Shift+X` to open Extensions.
- Search for `"Feature Navigator"`.
- Click **Install**.

Alternatively, via CLI:

```bash
code --install-extension your-publisher.feature-navigator
```

## ⚙️ Configuration

Open your settings with `Ctrl+,` and search for "Feature Navigator" to configure the following options:
|Setting Key|Description|
|---|---|
|`featureNavigator.tagPattern`|A regex pattern with one capturing group for extracting the case number. Example: `"case-(\\d+)"` or `"#(\\d+)"`||
|`featureNavigator.searchPattern`|A glob pattern where `${caseNumber}` is replaced by matched ID. Example: `"**/features/${caseNumber}*.feature".`||
|`featureNavigator.relativeRoot`|Optional subdirectory to limit search, relative to workspace folder. Example: `"src/tests"`||
|`featureNavigator.searchInContent`|Enable/Disable full-file content scan as a fallback||

> 💡 Tip
> To customize behavior per-project, add these configurations inside `.vscode/settings.json`.
 

### Example `.vscode/settings.json`

```json
{
  "featureNavigator.tagPattern": "#(\\d+)",
  "featureNavigator.searchPattern": "**/features/${caseNumber}*.feature",
  "featureNavigator.relativeRoot": "e2e/features",
  "featureNavigator.searchInContent": true
}
```

## 🖱️Usage

- Open a file containing a feature tag like `#123456`.
- Place your cursor over or click on the tag.
- If configured correctly, you’ll either jump to the file or see a list of matches.

## 🧪 Example Scenarios

Given a comment like:
```js
// TODO implement #789123 - see feature specs
```

If you have a `.feature` file at `features/789123-login.feature`, Feature Navigator will take you there using:
```js
tagPattern = "#(\\d+)"
searchPattern = "**/features/${caseNumber}*.feature"
```

With `searchInContent = true`, even if the file doesn’t follow the name pattern, it will still match if the content contains the same tag.

## 📦 Requirements

- VS Code v1.74+
- Workspace setup with folders containing `.feature` files or similar structures

## 🐞 Known Issues & Troubleshooting

### Nothing happens when I click the tag

Check the following:

- Is your `tagPattern` defined and valid?
- Does your current line actually match the `tagPattern`?
- Are the files named according to `searchPattern`?

Open the Developer Tools (`Help > Toggle Developer Tools`) to view logs from `FeatureNavigator`.

## 🧑‍💻 Contributing

Found a bug or want a new feature? Feel free to open an issue or submit a PR:

[🔗 GitHub Repository](https://github.com/bulga138/feature-navigator)

## 🏷️ Release Notes

**0.1.0**
- Initial release of Feature Navigator
- Support for configurable tag patterns
- File lookup via filename and optional content scanning
- Works with `.feature` files but configurable to others via glob pattern

### ❤️ Like this Extension?
#### ⭐ Give it a star on GitHub and rate it on the Marketplace