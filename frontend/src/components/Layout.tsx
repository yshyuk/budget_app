import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from './ui/Button';
import { Home, Receipt, Wallet, Heart } from 'lucide-react';
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
        { path: '/dashboard', label: '대시보드', mobileLabel: '홈', icon: Home },
        { path: '/transactions', label: '거래 내역', mobileLabel: '거래', icon: Receipt },
        { path: '/budgets', label: '예산 관리', mobileLabel: '예산', icon: Wallet },
        { path: '/wishlist', label: '위시리스트', mobileLabel: '위시', icon: Heart },
    ];

    return (
        <div className="min-h-screen bg-background font-sans text-foreground pb-16 md:pb-0">
            {/* 상단 네비게이션 */}
            <nav className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="container mx-auto flex h-16 items-center space-x-4 sm:justify-between sm:space-x-0 px-4 md:px-8">
                    <div className="flex gap-6 md:gap-10">
                        <Link to="/dashboard" className="flex items-center space-x-2">
                            <span className="inline-block font-bold text-xl">가계부</span>
                        </Link>
                        {/* 데스크탑 메뉴 */}
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
                                로그아웃
                            </Button>
                        </nav>
                    </div>
                </div>
            </nav>
            <main className="container mx-auto py-6 md:py-10 pb-20 md:pb-10 animate-fade-in-up px-4 md:px-8">
                {children}
            </main>

            {/* 모바일 바텀 네비게이션 */}
            <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background border-t">
                <div className="grid grid-cols-4 h-16">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const active = isActive(item.path);
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={`flex flex-col items-center justify-center gap-1 transition-colors ${active
                                    ? 'text-primary'
                                    : 'text-muted-foreground hover:text-foreground'
                                    }`}
                            >
                                <Icon className={`h-5 w-5 ${active ? 'fill-current' : ''}`} />
                                <span className="text-xs font-medium">{item.mobileLabel}</span>
                            </Link>
                        );
                    })}
                </div>
            </nav>
        </div>
    );
}
