export const BuildArgv = {
  directory: {
    string: true,
    alias: ["d"],
    default: "content",
    describe: "directory containing public Markdown notes",
  },
  verbose: {
    boolean: true,
    alias: ["v"],
    default: false,
    describe: "print detailed build output",
  },
  concurrency: {
    number: true,
    describe: "number of note parsing workers",
  },
}
