export default function Footer() {
  return (
    <footer className="bg-gray-800 text-white">
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-lg font-semibold mb-4">Traffic Violation System</h3>
            <p className="text-gray-400">
              AI-driven traffic violation detection using YOLOv8 and OCR technology
              for automated challan generation and management.
            </p>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-4">Features</h3>
            <ul className="space-y-2 text-gray-400">
              <li>Automatic Violation Detection</li>
              <li>Number Plate Recognition</li>
              <li>Digital Challan Generation</li>
              <li>Secure Online Payment</li>
            </ul>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-4">Technology</h3>
            <ul className="space-y-2 text-gray-400">
              <li>YOLOv8 for Vehicle Detection</li>
              <li>EasyOCR for Plate Recognition</li>
              <li>Flask Backend API</li>
              <li>React Frontend</li>
            </ul>
          </div>
        </div>
        <div className="mt-8 pt-8 border-t border-gray-700 text-center text-gray-400">
          <p>&copy; 2024 AI-Driven Traffic Violation Detection System. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
