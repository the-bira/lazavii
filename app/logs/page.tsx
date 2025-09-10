"use client"

import { useEffect, useState } from "react"
import { MainLayout } from "@/components/main-layout"
import { PageHeader } from "@/components/page-header"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { getLogs } from "@/lib/firebase-functions"
import type { Log } from "@/lib/types"

export default function LogsPage() {
  const [logs, setLogs] = useState<Log[]>([])
  const [loadingLogs, setLoadingLogs] = useState(true)

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const data = await getLogs()
        setLogs(data)
      } catch (error) {
        console.error("Erro ao carregar logs:", error)
      } finally {
        setLoadingLogs(false)
      }
    }
    fetchLogs()
  }, [])

  return (
    <MainLayout>
      <PageHeader title="Logs" subtitle="Histórico de ações do sistema" />
      <div className="space-y-6">
        {loadingLogs ? (
          <div className="text-center py-12">Carregando logs...</div>
        ) : logs.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <h2 className="text-xl font-semibold text-muted-foreground">Nenhum log encontrado</h2>
              <p className="text-muted-foreground">Nenhuma ação importante foi registrada ainda.</p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Registros de Auditoria</CardTitle>
              <CardDescription>Veja as ações realizadas no sistema</CardDescription>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Usuário</TableHead>
                    <TableHead>Ação</TableHead>
                    <TableHead>Detalhes</TableHead>
                    <TableHead>Data</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="font-medium">{log.user}</TableCell>
                      <TableCell>{log.action}</TableCell>
                      <TableCell>{log.details}</TableCell>
                      <TableCell>{new Date(log.timestamp).toLocaleString("pt-BR")}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>
    </MainLayout>
  )
}
