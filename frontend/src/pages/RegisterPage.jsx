"use client";

import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Checkbox } from "../components/ui/checkbox";
import { Heart, ArrowLeft } from "lucide-react";
import { useActiveAccount, ConnectButton } from "thirdweb/react";
import { prepareContractCall } from "thirdweb";
import { useSendTransaction } from "thirdweb/react";
import { client } from "../app/clinet";
import { getContract } from "thirdweb";
import { sepolia, defineChain } from "thirdweb/chains";

// Contract definition for Thirdweb
const contract = getContract({
  client,
  chain: defineChain(11155111),
  address: "0xEfA93B667ADaDD20e309A7C45C37802c3055840D",
});

export default function RegisterPage() {
  // State to manage form data, including new fields from the image
  const [formData, setFormData] = useState({
    fullName: "",
    age: "",
    bloodGroup: "",
    city: "",
    email: "",
    phoneNumber: "",
    emergencyContact: "",
    medicalCondition: "",
    proofOfIdentity: null,
    drivingLicense: null,
    bloodReport: null,
    emergencyAvailability: false,
    agreeToTerms: false,
  });

  // State for form validation errors and submission status
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" }); // Replaces `alert()` with a state-based message

  // Static data for dropdowns
  const bloodGroups = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
  const cities = [
    "Mumbai", "Delhi", "Bangalore", "Chennai", "Kolkata",
    "Hyderabad", "Pune", "Ahmedabad",
  ];

  // Thirdweb hooks for wallet and transaction
  const account = useActiveAccount();
  const { mutate: sendTransaction } = useSendTransaction();
  const navigate = useNavigate();

  // Handler for input changes to update state
  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
    // Clear any previous messages
    setMessage({ text: "", type: "" });
  };

  // Validation logic for the entire form
  const validateForm = () => {
    const newErrors = {};

    if (!formData.fullName.trim()) newErrors.fullName = "Full name is required";
    if (!formData.age) newErrors.age = "Age is required";
    else if (formData.age < 18 || formData.age > 65) newErrors.age = "Age must be between 18 and 65";
    if (!formData.bloodGroup) newErrors.bloodGroup = "Blood group is required";
    if (!formData.city) newErrors.city = "City is required";

    // Email validation using a basic regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email) {
      newErrors.email = "Email is required";
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    // Phone number validation (10 digits)
    const phoneRegex = /^\d{10}$/;
    if (!formData.phoneNumber) {
      newErrors.phoneNumber = "Phone number is required";
    } else if (!phoneRegex.test(formData.phoneNumber)) {
      newErrors.phoneNumber = "Phone number must be exactly 10 digits";
    }

    // Emergency contact validation (10 digits)
    if (!formData.emergencyContact) {
      newErrors.emergencyContact = "Emergency contact is required";
    } else if (!phoneRegex.test(formData.emergencyContact)) {
      newErrors.emergencyContact = "Emergency contact must be exactly 10 digits";
    }

    if (!formData.proofOfIdentity) newErrors.proofOfIdentity = "Proof of identity is required";
    if (!formData.drivingLicense) newErrors.drivingLicense = "Driving license is required";
    if (!formData.bloodReport) newErrors.bloodReport = "Blood report is required";
    if (!formData.agreeToTerms) newErrors.agreeToTerms = "You must agree to the terms and conditions";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handler for form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!account) {
      setMessage({ text: "Please connect your wallet first!", type: "error" });
      return;
    }

    if (!validateForm()) return;

    setIsSubmitting(true);
    setMessage({ text: "", type: "" }); // Clear previous message

    try {
      // Prepare the contract call with the required parameters.
      // Note: File uploads are not sent to the blockchain in this transaction.
      const transaction = prepareContractCall({
        contract,
        method: "function registerDonor(string memory _name, uint8 _age, string memory _bloodGroup, string memory _city)",
        params: [
          formData.fullName,
          parseInt(formData.age),
          formData.bloodGroup,
          formData.city,
        ],
      });

      console.log("Prepared transaction:", transaction);

      sendTransaction(transaction, {
        onSuccess: (result) => {
          console.log("Transaction successful:", result);
          setMessage({ text: "Registration successful! Your request is pending admin approval.", type: "success" });
          navigate("/camps");
        },
        onError: (error) => {
          console.error("Transaction failed:", error);
          setMessage({ text: "Registration failed. Please try again.", type: "error" });
        },
      });
    } catch (error) {
      console.error("Error preparing transaction:", error);
      setMessage({ text: "Something went wrong. Please try again.", type: "error" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-50 font-sans">
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
            <div className="flex items-center space-x-4">
              <ConnectButton client={client} />
              <Link
                to="/"
                className="flex items-center space-x-2 text-gray-600 hover:text-red-600 transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back to Home</span>
              </Link>
            </div>
          </nav>
        </div>
      </header>

      {/* Registration Form Section */}
      <section className="py-12 px-4">
        <div className="container mx-auto max-w-2xl">
          <Card className="shadow-xl rounded-2xl">
            <CardHeader className="text-center">
              <CardTitle className="text-3xl font-bold text-gray-900">
                Register as Blood Donor
              </CardTitle>
              <CardDescription className="text-lg text-gray-600">
                Join our blockchain-based community of life-savers
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!account ? (
                <div className="text-center py-8">
                  <p className="text-gray-600 mb-4">
                    Please connect your wallet to register as a donor
                  </p>
                  <ConnectButton client={client} />
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Personal Information Section */}
                  <div className="space-y-4">
                    <h3 className="text-xl font-semibold text-gray-900">
                      Personal Information
                    </h3>

                    {/* Two-column grid for name and age */}
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="fullName">Full Name *</Label>
                        <Input
                          id="fullName"
                          value={formData.fullName}
                          onChange={(e) => handleInputChange("fullName", e.target.value)}
                          className={errors.fullName ? "border-red-500" : ""}
                        />
                        {errors.fullName && (
                          <p className="text-sm text-red-500">{errors.fullName}</p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="age">Age *</Label>
                        <Input
                          id="age"
                          type="number"
                          min="18"
                          max="65"
                          value={formData.age}
                          onChange={(e) => handleInputChange("age", parseInt(e.target.value))}
                          className={errors.age ? "border-red-500" : ""}
                        />
                        {errors.age && (
                          <p className="text-sm text-red-500">{errors.age}</p>
                        )}
                      </div>
                    </div>

                    {/* Two-column grid for blood group and city */}
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Blood Group *</Label>
                        <Select
                          value={formData.bloodGroup}
                          onValueChange={(value) => handleInputChange("bloodGroup", value)}
                        >
                          <SelectTrigger className={errors.bloodGroup ? "border-red-500" : ""}>
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
                        {errors.bloodGroup && (
                          <p className="text-sm text-red-500">{errors.bloodGroup}</p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label>City *</Label>
                        <Select
                          value={formData.city}
                          onValueChange={(value) => handleInputChange("city", value)}
                        >
                          <SelectTrigger className={errors.city ? "border-red-500" : ""}>
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
                        {errors.city && (
                          <p className="text-sm text-red-500">{errors.city}</p>
                        )}
                      </div>
                    </div>

                    {/* Additional fields for contact and medical info */}
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="email">Email *</Label>
                        <Input
                          id="email"
                          type="email"
                          value={formData.email}
                          onChange={(e) => handleInputChange("email", e.target.value)}
                          className={errors.email ? "border-red-500" : ""}
                        />
                        {errors.email && <p className="text-sm text-red-500">{errors.email}</p>}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phoneNumber">Phone Number *</Label>
                        <Input
                          id="phoneNumber"
                          type="tel"
                          value={formData.phoneNumber}
                          onChange={(e) => handleInputChange("phoneNumber", e.target.value)}
                          className={errors.phoneNumber ? "border-red-500" : ""}
                        />
                        {errors.phoneNumber && <p className="text-sm text-red-500">{errors.phoneNumber}</p>}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="emergencyContact">Emergency Contact *</Label>
                        <Input
                          id="emergencyContact"
                          value={formData.emergencyContact}
                          onChange={(e) => handleInputChange("emergencyContact", e.target.value)}
                          className={errors.emergencyContact ? "border-red-500" : ""}
                        />
                        {errors.emergencyContact && <p className="text-sm text-red-500">{errors.emergencyContact}</p>}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="medicalCondition">Medical Condition</Label>
                        <Input
                          id="medicalCondition"
                          value={formData.medicalCondition}
                          onChange={(e) => handleInputChange("medicalCondition", e.target.value)}
                        />
                      </div>
                    </div>
                    
                    {/* Three-column grid for file uploads */}
                    <div className="space-y-4">
                      <h3 className="text-xl font-semibold text-gray-900 pt-4">
                        Document Uploads
                      </h3>
                      <div className="grid md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label>Upload ADHAAR ID *</Label>
                          <Input
                            type="file"
                            onChange={(e) => handleInputChange("proofOfIdentity", e.target.files[0])}
                            className={errors.proofOfIdentity ? "border-red-500" : ""}
                          />
                          {errors.proofOfIdentity && <p className="text-sm text-red-500">{errors.proofOfIdentity}</p>}
                        </div>
                        <div className="space-y-2">
                          <Label>Upload Driving License *</Label>
                          <Input
                            type="file"
                            onChange={(e) => handleInputChange("drivingLicense", e.target.files[0])}
                            className={errors.drivingLicense ? "border-red-500" : ""}
                          />
                          {errors.drivingLicense && <p className="text-sm text-red-500">{errors.drivingLicense}</p>}
                        </div>
                        <div className="space-y-2">
                          <Label>Upload Blood report *</Label>
                          <Input
                            type="file"
                            onChange={(e) => handleInputChange("bloodReport", e.target.files[0])}
                            className={errors.bloodReport ? "border-red-500" : ""}
                          />
                          {errors.bloodReport && <p className="text-sm text-red-500">{errors.bloodReport}</p>}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Wallet & Checkbox Section */}
                  <div className="space-y-4">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <p className="text-sm text-blue-800">
                        <strong>Connected Wallet:</strong> {account.address}
                      </p>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="emergencyAvailability"
                        checked={formData.emergencyAvailability}
                        onCheckedChange={(checked) => handleInputChange("emergencyAvailability", checked)}
                      />
                      <Label htmlFor="emergencyAvailability">
                        I am available for emergency blood donation requests
                      </Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="agreeToTerms"
                        checked={formData.agreeToTerms}
                        onCheckedChange={(checked) => handleInputChange("agreeToTerms", checked)}
                      />
                      <Label
                        htmlFor="agreeToTerms"
                        className={errors.agreeToTerms ? "text-red-500" : ""}
                      >
                        I agree to the terms and conditions *
                      </Label>
                    </div>
                    {errors.agreeToTerms && (
                      <p className="text-sm text-red-500">{errors.agreeToTerms}</p>
                    )}
                  </div>
                  
                  {/* Message Box for success/error messages */}
                  {message.text && (
                    <div className={`p-4 rounded-md ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {message.text}
                    </div>
                  )}

                  {/* Submit button */}
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-red-600 hover:bg-red-700 text-white py-3 rounded-xl shadow-lg transition-all duration-300"
                  >
                    {isSubmitting ? "Registering..." : "Register on Blockchain"}
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
