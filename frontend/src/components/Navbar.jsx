import React, { useState, useRef, useEffect } from 'react';
import { 
  Receipt, 
  LayoutDashboard, 
  History, 
  BarChart3, 
  PlusCircle, 
  Menu, 
  X,
  Sparkles,
  User,
  LogOut,
  ChevronDown,
  RefreshCw,
  Phone,
  Mail,
  ShieldCheck
} from 'lucide-react';

export const Navbar = ({ 
  activeTab, 
  setActiveTab, 
  onOpenAddModal,
  currentUser,
  onOpenAuthModal,
  onLogout 
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setProfileDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'purchases', label: 'Purchase History', icon: History },
    { id: 'reports', label: 'Reports & Analytics', icon: BarChart3 },
  ];

  const getInitials = (name) => {
    if (!name) return 'U';
    const parts = name.trim().split(/\s+/);
    if (parts.length > 1) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo & Name */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab('dashboard')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-sm shadow-emerald-500/20">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg text-slate-900 tracking-tight">
                  My Purchase Tracker
                </span>
                <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-semibold uppercase px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <Sparkles className="w-3 h-3" /> GST Ready
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">Daily expense & purchase manager</p>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-emerald-50 text-emerald-700 font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-600' : 'text-slate-400'}`} />
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* User Profile Pill & Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Add Purchase Button */}
            <button
              onClick={onOpenAddModal}
              className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs sm:text-sm font-semibold shadow-sm shadow-emerald-600/25 transition-all"
            >
              <PlusCircle className="w-4 h-4" />
              <span className="hidden xs:inline">Add Purchase</span>
              <span className="xs:hidden">Add</span>
            </button>

            {/* User Account / Profile */}
            {currentUser ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  className="flex items-center gap-2 p-1 sm:px-3 sm:py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 transition-all text-slate-700 text-xs sm:text-sm font-medium"
                >
                  {currentUser.photo_url ? (
                    <img
                      src={currentUser.photo_url}
                      alt={currentUser.name}
                      className="w-7 h-7 rounded-full object-cover border border-emerald-500"
                    />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xs">
                      {getInitials(currentUser.name || currentUser.phone || currentUser.email)}
                    </div>
                  )}
                  <span className="hidden md:inline max-w-[120px] truncate font-medium">
                    {currentUser.name || currentUser.phone || currentUser.email}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>

                {/* Dropdown Menu */}
                {profileDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-50 animate-fade-in">
                    <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/70">
                      <p className="text-xs font-semibold text-slate-900 truncate">
                        {currentUser.name || 'Active Account'}
                      </p>
                      <p className="text-[11px] text-slate-500 truncate mt-0.5 flex items-center gap-1.5">
                        {currentUser.phone ? (
                          <>
                            <Phone size={12} className="text-slate-400" />
                            <span>{currentUser.phone}</span>
                          </>
                        ) : (
                          <>
                            <Mail size={12} className="text-slate-400" />
                            <span>{currentUser.email}</span>
                          </>
                        )}
                      </p>
                      <div className="mt-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                        <ShieldCheck size={11} />
                        <span>Private Cloud Workspace</span>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setProfileDropdownOpen(false);
                        onOpenAuthModal();
                      }}
                      className="w-full px-4 py-2.5 text-left text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 transition-colors"
                    >
                      <RefreshCw size={14} className="text-indigo-600" />
                      <span>Switch / Add Another Account</span>
                    </button>

                    <button
                      onClick={() => {
                        setProfileDropdownOpen(false);
                        onLogout();
                      }}
                      className="w-full px-4 py-2.5 text-left text-xs font-medium text-rose-600 hover:bg-rose-50 flex items-center gap-2.5 transition-colors border-t border-slate-100"
                    >
                      <LogOut size={14} className="text-rose-500" />
                      <span>Log Out</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={onOpenAuthModal}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs sm:text-sm font-semibold transition-all"
              >
                <User size={15} />
                <span>Log In</span>
              </button>
            )}

            {/* Mobile Hamburger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-slate-500 hover:bg-slate-100"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden py-3 border-t border-slate-100 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium ${
                    isActive
                      ? 'bg-emerald-50 text-emerald-700 font-semibold'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-600' : 'text-slate-400'}`} />
                  {item.label}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </header>
  );
};
