import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Terminal, TerminalLine, TerminalOutput } from "@/components/ui/Terminal";
import { Badge } from "@/components/ui/Badge";

export default function AboutPage() {
  return (
    <div className="space-y-8 max-w-4xl">
      <section className="space-y-4">
        <Terminal title="about.md" scanline>
          <TerminalLine>cat about.md</TerminalLine>
          <TerminalOutput>
            Transit Systems Information Platform v1.0.0
          </TerminalOutput>
        </Terminal>

        <h1 className="text-4xl font-mono font-bold text-text-primary">
          About <span className="text-accent-primary">Transit.Systems</span>
        </h1>
      </section>

      {/* Project Overview */}
      <Card elevated>
        <CardHeader>
          <CardTitle>Project Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-text-secondary leading-relaxed mb-4">
            Transit.Systems is a comprehensive information platform for public transit systems worldwide.
            Built with a terminal-inspired aesthetic, it provides detailed data about metro systems,
            light rail, and rapid transit networks including stations, lines, railcars, and historical information.
          </p>
          <p className="text-text-secondary leading-relaxed">
            The platform emphasizes data density, technical precision, and a unique visual style that
            appeals to transit enthusiasts, urban planners, developers, and anyone interested in
            public transportation infrastructure.
          </p>
        </CardContent>
      </Card>

      {/* Tech Stack */}
      <Card elevated>
        <CardHeader>
          <CardTitle>Technology Stack</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-mono text-sm text-accent-primary mb-2">Frontend Framework</h4>
              <div className="flex flex-wrap gap-2">
                <Badge>Next.js 16</Badge>
                <Badge>React</Badge>
                <Badge>TypeScript</Badge>
                <Badge>Tailwind CSS 4</Badge>
              </div>
            </div>
            <div>
              <h4 className="font-mono text-sm text-accent-primary mb-2">UI Libraries</h4>
              <div className="flex flex-wrap gap-2">
                <Badge>Framer Motion</Badge>
                <Badge>CMDK</Badge>
                <Badge>Lucide Icons</Badge>
                <Badge>Radix UI</Badge>
              </div>
            </div>
            <div>
              <h4 className="font-mono text-sm text-accent-primary mb-2">Data & Visualization</h4>
              <div className="flex flex-wrap gap-2">
                <Badge>Fuse.js</Badge>
                <Badge>Recharts</Badge>
                <Badge>Static JSON</Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data Sources */}
      <Card elevated>
        <CardHeader>
          <CardTitle>Data Sources</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-text-secondary">
              Transit system data is compiled from official sources and public records:
            </p>
            <ul className="space-y-2 text-text-secondary">
              <li className="flex items-start gap-2">
                <span className="text-accent-primary mt-1">•</span>
                <span>Official transit authority websites and published statistics</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-accent-primary mt-1">•</span>
                <span>Public transportation databases and archives</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-accent-primary mt-1">•</span>
                <span>Open data initiatives and government transparency programs</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-accent-primary mt-1">•</span>
                <span>Historical records and transit system documentation</span>
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Contributing */}
      <Card elevated>
        <CardHeader>
          <CardTitle>Contributing</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-text-secondary">
              Help improve Transit.Systems by contributing data, corrections, or code:
            </p>

            <div>
              <h4 className="font-mono text-sm text-accent-primary mb-2">Adding New Systems</h4>
              <Terminal>
                <TerminalLine>mkdir -p data/systems/your-system-id</TerminalLine>
                <TerminalLine>touch data/systems/your-system-id/system.json</TerminalLine>
                <TerminalLine>touch data/systems/your-system-id/lines.json</TerminalLine>
                <TerminalLine>touch data/systems/your-system-id/stations.json</TerminalLine>
                <TerminalLine>touch data/systems/your-system-id/railcars.json</TerminalLine>
              </Terminal>
            </div>

            <p className="text-sm text-text-secondary">
              Follow the schema defined in existing system files. Submit corrections or additions
              via GitHub issues or pull requests.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Features */}
      <Card elevated>
        <CardHeader>
          <CardTitle>Platform Features</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-mono text-sm text-accent-primary">✓ System Profiles</h4>
              <p className="text-sm text-text-secondary">
                Detailed information about each transit system including stats, history, and infrastructure
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-mono text-sm text-accent-primary">✓ Station Database</h4>
              <p className="text-sm text-text-secondary">
                Complete station listings with coordinates, amenities, and line connections
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-mono text-sm text-accent-primary">✓ Line Information</h4>
              <p className="text-sm text-text-secondary">
                Route details, termini, lengths, and official colors for all lines
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-mono text-sm text-accent-primary">✓ Railcar Fleet Data</h4>
              <p className="text-sm text-text-secondary">
                Technical specifications and history of rolling stock across systems
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-mono text-sm text-accent-primary">✓ Command Palette</h4>
              <p className="text-sm text-text-secondary">
                Fast keyboard-driven search across all systems, stations, lines, and railcars
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-mono text-sm text-accent-primary">✓ System Comparison</h4>
              <p className="text-sm text-text-secondary">
                Side-by-side analysis tools with metrics and visualizations
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* License */}
      <Card>
        <CardContent>
          <p className="text-sm text-text-muted font-mono">
            © 2026 Transit.Systems • Data compiled from public sources •
            Built with Next.js and TypeScript
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
