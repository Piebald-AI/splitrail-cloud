import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ArrowRight, Code, Zap, Users, TrendingUp } from "lucide-react";
import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      <div className="container mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="text-center mb-20">
          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            Splitrail Leaderboard
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto">
            Competitive rankings for developers using agentic workflow tools.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild className="group !px-5 rounded-lg h-10 text-md">
              <Link href="https://splitrail.dev/leaderboard">
                View Leaderboard <ArrowRight className="h-9 w-9 group-hover:translate-x-2 transition translate" />
              </Link>
            </Button>
          </div>
        </div>

        {/* Features Section */}
        <div id="features" className="mb-20">
          <h2 className="text-3xl font-bold text-center mb-12">
            Why Splitrail?
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="mx-auto mb-4 p-3 bg-primary/10 rounded-full w-fit">
                  <Code className="h-8 w-8 text-primary" />
                </div>
                <CardTitle>Agentic Workflows</CardTitle>
                <CardDescription>
                  Track your usage of AI-powered development tools
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="mx-auto mb-4 p-3 bg-primary/10 rounded-full w-fit">
                  <TrendingUp className="h-8 w-8 text-primary" />
                </div>
                <CardTitle>Performance Metrics</CardTitle>
                <CardDescription>
                  See detailed stats on your coding productivity
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="mx-auto mb-4 p-3 bg-primary/10 rounded-full w-fit">
                  <Users className="h-8 w-8 text-primary" />
                </div>
                <CardTitle>Community</CardTitle>
                <CardDescription>
                  Compare your progress with developers worldwide
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="mx-auto mb-4 p-3 bg-primary/10 rounded-full w-fit">
                  <Zap className="h-8 w-8 text-primary" />
                </div>
                <CardTitle>Performance Insights</CardTitle>
                <CardDescription>
                  Fast, responsive interface for quick data access
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center bg-card p-12 rounded-lg border shadow-sm">
          <h3 className="text-2xl font-bold mb-4">Ready to Start Competing?</h3>
          <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
            Download Splitrail from <Link href="https://github.com/piebald-ai/splitrail">GitHub,</Link> configure <Link href="https://splitrail.dev/settings">your API key,</Link> and upload your data to the leaderboard via the CLI.
          </p>
            <Button asChild className="group !px-5 rounded-lg h-10 text-md">
              <Link href="https://splitrail.dev/leaderboard">
                View Leaderboard <ArrowRight className="h-9 w-9 group-hover:translate-x-2 transition translate" />
              </Link>
            </Button>
        </div>
      </div>
    </div>
  );
}
