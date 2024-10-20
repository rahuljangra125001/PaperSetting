// eslint-disable-next-line no-unused-vars
import React, { useEffect } from 'react';
import './App.css';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

// Auth
import Login from './pages/Login';
import Register from './pages/Register';
import VerifyEmail from './pages/VerifyEmail';
import { Toaster } from 'react-hot-toast';

// Layouts
import COELayouts from './Layouts/COELayouts';
import UserLayout from './Layouts/UserLayout';
import ChairPersonLayouts from './Layouts/ChairPersonLayouts';
import PanelMemberLayouts from './Layouts/PanelMemberLayouts';
import PublicLayouts from './Layouts/PublicLayouts';

// Dashboards
import UserDashboard from './Dashboard/UserDashboard';
import PanelDashboard from './Dashboard/PanelDashboard';
import ChairpersonDashboard from './Dashboard/ChairpersonDashboard';
import COEDashboard from './Dashboard/COEDashboard';

import { useDispatch, useSelector } from 'react-redux';
import { updateUser } from './redux/AuthSlice';

export default function App() {
  const user = useSelector((state) => state.Auth.user);
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(updateUser());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  return (
    <BrowserRouter>
      <Toaster />
      <Routes>
        {/* Public Routes */}
        <Route element={<PublicLayouts />}>
          <Route path='/' element={<UserLayout />}>
          </Route>
          <Route path='login' element={<Login />} />
          <Route path='register' element={<Register />} />
          <Route path='verify-email' element={<VerifyEmail />} />
        </Route>

        {/* Dashboard Routes */}
        <Route path='/COEDashboard' element={<COELayouts />}>
          <Route index element={<COEDashboard />} />
        </Route>

        <Route path='/ChairpersonDashboard' element={<ChairPersonLayouts />}>
          <Route index element={<ChairpersonDashboard />} />
        </Route>

        <Route path='/PanelDashboard' element={<PanelMemberLayouts />}>
          <Route index element={<PanelDashboard />} />
        </Route>

        <Route path='/UserDashboard' element={<UserLayout />}>
          <Route index element={<UserDashboard />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
