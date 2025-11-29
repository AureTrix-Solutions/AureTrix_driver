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
- **RGB Lighting Control**: Per-key RGB customization with click-and-drag multi-key selection and Shift-key additive selection
- **Sensor Calibration**: Calibrate hall effect sensors for optimal performance and accuracy
- **Layout Creator**: Visual keyboard layout builder with dynamic row support (up to 10 rows), precise mm-level sizing, multi-select editing, and export/import capabilities
- **Layout Preview**: Visualize keyboard physical layout with accurate geometry
- **Debug Interface**: Real-time inspection of raw SDK data for development and troubleshooting

### Built-in Capabilities
- **Batch Processing**: Smart batching prevents hardware overload when updating multiple keys (80 keys per batch)
- **Auto-Reconnect**: Seamless reconnection to previously paired devices
- **Auto-Save**: All configuration changes automatically persist to keyboard firmware
- **Layout Support**: Supports 61, 67, 68, 80, 82, 84, 87-key physical layouts with 4-tier fallback system
- **Profile Management UI**: Built-in interface for managing multiple keyboard profiles
- **Profile Import/Export**: Save and restore keyboard configurations (SDK supports encrypted JSON)
- **Custom Layout Storage**: IndexedDB storage for user-created keyboard layouts with JSON export/import

### Planned Features (Placeholder Pages)
- **Advanced Settings**: DKS, MPT, MT, TGL, END, SOCD configuration pages

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
   - **Lighting**: Configure per-key RGB colors with click-and-drag selection for multiple keys
   - **Calibration**: Run sensor calibration for optimal hall effect accuracy
   - **Layout Creator**: Build custom keyboard layouts with visual editor, supporting any row configuration
   - **Layout Preview**: Visualize your keyboard's physical layout geometry
   
   _Note: Profiles and Advanced settings pages (DKS, MPT, MT, TGL, END, SOCD, Macro) are planned features._

### Important Notes

- **WebHID Requirement**: This app requires a Chromium-based browser (Chrome, Edge, Brave). Firefox and Safari do not support WebHID.
- **HTTPS Only**: WebHID only works over HTTPS (localhost is exempt for development)
- **Auto-Save**: All configuration changes are automatically saved to the keyboard - no manual save/reload needed

### Development Tools

- **Debug Page**: Available in development builds only for inspecting raw SDK data and keyboard responses. Not included in production builds.

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
├── main.ts              # Application entry point
├── App.vue              # Root component with sidebar navigation
├── pages/               # Route-level components
│   ├── Connect.vue          # Device pairing and connection
│   ├── KeyMapping.vue       # Multi-layer key remapping
│   ├── MacroRecording.vue   # Visual macro creation
│   ├── RapidTrigger.vue     # RT parameter configuration
│   ├── Performance.vue      # Travel distance tuning
│   ├── Lighting.vue         # Per-key RGB control
│   ├── Calibration.vue      # Sensor calibration
│   ├── LayoutCreator.vue    # Custom layout builder
│   ├── LayoutPreview.vue    # Layout visualization
│   ├── Debug.vue            # SDK inspector (dev only)
│   ├── DKS.vue              # Dynamic Keystroke (placeholder)
│   ├── MPT.vue              # Magnetic Point Trigger (placeholder)
│   ├── MT.vue               # Mod-Tap (placeholder)
│   ├── TGL.vue              # Toggle (placeholder)
│   ├── END.vue              # End key behavior (placeholder)
│   ├── SOCD.vue             # SOCD handling (placeholder)
│   └── Macro.vue            # Macro management (placeholder)
├── components/          # Reusable UI components
│   ├── FactoryResetModal.vue
│   └── performance/
│       ├── GlobalTravel.vue
│       ├── KeyTravel.vue
│       ├── SingleKeyTravel.vue
│       └── SwitchProfiles.vue
├── services/            # Hardware abstraction layer
│   ├── KeyboardService.ts       # Main SDK wrapper
│   ├── DebugKeyboardService.ts  # Dev-only SDK access
│   ├── ExportService.ts         # Profile backup/restore
│   └── LayoutStorageService.ts  # IndexedDB layout storage
├── store/               # Pinia state management
│   ├── connection.ts        # Device connection state
│   ├── profileStore.ts      # Keyboard profile state
│   └── travelProfilesStore.ts
├── composables/         # Reusable composition functions
│   └── useBatchProcessing.ts
├── utils/               # Shared utilities
│   ├── layoutConfigs.ts     # Physical layout definitions
│   ├── sharedLayout.ts      # Community layout contributions
│   ├── MappedKeyboard.ts    # Keyboard rendering helper
│   ├── keyMap.ts            # Key code mappings
│   ├── keyCategories.ts     # Key grouping definitions
│   └── keyUnits.ts          # Unit conversion utilities
├── types/               # TypeScript type definitions
│   └── types.ts
├── router/              # Vue Router configuration
│   └── index.ts
├── styles/              # Global SCSS styles
│   └── variables.scss
└── assets/              # Static assets (SVG icons, images)
```

## Key Technical Decisions

- **WebHID over Native Drivers**: Cross-platform compatibility without installation
- **Batch Processing**: Prevents hardware overload with 80-key batches and delays
- **4-Tier Layout Priority**: IndexedDB (custom) → sharedLayout.ts (community) → layoutMap (standard) → Dynamic fallback
- **SDK Initialization**: Uses `waitForSDKReady()` with exponential backoff for reliable connection
- **1u = 19.05mm Standard**: Industry-standard key unit measurement with centralized mm-to-px conversion

## Documentation

Comprehensive documentation is available in the `docs/` directory:

- **SDK_REFERENCE.md**: Complete API reference for the SparkLink SDK
- **PAGES_OVERVIEW.md**: Overview of all pages with quick reference
- **docs/pages/**: Detailed documentation for each functional page

## Contributing

Contributions are welcome! Please read our [Contributing Guide](CONTRIBUTING.md) for details on:

- Development setup and prerequisites
- Code standards and conventions
- How to submit keyboard layouts
- Pull request process

Quick start:
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/your-feature`)
3. Make your changes following our [code standards](CONTRIBUTING.md#code-standards)
4. Submit a pull request

Please also review our [Code of Conduct](CODE_OF_CONDUCT.md) before participating.

## Security

For information about the security model and how to report vulnerabilities, see our [Security Policy](SECURITY.md).

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
