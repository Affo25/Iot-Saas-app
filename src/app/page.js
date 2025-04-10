'use client';

import useUserRoleStore from "../../src/app/store/userRoleStore";

export default function Home() {
  const setRole = useUserRoleStore((state) => state.setRole);

  const handleRoleClick = (role) => {
    setRole(role); // Save role globally
    console.log("Selected Role:", role); // Optional
  };

  return (
    <h1>This is Dashboard page!</h1>
  );
}
