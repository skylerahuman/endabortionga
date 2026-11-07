# Abolish Abortion Georgia

This project is dedicated to the complete abolition of abortion in the state of Georgia. Our mission is to establish equal protection for all human beings, from the moment of fertilization to natural death, without exception or compromise.

## Mission & Goals

Our core objective is **Equal Protection**:

1.  **Total Abolition:** We advocate for the complete removal of all laws allowing for the destruction of pre-born human life.
2.  **Equal Justice:** We demand that the laws of Georgia treat the intentional killing of a pre-born child with the same severity as the killing of a born person.
3.  **No Exceptions:** We stand against any exceptions based on age, method of conception, or developmental stage.
4.  **Immediacy:** We call for immediate action from our legislators to interpose on behalf of the pre-born.

## Features

### Local Church Network (Near Me)

Interactive map-based tool that helps Georgia residents:

- Find their GA House District by ZIP code.
- Connect with abolitionist churches.
- View random markers indicating network presence (simulated).
- Powered by Leaflet.js and a ZIP-to-District mapping.

### Abolition Basics & FAQs

Educational resources explaining the difference between Pro-Life regulation and Abolitionist immediatism.

### Respond

Action center for:

- Prayer requests.
- Learning about HB 441.
- Donating to the cause.

## Tech Stack

- **Framework**: SvelteKit 2
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4
- **Mapping**: Leaflet.js with OpenStreetMap tiles

## Deployment and local development

See [DEPLOYMENT.md](DEPLOYMENT.md) for the dev/prd pipeline, VM operations,
DNS/TLS setup and the GitHub production branch protections.

## Developing

Start a development server:

```sh
npm install
npm run dev
```

## Testing

We use a dual-layer testing strategy to ensure code quality and stability.

### 1. Unit & Component Testing (Vitest)

Used for testing individual components, utility functions, and business logic in isolation.

- **Run Tests:** `npm run test:unit`
- **Watch Mode (TDD):** `npm run test:unit -- --watch`

### 2. End-to-End Testing (Playwright)

Used for testing full user flows, navigation, forms, and browser interactions.

- **Run Tests:** `npm test`
- **UI Mode (TDD):** `npx playwright test --ui`

### Continuous Integration

Tests are automatically run on every Pull Request via GitHub Actions.

- **Unit Tests:** Verified via Vitest.
- **E2E Tests:** Verified via Playwright (reports uploaded as artifacts).

## Building

To create a production version:

```sh
npm run build
```

## Data Files

The application uses data files in `static/data/`:

- `zip_to_district.csv` - Mapping of GA ZIP codes to State House Districts.

## Project Structure

```
abolition_georgia/
├── src/
│   ├── lib/
│   │   └── utils.ts           # Utility functions
│   ├── routes/
│   │   ├── near-me/           # Local Church Network & District Finder
│   │   ├── respond/           # Action center
│   │   ├── abolition-basics/  # Educational content
│   │   └── ...
│   └── app.html               # HTML template
├── static/
│   └── data/                  # CSV and JSON data files
└── README.md
```
