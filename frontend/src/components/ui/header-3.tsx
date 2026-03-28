'use client';
import React from 'react';
import { cn } from "../../lib/utils";
import { createPortal } from 'react-dom';
import { 
    LucideIcon,
    CodeIcon,
	GlobeIcon,
	LayersIcon,
	UserPlusIcon,
	Users,
	Star,
	FileText,
	Shield,
	RotateCcw,
	Handshake,
	Leaf,
	HelpCircle,
	BarChart,
	PlugIcon,
    GraduationCap,
    LayoutDashboard,
    ShoppingBag,
    Briefcase,
    Settings,
    Menu,
    X,
    ChevronDown,
    User,
    LogOut
} from 'lucide-react';

type LinkItem = {
	title: string;
	href?: string;
	icon: LucideIcon;
	description?: string;
    onClick?: () => void;
};

interface HeaderProps {
    activeTab: 'dashboard' | 'marketplace' | 'gigs' | 'split' | 'settings';
    setActiveTab: (tab: any) => void;
    accountAddress: string | null;
    onLogout?: () => void;
    onConnect?: () => void;
}

export function Header({ activeTab, setActiveTab, accountAddress, onLogout, onConnect }: HeaderProps) {
	const [open, setOpen] = React.useState(false);
    const [explorerOpen, setExplorerOpen] = React.useState(false);
    const [userMenuOpen, setUserMenuOpen] = React.useState(false);
	const scrolled = useScroll(10);

	React.useEffect(() => {
		if (open) {
			document.body.style.overflow = 'hidden';
		} else {
			document.body.style.overflow = '';
		}
		return () => {
			document.body.style.overflow = '';
		};
	}, [open]);

    const mainLinks: LinkItem[] = [
        {
            title: 'Dashboard',
            icon: LayoutDashboard,
            description: 'Your campus financial overview',
            onClick: () => { setActiveTab('dashboard'); setOpen(false); setExplorerOpen(false); }
        },
        {
            title: 'Marketplace',
            icon: ShoppingBag,
            description: 'Buy and sell campus goods',
            onClick: () => { setActiveTab('marketplace'); setOpen(false); setExplorerOpen(false); }
        },
        {
            title: 'Campus Gigs',
            icon: Briefcase,
            description: 'Find tasks and earn ALGO',
            onClick: () => { setActiveTab('gigs'); setOpen(false); setExplorerOpen(false); }
        },
        {
            title: 'Split Expenses',
            icon: LayersIcon,
            description: 'Fair sharing with roommates',
            onClick: () => { setActiveTab('split'); setOpen(false); setExplorerOpen(false); }
        }
    ];

	return (
		<header
			className={cn('sticky top-0 z-50 w-full border-b border-transparent transition-all duration-300', {
				'bg-black/60 border-white/10 backdrop-blur-xl py-2': scrolled,
                'bg-transparent py-4': !scrolled
			})}
		>
			<nav className="mx-auto flex h-14 w-full max-w-7xl items-center justify-between px-6">
				<div className="flex items-center gap-8">
					<div 
                        className="flex items-center gap-2 cursor-pointer group"
                        onClick={() => setActiveTab('dashboard')}
                    >
						<div className="bg-gradient-to-br from-violet-600 to-blue-500 p-1.5 rounded-lg group-hover:rotate-12 transition-transform shadow-[0_0_20px_rgba(139,92,246,0.3)]">
                            <GraduationCap className="w-5 h-5 text-white" />
                        </div>
                        <span className="font-black text-xl tracking-tighter text-white">CAMPUS PAY</span>
					</div>
					<div className="hidden md:flex items-center gap-2">
                        {/* Features now in User Dropdown */}
					</div>
				</div>

				<div className="hidden items-center gap-4 md:flex">
					{accountAddress ? (
                        <div className="relative">
                            <button 
                                onClick={() => setUserMenuOpen(!userMenuOpen)}
                                className="flex items-center gap-3 px-4 py-2 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
                            >
                                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.6)]" />
                                <span className="text-sm font-bold text-white uppercase tracking-tight">User</span>
                                <ChevronDown className={cn("w-4 h-4 text-zinc-500 transition-transform", userMenuOpen && "rotate-180")} />
                            </button>

                            {userMenuOpen && (
                                <div className="absolute top-full right-0 mt-2 w-[280px] glass-card rounded-2xl shadow-2xl p-3 animate-in fade-in slide-in-from-top-2 border border-white/10">
                                    <div className="px-3 py-2 border-b border-white/5 mb-2">
                                        <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">Connected Wallet</p>
                                        <p className="text-xs font-mono text-white truncate">{accountAddress}</p>
                                    </div>
                                    <div className="space-y-1">
                                        {mainLinks.map((item, i) => (
                                            <button
                                                key={i}
                                                onClick={() => { item.onClick!(); setUserMenuOpen(false); }}
                                                className={cn(
                                                    "w-full flex items-center gap-3 p-2.5 rounded-xl transition-all hover:bg-white/5 group",
                                                    activeTab === item.title.toLowerCase().split(' ')[1] ? "bg-white/5" : ""
                                                )}
                                            >
                                                <div className="p-2 rounded-lg bg-white/5 border border-white/10 group-hover:bg-violet-500/20 group-hover:text-violet-400 transition-colors">
                                                    <item.icon className="w-4 h-4" />
                                                </div>
                                                <div className="text-left">
                                                    <p className="text-sm font-bold text-white leading-none mb-1">{item.title}</p>
                                                    <p className="text-[10px] text-zinc-500 leading-none">{item.description}</p>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                    <div className="mt-2 pt-2 border-t border-white/5">
                                        <button
                                            onClick={() => { onLogout?.(); setUserMenuOpen(false); }}
                                            className="w-full flex items-center gap-3 p-2.5 rounded-xl transition-all hover:bg-red-500/10 text-zinc-400 hover:text-red-400 group"
                                        >
                                            <div className="p-2 rounded-lg bg-white/5 border border-white/10 group-hover:bg-red-500/20 group-hover:border-red-500/30 transition-colors">
                                                <LogOut className="w-4 h-4" />
                                            </div>
                                            <span className="text-sm font-bold leading-none">Log Out</span>
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <button 
                            onClick={onConnect}
                            className="px-6 py-2 rounded-full border border-white/10 bg-transparent text-white hover:bg-white/5 font-bold transition-all"
                        >
                            Connect Wallet
                        </button>
                    )}
				</div>

				<button
					onClick={() => setOpen(!open)}
					className="md:hidden p-2 text-white hover:bg-white/10 rounded-xl transition-all"
					aria-expanded={open}
					aria-label="Toggle menu"
				>
					{open ? <X className="size-6" /> : <Menu className="size-6" />}
				</button>
			</nav>

			<MobileMenu open={open} className="flex flex-col justify-between gap-6 overflow-y-auto pb-8">
				<div className="flex w-full flex-col gap-y-4">
					<span className="text-xs font-bold uppercase tracking-widest text-zinc-500">Navigation</span>
					{mainLinks.map((link) => (
						<button 
                            key={link.title} 
                            onClick={link.onClick}
                            className="flex items-center gap-4 p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] transition-colors text-left"
                        >
                            <div className="p-2 rounded-xl bg-white/5 border border-white/10">
                                <link.icon className="w-5 h-5 text-white" />
                            </div>
                            <div className="flex flex-col text-white">
                                <span className="font-bold">{link.title}</span>
                                <span className="text-xs text-zinc-500">{link.description}</span>
                            </div>
                        </button>
					))}
				</div>
				<div className="flex flex-col gap-3">
					<button 
                        onClick={() => {
                            if (accountAddress) onLogout?.();
                            else onConnect?.();
                            setOpen(false);
                        }}
                        className={cn(
                            "w-full rounded-2xl py-6 font-bold transition-all border",
                            accountAddress 
                                ? "bg-red-500/10 border-red-500/20 text-red-400 hover:bg-red-500/20" 
                                : "bg-transparent border-white/10 text-white hover:bg-white/5"
                        )}
                    >
                        {accountAddress ? (
                            <div className="flex items-center justify-center gap-2">
                                <LogOut className="w-5 h-5" />
                                <span>Log Out</span>
                            </div>
                        ) : 'Connect Wallet'}
					</button>
				</div>
			</MobileMenu>
		</header>
	);
}

type MobileMenuProps = React.ComponentProps<'div'> & {
	open: boolean;
};

function MobileMenu({ open, children, className, ...props }: MobileMenuProps) {
	if (!open || typeof window === 'undefined') return null;

	return createPortal(
		<div
			id="mobile-menu"
			className={cn(
				'bg-[#0a0a0f]/95 backdrop-blur-2xl transition-all duration-300',
				'fixed inset-0 top-14 z-[400] flex flex-col overflow-hidden md:hidden animate-in fade-in slide-in-from-top-4',
			)}
		>
			<div
				className={cn(
					'size-full p-6 flex flex-col',
					className,
				)}
				{...props}
			>
				{children}
			</div>
		</div>,
		document.body,
	);
}

function ListItem({
	title,
	description,
	icon: Icon,
	className,
    onClick,
	...props
}: any) {
	return (
		<div 
            className={cn(
                'w-full flex items-start gap-3 rounded-xl p-3 transition-all hover:bg-white/5 group cursor-pointer border border-transparent hover:border-white/10',
                className
            )} 
            onClick={onClick}
        >
            <div className="flex-shrink-0 bg-white/5 flex aspect-square size-10 items-center justify-center rounded-lg border border-white/10 group-hover:scale-110 transition-transform">
                <Icon className="text-zinc-400 group-hover:text-white size-5" />
            </div>
            <div className="flex flex-col items-start justify-center">
                <span className="font-bold text-sm text-zinc-300 group-hover:text-white">{title}</span>
                <span className="text-zinc-600 text-[11px] leading-tight line-clamp-1">{description}</span>
            </div>
		</div>
	);
}

function useScroll(threshold: number) {
	const [scrolled, setScrolled] = React.useState(false);

	const onScroll = React.useCallback(() => {
		setScrolled(window.scrollY > threshold);
	}, [threshold]);

	React.useEffect(() => {
		window.addEventListener('scroll', onScroll);
		return () => window.removeEventListener('scroll', onScroll);
	}, [onScroll]);

	React.useEffect(() => {
		onScroll();
	}, [onScroll]);

	return scrolled;
}
