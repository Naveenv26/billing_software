import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";

// --- Axios API Client & Auth Functions ---
const api = axios.create({
  baseURL: "http://localhost:8000/api",
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("access_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

async function login(username, password) {
  const response = await api.post("/token/", { username, password });
  if (response.data.access) {
    localStorage.setItem("access_token", response.data.access);
    localStorage.setItem("refresh_token", response.data.refresh);
  }
  return response.data;
}

// --- Gemini API Function for Shop Name Suggestions ---
async function getShopNameSuggestions(keywords) {
  const apiKey = ""; // Provide Gemini API key here if needed
  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`;

  const systemPrompt =
    "You are a creative business naming expert specializing in the Indian market. Generate a list of 5 unique, catchy, and modern shop names. Return ONLY a JSON array of strings, like [\"Name 1\", \"Name 2\"].";
  const userQuery = `Generate shop names based on these keywords: ${keywords}.`;

  const payload = {
    contents: [{ parts: [{ text: userQuery }] }],
    systemInstruction: { parts: [{ text: systemPrompt }] },
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: {
        type: "ARRAY",
        items: { type: "STRING" },
      },
    },
  };

  try {
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      throw new Error(`API call failed with status: ${response.status}`);
    }
    const result = await response.json();
    const jsonText = result.candidates?.[0]?.content?.parts?.[0]?.text;
    return JSON.parse(jsonText || "[]");
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    return [];
  }
}

const handleLogout = () => {
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
  window.location.href = "/login"; // ✅ redirect to login
};

// --- Helper & UI Components ---
const InputField = ({
  id,
  label,
  type,
  value,
  onChange,
  required = false,
  children,
  placeholder = "",
}) => (
  <div className="mb-4 relative">
    <label
      htmlFor={id}
      className="block text-sm font-medium text-gray-700 mb-1"
    >
      {label}
    </label>
    <input
      type={type}
      id={id}
      name={id}
      value={value}
      onChange={onChange}
      required={required}
      placeholder={placeholder}
      className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow"
    />
    {children}
  </div>
);

const StepIndicator = ({ currentStep }) => (
  <div className="flex items-center justify-center mb-6">
    <div className="flex items-center">
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold transition-colors ${
          currentStep === 1 ? "bg-indigo-600" : "bg-green-500"
        }`}
      >
        {currentStep > 1 ? "✓" : "1"}
      </div>
      <p
        className={`ml-3 font-semibold transition-colors ${
          currentStep === 1 ? "text-indigo-600" : "text-gray-600"
        }`}
      >
        Account
      </p>
    </div>
    <div className="w-16 h-1 bg-gray-200 mx-4 rounded-full">
      <div
        className={`h-1 rounded-full bg-indigo-600 transition-all duration-300 ${
          currentStep === 2 ? "w-full" : "w-0"
        }`}
      ></div>
    </div>
    <div className="flex items-center">
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center font-bold transition-colors ${
          currentStep === 2
            ? "bg-indigo-600 text-white"
            : "bg-gray-300 text-gray-500"
        }`}
      >
        2
      </div>
      <p
        className={`ml-3 font-semibold transition-colors ${
          currentStep === 2 ? "text-indigo-600" : "text-gray-400"
        }`}
      >
        Shop Details
      </p>
    </div>
  </div>
);

// --- Gemini-Powered Suggestion Modal ---
const SuggestionModal = ({ onClose, onSelectName }) => {
  const [keywords, setKeywords] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    if (!keywords.trim()) return;
    setIsGenerating(true);
    const names = await getShopNameSuggestions(keywords);
    setSuggestions(names);
    setIsGenerating(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fade-in">
      <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md m-4">
        <h3 className="text-xl font-bold text-gray-800 mb-4">
          ✨ AI Shop Name Generator
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          Describe your shop in a few words (e.g., "fresh organic vegetables
          Mumbai") and let AI suggest some creative names!
        </p>
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            value={keywords}
            onChange={(e) => setKeywords(e.target.value)}
            placeholder="Enter keywords..."
            className="flex-grow px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
          />
          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="px-4 py-2 text-white font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 transition-all"
          >
            {isGenerating ? "Thinking..." : "Suggest"}
          </button>
        </div>
        {suggestions.length > 0 && (
          <div className="border-t pt-4">
            <p className="font-semibold text-gray-700 mb-2">
              Click a name to use it:
            </p>
            <ul className="space-y-2">
              {suggestions.map((name, index) => (
                <li
                  key={index}
                  onClick={() => onSelectName(name)}
                  className="p-3 bg-gray-50 rounded-lg hover:bg-indigo-100 hover:text-indigo-800 cursor-pointer transition-colors"
                >
                  {name}
                </li>
              ))}
            </ul>
          </div>
        )}
        <button
          onClick={onClose}
          className="w-full mt-6 py-2 px-4 text-gray-700 font-semibold rounded-lg bg-gray-100 hover:bg-gray-200 focus:outline-none transition-all"
        >
          Close
        </button>
      </div>
    </div>
  );
};

// --- Login & Signup Form Components ---
const LoginForm = ({ onSwitchView }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [credentials, setCredentials] = useState({
    username: "",
    password: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setError("");
    setCredentials((prev) => ({ ...prev, [name]: value }));
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await login(credentials.username, credentials.password);
      window.location.href = "/dashboard"; // ✅ go to dashboard
    } catch (err) {
      console.error("Login failed:", err);
      setError("Invalid username or password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-slide-in-down">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-extrabold text-gray-900">Welcome Back!</h2>
        <p className="mt-2 text-sm text-gray-600">
          Log in to continue to your shop.
        </p>
      </div>
      {error && (
        <div className="p-3 my-2 text-center text-red-800 bg-red-100 rounded-lg">
          {error}
        </div>
      )}
      <form onSubmit={handleLogin}>
        <InputField
          id="username"
          label="Username"
          type="text"
          value={credentials.username}
          onChange={handleChange}
          required
        />
        <InputField
          id="password"
          label="Password"
          type="password"
          value={credentials.password}
          onChange={handleChange}
          required
        />
        <button
          type="submit"
          disabled={loading || !credentials.username || !credentials.password}
          className="w-full mt-6 py-3 px-4 text-white font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-300 disabled:cursor-not-allowed transition-all"
        >
          {loading ? "Signing In..." : "Log In"}
        </button>
      </form>
      <p className="text-center text-sm text-gray-500 mt-6">
        Don't have an account?{" "}
        <button
          onClick={() => onSwitchView("signup")}
          className="font-medium text-indigo-600 hover:text-indigo-500 focus:outline-none"
        >
          Sign up
        </button>
      </p>
    </div>
  );
};

const SignupForm = ({ onSwitchView }) => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    email: "",
    shopName: "",
    shopAddress: "",
    mobile: "",
    language: "en",
    isSameWhatsApp: true,
    whatsApp: "",
    gstin: "",
  });
  const [isChecking, setIsChecking] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState(null);
  const [showSuggestionModal, setShowSuggestionModal] = useState(false);

  const debounce = (func, delay) => {
    let t;
    return (...a) => {
      clearTimeout(t);
      t = setTimeout(() => func.apply(this, a), delay);
    };
  };
  const checkUsername = async (username) => {
    setIsChecking(true);
    try {
      if (["admin", "test", "root"].includes(username)) {
        setUsernameAvailable(false);
      } else {
        setUsernameAvailable(true);
      }
    } catch (err) {
      setUsernameAvailable(false);
    } finally {
      setIsChecking(false);
    }
  };
  const debouncedCheck = useCallback(debounce(checkUsername, 500), []);

  useEffect(() => {
    if (formData.username.trim().length >= 4) {
      debouncedCheck(formData.username.trim());
    } else {
      setUsernameAvailable(null);
    }
  }, [formData.username, debouncedCheck]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setError("");
    setFormData((p) => ({ ...p, [name]: type === "checkbox" ? checked : value }));
  };

  const handleAccountSubmit = (e) => {
    e.preventDefault();
    if (usernameAvailable) setStep(2);
  };

  const handleDetailsSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const payload = {
      shop: {
        name: formData.shopName,
        address: formData.shopAddress,
        contact_phone: formData.mobile,
        language: formData.language,
        contact_email: formData.email,
      },
      owner: {
        username: formData.username,
        password: formData.password,
        email: formData.email,
      },
      create_shopkeeper: false,
    };
    try {
      await api.post("/register/", payload);
      alert("Signup successful! Please log in.");
      onSwitchView("login"); // ✅ go back to login
    } catch (err) {
      if (err.response?.data) {
        const data = err.response.data;
        const key = Object.keys(data)[0];
        const val =
          typeof data[key] === "object"
            ? Object.values(data[key])[0]
            : data[key];
        setError(`${key.replace("_", " ")}: ${val}`);
      } else {
        setError("An unknown network error occurred.");
      }
    } finally {
      setLoading(false);
    }
  };

  const getUsernameMessage = () => {
    if (isChecking)
      return <p className="text-sm text-gray-500 mt-1">Checking availability...</p>;
    if (usernameAvailable === true)
      return <p className="text-sm text-green-600 mt-1">✓ Username is available!</p>;
    if (usernameAvailable === false)
      return <p className="text-sm text-red-600 mt-1">✗ This username is already taken.</p>;
    if (formData.username && formData.username.length < 4)
      return <p className="text-sm text-gray-500 mt-1">Must be at least 4 characters.</p>;
    return <div className="h-6"></div>;
  };

  const handleSelectSuggestedName = (name) => {
    setFormData((prev) => ({ ...prev, shopName: name }));
    setShowSuggestionModal(false);
  };

  return (
    <div className="animate-slide-in-down">
      {showSuggestionModal && (
        <SuggestionModal
          onClose={() => setShowSuggestionModal(false)}
          onSelectName={handleSelectSuggestedName}
        />
      )}
      <div className="text-center">
        <h2 className="text-3xl font-extrabold text-gray-900">
          Create Your Shop Account
        </h2>
      </div>
      {error && (
        <div className="p-3 my-2 text-center text-red-800 bg-red-100 rounded-lg">
          {error}
        </div>
      )}
      <StepIndicator currentStep={step} />
      {step === 1 ? (
        <form onSubmit={handleAccountSubmit} noValidate>
          <InputField
            id="username"
            label="Choose a Username"
            type="text"
            value={formData.username}
            onChange={handleChange}
            required
          >
            {getUsernameMessage()}
          </InputField>
          <InputField
            id="email"
            label="Your Email Address"
            type="email"
            value={formData.email}
            onChange={handleChange}
            required
          />
          <InputField
            id="password"
            label="Password"
            type="password"
            value={formData.password}
            onChange={handleChange}
            required
          />
          <button
            type="submit"
            disabled={!usernameAvailable || isChecking || !formData.password || !formData.email}
            className="w-full mt-6 py-3 px-4 text-white font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 transition-all"
          >
            Continue
          </button>
        </form>
      ) : (
        <form onSubmit={handleDetailsSubmit}>
          <div className="flex justify-between items-center">
            <label
              htmlFor="shopName"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Shop Name
            </label>
            <button
              type="button"
              onClick={() => setShowSuggestionModal(true)}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
            >
              ✨ Suggest Names
            </button>
          </div>
          <input
            id="shopName"
            name="shopName"
            type="text"
            value={formData.shopName}
            onChange={handleChange}
            required
            className="w-full mb-4 px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500"
          />
          <InputField
            id="shopAddress"
            label="Shop Address"
            type="text"
            value={formData.shopAddress}
            onChange={handleChange}
            required
          />
          <InputField
            id="mobile"
            label="Mobile Number"
            type="tel"
            value={formData.mobile}
            onChange={handleChange}
            required
          />
          <div className="flex items-center my-4">
            <input
              id="isSameWhatsApp"
              name="isSameWhatsApp"
              type="checkbox"
              checked={formData.isSameWhatsApp}
              onChange={handleChange}
              className="h-4 w-4 text-indigo-600 border-gray-300 rounded"
            />
            <label
              htmlFor="isSameWhatsApp"
              className="ml-2 block text-sm text-gray-900"
            >
              WhatsApp number is same as mobile.
            </label>
          </div>
                   {!formData.isSameWhatsApp && (
            <InputField
              id="whatsApp"
              label="WhatsApp Number"
              type="tel"
              value={formData.whatsApp}
              onChange={handleChange}
              required
            />
          )}

          <InputField
            id="gstin"
            label="GSTIN (Optional)"
            type="text"
            value={formData.gstin}
            onChange={handleChange}
          />

          <div className="flex items-center gap-4 mt-6">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="w-full py-3 px-4 text-gray-700 font-semibold rounded-lg bg-gray-100 hover:bg-gray-200"
            >
              Back
            </button>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 text-white font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300"
            >
              {loading ? "Creating..." : "Finish Signup"}
            </button>
          </div>
        </form>
      )}

      <p className="text-center text-sm text-gray-500 mt-6">
        Already have an account?{" "}
        <button
          onClick={() => onSwitchView("login")}
          className="font-medium text-indigo-600 hover:text-indigo-500 focus:outline-none"
        >
          Log in
        </button>
      </p>
    </div>
  );
};

// --- Main Auth Page Component ---
export default function Login() {
  const [view, setView] = useState("signup"); // 'login' or 'signup'
  const [animationClass, setAnimationClass] = useState("animate-slide-in-down");

  const handleSwitchView = (newView) => {
    if (view === newView) return;
    setAnimationClass("animate-slide-out-up");
    setTimeout(() => {
      setView(newView);
      setAnimationClass("animate-slide-in-down");
    }, 400); // match animation duration
  };

  return (
    <>
      <style>{`
        @keyframes slide-out-up {
          from { transform: translateY(0); opacity: 1; }
          to { transform: translateY(-50px); opacity: 0; }
        }
        @keyframes slide-in-down {
          from { transform: translateY(50px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-slide-out-up { animation: slide-out-up 0.4s ease-out forwards; }
        .animate-slide-in-down { animation: slide-in-down 0.4s ease-in forwards; }
        .animate-fade-in { animation: fade-in 0.3s ease-out forwards; }
      `}</style>
      <div className="flex items-center justify-center min-h-screen bg-gray-50 font-sans p-4">
        <div
          className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8"
          style={{ minHeight: "680px" }}
        >
          <div className={animationClass}>
            {view === "login" ? (
              <LoginForm onSwitchView={handleSwitchView} />
            ) : (
              <SignupForm onSwitchView={handleSwitchView} />
            )}
          </div>
        </div>
      </div>
    </>
  );
}

          