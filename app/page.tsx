'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';

const SERVICES = [
  { icon: '🔋', title: 'EV Diagnostics', desc: 'Full electric vehicle battery, motor, and software diagnostics with real-time health monitoring.' },
  { icon: '🔧', title: 'General Repair', desc: 'Engine, transmission, brake, and suspension repair by certified technicians.' },
  { icon: '🎨', title: 'Customization', desc: 'Body kits, wraps, lighting, and performance upgrades tailored to your vision.' },
  { icon: '⚡', title: 'Charging Solutions', desc: 'Home and commercial EV charger installation and maintenance.' },
  { icon: '🛞', title: 'Tire & Alignment', desc: 'Tire rotation, balancing, replacement, and precision wheel alignment.' },
  { icon: '📋', title: 'Maintenance Plans', desc: 'Scheduled maintenance packages to keep your vehicle performing at its best.' },
];

const TESTIMONIALS = [
  { name: 'Abrar M.', text: 'Ikram Automotive transformed my Tesla Model 3 with a custom wrap and performance tune. Exceptional quality!', role: 'EV Owner' },
  { name: 'Daniel K.', text: 'Best workshop in Addis for both EV and traditional vehicles. The real-time job tracking gives me peace of mind.', role: 'Fleet Manager' },
  { name: 'Sara T.', text: 'Quick diagnostics, fair pricing, and they kept me updated every step. Highly recommend for any auto service.', role: 'Customer' },
];

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      if (user.role === 'Customer') router.push('/portal');
      else if (user.role === 'SuperAdmin') router.push('/superadmin');
      else router.push('/dashboard');
    }
  }, [user, loading, router]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="animate-pulse text-gray-400">Loading...</div></div>;
  }
  if (user) return null;

  return (
    <div className="min-h-screen bg-white">
      <nav className="fixed top-0 w-full bg-white/90 backdrop-blur-md z-50 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🚗</span>
            <span className="text-xl font-bold text-gray-900">Ikram Automotive</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-600">
            <a href="#services" className="hover:text-gray-900 transition">Services</a>
            <a href="#testimonials" className="hover:text-gray-900 transition">Testimonials</a>
            <a href="#locations" className="hover:text-gray-900 transition">Locations</a>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm font-medium text-gray-700 hover:text-gray-900 transition px-3 py-2">Login</Link>
            <Link href="/book" className="bg-red-600 text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-red-700 transition">Book Now</Link>
          </div>
        </div>
      </nav>

      <section className="pt-24 pb-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-12 py-12">
          <div className="flex-1 space-y-6">
            <div className="inline-block bg-red-600/20 text-red-400 text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wider">Ethiopia&apos;s #1 EV Workshop</div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight">
              Expert Auto Repair<br /><span className="text-red-500">& EV Service</span>
            </h1>
            <p className="text-lg text-gray-300 max-w-lg">
              From diagnostics to full customization — trust Ikram Automotive for professional vehicle service with real-time tracking and transparent pricing.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link href="/book" className="bg-red-600 hover:bg-red-700 text-white font-semibold px-6 py-3 rounded-lg transition text-center">
                Book Appointment
              </Link>
              <a href="#services" className="border border-gray-600 hover:border-gray-400 text-gray-300 font-semibold px-6 py-3 rounded-lg transition text-center">
                Our Services
              </a>
            </div>
            <div className="flex gap-8 pt-4">
              <div><div className="text-2xl font-bold">500+</div><div className="text-sm text-gray-400">Vehicles Serviced</div></div>
              <div><div className="text-2xl font-bold">98%</div><div className="text-sm text-gray-400">Customer Satisfaction</div></div>
              <div><div className="text-2xl font-bold">24/7</div><div className="text-sm text-gray-400">Job Tracking</div></div>
            </div>
          </div>
          <div className="flex-1 bg-gray-800/50 rounded-2xl p-8 border border-gray-700 max-w-md w-full">
            <div className="text-center space-y-4">
              <div className="text-5xl">🔋</div>
              <h3 className="text-xl font-bold">EV-Ready Workshop</h3>
              <p className="text-gray-400 text-sm">Specialized in Tesla, BYD, and all major EV brands with certified high-voltage technicians.</p>
              <div className="grid grid-cols-2 gap-3 text-sm pt-2">
                <div className="bg-gray-700/50 rounded-lg p-3 text-center"><div className="font-semibold">Battery Health</div><div className="text-xs text-gray-400">Full diagnostics</div></div>
                <div className="bg-gray-700/50 rounded-lg p-3 text-center"><div className="font-semibold">Motor Service</div><div className="text-xs text-gray-400">Performance tuning</div></div>
                <div className="bg-gray-700/50 rounded-lg p-3 text-center"><div className="font-semibold">Software Update</div><div className="text-xs text-gray-400">OTA management</div></div>
                <div className="bg-gray-700/50 rounded-lg p-3 text-center"><div className="font-semibold">Charging</div><div className="text-xs text-gray-400">Installation & repair</div></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="services" className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">Our Services</h2>
            <p className="text-gray-500 mt-2 max-w-xl mx-auto">Comprehensive automotive care for electric and traditional vehicles</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {SERVICES.map((s) => (
              <div key={s.title} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition">
                <div className="text-3xl mb-3">{s.icon}</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{s.title}</h3>
                <p className="text-sm text-gray-500">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">How It Works</h2>
          <p className="text-gray-500 mb-12">Book in minutes, track in real-time</p>
          <div className="grid md:grid-cols-4 gap-8">
            {[
              { step: '1', title: 'Book Online', desc: 'Choose your service and preferred time slot.' },
              { step: '2', title: 'Drop Off', desc: 'Bring your vehicle to the workshop.' },
              { step: '3', title: 'Track Progress', desc: 'Monitor repairs in real-time from your phone.' },
              { step: '4', title: 'Pay & Drive', desc: 'Pay online or at the workshop. Drive happy!' },
            ].map((item) => (
              <div key={item.step} className="flex flex-col items-center">
                <div className="w-12 h-12 bg-red-600 text-white rounded-full flex items-center justify-center text-lg font-bold mb-3">{item.step}</div>
                <h4 className="font-semibold text-gray-900 mb-1">{item.title}</h4>
                <p className="text-sm text-gray-500">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="testimonials" className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">What Our Customers Say</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t) => (
              <div key={t.name} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-center gap-1 text-yellow-500 mb-3">★★★★★</div>
                <p className="text-gray-600 text-sm mb-4 italic">&ldquo;{t.text}&rdquo;</p>
                <div>
                  <div className="font-semibold text-gray-900 text-sm">{t.name}</div>
                  <div className="text-xs text-gray-400">{t.role}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="locations" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Visit Us</h2>
          <p className="text-gray-500 mb-8">Conveniently located in Addis Ababa</p>
          <div className="bg-gray-100 rounded-xl p-8 max-w-2xl mx-auto">
            <div className="text-4xl mb-4">📍</div>
            <h3 className="text-lg font-semibold text-gray-900">Ikram Automotive Workshop</h3>
            <p className="text-gray-500 text-sm mt-1">Bole Road, Addis Ababa, Ethiopia</p>
            <p className="text-gray-500 text-sm">Open Mon–Sat: 8:00 AM – 5:00 PM</p>
            <p className="text-gray-500 text-sm mt-2">📞 +251 911 111 112 &nbsp;|&nbsp; ✉️ info@ikramauto.com</p>
          </div>
        </div>
      </section>

      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-900 text-white">
        <div className="max-w-3xl mx-auto text-center space-y-6">
          <h2 className="text-3xl font-bold">Ready to Service Your Vehicle?</h2>
          <p className="text-gray-400">Book an appointment today and experience transparent, professional auto service.</p>
          <Link href="/book" className="inline-block bg-red-600 hover:bg-red-700 text-white font-semibold px-8 py-3 rounded-lg transition text-lg">
            Book Now
          </Link>
        </div>
      </section>

      <footer className="py-8 px-4 sm:px-6 lg:px-8 border-t border-gray-100">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-400">
          <div className="flex items-center gap-2">
            <span>🚗</span>
            <span className="font-medium text-gray-600">Ikram Automotive</span>
          </div>
          <div>© {new Date().getFullYear()} Ikram Automotive. All rights reserved.</div>
          <div className="flex gap-4">
            <Link href="/login" className="hover:text-gray-700 transition">Login</Link>
            <Link href="/book" className="hover:text-gray-700 transition">Book</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
