# JobSync.fyi

A modern, AI-powered job application tracking platform that automatically organizes your job search by forwarding application emails to your personal JobSync address. Built with React, Firebase, and Google's Gemini AI.

## 🚀 Features

### Core Features

- **Smart Email Forwarding**: Get your unique email address (e.g., `ABC123@jobsync.fyi`) and forward job application emails to automatically track them
- **AI-Powered Email Parsing**: Gemini AI automatically extracts company names, job titles, locations, salaries, and application stages from emails
- **Intelligent Stage Detection**: AI determines whether an email is an application confirmation, screening update, interview invitation, offer, or rejection
- **Dynamic Application Timeline**: Visual timeline showing your progress through each stage with email history
- **Real-time Dashboard**: Track all applications with filterable views (Active, Today's Updates, Applied, Screening, Interviews, Offers, Rejected)
- **Advanced Analytics**: Comprehensive analytics dashboard with activity trends, stage distribution, application funnel, and response time analysis

### Management Features

- **Manual Application Entry**: Add applications manually if they don't arrive via email
- **Edit Applications**: Update job details, stages, locations, salaries, and recruiter contacts
- **Email Stage Management**: Move individual emails between stages and automatically sync with the job's current stage
- **Duplicate Detection**: Automatically identifies and merges duplicate job applications
- **Delete Applications**: Remove unwanted applications and all associated data
- **Profile Management**: Edit your full name and manage account settings with a modern modal interface

### User Experience

- **User Authentication**: Secure sign up with email/password or Google OAuth
- **Custom Email Codes**: Personalize your JobSync email address (up to 10 characters, alphanumeric)
- **Dark/Light Theme**: Toggle between dark and light modes for comfortable viewing
- **Fully Responsive**: Beautiful UI that works seamlessly on desktop, tablet, and mobile
- **Instant Updates**: Optimized UI updates without full page reloads
- **Analytics Integration**: Track user engagement and page views with Google Analytics
- **Interactive Charts**: Hover effects and tooltips on all analytics charts for better user experience
- **Modal Interfaces**: Modern modal dialogs for editing with blur backgrounds and smooth animations

## 🛠️ Tech Stack

### Frontend

- **React 19** - UI library
- **Vite** - Build tool and development server
- **React Router DOM** - Client-side routing
- **Tailwind CSS 4** - Utility-first CSS framework

### Backend

- **Firebase Authentication** - User management with email/password and Google OAuth
- **Firebase Firestore** - NoSQL database for storing users, jobs, job_details, and emails
- **Firebase Cloud Functions** - Serverless backend for email processing
- **Firebase Hosting** - Static site hosting
- **Google Gemini 2.0 Flash** - AI model for intelligent email parsing and data extraction
- **CloudMailin** - Email receiving service that forwards emails to Firebase Functions

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher)
- **npm** or **yarn**
- **Firebase CLI** (`npm install -g firebase-tools`)

## 🔧 Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/yourusername/JobSync.fyi.git
   cd JobSync.fyi
   ```

2. **Install dependencies**

   ```bash
   # Install frontend dependencies
   npm install

   # Install Firebase Functions dependencies
   cd functions
   npm install
   cd ..
   ```

3. **Set up environment variables**

   Create a `.env` file in the root directory with your Firebase configuration:

   ```env
   # Firebase Configuration
   VITE_FIREBASE_API_KEY=your_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id

   # Email Domain
   VITE_EMAIL_DOMAIN=jobsync.fyi

   # Google Analytics
   VITE_GA_MEASUREMENT_ID=your_ga_id
   ```

   Create a `functions/.env` file for Cloud Functions:

   ```env
   # Google Gemini AI API Key
   GEMINI_API_KEY=your_gemini_api_key
   ```

4. **Configure Firebase**
   ```bash
   firebase login
   firebase init
   ```

## 🚀 Development

### Run the development server

```bash
npm run dev
```

The application will be available at `http://localhost:5173`

### Run Firebase Functions locally

```bash
cd functions
npm run serve
```

### Build for production

```bash
npm run build
```

### Preview production build

```bash
npm run preview
```

## 📁 Project Structure

```
JobSync.fyi/
├── src/
│   ├── assets/          # Static assets (images, logos)
│   ├── components/      # Reusable React components
│   ├── contexts/        # React Context providers
│   │   └── GlobalProvider.jsx  # Auth and user data context
│   ├── lib/             # Core library functions
│   │   ├── firebase.js  # Firebase configuration and initialization
│   │   ├── jobs.js      # Job CRUD operations and data transformation
│   │   └── users.js     # User authentication and management
│   ├── nav/             # Navigation components
│   │   └── Nav.jsx      # Main navigation bar
│   ├── pages/           # Page components
│   │   ├── dashboard/   # Dashboard and job tracking
│   │   │   ├── Dashboard_Main.jsx      # Main dashboard view
│   │   │   └── components/
│   │   │       ├── Role_Edit.jsx       # Edit job modal
│   │   │       ├── Email_Details.jsx   # Email timeline modal
│   │   │       ├── Manual_Apply.jsx    # Manual job entry modal
│   │   │       ├── Type_Select.jsx     # Stage selector modal
│   │   │       └── Delete_Confirmation.jsx  # Delete confirmation modal
│   │   ├── user/        # User authentication pages
│   │   │   ├── Sign_In.jsx
│   │   │   ├── Sign_Up.jsx
│   │   │   ├── Forgot_PW.jsx
│   │   │   ├── Profile.jsx
│   │   │   └── components/
│   │   │       └── Edit_Username.jsx  # Modal for editing user's full name
│   │   ├── Home.jsx     # Landing page
│   │   ├── About.jsx    # About page
│   │   ├── Terms.jsx    # Terms of service
│   │   └── Privacy.jsx  # Privacy policy
│   ├── theme/           # Theme configuration
│   │   └── Theme.jsx    # Dark/light theme settings
│   ├── toast/           # Toast notification system
│   │   └── Toast.jsx    # Toast notifications
│   ├── utils/           # Utility functions
│   │   └── analytics.js # Google Analytics integration
│   ├── App.jsx          # Main App component with routing
│   ├── main.jsx         # Entry point
│   └── index.css        # Global Tailwind CSS styles
├── functions/           # Firebase Cloud Functions
│   ├── index.js         # receiveEmail function for email processing
│   ├── test-ai.js       # AI testing utility
│   └── package.json     # Functions dependencies
├── public/              # Public static files
├── dist/                # Production build output
├── firebase.json        # Firebase project configuration
├── firestore.rules      # Firestore security rules
├── firestore.indexes.json  # Firestore composite indexes
├── vite.config.js       # Vite configuration
├── tailwind.config.js   # Tailwind CSS configuration
└── package.json         # Project dependencies
```

## 🔥 Firebase Deployment

### Deploy entire project

```bash
firebase deploy
```

### Deploy only hosting

```bash
firebase deploy --only hosting
```

### Deploy only functions

```bash
firebase deploy --only functions
```

### Deploy only Firestore rules

```bash
firebase deploy --only firestore:rules
```

### Deploy only Firestore indexes

```bash
firebase deploy --only firestore:indexes
```

## 🗄️ Database Schema

### Collections

**users**

- `uid` - Firebase Auth user ID
- `name` - User's full name
- `email` - User's email address
- `emailCode` - Unique 6-10 character code (e.g., "ABC123")
- `forwardingEmail` - Full forwarding email (e.g., "ABC123@jobsync.fyi")
- `plan` - Subscription plan (default: "free")
- `createdAt` - Account creation timestamp
- `updatedAt` - Last profile update timestamp

**jobs**

- `Company` - Company name
- `Job_Title` - Position title
- `Location` - Job location
- `Salary` - Salary information
- `Contact` - Recruiter/contact email
- `Current_Stage` - Current application stage (applied, screening, interview1-6, offer, rejected)
- `Applied_Date` - Application submission date
- `Last_Updated` - Last modification timestamp
- `Tracking_Code` - User's email tracking code
- `User_ID` - Reference to users collection
- `Email_IDs` - Array of associated email IDs
- `Notes` - User notes

**job_details**

- `Job_ID` - Reference to jobs collection
- `Email_ID` - Reference to mailin collection
- `Stage` - Stage this email represents
- `Sender` - Email sender address
- `Subject` - Email subject line
- `Content_Summary` - AI-generated summary
- `Sent_Date` - Email sent date (formatted string)
- `Update_Time` - Processing timestamp
- `Tracking_Code` - User's email tracking code
- `User_ID` - Reference to users collection

**mailin**

- `Forwarder_Email` - User's personal email that forwarded the message
- `Original_Sender` - Original email sender
- `Original_Sent_At` - Original email timestamp
- `Subject` - Email subject
- `Content_Text` - Plain text content
- `Content_HTML` - HTML content
- `Content_Details` - Cleaned content for AI processing
- `Processed` - Processing status (boolean)
- `Processing_Status` - Status (pending, processing, completed, failed)
- `Processing_Error` - Error message if failed
- `Tracking_Code` - User's email tracking code
- `Received_At` - Timestamp when received by CloudMailin

## 📱 Available Routes

- `/` - Home page with feature overview
- `/about` - About us page with analytics highlight for authenticated users
- `/Sign_In` - User sign in (email/password or Google)
- `/Sign_Up` - User registration
- `/Forgot_PW` - Password recovery
- `/profile` - User profile and settings with modern modal editing
- `/dashboard` - Job application dashboard (protected)
- `/Analytics` - Advanced analytics dashboard with interactive charts (protected)
- `/terms` - Terms of service
- `/privacy` - Privacy policy

## 🔄 How It Works

1. **Sign Up**: Create an account and get your unique forwarding email (e.g., `ABC123@jobsync.fyi`)
2. **Forward Emails**: Forward any job application emails to your JobSync address
3. **AI Processing**: Gemini AI automatically extracts:
   - Company name
   - Job title
   - Location
   - Salary (if mentioned)
   - Application stage (applied, screening, interview, offer, rejected)
   - Email summary
4. **Track Progress**: View all your applications in the dashboard with visual timelines
5. **Stay Organized**: Filter by status, search by company/position, and manage your job search efficiently

## 🤖 AI Email Processing

The AI processing pipeline:

1. **Email Reception**: CloudMailin receives emails forwarded to `{CODE}@jobsync.fyi`
2. **Content Extraction**: Clean and extract relevant content from HTML/plain text
3. **AI Analysis**: Gemini 2.0 Flash analyzes the email to determine:
   - Is this a job application email?
   - What company sent it?
   - What position is it for?
   - What stage does this email represent?
   - What are the key details (location, salary, next steps)?
4. **Database Update**:
   - Create or update job entry in `jobs` collection
   - Store email details in `job_details` collection
   - Keep original email in `mailin` collection
5. **Stage Synchronization**: Automatically sync stages between job_details and jobs collections

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is private and proprietary.

## 👤 Author

**Ying Xie**

## 🙏 Acknowledgments

- **React Team** - For the amazing React 19 library
- **Firebase Team** - For the comprehensive backend-as-a-service platform
- **Google Gemini AI** - For powerful AI capabilities in email analysis
- **Tailwind CSS** - For the utility-first CSS framework
- **CloudMailin** - For reliable email receiving service
- **Vite Team** - For the blazing fast build tool

## 🔒 Security Notes

- Never commit `.env` files to version control
- Keep your Firebase configuration and API keys secure
- Firestore security rules are configured to protect user data
- Email forwarding addresses are unique per user
- All authentication is handled securely by Firebase Auth

## 📊 Performance Optimizations

- Optimized state updates to avoid unnecessary re-renders
- Lazy loading of routes with React Router
- Efficient Firestore queries with proper indexing
- Batched database updates for improved performance
- Client-side data transformation and caching

## 🐛 Known Issues & Future Improvements

- [ ] Add email templates for better AI parsing
- [ ] Implement bulk email import
- [ ] Add calendar integration for interview scheduling
- [ ] Export applications to CSV/PDF
- [ ] Mobile app version
- [ ] Email notification system
- [ ] Advanced analytics and insights

---

**Note**: Make sure to configure your Firebase project, set up CloudMailin, obtain a Gemini API key, and add the appropriate environment variables before running the application.
