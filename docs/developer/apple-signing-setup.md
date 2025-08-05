# Apple Signing Setup

This guide helps you set up Apple code signing for Astro Editor.

## Prerequisites

- Apple Developer account ($99/year)
- macOS with Xcode command line tools

## 1. Create App Store Connect API Key

1. Go to [App Store Connect](https://appstoreconnect.apple.com/) → **Users and Access** → **Integrations**
2. Click **Generate API Key**
3. Name it (e.g., "Astro Editor CI") and select **Developer** role
4. Download the `.p8` file (⚠️ can only download once!)
5. Note the **Key ID** and **Issuer ID**

## 2. Create Developer ID Certificate

1. Open **Keychain Access** → **Certificate Assistant** → **Request a Certificate From a Certificate Authority**
2. Fill in your email, leave CA Email blank, select "Saved to disk"
3. Go to [Apple Developer](https://developer.apple.com/account/resources/certificates/list)
4. Create new certificate → **Developer ID Application**
5. Upload the CSR file, download the certificate
6. Double-click to install, then right-click in Keychain → Export as `.p12` with password

## 3. Add GitHub Secrets

In your repo → **Settings** → **Secrets** → **Actions**, add:

| Secret Name | Value |
|-------------|-------|
| `APPLE_CERTIFICATE` | Base64 of .p12 file: `base64 -i cert.p12 \| pbcopy` |
| `APPLE_CERTIFICATE_PASSWORD` | Password you set when exporting |
| `APPLE_API_KEY` | Key ID from step 1 |
| `APPLE_API_ISSUER` | Issuer ID from step 1 |
| `APPLE_API_KEY_PATH` | Contents of the .p8 file |
| `APPLE_TEAM_ID` | Your Team ID (from Apple Developer account) |

## 4. Update GitHub Actions

The workflow needs to:
1. Import the certificate
2. Create the API key file
3. Set `APPLE_SIGNING_IDENTITY` environment variable

Example:
```yaml
- name: Import Code-Signing Certificates
  uses: apple-actions/import-codesign-certs@v3
  with:
    p12-file-base64: ${{ secrets.APPLE_CERTIFICATE }}
    p12-password: ${{ secrets.APPLE_CERTIFICATE_PASSWORD }}

- name: Create API Key file
  run: |
    mkdir -p ~/private_keys
    echo "${{ secrets.APPLE_API_KEY_PATH }}" > ~/private_keys/AuthKey_${{ secrets.APPLE_API_KEY }}.p8
    chmod 600 ~/private_keys/AuthKey_${{ secrets.APPLE_API_KEY }}.p8

- name: Build and release
  env:
    APPLE_SIGNING_IDENTITY: "Developer ID Application: Your Name (TEAMID)"
    APPLE_API_ISSUER: ${{ secrets.APPLE_API_ISSUER }}
    APPLE_API_KEY: ${{ secrets.APPLE_API_KEY }}
    APPLE_API_KEY_PATH: ~/private_keys/AuthKey_${{ secrets.APPLE_API_KEY }}.p8
    APPLE_TEAM_ID: ${{ secrets.APPLE_TEAM_ID }}
```

## That's it!

Push a tag to trigger a release build. The app will be signed and notarized automatically.