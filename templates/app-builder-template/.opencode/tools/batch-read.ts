import { tool } from "@opencode-ai/plugin";
import { readFile } from "fs/promises";
import { join, isAbsolute } from "path";

export default tool({
  description:
    "Read multiple files at once and return their contents. " +
    "Use this instead of calling read multiple times sequentially.",
  args: {
    paths: tool.schema
      .array(tool.schema.string())
      .describe("Array of file paths (relative to project root) to read"),
  },
  async execute(args, context) {
    const results: string[] = [];
    for (const filePath of args.paths) {
      const fullPath = isAbsolute(filePath) ? filePath : join(context.directory, filePath);
      try {
        const content = await readFile(fullPath, "utf-8");
        results.push(`--- ${filePath} ---\n${content}`);
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        results.push(`--- ${filePath} ---\nERROR: ${msg}`);
      }
    }
    return results.join("\n\n");
  },
});
