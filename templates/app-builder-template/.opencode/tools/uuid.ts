import { tool } from "@opencode-ai/plugin";
import { randomUUID } from "crypto";

export default tool({
  description:
    "Generate one or more UUID v4s. Use this instead of bash commands. " +
    "Set count to generate multiple UUIDs in a single call.",
  args: {
    count: tool.schema
      .number()
      .min(1)
      .max(10)
      .default(1)
      .describe("Number of UUIDs to generate."),
  },
  async execute(args) {
    const count = args.count ?? 1;
    return Array.from({ length: count }, () => randomUUID()).join("\n");
  },
});
