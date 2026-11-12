# Yin and Yang releases

- Update the relevant in-app Help topics in `dist/help-data.js` whenever user-facing behavior changes. Describe where the feature lives and how to use it.
- Keep the latest release entry in `dist/version-history.js` and `package.json` in sync. Add concise user-facing notes to the appropriate release for every shipped change. Start a new dated entry for each new version and keep earlier notes.
- Use a patch version for fixes and documentation, a minor version for compatible features, and a major version for an intentionally incompatible change. Call out data migration or backup compatibility changes in the release notes.
- Include a paste-ready commit line in the handoff. Separate the main changes with semicolons.
