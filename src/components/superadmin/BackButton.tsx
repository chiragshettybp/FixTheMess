import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

interface BackButtonProps {
  to?: string;
  label?: string;
  className?: string;
}

export const BackButton = ({ to, label, className }: BackButtonProps) => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleBack = () => {
    if (to) {
      navigate(to);
      return;
    }

    // Smart back navigation based on current route
    const currentPath = location.pathname;
    
    if (currentPath === '/superadmin') {
      // Already on main dashboard, go to home
      navigate('/home');
    } else if (currentPath.includes('/view-') || currentPath.includes('/edit-')) {
      // From detail/edit pages, go back to the list page
      if (currentPath.includes('user')) {
        navigate('/superadmin/users');
      } else if (currentPath.includes('govuser')) {
        navigate('/superadmin/govuser');
      } else if (currentPath.includes('report')) {
        navigate('/superadmin/reports');
      } else if (currentPath.includes('flag-report')) {
        navigate('/superadmin/flag-reports');
      } else {
        navigate('/superadmin');
      }
    } else {
      // From any other superadmin page, go back to dashboard
      navigate('/superadmin');
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleBack}
      className={`flex items-center gap-2 hover:bg-muted ${className || ''}`}
    >
      <ArrowLeft className="h-4 w-4" />
      {label || 'Back'}
    </Button>
  );
};