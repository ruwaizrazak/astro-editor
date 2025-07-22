# Task: Layout Refactor

Our main application structure currently looks like this:

- `main.tsx` - root, renders `<App />` wrapped in `<QueryClientProvider>`
- `App.tsx` - renders `<Layout>` and `<ComponentBuilderDialog>` wrapped in `<ThemeProvider>` and also loads base styles etc from `App.css`
- `<Layout>` - Main layout for the app. Renders a wrapper div which contains the UnifieditleBar, a wrapper div for themain layout and then other components which are not visible by default like the comandPallete, ComponentBuilderDialog (again?), PreferencesPane and Toaster.
- The wrapper for the main layout contains a ResizablePanelGroup with two ResizablePanel'a (and a ResizableHandle in between).
- One of these just contains the sidebar, which makes sense.
- The second one contains EditorAreaWithFrontmatter, which itself contains a ResizablePanelGroup with two ResizablePanel'a (and a ResizableHandle in between), the first of which renders the MainEditor and the second the FrontmatterPanel
- `MainEditor` just conditionallly renders either the `Editor` or the `WelcomeScreen`, and always includes `StatusBar`.

## The Problem

This seems ridiculously complex. Not only does it have a whole bunch of wrapper-dives which apply styles in all sorts of different places. There's also a whole bunch of different components which are kind of hard to reason about in the way that they're put together here. I have some questions.

1. Should we combine main.tsx and app.tsx?
2. Should we make it so that Layout Contains the title bar, the left sidebar, the main content window, the right sidebar (The last three wrapped in resizable group) and potentially the status bar. It also needs to contain all of the normally hidden components.
3. Does it make sense to introduce components specifically called LeftSidebar and RightSidebar Which contain the FileBrowser and FrontmatterPanel. This would allow the front matter panel to deal only with rendering front matter and not worry about hiding itself etc. It would allow the file browser and (I guess) included in that is the collections browser, but that whole thing could be self-contained and just worry about that. Then separately we can worry about hiding and unhiding those sidebars. My main motivation here is that in the future, we may want to have tabs in one or two of these sidebars, so that the sidebars are able to hold things other than the file browser in front matter. This might be overkill though.
4. Why is the Component Builder dialogue here twice?
5. Should we remove the need for the main editor component by conditionally styling the welcome screen instead of the editor inside LayoutDirectly?
6. Can we reasonably remove some of the wrapper divs in favour of React Fragments, which don't need to render anything? We can obviously only do this if we have a good place to put tailwind classes. This clearly won't work for everything because sometimes we need wrapper divs.
7. What would a senior React front-end engineer do in this circumstance to make this whole thing a little bit simpler?

When thinking about these changes, we need to be Cognizant of state management and the fact that <Layout> Is currently responsible for a number of things. Because of the way we have structured things, we shouldn't have too many problems, but we just need to be careful.
