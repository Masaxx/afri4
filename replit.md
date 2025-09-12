# LoadLink Africa

## Overview

LoadLink Africa is a freight matching platform connecting trucking companies and shipping entities across Africa. The application features AI-powered job matching, real-time chat functionality, secure payment processing via Stripe, and comprehensive analytics dashboards. Built as a full-stack web application with subscription-based access for trucking companies while keeping the platform free for shipping entities.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript and Vite for fast development and hot reloading
- **Styling**: Tailwind CSS with shadcn/ui component library for consistent design system
- **State Management**: TanStack Query for server state management and caching
- **Routing**: Wouter for lightweight client-side routing
- **Forms**: React Hook Form with Zod for validation
- **Real-time**: Socket.io client for WebSocket connections

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **Authentication**: JWT-based authentication with bcrypt for password hashing
- **File Uploads**: Multer for handling document and image uploads
- **Real-time**: Socket.io server for WebSocket communication
- **Email**: Nodemailer for transactional emails (verification, notifications)

### Data Storage Solutions
- **Database**: PostgreSQL with Drizzle ORM for type-safe database operations
- **Connection**: Neon serverless PostgreSQL with connection pooling
- **Migrations**: Drizzle Kit for schema management and migrations
- **Schema**: Comprehensive schema with users, jobs, chats, notifications, ratings, and disputes tables

### Authentication and Authorization
- **Authentication**: JWT tokens stored in localStorage with middleware validation
- **Authorization**: Role-based access control (trucking companies, shipping entities, admins)
- **Security**: Optional 2FA support, audit logging, and session management
- **Subscription**: Integration with payment processing for trucking company subscriptions

### External Dependencies
- **Payment Processing**: Stripe for subscription billing and payment handling
- **Database**: Neon PostgreSQL serverless database
- **Email Service**: SMTP-based email delivery (configurable provider)
- **File Storage**: Local file system storage for uploaded documents
- **Real-time Communication**: WebSocket connections for instant messaging and notifications
- **UI Components**: Radix UI primitives with shadcn/ui styling system