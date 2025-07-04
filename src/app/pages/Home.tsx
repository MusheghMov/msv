import { RequestInfo } from "rwsdk/worker";
import { Button } from "@/app/components/ui/button";
import { link } from "@/app/shared/links";

export function Home({ ctx }: RequestInfo) {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="max-w-4xl mx-auto p-8 text-center">
        <h1 className="text-5xl font-bold text-gray-900 mb-4">
          Welcome to RedwoodJS SDK
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          A modern React framework for building fast, server-driven web applications on Cloudflare.
        </p>
        
        <div className="space-y-4">
          <div>
            <Button asChild size="lg" className="text-lg px-8 py-4">
              <a href={link("/manga-script-visualizer")}>
                🎨 Try Manga Script Visualizer
              </a>
            </Button>
          </div>
          
          <p className="text-gray-500">
            Interactive manga dialogue scripting with AI background generation
          </p>
        </div>
        
        {ctx.user && (
          <div className="mt-8 p-4 bg-green-100 rounded-lg">
            <p className="text-green-800">
              Welcome back, {ctx.user.username || 'User'}!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
