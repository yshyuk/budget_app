import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from './ui/Button';
import type { ReactNode } from 'react';

export default function Layout({ children }: { children: ReactNode }) {
    const { user, signOut } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const handleSignOut = async () => {
        const { error } = await signOut();
        if (!error) {
            navigate('/login');
        }
    };

    const isActive = (path: string) => location.pathname === path;

    const navItems = [
        { path: '/dashboard', label: 'Dashboard' },
        { path: '/transactions', label: 'Transactions' },
        { path: '/budgets', label: 'Budgets' },
        { path: '/wishlist', label: 'Wishlist' },
    ];

    return (
        <div className="min-h-screen bg-background font-sans text-foreground">
            <nav className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="container flex h-16 items-center space-x-4 sm:justify-between sm:space-x-0">
                    <div className="flex gap-6 md:gap-10">
                        <Link to="/dashboard" className="flex items-center space-x-2">
                            <span className="inline-block font-bold text-xl">Budget App</span>
                        </Link>
                        <div className="hidden md:flex gap-6">
                            {navItems.map((item) => (
                                <Link
                                    key={item.path}
                                    to={item.path}
                                    className={`flex items-center text-sm font-medium transition-colors hover:text-primary ${isActive(item.path) ? 'text-foreground' : 'text-muted-foreground'
                                        }`}
                                >
                                    {item.label}
                                </Link>
                            ))}
                        </div>
                    </div>
                    <div className="flex flex-1 items-center justify-end space-x-4">
                        <nav className="flex items-center space-x-2">
                            <span className="text-sm text-muted-foreground hidden md:inline-block mr-2">
                                {user?.email}
                            </span>
                            <Button variant="ghost" size="sm" onClick={handleSignOut}>
                                Sign Out
                            </Button>
                        </nav>
                    </div>
                </div>
            </nav>
            <main className="container py-6 md:py-10">
                {children}
            </main>
        </div>
    );
}
