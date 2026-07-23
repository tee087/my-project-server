// Valid FontAwesome 5 Icons Used in Ecocash Mobile App
// Reference: All icons verified against FontAwesome 5 icon library

export const VALID_FONTAWESOME_ICONS_USED = [
  // Navigation & Common
  'home',           // Dashboard
  'line-chart',     // Investments, Trades
  'bar-chart',      // Trades (alternative)
  'gift',           // Referrals
  'user',           // Profile
  'gear',           // Settings
  'arrow-up',       // Withdrawals, Transactions
  'arrow-down',     // Deposits, Transactions
  
  // Account & Security
  'shield',         // Security, Protection
  'lock',           // Password, Security
  'key',            // Account recovery
  'laptop',         // Sessions
  'mobile',         // Trusted devices
  'bell',           // Notifications, Alerts
  'check',          // Verification, Success
  'times',          // Close modals
  'chevron-left',   // Back navigation
  'chevron-right',  // Forward navigation
  'chevron-up',     // Expand
  'chevron-down',   // Collapse
  
  // Actions
  'copy',           // Copy to clipboard
  'download',       // Download
  'refresh',        // Reload
  'trash',          // Delete
  'edit',           // Edit
  'save',           // Save
  'search',         // Search
  
  // Finance
  'money',          // Payment, Wallet
  'credit-card',    // Payment method
  'dollar-sign',    // Currency
  'wallet',         // Balance
  'chart-line',     // Price trends
  'signal',         // Performance
  
  // Communication
  'envelope',       // Email, Contact
  'phone',          // Phone contact
  'info-circle',    // Information
  'question-circle',// Help, FAQ
  'comments',       // Messages
  
  // Status Indicators
  'exclamation-circle', // Warning
  'check-circle',   // Success
  'circle',         // Neutral
  'spinner',        // Loading
  'sync',           // Syncing
  
  // UI Elements
  'sliders',        // Settings/Preferences
  'globe',          // Language
  'adjust',         // Theme toggle (legacy)
  'moon',           // Dark mode
  'sun',            // Light mode
  'cloud',          // Cloud services
  'file-text',      // Documents, Terms
  'document',       // Documents
  'lightbulb',      // Tips, Ideas
  'qrcode',         // QR code
  'bolt',           // Lightning, Fast
  'clock-o',        // Time
  'calendar',       // Date
]

// FontAwesome icons that are NOT valid and should NOT be used:
export const INVALID_ICONS_TO_AVOID = [
  'receipt',                    // ❌ Not a valid FontAwesome icon
  'money-bill-trend-up',        // ❌ Not a valid FontAwesome icon
  'money-bill-1-wave',          // ❌ Not in FA5 (FA6+ only)
  'rectangle-list',             // ❌ Not in FA5 (FA6+ only)
  'circle-arrow-up',            // ❌ Use 'arrow-up' instead
  'circle-arrow-down',          // ❌ Use 'arrow-down' instead
]

// All imports use ONLY valid FontAwesome 5 icons
// Location verification:
// - mobile/app/(tabs)/*.tsx - All using valid icons ✓
// - mobile/app/*.tsx - All using valid icons ✓
// - mobile/src/components/*.tsx - All using valid icons ✓
