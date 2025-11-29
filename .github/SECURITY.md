# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| Latest  | :white_check_mark: |

## Security Considerations

AureTrix is a web-based application that communicates with keyboard hardware via the WebHID API. This section outlines the security model and considerations.

### WebHID Security Model

- **User Permission Required**: WebHID requires explicit user permission to access any USB device. The browser prompts users to select and authorize each device.
- **HTTPS Only**: WebHID only works over HTTPS connections (localhost is exempt for development).
- **Same-Origin Policy**: WebHID access is restricted to the origin that requested permission.
- **No Background Access**: The application cannot access devices without an active browser session.

### Data Handling

- **Local Storage Only**: User preferences and cached data are stored locally in the browser (localStorage, IndexedDB).
- **No Server Communication**: AureTrix does not send keyboard data or configurations to external servers.
- **Firmware Updates**: All firmware communication is direct between the browser and keyboard via WebHID.

### USB Device Access

- **Scoped Access**: The application only requests access to SparkLink-compatible keyboard devices.
- **No Arbitrary USB Access**: The application cannot access other USB devices without explicit user selection.

## Reporting a Vulnerability

If you discover a security vulnerability in AureTrix, please report it responsibly:

### How to Report

1. **Do NOT** open a public GitHub issue for security vulnerabilities
2. Create a **private security advisory** via GitHub:
   - Go to the repository's **Security** tab
   - Click **Report a vulnerability**
   - Provide detailed information about the vulnerability

### What to Include

- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if you have one)

### Response Timeline

- **Initial Response**: Within 48 hours
- **Status Update**: Within 7 days
- **Resolution**: Dependent on severity and complexity

### What to Expect

- Acknowledgment of your report
- Regular updates on our progress
- Credit in the security advisory (unless you prefer anonymity)
- No legal action for responsible disclosure

## Security Best Practices for Users

### Browser Security

- Keep your browser updated to the latest version
- Only use AureTrix from trusted sources (official repository or verified deployments)
- Review the device selection prompt carefully before granting WebHID access

### Keyboard Firmware

- Only update firmware from official sources
- Verify firmware authenticity before applying updates
- Keep backup of working configurations before major changes

### General Recommendations

- Use HTTPS when accessing AureTrix (required for WebHID anyway)
- Be cautious of unofficial forks or modified versions
- Report any suspicious behavior

## Scope

This security policy covers:

- The AureTrix web application source code
- Build and deployment configurations
- Documentation and examples

This policy does **not** cover:

- SparkLink SDK vulnerabilities (report to SparkLink)
- Keyboard firmware vulnerabilities (report to manufacturer)
- Browser WebHID implementation issues (report to browser vendor)
- Third-party dependencies (report to respective maintainers)

## Contact

For security-related questions that don't require private disclosure, you can open a GitHub issue with the `security` label.

For private security matters, use GitHub's private security advisory feature as described above.
