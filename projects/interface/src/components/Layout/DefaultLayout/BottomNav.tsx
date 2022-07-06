import { NavBar } from "./Navbar";

export const BottomNav = () => {
  return (
    <div className="flex fixed bottom-4 justify-center w-full sm:hidden">
      <NavBar />
    </div>
  );
};
