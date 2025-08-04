# Task: Reduce Bundle Filesize

https://github.com/dannysmith/astro-editor/issues/8

The bundled application is currently ~22MB. I suspect we can get this down a bit by:

- Applying the build optimisations here: https://v2.tauri.app/concept/size/
- Applying some of the JS optimisations here: https://v1.tauri.app/v1/guides/building/app-size/