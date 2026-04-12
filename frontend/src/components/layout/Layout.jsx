import Navbar from './Navbar';
import { Outlet } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const Layout = () => {
  return (
    <div className="min-h-screen flex flex-col pt-16 mt-[-64px]">
      <Navbar />
      <main className="flex-grow pt-4">
        <Outlet />
      </main>
      <ToastContainer
        position="bottom-right"
        theme="dark"
        toastClassName="bg-surface border border-slate-700 text-textMain"
      />
    </div>
  );
};

export default Layout;
