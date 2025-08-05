# Apple Code Signing Setup Guide

This guide walks you through setting up Apple code signing for Astro Editor using the **secure API key method** (no Apple ID passwords required).

## Overview

You'll need to set up two separate signing systems:

1. **Apple Code Signing** - Prevents "unknown developer" warnings for users
2. **Tauri Update Signing** - Secures auto-updates (already configured)

## Step 1: Create App Store Connect API Key

### 1.1 Generate the API Key

1. Go to [App Store Connect](https://appstoreconnect.apple.com/)
2. Navigate to **Users and Access**
3. Click the **Integrations** tab
4. Ensure **App Store Connect API** is selected
5. Click **Generate API Key** (or the **+** button if you have existing keys)
6. Enter name: `Astro Editor CI`
7. Select role: **Developer** (sufficient for notarization)
8. Click **Generate**

### 1.2 Download and Store the Key

1. **Download the `.p8` file** (can only be downloaded once!)
2. Note the **Key ID** (10-character alphanumeric, e.g., `ABC1234567`)
3. Note the **Issuer ID** (UUID format, e.g., `12345678-1234-1234-1234-123456789012`)

⚠️ **Important**: Store the `.p8` file securely - you cannot download it again!

## Step 2: Create Developer ID Application Certificate

### 2.1 Create Certificate Signing Request (CSR)

1. Open **Keychain Access** on your Mac
2. Go to **Keychain Access** → **Certificate Assistant** → **Request a Certificate From a Certificate Authority**
3. Enter your email address
4. Enter name: `Astro Editor`
5. Leave CA Email blank
6. Select **Saved to disk**
7. Click **Continue** and save the `.certSigningRequest` file

### 2.2 Create Certificate in Apple Developer Portal

1. Go to [Apple Developer Certificates](https://developer.apple.com/account/resources/certificates/list)
2. Click **+** to create new certificate
3. Select **Developer ID Application** (under "Distribution")
4. Click **Continue**
5. Upload your `.certSigningRequest` file
6. Click **Continue** → **Download**

### 2.3 Install and Export Certificate

1. **Double-click** the downloaded certificate to install in Keychain
2. In Keychain Access, find your certificate
3. **Right-click** → **Export**
4. Choose format: **Personal Information Exchange (.p12)**
5. Set a **strong password** (you'll need this for GitHub)
6. Save as `astro-editor-cert.p12`

## Step 3: Configure GitHub Secrets

Go to your GitHub repository → **Settings** → **Secrets and variables** → **Actions**

Add these **Repository Secrets**:

### Apple Code Signing Secrets

```bash
# Convert .p12 certificate to base64
base64 -i astro-editor-cert.p12 | pbcopy
```

| Secret Name                  | Value                             | Description                 |
| ---------------------------- | --------------------------------- | --------------------------- |
| `APPLE_CERTIFICATE`          | Base64 content from above command | Your .p12 certificate       |
| `APPLE_CERTIFICATE_PASSWORD` | Your .p12 password                | Certificate export password |
| `APPLE_API_KEY`              | Key ID (10 chars)                 | From App Store Connect      |
| `APPLE_API_ISSUER`           | Issuer ID (UUID)                  | From App Store Connect      |
| `APPLE_API_KEY_PATH`         | Content of .p8 file               | Private key content         |

### Tauri Update Signing Secrets (if not already set)

If you haven't set up Tauri update signing yet:

```bash
# Generate Tauri signing keys
npm run tauri signer generate -- -w ~/.tauri/astro-editor.key
```

| Secret Name                          | Value                       | Description          |
| ------------------------------------ | --------------------------- | -------------------- |
| `TAURI_PRIVATE_KEY`                  | Content of private key file | Tauri update signing |
| `TAURI_SIGNING_PRIVATE_KEY_PASSWORD` | Key password (if set)       | Optional password    |

## Step 4: Test the Setup

### 4.1 Create a Test Release

1. **Ensure all secrets are configured** in GitHub
2. **Push a new tag** or use workflow dispatch:
   ```bash
   git tag v0.1.11-test
   git push origin v0.1.11-test
   ```

### 4.2 Monitor the Build

1. Go to **Actions** tab in GitHub
2. Watch the build process
3. Look for successful certificate import and signing

### 4.3 Verify Signing (After Release)

Download the DMG and verify it's signed:

```bash
# Check code signature
codesign -dv --verbose=4 "Astro Editor.app"

# Check notarization
spctl -a -vv "Astro Editor.app"
```

## Troubleshooting

### Common Issues

**"No signing identity found"**

- Ensure certificate is properly imported in Keychain
- Check that `signingIdentity` in `tauri.conf.json` is `null` (not `"-"`)

**"Invalid API key"**

- Verify Key ID and Issuer ID are correct
- Ensure .p8 file content is properly copied

**"Certificate not found"**

- Make sure certificate is in login keychain
- Try exporting and re-importing the certificate

**"Notarization failed"**

- Check that your Apple Developer account is in good standing
- Ensure the API key has Developer role permissions
