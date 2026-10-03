import React, { useState } from 'react';
import Header from './components/Header';
import Footer from './components/Footer';
import StudentView from './components/StudentView';
import TeacherDashboard from './components/TeacherDashboard';
import LoginModal from './components/LoginModal';
import { getStudentSession } from './utils/storage';

export default function App() {
  const [student, setStudent] = useState(getStudentSession());
  const [userRole, setUserRole] = useState('siswa'); // 'siswa' atau 'guru'
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  const handleLogoutGuru = () => {
    setUserRole('siswa');
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Header 
        userRole={userRole} 
        onLogout={handleLogoutGuru}
        onOpenLogin={() => setIsLoginModalOpen(true)}
      />

      <main className="flex-1">
        {userRole === 'guru' ? (
          <TeacherDashboard />
        ) : (
          <StudentView student={student} setStudent={setStudent} />
        )}
      </main>

      <Footer />

      <LoginModal 
        isOpen={isLoginModalOpen} 
        onClose={() => setIsLoginModalOpen(false)}
        onLogin={(role) => setUserRole(role)}
      />
    </div>
  );
}