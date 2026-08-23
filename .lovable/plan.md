# Plan: Add WhatsApp CTA to Home Page

Add a dedicated WhatsApp community section to the bottom of the landing page to drive user engagement and retention.

## User Review Required

> [!IMPORTANT]
> The new section will be placed just above the footer. It will feature a prominent WhatsApp-themed design (green accents) to distinguish it from the betting content while remaining consistent with the overall site aesthetic.

## Proposed Changes

### Home Page (`src/routes/index.tsx`)
- Insert a new `<section>` between the `main` content and the `footer`.
- Design a high-conversion CTA card featuring:
    - WhatsApp branding (green icon and colors).
    - Persuasive copy inviting users to the official community.
    - A direct button link to: `https://chat.whatsapp.com/GjkXVgHQlfILoRHfucEHcC?s=cl&p=a&mlu=0`.
- Ensure full mobile responsiveness with stacked layouts for smaller viewports.

## Technical Details
- Use Tailwind CSS for the green branding (`bg-green-600`, `shadow-green-600/20`, etc.).
- Use a custom SVG for the WhatsApp icon or `MessageCircle` from `lucide-react`.
- Set `target="_blank"` and `rel="noopener noreferrer"` for the external link.
