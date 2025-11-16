# AureTrix Keyboard Driver

A modern, web-based configuration tool for hall effect keyboards compatible with the SparkLink SDK. Built with Vue.js 3, TypeScript, and Vite, AureTrix provides a professional interface for customizing keyboard behavior including key remapping, macro creation, lighting control, and advanced hall effect features.

The application runs entirely in the browser and communicates with compatible keyboards via the WebHID API, eliminating the need for native drivers or installations.

**GitHub Repository:** [https://github.com/BlastHappy82/AureTrix_driver](https://github.com/BlastHappy82/AureTrix_driver.git)

## Features

### Fully Functional Features
- **Multi-Layer Key Remapping**: Customize key assignments across 4 independent layers (Fn0-Fn3) with drag-and-drop interface
- **Visual Macro Recording**: Create macros with up to 64 actions without OS interference using a key picker UI
- **Rapid Trigger Settings**: Configure 5 parameters including initial trigger travel, re-trigger distance, reset distance, and top/bottom deadzones
- **Performance Tuning**: Adjust travel distances globally or per-key (0.1mm - 4.0mm range) with visual feedback
- **Sensor Calibration**: Calibrate hall effect sensors for optimal performance and accuracy
- **Layout Preview**: Visualize keyboard physical layout with accurate geometry
- **Debug Interface**: Real-time inspection of raw SDK data for development and troubleshooting

### Built-in Capabilities
- **Batch Processing**: Smart batching prevents hardware overload when updating multiple keys (80 keys per batch)
- **Auto-Reconnect**: Seamless reconnection to previously paired devices
- **Auto-Save**: All configuration changes automatically persist to keyboard firmware
- **Layout Support**: Supports 61, 67, 68, 80, 82, 84, 87-key physical layouts
- **Profile Import/Export**: Save and restore keyboard configurations (SDK supports encrypted JSON)

### Planned Features (Placeholder Pages)
- **RGB Lighting Control**: Per-key RGB and logo lighting configuration
- **Profile Management UI**: Built-in interface for managing multiple keyboard profiles
- **Advanced Configuration**: DKS (Dynamic Keystroke), MPT (Magnetic Point Triggering), SOCD settings

## Prerequisites

- **Node.js** v18 or higher
- **pnpm** v9 or higher (recommended) or npm
- A compatible hall effect keyboard with SparkLink SDK support
- A **Chromium-based browser** with WebHID support (Chrome, Edge, Brave, etc.)
- **HTTPS connection** (required for WebHID; localhost is exempt)

## Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/BlastHappy82/AureTrix_driver.git
   cd AureTrix_driver
   ```

2. **Install dependencies**:
   ```bash
   pnpm install
   ```

3. **Run the development server**:
   ```bash
   pnpm dev
   ```
   The app will be available at `http://localhost:5000`

4. **Build for production**:
   ```bash
   pnpm build
   ```

## Usage

### Getting Started

1. **Connect Your Keyboard**:
   - Open AureTrix in a WebHID-compatible browser
   - Navigate to the **Connect** page
   - Click "Pair Keyboard" to request device access
   - Select your SparkLink-compatible keyboard from the browser prompt
   - Connection status will display device info (BoardID, firmware version)

2. **Configure Your Keyboard**:
   Use the sidebar to access different configuration pages:

   - **Key Mapping**: Remap keys across 4 layers (Fn0-Fn3) with drag-and-drop or keyboard picker
   - **Macro Recording**: Create custom macros with the visual key picker to avoid triggering OS shortcuts
   - **Rapid Trigger**: Fine-tune rapid trigger settings with 5 configurable parameters (initial trigger, re-trigger, reset, top/bottom deadzones)
   - **Performance**: Adjust travel distances globally or per-key (0.1mm - 4.0mm range)
   - **Calibration**: Run sensor calibration for optimal hall effect accuracy
   - **Debug**: Inspect raw keyboard data and SDK responses in real-time
   - **Layout Preview**: Visualize your keyboard's physical layout geometry
   
   _Note: Lighting, Profiles, and Advanced Config pages are planned features (placeholders)._

### Important Notes

- **WebHID Requirement**: This app requires a Chromium-based browser (Chrome, Edge, Brave). Firefox and Safari do not support WebHID.
- **HTTPS Only**: WebHID only works over HTTPS (localhost is exempt for development)
- **Replit Preview**: When running on Replit, open the app in a new tab (not the preview iframe) for WebHID to work properly
- **Auto-Save**: All configuration changes are automatically saved to the keyboard - no manual save/reload needed

## Technical Stack

- **Framework**: Vue.js 3 with Composition API
- **Language**: TypeScript with strict mode
- **Build Tool**: Vite 7.x with HMR
- **State Management**: Pinia with localStorage persistence
- **Styling**: SCSS with custom design system
- **Routing**: Vue Router with lazy-loaded routes
- **SDK**: @sparklinkplayjoy/sdk-keyboard v1.0.14
- **Package Manager**: pnpm

## Project Structure

```
src/
├── pages/           # Route-level components (8 functional + 3 placeholder)
│   ├── Connect.vue
│   ├── KeyMapping.vue
│   ├── MacroRecording.vue
│   ├── RapidTrigger.vue
│   ├── Performance.vue
│   ├── Calibration.vue
│   ├── Debug.vue
│   ├── LayoutPreview.vue
│   └── Lighting.vue (placeholder)
├── services/        # Hardware abstraction layer
│   ├── KeyboardService.ts
│   └── DebugKeyboardService.ts
├── store/           # Pinia state management
│   ├── connection.ts
│   └── travelProfilesStore.ts
├── composables/     # Reusable composition functions
│   └── useBatchProcessing.ts
├── utils/           # Shared utilities
│   ├── layoutConfigs.ts
│   └── MappedKeyboard.ts
├── router/          # Vue Router configuration
└── styles/          # Global SCSS styles
    └── variables.scss
```

## Documentation

Comprehensive documentation is available in the `docs/` directory:

- **SDK_REFERENCE.md**: Complete API reference for the SparkLink SDK
- **PAGES_OVERVIEW.md**: Overview of all pages with quick reference
- **docs/pages/**: Detailed documentation for each functional page

## Contributing

Contributions are welcome! To contribute:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/your-feature`)
3. Commit your changes (`git commit -m "Add your feature"`)
4. Push to the branch (`git push origin feature/your-feature`)
5. Open a pull request with a clear description

Please ensure your code follows the project's TypeScript standards and includes appropriate error handling.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Built with **@sparklinkplayjoy/sdk-keyboard** for robust keyboard communication
- Powered by **Vue.js 3**, **TypeScript**, and **Vite**
- Inspired by professional keyboard configuration tools and WebHID technology
- Special thanks to the hall effect keyboard community

## Contact

For issues, feature requests, or questions, please open an issue on the [GitHub repository](https://github.com/BlastHappy82/AureTrix_driver/issues).

---

**Note**: This is a community-developed tool and is not officially affiliated with SparkLink or any keyboard manufacturer.
