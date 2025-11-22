// LayoutStorageService.ts - IndexedDB service for storing custom keyboard layouts

export interface CustomLayoutConfig {
  productName: string;
  hasAxisList: boolean;
  keySizes: number[][];
  gapsAfterCol: Record<number, number>[];
  rowSpacing: number[];
  createdAt: number;
  updatedAt: number;
}

class LayoutStorageService {
  private dbName = 'AureTrixLayouts';
  private storeName = 'customLayouts';
  private version = 1;
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => {
        reject(new Error('Failed to open IndexedDB'));
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          const objectStore = db.createObjectStore(this.storeName, { keyPath: 'productName' });
          objectStore.createIndex('productName', 'productName', { unique: true });
        }
      };
    });
  }

  async saveLayout(layout: CustomLayoutConfig): Promise<void> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite');
      const objectStore = transaction.objectStore(this.storeName);
      
      const layoutWithTimestamp = {
        ...layout,
        updatedAt: Date.now(),
        createdAt: layout.createdAt || Date.now()
      };

      const request = objectStore.put(layoutWithTimestamp);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error('Failed to save layout'));
    });
  }

  async getLayout(productName: string): Promise<CustomLayoutConfig | null> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readonly');
      const objectStore = transaction.objectStore(this.storeName);
      const request = objectStore.get(productName);

      request.onsuccess = () => {
        resolve(request.result || null);
      };
      request.onerror = () => reject(new Error('Failed to get layout'));
    });
  }

  async getAllLayouts(): Promise<CustomLayoutConfig[]> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readonly');
      const objectStore = transaction.objectStore(this.storeName);
      const request = objectStore.getAll();

      request.onsuccess = () => {
        resolve(request.result || []);
      };
      request.onerror = () => reject(new Error('Failed to get all layouts'));
    });
  }

  async deleteLayout(productName: string): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite');
      const objectStore = transaction.objectStore(this.storeName);
      const request = objectStore.delete(productName);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error('Failed to delete layout'));
    });
  }

  exportLayout(layout: CustomLayoutConfig): void {
    const dataStr = JSON.stringify(layout, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${layout.productName.replace(/\s+/g, '_')}_layout.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  async importLayout(file: File): Promise<CustomLayoutConfig> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const layout = JSON.parse(e.target?.result as string) as CustomLayoutConfig;
          await this.saveLayout(layout);
          resolve(layout);
        } catch (error) {
          reject(new Error('Failed to parse layout file'));
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  }

  private arrayToCompactSyntax(arr: number[]): string {
    if (arr.length === 0) return '[]';

    const segments: string[] = [];
    let i = 0;

    while (i < arr.length) {
      const current = arr[i];
      let count = 1;
      
      // Count consecutive identical values
      while (i + count < arr.length && arr[i + count] === current) {
        count++;
      }

      if (count >= 3) {
        segments.push(`Array(${count}).fill(${current})`);
        i += count;
      } else {
        for (let j = 0; j < count; j++) {
          segments.push(String(current));
        }
        i += count;
      }
    }

    if (segments.length === 1 && segments[0].startsWith('Array(')) {
      return segments[0];
    } else if (segments.every(s => !s.startsWith('Array('))) {
      return `[${segments.join(', ')}]`;
    } else {
      const first = segments[0].startsWith('Array(') ? segments[0] : `[${segments[0]}]`;
      if (segments.length === 1) return first;
      
      const rest = segments.slice(1).map(s => 
        s.startsWith('Array(') ? s : s
      );
      return `${first}.concat(${rest.join(', ')})`;
    }
  }

  private formatGapObject(gaps: Record<number, number>): string {
    if (Object.keys(gaps).length === 0) return '{}';
    const entries = Object.entries(gaps).map(([key, value]) => `${key}: ${value}`);
    return `{ ${entries.join(', ')} }`;
  }

  generateGitHubIssueLink(layout: CustomLayoutConfig): string {
    const keyCount = layout.keySizes.reduce((sum, row) => sum + row.length, 0);
    
    // Generate compact keySizes
    const keySizesCompact: string[] = layout.keySizes.map(row => {
      return this.arrayToCompactSyntax(row);
    });

    // Generate compact gapsAfterCol
    const allEmpty = layout.gapsAfterCol.every(g => Object.keys(g).length === 0);
    let gapsAfterColCompact: string;
    
    if (allEmpty) {
      gapsAfterColCompact = `Array(${layout.gapsAfterCol.length}).fill({})`;
    } else {
      const gapsStrings = layout.gapsAfterCol.map(g => this.formatGapObject(g));
      gapsAfterColCompact = `[${gapsStrings.join(', ')}]`;
    }

    // Generate compact rowSpacing
    const rowSpacingCompact = this.arrayToCompactSyntax(layout.rowSpacing);

    // Build compact code wrapped in productName
    const configCode = `"${layout.productName}": {
  keySizes: [
${keySizesCompact.map(row => `    ${row},`).join('\n')}
  ],
  gapsAfterCol: ${gapsAfterColCompact},
  rowSpacing: ${rowSpacingCompact},
  hasAxisList: ${layout.hasAxisList}
}`;

    const issueTitle = `New Keyboard Layout: ${layout.productName}`;
    const issueBody = `## Keyboard Information
- **Product Name**: ${layout.productName}
- **Key Count**: ${keyCount}
- **Axis List Support**: ${layout.hasAxisList ? 'Yes' : 'No'}

## Layout Configuration
Add this to \`communityLayout.ts\`:

\`\`\`typescript
${configCode}
\`\`\`

## Additional Information
- Created: ${new Date(layout.createdAt).toLocaleDateString()}
- Updated: ${new Date(layout.updatedAt).toLocaleDateString()}`;

    const repoUrl = 'https://github.com/BlastHappy82/AureTrix_driver/issues/new';
    const encodedTitle = encodeURIComponent(issueTitle);
    const encodedBody = encodeURIComponent(issueBody);
    
    return `${repoUrl}?title=${encodedTitle}&body=${encodedBody}&labels=layout`;
  }
}

export default new LayoutStorageService();
