import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Phone } from "lucide-react";

const Index = () => {
  return (
    <div className="w-screen h-screen bg-gradient-to-b from-blue-100 via-blue-50 to-blue-200 flex items-center justify-center overflow-hidden">
      <div className="w-full h-full flex flex-col items-center justify-center px-4 py-4">
        {/* Header Bar */}
        <div className="w-full max-w-md bg-white border-4 border-gray-800 rounded-t-lg p-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-600"></div>
            <span className="font-bold text-sm text-gray-800">SANTA</span>
            <div className="flex-1 h-0.5 bg-gray-400 ml-2" style={{ width: "100px" }}></div>
          </div>
          <button className="w-5 h-5 border-2 border-gray-800 flex items-center justify-center text-xs font-bold">
            ✕
          </button>
        </div>

        {/* Main Content Card */}
        <div className="w-full max-w-md bg-white border-4 border-gray-800 rounded-b-lg shadow-2xl overflow-hidden">
          {/* Santa Image Container */}
          <div className="w-full aspect-square bg-gradient-to-b from-amber-100 to-amber-50 flex items-center justify-center border-b-4 border-gray-800">
            {/* Placeholder for Santa image - user will provide */}
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-b from-yellow-100 to-orange-100">
              <img 
                src="/santa.png" 
                alt="Santa" 
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
              {/* Fallback if image not found */}
              <div className="text-center text-gray-400 text-sm">
              </div>
            </div>
          </div>

          {/* Text and Buttons */}
          <div className="p-6 bg-white flex flex-col items-center gap-6">
            {/* Title */}
            <h1 className="text-2xl font-bold text-gray-800 text-center">
              Santa is calling you
            </h1>

            {/* Buttons */}
            <div className="w-full flex flex-col gap-3">
              <Link to="/appelle" className="w-full">
                <Button className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 rounded-lg text-base flex items-center justify-center gap-2 border-2 border-green-700">
                  <span className="text-lg"></span>
                  ANSWER HIS CALL
                </Button>
              </Link>

             
            </div>
          </div>
        </div>

        {/* Footer Text */}
        <div className="mt-4 text-center text-gray-600 text-xs">
        </div>
      </div>
    </div>
  );
};

export default Index;
