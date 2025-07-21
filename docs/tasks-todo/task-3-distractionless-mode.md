# Task: Distractionless mode

This feature should only happen when both sidebars are closed And Only parts of the layout visible are the unified title bar, Editor and status bar.

When in this state, we've already re-styled the status bar and title bar to make them subtle. We've removed The background and made the borders transparent etc.

When a user had both sidebars hidden and they begin typing in the editor, the whole unified title bar and status bar should become invisible.
When a user moves their mouse over the unified title bar or status bar, both should reappear together and then stay there (as per normal) until they start typing again in the editor.

They should always be shown if either of the sidebars are shown.
Once a user has moused over and they've been shown, they should not disappear again if the user mouses away. They should be back in their normal state and they should only disappear again once the user has typed, so this whole thing's triggered again right?

The actual components shouldn't be removed. In other words, I should still be able to click on the title bar at the very top and be able to drag the window around. That should be possible because it should have reappeared when I move my mouse there.

I think the easiest way to do this is simply to set their opacity to zero? It's extremely important that no functionality at all is changed here. A previous attempt to solve this problem added a lot of complexity and listeners, and problems with rendering and state management. It seems to me the only state we need to store here Is whether or not the bars are currently visible. Then we need to listen for typing in the editor And set that state. The user moving their mouse over the status bar or the top should simply reset that state to its default. It would probably be good UX if we only actually set that state when the user had typed more than 3-4 characters in the editor in a short space of time. That way we won't be constantly showing and hiding this when the user is just making very quick one-character edits.

We need to think carefully about how the content is actually hidden by this state because there is potential that if the content is hidden with display:none or similar, it's not going to receive any updates it gets from elsewhere in the application when state is changed etc. This could affect things like auto-save, Toggling on and off Focus Mode via the Command Palette (which updates the button in the toolbar etc) and potentially in the future certain other things.

An attempt to solve this problem before we tried to use `isDirty` To know whether we were typing or not, which was a terrible approach because that exists only to deal with saving.

In terms of animation, I think it is suitable for the first effort here to simply have them disappear, but then we can use some CSS to have them fade away. I don't want them to slide up or down at all Because that would require moving them rather than simply making them invisible.
