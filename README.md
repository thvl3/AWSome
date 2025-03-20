# AWSome Tank Shooter

A real-time multiplayer 2D tank shooter game built with Pixi.js, React, Node.js, and AWS.

## Project Structure

```
.
├── frontend/           # React + Pixi.js frontend
├── backend/           # Node.js + Express + Socket.IO backend
├── infrastructure/    # AWS CDK infrastructure code
└── shared/           # Shared TypeScript types and constants
```

## Technology Stack

- **Frontend**: React + Pixi.js + TypeScript
- **Backend**: Node.js + Express + Socket.IO + TypeScript
- **Infrastructure**: AWS CDK
- **AWS Services**: 
  - ECS Fargate (Backend hosting)
  - API Gateway (WebSocket + REST API)
  - DynamoDB (Score persistence)
  - S3 + CloudFront (Frontend hosting)

## Prerequisites

- Node.js >= 18
- AWS CLI configured with appropriate credentials
- AWS CDK CLI (`npm install -g aws-cdk`)
- TypeScript (`npm install -g typescript`)

## Development Setup

1. Install dependencies:
   ```bash
   # Install root dependencies
   npm install
   
   # Install frontend dependencies
   cd frontend && npm install
   
   # Install backend dependencies
   cd backend && npm install
   
   # Install infrastructure dependencies
   cd infrastructure && npm install
   ```

2. Deploy AWS infrastructure:
   ```bash
   cd infrastructure
   cdk deploy
   ```

3. Start development servers:
   ```bash
   # Start backend (in backend directory)
   npm run dev
   
   # Start frontend (in frontend directory)
   npm run dev
   ```

## Game Features

- Real-time multiplayer tank combat
- WASD movement controls
- Mouse-aimed turret
- Health system (3 hits to destroy)
- Score tracking
- Global leaderboard
- Static obstacles (walls)

## License

MIT