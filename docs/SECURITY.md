# Security Policy

## Reporting a Vulnerability

**Do not** create a public GitHub issue for security vulnerabilities.

Instead, please contact the project maintainer directly via private communication with:

- Description of the vulnerability
- Steps to reproduce
- Potential impact

We'll respond within 48 hours and provide updates on our progress.

## Security for Developers

When contributing to Astro Editor:

- Follow the [Tauri Security Guide](https://tauri.app/v1/guides/building/security)
- Run `npm run check:all` before committing to catch security issues
- Be careful with file system operations - only access intended directories
- Review Tauri command implementations for privilege escalation risks
- Update dependencies promptly when security patches are available

## About This Application

Astro Editor is a local-first application that stores data on your machine and does not transmit content to external servers. It uses Tauri v2's security framework with sandboxed web views and validated IPC communication.
