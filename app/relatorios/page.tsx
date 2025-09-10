"use client";

import { useState, useEffect } from "react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  FileText,
  Download,
  Sparkles,
  TrendingUp,
  DollarSign,
  Users,
  Package,
  BarChart3,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { getDashboardMetrics } from "@/lib/firebase-functions";
import type { DashboardMetrics } from "@/lib/types";

export default function RelatoriosPage() {
  const [dateRange, setDateRange] = useState<{
    from: Date | undefined;
    to: Date | undefined;
  }>({
    from: new Date(2025, 0, 1), // Jan 1, 2025
    to: new Date(2025, 8, 5), // Set 5, 2025
  });
  const [isGeneratingIA, setIsGeneratingIA] = useState(false);
  const [insightsIA, setInsightsIA] = useState<string[]>([]);
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Carregar dados do Firebase
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const data = await getDashboardMetrics();
        setMetrics(data);
      } catch (error) {
        console.error("Erro ao carregar métricas:", error);
        toast({
          title: "Erro ao carregar dados",
          description: "Não foi possível carregar os dados para os relatórios.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [toast]);

  // Calcular dados dos gráficos baseados nos dados reais
  const vendasMensais = metrics
    ? metrics.vendas.reduce((acc, venda) => {
        const mes = venda.dataVenda.toLocaleDateString("pt-BR", {
          month: "short",
        });
        const existing = acc.find((item) => item.mes === mes);
        if (existing) {
          existing.vendas += venda.quantidade;
          existing.receita += venda.precoTotal;
        } else {
          acc.push({
            mes,
            vendas: venda.quantidade,
            receita: venda.precoTotal,
          });
        }
        return acc;
      }, [] as { mes: string; vendas: number; receita: number }[])
    : [];

  const produtosMaisVendidos = metrics
    ? metrics.vendas
        .reduce((acc, venda) => {
          // Processar cada item da venda (múltiplos produtos)
          const itens = venda.itens || [];
          itens.forEach((item) => {
            const existing = acc.find(
              (prod) => prod.produto === item.produtoNome
            );
            if (existing) {
              existing.vendas += item.quantidade;
              existing.receita += item.precoTotal;
            } else {
              acc.push({
                produto: item.produtoNome,
                vendas: item.quantidade,
                receita: item.precoTotal,
              });
            }
          });
          return acc;
        }, [] as { produto: string; vendas: number; receita: number }[])
        .sort((a, b) => b.vendas - a.vendas)
        .slice(0, 5)
    : [];

  const fornecedoresPerformance = metrics
    ? metrics.vendas.reduce((acc, venda) => {
        // Processar cada item da venda (múltiplos produtos)
        const itens = venda.itens || [];
        itens.forEach((item) => {
          const existing = acc.find(
            (supplier) => supplier.name === item.fornecedorNome
          );
          if (existing) {
            existing.value += item.precoTotal;
          } else {
            acc.push({
              name: item.fornecedorNome,
              value: item.precoTotal,
              color: `#${Math.floor(Math.random() * 16777215).toString(16)}`,
            });
          }
        });
        return acc;
      }, [] as { name: string; value: number; color: string }[])
    : [];

  const custosCategoria = metrics
    ? metrics.custos.reduce((acc, custo) => {
        const existing = acc.find((item) => item.categoria === custo.categoria);
        if (existing) {
          existing.valor += custo.valor;
        } else {
          acc.push({
            categoria: custo.categoria,
            valor: custo.valor,
            percentual: 0,
          });
        }
        return acc;
      }, [] as { categoria: string; valor: number; percentual: number }[])
    : [];

  // Calcular percentuais dos custos
  const totalCustos = custosCategoria.reduce(
    (sum, item) => sum + item.valor,
    0
  );
  custosCategoria.forEach((item) => {
    item.percentual =
      totalCustos > 0 ? Math.round((item.valor / totalCustos) * 100) : 0;
  });

  const gerarInsightsIA = async () => {
    if (!metrics) {
      toast({
        title: "Erro",
        description: "Dados não carregados. Tente novamente.",
        variant: "destructive",
      });
      return;
    }

    setIsGeneratingIA(true);

    try {
      const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error("Chave da API do Gemini não configurada");
      }

      // Preparar dados para análise
      const dadosResumo = {
        totalVendas: metrics.vendas.length,
        receitaBruta: metrics.receitaBruta,
        custosOperacionais: metrics.custosOperacionais,
        lucroLiquido: metrics.lucroLiquido,
        fornecedores: metrics.fornecedores.length,
        vendasPorMes: metrics.vendas.reduce((acc, venda) => {
          const mes = venda.dataVenda.toLocaleDateString("pt-BR", {
            month: "short",
          });
          acc[mes] = (acc[mes] || 0) + venda.precoTotal;
          return acc;
        }, {} as Record<string, number>),
        produtosMaisVendidos: metrics.vendas.reduce((acc, venda) => {
          // Processar cada item da venda (múltiplos produtos)
          const itens = venda.itens || [];
          itens.forEach((item) => {
            const produto = item.produtoNome;
            acc[produto] = (acc[produto] || 0) + item.quantidade;
          });
          return acc;
        }, {} as Record<string, number>),
      };

      const prompt = `Analise os seguintes dados de um negócio de calçados e forneça insights práticos e acionáveis:

Dados do negócio:
- Total de vendas: ${dadosResumo.totalVendas}
- Receita bruta: R$ ${dadosResumo.receitaBruta.toFixed(2)}
- Custos operacionais: R$ ${dadosResumo.custosOperacionais.toFixed(2)}
- Lucro líquido: R$ ${dadosResumo.lucroLiquido.toFixed(2)}
- Número de fornecedores: ${dadosResumo.fornecedores}
- Vendas por mês: ${JSON.stringify(dadosResumo.vendasPorMes)}
- Produtos mais vendidos: ${JSON.stringify(dadosResumo.produtosMaisVendidos)}

Forneça 5-6 insights específicos, práticos e acionáveis para melhorar o negócio. Use emojis e seja direto.`;

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: prompt,
                  },
                ],
              },
            ],
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Erro na API: ${response.status}`);
      }

      const data = await response.json();
      const insightsText =
        data.candidates?.[0]?.content?.parts?.[0]?.text || "";

      // Dividir insights em array
      const insights = insightsText
        .split("\n")
        .filter(
          (line) =>
            (line.trim() && line.includes("📈")) ||
            line.includes("💡") ||
            line.includes("⚠️") ||
            line.includes("🎯") ||
            line.includes("📊") ||
            line.includes("💰")
        )
        .map((line) => line.trim())
        .slice(0, 6);

      setInsightsIA(insights);

      toast({
        title: "Análise concluída",
        description:
          "A IA gerou insights personalizados baseados nos seus dados.",
      });
    } catch (error) {
      console.error("Erro ao gerar insights:", error);
      toast({
        title: "Erro na análise",
        description:
          "Não foi possível gerar insights. Verifique a configuração da API.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingIA(false);
    }
  };

  const exportarRelatorio = (tipo: string) => {
    if (!metrics) {
      toast({
        title: "Erro",
        description: "Dados não carregados. Tente novamente.",
        variant: "destructive",
      });
      return;
    }

    try {
      let conteudo = "";
      const dataAtual = new Date().toLocaleDateString("pt-BR");

      if (tipo === "completo") {
        conteudo = `RELATÓRIO COMPLETO - LAZAVII FINANCIALS
Data: ${dataAtual}

RESUMO EXECUTIVO
================
Total de Vendas: ${metrics.vendas.length}
Receita Bruta: R$ ${metrics.receitaBruta.toFixed(2)}
Custos Operacionais: R$ ${metrics.custosOperacionais.toFixed(2)}
Lucro Líquido: R$ ${metrics.lucroLiquido.toFixed(2)}
Margem de Lucro: ${
          metrics.receitaBruta > 0
            ? ((metrics.lucroLiquido / metrics.receitaBruta) * 100).toFixed(1)
            : 0
        }%

VENDAS POR MÊS
==============
${Object.entries(
  metrics.vendas.reduce((acc, venda) => {
    const mes = venda.dataVenda.toLocaleDateString("pt-BR", { month: "short" });
    acc[mes] = (acc[mes] || 0) + venda.precoTotal;
    return acc;
  }, {} as Record<string, number>)
)
  .map(([mes, valor]) => `${mes}: R$ ${valor.toFixed(2)}`)
  .join("\n")}

PRODUTOS MAIS VENDIDOS
=====================
${Object.entries(
  metrics.vendas.reduce((acc, venda) => {
    // Processar cada item da venda (múltiplos produtos)
    const itens = venda.itens || [];
    itens.forEach((item) => {
      const produto = item.produtoNome;
      acc[produto] = (acc[produto] || 0) + item.quantidade;
    });
    return acc;
  }, {} as Record<string, number>)
)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 10)
  .map(([produto, qtd]) => `${produto}: ${qtd} unidades`)
  .join("\n")}

CUSTOS POR CATEGORIA
===================
${Object.entries(
  metrics.custos.reduce((acc, custo) => {
    acc[custo.categoria] = (acc[custo.categoria] || 0) + custo.valor;
    return acc;
  }, {} as Record<string, number>)
)
  .map(([categoria, valor]) => `${categoria}: R$ ${valor.toFixed(2)}`)
  .join("\n")}

DETALHES DAS VENDAS
==================
${metrics.vendas
  .map((venda) => {
    const itens = venda.itens || [];
    if (itens.length > 0) {
      return `${venda.dataVenda.toLocaleDateString("pt-BR")} - Cliente: ${
        venda.cliente || "N/A"
      } - Total: R$ ${venda.precoTotal.toFixed(2)}
${itens
  .map(
    (item) =>
      `  - ${item.produtoNome} (${item.fornecedorNome}) - ${
        item.quantidade
      }x - R$ ${item.precoTotal.toFixed(2)}`
  )
  .join("\n")}`;
    } else {
      // Compatibilidade com vendas antigas
      return `${venda.dataVenda.toLocaleDateString("pt-BR")} - ${
        (venda as any).produtoNome || "Produto N/A"
      } - ${(venda as any).quantidade || 0}x - R$ ${venda.precoTotal.toFixed(
        2
      )}`;
    }
  })
  .join("\n\n")}
`;
      } else if (tipo === "vendas") {
        conteudo = `RELATÓRIO DE VENDAS - LAZAVII FINANCIALS
Data: ${dataAtual}

RESUMO
======
Total de Vendas: ${metrics.vendas.length}
Receita Total: R$ ${metrics.receitaBruta.toFixed(2)}
Lucro Total: R$ ${metrics.lucroLiquido.toFixed(2)}

VENDAS DETALHADAS
================
${metrics.vendas
  .map((venda) => {
    const itens = venda.itens || [];
    if (itens.length > 0) {
      return `${venda.dataVenda.toLocaleDateString("pt-BR")} - Cliente: ${
        venda.cliente || "N/A"
      } - Total: R$ ${venda.precoTotal.toFixed(2)}
${itens
  .map(
    (item) =>
      `  - ${item.produtoNome} (${item.fornecedorNome}) - ${
        item.quantidade
      }x - R$ ${item.precoTotal.toFixed(2)}`
  )
  .join("\n")}`;
    } else {
      // Compatibilidade com vendas antigas
      return `${venda.dataVenda.toLocaleDateString("pt-BR")} - ${
        (venda as any).produtoNome || "Produto N/A"
      } - ${(venda as any).quantidade || 0}x - R$ ${venda.precoTotal.toFixed(
        2
      )} - Cliente: ${venda.cliente || "N/A"}`;
    }
  })
  .join("\n\n")}
`;
      } else if (tipo === "custos") {
        conteudo = `RELATÓRIO DE CUSTOS - LAZAVII FINANCIALS
Data: ${dataAtual}

RESUMO
======
Total de Custos: R$ ${metrics.custosOperacionais.toFixed(2)}
Número de Custos: ${metrics.custos.length}

CUSTOS DETALHADOS
================
${metrics.custos
  .map(
    (custo) =>
      `${custo.data.toLocaleDateString("pt-BR")} - ${custo.descricao} - ${
        custo.categoria
      } - R$ ${custo.valor.toFixed(2)}`
  )
  .join("\n")}
`;
      }

      // Criar e baixar arquivo
      const blob = new Blob([conteudo], { type: "text/plain;charset=utf-8" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `relatorio_${tipo}_${dataAtual.replace(/\//g, "-")}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({
        title: "Relatório exportado",
        description: `Relatório de ${tipo} foi exportado com sucesso.`,
      });
    } catch (error) {
      console.error("Erro ao exportar relatório:", error);
      toast({
        title: "Erro na exportação",
        description: "Não foi possível exportar o relatório.",
        variant: "destructive",
      });
    }
  };

  return (
    <MainLayout>
      <PageHeader
        title="Relatórios"
        subtitle="Análises detalhadas de performance"
        showDateFilter={true}
        dateRange={dateRange}
        onDateRangeChange={setDateRange}
      >
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={gerarInsightsIA}
            disabled={isGeneratingIA}
          >
            <Sparkles className="h-4 w-4 mr-2" />
            {isGeneratingIA ? "Analisando..." : "Gerar Insights IA"}
          </Button>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => exportarRelatorio("completo")}
            >
              <Download className="h-4 w-4 mr-2" />
              Relatório Completo
            </Button>
            <Button
              variant="outline"
              onClick={() => exportarRelatorio("vendas")}
            >
              <Download className="h-4 w-4 mr-2" />
              Apenas Vendas
            </Button>
            <Button
              variant="outline"
              onClick={() => exportarRelatorio("custos")}
            >
              <Download className="h-4 w-4 mr-2" />
              Apenas Custos
            </Button>
          </div>
        </div>
      </PageHeader>

      <div className="space-y-6">
        {/* Insights da IA */}
        {insightsIA.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                Insights Gerados pela IA
              </CardTitle>
              <CardDescription>
                Análises inteligentes baseadas nos seus dados de negócio
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3">
                {insightsIA.map((insight, index) => (
                  <div key={index} className="p-3 bg-muted rounded-lg">
                    <p className="text-sm">{insight}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Resumo Executivo */}
        {loading ? (
          <div className="text-center py-12">Carregando dados...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Receita Total
                </CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  R${" "}
                  {metrics?.receitaBruta.toLocaleString("pt-BR", {
                    minimumFractionDigits: 2,
                  }) || "0,00"}
                </div>
                <p className="text-xs text-muted-foreground">
                  Receita bruta total
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total de Vendas
                </CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {metrics?.vendas.length || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  Vendas registradas
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Lucro Líquido
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">
                  R${" "}
                  {metrics?.lucroLiquido.toLocaleString("pt-BR", {
                    minimumFractionDigits: 2,
                  }) || "0,00"}
                </div>
                <p className="text-xs text-muted-foreground">
                  Lucro líquido total
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Custos Operacionais
                </CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  R${" "}
                  {metrics?.custosOperacionais.toLocaleString("pt-BR", {
                    minimumFractionDigits: 2,
                  }) || "0,00"}
                </div>
                <p className="text-xs text-muted-foreground">
                  Custos operacionais
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Relatórios Detalhados */}
        <Tabs defaultValue="vendas" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="vendas">Vendas</TabsTrigger>
            <TabsTrigger value="produtos">Produtos</TabsTrigger>
            <TabsTrigger value="fornecedores">Fornecedores</TabsTrigger>
            <TabsTrigger value="custos">Custos</TabsTrigger>
          </TabsList>

          <TabsContent value="vendas" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Evolução de Vendas</CardTitle>
                  <CardDescription>Vendas e receita por mês</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={vendasMensais}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="mes" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="vendas"
                        stroke="#8b5cf6"
                        strokeWidth={2}
                        name="Vendas"
                      />
                      <Line
                        type="monotone"
                        dataKey="receita"
                        stroke="#10b981"
                        strokeWidth={2}
                        name="Receita (R$)"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Produtos Mais Vendidos</CardTitle>
                  <CardDescription>
                    Top 5 produtos por quantidade
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {produtosMaisVendidos.map((produto, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between"
                      >
                        <div>
                          <p className="font-medium">{produto.produto}</p>
                          <p className="text-sm text-muted-foreground">
                            {produto.vendas} vendas
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold">
                            R$ {produto.receita.toLocaleString("pt-BR")}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="produtos" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Performance por Produto</CardTitle>
                <CardDescription>
                  Análise detalhada de vendas por produto
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={produtosMaisVendidos}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="produto"
                      angle={-45}
                      textAnchor="end"
                      height={100}
                    />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="vendas" fill="#8b5cf6" name="Vendas" />
                    <Bar dataKey="receita" fill="#10b981" name="Receita (R$)" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="fornecedores" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Distribuição por Fornecedor</CardTitle>
                <CardDescription>
                  Participação de cada fornecedor nas vendas
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <PieChart>
                    <Pie
                      data={fornecedoresPerformance}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) =>
                        `${name} ${(percent * 100).toFixed(0)}%`
                      }
                      outerRadius={120}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {fornecedoresPerformance.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="custos" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Análise de Custos por Categoria</CardTitle>
                <CardDescription>
                  Distribuição dos custos operacionais
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {custosCategoria.map((custo, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">{custo.categoria}</span>
                        <span className="text-sm text-muted-foreground">
                          R$ {custo.valor.toLocaleString("pt-BR")} (
                          {custo.percentual}%)
                        </span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div
                          className="bg-primary h-2 rounded-full"
                          style={{ width: `${custo.percentual}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Ações Rápidas */}
        <Card>
          <CardHeader>
            <CardTitle>Ações Rápidas</CardTitle>
            <CardDescription>
              Exporte relatórios específicos ou gere análises personalizadas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Button
                variant="outline"
                onClick={() => exportarRelatorio("vendas")}
              >
                <FileText className="h-4 w-4 mr-2" />
                Relatório de Vendas
              </Button>
              <Button
                variant="outline"
                onClick={() => exportarRelatorio("financeiro")}
              >
                <DollarSign className="h-4 w-4 mr-2" />
                Relatório Financeiro
              </Button>
              <Button
                variant="outline"
                onClick={() => exportarRelatorio("estoque")}
              >
                <Package className="h-4 w-4 mr-2" />
                Relatório de Estoque
              </Button>
              <Button
                variant="outline"
                onClick={() => exportarRelatorio("fornecedores")}
              >
                <Users className="h-4 w-4 mr-2" />
                Relatório de Fornecedores
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
