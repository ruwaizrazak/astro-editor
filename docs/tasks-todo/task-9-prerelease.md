# Task: Pre Initial Release Tasks

These tasks are necessary before releasing this "to the world".

## In-App

- [ ] Add a "Preferences" menu item under "Astro Editor" macoOS menubar menu which opens the settings. The correct coyboard shortcut is `Cmd+,` which already works. Do this in the same way you have with other Tauri menubar items.
- [ ] Add "About" dialog and menu item (should include version number, build, release datee etc)
- [ ] Update all info in `package.json` and `src-tauri/tauri.conf.json`
- [ ] Create and add custom App icons (`src-tauri/icons`)

## Docs and Files

- [ ] Clean up `docs/archive` as needed
- [ ] Clean up `docs/developer` and add any missing guides. Add README.md as an index.
- [ ] Ensure `docs/user-guide.md` is up-to-date and accurate (see `task-[x]-user-guide.md`).
- [x] Remove all personal-ish demo content from `/test/dummy-astro-project` so it is suitable for other people to use when testing.
- [ ] Add standard CONTRIBUTING.md to `/docs`
- [ ] Add README.md to `/docs` as index
- [x] Add LICENSE.md and license info to package.json
- [ ] Add SECURITY.md to room
- [ ] Review all non-code files - any which can be removed?
- [ ] Clean up CLAUDE.md
- [ ] Add bare-bones `/.cursor` rules which reference CLAUDE.md
- [ ] Add GEMINI.md which references CLAUDE.md
- [ ] Record 5-min demo video, demo gif and sexy-screenshot-header for README.md
- [ ] Update README.md accordingly

## GitHub Config

- [ ] Configure GitHub repo for proper dev, security, releases, issue tags etc
- [ ] Configure sensible checks on PRs etc (BugBot etc)
- [ ] Migrate any outstanding features or known bugs to GitHub Issues
- [ ] Migrate Roadmap to GitHub Project
- [ ] Clean up any old issues/branches etc
