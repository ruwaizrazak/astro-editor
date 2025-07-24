# Task: Code Review Tasks

Series of Extensive Code Reviews with specific AI Agent personalities, with clear focussed review goals: "Look for opportunities to..." Maybe do this with GEMINI?

## 1 - Shadcn components

Review shadcn components for any which are unnececarry. We may wish to keep a few which are currently unused but we think will be used soon.

## 2 - Naming

Review all naming (components, methods, variables, functions, files etc) for better readability and consistency of naming convention accross the codebase.

## 3 - Overly clever TS code

- Refactor any overly "clever" TS code so it's easier to understand
- Remove all unnececary `console.log` and code comments.

## 4 - Structure of TS and React components

1. Look for opportunities to refactor TS functions into reusable helper/utility methods so React components easier for developers to parse without distraction.
2. Extract React components into their own files, aim for only one React component per file in most cases.
3. Remove all unnececarry wrapper divs (and wrapper React components which add no value).

## 5 - CSS/tailwind

Remove all redundant or unnececarry tailwind classes

## 6 - Security Review

Comprehensive Expert review of entire codebase for potential security issues.

## 7 - Performance Profiling & Optimisation
