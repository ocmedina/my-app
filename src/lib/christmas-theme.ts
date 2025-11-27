// src/lib/christmas-theme.ts
// Configuración centralizada del tema navideño

export const christmasTheme = {
  colors: {
    // Colores principales navideños
    primary: {
      red: '#DC2626',      // Rojo navideño
      green: '#059669',    // Verde navideño
      gold: '#F59E0B',     // Dorado
      darkRed: '#991B1B',  // Rojo oscuro
      darkGreen: '#047857', // Verde oscuro
      lightGold: '#FCD34D', // Dorado claro
    },
    // Gradientes festivos
    gradients: {
      redGreen: 'from-red-600 via-green-600 to-red-700',
      greenRed: 'from-green-600 via-red-600 to-green-700',
      goldShine: 'from-yellow-300 via-yellow-500 to-yellow-600',
      festive: 'from-red-50 via-green-50 to-yellow-50',
      darkFestive: 'from-red-900 via-green-900 to-red-950',
    },
    // Bordes y acentos
    borders: {
      red: 'border-red-400',
      green: 'border-green-400',
      gold: 'border-yellow-400',
    },
    // Fondos
    backgrounds: {
      redLight: 'bg-red-50',
      greenLight: 'bg-green-50',
      goldLight: 'bg-yellow-50',
      redDark: 'bg-red-900',
      greenDark: 'bg-green-900',
    }
  },
  // Emojis navideños
  emojis: {
    tree: '🎄',
    santa: '🎅',
    gift: '🎁',
    snowflake: '❄️',
    star: '⭐',
    bell: '🔔',
    candy: '🍬',
    lights: '💡',
  }
};

// Mapeo de colores originales a navideños
export const colorMapping = {
  // Navbar sections
  'blue': 'red',      // Comercial: azul → rojo
  'green': 'green',   // Logística: verde → verde (más intenso)
  'orange': 'gold',   // Administración: naranja → dorado
  'purple': 'red',    // Púrpura → rojo
  'teal': 'green',    // Teal → verde
};
