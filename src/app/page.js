'use client';

import useUserRoleStore from "../../src/app/store/userRoleStore";

export default function Home() {
  const setRole = useUserRoleStore((state) => state.setRole);

  const handleRoleClick = (role) => {
    setRole(role); // Save role globally
    console.log("Selected Role:", role); // Optional
  };

  return (
    <ul className="nk-block-tools gx-3">
      <li>
        <button
          className="btn btn-success ml-1"
          onClick={() => handleRoleClick("Customer")}
        >
          <span>Customers</span>
        </button>

        <button
          type="button"
          className="btn btn-primary ml-1"
          onClick={() => handleRoleClick("Admin")}
        >
          <span>Admin</span>
        </button>
      </li>
    </ul>
  );
}
