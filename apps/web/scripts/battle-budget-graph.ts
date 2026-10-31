/** The client build records these edges before filenames are hashed. */
export interface BudgetChunk {
  readonly imports: readonly string[];
  readonly dynamicImports: readonly string[];
  readonly play?: boolean;
  readonly battle?: boolean;
  readonly hero?: boolean;
}
export type BudgetGraph = Readonly<Record<string, BudgetChunk>>;

/** Read external script and modulepreload URLs from the actual /play response. */
export const htmlScriptFiles = (html: string): readonly string[] => {
  const files = new Set<string>();
  for (const tag of html.matchAll(/<(?:script|link)\b[^>]*>/giu)) {
    const value = tag[0].match(
      /(?:src|href)=["'](?<file>[^"']+\.js(?:\?[^"']*)?)["']/iu
    )?.groups?.file;
    if (value) {
      files.add(new URL(value, "http://budget.local").pathname.slice(1));
    }
  }
  return [...files];
};

/** Stop at initial chunks. Their lazy edges include other screens. */
export const additionalBattleChunks = (
  graph: BudgetGraph,
  html: string,
  heroModel: boolean
): readonly string[] => {
  const play: string[] = [];
  const roots: string[] = [];
  const hero: string[] = [];
  for (const [file, chunk] of Object.entries(graph)) {
    if (chunk.play) {
      play.push(file);
    }
    if (chunk.battle) {
      roots.push(file);
    }
    if (chunk.hero) {
      hero.push(file);
    }
  }
  if (play.length === 0 || roots.length === 0) {
    throw new Error(
      "The client build must contain the Play and Battle entry points."
    );
  }
  const initial = new Set<string>();
  const visitInitial = (file: string) => {
    if (initial.has(file)) {
      return;
    }
    const chunk = graph[file];
    if (!chunk) {
      throw new Error(`Missing initial JavaScript chunk: ${file}`);
    }
    initial.add(file);
    for (const imported of chunk.imports) {
      visitInitial(imported);
    }
  };
  for (const file of [...htmlScriptFiles(html), ...play]) {
    visitInitial(file);
  }
  const additional = new Set<string>();
  const visitBattle = (file: string) => {
    if (initial.has(file) || additional.has(file)) {
      return;
    }
    const chunk = graph[file];
    if (!chunk) {
      throw new Error(`Missing Battle JavaScript chunk: ${file}`);
    }
    additional.add(file);
    for (const imported of [...chunk.imports, ...chunk.dynamicImports]) {
      visitBattle(imported);
    }
  };
  if (heroModel) {
    if (hero.length === 0) {
      throw new Error(
        "Hero models are requested but are not enabled in this production build."
      );
    }
    roots.push(...hero);
  }
  for (const file of roots) {
    visitBattle(file);
  }
  return [...additional].toSorted();
};

export const ASSET_BUDGET = 50_000_000;
export const JAVASCRIPT_BUDGET = 5_000_000;
export const HERO_APPEARANCE_BUDGET = 10_000_000;

export const battleBudgetPasses = (
  assets: number,
  javascript: number
): boolean => assets < ASSET_BUDGET && javascript < JAVASCRIPT_BUDGET;
