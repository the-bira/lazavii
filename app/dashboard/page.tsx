"use client";

import { useState, useEffect, useMemo } from "react";
import { MainLayout } from "@/components/main-layout";
import { PageHeader } from "@/components/page-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Target,
  Sparkles,
  ChevronDown,
  RefreshCw,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

// Import Firestore data helpers
import {
  getDashboardMetrics,
  gerarInsightsIA,
  getInsights,
} from "@/lib/firebase-functions";
import type { DashboardMetrics, Venda, Insight } from "@/lib/types";

// Helper to format dates as DD/MM for chart labels.
const formatDateLabel = (date: Date) => {
  return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
};

export default function DashboardPage() {
  // Date range for filtering dashboard data
  const [dateRange, setDateRange] = useState<{
    from: Date | undefined;
    to: Date | undefined;
  }>({
    from: new Date(2024, 11, 1), // Dez 01, 2024 (0-indexed month)
    to: new Date(2025, 11, 31), // Dez 31, 2025
  });

  // State to hold dashboard metrics loaded from Firestore
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loadingData, setLoadingData] = useState(false);
  // Insights state
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loadingInsights, setLoadingInsights] = useState(false);

  // Load dashboard metrics when component mounts and refresh periodically
  useEffect(() => {
    let isSubscribed = true;
    async function fetchMetrics() {
      setLoadingData(true);
      try {
        console.log("🔄 [Dashboard] Carregando métricas...");
        const data = await getDashboardMetrics();
        if (isSubscribed) {
          setMetrics(data);
          console.log("✅ [Dashboard] Métricas carregadas:", {
            vendas: data.vendas.length,
            custos: data.custos.length,
            receitaBruta: data.receitaBruta,
            custosOperacionais: data.custosOperacionais,
          });
        }
      } catch (error) {
        console.error("❌ [Dashboard] Erro ao carregar métricas:", error);
      } finally {
        if (isSubscribed) {
          setLoadingData(false);
        }
      }
    }

    async function fetchInsights() {
      try {
        const insightsData = await getInsights();
        if (isSubscribed) {
          setInsights(insightsData.filter((insight) => insight.ativo));
        }
      } catch (error) {
        console.error("Erro ao carregar insights:", error);
      }
    }

    fetchMetrics();
    fetchInsights();

    // Refresh data every 30 seconds
    const interval = setInterval(() => {
      if (isSubscribed) {
        fetchMetrics();
        fetchInsights();
      }
    }, 30000);

    return () => {
      isSubscribed = false;
      clearInterval(interval);
    };
  }, []);

  const handleGerarInsights = async () => {
    if (!metrics) return;

    setLoadingInsights(true);
    try {
      const novosInsights = await gerarInsightsIA(metrics);
      setInsights(novosInsights);
    } catch (error) {
      console.error("Erro ao gerar insights:", error);
    } finally {
      setLoadingInsights(false);
    }
  };

  // Helper to filter vendas/custos based on the selected date range
  const filterByDateRange = (date: Date) => {
    const { from, to } = dateRange;
    console.log("📅 [filterByDateRange] Verificando data:", {
      data: date.toISOString(),
      from: from?.toISOString(),
      to: to?.toISOString(),
      menorQueFrom: from ? date < from : false,
      maiorQueTo: to ? date > to : false,
    });

    if (from && date < from) {
      console.log("📅 [filterByDateRange] Data anterior ao range");
      return false;
    }
    if (to && date > to) {
      console.log("📅 [filterByDateRange] Data posterior ao range");
      return false;
    }
    console.log("📅 [filterByDateRange] Data dentro do range");
    return true;
  };

  // Compute chart data (cost vs revenue per day/week)
  const chartData = useMemo(() => {
    if (!metrics) {
      console.log("📊 [Dashboard] Sem métricas para chartData");
      return [];
    }

    console.log(
      "📊 [Dashboard] Recalculando chartData com",
      metrics.vendas.length,
      "vendas e",
      metrics.custos.length,
      "custos"
    );

    const map = new Map<
      string,
      {
        date: string;
        custoTotal: number;
        receitaVenda: number;
        custosOperacionais: number;
      }
    >();

    // Processar vendas
    metrics.vendas.forEach((venda) => {
      if (!venda.dataVenda || !filterByDateRange(venda.dataVenda)) return;
      const key = formatDateLabel(venda.dataVenda);
      const entry = map.get(key) || {
        date: key,
        custoTotal: 0,
        receitaVenda: 0,
        custosOperacionais: 0,
      };
      entry.receitaVenda += venda.precoTotal;
      entry.custoTotal += venda.custoTotal;
      map.set(key, entry);
    });

    // Processar custos operacionais
    metrics.custos.forEach((custo) => {
      if (!custo.data || !filterByDateRange(custo.data)) return;
      const key = formatDateLabel(custo.data);
      const entry = map.get(key) || {
        date: key,
        custoTotal: 0,
        receitaVenda: 0,
        custosOperacionais: 0,
      };
      entry.custosOperacionais += custo.valor;
      map.set(key, entry);
    });

    // Se não há dados, criar dados de exemplo para mostrar o gráfico
    if (map.size === 0) {
      const hoje = new Date();
      const ultimos7Dias = Array.from({ length: 7 }, (_, i) => {
        const data = new Date(hoje);
        data.setDate(data.getDate() - (6 - i));
        return {
          date: formatDateLabel(data),
          custoTotal: 0,
          receitaVenda: 0,
          custosOperacionais: 0,
        };
      });
      console.log(
        "📊 [Dashboard] Nenhum dado encontrado, criando dados de exemplo"
      );
      return ultimos7Dias;
    }

    // Sort dates chronologically
    const sorted = Array.from(map.values()).sort((a, b) => {
      const [dayA, monthA] = a.date.split("/").map((n) => parseInt(n, 10));
      const [dayB, monthB] = b.date.split("/").map((n) => parseInt(n, 10));
      // create pseudo date objects for sorting (year is not relevant here)
      const dateA = new Date(2025, monthA - 1, dayA);
      const dateB = new Date(2025, monthB - 1, dayB);
      return dateA.getTime() - dateB.getTime();
    });

    console.log("📊 [Dashboard] ChartData final:", sorted.length, "dias");
    return sorted;
  }, [metrics, dateRange]);

  // Compute financial summaries for the selected date range
  const receitaBruta = useMemo(() => {
    if (!metrics) {
      console.log("📊 [Dashboard] Sem métricas para calcular receita");
      return 0;
    }

    console.log(
      "📊 [Dashboard] Calculando receita com",
      metrics.vendas.length,
      "vendas"
    );
    console.log("📊 [Dashboard] Filtro de data:", dateRange);

    const vendasFiltradas = metrics.vendas.filter((venda) => {
      const dentroDoRange = filterByDateRange(venda.dataVenda);
      console.log(
        `📊 [Dashboard] Venda ${
          venda.id
        }: data=${venda.dataVenda.toISOString()}, dentroDoRange=${dentroDoRange}, precoTotal=${
          venda.precoTotal
        }`
      );
      return dentroDoRange;
    });

    console.log("📊 [Dashboard] Vendas filtradas:", vendasFiltradas.length);

    const total = vendasFiltradas.reduce((total, venda) => {
      return total + venda.precoTotal;
    }, 0);

    console.log("📊 [Dashboard] Receita bruta calculada:", total);
    return total;
  }, [metrics, dateRange]);

  const custosOperacionais = useMemo(() => {
    if (!metrics) return 0;
    return metrics.custos.reduce((total, custo) => {
      return filterByDateRange(custo.data) ? total + custo.valor : total;
    }, 0);
  }, [metrics, dateRange]);

  const lucroLiquido = receitaBruta - custosOperacionais;

  const progressoMeta = useMemo(() => {
    if (!metrics) return 0;
    return metrics.progressoMeta;
  }, [metrics]);

  // Aggregate sales and costs by supplier for the selected date range
  const fornecedoresData = useMemo(() => {
    if (!metrics) return [];
    const map = new Map<
      string,
      {
        fornecedor: string;
        produtosVendidos: number;
        custoTotal: number;
        receitaTotal: number;
        lucroBruto: number;
      }
    >();
    metrics.vendas.forEach((venda) => {
      if (!filterByDateRange(venda.dataVenda)) return;

      // Processar itens da venda (múltiplos produtos)
      const itens = venda.itens || [];
      itens.forEach((item) => {
        const key = item.fornecedorNome || "Desconhecido";
        const entry = map.get(key) || {
          fornecedor: key,
          produtosVendidos: 0,
          custoTotal: 0,
          receitaTotal: 0,
          lucroBruto: 0,
        };
        entry.produtosVendidos += item.quantidade;
        entry.custoTotal += item.custoTotal;
        entry.receitaTotal += item.precoTotal;
        entry.lucroBruto += item.precoTotal - item.custoTotal;
        map.set(key, entry);
      });
    });
    return Array.from(map.values());
  }, [metrics, dateRange]);

  return (
    <MainLayout>
      <PageHeader
        title="Dashboard Financeiro"
        subtitle="Visão geral da saúde financeira do seu negócio"
        showDateFilter={true}
        dateRange={dateRange}
        onDateRangeChange={setDateRange}
      >
        <Button
          variant="outline"
          onClick={() => {
            console.log("🔄 [Dashboard] Refresh manual solicitado");
            setLoadingData(true);
            getDashboardMetrics().then((data) => {
              setMetrics(data);
              setLoadingData(false);
              console.log("✅ [Dashboard] Refresh manual concluído");
            });
          }}
          disabled={loadingData}
        >
          <RefreshCw
            className={`h-4 w-4 mr-2 ${loadingData ? "animate-spin" : ""}`}
          />
          {loadingData ? "Atualizando..." : "Atualizar"}
        </Button>
      </PageHeader>

      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold mb-4">Visão Geral Financeira</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Receita Bruta */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Receita Bruta
                </CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {/* Exibe a receita bruta formatada como moeda. Se os dados ainda estão carregando, mostra 0,00 */}
                <div className="text-2xl font-bold">
                  {`R$ ${receitaBruta.toLocaleString("pt-BR", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}`}
                </div>
                <p className="text-xs text-muted-foreground">
                  Receita no período selecionado.
                </p>
              </CardContent>
            </Card>

            {/* Lucro Líquido */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Lucro Líquido
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {`R$ ${lucroLiquido.toLocaleString("pt-BR", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}`}
                </div>
                <p className="text-xs text-muted-foreground">
                  Lucro no período selecionado.
                </p>
              </CardContent>
            </Card>

            {/* Custos Operacionais */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Custos Operacionais
                </CardTitle>
                <TrendingDown className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-destructive">
                  {`R$ ${custosOperacionais.toLocaleString("pt-BR", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}`}
                </div>
                <p className="text-xs text-muted-foreground">
                  Custos no período selecionado.
                </p>
              </CardContent>
            </Card>

            {/* Progresso da Meta */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Progresso da Meta
                </CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {/* Exibe o progresso da meta se houver meta ativa */}
                {progressoMeta > 0 ? (
                  <div className="text-2xl font-bold">
                    {`${progressoMeta.toFixed(0)}%`}
                  </div>
                ) : (
                  <div className="text-2xl font-bold">-</div>
                )}
                <p className="text-xs text-muted-foreground">
                  {progressoMeta > 0
                    ? "Progresso da meta ativa."
                    : "Nenhuma meta ativa."}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Gráfico Custo vs. Venda */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Custo vs. Venda</CardTitle>
              <CardDescription>
                Análise diária de custos e receitas de vendas no período.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip
                    formatter={(value: number, name: string) => [
                      `R$ ${value.toLocaleString("pt-BR")}`,
                      name === "custoTotal"
                        ? "Custo Total"
                        : name === "receitaVenda"
                        ? "Receita de Venda"
                        : name === "custosOperacionais"
                        ? "Custos Operacionais"
                        : name,
                    ]}
                    labelFormatter={(label) => `Data: ${label}`}
                  />
                  <Legend />
                  <Bar dataKey="custoTotal" fill="#ef4444" name="Custo Total" />
                  <Bar
                    dataKey="receitaVenda"
                    fill="#10b981"
                    name="Receita de Venda"
                  />
                  <Bar
                    dataKey="custosOperacionais"
                    fill="#f59e0b"
                    name="Custos Operacionais"
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Análise de Vendas com IA */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                <CardTitle>Análise de Vendas com IA</CardTitle>
              </div>
              <CardDescription>
                Insights inteligentes baseados nos seus dados de vendas e
                custos.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {insights.length > 0 ? (
                <div className="space-y-4">
                  {insights.slice(0, 3).map((insight, index) => (
                    <div key={insight.id} className="p-3 border rounded-lg">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-medium text-sm">
                          {insight.titulo}
                        </h4>
                        <span
                          className={`text-xs px-2 py-1 rounded ${
                            insight.prioridade === "alta"
                              ? "bg-red-100 text-red-800"
                              : insight.prioridade === "media"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-green-100 text-green-800"
                          }`}
                        >
                          {insight.prioridade}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        {insight.descricao}
                      </p>
                      <p className="text-xs text-blue-600 font-medium">
                        💡 {insight.acao}
                      </p>
                    </div>
                  ))}
                  <Button
                    onClick={handleGerarInsights}
                    disabled={loadingInsights}
                    className="w-full bg-primary hover:bg-primary/90"
                  >
                    <Sparkles className="h-4 w-4 mr-2" />
                    {loadingInsights ? "Gerando..." : "Atualizar Insights"}
                  </Button>
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-sm text-muted-foreground mb-4">
                    Nenhum insight disponível. Clique no botão para gerar
                    análises inteligentes.
                  </p>
                  <Button
                    onClick={handleGerarInsights}
                    disabled={loadingInsights}
                    className="w-full bg-primary hover:bg-primary/90"
                  >
                    <Sparkles className="h-4 w-4 mr-2" />
                    {loadingInsights ? "Gerando..." : "Gerar Análise"}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Vendas e Lucro por Fornecedor</CardTitle>
              <CardDescription>
                Analise o desempenho financeiro por fornecedor no período
                selecionado.
              </CardDescription>
            </div>
            <Button variant="ghost" size="icon">
              <ChevronDown className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium">
                      Fornecedor
                    </th>
                    <th className="text-left py-3 px-4 font-medium">
                      Produtos Vendidos
                    </th>
                    <th className="text-left py-3 px-4 font-medium">
                      Custo Total
                    </th>
                    <th className="text-left py-3 px-4 font-medium">
                      Receita Total
                    </th>
                    <th className="text-left py-3 px-4 font-medium">
                      Lucro Bruto
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {fornecedoresData.map((item, index) => (
                    <tr key={index} className="border-b hover:bg-muted/50">
                      <td className="py-3 px-4 font-medium">
                        {item.fornecedor}
                      </td>
                      <td className="py-3 px-4">{item.produtosVendidos}</td>
                      <td className="py-3 px-4">
                        {`R$ ${item.custoTotal.toLocaleString("pt-BR", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}`}
                      </td>
                      <td className="py-3 px-4">
                        {`R$ ${item.receitaTotal.toLocaleString("pt-BR", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}`}
                      </td>
                      <td className="py-3 px-4 text-green-600 font-medium">
                        {`R$ ${item.lucroBruto.toLocaleString("pt-BR", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}`}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
