"use client"

import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { Button } from "../components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card"
import { Badge } from "../components/ui/badge"
import { Heart, ArrowLeft, Calendar, MapPin, Users, Phone, X } from "lucide-react"
import { Input } from "../components/ui/input"
import { Label } from "../components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select"
import { Textarea } from "../components/ui/textarea"

export default function CampsPage() {
  const [selectedCity, setSelectedCity] = useState("")
  const [allCamps, setAllCamps] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showAddCampModal, setShowAddCampModal] = useState(false)
  const [newCampFormData, setNewCampFormData] = useState({
    title: "",
    organizer: "",
    date: "",
    time: "",
    location: "",
    city: "",
    expectedDonors: "",
    contact: "",
    description: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formMessage, setFormMessage] = useState({ text: "", type: "" })

  const cities = ["All Cities", "Mumbai", "Delhi", "Bangalore", "Chennai", "Kolkata", "Hyderabad", "Pune", "Ahmedabad"]

  // Function to fetch all camps from the backend API
  const fetchAllCamps = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch("http://localhost:3001/api/camps")
      if (!response.ok) {
        throw new Error("Failed to fetch blood camps.")
      }
      const data = await response.json()
      setAllCamps(data)
    } catch (err) {
      console.error("Error fetching camps:", err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Fetch data on component mount
  useEffect(() => {
    fetchAllCamps()
  }, [])

  const filteredCamps = allCamps.filter((camp) => {
    return selectedCity === "" || selectedCity === "All Cities" || camp.city === selectedCity
  })

  const upcomingCamps = filteredCamps.filter((camp) => camp.status === "Upcoming")
  const completedCamps = filteredCamps.filter((camp) => camp.status === "Completed")

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const getStatusColor = (status) => {
    return status === "Upcoming" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
  }
  
  const handleNewCampInputChange = (field, value) => {
    setNewCampFormData(prev => ({ ...prev, [field]: value }));
  }

  const handleAddCamp = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormMessage({ text: "", type: "" });

    try {
        const response = await fetch('http://localhost:3001/api/camps', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newCampFormData),
        });

        const result = await response.json();

        if (response.ok) {
            setFormMessage({ text: "Blood camp added successfully!", type: "success" });
            // Clear form and close modal
            setNewCampFormData({
              title: "", organizer: "", date: "", time: "", location: "",
              city: "", expectedDonors: "", contact: "", description: ""
            });
            setShowAddCampModal(false);
            // Refetch the camps list to show the new camp
            fetchAllCamps();
        } else {
            setFormMessage({ text: result.message || "Failed to add blood camp.", type: "error" });
        }
    } catch (error) {
        console.error("Error adding camp:", error);
        setFormMessage({ text: "Network error. Failed to add blood camp.", type: "error" });
    } finally {
        setIsSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <p className="text-gray-600 text-lg">Loading blood camps...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <p className="text-red-600 text-lg">Error loading camps: {error}</p>
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
            <Link to="/" className="flex items-center space-x-2 text-gray-600 hover:text-red-600 transition-colors">
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Home</span>
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-12 px-4 bg-white border-b">
        <div className="container mx-auto text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Blood Donation Camps</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
            Join upcoming blood donation camps in your city and be part of the life-saving community
          </p>

          {/* City Filter */}
          <div className="max-w-md mx-auto">
            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
            >
              {cities.map((city) => (
                <option key={city} value={city === "All Cities" ? "" : city}>
                  {city}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {/* Upcoming Camps */}
      <section className="py-12 px-4">
        <div className="container mx-auto">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 mb-8">Upcoming Blood Camps</h2>

            {upcomingCamps.length === 0 ? (
              <Card className="text-center py-12">
                <CardContent>
                  <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">No upcoming camps</h3>
                  <p className="text-gray-600 mb-4">
                    {selectedCity && selectedCity !== "All Cities"
                      ? `No upcoming blood camps found in ${selectedCity}.`
                      : "No upcoming blood camps found."}
                  </p>
                  <Button onClick={() => setSelectedCity("")}>View All Cities</Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-6">
                {upcomingCamps.map((camp) => (
                  <Card key={camp._id} className="shadow-lg hover:shadow-xl transition-shadow">
                    <CardHeader>
                      <div className="flex flex-col md:flex-row md:items-start md:justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-xl text-gray-900 mb-2">{camp.title}</CardTitle>
                          <CardDescription className="text-gray-600 mb-4">
                            Organized by {camp.organizer}
                          </CardDescription>
                        </div>
                        <Badge className={`text-sm px-3 py-1 ${getStatusColor(camp.status)}`}>{camp.status}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <div className="flex items-center space-x-3 text-gray-700">
                            <Calendar className="h-5 w-5 text-red-600" />
                            <div>
                              <p className="font-semibold">{formatDate(camp.date)}</p>
                              <p className="text-sm text-gray-600">{camp.time}</p>
                            </div>
                          </div>
                          <div className="flex items-start space-x-3 text-gray-700">
                            <MapPin className="h-5 w-5 text-red-600 mt-1" />
                            <div>
                              <p className="font-semibold">{camp.location}</p>
                              <p className="text-sm text-gray-600">{camp.city}</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-3 text-gray-700">
                            <Users className="h-5 w-5 text-red-600" />
                            <p>
                              Expected Donors: <span className="font-semibold">{camp.expectedDonors}</span>
                            </p>
                          </div>
                          <div className="flex items-center space-x-3 text-gray-700">
                            <Phone className="h-5 w-5 text-red-600" />
                            <p>
                              Contact: <span className="font-semibold">{camp.contact}</span>
                            </p>
                          </div>
                        </div>

                        <div className="space-y-4">
                          <div>
                            <h4 className="font-semibold text-gray-900 mb-2">Description</h4>
                            <p className="text-gray-600 text-sm leading-relaxed">{camp.description}</p>
                          </div>

                          <div className="flex flex-col space-y-2">
                            <Button
                              className="bg-red-600 hover:bg-red-700 text-white"
                              onClick={() => window.open(`tel:${camp.contact}`)}
                            >
                              <Phone className="h-4 w-4 mr-2" />
                              Contact Organizer
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() =>
                                window.open(
                                  `sms:${camp.contact}?body=Hi, I'm interested in participating in the blood donation camp: ${camp.title} on ${formatDate(camp.date)}.`,
                                )
                              }
                            >
                              Register Interest
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Completed Camps */}
      {completedCamps.length > 0 && (
        <section className="py-12 px-4 bg-white">
          <div className="container mx-auto">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl font-bold text-gray-900 mb-8">Recently Completed Camps</h2>

              <div className="grid gap-6">
                {completedCamps.map((camp) => (
                  <Card key={camp._id} className="shadow-lg opacity-75">
                    <CardHeader>
                      <div className="flex flex-col md:flex-row md:items-start md:justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-xl text-gray-900 mb-2">{camp.title}</CardTitle>
                          <CardDescription className="text-gray-600 mb-4">
                            Organized by {camp.organizer}
                          </CardDescription>
                        </div>
                        <Badge className={`text-sm px-3 py-1 ${getStatusColor(camp.status)}`}>{camp.status}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <div className="flex items-center space-x-3 text-gray-700">
                            <Calendar className="h-5 w-5 text-red-600" />
                            <div>
                              <p className="font-semibold">{formatDate(camp.date)}</p>
                              <p className="text-sm text-gray-600">{camp.time}</p>
                            </div>
                          </div>
                          <div className="flex items-start space-x-3 text-gray-700">
                            <MapPin className="h-5 w-5 text-red-600 mt-1" />
                            <div>
                              <p className="font-semibold">{camp.location}</p>
                              <p className="text-sm text-gray-600">{camp.city}</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-3 text-gray-700">
                            <Users className="h-5 w-5 text-red-600" />
                            <p>
                              Donors Participated: <span className="font-semibold">{camp.expectedDonors}</span>
                            </p>
                          </div>
                        </div>

                        <div className="space-y-4">
                          <div>
                            <h4 className="font-semibold text-gray-900 mb-2">Description</h4>
                            <p className="text-gray-600 text-sm leading-relaxed">{camp.description}</p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Call to Action */}
      <section className="py-12 px-4 bg-red-600">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Want to Organize a Blood Camp?</h2>
          <p className="text-xl text-red-100 mb-8 max-w-2xl mx-auto">
            Partner with BloodShare to organize blood donation camps in your community
          </p>
          <Button 
            size="lg" 
            variant="secondary" 
            className="bg-white text-red-600 hover:bg-gray-100 px-8 py-3"
            onClick={() => setShowAddCampModal(true)}
          >
            Add New Camp
          </Button>
        </div>
      </section>

      {/* Add Camp Modal */}
      {showAddCampModal && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <Card className="max-w-xl w-full bg-white rounded-xl shadow-2xl animate-fade-in max-h-[90vh] overflow-y-auto">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-2xl font-bold text-red-600">
                Add New Blood Camp
              </CardTitle>
              <Button variant="ghost" size="icon" onClick={() => setShowAddCampModal(false)}>
                <X className="h-6 w-6 text-gray-500 hover:text-gray-700 transition-colors" />
              </Button>
            </CardHeader>
            <CardContent className="p-6">
              {formMessage.text && (
                  <div className={`p-4 rounded-md mb-4 ${formMessage.type === 'success' ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-red-100 text-red-700 border border-red-200'}`}>
                    {formMessage.text}
                  </div>
              )}
              <form onSubmit={handleAddCamp} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Camp Title</Label>
                    <Input 
                      id="title" 
                      value={newCampFormData.title}
                      onChange={(e) => handleNewCampInputChange("title", e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="organizer">Organizer</Label>
                    <Input 
                      id="organizer" 
                      value={newCampFormData.organizer}
                      onChange={(e) => handleNewCampInputChange("organizer", e.target.value)}
                      required
                    />
                  </div>
                </div>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="date">Date</Label>
                    <Input 
                      id="date" 
                      type="date"
                      value={newCampFormData.date}
                      onChange={(e) => handleNewCampInputChange("date", e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="time">Time</Label>
                    <Input 
                      id="time" 
                      type="text"
                      value={newCampFormData.time}
                      onChange={(e) => handleNewCampInputChange("time", e.target.value)}
                      placeholder="e.g., 9:00 AM - 5:00 PM"
                      required
                    />
                  </div>
                </div>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="location">Location</Label>
                    <Input 
                      id="location" 
                      value={newCampFormData.location}
                      onChange={(e) => handleNewCampInputChange("location", e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Select
                      value={newCampFormData.city}
                      onValueChange={(value) => handleNewCampInputChange("city", value)}
                      required
                    >
                      <SelectTrigger id="city">
                        <SelectValue placeholder="Select city" />
                      </SelectTrigger>
                      <SelectContent>
                        {cities.filter(c => c !== "All Cities").map((city) => (
                          <SelectItem key={city} value={city}>
                            {city}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="expectedDonors">Expected Donors</Label>
                    <Input 
                      id="expectedDonors" 
                      type="number"
                      value={newCampFormData.expectedDonors}
                      onChange={(e) => handleNewCampInputChange("expectedDonors", e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contact">Contact Number</Label>
                    <Input 
                      id="contact" 
                      type="tel"
                      value={newCampFormData.contact}
                      onChange={(e) => handleNewCampInputChange("contact", e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={newCampFormData.description}
                    onChange={(e) => handleNewCampInputChange("description", e.target.value)}
                    placeholder="Provide a brief description of the blood camp."
                    rows={3}
                  />
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setShowAddCampModal(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" className="bg-red-600 hover:bg-red-700" disabled={isSubmitting}>
                    {isSubmitting ? 'Adding Camp...' : 'Add Camp'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
