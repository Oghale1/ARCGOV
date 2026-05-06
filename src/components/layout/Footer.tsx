// ArcGov — Built by Gemini — arcgov.xyz
import Link from 'next/link';

export function Footer() {
  return (
    <footer className="border-t border-[#E5E7EB] dark:border-[#1F2937] bg-white dark:bg-[#0F1117] py-12 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-8 text-center md:text-left">
          <div className="space-y-4">
            <div className="flex items-center gap-2 justify-center md:justify-start">
              <div className="w-6 h-6 rounded-full bg-[#1D9E75] flex items-center justify-center">
                <div className="w-3 h-3 rounded-full border border-white" />
              </div>
              <span className="text-lg font-bold tracking-tight">ArcGov</span>
            </div>
            <p className="text-sm text-[#6B7280] dark:text-[#9CA3AF] max-w-xs">
              The first and most important governance interface for Arc, a stablecoin-native Layer-1 blockchain by Circle.
            </p>
          </div>

          <div className="flex gap-12 text-sm">
            <div className="space-y-4">
              <h4 className="font-semibold text-[#111827] dark:text-white uppercase tracking-wider">Project</h4>
              <ul className="space-y-2">
                <li><Link href="/about" className="hover:text-[#1D9E75]">About</Link></li>
                <li><Link href="/quantum" className="hover:text-[#1D9E75]">Quantum Resistance</Link></li>
                <li><Link href="/architects" className="hover:text-[#1D9E75]">Architects Program</Link></li>
              </ul>
            </div>
            <div className="space-y-4">
              <h4 className="font-semibold text-[#111827] dark:text-white uppercase tracking-wider">Ecosystem</h4>
              <ul className="space-y-2">
                <li><a href="https://testnet.arcscan.app" target="_blank" rel="noopener noreferrer" className="hover:text-[#1D9E75]">ArcScan</a></li>
                <li><a href="https://faucet.circle.com" target="_blank" rel="noopener noreferrer" className="hover:text-[#1D9E75]">Faucet</a></li>
                <li><a href="https://circle.com" target="_blank" rel="noopener noreferrer" className="hover:text-[#1D9E75]">Circle</a></li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-[#E5E7EB] dark:border-[#1F2937] flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-[#6B7280] dark:text-[#9CA3AF]">
          <div>
            Built on Arc Testnet · Open Source on <a href="https://github.com/Oghale1/ARCGOV" target="_blank" rel="noopener noreferrer" className="underline hover:text-[#1D9E75]">GitHub</a>
          </div>
          <div>
            © {new Date().getFullYear()} ArcGov · Not affiliated with Circle
          </div>
        </div>
      </div>
    </footer>
  );
}
