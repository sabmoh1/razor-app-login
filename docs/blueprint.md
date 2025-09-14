# **App Name**: LoginFlow

## Core Features:

- Email Input: Allow users to enter their email address in a styled text input field.
- Password Input: Enable users to securely enter their password with an option to toggle visibility.
- Authentication Check: Simulate a secure login by checking the entered credentials against hardcoded credentials (email 'test@example.com' and password 'password123') without any external database or authentication service. This tool simulates security by accepting these credentials, rejecting others.
- Success Indicator: If authentication succeeds, display a simple UI confirmation message, such as redirecting to a 'Welcome' page.
- Error Message: If authentication fails, show an error message on the UI.
- Firebase Authentication: Integrate Firebase Authentication to securely manage user accounts and authentication flow.

## Style Guidelines:

- Primary color: Moderate cyan (#4FC3F7), suggesting trust and security, for the login button and primary interactive elements.
- Background color: Light cyan (#E0F7FA), providing a clean and unobtrusive backdrop.
- Accent color: Soft blue (#64B5F6) to highlight less prominent elements and interactive states.
- Font: 'Inter', a sans-serif font for all text, offering a clean and modern readability.
- Simple, outline-style icons for input fields (e.g., email icon, password lock icon) to enhance usability without distraction.
- Centered form layout with a clean, single-column design for easy interaction on all devices.
- Subtle fade-in animations on the error or success messages for non-intrusive feedback.