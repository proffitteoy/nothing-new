// Collection keys explicitly approved for public metadata. Never exports notes or attachments.
const config = {
  apiUrl: "http://127.0.0.1:23119",
  libraryPath: "users/0",
  outputFile: "data/paper-library.json",
  includeUnfiled: true,
  collections: [
    { key: "AMK8TWPP", includeChildren: true },
    { key: "FPB9ZSTD", includeChildren: true },
    { key: "V4XCB3S3", includeChildren: true },
    { key: "DY7482Z5", includeChildren: true },
    { key: "74SPTEBH", includeChildren: true },
    { key: "P7VQYBWW", includeChildren: true },
    { key: "R599SJTC", includeChildren: true },
    { key: "5QAT46KU", includeChildren: true },
    { key: "4EVCFWI9", includeChildren: true },
    { key: "LU7YC8AT", includeChildren: true },
  ],
  // Canonical Zotero IDs, e.g. "zotero:personal:ABCD2345". Exclusions always win.
  exclude: [],
  // "items" requires each new item to appear in approvedItems; "collections" is automatic.
  reviewMode: "collections",
  approvedItems: [],
  readTag: "paper:read",
  readingTag: "paper:reading",
}

export default config
