# OTA Management Platform

Universal Over-The-Air update management platform for React Native applications.

## 🚀 Features

- **Multi-App Support**: Manage multiple React Native applications from a single platform
- **Web Dashboard**: Intuitive web interface for release management
- **SDK Integration**: Easy-to-use SDK for React Native apps
- **Rollout Control**: Gradual rollout and rollback capabilities
- **Analytics**: Detailed update statistics and device insights
- **Security**: SHA-256 hash verification and secure file storage

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    OTA Management Platform                   │
├─────────────────────────────────────────────────────────────┤
│  Web Dashboard  │  API Gateway  │  Admin Panel  │  Analytics │
├─────────────────────────────────────────────────────────────┤
│              Core OTA Service (Node.js)                     │
├─────────────────────────────────────────────────────────────┤
│  App Manager │ Release Manager │ User Manager │ File Manager │
├─────────────────────────────────────────────────────────────┤
│    Database (PostgreSQL)    │    File Storage (S3/MinIO)    │
└─────────────────────────────────────────────────────────────┘
```

## 📦 Packages

- **`packages/api`**: Backend API service
- **`packages/dashboard`**: Web management dashboard
- **`packages/sdk`**: React Native SDK
- **`packages/shared`**: Shared types and utilities

## 🛠️ Development Setup

### Prerequisites

- Node.js >= 18.0.0
- npm >= 8.0.0
- Docker and Docker Compose

### Quick Start

1. **Clone and install dependencies**:
   ```bash
   git clone <repository-url>
   cd ota-management-platform
   npm run setup
   ```

2. **Start infrastructure services**:
   ```bash
   npm run dev:infrastructure
   ```

3. **Start development servers**:
   ```bash
   npm run dev
   ```

4. **Access the services**:
   - API: http://localhost:3000
   - Dashboard: http://localhost:3001
   - MinIO Console: http://localhost:9001

### Environment Setup

1. Copy environment template:
   ```bash
   cp .env.example .env
   ```

2. Update the `.env` file with your configuration

## 🐳 Docker Services

- **PostgreSQL**: Database (port 5432)
- **Redis**: Caching (port 6379)
- **MinIO**: File storage (port 9000, console 9001)

## 📚 Documentation

- [API Documentation](./packages/api/README.md)
- [Dashboard Guide](./packages/dashboard/README.md)
- [SDK Usage](./packages/sdk/README.md)
- [Deployment Guide](./docs/deployment.md)

## 🔧 Available Scripts

- `npm run dev` - Start all development servers
- `npm run build` - Build all packages
- `npm run test` - Run all tests
- `npm run lint` - Lint all packages
- `npm run docker:up` - Start Docker services
- `npm run docker:down` - Stop Docker services

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions, please open an issue in the GitHub repository.
