# Task: Focus and Typewriter Mode

## Focus mode

Like iA Writer - Current sentence and is coloured normally, everything else is greyed out. We'll need to use Codemirror's functions somehow to get the current sentence This may be possible through the Markdown language package. Or maybe not But we probably don't want to write our own complicated stuff to do that if we can avoid it. At the very least, we should be using CodeMirror's API.

## Typewriter mode

Like iA Writer - The currently selected line is always in the middle of the Editor window And the content vertically scrolls up and down as Needed to maintain this. Would normally be combined with focus mode to allow you to focus only on the current sentence you're writing. May require some subtle CSS gradients at the very top and bottom so it looks like the text is fading as it scrolls off the top or bottom of the screen. I'm not sure what the best approach to implementing this is. Perhaps there is some auto-scrolling stuff in CodeMirror.
