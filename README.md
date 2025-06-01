
![image](https://github.com/user-attachments/assets/f5cab88b-9c14-42c4-b40a-86bca8aa1831)
![image](https://github.com/user-attachments/assets/0bab8666-beb3-427e-ad07-481fb3c42c7e)
![image](https://github.com/user-attachments/assets/2ef6aa1f-711e-487c-87c5-905b6a3bd2b6)



ShillDAO is a full-stack platform where users earn rewards for completing promotional tasks for DAOs. It enables decentralized communities to create campaigns and leverage crowdsourced promotion through video, chat, and social engagement tasks.


🚀 Features
<table>
<tr>
<td>
🧑‍💼 Admin Panel
Create and manage campaigns with multiple tasks
</td>
<td>
🎯 Task System
Users complete video/chat/social tasks to earn rewards
</td>
</tr>
<tr>
<td>
👨‍⚖️ Moderation Tools
Review and grade user submissions
</td>
<td>
🧾 Campaign Tracking
Track participation, completions, and earnings
</td>
</tr>
<tr>
<td>
💰 Web3-Friendly
Wallet integrations for DAO-aligned incentives
</td>
<td>
🔒 Security First
Rate limiting & custom logic to prevent abuse
</td>
</tr>
</table>

🛠 Tech Stack
<details>
<summary><b>🔧 Backend Technologies</b></summary>

Framework: Python + Django REST Framework
Database: PostgreSQL
Cache & Queue: Redis + Celery for background jobs
Authentication: JWT for secure authentication
API: RESTful endpoints with comprehensive documentation

</details>
<details>
<summary><b>🎨 Frontend Technologies</b></summary>

Framework: Next.js + TypeScript
Data Fetching: TanStack Query for efficient data management
Styling: Tailwind CSS for responsive design
HTTP Client: Axios with js-cookie for API/session handling
State Management: React hooks + TanStack Query

</details>
<details>
<summary><b>🚀 DevOps & Infrastructure</b></summary>

Reverse Proxy: Nginx configuration
CDN: Cloudflare integration
Containerization: Docker + Docker Compose
Environment: Multi-stage deployment (dev/prod)
Security: Rate limiting, CORS, environment variables

</details>

📦 Quick Start
Prerequisites

Docker & Docker Compose
Node.js 18+ (for local development)
Python 3.11+ (for local development)

🐳 Docker Setup (Recommended)
bash# Clone the repository
git clone git@github.com:jamwujustyle/shilldao.git
cd shilldao

# Start development environment
docker-compose -f docker-compose.dev.yml up --build

# Or start production environment
docker-compose -f docker-compose.prod.yml up --build
🔧 Local Development Setup
<details>
<summary><b>Full Setup</b></summary>
cp .env.example .env  # Configure your environment variables
run start-dev.sh script to start all containers 
</details>


📂 Project Structure
shilldao/
├── 📁 client/                    # Next.js frontend application
│   ├── components/               # Reusable React components
│   ├── pages/                   # Next.js pages and API routes
│   ├── styles/                  # Tailwind CSS styles
│   └── utils/                   # Utility functions and helpers
├── 📁 server/                   # Django backend application
│   ├── apps/                    # Django applications
│   ├── config/                  # Django settings and configuration
│   ├── static/                  # Static files
│   └── media/                   # User uploaded files
├── 📁 nginx/                    # Nginx configuration files
├── 📁 scripts/                  # Deployment and utility scripts
├── 🐳 docker-compose.yml        # Main Docker Compose configuration
├── 🐳 docker-compose.dev.yml    # Development environment
├── 🐳 docker-compose.prod.yml   # Production environment
└── 📋 DEPLOYMENT_FIX_SUMMARY.md # Deployment documentation
  this is in my readme but github shows it messy. can we make it proper?

Edit

🌍 Environment Variables
<details>
<summary><b>Backend (.env)</b></summary>
env# Database


# Redis
REDIS_URL=redis://localhost:6379

# Security
SECRET_KEY=your-django-secret-key


# Web3 (if applicable)
NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=your-project-id
</details>

🚀 Deployment
The project includes multiple deployment configurations:

Development: docker-compose.dev.yml - Hot reloading, debug mode
Production: docker-compose.prod.yml - Optimized builds, security headers
Standard: docker-compose.yml - Base extended

For detailed deployment instructions, see DEPLOYMENT_FIX_SUMMARY.md.

📝 API Documentation
Once the backend is running, visit:

Swagger UI: http://localhost:8000/api/docs
ReDoc: http://localhost:8000/redoc/


🧪 Testing
bash# Backend tests
cd server
python manage.py test



🤝 Contributing

Fork the repository
Create your feature branch (git checkout -b feature/AmazingFeature)
Commit your changes (git commit -m 'Add some AmazingFeature')
Push to the branch (git push origin feature/AmazingFeature)
Open a Pull Request


👨‍💻 Author
<div align="center">
Jam | jamwujustyle
23 y/o Full-stack Developer
Tech Stack: Django • DRF • Next.js • Redis • PostgreSQL • Web3
📍 Location: Tashkent, Uzbekistan
💼 Status: Available for full-time opportunities
📧 Email: jamwujustyle@gmail.com
⭐ If you found this project helpful, please give it a star!
Made with ❤️ by jamwujustyle
</div>
