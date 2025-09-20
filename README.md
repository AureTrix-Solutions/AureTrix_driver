# Keyboard Driver

A modern, web-based driver for hall effect keyboards compatible with the SparkLink SDK, built with Vue.js, TypeScript, and the `@sparklinkplayjoy/sdk-keyboard` package. This driver provides a professional interface for key remapping, macro editing, profile management, and per-key analog axis control, designed for intuitive navigation and a polished user experience.

Hosted at: [https://github.com/BlastHappy82/Keyboard_driver](https://github.com/BlastHappy82/Keyboard_driver)

## Features

- **Key Remapping**: Customize key assignments across multiple layers (Fn1–Fn4) with support for advanced keys (DKS, MPT, SOCD, etc.).
- **Macro Editing**: Create and assign macros using a key picker UI or text-based input to avoid OS interference (e.g., Windows key issues).
- **Profile Management**: Easily rename, import, and export up to four configuration profiles.
- **Per-Key Analog Axis**: Emulate controller inputs with analog axis support for precise control (inspired by Wooting).
- **Professional UI**: Intuitive sidebar navigation and a responsive design built with Vue.js and Tailwind CSS.
- **WebHID Integration**: Securely communicates with keyboards via the WebHID API, ensuring browser compatibility.
- **Lighting Control**: Configure per-key RGB lighting and logo lighting with custom and dynamic modes.
- **Advanced Key Support**: Full support for hall effect features like DKS, MPT, and SOCD, as per the SparkLink SDK.

## Prerequisites

- Node.js (v18 or higher)
- pnpm (v9 or higher)
- A compatible hall effect keyboard with SparkLink SDK support
- A modern browser with WebHID support (e.g., Chrome, Edge)

## Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/BlastHappy82/Keyboard_driver.git
   cd Keyboard_driver
   ```

2. **Install dependencies**:
   ```bash
   pnpm install
   ```

3. **Run the development server**:
   ```bash
   pnpm dev
   ```

4. **Build for production**:
   ```bash
   pnpm build
   ```

## Usage

1. **Connect Your Keyboard**:
   - Open the app in a WebHID-compatible browser.
   - Navigate to the "Connect" page via the sidebar.
   - Click "Connect Keyboard" to request device access and initialize your keyboard using the SparkLink SDK.

2. **Configure Settings**:
   - Use the sidebar to access pages for:
     - **Key Mapping**: Remap keys across layers (Fn1–Fn4) and configure advanced key modes (e.g., DKS, MPT).
     - **Macro Editor**: Create macros with a key picker UI or text-based input to avoid OS shortcuts.
     - **Profile Management**: Rename, save, import, or export profiles.
     - **Lighting**: Adjust per-key RGB and logo lighting settings.
     - **Analog Axis**: Configure per-key analog axis for controller emulation.
   - Save changes to apply configurations to the keyboard.

3. **Advanced Features**:
   - **Macros**: Assign custom macros (M0–M22) to any key, supporting single-run, toggle, or hold modes.
   - **Analog Axis**: Enable analog axis support for keys to emulate controller inputs, with configurable travel distances.
   - **Profile Switching**: Switch between profiles (1–4) using `ServiceKeyboard.switchConfig()` or the UI.

## Project Structure

```
Keyboard_driver/
├── src/
│   ├── components/    # Reusable UI components (e.g., KeyPicker, SidebarNav)
│   ├── pages/        # Page components (Connect, KeyMapping, Macros, Profiles, Lighting)
│   ├── services/     # SDK integration (KeyboardService.ts)
│   ├── styles/       # SCSS and Tailwind CSS for professional styling
│   ├── assets/       # Images, fonts, and other static assets
│   ├── types/        # TypeScript interfaces (e.g., IDefKeyInfo, LightMode, IMacroMode)
│   ├── utils/        # Utility functions (e.g., keycode parsing, profile export)
│   └── App.vue       # Main app component with sidebar navigation
├── public/           # Static assets (e.g., favicon)
├── tests/            # Unit and integration tests
├── .gitignore        # Git ignore file
├── package.json      # Dependencies and scripts
├── vite.config.ts    # Vite configuration
├── tsconfig.json     # TypeScript configuration
└── README.md         # This file
```

## Contributing

We welcome contributions to enhance the Keyboard Driver! To contribute:

1. Fork the repository.
2. Create a feature branch (`git checkout -b feature/your-feature`).
3. Commit your changes (`git commit -m "Add your feature"`).
4. Push to the branch (`git push origin feature/your-feature`).
5. Open a pull request with a clear description of your changes.

Please ensure your code follows the project’s coding standards and includes tests where applicable.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Built with the `@sparklinkplayjoy/sdk-keyboard` package for robust keyboard communication.
- Powered by Vue.js, TypeScript, and Tailwind CSS for a modern, responsive UI.
- Inspired by professional keyboard driver interfaces and WebHID technology.

## Contact

For issues, feature requests, or questions, please open an issue on the [GitHub repository](https://github.com/BlastHappy82/Keyboard_driver/issues).