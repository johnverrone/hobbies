import { readdir, readFile, mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { parse } from "yaml";

const HOBBIES_DIR = join(import.meta.dirname, "../../hobbies/coffee");
const OUT_DIR = join(import.meta.dirname, "../src/generated");

async function readYamlDir(dir: string): Promise<unknown[]> {
  const entries = await readdir(dir);
  const yamlFiles = entries.filter((f) => f.endsWith(".yaml")).sort();
  const results: unknown[] = [];
  for (const file of yamlFiles) {
    const content = await readFile(join(dir, file), "utf-8");
    results.push(parse(content));
  }
  return results;
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });

  const beans = await readYamlDir(join(HOBBIES_DIR, "beans"));
  const roasters = await readYamlDir(join(HOBBIES_DIR, "roasters"));

  await writeFile(join(OUT_DIR, "beans.json"), JSON.stringify(beans, null, 2));
  await writeFile(
    join(OUT_DIR, "roasters.json"),
    JSON.stringify(roasters, null, 2)
  );

  console.log(
    `Generated ${beans.length} beans and ${roasters.length} roasters`
  );
}

main();
