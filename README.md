# Andini Travels - Integrated Admin & Driver Portal

A high-performance, unified management ecosystem designed for Andini Travels. This platform bridges the gap between administrative operations and field drivers, providing real-time synchronization, automated logistics, and comprehensive business intelligence.

## 🌟 Core Portals

### 🏢 Admin Dashboard
The nerve center for operations, designed for efficiency and data integrity.
- **Dynamic Booking Engine**: Support for Round Trip, One Way, Drop, and Pick-up with complex fare logic.
- **Smart Logistics**: Automated driver assignment and real-time trip status tracking, including a dedicated "Driver Rejected" monitoring system.
- **Financial Intelligence**: Built-in fare calculators accounting for tolls, state taxes, driver allowances, and full Trip Cost Reconciliation for generating the Final Amount.
- **Business Reporting**: Detailed analytics and exportable reports for performance tracking.
- **WhatsApp Automation**: One-click itinerary generation for seamless customer communication with dynamically populated details.

### 🚗 Driver Portal
A mobile-first experience for drivers to manage their schedules and documentation.
- **Personalized Dashboard**: Real-time view of assigned, active, and completed trips.
- **Availability Management**: Interactive calendar for drivers to mark their working status.
- **Secure Document Vault**: Integrated upload system for Aadhaar, DL, and vehicle documentation.
- **Trip Execution**: Detailed route and customer information with one-touch navigation and automated pre-filled WhatsApp messaging.
- **Expense Submission**: Post-trip reconciliation form allowing drivers to submit tolls, parking, and additional driven kilometers (with smart, dynamic per-km cost auto-calculation).

## 💻 Tech Stack

- **Frontend**: React 19 (Vite)
- **Real-time Database**: Firebase Firestore (NoSQL)
- **Authentication**: Firebase Auth (Multi-role support)
- **Cloud Storage**: Supabase Storage (Optimized for secure document handling)
- **Data Visualization**: Recharts (Customized business metrics)
- **UI Architecture**: Vanilla CSS with a focus on high-performance rendering and responsive design.

## 🛠️ Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (LTS version recommended)
- Firebase Project with Firestore and Auth enabled
- Supabase Project with a Storage bucket named `driver-documents`

### Installation

1.  **Clone & Install**:
    ```bash
    git clone https://github.com/your-repo/andini-admin.git
    cd andini-admin
    npm install
    ```

2.  **Environment Configuration**:
    Create a `.env` file in the root directory:
    ```env
    # Firebase Configuration
    VITE_FIREBASE_API_KEY=your_key
    VITE_FIREBASE_AUTH_DOMAIN=your_domain
    VITE_FIREBASE_PROJECT_ID=your_id
    VITE_FIREBASE_STORAGE_BUCKET=your_bucket
    VITE_FIREBASE_MESSAGING_SENDER_ID=your_id
    VITE_FIREBASE_APP_ID=your_id

    # Supabase Configuration
    VITE_SUPABASE_URL=your_supabase_url
    VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
    VITE_SUPABASE_DRIVER_BUCKET=driver-documents
    ```

3.  **Development Workflow**:
    ```bash
    npm run dev
    ```

## 📁 Project Architecture

```text
src/
├── components/       # Reusable UI components and Protected Routes
├── context/          # Global state management (Auth, etc.)
├── pages/
│   ├── admin/        # Admin-exclusive interfaces
│   │   ├── Dashboard.jsx
│   │   ├── CreateBooking.jsx
│   │   ├── Customers.jsx
│   │   ├── Drivers.jsx
│   │   └── Reports.jsx
│   └── driver/       # Driver-exclusive interfaces
│       ├── DriverDashboard.jsx
│       ├── Availability.jsx
│       ├── DriverProfile.jsx
│       └── TripDetail.jsx
├── utils/            # Helper functions for calculations and uploads
└── supabase.js       # Supabase client initialization
```

## 🔐 Security & Integration

This project implements a unique **Hybrid Cloud Strategy**:
- **Authentication**: Centralized via Firebase.
- **Data**: Firestore handles all transactional and relational data.
- **Assets**: Supabase Storage manages high-resolution driver documents, using Firebase ID tokens for authenticated access.
- **Role-Based Access Control (RBAC)**: Enforced via `ProtectedRoute.jsx` and custom Firebase claims.

---
*Developed for Andini Travels.*
