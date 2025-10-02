/**
 * Vitest setup file
 * Runs before all tests to configure the testing environment
 */

// Mock phaser3spectorjs module that Phaser tries to load
vi.mock('phaser3spectorjs', () => ({ default: null }));

// Mock HTMLCanvasElement's getContext() for Phaser
HTMLCanvasElement.prototype.getContext = function (contextId: string) {
  if (contextId === '2d' || contextId === 'webgl' || contextId === 'webgl2') {
    return {
      fillStyle: '',
      fillRect: () => {},
      clearRect: () => {},
      getImageData: () => ({ data: [] }),
      putImageData: () => {},
      createImageData: () => ({ data: [] }),
      setTransform: () => {},
      drawImage: () => {},
      save: () => {},
      restore: () => {},
      beginPath: () => {},
      moveTo: () => {},
      lineTo: () => {},
      closePath: () => {},
      stroke: () => {},
      fill: () => {},
      translate: () => {},
      rotate: () => {},
      scale: () => {},
      arc: () => {},
      rect: () => {},
      measureText: () => ({ width: 0 }),
      canvas: this,
    } as unknown as CanvasRenderingContext2D;
  }
  return null;
};

// Mock window.matchMedia for jsdom
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {}, // deprecated
    removeListener: () => {}, // deprecated
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => true,
  }),
});

// Mock localStorage for jsdom with actual storage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});
