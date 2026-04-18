import './globals.css';

export const metadata = {
  title: 'TimeTracker Pro',
  description: 'Time tracking & project management',
};

export default function RootLayout({ children }) {
  return (
    <html lang="ro">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="bg-gray-50 text-gray-900 antialiased">{children}</body>
    </html>
  );
}
