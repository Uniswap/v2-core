import { NavLink as RouterNavLink } from "react-router-dom";

const NavLink: React.FC<{ to: string; children: React.ReactNode }> = ({
  to,
  children,
}) => {
  return (
    <RouterNavLink
      to={to}
      className={({ isActive }) =>
        isActive ? "btn-sm btn" : "btn btn-sm btn-secondary"
      }
    >
      {children}
    </RouterNavLink>
  );
};

export const NavBar = () => {
  return (
    <div className="flex-row gap-2 rounded-lg border-2 card bg-base-100 border-base-300">
      <NavLink to="/swap">Swap</NavLink>
      <a className="btn btn-sm btn-ghost">Pool</a>
      <a className="btn btn-sm btn-ghost">Penta</a>
    </div>
  );
};
