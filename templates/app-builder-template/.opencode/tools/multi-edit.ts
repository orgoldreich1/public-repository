import { tool } from "@opencode-ai/plugin";
import { readFile, writeFile } from "fs/promises";
import { join, isAbsolute } from "path";

export default tool({
  description:
    "Apply multiple find-and-replace edits across one or more files in a single call. " +
    "Use this instead of calling edit multiple times. Each edit replaces oldString with newString " +
    "in the named file. If oldString appears more than once and replaceAll is false, the edit fails — " +
    "include more context in oldString to make it unique, or set replaceAll: true.",
  args: {
    edits: tool.schema
      .array(
        tool.schema.object({
          path: tool.schema
            .string()
            .describe("File path relative to project root"),
          oldString: tool.schema
            .string()
            .min(1)
            .describe("Exact string to find. Must be unique unless replaceAll is true."),
          newString: tool.schema.string().describe("Replacement string"),
          replaceAll: tool.schema
            .boolean()
            .optional()
            .describe("Replace every occurrence (default: false)"),
        }),
      )
      .describe("Array of edits to apply in order"),
  },
  async execute(args, context) {
    const results: string[] = [];
    for (const e of args.edits) {
      const fullPath = isAbsolute(e.path)
        ? e.path
        : join(context.directory, e.path);
      try {
        const content = await readFile(fullPath, "utf-8");
        const occurrences = content.split(e.oldString).length - 1;
        if (occurrences === 0) {
          results.push(`FAILED: ${e.path} - oldString not found`);
          continue;
        }
        if (occurrences > 1 && !e.replaceAll) {
          results.push(
            `FAILED: ${e.path} - oldString appears ${occurrences} times; pass replaceAll: true or include more surrounding context`,
          );
          continue;
        }
        const updated = e.replaceAll
          ? content.split(e.oldString).join(e.newString)
          : content.replace(e.oldString, e.newString);
        await writeFile(fullPath, updated, "utf-8");
        results.push(`OK: ${e.path}`);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        results.push(`FAILED: ${e.path} - ${msg}`);
      }
    }
    return results.join("\n");
  },
});
