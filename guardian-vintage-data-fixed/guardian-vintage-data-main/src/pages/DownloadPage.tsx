import { useState } from "react";
import { useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import JSZip from "jszip";

export default function DownloadPage() {
  const [downloading, setDownloading] = useState(false);
  const [progress, setProgress] = useState("");
  const getAllFiles = useAction(api.projectFiles.getAllFiles);

  const handleDownload = async () => {
    setDownloading(true);
    setProgress("Fetching project files...");

    try {
      const files = await getAllFiles();
      const zip = new JSZip();

      setProgress("Creating zip archive...");

      // Add each file to the zip
      const entries = Object.entries(files as Record<string, string>);
      for (const [filePath, content] of entries) {
        zip.file(filePath, content);
      }

      setProgress("Generating zip file...");

      const blob = await zip.generateAsync({
        type: "blob",
        compression: "DEFLATE",
        compressionOptions: { level: 6 },
      });

      setProgress("Starting download...");

      // Trigger browser download
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "ai-shadow-guardian.zip";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setProgress("Download complete!");
      setTimeout(() => setProgress(""), 3000);
    } catch (error) {
      setProgress("Error: " + (error as Error).message);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-vintage-paper via-vintage-cream to-vintage-paper flex items-center justify-center p-8">
      <div className="max-w-lg w-full">
        {/* Vintage ornamental border */}
        <div className="border-2 border-vintage-border rounded-lg p-12 bg-vintage-cream/80 shadow-2xl relative">
          {/* Corner ornaments */}
          <div className="absolute top-2 left-2 text-vintage-brass text-xl">❦</div>
          <div className="absolute top-2 right-2 text-vintage-brass text-xl">❦</div>
          <div className="absolute bottom-2 left-2 text-vintage-brass text-xl rotate-180">❦</div>
          <div className="absolute bottom-2 right-2 text-vintage-brass text-xl rotate-180">❦</div>

          {/* Header */}
          <div className="text-center mb-8">
            <div className="text-vintage-brass text-5xl mb-4">⬇</div>
            <h1 className="font-display text-3xl text-vintage-ink mb-2">
              Download Project
            </h1>
            <p className="font-serif text-vintage-muted italic">
              AI Shadow Guardian — Complete Source Archive
            </p>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-vintage-border" />
            <span className="text-vintage-brass text-sm">✦</span>
            <div className="flex-1 h-px bg-vintage-border" />
          </div>

          {/* File list */}
          <div className="mb-8 space-y-2">
            <p className="font-serif text-vintage-ink text-sm font-semibold mb-3">
              Included in archive:
            </p>
            <div className="grid grid-cols-2 gap-1 text-xs font-mono text-vintage-muted">
              <span>📄 Convex Backend (13 files)</span>
              <span>📄 React Frontend (20+ pages)</span>
              <span>📄 Components & Hooks</span>
              <span>📄 Configuration Files</span>
              <span>📄 Theme & Styles</span>
              <span>📄 README.md</span>
            </div>
          </div>

          {/* Download button */}
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="w-full py-4 px-8 bg-vintage-ink text-vintage-cream font-display text-lg
                       rounded border-2 border-vintage-brass hover:bg-vintage-brass hover:text-vintage-ink
                       transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed
                       shadow-lg hover:shadow-xl active:scale-[0.98]"
          >
            {downloading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="animate-spin inline-block w-5 h-5 border-2 border-vintage-cream border-t-transparent rounded-full" />
                Preparing...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                ⬇ Download ZIP Archive
              </span>
            )}
          </button>

          {/* Progress */}
          {progress && (
            <p className="text-center font-serif text-sm text-vintage-muted mt-4 italic">
              {progress}
            </p>
          )}

          {/* Instructions */}
          <div className="mt-8 p-4 bg-vintage-paper/50 rounded border border-vintage-border">
            <p className="font-serif text-vintage-ink text-xs leading-relaxed">
              <strong>To run locally:</strong>
            </p>
            <pre className="mt-2 font-mono text-[10px] text-vintage-muted whitespace-pre-wrap leading-relaxed">
{`1. Unzip the archive
2. cd ai-shadow-guardian
3. npm install
4. npx convex dev    (in one terminal)
5. npm run dev       (in another terminal)
6. Open http://localhost:5173`}
            </pre>
          </div>

          {/* Footer */}
          <div className="text-center mt-8">
            <p className="font-display text-vintage-brass text-sm tracking-wider">
              AI SHADOW GUARDIAN
            </p>
            <p className="font-serif text-vintage-muted text-xs italic mt-1">
              Enterprise Data Protection System
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
