import { tool } from "@opencode-ai/plugin";
import { writeFile, mkdir } from "fs/promises";
import { join, dirname, isAbsolute } from "path";

export default tool({
  description:
    "Write multiple files at once. Creates directories as needed. " +
    "Use this instead of calling write/edit multiple times for new files.",
  args: {
    files: tool.schema
      .array(
        tool.schema.object({
          path: tool.schema
            .string()
            .describe("File path relative to project root"),
          content: tool.schema.string().describe("Full file content"),
        }),
      )
      .describe("Array of { path, content } objects to write"),
  },
  async execute(args, context) {
    const results: string[] = [];
    for (const f of args.files) {
      const fullPath = isAbsolute(f.path)
        ? f.path
        : join(context.directory, f.path);
      try {
        await mkdir(dirname(fullPath), { recursive: true });
        const content =
          typeof f.content === "string"
            ? f.content
            : JSON.stringify(f.content, null, 2);
        await writeFile(fullPath, content, "utf-8");
        results.push(`OK: ${f.path}`);
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        results.push(`FAILED: ${f.path} - ${msg}`);
      }
    }
    return results.join("\n");
  },
});
