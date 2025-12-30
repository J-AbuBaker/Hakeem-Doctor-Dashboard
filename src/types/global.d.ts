// Global type declarations to suppress TypeScript errors for optional dependencies

// Suppress type definition errors for babel packages (used internally by build tools)
declare module 'babel_core';
declare module 'babel_generator';
declare module 'babel_template';
declare module 'babel_traverse';
declare module 'json-schema';

// Extend Window interface for Google Maps API
declare global {
  interface Window {
    google?: {
      maps: typeof google.maps;
    };
  }
}