# Hungry Wolf Extension Guide

This guide is designed for future teams who will extend the Hungry Wolf application for Project 3 and beyond.

## Architecture Overview

Hungry Wolf follows a modular, full-stack architecture designed for easy extension:

```
Frontend (React) ←→ Backend (Node.js) ←→ Database (Firebase)
```

### Key Design Principles

1. **Modularity**: Each feature is self-contained with clear interfaces
2. **Scalability**: Architecture supports horizontal scaling
3. **Maintainability**: Clear separation of concerns and documentation
4. **Extensibility**: Easy to add new features without breaking existing ones

## Project Structure

```
hungry-wolf/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   │   ├── customer/   # Customer-specific components
│   │   │   ├── restaurant/ # Restaurant-specific components
│   │   │   └── delivery/   # Delivery-specific components
│   │   ├── contexts/       # React Context for state management
│   │   ├── pages/          # Page-level components
│   │   ├── services/       # API communication layer
│   │   └── styles/         # CSS modules and global styles
├── server/                 # Node.js backend
│   ├── config/            # Configuration files
│   ├── middleware/        # Express middleware
│   ├── models/            # Data models (Firebase/Firestore)
│   ├── routes/            # API route handlers
│   └── utils/             # Utility functions
├── docs/                  # Documentation
└── shared/                # Shared types and utilities
```

## Extension Points

### 1. Adding New User Roles

To add a new user role (e.g., "admin"):

1. **Backend Changes:**
   ```javascript
   // server/models/User.js
   // Add role validation in constructor
   
   // server/middleware/auth.js
   // Add role to allowedRoles array
   
   // server/routes/auth.js
   // Update role validation in registration
   ```

2. **Frontend Changes:**
   ```typescript
   // client/src/contexts/AuthContext.tsx
   // Update User interface to include new role
   
   // client/src/components/ProtectedRoute.tsx
   // Add new role to allowedRoles
   
   // Create new dashboard component
   // client/src/pages/AdminDashboard.tsx
   ```

3. **Database:**
   - No schema changes needed (Firestore is schema-less)
   - Update validation rules if needed

### 2. Adding New Features

#### Example: Adding Payment Integration

1. **Create Payment Service:**
   ```javascript
   // server/services/paymentService.js
   class PaymentService {
     async processPayment(orderData) {
       // Integration with Stripe/PayPal/etc
     }
   }
   ```

2. **Add Payment Routes:**
   ```javascript
   // server/routes/payments.js
   router.post('/process', paymentController.processPayment);
   ```

3. **Create Payment Components:**
   ```typescript
   // client/src/components/payment/PaymentForm.tsx
   // client/src/components/payment/PaymentSuccess.tsx
   ```

4. **Update Order Flow:**
   - Modify order creation to include payment
   - Add payment status to order model
   - Update UI to show payment options

### 3. Adding New API Endpoints

1. **Create Route File:**
   ```javascript
   // server/routes/newFeature.js
   const express = require('express');
   const router = express.Router();
   
   router.get('/endpoint', async (req, res) => {
     // Implementation
   });
   
   module.exports = router;
   ```

2. **Register Route:**
   ```javascript
   // server/index.js
   app.use('/api/newFeature', require('./routes/newFeature'));
   ```

3. **Add Frontend Service:**
   ```typescript
   // client/src/services/newFeatureService.ts
   export const newFeatureService = {
     getData: () => api.get('/newFeature/endpoint'),
     // Other methods
   };
   ```

### 4. Adding New Database Collections

1. **Create Model:**
   ```javascript
   // server/models/NewModel.js
   class NewModel {
     static async create(data) {
       const docRef = db.collection('newCollection').doc();
       await docRef.set(data);
       return { id: docRef.id, ...data };
     }
   }
   ```

2. **Add Validation:**
   ```javascript
   // server/middleware/validation.js
   const validateNewModel = [
     body('field').notEmpty(),
     // Other validations
   ];
   ```

## Code Patterns

### 1. Component Structure

```typescript
// Standard component pattern
interface ComponentProps {
  // Props interface
}

const Component: React.FC<ComponentProps> = ({ prop1, prop2 }) => {
  // Hooks
  const [state, setState] = useState();
  
  // Effects
  useEffect(() => {
    // Side effects
  }, []);
  
  // Event handlers
  const handleEvent = () => {
    // Handler logic
  };
  
  // Render
  return (
    <div className="component">
      {/* JSX */}
    </div>
  );
};

export default Component;
```

### 2. API Service Pattern

```typescript
// Standard API service pattern
export const serviceName = {
  // GET requests
  getItems: (): Promise<Item[]> => 
    api.get('/items').then(res => res.data),
  
  getItem: (id: string): Promise<Item> => 
    api.get(`/items/${id}`).then(res => res.data),
  
  // POST requests
  createItem: (data: CreateItemData): Promise<Item> => 
    api.post('/items', data).then(res => res.data),
  
  // PUT requests
  updateItem: (id: string, data: UpdateItemData): Promise<Item> => 
    api.put(`/items/${id}`, data).then(res => res.data),
  
  // DELETE requests
  deleteItem: (id: string): Promise<void> => 
    api.delete(`/items/${id}`).then(res => res.data),
};
```

### 3. Database Model Pattern

```javascript
// Standard model pattern
class ModelName {
  constructor(data) {
    this.id = data.id;
    this.field1 = data.field1;
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
  }

  static async create(data) {
    const docRef = db.collection('collectionName').doc();
    const model = new ModelName({
      id: docRef.id,
      ...data,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    await docRef.set(model);
    return model;
  }

  static async findById(id) {
    const doc = await db.collection('collectionName').doc(id).get();
    if (!doc.exists) return null;
    return new ModelName({ id: doc.id, ...doc.data() });
  }

  async update(data) {
    const docRef = db.collection('collectionName').doc(this.id);
    await docRef.update({
      ...data,
      updatedAt: new Date()
    });
    
    Object.assign(this, data);
    return this;
  }
}
```

## Testing Guidelines

### 1. Unit Tests

```javascript
// server/tests/models/User.test.js
describe('User Model', () => {
  test('should create user with valid data', async () => {
    const userData = {
      email: 'test@example.com',
      role: 'customer',
      profile: { name: 'Test User' }
    };
    
    const user = await User.create(userData);
    expect(user.email).toBe(userData.email);
  });
});
```

### 2. Integration Tests

```javascript
// server/tests/routes/auth.test.js
describe('Auth Routes', () => {
  test('POST /auth/register should create new user', async () => {
    const userData = {
      email: 'test@example.com',
      password: 'password123',
      role: 'customer',
      profile: { name: 'Test User' }
    };
    
    const response = await request(app)
      .post('/api/auth/register')
      .send(userData)
      .expect(201);
    
    expect(response.body.token).toBeDefined();
  });
});
```

### 3. Frontend Tests

```typescript
// client/src/components/__tests__/Component.test.tsx
import { render, screen } from '@testing-library/react';
import Component from '../Component';

describe('Component', () => {
  test('renders correctly', () => {
    render(<Component prop1="value" />);
    expect(screen.getByText('Expected Text')).toBeInTheDocument();
  });
});
```

## Performance Considerations

### 1. Database Optimization

- Use Firestore indexes for complex queries
- Implement pagination for large datasets
- Cache frequently accessed data
- Use batch operations for multiple writes

### 2. Frontend Optimization

- Implement React.memo for expensive components
- Use React.lazy for code splitting
- Optimize bundle size with webpack
- Implement proper error boundaries

### 3. API Optimization

- Implement rate limiting
- Use compression middleware
- Cache API responses where appropriate
- Implement proper error handling

## Security Guidelines

### 1. Authentication & Authorization

- Implement role-based access control
- Use HTTPS in production
- Implement proper session management

### 2. Input Validation

- Validate all user inputs
- Sanitize data before database operations
- Use express-validator for API validation
- Implement CSRF protection

### 3. Database Security

- Use Firestore security rules
- Validate data on the client and server
- Implement proper error handling
- Log security events

## Deployment Considerations

### 1. Environment Configuration

- Use environment variables for configuration
- Separate development, staging, and production configs
- Never commit secrets to version control
- Use proper secret management

### 2. Database Migration

- Plan database schema changes carefully
- Use migration scripts for data transformation
- Test migrations in staging environment
- Implement rollback procedures

### 3. Monitoring & Logging

- Implement comprehensive logging
- Set up error tracking (Sentry, etc.)
- Monitor API performance
- Set up alerts for critical issues

## Common Extension Scenarios

### 1. Adding Real-time Features

```javascript
// Use Firebase Realtime Database or WebSockets
const realtimeRef = firebase.database().ref('orders');
realtimeRef.on('child_added', (snapshot) => {
  // Handle new order
});
```

### 2. Adding File Upload

```javascript
// Use multer for file uploads
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });

router.post('/upload', upload.single('file'), (req, res) => {
  // Handle file upload
});
```

### 3. Adding Email Notifications

```javascript
// Use nodemailer or SendGrid
const nodemailer = require('nodemailer');

const sendEmail = async (to, subject, text) => {
  // Send email logic
};
```

## Getting Help

- Check existing documentation in `/docs`
- Review existing code patterns
- Test changes thoroughly
- Ask questions in team channels
- Create issues for bugs or feature requests

## Contributing

1. Follow the established code patterns
2. Write tests for new features
3. Update documentation
4. Follow the git workflow
5. Get code reviews before merging

Remember: The goal is to build upon the existing foundation while maintaining code quality and consistency.
