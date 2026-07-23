# JWT Authentication Frontend

A modern React + TypeScript frontend for JWT authentication with a beautiful UI built using Tailwind CSS.

## Features

- 🔐 User authentication (Login/Register)
- 🎨 Modern UI with Tailwind CSS
- 🔒 Protected routes
- 📱 Responsive design
- 🚀 Built with Vite for fast development
- 💾 Token management with localStorage
- 🔄 Axios interceptors for automatic token handling

## Tech Stack

- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool
- **React Router** - Routing
- **Axios** - HTTP client
- **Tailwind CSS** - Styling

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Backend server running on `http://localhost:4000`

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:5173`

### Build for Production

```bash
npm run build
```

The production-ready files will be in the `dist` directory.

## Project Structure

```
frontend/
├── src/
│   ├── api/
│   │   └── axios.ts          # Axios configuration with interceptors
│   ├── components/
│   │   └── ProtectedRoute.tsx # Route protection component
│   ├── context/
│   │   └── AuthContext.tsx    # Authentication context
│   ├── pages/
│   │   ├── Login.tsx          # Login page
│   │   ├── Register.tsx       # Registration page
│   │   └── Dashboard.tsx      # Protected dashboard
│   ├── types/
│   │   └── user.ts            # TypeScript interfaces
│   ├── App.tsx                # Main app component
│   ├── main.tsx               # Entry point
│   └── index.css              # Global styles with Tailwind
├── public/
├── index.html
├── package.json
├── tailwind.config.js
├── postcss.config.js
├── tsconfig.json
└── vite.config.ts
```

## Features Overview

### Authentication Flow

1. **Register**: Create a new account with username, email, password, and first name
2. **Login**: Authenticate with username and password
3. **Dashboard**: View protected content and list of all users
4. **Logout**: Clear authentication and redirect to login

### API Integration

The frontend communicates with the backend API at `http://localhost:4000`:

- `POST /users` - Register new user
- `POST /auth/login` - Login user
- `GET /users` - Get all users (protected)

### Token Management

- JWT tokens are stored in localStorage
- Axios interceptors automatically add tokens to requests
- 401 responses trigger automatic logout and redirect

## Environment Variables

To change the API URL, modify the `API_URL` constant in `src/api/axios.ts`:

```typescript
const API_URL = 'http://localhost:4000';
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Styling

The application uses Tailwind CSS for styling with a modern, gradient-based design:

- Login page: Blue to purple gradient
- Register page: Purple to pink gradient
- Dashboard: Clean white cards on gray background

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## License

MIT
