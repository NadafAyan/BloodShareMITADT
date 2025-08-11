// AdminApprovals.jsx
"use client";

import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { User, MapPin, AlertCircle, Heart, ArrowLeft, Droplet } from "lucide-react";
import { useActiveAccount, ConnectButton } from "thirdweb/react";
import { client } from "../app/clinet";

export default function AdminApprovals() {
  const [pendingDonors, setPendingDonors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingDonor, setProcessingDonor] = useState(null);
  const [error, setError] = useState(null);

  const account = useActiveAccount();
  const adminAddress = "0x7366736884B619fDBD3B2645F4338F6aE0859514".toLowerCase(); // Replace with your actual admin address
  const isAdmin = account && account.address.toLowerCase() === adminAddress;

  const fetchPendingDonors = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('http://localhost:3001/api/donors/pending');
      if (!response.ok) {
        throw new Error("Failed to fetch pending donors.");
      }
      const data = await response.json();
      setPendingDonors(data);
    } catch (err) {
      console.error("Error fetching pending donors:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchPendingDonors();
    }
  }, [isAdmin]);

  const handleApproval = async (donorId) => {
    try {
      setProcessingDonor(donorId);

      const response = await fetch(`http://localhost:3001/api/donors/${donorId}/approve`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error("Failed to approve donor.");
      }
      console.log("Approval successful.");
      alert("Donor approved successfully!");
      fetchPendingDonors(); // Refresh the list of pending donors
    } catch (err) {
      console.error("Approval failed:", err);
      alert("Failed to approve donor. Please try again.");
    } finally {
      setProcessingDonor(null);
    }
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-50 flex items-center justify-center">
        <Card className="w-96 shadow-lg">
          <CardContent className="p-8 text-center">
            <h2 className="text-2xl font-bold mb-4 text-gray-900">Admin Access Required</h2>
            <p className="text-gray-600 mb-6">Please connect your admin wallet to access the approval panel.</p>
            <ConnectButton client={client} />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-50 flex items-center justify-center">
        <p className="text-gray-600 text-lg">Loading pending approvals...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-50 flex items-center justify-center">
        <p className="text-red-600 text-lg">Error: {error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-50 py-10 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Pending Donor Approvals</h1>
          <div className="text-sm text-gray-600">
            Connected as: {account.address.slice(0, 6)}...{account.address.slice(-4)}
          </div>
        </div>

        {pendingDonors.length === 0 ? (
          <div className="text-center mt-20 text-gray-600">
            <AlertCircle className="h-10 w-10 mx-auto mb-2 text-red-500" />
            <p>No pending donor approvals at the moment.</p>
          </div>
        ) : (
          <div className="grid gap-6">
            {pendingDonors.map((donor) => (
              <Card key={donor._id} className="shadow-md hover:shadow-xl transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-xl">{donor.fullName}</CardTitle>
                      <CardDescription className="text-sm text-gray-500">
                        Wallet: {donor.walletAddress}
                      </CardDescription>
                    </div>
                    <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-gray-700 space-y-2">
                    <p className="flex items-center space-x-2">
                      <Droplet className="w-4 h-4 text-red-500" />
                      Blood Group: <span className="font-medium ml-1">{donor.bloodGroup}</span>
                    </p>
                    <p className="flex items-center space-x-2">
                      <MapPin className="w-4 h-4 text-red-500" />
                      City: <span className="ml-1">{donor.city}</span>
                    </p>
                    <p className="flex items-center space-x-2">
                      <User className="w-4 h-4 text-red-500" />
                      Age: <span className="ml-1">{donor.age}</span>
                    </p>
                  </div>
                  <div className="flex space-x-3">
                    <Button 
                      className="bg-green-600 hover:bg-green-700 text-white" 
                      onClick={() => handleApproval(donor._id)}
                      disabled={processingDonor === donor._id}
                    >
                      {processingDonor === donor._id ? "Approving..." : "Approve Donor"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}