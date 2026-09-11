import { BottomNav } from './BottomNav';

interface SuperAdminLayoutProps {
  children: React.ReactNode;
}

export const SuperAdminLayout = ({ children }: SuperAdminLayoutProps) => {
  return (
    <div className="min-h-screen bg-background">
      <main className="relative">
        {children}
      </main>
      <BottomNav />
    </div>
  );
};