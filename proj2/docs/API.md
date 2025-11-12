# Hungry Wolf API Documentation

This document describes the REST API endpoints for the Hungry Wolf application.

## Base URL

- Development: `http://localhost:5001/api`
- Production: `https://your-domain.com/api`

## Endpoints

### Authentication

#### POST /auth/register
Register a new user.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "role": "customer|restaurant|delivery",
  "profile": {
    "name": "John Doe",
    "phone": "+1234567890",
    "address": {
      "street": "123 Main St",
      "city": "City",
      "state": "State",
      "zipCode": "12345"
    }
  }
}
```

**Response:**
```json
{
  "message": "User registered successfully",
  "user": { ... }
}
```

#### POST /auth/login
Login with email and password.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "message": "Login successful",
  "user": { ... }
}
```

#### GET /auth/profile
Get current user profile.

**Headers:** Authorization required

**Response:**
```json
{
  "user": { ... }
}
```

#### PUT /auth/profile
Update user profile.

**Headers:** Authorization required

**Request Body:**
```json
{
  "profile": {
    "name": "Updated Name",
    "phone": "+1234567890"
  }
}
```

### Orders

#### POST /orders
Create a new order (Customer only).

**Headers:** Authorization required

**Request Body:**
```json
{
  "restaurantId": "restaurant-id",
  "items": [
    {
      "menuItemId": "item-id",
      "quantity": 2,
      "price": 12.99
    }
  ],
  "totalAmount": 25.98,
  "deliveryAddress": {
    "street": "123 Main St",
    "city": "City",
    "state": "State",
    "zipCode": "12345"
  },
  "specialInstructions": "Extra spicy"
}
```

#### GET /orders/customer
Get customer orders.

**Headers:** Authorization required

**Response:**
```json
{
  "orders": [
    {
      "id": "order-id",
      "status": "pending",
      "totalAmount": 25.98,
      "createdAt": "2024-01-01T00:00:00Z",
      "items": [...]
    }
  ]
}
```

#### GET /orders/restaurant
Get restaurant orders.

**Headers:** Authorization required

#### GET /orders/delivery
Get delivery partner orders.

**Headers:** Authorization required

#### GET /orders/:id
Get specific order by ID.

**Headers:** Authorization required

#### PUT /orders/:id/status
Update order status.

**Headers:** Authorization required

**Request Body:**
```json
{
  "status": "accepted|rejected|preparing|ready|picked_up|delivered"
}
```

#### POST /orders/:id/rate
Add rating to order.

**Headers:** Authorization required

**Request Body:**
```json
{
  "ratings": {
    "restaurant": 5,
    "delivery": 4
  }
}
```

### Points

#### GET /points
Get user points.

**Headers:** Authorization required

**Response:**
```json
{
  "points": {
    "totalPoints": 150,
    "availablePoints": 100,
    "usedPoints": 50,
    "transactions": [...]
  }
}
```

#### GET /points/transactions
Get points transaction history.

**Headers:** Authorization required

**Query Parameters:**
- `limit` (optional): Number of transactions to return (default: 10)

#### POST /points/use
Use points for discount.

**Headers:** Authorization required

**Request Body:**
```json
{
  "points": 50,
  "description": "Discount for order"
}
```

#### POST /points/calculate-discount
Calculate discount amount for points.

**Headers:** Authorization required

**Request Body:**
```json
{
  "points": 50
}
```

**Response:**
```json
{
  "discountAmount": 0.50,
  "maxDiscount": 1.00
}
```

### Customer

#### GET /customer/restaurants
Get available restaurants.

**Headers:** Authorization required

**Response:**
```json
{
  "restaurants": [
    {
      "id": "restaurant-id",
      "name": "Pizza Palace",
      "cuisine": "Italian",
      "rating": 4.5,
      "deliveryTime": "25-35 min",
      "isLocalLegend": false,
      "menu": [...]
    }
  ]
}
```

### Restaurant

#### GET /restaurant/profile
Get restaurant profile.

**Headers:** Authorization required

#### PUT /restaurant/profile
Update restaurant profile.

**Headers:** Authorization required

#### PUT /restaurant/menu
Update restaurant menu.

**Headers:** Authorization required

**Request Body:**
```json
{
  "menu": [
    {
      "id": "item-id",
      "name": "Margherita Pizza",
      "price": 12.99,
      "description": "Classic tomato and mozzarella"
    }
  ]
}
```

### Delivery

#### GET /delivery/profile
Get delivery partner profile.

**Headers:** Authorization required

#### PUT /delivery/profile
Update delivery partner profile.

**Headers:** Authorization required

### Donations

#### GET /donations/stats
Get donation statistics.

**Response:**
```json
{
  "totalOrders": 150,
  "mealsDonated": 15,
  "nextDonationIn": 5
}
```

#### POST /donations/update
Update donation counter.

**Request Body:**
```json
{
  "mealsToAdd": 1
}
```

#### GET /donations/history
Get donation history.

**Response:**
```json
{
  "history": [
    {
      "id": "donation-id",
      "amount": 1,
      "description": "Meal donation",
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ]
}
```

## Error Responses

All endpoints may return the following error responses:

### 400 Bad Request
```json
{
  "error": "Validation failed",
  "errors": [
    {
      "field": "email",
      "message": "Invalid email format"
    }
  ]
}
```

### 401 Unauthorized
```json
{
  "error": "Access denied. No token provided."
}
```

### 403 Forbidden
```json
{
  "error": "Access denied. Insufficient permissions."
}
```

### 404 Not Found
```json
{
  "error": "Order not found"
}
```

### 500 Internal Server Error
```json
{
  "error": "Something went wrong!",
  "message": "Detailed error message in development"
}
```

## Rate Limiting

API endpoints are rate-limited to prevent abuse. Current limits:

- Authentication endpoints: 5 requests per minute per IP
- Other endpoints: 100 requests per minute per user

## Pagination

List endpoints support pagination:

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)

**Response Headers:**
- `X-Total-Count`: Total number of items
- `X-Page`: Current page number
- `X-Per-Page`: Items per page

## Webhooks

The API supports webhooks for real-time updates:

- Order status changes
- New order notifications
- Payment confirmations

Configure webhooks in your account settings.

## SDKs

Official SDKs are available for:

- JavaScript/Node.js
- Python
- PHP
- Java

See the [SDK documentation](./SDK.md) for more information.

## Support

For API support:

- Email: api-support@hungrywolf.com
- Documentation: https://docs.hungrywolf.com
- Status Page: https://status.hungrywolf.com
