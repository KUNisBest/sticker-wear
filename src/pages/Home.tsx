import { useState } from 'react';
import type { PageType } from '../App';
import Navbar from '../components/Navbar';
import Shop from './Shop';
import Recommend from './Recommend';
import Profile from './Profile';
import Admin from './Admin';
import Login from './Login';

export default function Home() {
  const [currentPage, setCurrentPage] = useState<PageType>('shop');
  const [showLogin, setShowLogin] = useState(false);

  const handlePageChange = (page: PageType) => {
    setCurrentPage(page);
  };

  return (
    <div className="fixed inset-0 overflow-hidden bg-white">
      {/* Navigation - always on top */}
      <Navbar
        currentPage={currentPage}
        onPageChange={handlePageChange}
        onLoginClick={() => setShowLogin(true)}
      />

      {/* Shop Page */}
      {currentPage === 'shop' && (
        <div className="absolute inset-0 pt-[56px] z-10 overflow-y-auto">
          <Shop />
        </div>
      )}

      {/* Admin Page */}
      {currentPage === 'admin' && (
        <div className="absolute inset-0 pt-[56px] z-10 overflow-y-auto bg-white">
          <Admin />
        </div>
      )}

      {/* Community / Profile */}
      {currentPage === 'community' && (
        <div className="absolute inset-0 pt-[56px] z-10 overflow-y-auto bg-white">
          <Recommend />
        </div>
      )}
      {currentPage === 'profile' && (
        <div className="absolute inset-0 pt-[56px] z-10 overflow-y-auto bg-white">
          <Profile />
        </div>
      )}

      {/* Login Modal */}
      {showLogin && <Login onClose={() => setShowLogin(false)} />}
    </div>
  );
}
