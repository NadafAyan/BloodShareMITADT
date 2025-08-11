// DonorsPage.jsx
"use client";

import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Label } from "../components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import {
  Heart,
  ArrowLeft,
  Search,
  Phone,
  MapPin,
  User,
  Droplet,
  Filter,
} from "lucide-react";

export default function DonorsPage() {
  const [searchFilters, setSearchFilters] = useState({
    bloodGroup: "",
    city: "",
    emergencyAvailability: "", // Matching your database schema
  });
  const [donors, setDonors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const bloodGroups = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
  const cities = [
    "Mumbai",
    "Delhi",
    "Bangalore",
    "Chennai",
    "Kolkata",
    "Hyderabad",
    "Pune",
    "Ahmedabad",
  ];

  // Function to fetch approved donors from the new API endpoint
  const fetchApprovedDonors = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("http://localhost:3001/api/donors/approved");
      if (!response.ok) {
        throw new Error("Failed to fetch approved donors.");
      }
      const data = await response.json();
      setDonors(data);
    } catch (err) {
      console.error("Error fetching donors:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApprovedDonors();
  }, []); // Fetch data once on component mount

  const handleFilterChange = (field, value) => {
    setSearchFilters((prev) => ({ ...prev, [field]: value }));
  };

  const clearFilters = () => {
    setSearchFilters({ bloodGroup: "", city: "", emergencyAvailability: "" });
  };

  const filteredDonors = donors.filter((donor) => {
    return (
      (!searchFilters.bloodGroup || donor.bloodGroup === searchFilters.bloodGroup) &&
      (!searchFilters.city || donor.city === searchFilters.city) &&
      (!searchFilters.emergencyAvailability || donor.emergencyAvailability === (searchFilters.emergencyAvailability === 'true'))
    );
  });

  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <p className="text-gray-600 text-lg">Loading approved donors...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <p className="text-red-600 text-lg">Error loading donors: {error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-50">
      {/* ... (Header and filter sections remain the same, but now use the local state) ... */}
      <section className="py-8 px-4 bg-white border-b">
        <div className="container mx-auto">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-900 mb-6 text-center">
              Find Approved Donors
            </h1>
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Filter className="h-5 w-5" />
                  <span>Search Filters</span>
                </CardTitle>
                <CardDescription>
                  Use the filters below to find donors matching your requirements
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-4 mb-4">
                  <div className="space-y-2">
                    <Label htmlFor="bloodGroup">Blood Group</Label>
                    <Select
                      value={searchFilters.bloodGroup}
                      onValueChange={(value) => handleFilterChange("bloodGroup", value)}
                    >
                      <SelectTrigger id="bloodGroup">
                        <SelectValue placeholder="Select blood group" />
                      </SelectTrigger>
                      <SelectContent>
                        {bloodGroups.map((group) => (
                          <SelectItem key={group} value={group}>
                            {group}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Select
                      value={searchFilters.city}
                      onValueChange={(value) => handleFilterChange("city", value)}
                    >
                      <SelectTrigger id="city">
                        <SelectValue placeholder="Select city" />
                      </SelectTrigger>
                      <SelectContent>
                        {cities.map((city) => (
                          <SelectItem key={city} value={city}>
                            {city}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="emergencyAvailability">Availability</Label>
                    <Select
                      value={searchFilters.emergencyAvailability}
                      onValueChange={(value) => handleFilterChange("emergencyAvailability", value)}
                    >
                      <SelectTrigger id="emergencyAvailability">
                        <SelectValue placeholder="Select availability" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="true">Available</SelectItem>
                        <SelectItem value="false">Not available</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <p className="text-sm text-gray-600">
                    Showing {filteredDonors.length} donors
                  </p>
                  <Button variant="outline" onClick={clearFilters}>
                    Clear Filters
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Donor List */}
      <section className="py-8 px-4">
        <div className="container mx-auto">
          <div className="max-w-4xl mx-auto">
            {filteredDonors.length === 0 ? (
              <Card className="text-center py-12">
                <CardContent>
                  <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    No approved donors found
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Try adjusting your search filters to find more donors.
                  </p>
                  <Button onClick={clearFilters}>Clear All Filters</Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-6">
                {filteredDonors.map((donor) => (
                  <Card
                    key={donor._id}
                    className="shadow-lg hover:shadow-xl transition-shadow"
                  >
                    <CardContent className="p-6">
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-4 mb-4">
                            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                              <User className="h-6 w-6 text-red-600" />
                            </div>
                            <div>
                              <h3 className="text-xl font-semibold text-gray-900">
                                {donor.fullName}
                              </h3>
                              <div className="flex flex-wrap items-center space-x-4 text-sm text-gray-600 mt-1">
                                <span className="flex items-center space-x-1">
                                  <MapPin className="h-4 w-4" />
                                  <span>{donor.city}</span>
                                </span>
                                <span className="flex items-center space-x-1">
                                  <Droplet className="h-4 w-4" />
                                  <span>Age: {donor.age}</span>
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-wrap items-center gap-3 mb-4">
                            <Badge className="bg-red-100 text-red-800 text-sm px-3 py-1">
                              Blood Group: {donor.bloodGroup}
                            </Badge>
                            <Badge
                              className={`text-sm px-3 py-1 ${
                                donor.emergencyAvailability
                                  ? "bg-green-100 text-green-800"
                                  : "bg-yellow-100 text-red-800"
                              }`}
                            >
                              {donor.emergencyAvailability ? "Available" : "Not available"}
                            </Badge>
                          </div>
                        </div>
                        <div className="mt-4 md:mt-0 md:ml-6">
                          <div className="flex flex-col space-y-2">
                            {/* Assuming a contact button would be added here */}
                            <Button className="bg-red-600 hover:bg-red-700 text-white">
                              <Phone className="h-4 w-4 mr-2" />
                              Contact Donor
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
            {/* Emergency Request CTA */}
            <Card className="mt-8 bg-red-50 border-red-200">
              <CardContent className="p-6 text-center">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Need Blood Urgently?
                </h3>
                <p className="text-gray-600 mb-4">
                  Submit an emergency request to notify all available donors in
                  your area immediately.
                </p>
                <Button asChild className="bg-red-600 hover:bg-red-700">
                  <Link to="/emergency">Submit Emergency Request</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
}