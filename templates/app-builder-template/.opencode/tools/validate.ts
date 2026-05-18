import { tool } from "@opencode-ai/plugin";

export default tool({
  description:
    "Run project validation: TypeScript check by default, optionally a full build. " +
    "Use this instead of running npm install, tsc, and wix build separately.",
  args: {
    installDeps: tool.schema
      .boolean()
      .optional()
      .describe(
        "Default false. Only set true when package.json changed in this iteration " +
          "(added, removed, or upgraded a dependency). node_modules is pre-populated " +
          "in the image, so installs are unnecessary otherwise.",
      ),
    runBuild: tool.schema
      .boolean()
      .optional()
      .describe(
        "Default false. Set true ONLY on the final validation pass after tsc " +
          "succeeds to run `wix build` and verify the project builds end-to-end. " +
          "`wix build` is slow (~20s); omitting it on intermediate iterations keeps " +
          "the edit-validate loop fast.",
      ),
  },
  async execute(args, context) {
    const steps: string[] = [];
    const cwd = context.directory;

    if (args.installDeps) {
      const install = await Bun.$`npm install --no-audit --no-fund`
        .cwd(cwd)
        .nothrow()
        .quiet();
      if (install.exitCode !== 0) {
        return `FAILED at npm install (exit ${install.exitCode}):\n${install.stderr.toString()}`;
      }
      steps.push("npm install: OK");
    }

    const tsc = await Bun.$`npx tsc --noEmit`.cwd(cwd).nothrow().quiet();
    if (tsc.exitCode !== 0) {
      return [
        ...steps,
        `FAILED at tsc --noEmit (exit ${tsc.exitCode}):`,
        tsc.stdout.toString(),
        tsc.stderr.toString(),
      ].join("\n");
    }
    steps.push("tsc --noEmit: OK");

    if (!args.runBuild) {
      steps.push("wix build: skipped (pass runBuild: true to verify build)");
      return steps.join("\n");
    }

    const build = await Bun.$`npx wix build`.cwd(cwd).nothrow().quiet();
    if (build.exitCode !== 0) {
      return [
        ...steps,
        `FAILED at wix build (exit ${build.exitCode}):`,
        build.stdout.toString(),
        build.stderr.toString(),
      ].join("\n");
    }
    steps.push("wix build: OK");

    return steps.join("\n");
  },
});
