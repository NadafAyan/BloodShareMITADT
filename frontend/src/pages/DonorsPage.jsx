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
  Mail,
  X,
  Hospital,
  Compass,
} from "lucide-react";

export default function DonorsPage() {
  const [searchFilters, setSearchFilters] = useState({
    bloodGroup: "",
    city: "",
    emergencyAvailability: "",
  });
  const [donors, setDonors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showContactModal, setShowContactModal] = useState(false);
  const [selectedDonor, setSelectedDonor] = useState(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState(null);
  const [showNearbyHospitalsModal, setShowNearbyHospitalsModal] = useState(false);
  const [nearbyHospitals, setNearbyHospitals] = useState([]);

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

  // Mock hospital data with coordinates for demonstration
  const mockHospitals = [
    {
      id: 1,
      name: "Apollo Hospital, Navi Mumbai",
      address: "Sector 23, CBD Belapur, Navi Mumbai, Maharashtra 400614",
      city: "Mumbai",
      location: { type: 'Point', coordinates: [73.0487, 19.0197] }, // [lon, lat]
      contact: "022 3350 3350"
    },
    {
      id: 2,
      name: "Lilavati Hospital and Research Centre",
      address: "A-791, Bandra Reclamation, Bandra West, Mumbai, Maharashtra 400050",
      city: "Mumbai",
      location: { type: 'Point', coordinates: [72.8277, 19.0543] }, // [lon, lat]
      contact: "022 2675 1000"
    },
    {
      id: 3,
      name: "Deenanath Mangeshkar Hospital",
      address: "Survey No 27, Erandwane, Pune, Maharashtra 411004",
      city: "Pune",
      location: { type: 'Point', coordinates: [73.8160, 18.5089] }, // [lon, lat]
      contact: "020 4015 9000"
    },
    {
      id: 4,
      name: "Ruby Hall Clinic, Pune",
      address: "40, Sassoon Rd, Pune, Maharashtra 411001",
      city: "Pune",
      location: { type: 'Point', coordinates: [73.8767, 18.5290] }, // [lon, lat]
      contact: "020 6645 5999"
    },
    {
      id: 5,
      name: "Tata Memorial Hospital",
      address: "Dr E Borges Rd, Parel, Mumbai, Maharashtra 400012",
      city: "Mumbai",
      location: { type: 'Point', coordinates: [72.8291, 18.9959] }, // [lon, lat]
      contact: "022 2417 7000"
    }
  ];

  // Haversine formula to calculate distance between two lat/lon points
  const getDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Radius of Earth in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };
  
  const findNearbyHospitals = () => {
    if (navigator.geolocation) {
      setLocationLoading(true);
      setLocationError(null);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          
          // Calculate distance for all mock hospitals and sort
          const hospitalsWithDistance = mockHospitals.map(hospital => {
            const hospitalLat = hospital.location.coordinates[1];
            const hospitalLon = hospital.location.coordinates[0];
            const distance = getDistance(latitude, longitude, hospitalLat, hospitalLon);
            return { ...hospital, distance };
          }).sort((a, b) => a.distance - b.distance); // Sort by distance

          setNearbyHospitals(hospitalsWithDistance);
          setShowNearbyHospitalsModal(true);
          setLocationLoading(false);
        },
        (err) => {
          setLocationError(err.message || "Geolocation permission denied.");
          setLocationLoading(false);
        }
      );
    } else {
      setLocationError("Geolocation is not supported by your browser.");
    }
  };

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
  }, []);

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
  
  const handleContactClick = (donor) => {
    setSelectedDonor(donor);
    setShowContactModal(true);
  };
  
  const handleCloseModal = () => {
    setShowContactModal(false);
    setSelectedDonor(null);
  };
  
  const handleOpenMaps = (hospital) => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          const mapsUrl = `https://www.google.com/maps/dir/${latitude},${longitude}/${hospital.address}`;
          window.open(mapsUrl, '_blank');
        },
        (err) => {
          alert("Could not get your location for directions. Please try again.");
          console.error("Geolocation error:", err);
        }
      );
    } else {
      alert("Geolocation is not supported by your browser.");
    }
  };


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
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <nav className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Heart className="h-8 w-8 text-red-600" />
              <span className="text-2xl font-bold text-gray-900">BloodShare</span>
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
            <div className="text-center mt-6">
                <Button 
                    className="bg-red-600 hover:bg-red-700 text-white" 
                    onClick={findNearbyHospitals}
                    disabled={locationLoading}
                >
                    <Hospital className="h-4 w-4 mr-2" />
                    {locationLoading ? "Finding Hospitals..." : "Find Nearby Hospitals"}
                </Button>
                {locationError && <p className="text-sm text-red-500 mt-2">{locationError}</p>}
            </div>
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
                            <Button 
                                className="bg-red-600 hover:bg-red-700 text-white"
                                onClick={() => handleContactClick(donor)}
                            >
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

      {/* Contact Modal */}
      {showContactModal && selectedDonor && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <Card className="max-w-md w-full bg-white rounded-xl shadow-2xl animate-fade-in">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-2xl font-bold text-red-600">
                Contact {selectedDonor.fullName}
              </CardTitle>
              <Button variant="ghost" size="icon" onClick={handleCloseModal}>
                <X className="h-6 w-6 text-gray-500 hover:text-gray-700 transition-colors" />
              </Button>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <p className="text-gray-600 text-lg font-medium">
                Here are the contact details for the donor.
              </p>
              <div className="flex items-center space-x-4 bg-gray-100 p-4 rounded-lg">
                <Phone className="h-6 w-6 text-red-600" />
                <a href={`tel:${selectedDonor.phoneNumber}`} className="text-xl font-semibold text-gray-800 hover:underline">
                  {selectedDonor.phoneNumber}
                </a>
              </div>
              <div className="flex items-center space-x-4 bg-gray-100 p-4 rounded-lg">
                <Mail className="h-6 w-6 text-red-600" />
                <a href={`mailto:${selectedDonor.email}`} className="text-lg font-semibold text-gray-800 hover:underline break-all">
                  {selectedDonor.email}
                </a>
              </div>
              <div className="flex justify-end pt-4">
                <Button className="bg-red-600 hover:bg-red-700" onClick={handleCloseModal}>
                  Close
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
      
      {/* NEW: Nearby Hospitals Modal */}
      {showNearbyHospitalsModal && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <Card className="max-w-2xl w-full bg-white rounded-xl shadow-2xl animate-fade-in max-h-[90vh] overflow-y-auto">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-2xl font-bold text-red-600">
                Nearby Hospitals & Blood Banks
              </CardTitle>
              <Button variant="ghost" size="icon" onClick={() => setShowNearbyHospitalsModal(false)}>
                <X className="h-6 w-6 text-gray-500 hover:text-gray-700 transition-colors" />
              </Button>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              {nearbyHospitals.length > 0 ? (
                <div className="grid gap-4">
                  {nearbyHospitals.map(hospital => (
                    <div key={hospital.id} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                      <div className="flex items-center justify-between">
                        <h4 className="text-lg font-semibold text-gray-900">{hospital.name}</h4>
                        <span className="text-sm text-gray-500">{hospital.distance.toFixed(2)} km away</span>
                      </div>
                      <p className="text-sm text-gray-600 flex items-center space-x-2 mt-1">
                        <MapPin className="h-4 w-4" />
                        <span>{hospital.address}</span>
                      </p>
                      <div className="flex justify-between items-center mt-3">
                        <div className="flex items-center space-x-2 text-sm text-gray-700">
                          <Phone className="h-4 w-4" />
                          <a href={`tel:${hospital.contact}`} className="hover:underline">
                            {hospital.contact}
                          </a>
                        </div>
                        <Button 
                          size="sm" 
                          className="bg-red-600 hover:bg-red-700 text-white"
                          onClick={() => handleOpenMaps(hospital)}
                        >
                          Get Directions
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Hospital className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 text-lg">No nearby hospitals found.</p>
                </div>
              )}
              <div className="flex justify-end pt-4">
                <Button className="bg-red-600 hover:bg-red-700" onClick={() => setShowNearbyHospitalsModal(false)}>
                  Close
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
