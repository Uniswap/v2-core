import React from "react";

const Header: React.VFC = () => {
  return (
    <div className="navbar">
      <a className="btn btn-ghost normal-case text-xl">Penta</a>
    </div>
  );
};

const Footer: React.VFC = () => {
  return (
    <footer className="footer p-10 bg-neutral text-neutral-content">
      <div>
        <p>
          ACME Industries Ltd.
          <br />
          Providing reliable tech since 1992
        </p>
      </div>
      <div>
        <span className="footer-title">Social</span>
        <div className="grid grid-flow-col gap-4">
          <a></a>
        </div>
      </div>
    </footer>
  );
};

export const DefaultLayout: React.VFC<{ children: React.ReactNode }> = ({
  children,
}) => {
  return (
    <div className="relative flex min-h-full flex-col bg-base-200 text-base-content transition-all">
      <Header />
      <div className="mt-16 text-base-content">{children}</div>
      <Footer />
    </div>
  );
};
