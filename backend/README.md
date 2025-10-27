# Oddly Brilliant Backend

A production-ready Node.js + Express + TypeScript + PostgreSQL backend API for the Oddly Brilliant platform.

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Language**: TypeScript (strict mode)
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Authentication**: JWT with bcrypt
- **Blockchain**: Ethers.js v6
- **Validation**: express-validator
- **Code Quality**: ESLint + Prettier

## Features

- RESTful API design with proper HTTP methods and status codes
- JWT-based authentication and authorization
- Input validation and error handling
- Structured logging
- Database migrations with Prisma
- Type-safe database queries
- CORS configuration
- Graceful shutdown handling

## Prerequisites

- Node.js (v18 or higher)
- PostgreSQL (v14 or higher)
- npm or yarn

## Project Structure

```
backend/
├── src/
│   ├── config/          # Configuration files (database, env)
│   ├── controllers/     # Request handlers
│   ├── middleware/      # Custom middleware (auth, error, validation)
│   ├── routes/          # API route definitions
│   ├── services/        # Business logic layer
│   ├── types/           # TypeScript types and interfaces
│   ├── utils/           # Helper functions
│   └── server.ts        # Application entry point
├── prisma/
│   └── schema.prisma    # Database schema
├── .env                 # Environment variables
└── package.json
```

## Installation

1. **Clone the repository** (if not already done)

2. **Install dependencies**:
   ```bash
   cd backend
   npm install
   ```

3. **Set up environment variables**:
   ```bash
   cp .env.example .env
   ```

   Edit `.env` and configure:
   - `DATABASE_URL`: Your PostgreSQL connection string
   - `JWT_SECRET`: A secure random string for JWT signing
   - Other variables as needed

4. **Set up the database**:

   First, create the PostgreSQL database:
   ```bash
   createdb oddly_brilliant
   # Or use psql:
   # psql -U postgres -c "CREATE DATABASE oddly_brilliant;"
   ```

5. **Generate Prisma Client**:
   ```bash
   npm run prisma:generate
   ```

6. **Run database migrations**:
   ```bash
   npm run prisma:migrate
   ```

## Development

Start the development server with hot reload:

```bash
npm run dev
```

The server will start on `http://localhost:3001`

## Available Scripts

- `npm run dev` - Start development server with nodemon
- `npm run build` - Build TypeScript to JavaScript
- `npm start` - Start production server
- `npm run prisma:generate` - Generate Prisma Client
- `npm run prisma:migrate` - Run database migrations
- `npm test` - Run tests (Jest)
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier

## API Endpoints

### Health Check
- `GET /health` - Check server and database status

### Authentication
- `POST /api/auth/signup` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user (requires auth)
- `PUT /api/auth/wallet` - Update wallet address (requires auth)

### Challenges
- `GET /api/challenges` - Get all challenges (supports pagination)
- `GET /api/challenges/:id` - Get challenge by ID
- `POST /api/challenges` - Create challenge (requires auth)
- `PATCH /api/challenges/:id` - Update challenge (requires auth, sponsor only)
- `DELETE /api/challenges/:id` - Delete challenge (requires auth, sponsor only)

### Contributions
- `GET /api/contributions` - Get all contributions (supports pagination)
- `GET /api/contributions/:id` - Get contribution by ID
- `POST /api/contributions` - Create contribution (requires auth)
- `DELETE /api/contributions/:id` - Delete contribution (requires auth, creator only)

## Authentication

The API uses JWT (JSON Web Tokens) for authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## Database Schema

### User
- id (UUID)
- email (unique)
- passwordHash
- walletAddress (optional, unique)
- profile (JSON)
- timestamps

### Challenge
- id (UUID)
- title
- description
- bountyAmount (decimal)
- status (OPEN, IN_PROGRESS, COMPLETED)
- sponsorId (FK to User)
- timestamps

### Contribution
- id (UUID)
- challengeId (FK)
- userId (FK)
- content (text)
- type (CODE, DESIGN, IDEA)
- tokenValue (decimal)
- blockchainTxHash (optional)
- timestamps

### Payment
- id (UUID)
- challengeId (FK)
- userId (FK)
- amount (decimal)
- method (CRYPTO, FIAT)
- status (PENDING, COMPLETED, FAILED)
- blockchainTxHash (optional)
- timestamps

## Testing the API

### Using curl

**Signup**:
```bash
curl -X POST http://localhost:3001/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'
```

**Login**:
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'
```

**Get Challenges**:
```bash
curl http://localhost:3001/api/challenges
```

**Create Challenge** (requires auth):
```bash
curl -X POST http://localhost:3001/api/challenges \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your-token>" \
  -d '{
    "title": "Build a feature",
    "description": "We need help building this feature",
    "bountyAmount": 1000
  }'
```

## Error Handling

All errors follow a consistent format:

```json
{
  "success": false,
  "error": {
    "message": "Error description",
    "code": "ERROR_CODE",
    "details": {}
  }
}
```

## Security Considerations

1. **Always change `JWT_SECRET` in production** to a strong, random string
2. **Use HTTPS** in production
3. **Set strong database passwords**
4. **Rate limit** API endpoints in production
5. **Validate all user inputs** (already implemented)
6. **Keep dependencies updated** regularly

## Database Migrations

Create a new migration:
```bash
npx prisma migrate dev --name migration_name
```

Apply migrations in production:
```bash
npx prisma migrate deploy
```

View database in Prisma Studio:
```bash
npx prisma studio
```

## Production Deployment

1. Set `NODE_ENV=production` in environment
2. Build the application: `npm run build`
3. Run migrations: `npm run prisma:migrate`
4. Start server: `npm start`
5. Use a process manager like PM2 for production

## Troubleshooting

**Database connection issues**:
- Verify PostgreSQL is running
- Check DATABASE_URL format
- Ensure database exists

**TypeScript errors**:
- Run `npm run build` to see all errors
- Check tsconfig.json settings

**Prisma Client errors**:
- Regenerate client: `npm run prisma:generate`
- Check schema.prisma for syntax errors

## License

ISC

## Support

For issues and questions, please create an issue in the repository.
