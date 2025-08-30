# Green Hydrogen Platform

## Overview

A blockchain-based certification and credit tracking system for green hydrogen production. The platform enables users to issue digital certificates for hydrogen production, manage carbon credits, and explore the underlying blockchain transactions through an interactive 3D visualization. Built with Flask for the backend and Three.js for immersive 3D experiences, the system simulates a proof-of-work blockchain to demonstrate transparency and traceability in green energy certification.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Backend Architecture
- **Framework**: Flask web application with modular route handling
- **Database**: SQLAlchemy ORM with SQLite for development (designed for easy PostgreSQL migration)
- **Authentication**: Flask-Login with session-based user management and Werkzeug password hashing
- **Blockchain Simulation**: Custom Python implementation with SHA-256 hashing and basic proof-of-work mining
- **Application Structure**: Separated concerns with dedicated modules for models, routes, blockchain logic, and app configuration

### Frontend Architecture
- **Template Engine**: Jinja2 templates with Bootstrap 5 for responsive UI components
- **Styling**: CSS custom properties for light/dark theme switching with CSS transitions
- **3D Visualization**: Three.js WebGL rendering for blockchain explorer, dashboard statistics, and interactive elements
- **Theme Management**: Client-side JavaScript theme controller with localStorage persistence
- **Responsive Design**: Mobile-first approach with Bootstrap grid system and custom media queries

### Database Schema
- **Users**: Authentication data with relationships to certificates and credits
- **Certificates**: Hydrogen production certificates with metadata storage as JSON
- **Credits**: Transaction-based credit system supporting add, transfer, and redemption operations
- **Blocks**: Blockchain data model storing transaction history with proof-of-work validation

### Authentication & Security
- **Session Management**: Flask-Login with secure session handling and CSRF protection
- **Password Security**: Werkzeug-based password hashing with salt
- **Environment Configuration**: Environment variable-based secrets management
- **Proxy Support**: ProxyFix middleware for deployment behind reverse proxies

## External Dependencies

### Core Framework Dependencies
- **Flask**: Web framework with SQLAlchemy integration for database operations
- **Flask-Login**: User session management and authentication decorators
- **SQLAlchemy**: Database ORM with declarative base for model definitions
- **Werkzeug**: Password hashing utilities and development server functionality

### Frontend Libraries
- **Bootstrap 5**: CSS framework for responsive components and utilities
- **Font Awesome**: Icon library for consistent UI iconography
- **Three.js**: WebGL-based 3D graphics library for blockchain visualization and dashboard animations

### Development Tools
- **SQLite**: Development database (production-ready for PostgreSQL migration)
- **Logging**: Python logging module configured for debug-level output
- **Environment Variables**: Configuration management for secrets and database URLs

### Browser APIs
- **LocalStorage**: Client-side theme preference persistence
- **WebGL**: Hardware-accelerated 3D rendering through Three.js
- **Fetch API**: Asynchronous data loading for blockchain statistics and real-time updates