import * as vscode from "vscode";

export class FeatureDefinitionProvider implements vscode.DefinitionProvider {
  //--------------------------------------------------------------------
  // Entry point – unchanged except for a few extra logs
  //--------------------------------------------------------------------
  public async provideDefinition(
    document: vscode.TextDocument,
    position: vscode.Position,
    token: vscode.CancellationToken
  ): Promise<vscode.Definition | null> {
    console.log("FeatureNavigator: provideDefinition activated.");

    const config = vscode.workspace.getConfiguration("featureNavigator");
    const tagPatternString = config.get<string>("tagPattern");
    if (!tagPatternString) {
      console.error("FeatureNavigator: No tagPattern configured.");
      return null;
    }

    console.log(`FeatureNavigator: Using tagPattern: ${tagPatternString}`);

    // -----------------------------------------------------------------
    // Build the RegExp – note the absence of the global flag.  We only
    // need to know *if* the line contains a tag, not to iterate over
    // many matches on the same line.
    // -----------------------------------------------------------------
    let tagRegex: RegExp;
    try {
      tagRegex = new RegExp(tagPatternString, "gi");
    } catch (e) {
      console.error("FeatureNavigator: Invalid tagPattern regex:", e);
      vscode.window.showErrorMessage(
        "FeatureNavigator: Invalid tagPattern regex. Check your settings."
      );
      return null;
    }

    const caseNumber = this.getCaseNumberAt(document, position, tagRegex);
    if (!caseNumber) {
      console.log("FeatureNavigator: No case number found at position.");
      return null;
    }

    console.log(`FeatureNavigator: Found case number: ${caseNumber}`);

    // -----------------------------------------------------------------
    // 1️⃣  Find by filename
    // -----------------------------------------------------------------
    const locations: vscode.Location[] = [];

    const filenameMatches = await this.findFilesByFilename(
      caseNumber,
      document,
      config,
      token
    );
    locations.push(...filenameMatches);
    console.log(
      `FeatureNavigator: Found ${filenameMatches.length} matches by filename.`
    );

    // -----------------------------------------------------------------
    // 2️⃣  (Optional) Find by content
    // -----------------------------------------------------------------
    const searchInContent = config.get<boolean>("searchInContent");
    console.log(`FeatureNavigator: searchInContent = ${searchInContent}`);

    if (searchInContent) {
      const existingPaths = new Set(filenameMatches.map((l) => l.uri.fsPath));
      const contentMatches = await this.findFilesByContent(
        caseNumber,
        tagRegex,
        existingPaths,
        token
      );
      locations.push(...contentMatches);
      console.log(
        `FeatureNavigator: Found ${contentMatches.length} matches by content.`
      );
    }

    if (locations.length === 0) {
      console.log("FeatureNavigator: No locations found.");
      return null;
    }

    console.log(`FeatureNavigator: Returning ${locations.length} locations.`);
    return locations.length === 1 ? locations[0] : locations;
  }

  //--------------------------------------------------------------------
  // ️⃣  getCaseNumberAt
  //--------------------------------------------------------------------
  /**
   * Returns the numeric case id (e.g. “123456”) if the cursor is on a
   * tag that matches the supplied regex.  The regex is allowed to have
   * surrounding quotes – they are ignored for the purpose of the
   * “cursor is inside the match” test.
   */
  private getCaseNumberAt(
    document: vscode.TextDocument,
    position: vscode.Position,
    tagRegex: RegExp
  ): string | null {
    const line = document.lineAt(position.line);
    const lineText = line.text;

    console.log(`FeatureNavigator: Checking line: "${lineText}"`);
    console.log(
      `FeatureNavigator: Click position (character): ${position.character}`
    );
    console.log(`FeatureNavigator: Using regex: ${tagRegex.source}`);

    // Create a fresh regex instance without global flag to avoid state issues
    const freshRegex = new RegExp(tagRegex.source, "gi");

    let match;
    let matchCount = 0;

    while ((match = freshRegex.exec(lineText)) !== null) {
      matchCount++;
      const start = match.index;
      const end = start + match[0].length;

      console.log(
        `FeatureNavigator: Match ${matchCount}: "${match[0]}" at position ${start}-${end}`
      );
      console.log(`FeatureNavigator: Captured group: "${match[1]}"`);

      // Check if cursor is within this specific match's boundaries
      if (position.character >= start && position.character <= end) {
        const caseNum = match[1];
        if (caseNum) {
          console.log(
            `FeatureNavigator: Cursor inside match → case number = ${caseNum}`
          );
          return caseNum;
        }
      }
    }

    console.log(
      `FeatureNavigator: Found ${matchCount} total matches, none at cursor position.`
    );
    return null;
  }

  //--------------------------------------------------------------------
  // 2️⃣  findFilesByFilename – unchanged except for a little extra log
  //--------------------------------------------------------------------
  private async findFilesByFilename(
    caseNumber: string,
    document: vscode.TextDocument,
    config: vscode.WorkspaceConfiguration,
    token: vscode.CancellationToken
  ): Promise<vscode.Location[]> {
    const patternTemplate = config.get<string>("searchPattern") ?? "";
    const relativeRoot = config.get<string>("relativeRoot") ?? "";

    console.log(`FeatureNavigator: Using searchPattern: ${patternTemplate}`);

    const glob = patternTemplate.replace("${caseNumber}", caseNumber);
    console.log(`FeatureNavigator: Final glob: ${glob}`);

    let searchPattern: vscode.GlobPattern = glob;
    if (relativeRoot) {
      const folder = vscode.workspace.getWorkspaceFolder(document.uri);
      if (folder) {
        const rootUri = vscode.Uri.joinPath(folder.uri, relativeRoot);
        searchPattern = new vscode.RelativePattern(rootUri, glob);
      }
    }

    const files = await vscode.workspace.findFiles(
      searchPattern,
      "",
      100,
      token
    );

    files.forEach((f) =>
      console.log(`FeatureNavigator: Matched file ${f.fsPath}`)
    );

    return files.map(
      (uri) => new vscode.Location(uri, new vscode.Position(0, 0))
    );
  }

  //--------------------------------------------------------------------
  // 3️⃣  findFilesByContent – unchanged except for a bit of logging
  //--------------------------------------------------------------------
  private async findFilesByContent(
    caseNumber: string,
    tagRegex: RegExp,
    existingPaths: Set<string>,
    token: vscode.CancellationToken
  ): Promise<vscode.Location[]> {
    const locations: vscode.Location[] = [];

    const allFeatureFiles = await vscode.workspace.findFiles(
      "**/*.feature",
      "",
      1000,
      token
    );
    console.log(
      `FeatureNavigator: Scanning ${allFeatureFiles.length} .feature files for content.`
    );

    // We need a *global* version for the file‑wide scan
    const contentRegex = new RegExp(tagRegex.source, "g");

    await Promise.all(
      allFeatureFiles.map(async (uri) => {
        if (existingPaths.has(uri.fsPath) || token.isCancellationRequested) {
          return;
        }

        try {
          const bytes = await vscode.workspace.fs.readFile(uri);
          const text = Buffer.from(bytes).toString("utf8");

          let m: RegExpExecArray | null;
          while ((m = contentRegex.exec(text)) !== null) {
            if (m[1] === caseNumber) {
              console.log(`FeatureNavigator: Content match in ${uri.fsPath}`);
              locations.push(
                new vscode.Location(uri, new vscode.Position(0, 0))
              );
              break; // one hit per file is enough
            }
          }
        } catch (e) {
          console.error(`FeatureNavigator: Failed to read ${uri.fsPath}`, e);
        }
      })
    );

    return locations;
  }
}
