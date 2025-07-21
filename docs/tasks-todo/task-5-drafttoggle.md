# Task: File List Drafts Toggle

- Add a simple toggle switch which only shows drafts in the file list sidebar.
- Whether this is toggled on or off should be remembered in the project settings and should be specific to each collection. I.e., this state should persist on disc in the usual way (see `/docs/developer/preferences-system.md`) And use TanStack Query.
- We need to decide on the best and least obtrusive UI. I feel like the toggle should be in the top right Of the sidebar header. And I'm not sure it should be a toggle switch in the usual way. I feel like maybe we should do it the same way we do in the Unified title bar for toggling on and off focus mode. But we do need to make it very clear - perhaps to the use of colour when that is only showing drafts. Users will get confused when this is toggled on and they're not seeing posts which aren't drafts.
- This feature should affect nothing outside of the sidebar. It's just a simple filter.
