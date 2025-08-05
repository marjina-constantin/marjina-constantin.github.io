# Modern Expenses Tracker

A modern, full-featured expenses tracking application built with Next.js 14+, TypeScript, and shadcn/ui components.

## Features

- 🔐 **Authentication** - Secure login system
- 💰 **Expense Management** - Add, edit, delete transactions
- 📊 **Income Tracking** - Manage income entries
- 📈 **Analytics & Charts** - Visual insights with Recharts
- 🎨 **Modern UI** - Beautiful interface with shadcn/ui components
- 📱 **Responsive Design** - Works on all devices
- 🔍 **Advanced Filtering** - Filter by category and search descriptions
- 💾 **Local Storage** - Settings persistence
- ⚡ **Fast Performance** - Optimized with Next.js App Router

## Tech Stack

- **Framework**: Next.js 14+ with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **Forms**: React Hook Form with Zod validation
- **Charts**: Recharts
- **Icons**: Lucide React
- **State Management**: React Context
- **Date Handling**: date-fns
- **Notifications**: Sonner

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd expenses-next
```

2. Install dependencies:
```bash
npm install
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

### Building for Production

```bash
npm run build
```

### Deployment

The app is configured for GitHub Pages deployment:

```bash
npm run deploy
```

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── expenses/          # Main app routes
│   │   ├── login/         # Authentication
│   │   ├── charts/        # Analytics & charts
│   │   ├── add-transaction/ # Add new transactions
│   │   ├── income/        # Income management
│   │   └── user/          # User profile & settings
│   └── layout.tsx         # Root layout
├── components/            # Reusable components
│   ├── ui/               # shadcn/ui components
│   ├── navbar.tsx        # Navigation component
│   ├── filters.tsx       # Filtering component
│   ├── transaction-list.tsx # Transaction display
│   ├── transaction-form.tsx # Transaction form
│   └── income-form.tsx   # Income form
├── context/              # React Context providers
│   ├── auth-context.tsx  # Authentication state
│   └── data-context.tsx  # Data management
├── lib/                  # Utilities and configurations
│   ├── api.ts           # API functions
│   ├── constants.ts     # App constants
│   └── utils.ts         # Utility functions
└── types/               # TypeScript type definitions
    └── index.ts         # Main type definitions
```

## Key Components

### Authentication
- Secure login system with JWT tokens
- Protected routes
- User session management

### Data Management
- Centralized state management with React Context
- API integration for CRUD operations
- Real-time data updates

### UI/UX Features
- Modern, accessible design
- Responsive layout
- Loading states and error handling
- Toast notifications
- Form validation with Zod

### Analytics
- Category breakdown charts
- Monthly expense trends
- Income vs expenses comparison
- Interactive charts with Recharts

## API Integration

The app integrates with a Drupal-based API for:
- User authentication
- Transaction CRUD operations
- Income management
- Data retrieval and filtering

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions, please open an issue in the repository.
