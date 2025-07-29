# Cmax Online Store

A comprehensive full-stack e-commerce platform built with modern web technologies, featuring separate Admin Panel, Customer Frontend, and Backend API services. This platform provides a complete online shopping experience with advanced features like real-time notifications, payment processing, AI-powered recommendations, and comprehensive analytics.

## 🏗️ Repository Structure

```
Cmax_Online_Store/
│
├── admin/                   # Admin Panel (React + Vite + JavaScript)
│
├── Frontend/               # Customer Store (React + Vite + JavaScript)
│
├── Backend/               # API Server (Node.js + Express + MongoDB)
│
├── Design/          # Project design
├── docs/                # Additional documentation
├── .gitignore
└── README.md            # ← You are here
```

## ✨ Features

### 🔧 Admin Panel
- **Dashboard Analytics**: Real-time sales metrics, revenue charts, and performance indicators
- **Product Management**: Complete CRUD operations for products with image galleries
- **Category Management**: Hierarchical category organization and management
- **User Management**: Customer account management and admin role assignments
- **Order Management**: Order tracking, status updates, and fulfillment processing
- **Inventory Tracking**: Stock levels, low inventory alerts, and reorder notifications
- **Sales Reports**: Detailed analytics with CSV/PDF export capabilities
- **Real-time Notifications**: WebSocket-powered instant updates
- **Responsive Design**: Mobile-friendly admin interface
- **Role-based Access**: Multiple admin permission levels

### 🛒 Customer Frontend
- **Product Catalog**: Advanced filtering, sorting, and search functionality
- **Product Details**: High-resolution image galleries, detailed descriptions, and specifications
- **Shopping Cart**: Persistent cart with quantity management and price calculations
- **Wishlist**: Save favorite products for later purchase
- **User Authentication**: Secure signup/login with email verification
- **Social Login**: Google and Facebook OAuth integration
- **Order Management**: Order history, tracking, and status updates
- **Customer Reviews**: Rating system with photo uploads and review moderation
- **Responsive Design**: Mobile-first design with PWA capabilities
- **Payment Integration**: Secure Stripe payment processing
- **AI Recommendations**: Gemini AI-powered product suggestions

### 🚀 Backend API
- **RESTful Architecture**: Well-structured API endpoints following REST principles
- **Authentication & Authorization**: JWT-based secure authentication system
- **Database Operations**: MongoDB with Mongoose ODM for data modeling
- **File Upload Handling**: Cloudinary integration for image processing and storage
- **Email Services**: Automated email notifications for orders, accounts, and promotions
- **Payment Processing**: Stripe integration for secure payment handling
- **AI Integration**: Google Gemini API for intelligent features
- **Error Handling**: Comprehensive error logging and user-friendly error responses
- **Data Validation**: Input validation and sanitization for security
- **API Documentation**: Detailed endpoint documentation

## 📸 Application Screenshots

#### Admin Panel Interface
#### Admin Dashbosrd
![Admin Dashboard](./Design/Admin%20Interfaces/A3.1.png)
*Comprehensive admin dashboard with real-time analytics and quick action buttons*

#### Add Items Page
![Product Management](./Design/Admin%20Interfaces/A4.png)
*Advanced product management interface with bulk operations and image handling*

#### Order Management Page
![Order Management](./Design/Admin%20Interfaces/A8.png)
*Order processing dashboard with status tracking and customer details*

#### Return order Management Page
![Return Management](./Design/Admin%20Interfaces/A9.1.png)
*Retern processing dashboard with status tracking and customer details*

#### Admin Management Page
![Admin Management](./Design/Admin%20Interfaces/A11.png)
*Advanced admin management interface with access control*

#### Customer Store Interface
#### Store Homepage
![Store Homepage](./Design/Customer%20Interfaces/C3.1.png)
*Modern, responsive homepage with featured products and promotional banners*

#### Collection Page
![Product Catalog](./Design/Customer%20Interfaces/C4.png)
*Advanced product catalog with filtering, sorting, and grid/list view options*

#### Product Page
![Product Details](./Design/Customer%20Interfaces/C5.png)
*Detailed product page with image gallery, reviews, and related products*

#### Cart Page
![Shopping Cart](./Design/Customer%20Interfaces/C8.png)
*Interactive shopping cart with quantity controls and price calculations*

#### Checkout Page
![Checkout Process](./Design/Customer%20Interfaces/C9.png)
*Streamlined checkout process with multiple payment options*

## 🚀 Getting Started

### 📋 Prerequisites

**Required Software:**
- **Node.js**: Version 16.0.0 or higher ([Download](https://nodejs.org/))
- **npm**: Version 8.0.0 or higher (comes with Node.js)
- **Git**: Latest version ([Download](https://git-scm.com/))
- **Code Editor**: VS Code recommended ([Download](https://code.visualstudio.com/))

**System Requirements:**
- **RAM**: Minimum 4GB (8GB recommended)
- **Storage**: At least 2GB free space
- **OS**: Windows 10+, macOS 10.15+, or Linux Ubuntu 18+

### 🔧 Required Third-Party Services Setup

Before running the application, you'll need to configure the following external services. Each service provides essential functionality for the platform.

#### 1. 🗄️ MongoDB Database Setup (`MONGODB_URI`)

**Why needed**: Primary database for storing all application data including products, users, orders, and analytics.

**Setup Instructions:**
1. **Create MongoDB Atlas Account**
   - Visit [mongodb.com/cloud/atlas](https://mongodb.com/cloud/atlas)
   - Sign up for a free account
   - Verify your email address

2. **Create a New Cluster**
   - Click "Create a New Cluster"
   - Choose "Shared" (free tier)
   - Select your preferred cloud provider and region
   - Click "Create Cluster" (takes 3-5 minutes)

3. **Configure Database Access**
   - Go to "Database Access" in the left sidebar
   - Click "Add New Database User"
   - Choose "Password" authentication
   - Create username and secure password
   - Set user privileges to "Read and write to any database"
   - Click "Add User"

4. **Configure Network Access**
   - Go to "Network Access" in the left sidebar
   - Click "Add IP Address"
   - For development: Click "Allow Access from Anywhere" (0.0.0.0/0)
   - For production: Add your specific IP addresses
   - Click "Confirm"

5. **Get Connection String**
   - Go to "Clusters" and click "Connect"
   - Choose "Connect your application"
   - Select "Node.js" and version "4.1 or later"
   - Copy the connection string
   - Replace `<password>` with your database user password
   - Replace `<dbname>` with your preferred database name (e.g., "cmax-store")

**Example Connection String:**
```
mongodb+srv://username:password@cluster0.abc123.mongodb.net/cmax-store?retryWrites=true&w=majority
```

📹 **Detailed Setup Guide**: [MongoDB Atlas Setup Tutorial](https://youtu.be/7fBh4noiBOw?feature=shared&t=149)

#### 2. 🖼️ Cloudinary Image Storage (`CLOUDINARY_API_KEY`, `CLOUDINARY_SECRET_KEY`, `CLOUDINARY_NAME`)

**Why needed**: Cloud-based image and video management for product photos, user avatars, and file uploads.

**Setup Instructions:**
1. **Create Cloudinary Account**
   - Visit [cloudinary.com](https://cloudinary.com)
   - Sign up for a free account (includes 25GB storage and 25GB bandwidth)
   - Verify your email address

2. **Access Dashboard**
   - After login, you'll see your Dashboard
   - Note the "Account Details" section in the top-right

3. **Collect Credentials**
   - **Cloud Name**: Found in "Account Details" (e.g., "dxxxxx")
   - **API Key**: Found in "Account Details" (numeric value)
   - **API Secret**: Click "Reveal" next to API Secret to view

4. **Configure Upload Settings** (Optional)
   - Go to Settings → Upload
   - Set upload presets for different image types
   - Configure auto-optimization settings

**Security Note**: Keep your API Secret secure and never expose it in client-side code.

📹 **Detailed Setup Guide**: [Cloudinary Configuration Tutorial](https://youtu.be/KRAuVVW9Ms8?feature=shared&t=229)

#### 3. 💳 Stripe Payment Gateway (`STRIPE_SECRET_KEY`)

**Why needed**: Secure payment processing for customer transactions, including credit cards and digital wallets.

**Setup Instructions:**
1. **Create Stripe Account**
   - Visit [stripe.com](https://stripe.com)
   - Sign up for an account
   - Complete business information and verification

2. **Access API Keys**
   - Go to Developers → API keys in the Stripe Dashboard
   - You'll see two types of keys:
     - **Publishable key**: For client-side (starts with `pk_`)
     - **Secret key**: For server-side (starts with `sk_`)

3. **Use Test Keys for Development**
   - Use keys that start with `pk_test_` and `sk_test_`
   - These allow testing without real money transactions
   - Test card numbers are available in Stripe documentation

4. **Configure Webhooks** (Optional for advanced features)
   - Go to Developers → Webhooks
   - Add endpoint: `http://localhost:4000/api/stripe/webhook`
   - Select events: `payment_intent.succeeded`, `payment_intent.payment_failed`

5. **Production Setup**
   - Complete account verification for live payments
   - Use live keys (start with `pk_live_` and `sk_live_`) in production

📹 **Detailed Setup Guide**: [Stripe Integration Tutorial](https://youtu.be/3OOHC_UzrKA?feature=shared&t=33)

#### 4. 🔐 Google OAuth (`GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`)

**Why needed**: Enables customers to sign in using their Google accounts for faster registration and login.

**Setup Instructions:**
1. **Access Google Cloud Console**
   - Visit [console.cloud.google.com](https://console.cloud.google.com)
   - Sign in with your Google account

2. **Create or Select Project**
   - Click "Select a project" at the top
   - Create a new project or select existing one
   - Enable billing (required for OAuth, but won't be charged for basic usage)

3. **Enable Required APIs**
   - Go to "APIs & Services" → "Library"
   - Search and enable:
     - Google+ API
     - Google Sign-In API
     - People API

4. **Configure OAuth Consent Screen**
   - Go to "APIs & Services" → "OAuth consent screen"
   - Choose "External" user type for public apps
   - Fill in required fields:
     - App name: "Cmax Online Store"
     - User support email: Your email
     - Developer contact information: Your email
   - Add scopes: `email`, `profile`, `openid`

5. **Create OAuth 2.0 Credentials**
   - Go to "APIs & Services" → "Credentials"
   - Click "Create Credentials" → "OAuth 2.0 Client ID"
   - Choose "Web application"
   - Set name: "Cmax Store Web Client"
   - Add Authorized JavaScript origins:
     - `http://localhost:5173` (Frontend)
     - `http://localhost:5174` (Admin)
   - Add Authorized redirect URIs:
     - `http://localhost:4000/auth/google/callback`
     - `http://localhost:5173/auth/google/callback`
   - Download the JSON file or copy Client ID and Client Secret

📹 **Detailed Setup Guide**: [Google OAuth Setup Tutorial](https://developers.google.com/identity/protocols/oauth2)

#### 5. 📘 Facebook OAuth (`FACEBOOK_APP_ID`, `FACEBOOK_APP_SECRET`)

**Why needed**: Allows customers to sign in using their Facebook accounts.

**Setup Instructions:**
1. **Access Facebook Developers**
   - Visit [developers.facebook.com](https://developers.facebook.com)
   - Log in with your Facebook account

2. **Create New App**
   - Click "Create App"
   - Choose "Consumer" as app type
   - Fill in app details:
     - App Name: "Cmax Online Store"
     - Contact Email: Your email
   - Click "Create App"

3. **Add Facebook Login Product**
   - In the app dashboard, click "Add Product"
   - Find "Facebook Login" and click "Set Up"
   - Choose "Web" platform

4. **Configure Facebook Login Settings**
   - Go to Facebook Login → Settings
   - Add Valid OAuth Redirect URIs:
     - `http://localhost:4000/auth/facebook/callback`
     - `http://localhost:5173/auth/facebook/callback`
   - Set Client OAuth Login: Yes
   - Set Web OAuth Login: Yes

5. **Get App Credentials**
   - Go to Settings → Basic
   - Copy App ID and App Secret
   - Keep App Secret secure

6. **App Review** (For Production)
   - For live use, submit for app review
   - Request permissions: `email`, `public_profile`

📹 **Detailed Setup Guide**: [Facebook OAuth Setup Tutorial](https://developers.facebook.com/docs/facebook-login/guides/advanced/manual-flow/)

#### 6. 🤖 Google Gemini AI (`GEMINI_API_KEY`)

**Why needed**: Powers AI features like product recommendations, search improvements, and automated content generation.

**Setup Instructions:**
1. **Access Google AI Studio**
   - Visit [makersuite.google.com/app/apikey](https://makersuite.google.com/app/apikey)
   - Sign in with your Google account

2. **Create API Key**
   - Click "Create API Key"
   - Choose "Create API key in new project" or select existing project
   - Copy the generated API key
   - Store it securely

3. **Test API Key**
   - Use the AI Studio to test your API key
   - Try sample prompts to ensure it's working

4. **Set Usage Limits** (Optional)
   - Go to Google Cloud Console
   - Navigate to APIs & Services → Quotas
   - Set daily/monthly limits to control costs

**Usage in Application**:
- Product recommendation engine
- Search query improvements
- Automated product descriptions
- Customer service chatbot responses

📹 **Detailed Setup Guide**: [Google Gemini API Tutorial](https://youtu.be/LXBod7UDRqE?feature=shared)

#### 7. 📧 Gmail App Password (`EMAIL_USER`, `EMAIL_PASS`)

**Why needed**: Enables automated email sending for order confirmations, password resets, and notifications.

**Setup Instructions:**
1. **Enable 2-Factor Authentication**
   - Go to [myaccount.google.com](https://myaccount.google.com)
   - Click "Security" in the left panel
   - Under "Signing in to Google," click "2-Step Verification"
   - Follow the setup process (SMS or authenticator app)

2. **Generate App Password**
   - In Security settings, click "App passwords"
   - Select "Mail" as the app
   - Select "Other (custom name)" as the device
   - Enter "Cmax Online Store" as the custom name
   - Click "Generate"

3. **Copy App Password**
   - Copy the 16-character password generated
   - Use this password, not your regular Gmail password
   - Keep this password secure

4. **Configure Email Settings**
   - `EMAIL_USER`: Your full Gmail address (e.g., yourname@gmail.com)
   - `EMAIL_PASS`: The 16-character app password

**Email Features in Application**:
- Welcome emails for new users
- Order confirmation and tracking
- Password reset links
- Promotional campaigns
- Admin notifications

📹 **Detailed Setup Guide**: [Gmail App Password Tutorial](https://support.google.com/mail/answer/185833?hl=en)

#### 8. ⚙️ Custom Configuration Variables

These are application-specific settings that you can customize according to your needs.

**`ADMIN_REGISTRATION_KEY`** - Admin Account Creation Security
```bash
# Purpose: Secure key required to create admin accounts
# Security: Prevents unauthorized admin account creation
# Example: "ADMIN_2024_SECURE_KEY_XYZ789"
# Recommendation: Use a unique, complex string with letters, numbers, and symbols
```

**`JWT_SECRET`** - JSON Web Token Security
```bash
# Purpose: Signs and verifies JWT tokens for user authentication
# Security: Critical for app security - use a strong, unique secret
# Length: Minimum 32 characters recommended
# Example: "MyJWT$ecure2024!@#StrongP@ssw0rd$Key"
# Generation: Use online JWT secret generators or create your own complex string
```

**`STORE_EMAIL`** - Business Contact Email
```bash
# Purpose: Main contact email displayed to customers
# Usage: Contact forms, customer service, order inquiries
# Example: "contact@cmaxstore.com" or "support@yourstore.com"
# Note: Should be a professional email address
```

**`STORE_PHONE`** - Business Contact Phone
```bash
# Purpose: Customer service phone number
# Format: Include country code for international accessibility
# Example: "+1-555-123-4567" or "+44-20-1234-5678"
# Note: Ensure this number can handle customer inquiries
```

**`FRONTEND_URL` & `BACKEND_URL`** - Application URLs
```bash
# Development URLs (default):
FRONTEND_URL="http://localhost:5173"
BACKEND_URL="http://localhost:4000"

# Production URLs (update when deploying):
FRONTEND_URL="https://your-store.com"
BACKEND_URL="https://api.your-store.com"
```

### 🔐 Environment Configuration

#### Step 1: Create Environment File
```bash
# Navigate to Backend directory
cd Backend

# Copy the environment template
cp .env.example .env

# Open .env file in your editor
code .env  # VS Code
# or
notepad .env  # Windows Notepad
# or
nano .env  # Linux/Mac terminal
```

#### Step 2: Configure Your Environment Variables
Update your `.env` file with all the credentials obtained from the setup steps above:

```properties
# Database Configuration
MONGODB_URI="mongodb+srv://your-username:your-password@cluster0.xxxxx.mongodb.net/cmax-store?retryWrites=true&w=majority"

# Cloudinary Configuration (Image Storage)
CLOUDINARY_API_KEY="123456789012345"
CLOUDINARY_SECRET_KEY="your-cloudinary-secret-key-here"
CLOUDINARY_NAME="your-cloudinary-cloud-name"

# Authentication & Security
JWT_SECRET="YourVeryStrongJWTSecret2024!@#$%^&*()_+{}[]"
ADMIN_REGISTRATION_KEY="YourSecureAdminKey2024!@#"

# Payment Gateway
STRIPE_SECRET_KEY="sk_test_51abc123...your-stripe-secret-key"

# Email Service Configuration
EMAIL_USER="your-store-email@gmail.com"
EMAIL_PASS="your-16-char-app-password"

# AI Service
GEMINI_API_KEY="your-gemini-api-key-here"

# OAuth Configuration
GOOGLE_CLIENT_ID="123456789-abc123def456.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="GOCSPX-your-google-client-secret"
FACEBOOK_APP_ID="123456789012345"
FACEBOOK_APP_SECRET="your-facebook-app-secret"

# Store Information
STORE_EMAIL="contact@cmaxstore.com"
STORE_PHONE="+1-555-123-4567"

# Application URLs
FRONTEND_URL="http://localhost:5173"
BACKEND_URL="http://localhost:4000"
```

#### Step 3: Verify Configuration
Create a simple verification script to test your environment:

```bash
# In Backend directory, create a test file
echo "console.log('Testing environment variables...')
console.log('MongoDB URI:', process.env.MONGODB_URI ? '✅ Set' : '❌ Missing')
console.log('Cloudinary:', process.env.CLOUDINARY_API_KEY ? '✅ Set' : '❌ Missing')
console.log('Stripe:', process.env.STRIPE_SECRET_KEY ? '✅ Set' : '❌ Missing')
console.log('JWT Secret:', process.env.JWT_SECRET ? '✅ Set' : '❌ Missing')" > test-env.js

# Run the test
node test-env.js

# Remove test file after verification
rm test-env.js
```

### 📦 Installation Process

#### Step 1: Clone the Repository
```bash
# Clone the repository
git clone https://github.com/your-username/Cmax_Online_Store.git

# Navigate to project directory
cd Cmax_Online_Store

# Verify project structure
ls -la
```

#### Step 2: Install Dependencies for All Services

**Method 1: Manual Installation (Recommended for beginners)**
```bash
# Install Backend dependencies
cd Backend
npm install
echo "✅ Backend dependencies installed"
cd ..

# Install Frontend dependencies
cd Frontend
npm install
echo "✅ Frontend dependencies installed"
cd ..

# Install Admin Panel dependencies
cd admin
npm install
echo "✅ Admin Panel dependencies installed"
cd ..

echo "🎉 All dependencies installed successfully!"
```

**Method 2: Automated Installation Script (Advanced users)**
```bash
# Create installation script
cat > install-all.sh << 'EOF'
#!/bin/bash
echo "🚀 Installing Cmax Online Store..."

echo "📦 Installing Backend dependencies..."
cd Backend && npm install
if [ $? -eq 0 ]; then
    echo "✅ Backend dependencies installed successfully"
else
    echo "❌ Backend installation failed"
    exit 1
fi
cd ..

echo "📦 Installing Frontend dependencies..."
cd Frontend && npm install
if [ $? -eq 0 ]; then
    echo "✅ Frontend dependencies installed successfully"
else
    echo "❌ Frontend installation failed"
    exit 1
fi
cd ..

echo "📦 Installing Admin Panel dependencies..."
cd admin && npm install
if [ $? -eq 0 ]; then
    echo "✅ Admin Panel dependencies installed successfully"
else
    echo "❌ Admin Panel installation failed"
    exit 1
fi
cd ..

echo "🎉 All installations completed successfully!"
echo "📖 Next steps:"
echo "1. Configure your .env file in Backend directory"
echo "2. Run the applications using the provided commands"
EOF

# Make script executable and run
chmod +x install-all.sh
./install-all.sh
```

#### Step 3: Verify Installation
```bash
# Check if all node_modules directories exist
echo "Checking installations..."
[ -d "Backend/node_modules" ] && echo "✅ Backend: Installed" || echo "❌ Backend: Missing"
[ -d "Frontend/node_modules" ] && echo "✅ Frontend: Installed" || echo "❌ Frontend: Missing"
[ -d "admin/node_modules" ] && echo "✅ Admin: Installed" || echo "❌ Admin: Missing"
```

### 🚀 Running the Application

#### Development Environment Setup

**Prerequisites Check:**
```bash
# Verify Node.js version
node --version  # Should be 16.0.0 or higher

# Verify npm version
npm --version   # Should be 8.0.0 or higher

# Check if ports are available
netstat -an | findstr "4000\|5173\|5174"  # Windows
# or
lsof -i :4000 -i :5173 -i :5174  # macOS/Linux
```

#### Starting All Services

**Option 1: Manual Startup (Recommended for learning)**

**Terminal 1 - Backend API Server:**
```bash
cd Backend

# Verify environment file exists
ls -la .env

# Start the backend server
npm run start
# or for development with auto-restart:
npm run dev

# Expected output:
# 🚀 Server running on http://localhost:4000
# 📊 MongoDB connected successfully
# ✅ Cloudinary configured
# 💳 Stripe initialized
```

**Terminal 2 - Admin Panel:**
```bash
cd admin

# Start the admin development server
npm run dev

# Expected output:
# ➜  Local:   http://localhost:5173/
# ➜  Network: use --host to expose
# ➜  press h to show help
```

**Terminal 3 - Customer Frontend:**
```bash
cd Frontend

# Start the frontend development server
npm run dev

# Expected output:
# ➜  Local:   http://localhost:5174/
# ➜  Network: use --host to expose
# ➜  press h to show help
```

**Option 2: Automated Startup Script (Advanced)**

Create a startup script for convenience:

```bash
# Create startup script
cat > start-dev.sh << 'EOF'
#!/bin/bash

echo "🚀 Starting Cmax Online Store Development Environment..."

# Function to kill all processes on exit
cleanup() {
    echo "🛑 Shutting down all services..."
    kill $(jobs -p) 2>/dev/null
    exit
}
trap cleanup SIGINT

# Start Backend
echo "📡 Starting Backend API server..."
cd Backend && npm run dev &
BACKEND_PID=$!
cd ..

# Wait for backend to start
sleep 5

# Start Admin Panel
echo "🔧 Starting Admin Panel..."
cd admin && npm run dev &
ADMIN_PID=$!
cd ..

# Start Frontend
echo "🛒 Starting Customer Frontend..."
cd Frontend && npm run dev &
FRONTEND_PID=$!
cd ..

echo "✅ All services started!"
echo "📱 Admin Panel: http://localhost:5173"
echo "🛒 Customer Store: http://localhost:5174"
echo "📡 Backend API: http://localhost:4000"
echo ""
echo "Press Ctrl+C to stop all services"

# Wait for all background processes
wait
EOF

# Make executable and run
chmod +x start-dev.sh
./start-dev.sh
```

#### Service URLs and Access Points

| Service | URL | Purpose | Default Port |
|---------|-----|---------|--------------|
| **Backend API** | http://localhost:4000 | REST API endpoints | 4000 |
| **Admin Panel** | http://localhost:5173 | Admin dashboard | 5173 |
| **Customer Store** | http://localhost:5174 | Customer frontend | 5174 |

#### First-Time Setup Verification

**1. Test Backend API:**
```bash
# Test basic API health
curl http://localhost:4000/api/health
# Expected: {"status": "OK", "timestamp": "..."}

# Test database connection
curl http://localhost:4000/api/status
# Expected: {"database": "connected", "services": "operational"}
```

**2. Access Admin Panel:**
- Navigate to http://localhost:5173
- Create your first admin account using the `ADMIN_REGISTRATION_KEY`
- Verify dashboard loads with empty data

**3. Access Customer Store:**
- Navigate to http://localhost:5174
- Browse the empty product catalog
- Test user registration and login

#### Common Startup Issues and Solutions

**Port Already in Use:**
```bash
# Find and kill process using port 4000
netstat -ano | findstr :4000  # Windows
sudo lsof -ti:4000 | xargs kill -9  # macOS/Linux

# Or use different ports by modifying package.json scripts
```

**Environment Variables Not Loading:**
```bash
# Verify .env file location and format
cd Backend && cat .env

# Check for hidden characters or encoding issues
file .env

# Ensure no spaces around = signs in .env
```

**Database Connection Issues:**
```bash
# Test MongoDB connection separately
cd Backend
node -e "
const mongoose = require('mongoose');
mongoose.connect(process.env.MONGODB_URI || 'your-mongodb-uri')
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.log('❌ MongoDB error:', err.message));
"
```

## 📚 Project Architecture & Details

### 🗂️ Detailed File Structure

```
Cmax_Online_Store/
│
├── 🔧 admin/                        # Admin Panel Application
│   ├── public/
│   │   └── logo.png                 # Admin logo
│   ├── src/
│   │   ├── assets/                  # Static Assets
│   │   │   ├── assets.js           # Asset exports
│   │   │   ├── logo.png            # Logo image
│   │   │   ├── add-product.png     # Add product icon
│   │   │   ├── upload_area.png     # Upload area image
│   │   │   ├── dashboard.png       # Dashboard icon
│   │   │   ├── profile.png         # Profile icon
│   │   │   └── [other icons...]    # Various UI icons
│   │   ├── components/             # Reusable Components
│   │   │   ├── Navbar.jsx          # Admin navigation bar
│   │   │   ├── Sidebar.jsx         # Admin sidebar navigation
│   │   │   └── AdminChatBot.jsx    # AI chatbot component
│   │   ├── pages/                  # Admin Pages
│   │   │   ├── Dashboard.jsx       # Main admin dashboard
│   │   │   ├── Add.jsx             # Add new product
│   │   │   ├── List.jsx            # Product list management
│   │   │   ├── Edit.jsx            # Edit product details
│   │   │   ├── Orders.jsx          # Order management
│   │   │   ├── Profile.jsx         # Admin profile
│   │   │   ├── Login.jsx           # Admin login
│   │   │   ├── SignUp.jsx          # Admin registration
│   │   │   ├── CategoryManager.jsx # Category management
│   │   │   ├── AdminManagement.jsx # Admin user management
│   │   │   ├── ReturnRequests.jsx  # Return request handling
│   │   │   ├── ReturnAnalysis.jsx  # Return analytics
│   │   │   ├── UserActivityReport.jsx # User activity reports
│   │   │   ├── SalesReport.jsx     # Sales reporting
│   │   │   └── FinancialSalesReport.jsx # Financial reports
│   │   ├── services/               # Service Layer
│   │   │   └── WebSocketService.js # Real-time communication
│   │   ├── App.jsx                 # Main admin app component
│   │   ├── main.jsx                # Admin app entry point
│   │   └── index.css               # Global styles
│   ├── index.html                  # HTML entry point
│   ├── package.json                # Dependencies and scripts
│   ├── vite.config.js             # Vite configuration
│   ├── eslint.config.js           # ESLint configuration
│   ├── .env                       # Environment variables
│   ├── .gitignore                 # Git ignore rules
│   └── README.md                  # Admin documentation
│
├── 🛒 Frontend/                     # Customer Store Application
│   ├── public/
│   │   └── logo.png                # Store logo
│   ├── src/
│   │   ├── assets/                 # Static Assets
│   │   │   ├── assets.js          # Asset exports
│   │   │   ├── logo.png           # Logo image
│   │   │   ├── hero_img.png       # Hero section images
│   │   │   ├── cart_icon.png      # Shopping cart icon
│   │   │   ├── profile_icon.png   # User profile icon
│   │   │   ├── search_icon.png    # Search icon
│   │   │   ├── star_icon.png      # Rating star icons
│   │   │   ├── empty_cart.png     # Empty cart illustration
│   │   │   ├── empty_order.png    # Empty orders illustration
│   │   │   ├── empty_wishlist.png # Empty wishlist illustration
│   │   │   └── [other assets...]  # Various UI elements
│   │   ├── components/            # UI Components
│   │   │   ├── Navbar.jsx         # Main navigation
│   │   │   ├── Footer.jsx         # Footer component
│   │   │   ├── SearchBar.jsx      # Search functionality
│   │   │   ├── CartTotal.jsx      # Cart total calculations
│   │   │   ├── ProductItem.jsx    # Product display component
│   │   │   ├── RelatedProducts.jsx # Related products section
│   │   │   ├── ProductReviews.jsx # Product review system
│   │   │   ├── RecommendedProducts.jsx # AI recommendations
│   │   │   ├── Title.jsx          # Section titles
│   │   │   ├── ChatBot.jsx        # Customer chatbot
│   │   │   ├── SignUpLoginNavbar.jsx # Auth page navigation
│   │   │   └── OAuthCallback.jsx  # OAuth handling
│   │   ├── pages/                 # Store Pages
│   │   │   ├── Home.jsx           # Homepage
│   │   │   ├── About.jsx          # About page
│   │   │   ├── Contact.jsx        # Contact page
│   │   │   ├── Collection.jsx     # Product catalog
│   │   │   ├── Product.jsx        # Product details
│   │   │   ├── Cart.jsx           # Shopping cart
│   │   │   ├── PlaceOrder.jsx     # Checkout process
│   │   │   ├── Orders.jsx         # Order history
│   │   │   ├── Profile.jsx        # User profile
│   │   │   ├── Login.jsx          # User login
│   │   │   ├── SignUp.jsx         # User registration
│   │   │   ├── Verify.jsx         # Email verification
│   │   │   ├── Returns.jsx        # Return requests
│   │   │   └── Wishlist.jsx       # User wishlist
│   │   ├── context/               # React Context
│   │   │   └── ShopContext.jsx    # Global app state
│   │   ├── services/              # Service Layer
│   │   │   └── WebSocketService.js # Real-time updates
│   │   ├── App.jsx                # Main app component
│   │   ├── main.jsx               # App entry point
│   │   └── index.css              # Global styles
│   ├── index.html                 # HTML entry point
│   ├── package.json               # Dependencies and scripts
│   ├── vite.config.js            # Vite configuration
│   ├── eslint.config.js          # ESLint configuration
│   ├── .env                      # Environment variables
│   ├── .gitignore                # Git ignore rules
│   └── README.md                 # Frontend documentation
│
├── 🖥️ Backend/                     # API Server Application
│   ├── assets/
│   │   └── logo.png               # Server logo
│   ├── config/                    # Configuration Files
│   │   ├── coludinary.js         # Cloudinary setup
│   │   ├── mongodb.js            # MongoDB connection
│   │   └── passport.js           # Passport OAuth config
│   ├── controllers/               # Route Controllers
│   │   ├── adminController.js     # Admin operations
│   │   ├── orderController.js     # Order processing
│   │   ├── chatbotController.js   # AI chatbot logic
│   │   ├── dashboardController.js # Dashboard analytics
│   │   └── [other controllers...] # Additional controllers
│   ├── models/                    # MongoDB Models
│   │   ├── adminModel.js         # Admin user model
│   │   └── [other models...]     # Additional data models
│   ├── routes/                    # API Route Definitions
│   │   ├── adminRoute.js         # Admin-specific routes
│   │   ├── reviewRoute.js        # Review system routes
│   │   ├── productRoute.js       # Product management routes
│   │   ├── orderRoute.js         # Order processing routes
│   │   ├── dashboardRoute.js     # Dashboard data routes
│   │   └── [other routes...]     # Additional API routes
│   ├── middleware/                # Custom Middleware
│   │   └── [auth & validation...]# Authentication & validation
│   ├── services/                  # Business Logic Services
│   ├── utils/                     # Utility Functions
│   ├── server.js                  # Main server entry point
│   ├── package.json               # Dependencies and scripts
│   ├── .env                       # Environment variables
│   └── .gitignore                # Git ignore rules
│
├── .env                           # Root environment file
├── .gitignore                     # Root git ignore
├── eslint.config.js              # Root ESLint config
├── package.json                   # Root package.json
├── vite.config.js                # Root Vite config
└── README.md                      # Main documentation
```

### 🛠️ Technology Stack

#### Frontend Technologies
- **React 18**: Modern React with hooks and functional components
- **Vite**: Fast build tool and development server
- **JavaScript**: JavaScript for development
- **Tailwind CSS**: Utility-first CSS framework
- **React Router**: Client-side routing
- **Axios**: HTTP client for API requests
- **React Query**: Server state management
- **Framer Motion**: Animation library
- **React Hook Form**: Form handling and validation

#### Backend Technologies
- **Node.js**: JavaScript runtime environment
- **Express.js**: Web application framework
- **MongoDB**: NoSQL database
- **Mongoose**: MongoDB object modeling
- **JWT**: JSON Web Tokens for authentication
- **Bcrypt**: Password hashing
- **Multer**: File upload handling
- **Nodemailer**: Email sending
- **Socket.io**: Real-time communication

#### DevOps & Tools
- **Git**: Version control
- **ESLint**: Code linting
- **Prettier**: Code formatting
- **GitHub Actions**: CI/CD pipelines

## 📋 Available Scripts & Commands

### 🔧 Admin Panel Commands

```bash
cd admin

# Development
npm run dev          # Start development server with hot reload
npm run build        # Create production build
npm run preview      # Preview production build locally
npm run lint         # Run ESLint for code quality
npm run lint:fix     # Auto-fix ESLint issues
npm run type-check   # JavaScript type checking (if using TS)

# Testing
npm run test         # Run unit tests
npm run test:watch   # Run tests in watch mode
npm run test:coverage # Generate test coverage report

# Maintenance
npm run clean        # Clean build artifacts
npm audit            # Check for security vulnerabilities
npm update           # Update dependencies
```

### 🛒 Frontend Store Commands

```bash
cd Frontend

# Development
npm run dev          # Start development server
npm run build        # Create production build
npm run preview      # Preview production build
npm run lint         # Run ESLint
npm run lint:fix     # Auto-fix linting issues

# PWA Commands
npm run build:pwa    # Build with PWA optimization
npm run analyze      # Analyze bundle size

# Testing
npm run test         # Run tests
npm run test:e2e     # Run end-to-end tests
npm run test:unit    # Run unit tests only

# Performance
npm run lighthouse   # Run Lighthouse audit
npm run bundle-analyzer # Analyze bundle composition
```

### 🖥️ Backend API Commands

```bash
cd Backend

# Development
npm run start        # Start production server
npm run dev          # Start with nodemon (auto-restart)
npm run debug        # Start with debugging enabled
npm run lint         # Run ESLint
npm run lint:fix     # Auto-fix linting issues

# Database Operations
npm run db:seed      # Seed database with sample data
npm run db:reset     # Reset database (careful in production!)
npm run db:backup    # Create database backup
npm run db:migrate   # Run database migrations

# Testing
npm run test         # Run all tests
npm run test:unit    # Run unit tests
npm run test:integration # Run integration tests
npm run test:watch   # Run tests in watch mode
npm run test:coverage # Generate coverage report

# Production & Maintenance
npm run build        # Prepare for production
npm run start:prod   # Start production server
npm run logs         # View application logs
npm audit            # Security audit
npm run clean        # Clean temporary files
```

### 🔄 Root Level Commands (Optional)

```bash
# From project root directory

# Install all dependencies
npm run install:all  # Install for all sub-projects

# Start all services
npm run dev:all      # Start all in development mode
npm run start:all    # Start all in production mode

# Build all applications
npm run build:all    # Build all for production

# Testing across all projects
npm run test:all     # Run tests in all projects
npm run lint:all     # Lint all projects

# Maintenance
npm run clean:all    # Clean all build artifacts
npm run update:all   # Update all dependencies
```

## 🚀 Production Deployment Guide

### 🏗️ Pre-Deployment Checklist

**Environment Preparation:**
- [ ] Update all environment variables for production
- [ ] Change MongoDB URI to production database
- [ ] Update Stripe keys to live keys
- [ ] Configure production domain URLs
- [ ] Set up SSL certificates
- [ ] Configure production email service
- [ ] Test all third-party service integrations

**Security Checklist:**
- [ ] Enable CORS for production domains only
- [ ] Set secure session configurations
- [ ] Configure rate limiting
- [ ] Enable security headers
- [ ] Set up monitoring and logging
- [ ] Configure backup strategies

### 🌐 Deployment Options

#### Option 1: Traditional VPS/Server Deployment

**1. Build Applications:**
```bash
# Build Admin Panel
cd admin
npm run build
# Creates: dist/ directory

# Build Frontend Store
cd Frontend
npm run build
# Creates: dist/ directory

# Prepare Backend
cd Backend
npm install --production
```

**2. Server Setup:**
```bash
# Install Node.js and PM2 on server
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
sudo npm install -g pm2

# Transfer files to server
rsync -avz ./admin/dist/ user@server:/var/www/admin/
rsync -avz ./Frontend/dist/ user@server:/var/www/frontend/
rsync -avz ./Backend/ user@server:/var/www/backend/
```

**3. Configure Nginx:**
```nginx
# /etc/nginx/sites-available/cmax-store
server {
    listen 80;
    server_name your-domain.com;

    # Frontend Store
    location / {
        root /var/www/frontend;
        index index.html;
        try_files $uri $uri/ /index.html;
    }

    # Admin Panel
    location /admin {
        alias /var/www/admin;
        index index.html;
        try_files $uri $uri/ /admin/index.html;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

#### Option 2: Cloud Platform Deployment

**Vercel (Frontend + Admin):**
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy Frontend
cd Frontend
vercel --prod

# Deploy Admin Panel
cd admin
vercel --prod
```

**Railway/Render (Backend):**
```bash
# Connect GitHub repository
# Set environment variables in platform dashboard
# Deploy automatically on git push
```

**Netlify (Alternative for Frontend):**
```bash
# Build command: npm run build
# Publish directory: dist
# Environment variables: Set in Netlify dashboard
```

### 📊 Performance Optimization

**Frontend Optimizations:**
```bash
# Bundle analysis
npm run build && npm run analyze

# PWA optimization
npm run build:pwa

# Image optimization
npm install --save-dev imagemin imagemin-webp
```

**Backend Optimizations:**
```javascript
// Enable compression
const compression = require('compression');
app.use(compression());

// Cache static assets
app.use(express.static('public', {
  maxAge: '1d',
  etag: false
}));

// Database indexing
// Add appropriate indexes in MongoDB
```

## 🧪 Testing Framework

### 🔍 Testing Strategy

**Unit Tests:**
- Component testing for React components
- Function testing for utilities
- Model testing for database schemas
- Controller testing for API endpoints

**Integration Tests:**
- API endpoint testing
- Database integration testing
- Third-party service integration testing

**End-to-End Tests:**
- User journey testing
- Payment flow testing
- Admin workflow testing

### 🛠️ Running Tests

**Frontend Testing:**
```bash
cd Frontend

# Run all tests
npm run test

# Watch mode for development
npm run test:watch

# Coverage report
npm run test:coverage

# E2E tests with Cypress
npm run test:e2e
```

**Backend Testing:**
```bash
cd Backend

# Unit tests
npm run test:unit

# Integration tests
npm run test:integration

# API tests
npm run test:api

# Load testing
npm run test:load
```

## 🔧 Troubleshooting Guide

### 🚨 Common Issues & Solutions

#### Database Connection Issues
```bash
# Symptoms: "MongoDB connection failed"
# Solutions:
1. Check MONGODB_URI format
2. Verify network access in MongoDB Atlas
3. Check firewall settings
4. Test connection string separately

# Quick test:
node -e "const mongoose = require('mongoose'); mongoose.connect('your-uri').then(() => console.log('Connected')).catch(console.error);"
```

#### Port Conflicts
```bash
# Symptoms: "Port already in use"
# Solutions:
1. Kill existing processes:
   sudo lsof -ti:4000 | xargs kill -9

2. Use different ports:
   PORT=4001 npm run dev

3. Check for other applications using ports
```

#### Environment Variables Not Loading
```bash
# Symptoms: "undefined" values for env vars
# Solutions:
1. Check .env file location (must be in Backend/)
2. Verify no spaces around = signs
3. Restart the server after changes
4. Check for typos in variable names
```

#### Payment Integration Issues
```bash
# Symptoms: Stripe payments failing
# Solutions:
1. Verify Stripe keys (test vs live)
2. Check webhook endpoints
3. Validate API version compatibility
4. Test with Stripe's test cards
```

#### Image Upload Problems
```bash
# Symptoms: Cloudinary upload failures
# Solutions:
1. Check API key and secret
2. Verify cloud name
3. Check file size limits
4. Validate image formats
```

## 🤝 Contributing

We welcome contributions!

**Quick Start for Contributors:**
1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes and test thoroughly
4. Commit with conventional commits: `git commit -m "feat: add amazing feature"`
5. Push to your branch: `git push origin feature/amazing-feature`
6. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](/LICENSE) file for details.

## 🙏 Acknowledgments

- React team for the amazing framework
- MongoDB for the robust database solution
- All contributors and community members
- Third-party service providers for their excellent APIs

---

**⭐ If this project helped you, please consider giving it a star on GitHub!**

**📢 Follow us for updates:**
- 💼 LinkedIn: [Hashan Samarakkodi](https://www.linkedin.com/in/hashan-samarakkody/)
