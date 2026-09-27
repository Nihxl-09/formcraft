# Formcraft

A modern visual form builder for creating, previewing, publishing, and managing forms without writing form code.

Formcraft focuses on a clean editing experience where form structure, field settings, respondent experience, and submitted responses are handled in one application.

## Features

* Visual form builder
* Drag-and-drop field ordering
* Multiple field types

  * Short text
  * Email
  * Number
  * Dropdown
  * Checkboxes
  * Multiple choice
  * Rating
  * Date
* Required field validation
* Custom field descriptions
* Editable dropdown, checkbox, and multiple-choice options
* Duplicate and delete fields
* Live form preview
* Respondent-facing published form
* Form submission handling
* Response dashboard
* Individual response viewer
* Response deletion
* Local data persistence
* Responsive interface

## Tech Stack

* React
* TypeScript
* Vite
* CSS
* Browser Local Storage

## Architecture

Formcraft currently uses a local-first architecture.

```text
Form Builder
     │
     ▼
Form Configuration
     │
     ├── Local Storage
     │
     ▼
Published Form
     │
     ▼
Form Submission
     │
     ▼
Response Storage
     │
     ▼
Responses Dashboard
```

This makes the application easy to run locally without requiring a backend or database.

## Getting Started

### Requirements

* Node.js
* npm

### Installation

Clone the repository:

```bash
git clone https://github.com/YOUR_USERNAME/formcraft.git
```

Move into the project:

```bash
cd formcraft
```

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Open the local URL provided by Vite.

## Project Structure

```text
formcraft/
├── src/
│   ├── App.tsx
│   ├── App.css
│   ├── index.css
│   └── main.tsx
├── public/
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

## Data Storage

Formcraft currently stores form configuration and submitted responses using browser Local Storage.

This allows forms and responses to remain available after refreshing the application while keeping the project simple and easy to run.

## Future Improvements

Possible future versions could include:

* Backend database storage
* Authentication
* Shareable public form URLs
* Analytics and response charts
* CSV export
* Form templates
* Team collaboration
* Advanced validation rules

## License

This project is currently available for portfolio and educational purposes.
