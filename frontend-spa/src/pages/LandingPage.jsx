import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-primary-600 to-primary-800 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              AI-Driven Traffic Violation Detection System
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-primary-100">
              Automated traffic monitoring using YOLOv8 and OCR technology
            </p>
            <div className="flex justify-center space-x-4">
              <Link
                to="/register"
                className="bg-white text-primary-600 px-8 py-3 rounded-lg font-semibold hover:bg-primary-50 transition"
              >
                Get Started
              </Link>
              <Link
                to="/login"
                className="bg-transparent border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-primary-600 transition"
              >
                Login
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12">Key Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="text-primary-600 text-4xl mb-4">🚗</div>
              <h3 className="text-xl font-semibold mb-2">Automatic Detection</h3>
              <p className="text-gray-600">
                Real-time vehicle detection using YOLOv8 AI model for accurate violation tracking.
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="text-primary-600 text-4xl mb-4">🔍</div>
              <h3 className="text-xl font-semibold mb-2">Plate Recognition</h3>
              <p className="text-gray-600">
                Advanced OCR technology for automatic number plate recognition with high accuracy.
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="text-primary-600 text-4xl mb-4">📋</div>
              <h3 className="text-xl font-semibold mb-2">Digital Challan</h3>
              <p className="text-gray-600">
                Instant challan generation based on detected violations with configurable fine amounts.
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="text-primary-600 text-4xl mb-4">💳</div>
              <h3 className="text-xl font-semibold mb-2">Online Payment</h3>
              <p className="text-gray-600">
                Secure online payment system for quick challan settlement with digital receipts.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-primary-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-primary-600">1</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Video Processing</h3>
              <p className="text-gray-600">
                System processes traffic video feeds using YOLOv8 to detect vehicles and violations.
              </p>
            </div>
            <div className="text-center">
              <div className="bg-primary-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-primary-600">2</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">OCR Recognition</h3>
              <p className="text-gray-600">
                Number plates are extracted and recognized using EasyOCR with enhanced preprocessing.
              </p>
            </div>
            <div className="text-center">
              <div className="bg-primary-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-primary-600">3</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Challan & Payment</h3>
              <p className="text-gray-600">
                Violations are recorded, challans generated, and payments processed automatically.
              </p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
