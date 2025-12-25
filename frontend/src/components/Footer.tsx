import Link from "next/link";
import { FaInstagram, FaYoutube, FaXTwitter } from "react-icons/fa6";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-stone-800 py-10 sm:py-12 text-white mt-12 sm:mt-16">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-10 pb-8 mb-8 border-b border-stone-700">
          <div>
            <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 text-stone-100">About GoTrailhead</h3>
            <p className="text-sm text-stone-300 leading-relaxed">
              Your trusted source for quality outdoor gear and equipment. Gear up for your next adventure.
            </p>
          </div>

          <div>
            <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 text-stone-100">Quick Links</h3>
            <ul className="space-y-2 text-sm text-stone-300">
              <li>
                <Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-white transition-colors">Contact Us</Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 text-stone-100">Follow Us</h3>
            <div className="flex space-x-4">
              <a href="#" className="text-stone-300 hover:text-white transition-colors" aria-label="Instagram">
                <FaInstagram className="w-5 h-5 sm:w-6 sm:h-6" />
              </a>
              <a href="#" className="text-stone-300 hover:text-white transition-colors" aria-label="YouTube">
                <FaYoutube className="w-5 h-5 sm:w-6 sm:h-6" />
              </a>
              <a href="#" className="text-stone-300 hover:text-white transition-colors" aria-label="Twitter">
                <FaXTwitter className="w-5 h-5 sm:w-6 sm:h-6" />
              </a>
            </div>
          </div>
        </div>

        <div className="text-center text-sm text-stone-400">
          <p>&copy; {currentYear} GoTrailhead. All Rights Reserved.</p>
        </div>
      </div>
    </footer>
  );
}
