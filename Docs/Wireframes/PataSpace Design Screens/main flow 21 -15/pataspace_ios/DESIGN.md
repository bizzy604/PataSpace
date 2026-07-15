---
name: PataSpace iOS
colors:
  surface: '#f9f9f9'
  surface-dim: '#dadada'
  surface-bright: '#f9f9f9'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f3f3f4'
  surface-container: '#eeeeee'
  surface-container-high: '#e8e8e8'
  surface-container-highest: '#e2e2e2'
  on-surface: '#1a1c1c'
  on-surface-variant: '#3f484c'
  inverse-surface: '#2f3131'
  inverse-on-surface: '#f0f1f1'
  outline: '#6f797d'
  outline-variant: '#bec8cd'
  surface-tint: '#00677f'
  primary: '#00667e'
  on-primary: '#ffffff'
  primary-container: '#28809a'
  on-primary-container: '#ffffff'
  inverse-primary: '#83d1ee'
  secondary: '#5f5e5e'
  on-secondary: '#ffffff'
  secondary-container: '#e4e2e1'
  on-secondary-container: '#656464'
  tertiary: '#5a5e5f'
  on-tertiary: '#ffffff'
  tertiary-container: '#737778'
  on-tertiary-container: '#ffffff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#b7eaff'
  primary-fixed-dim: '#83d1ee'
  on-primary-fixed: '#001f28'
  on-primary-fixed-variant: '#004e60'
  secondary-fixed: '#e4e2e1'
  secondary-fixed-dim: '#c8c6c5'
  on-secondary-fixed: '#1b1c1c'
  on-secondary-fixed-variant: '#474746'
  tertiary-fixed: '#e0e3e4'
  tertiary-fixed-dim: '#c3c7c8'
  on-tertiary-fixed: '#181c1d'
  on-tertiary-fixed-variant: '#434748'
  background: '#f9f9f9'
  on-background: '#1a1c1c'
  surface-variant: '#e2e2e2'
  surface-subtle: '#EDEDED'
  status-success: '#34C759'
  status-warning: '#FFCC00'
  status-error: '#FF3B30'
typography:
  display-01:
    fontFamily: Poppins
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  display-02:
    fontFamily: Poppins
    fontSize: 34px
    fontWeight: '700'
    lineHeight: 41px
    letterSpacing: -0.01em
  headline-lg:
    fontFamily: Poppins
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 34px
  headline-md:
    fontFamily: Poppins
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 30px
  headline-sm:
    fontFamily: Poppins
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 25px
  body-lg:
    fontFamily: DM Sans
    fontSize: 17px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: DM Sans
    fontSize: 15px
    fontWeight: '400'
    lineHeight: 21px
  label-md:
    fontFamily: DM Sans
    fontSize: 13px
    fontWeight: '500'
    lineHeight: 18px
  caption:
    fontFamily: DM Sans
    fontSize: 11px
    fontWeight: '400'
    lineHeight: 14px
  headline-lg-mobile:
    fontFamily: Poppins
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 30px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 8px
  margin-horizontal: 16px
  gutter-vertical: 24px
  component-gap: 16px
  touch-target: 44px
---

## Brand & Style

This design system embodies a **Modern Corporate** aesthetic tailored specifically for the Kenyan real estate marketplace. It strikes a balance between professional reliability and high-tech efficiency, leveraging a high-contrast visual language to instill trust in property seekers. 

The brand personality is authoritative yet approachable, utilizing a "Dark Shell" architecture where administrative and navigational elements are housed in a sophisticated dark surface, while active content lives on a clean, airy canvas. This creates a focused, utility-driven experience that respects the premium nature of real estate transactions.

**Key Principles:**
- **Trust Through Precision:** Adherence to the 8pt grid and Apple’s Human Interface Guidelines (HIG) ensures a native feel that reduces cognitive load.
- **Visual Distinction:** The contrast between the Eerie Black navigation and the Teal accents creates a memorable brand signature that differentiates the product from competitors.
- **Mobile-First Utility:** Designed for one-handed operation, with oversized touch targets and bottom-heavy navigation.

## Colors

The palette is anchored by **Teal (#28809A)**, used strategically for primary actions and brand emphasis. The structural framework uses **Eerie Black (#252525)** to define the "navigation shell," providing a premium backdrop for icons and high-level navigation.

- **Primary (Teal):** Reserved for the most important interactive elements: primary buttons, active tab states, and selection indicators.
- **Secondary (Eerie Black):** Used for the Tab Bar background, Side Rails, and Hero panel backgrounds.
- **Neutral (White):** The primary canvas color for property listings and content cards.
- **Surface Subtle (Anti-flash White):** Employed for input field backgrounds and secondary panel fills to distinguish them from the pure white canvas.
- **Text Secondary (Battleship Grey):** Used for metadata, labels, and inactive iconography to maintain a clear visual hierarchy.

## Typography

This design system uses **Poppins** for headings to project a bold, modern personality and **DM Sans** for body and label text to ensure maximum legibility at small sizes on mobile displays.

**Usage Guidelines:**
- **Headlines:** Use Poppins Bold for all titles. Large titles (`display-02`) should be used for main navigation landing pages.
- **Body Content:** Use DM Sans Regular for property descriptions and long-form text.
- **System Fallback:** Use native SF Pro for technical elements like the status bar (time/battery) and system-generated alerts to maintain iOS familiarity.
- **Alignment:** Headlines should typically be left-aligned in content areas but centered in Navigation Bars when using standard iOS titles.

## Layout & Spacing

The layout is governed by a strict **8pt grid system**, ensuring consistent vertical and horizontal rhythm across all device sizes.

- **Margins:** A standard 16px horizontal margin is applied to all main views.
- **Grid:** Use a fluid column system where content blocks primarily span the full width of the safe area minus margins.
- **Safe Areas:** Strictly respect the iOS Notch and Home Indicator regions. Navigation elements must be inset within the Safe Area.
- **Vertical Rhythm:** Use 24px increments between major sections (e.g., "Amenities" vs "Location Map") and 16px between individual items within a section (e.g., a list of property cards).
- **Touch Targets:** All interactive elements must maintain a minimum height/width of 44px to ensure ease of use while moving.

## Elevation & Depth

Visual hierarchy is established through **Tonal Layering** and **Subtle Shadows**, creating a clean stacked effect that guides the user's eye.

- **Base Layer:** The main canvas is pure White (#FFFFFF).
- **Layer 1 (Cards):** Property listings and info cards use a White background with a soft, diffused shadow (0px offset, 8px blur, 4% black opacity) to appear slightly lifted.
- **Layer 2 (Navigation Shell):** The Tab Bar and certain hero panels use Eerie Black (#252525) to provide a solid, structural foundation that feels visually "deeper" than the content.
- **Layer 3 (Overlays):** Modal bottom sheets and sticky action bars (like a "Book Now" footer) use a higher elevation shadow or a subtle backdrop blur (`UIVisualEffectView`) to indicate they are the topmost interactive layer.

## Shapes

The shape language is modern and approachable, utilizing generous radii to soften the high-contrast color palette.

- **Main Container Radius:** Content cards and primary buttons use a **16px radius**.
- **Input Radius:** Text fields and search bars use a **12px radius** for a tighter, more functional look.
- **Media Radius:** Property photos and thumbnails use a **12px radius** to match input fields.
- **Pills:** All secondary tags, filter chips, and segmented controls must use **Full-Pill** (circular) ends to signify their interactive and "contained" nature.
- **Icon Buttons:** Secondary actions (like "Close" or "Share") should be enclosed in circular containers.

## Components

### Buttons
- **Primary:** Teal background with White Poppins Bold text. 16px corner radius or full-pill depending on context.
- **Secondary:** Outlined with a 2pt Teal border or Battleship Grey for neutral actions.
- **Floating Action Button (FAB):** Teal circular button with White SF Symbol icon, used for high-frequency actions like "Add Listing."

### Cards
- **Property Cards:** White background, 16px radius, soft shadow. Content should be padded by 16px internally. Use DM Sans for metadata icons/text within the card.

### Navigation Shell
- **Tab Bar:** Eerie Black background. Active icons in Teal, inactive in Battleship Grey.
- **Top Navigation:** Transparent or White with Eerie Black titles. On scroll, transition to a blurred surface.

### Inputs
- **Text Fields:** Filled with Anti-flash White (#EDEDED), 12px radius. Labels should be DM Sans Bold 13pt (Caption) placed above the field. Active state uses a 2pt Teal border.

### Chips & Badges
- **Status Badges:** Small pills with low-opacity background of their status color (e.g., Success Green at 10% opacity) with high-contrast text.
- **Filter Chips:** Full-pill. Inactive state: Anti-flash White background. Active state: Teal background with White text.

### Selection Controls
- **Checkboxes/Radios:** Use standard iOS-style circular selections but tinted in Teal when active.