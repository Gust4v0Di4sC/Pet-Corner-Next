import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function ShadcnSmokePage() {
  return (
    <main className="flex min-h-svh items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>shadcn/ui smoke</CardTitle>
          <CardDescription>
            Card component rendered from the official registry.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            This route validates the local setup and build integration.
          </p>
        </CardContent>
        <CardFooter>
          <p className="text-xs text-muted-foreground">Route: /shadcn-smoke</p>
        </CardFooter>
      </Card>
    </main>
  );
}
