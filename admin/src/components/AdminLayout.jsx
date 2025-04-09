// Path: /frontend/src/components/admin/AdminLayout.jsx
import React, { useState } from 'react';
import { Link, Outlet } from 'react-router-dom';
import { FiHome, FiShoppingBag, FiUsers, FiBarChart2, FiSettings, FiLogOut, FiMenu, FiX } from 'react-icons/fi';

const AdminLayout = () => {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const toggleSidebar = () => {
        setSidebarOpen(!sidebarOpen);
    };

    return (
        <div className="flex h-screen bg-gray-100">
            {/* Sidebar */}
            <div className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'
                } fixed inset-y-0 left-0 z-30 w-64 transform overflow-y-auto bg-gray-900 transition duration-300 ease-in-out lg:static lg:inset-0 lg:translate-x-0`}>
                <div className="flex items-center justify-between px-6 py-4">
                    <div className="text-2xl font-bold text-white">Admin Panel</div>
                    <button className="lg:hidden text-gray-300 hover:text-white" onClick={toggleSidebar}>
                        <FiX size={24} />
                    </button>
                </div>
                <nav className="mt-8 space-y-2 px-6">
                    <Link
                        to="/admin"
                        className="flex items-center px-4 py-3 text-gray-300 hover:bg-gray-800 hover:text-white rounded-lg"
                    >
                        <FiHome className="mr-3" />
                        Dashboard
                    </Link>
                    <Link
                        to="/admin/products"
                        className="flex items-center px-4 py-3 text-gray-300 hover:bg-gray-800 hover:text-white rounded-lg"
                    >
                        <FiShoppingBag className="mr-3" />
                        Products
                    </Link>
                    <Link
                        to="/admin/orders"
                        className="flex items-center px-4 py-3 text-gray-300 hover:bg-gray-800 hover:text-white rounded-lg"
                    >
                        <FiBarChart2 className="mr-3" />
                        Orders
                    </Link>
                    <Link
                        to="/admin/users"
                        className="flex items-center px-4 py-3 text-gray-300 hover:bg-gray-800 hover:text-white rounded-lg"
                    >
                        <FiUsers className="mr-3" />
                        Users
                    </Link>
                    <Link
                        to="/admin/analytics"
                        className="flex items-center px-4 py-3 text-gray-300 hover:bg-gray-800 hover:text-white rounded-lg"
                    >
                        <FiBarChart2 className="mr-3" />
                        Analytics
                    </Link>
                    <Link
                        to="/admin/settings"
                        className="flex items-center px-4 py-3 text-gray-300 hover:bg-gray-800 hover:text-white rounded-lg"
                    >
                        <FiSettings className="mr-3" />
                        Settings
                    </Link>
                    <Link
                        to="/logout"
                        className="flex items-center px-4 py-3 text-gray-300 hover:bg-gray-800 hover:text-white rounded-lg"
                    >
                        <FiLogOut className="mr-3" />
                        Logout
                    </Link>
                </nav>
            </div>

            {/* Content area */}
            <div className="flex flex-1 flex-col overflow-hidden">
                {/* Top navbar */}
                <header className="bg-white shadow-sm">
                    <div className="flex items-center justify-between p-4">
                        <button
                            className="lg:hidden text-gray-600 hover:text-gray-900"
                            onClick={toggleSidebar}
                        >
                            <FiMenu size={24} />
                        </button>
                        <div className="ml-auto flex items-center space-x-4">
                            <div className="text-sm font-medium text-gray-900">Admin User</div>
                            <div className="h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center">
                                A
                            </div>
                        </div>
                    </div>
                </header>

                {/* Main content */}
                <main className="flex-1 overflow-y-auto p-4">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default AdminLayout;