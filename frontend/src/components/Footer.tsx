import Link from "next/link";
import { FaInstagram, FaYoutube, FaXTwitter } from "react-icons/fa6";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-800 py-4 text-white">
      <div className="container mx-auto px-4 max-w-6xl grid grid-cols-1 md:grid-cols-[2.5fr_1.5fr_1fr] gap-8 border-b border-gray-700 pb-8 mb-8">
        <div>
          <h3 className="text-xl mb-4">About GoTrailhead</h3>
          <p className="text-sm leading-relaxed">
            Your trusted source for quality outdoor gear and equipment. Gear up
            for your next adventure.
          </p>
        </div>

        <div>
          <h3 className="text-xl mb-4">Quick Links</h3>
          <ul className="space-y-2 list-none pl-0">
            <li>
              <Link href="/privacy">Privacy Policy</Link>
            </li>
            <li>
              <Link href="/terms">Terms of Service</Link>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="text-xl mb-4">Contact</h3>
          <p>
            <Link href="/contact">Contact Us</Link>
          </p>
          <div className="flex space-x-4 mt-4">
            <FaInstagram className="w-6 h-6" />
            <FaYoutube className="w-6 h-6" />
            <FaXTwitter className="w-6 h-6" />
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 pb-8 text-center text-sm">
        <p>&copy; {currentYear} GoTrailhead. All Rights Reserved.</p>
      </div>
    </footer>
  );
}
