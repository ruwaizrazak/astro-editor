# Task: Switch to Tanstack Query everywhere

Asynchronous Operations & Data Caching: TanStack Query (formerly React Query)

- This is the missing piece you're likely feeling. A huge part of what makes Next.js development nice is its structured data-loading patterns. TanStack Query brings that same level of structure and reliability to any React app.
- How it makes things less error-prone:
  - Manages Server State: It treats the data from your Rust backend as "server state."
  - Handles Caching: It automatically caches the results of your invoke calls, preventing you from re-fetching the same data unnecessarily.
  - Manages Loading/Error States: It removes all the manual const [isLoading, setIsLoading] = useState(true) boilerplate. Your components simply know if a query is loading, has an error, or has data.
  - Background Refetching: It can automatically refetch data when the window is refocused or on a set interval, keeping your UI in sync with the underlying file system.

In your app, instead of calling invoke directly inside a useEffect, you would wrap it in a useQuery hook. This makes your components cleaner and your data flow far more robust and predictable.
