import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function ProfileOverview() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Customer Profile (Structural)</CardTitle>
        <CardDescription>
          This screen is protected and ready for Firebase-backed profile data.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2 text-sm text-slate-700">
        <p>
          <span className="font-semibold">Name:</span> Customer Structural
        </p>
        <p>
          <span className="font-semibold">Email:</span> customer@example.com
        </p>
        <p>
          <span className="font-semibold">Status:</span> Guarded route enabled with
          cookie-based session scaffold.
        </p>
      </CardContent>
    </Card>
  );
}
