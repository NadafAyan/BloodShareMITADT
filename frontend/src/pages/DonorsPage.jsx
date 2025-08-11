"use client";

import { useReadContract } from "thirdweb/react";
import { getContract } from "thirdweb";
import { client } from "../app/clinet";
import { useEffect, useState } from "react";
import { sepolia, defineChain } from "thirdweb/chains";
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

const contract = getContract({
  client,
  chain: defineChain(11155111),
  address: "0xEfA93B667ADaDD20e309A7C45C37802c3055840D",
});

export default function DonorsPage() {
  const [searchFilters, setSearchFilters] = useState({
    bloodGroup: "",
    city: "",
    availability: "", // Assuming 'availability' can be a filter.
  });

  const { data: approvedDonors, isLoading, error } = useReadContract({
    contract,
    method:
      "function getApprovedDonors() view returns ((string name, uint8 age, string bloodGroup, string city, bool approved, address registeredBy)[])",
    params: [],
  });

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

  const handleFilterChange = (field, value) => {
    setSearchFilters((prev) => ({ ...prev, [field]: value }));
  };

  const clearFilters = () => {
    setSearchFilters({ bloodGroup: "", city: "", availability: "" });
  };

  const filteredDonors = approvedDonors
    ? approvedDonors.filter((donor) => {
        return (
          (!searchFilters.bloodGroup ||
            donor.bloodGroup === searchFilters.bloodGroup) &&
          (!searchFilters.city || donor.city === searchFilters.city) &&
          (!searchFilters.availability || donor.approved)
        );
      })
    : [];

  if (isLoading) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <p className="text-gray-600 text-lg">Loading donors...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <p className="text-red-600 text-lg">Error loading donors.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <nav className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Heart className="h-8 w-8 text-red-600" />
              <span className="text-2xl font-bold text-gray-900">
                BloodShare
              </span>
            </div>
            <Link
              to="/"
              className="flex items-center space-x-2 text-gray-600 hover:text-red-600 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Home</span>
            </Link>
          </nav>
        </div>
      </header>

      {/* Filters */}
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
                      onValueChange={(value) =>
                        handleFilterChange("bloodGroup", value)
                      }
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
                      onValueChange={(value) =>
                        handleFilterChange("city", value)
                      }
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

                  {/* Availability filter is not directly available in your contract, but is included here for UI consistency. */}
                  <div className="space-y-2">
                    <Label htmlFor="availability">Availability</Label>
                    <Select
                      value={searchFilters.availability}
                      onValueChange={(value) =>
                        handleFilterChange("availability", value)
                      }
                    >
                      <SelectTrigger id="availability">
                        <SelectValue placeholder="Select availability" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Available">Available</SelectItem>
                        <SelectItem value="Busy">Busy</SelectItem>
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
                {filteredDonors.map((donor, idx) => (
                  <Card
                    key={idx}
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
                                {donor.name}
                              </h3>
                              <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                                <span className="flex items-center space-x-1">
                                  <MapPin className="h-4 w-4" />
                                  <span>{donor.city}</span>
                                </span>
                                <span className="flex items-center space-x-1">
                                  <Droplet className="h-4 w-4" />
                                  <span>Age: {donor.age.toString()}</span>
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-3 mb-4">
                            <Badge className="bg-red-100 text-red-800 text-sm px-3 py-1">
                              Blood Group: {donor.bloodGroup}
                            </Badge>
                            <Badge variant="outline" className="text-sm px-3 py-1 border-gray-300 text-gray-700">
                              Registered by: {donor.registeredBy.slice(0, 6)}...{donor.registeredBy.slice(-4)}
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