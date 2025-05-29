// src/screens/mechanic/MechanicDashboard.tsx
import React, { useState } from 'react';
import MechanicDashboardContent from './MechanicDashboardContent';
import MechanicLayout from './MechanicLayout';

const MechanicDashboard = () => {
  const [activeTab, setActiveTab] = useState('dashboard');

  return (
    <MechanicLayout activeTab={activeTab} onTabChange={setActiveTab}>
      <MechanicDashboardContent />
    </MechanicLayout>
  );
};

export default MechanicDashboard;