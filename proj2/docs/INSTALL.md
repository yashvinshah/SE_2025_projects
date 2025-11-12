# Hungry Wolf Setup Guide

This guide will help you set up the Hungry Wolf application for development and production.

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Firebase account
- Git

## Quick Start

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd hungry-wolf
   ```

2. **Install dependencies**
   ```bash
   npm run install-all
   ```

3. **Set up environment variables**
   ```bash
   # Copy environment files
   cp server/env.example server/.env
   cp client/env.example client/.env
   
   # Edit the .env files with your configuration
   ```

4. **Configure Firebase**
   - Create a new Firebase project
   - Enable Firestore Database
   - Generate a service account key
   - Update `server/.env` with Firebase credentials

5. **Start the development servers**
   ```bash
   npm run dev
   ```

6. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5001

## Environment Configuration

### Server Environment Variables

Create `server/.env` with the following variables:

```env
# Firebase Configuration
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY_ID=your-private-key-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project-id.iam.gserviceaccount.com
FIREBASE_CLIENT_ID=your-client-id
FIREBASE_AUTH_URI=https://accounts.google.com/o/oauth2/auth
FIREBASE_TOKEN_URI=https://oauth2.googleapis.com/token

# Server Configuration
PORT=5001
NODE_ENV=development

# CORS Configuration
CLIENT_URL=http://localhost:3000
```

### Client Environment Variables

Create `client/.env` with:

```env
REACT_APP_API_URL=http://localhost:5001/api
```

## Firebase Setup

1. **Create a Firebase Project**
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Click "Create a project"
   - Follow the setup wizard

2. **Enable Firestore Database**
   - In your Firebase project, go to "Firestore Database"
   - Click "Create database"
   - Choose "Start in test mode" for development

3. **Generate Service Account Key**
   - Go to Project Settings > Service Accounts
   - Click "Generate new private key"
   - Download the JSON file
   - Use the values from this file in your `server/.env`

## Database Schema

The application uses the following Firestore collections:

- `users` - User profiles and authentication data
- `orders` - Order information and status
- `points` - User points and transaction history
- `settings` - Application settings (donation counters)
- `donationHistory` - Donation tracking

## Development Scripts

- `npm run dev` - Start both frontend and backend in development mode
- `npm run server` - Start only the backend server
- `npm run client` - Start only the frontend client
- `npm run build` - Build the frontend for production
- `npm run install-all` - Install dependencies for all packages

## Project Structure

```
hungry-wolf/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── contexts/       # React contexts
│   │   ├── pages/          # Page components
│   │   ├── services/       # API services
│   │   └── ...
│   └── public/
├── server/                 # Node.js backend
│   ├── config/            # Configuration files
│   ├── middleware/        # Express middleware
│   ├── models/            # Data models
│   ├── routes/            # API routes
│   └── ...
├── docs/                  # Documentation
└── shared/                # Shared utilities
```

## Testing

To run tests:

```bash
# Backend tests
cd server
npm test

# Frontend tests
cd client
npm test
```

## Deployment

### Backend Deployment

1. Set up a cloud provider (AWS, Google Cloud, Heroku, etc.)
2. Configure environment variables
3. Deploy the server code
4. Set up a reverse proxy (nginx) if needed

### Frontend Deployment

1. Build the frontend: `npm run build`
2. Deploy the `build` folder to a static hosting service
3. Update the API URL in production environment

### Database

- Use Firebase Firestore in production
- Set up proper security rules
- Configure backup and monitoring

## Troubleshooting

### Common Issues

1. **Firebase connection errors**
   - Check your service account key
   - Verify project ID and credentials
   - Ensure Firestore is enabled

2. **CORS errors**
   - Update `CLIENT_URL` in server environment
   - Check CORS configuration in `server/index.js`

3. **Authentication issues**
   - Check token expiration settings
   - Ensure proper error handling

### Getting Help

- Check the logs in both frontend and backend consoles
- Review the API documentation in `docs/API.md`
- Check Firebase console for database issues

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
