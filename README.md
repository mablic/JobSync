# JobSync.fyi

A modern job application tracking web application built with React, Firebase, and AI-powered features to help users manage their job search process efficiently.

## 🚀 Features

- **User Authentication**: Secure sign up, sign in, and password recovery
- **Job Application Dashboard**: Track and manage all your job applications in one place
- **Email Integration**: Parse and extract job details from emails
- **Manual Entry**: Add job applications manually with a user-friendly interface
- **Role Management**: Edit and organize job application details
- **AI-Powered**: Leverage Google's Gemini AI for intelligent job data extraction
- **Dark/Light Theme**: Toggle between dark and light modes for comfortable viewing
- **Responsive Design**: Fully responsive UI built with Tailwind CSS
- **Analytics**: Track user engagement and page views

## 🛠️ Tech Stack

### Frontend

- **React 19** - UI library
- **Vite** - Build tool and development server
- **React Router DOM** - Client-side routing
- **Tailwind CSS 4** - Utility-first CSS framework

### Backend

- **Firebase Authentication** - User management
- **Firebase Firestore** - NoSQL database
- **Firebase Cloud Functions** - Serverless backend
- **Google Gemini AI** - AI-powered features

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

   Create a `.env` file in the root directory with your configuration:

   ```env
   # Add your environment variables here
   VITE_FIREBASE_API_KEY=your_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
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
│   ├── assets/          # Static assets (images, etc.)
│   ├── components/      # Reusable React components
│   ├── contexts/        # React Context providers
│   │   └── GlobalProvider.jsx
│   ├── lib/             # Utility libraries
│   │   ├── firebase.js  # Firebase configuration
│   │   ├── emailCode.js # Email parsing logic
│   │   ├── jobs.js      # Job-related functions
│   │   └── users.js     # User-related functions
│   ├── nav/             # Navigation components
│   │   └── Nav.jsx
│   ├── pages/           # Page components
│   │   ├── dashboard/   # Dashboard pages and components
│   │   ├── user/        # User authentication pages
│   │   ├── Home.jsx
│   │   └── About.jsx
│   ├── theme/           # Theme configuration
│   │   └── Theme.jsx
│   ├── toast/           # Toast notification system
│   │   └── Toast.jsx
│   ├── utils/           # Utility functions
│   │   └── analytics.js
│   ├── App.jsx          # Main App component
│   ├── main.jsx         # Entry point
│   └── index.css        # Global styles
├── functions/           # Firebase Cloud Functions
│   ├── index.js         # Functions entry point
│   └── package.json     # Functions dependencies
├── public/              # Public static files
├── dist/                # Production build output
├── firebase.json        # Firebase configuration
├── vite.config.js       # Vite configuration
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

## 📱 Available Routes

- `/` - Home page
- `/about` - About page
- `/Sign_In` - User sign in
- `/Sign_Up` - User registration
- `/Forgot_PW` - Password recovery
- `/profile` - User profile
- `/dashboard` - Job application dashboard
- `/terms` - Terms of service
- `/privacy` - Privacy policy

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

- React team for the amazing library
- Firebase for the comprehensive backend solution
- Google for Gemini AI integration
- Tailwind CSS for the utility-first CSS framework

---

**Note**: Make sure to configure your Firebase project and add the appropriate environment variables before running the application.
