import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function ProfileOverview() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Resumo da conta</CardTitle>
        <CardDescription>
          Esta area e protegida e exibe os dados da conta do cliente.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2 text-sm text-slate-700">
        <p>
          <span className="font-semibold">Nome:</span> Cliente
        </p>
        <p>
          <span className="font-semibold">Email:</span> cliente@example.com
        </p>
        <p>
          <span className="font-semibold">Status:</span> Sessao autenticada.
        </p>
      </CardContent>
    </Card>
  );
}
