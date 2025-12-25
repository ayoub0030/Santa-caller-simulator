import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Phone, Sparkles, Gift, Music, Heart } from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-red-50 via-white to-green-50">
      {/* Header */}
      <header className="border-b border-red-200 bg-white/80 backdrop-blur-sm shadow-sm">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-center">
            <div className="text-center">
              <h1 className="text-4xl font-bold text-red-600">🎅 Santa Call Simulator</h1>
              <p className="text-lg text-green-600 mt-2">Talk to Santa Claus via AI Voice</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        {/* Hero Section */}
        <section className="text-center mb-16">
          <div className="mb-8">
            <div className="text-7xl mb-4 animate-bounce">🎄</div>
            <h2 className="text-3xl font-bold text-gray-800 mb-4">
              Experience the Magic of Christmas
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Have a real-time conversation with Santa Claus powered by advanced AI voice technology. 
              Perfect for children and families to celebrate the holiday season!
            </p>
          </div>
        </section>

        {/* Features Grid */}
        <section className="grid md:grid-cols-3 gap-6 mb-16">
          <Card className="border-red-200 bg-white hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="text-4xl mb-2">🎤</div>
              <CardTitle className="text-red-600">Voice Conversation</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Talk to Santa in real-time using your microphone. Santa responds naturally to your questions and wishes.
              </p>
            </CardContent>
          </Card>

          <Card className="border-green-200 bg-white hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="text-4xl mb-2">✨</div>
              <CardTitle className="text-green-600">AI Powered</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Advanced AI technology makes Santa understand context and respond with warmth and personality.
              </p>
            </CardContent>
          </Card>

          <Card className="border-red-200 bg-white hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="text-4xl mb-2">🎁</div>
              <CardTitle className="text-red-600">Interactive Experience</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Ask Santa about your wishes, tell him about your year, or just chat and enjoy the festive spirit.
              </p>
            </CardContent>
          </Card>
        </section>

        {/* How It Works */}
        <section className="bg-white rounded-lg border border-red-200 p-8 mb-16">
          <h3 className="text-2xl font-bold text-center text-red-600 mb-8">How It Works</h3>
          <div className="grid md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="bg-red-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-red-600">1</span>
              </div>
              <h4 className="font-semibold text-gray-800 mb-2">Click Call</h4>
              <p className="text-sm text-gray-600">Start your conversation with Santa</p>
            </div>
            <div className="text-center">
              <div className="bg-green-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-green-600">2</span>
              </div>
              <h4 className="font-semibold text-gray-800 mb-2">Allow Microphone</h4>
              <p className="text-sm text-gray-600">Grant permission to use your mic</p>
            </div>
            <div className="text-center">
              <div className="bg-red-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-red-600">3</span>
              </div>
              <h4 className="font-semibold text-gray-800 mb-2">Speak Freely</h4>
              <p className="text-sm text-gray-600">Talk to Santa naturally</p>
            </div>
            <div className="text-center">
              <div className="bg-green-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-green-600">4</span>
              </div>
              <h4 className="font-semibold text-gray-800 mb-2">Enjoy Magic</h4>
              <p className="text-sm text-gray-600">Experience the holiday spirit</p>
            </div>
          </div>
        </section>

        {/* Call to Action */}
        <section className="text-center mb-16">
          <h3 className="text-2xl font-bold text-gray-800 mb-6">Ready to Talk to Santa?</h3>
          <Link to="/appelle">
            <Button className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white px-8 py-6 text-lg rounded-lg shadow-lg hover:shadow-xl transition-all">
              <Phone className="mr-3 h-5 w-5" />
              Start Santa Call
            </Button>
          </Link>
        </section>

        {/* Features List */}
        <section className="bg-gradient-to-r from-red-50 to-green-50 rounded-lg p-8 mb-16">
          <h3 className="text-2xl font-bold text-center text-gray-800 mb-8">Why Kids Love It</h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="flex items-start gap-4">
              <Sparkles className="text-red-600 flex-shrink-0 mt-1" />
              <div>
                <h4 className="font-semibold text-gray-800">Magical Experience</h4>
                <p className="text-gray-600 text-sm">Feel the real magic of Christmas with an authentic Santa conversation</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <Gift className="text-green-600 flex-shrink-0 mt-1" />
              <div>
                <h4 className="font-semibold text-gray-800">Share Your Wishes</h4>
                <p className="text-gray-600 text-sm">Tell Santa about your Christmas wishes and dreams</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <Music className="text-red-600 flex-shrink-0 mt-1" />
              <div>
                <h4 className="font-semibold text-gray-800">Festive Fun</h4>
                <p className="text-gray-600 text-sm">Enjoy a fun and engaging conversation filled with holiday cheer</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <Heart className="text-green-600 flex-shrink-0 mt-1" />
              <div>
                <h4 className="font-semibold text-gray-800">Safe & Family-Friendly</h4>
                <p className="text-gray-600 text-sm">A wholesome experience designed for families and children</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-red-700 text-white py-12 mt-16">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8 mb-8">
            <div>
              <h4 className="font-bold text-lg mb-4">Santa Call Simulator</h4>
              <p className="text-red-100">Bringing the magic of Christmas to your home with AI-powered conversations.</p>
            </div>
            <div>
              <h4 className="font-bold text-lg mb-4">Quick Links</h4>
              <ul className="space-y-2 text-red-100">
                <li><a href="#" className="hover:text-white transition">About</a></li>
                <li><a href="#" className="hover:text-white transition">Features</a></li>
                <li><a href="#" className="hover:text-white transition">Contact</a></li>
              </ul>
            </div>
            <div className="text-center md:text-right">
              <Link to="/appelle">
                <Button className="bg-white text-red-700 hover:bg-red-50 font-semibold px-6 py-2">
                  <Phone className="mr-2 h-4 w-4" />
                  Call Santa Now
                </Button>
              </Link>
            </div>
          </div>
          <div className="border-t border-red-600 pt-8 text-center text-red-100">
            <p>&copy; 2024 Santa Call Simulator. Spreading Christmas magic worldwide. 🎄</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
