// DonorsPage.tsx or .jsx
import { useReadContract } from "thirdweb/react";
import { getContract } from "thirdweb";
import { client } from "../app/clinet";
import { useEffect, useState } from "react";
import { sepolia, defineChain } from "thirdweb/chains";

const contract = getContract({
  client,
  chain: defineChain(11155111),
  address: "0xEfA93B667ADaDD20e309A7C45C37802c3055840D",
});

export default function DonorsPage() {
  const { data, isLoading, error } = useReadContract({
    contract,
    method:
      "function getApprovedDonors() view returns ((string name, uint8 age, string bloodGroup, string city, bool approved, address registeredBy)[])",
    params: [],
  });

  const [donors, setDonors] = useState([]);

  useEffect(() => {
    if (data) setDonors(data);
  }, [data]);

  if (isLoading) return <p className="text-red-600 text-lg">Loading...</p>;
  if (error) return <p className="text-red-600 text-lg">Error loading donors.</p>;

  return (
    <div className="min-h-screen bg-white px-4 md:px-16 py-10">
      <h1 className="text-3xl font-bold text-red-600 mb-6 text-center">Approved Donors</h1>

      {donors.length === 0 ? (
        <p className="text-gray-700 text-center">No approved donors yet.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {donors.map((donor, idx) => (
            <div
              key={idx}
              className="border border-red-500 rounded-2xl p-5 shadow-md hover:shadow-lg transition bg-white"
            >
              <p className="text-lg font-semibold text-red-700 mb-1">
                🧑 Name: <span className="text-gray-800">{donor.name}</span>
              </p>
              <p className="text-gray-700 mb-1">🎂 Age: {donor.age}</p>
              <p className="text-gray-700 mb-1">🩸 Blood Group: {donor.bloodGroup}</p>
              <p className="text-gray-700 mb-1">🏙️ City: {donor.city}</p>
             
            </div>
          ))}
        </div>

      )}
    </div>
  );
  }

  /*<p className="text-gray-700 text-sm mt-2">📍 Registered By: <span className="break-all">{donor.registeredBy}</span></p>*/