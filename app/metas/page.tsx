"use client";

import type React from "react";

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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Plus,
  Target,
  Calendar,
  DollarSign,
  TrendingUp,
  Sparkles,
  Edit,
  Trash2,
  Eye,
  CheckCircle,
  Clock,
  AlertCircle,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  getMetas,
  createMeta,
  updateMeta,
  gerarPlanoMetaIA,
  getVendas,
  getCustos,
  getFornecedores,
  getProdutos,
} from "@/lib/firebase-functions";
import type {
  Meta as MetaType,
  CreateMeta,
  UpdateMeta,
  PlanoMeta,
} from "@/lib/types";
import { format, addDays, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";

// A interface Meta é definida em @/lib/types.ts. Os dados serão carregados dinamicamente do Firestore.

const tiposMeta = [
  { value: "receita", label: "Receita", icon: DollarSign },
  { value: "vendas", label: "Vendas", icon: TrendingUp },
  { value: "lucro", label: "Lucro", icon: Target },
  { value: "custos", label: "Custos", icon: DollarSign },
];

export default function MetasPage() {
  // Lista de metas obtida do Firestore
  const [metas, setMetas] = useState<MetaType[]>([]);
  // Estado de carregamento das metas
  const [loadingMetas, setLoadingMetas] = useState(true);
  // Diálogo de criação/edição
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  // Meta que está sendo editada
  const [editingMeta, setEditingMeta] = useState<MetaType | null>(null);
  // Indica se a geração via IA está em andamento
  const [isGeneratingIA, setIsGeneratingIA] = useState(false);
  // Plano da IA para a meta selecionada
  const [planoIA, setPlanoIA] = useState<PlanoMeta | null>(null);
  // Meta selecionada para visualizar o plano
  const [metaSelecionada, setMetaSelecionada] = useState<MetaType | null>(null);
  // Dados do negócio para análise da IA
  const [dadosNegocio, setDadosNegocio] = useState<{
    vendas: any[];
    custos: any[];
    fornecedores: any[];
    produtos: any[];
  } | null>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    titulo: "",
    descricao: "",
    tipo: "",
    valorAlvo: "",
    dataFim: "",
  });

  // Carrega as metas e dados do negócio do Firestore na montagem do componente
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [metasFromDb, vendas, custos, fornecedores, produtos] =
          await Promise.all([
            getMetas(),
            getVendas(),
            getCustos(),
            getFornecedores(),
            getProdutos(),
          ]);

        setMetas(metasFromDb);
        setDadosNegocio({ vendas, custos, fornecedores, produtos });
      } catch (error) {
        console.error("Erro ao buscar dados:", error);
      } finally {
        setLoadingMetas(false);
      }
    };
    fetchData();
  }, []);

  const calcularProgresso = (meta: MetaType) => {
    if (meta.tipo === "custos") {
      // Para custos, o progresso é invertido (menor é melhor)
      return Math.min(
        100,
        ((meta.valorAlvo - meta.valorAtual) / meta.valorAlvo) * 100
      );
    }
    return Math.min(100, (meta.valorAtual / meta.valorAlvo) * 100);
  };

  const calcularDiasRestantes = (dataFim: Date) => {
    const hoje = new Date();
    return Math.max(0, differenceInDays(dataFim, hoje));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Prepara a payload para criação/atualização da meta
    const payload: CreateMeta = {
      titulo: formData.titulo,
      descricao: formData.descricao,
      tipo: formData.tipo as MetaType["tipo"],
      valorAlvo: Number.parseFloat(formData.valorAlvo),
      valorAtual: 0,
      dataInicio: new Date(),
      dataFim: new Date(formData.dataFim),
      status: "ativa",
      criadaPorIA: false,
    };

    const submitMeta = async () => {
      if (editingMeta) {
        // Atualizar meta existente
        const updates: UpdateMeta = {
          titulo: payload.titulo,
          descricao: payload.descricao,
          tipo: payload.tipo,
          valorAlvo: payload.valorAlvo,
          dataFim: payload.dataFim,
        };
        const ok = await updateMeta(editingMeta.id, updates);
        if (ok) {
          setMetas((prev) =>
            prev.map((m) =>
              m.id === editingMeta.id ? ({ ...m, ...updates } as MetaType) : m
            )
          );
          toast({
            title: "Meta atualizada",
            description: "A meta foi atualizada com sucesso.",
          });
        } else {
          toast({
            title: "Erro",
            description: "Não foi possível atualizar a meta.",
            variant: "destructive",
          });
        }
      } else {
        // Criar nova meta
        const id = await createMeta(payload);
        if (id) {
          const novaMeta = {
            id,
            ...payload,
            criadoEm: new Date(),
            atualizadoEm: new Date(),
          } as MetaType;
          setMetas((prev) => [novaMeta, ...prev]);

          // Gerar plano com IA se os dados do negócio estiverem disponíveis
          if (dadosNegocio) {
            toast({
              title: "Meta criada",
              description:
                "Nova meta foi criada. Gerando plano estratégico com IA...",
            });

            try {
              const plano = await gerarPlanoMetaIA(novaMeta, dadosNegocio);
              if (plano) {
                // Atualizar a meta com o plano gerado
                await updateMeta(id, { planoIA: plano });
                setMetas((prev) =>
                  prev.map((m) => (m.id === id ? { ...m, planoIA: plano } : m))
                );
                toast({
                  title: "Plano gerado!",
                  description:
                    "A IA criou um plano estratégico personalizado para sua meta.",
                });
              } else {
                toast({
                  title: "Meta criada",
                  description:
                    "Meta criada, mas não foi possível gerar o plano com IA.",
                  variant: "destructive",
                });
              }
            } catch (error) {
              console.error("Erro ao gerar plano com IA:", error);
              toast({
                title: "Meta criada",
                description:
                  "Meta criada, mas houve erro ao gerar o plano com IA.",
                variant: "destructive",
              });
            }
          } else {
            toast({
              title: "Meta criada",
              description: "Nova meta foi criada com sucesso.",
            });
          }
        } else {
          toast({
            title: "Erro",
            description: "Não foi possível criar a meta.",
            variant: "destructive",
          });
        }
      }

      // Resetar formulário e estados
      setFormData({
        titulo: "",
        descricao: "",
        tipo: "",
        valorAlvo: "",
        dataFim: "",
      });
      setEditingMeta(null);
      setIsDialogOpen(false);
    };
    void submitMeta();
  };

  const handleEdit = (meta: MetaType) => {
    setEditingMeta(meta);
    setFormData({
      titulo: meta.titulo,
      descricao: meta.descricao,
      tipo: meta.tipo,
      valorAlvo: meta.valorAlvo.toString(),
      dataFim: format(meta.dataFim, "yyyy-MM-dd"),
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    // Para excluir, marcamos a meta como vencida/arquivada no banco
    const update: UpdateMeta = { status: "vencida" };
    void (async () => {
      const ok = await updateMeta(id, update);
      if (ok) {
        setMetas((prev) =>
          prev.map((m) => (m.id === id ? ({ ...m, ...update } as MetaType) : m))
        );
        toast({
          title: "Meta arquivada",
          description: "A meta foi arquivada com sucesso.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Erro",
          description: "Não foi possível arquivar a meta.",
          variant: "destructive",
        });
      }
    })();
  };

  const gerarMetasIA = async () => {
    setIsGeneratingIA(true);
    try {
      if (!dadosNegocio) {
        toast({
          title: "Erro",
          description: "Dados do negócio não carregados.",
          variant: "destructive",
        });
        return;
      }

      // Gerar metas baseadas nos dados reais
      const sugestoes: CreateMeta[] = [
        {
          titulo: "Aumentar Margem de Lucro",
          descricao:
            "Com base no histórico, recomendo aumentar a margem de lucro focando em produtos premium",
          tipo: "lucro",
          valorAlvo: Math.round(
            dadosNegocio.vendas.reduce((sum, v) => sum + v.precoTotal, 0) * 0.3
          ),
          valorAtual: 0,
          dataInicio: new Date(),
          dataFim: addDays(new Date(), 30),
          status: "ativa",
          criadaPorIA: true,
        },
        {
          titulo: "Otimizar Vendas por Fornecedor",
          descricao:
            "Focar nos fornecedores com melhor performance para aumentar vendas",
          tipo: "vendas",
          valorAlvo: Math.round(dadosNegocio.vendas.length * 1.25),
          valorAtual: 0,
          dataInicio: new Date(),
          dataFim: addDays(new Date(), 21),
          status: "ativa",
          criadaPorIA: true,
        },
      ];

      const novasMetas: MetaType[] = [];
      for (const sugestao of sugestoes) {
        const id = await createMeta(sugestao);
        if (id) {
          const novaMeta = {
            id,
            ...sugestao,
            criadoEm: new Date(),
            atualizadoEm: new Date(),
          } as MetaType;

          // Gerar plano para cada meta
          const plano = await gerarPlanoMetaIA(novaMeta, dadosNegocio);
          if (plano) {
            await updateMeta(id, { planoIA: plano });
            novaMeta.planoIA = plano;
          }

          novasMetas.push(novaMeta);
        }
      }
      setMetas((prev) => [...novasMetas, ...prev]);
      toast({
        title: "Metas geradas pela IA",
        description: `A IA criou ${novasMetas.length} metas personalizadas com planos estratégicos.`,
      });
    } catch (error) {
      console.error("Erro ao gerar metas com IA:", error);
      toast({
        title: "Erro",
        description: "Falha ao gerar metas com IA.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingIA(false);
    }
  };

  const visualizarPlanoIA = async (meta: MetaType) => {
    setMetaSelecionada(meta);

    if (meta.planoIA) {
      setPlanoIA(meta.planoIA);
    } else if (dadosNegocio) {
      // Gerar plano se não existir
      setIsGeneratingIA(true);
      try {
        const plano = await gerarPlanoMetaIA(meta, dadosNegocio);
        if (plano) {
          setPlanoIA(plano);
          // Salvar o plano na meta
          await updateMeta(meta.id, { planoIA: plano });
          setMetas((prev) =>
            prev.map((m) => (m.id === meta.id ? { ...m, planoIA: plano } : m))
          );
        } else {
          toast({
            title: "Erro",
            description: "Não foi possível gerar o plano com IA.",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error("Erro ao gerar plano:", error);
        toast({
          title: "Erro",
          description: "Erro ao gerar plano com IA.",
          variant: "destructive",
        });
      } finally {
        setIsGeneratingIA(false);
      }
    } else {
      toast({
        title: "Erro",
        description: "Dados do negócio não carregados.",
        variant: "destructive",
      });
    }
  };

  const metasAtivas = metas.filter((m) => m.status === "ativa");
  const metasConcluidas = metas.filter((m) => m.status === "concluida");

  return (
    <MainLayout>
      <PageHeader
        title="Metas"
        subtitle="Defina e acompanhe suas metas de vendas"
      >
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={gerarMetasIA}
            disabled={true}
            title="Funcionalidade temporariamente desabilitada"
          >
            <Sparkles className="h-4 w-4 mr-2" />
            Gerar Metas com IA (Desabilitado)
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button
                onClick={() => {
                  setEditingMeta(null);
                  setFormData({
                    titulo: "",
                    descricao: "",
                    tipo: "",
                    valorAlvo: "",
                    dataFim: "",
                  });
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Nova Meta
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {editingMeta ? "Editar Meta" : "Nova Meta"}
                </DialogTitle>
                <DialogDescription>
                  {editingMeta
                    ? "Atualize as informações da meta."
                    : "Defina uma nova meta para seu negócio."}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="titulo">Título da Meta</Label>
                  <Input
                    id="titulo"
                    value={formData.titulo}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        titulo: e.target.value,
                      }))
                    }
                    placeholder="Ex: Meta de Receita Mensal"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tipo">Tipo de Meta</Label>
                  <Select
                    value={formData.tipo}
                    onValueChange={(value) =>
                      setFormData((prev) => ({ ...prev, tipo: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      {tiposMeta.map((tipo) => (
                        <SelectItem key={tipo.value} value={tipo.value}>
                          {tipo.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="valorAlvo">Valor Alvo (R$)</Label>
                  <Input
                    id="valorAlvo"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.valorAlvo}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        valorAlvo: e.target.value,
                      }))
                    }
                    placeholder="0,00"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dataFim">Data Limite</Label>
                  <Input
                    id="dataFim"
                    type="date"
                    value={formData.dataFim}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        dataFim: e.target.value,
                      }))
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="descricao">Descrição</Label>
                  <Textarea
                    id="descricao"
                    value={formData.descricao}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        descricao: e.target.value,
                      }))
                    }
                    placeholder="Descreva os detalhes da meta..."
                    rows={3}
                    required
                  />
                </div>

                <div className="flex gap-2 pt-4">
                  <Button type="submit" className="flex-1">
                    {editingMeta ? "Atualizar" : "Criar Meta"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                  >
                    Cancelar
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </PageHeader>

      <div className="space-y-6">
        {/* Resumo das metas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Metas Ativas
              </CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metasAtivas.length}</div>
              <p className="text-xs text-muted-foreground">em andamento</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Metas Concluídas
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {metasConcluidas.length}
              </div>
              <p className="text-xs text-muted-foreground">finalizadas</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Criadas por IA
              </CardTitle>
              <Sparkles className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">
                {metas.filter((m) => m.criadaPorIA).length}
              </div>
              <p className="text-xs text-muted-foreground">
                sugestões inteligentes
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Lista de metas */}
        {loadingMetas ? (
          <div className="text-center py-12">Carregando metas...</div>
        ) : (
          <div className="grid gap-4">
            {metas.map((meta) => {
              const progresso = calcularProgresso(meta);
              const diasRestantes = calcularDiasRestantes(meta.dataFim);
              const TipoIcon =
                tiposMeta.find((t) => t.value === meta.tipo)?.icon || Target;
              return (
                <Card key={meta.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="flex items-center gap-2">
                          <TipoIcon className="h-5 w-5" />
                          {meta.titulo}
                          {meta.criadaPorIA && (
                            <Badge variant="outline" className="text-xs">
                              <Sparkles className="h-3 w-3 mr-1" />
                              IA
                            </Badge>
                          )}
                          <Badge
                            variant={
                              meta.status === "ativa"
                                ? "default"
                                : meta.status === "concluida"
                                ? "secondary"
                                : "destructive"
                            }
                          >
                            {meta.status}
                          </Badge>
                        </CardTitle>
                        <CardDescription>{meta.descricao}</CardDescription>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => visualizarPlanoIA(meta)}
                          title="Ver Plano da IA"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleEdit(meta)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleDelete(meta.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* Progresso */}
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-medium">Progresso</span>
                          <span className="text-sm text-muted-foreground">
                            {progresso.toFixed(1)}%
                          </span>
                        </div>
                        <Progress value={progresso} className="h-2" />
                      </div>

                      {/* Valores */}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm font-medium">
                            {meta.tipo === "custos" ? "Limite" : "Meta"}
                          </p>
                          <p className="text-lg font-bold">
                            R$ {meta.valorAlvo.toLocaleString("pt-BR")}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm font-medium">Atual</p>
                          <p className="text-lg font-bold">
                            R$ {meta.valorAtual.toLocaleString("pt-BR")}
                          </p>
                        </div>
                      </div>

                      {/* Informações de tempo */}
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          Até{" "}
                          {format(meta.dataFim, "dd/MM/yyyy", { locale: ptBR })}
                        </div>
                        <div>
                          {diasRestantes > 0
                            ? `${diasRestantes} dias restantes`
                            : "Prazo vencido"}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
            {metas.length === 0 && (
              <Card>
                <CardContent className="text-center py-12">
                  <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">
                    Nenhuma meta definida
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    Comece definindo suas metas ou deixe a IA sugerir metas
                    personalizadas.
                  </p>
                  <div className="flex gap-2 justify-center">
                    <Button onClick={() => setIsDialogOpen(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Criar Meta
                    </Button>
                    <Button
                      variant="outline"
                      onClick={gerarMetasIA}
                      disabled={true}
                      title="Funcionalidade temporariamente desabilitada"
                    >
                      <Sparkles className="h-4 w-4 mr-2" />
                      Gerar com IA (Desabilitado)
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>

      {/* Modal do Plano da IA */}
      <Dialog
        open={!!metaSelecionada}
        onOpenChange={() => setMetaSelecionada(null)}
      >
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Plano Estratégico - {metaSelecionada?.titulo}
            </DialogTitle>
            <DialogDescription>
              Plano personalizado gerado pela IA para atingir sua meta
            </DialogDescription>
          </DialogHeader>

          {isGeneratingIA ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <Sparkles className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
                <p className="text-lg font-medium">
                  Gerando plano estratégico...
                </p>
                <p className="text-sm text-muted-foreground">
                  A IA está analisando seus dados
                </p>
              </div>
            </div>
          ) : planoIA ? (
            <div className="space-y-6">
              {/* Estratégias */}
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Estratégias
                </h3>
                <div className="grid gap-4">
                  {planoIA.estrategias.map((estrategia, index) => (
                    <Card key={index}>
                      <CardContent className="pt-4">
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-medium">{estrategia.titulo}</h4>
                          <div className="flex gap-2">
                            <Badge
                              variant={
                                estrategia.prioridade === "alta"
                                  ? "destructive"
                                  : estrategia.prioridade === "media"
                                  ? "default"
                                  : "secondary"
                              }
                            >
                              {estrategia.prioridade}
                            </Badge>
                            <Badge variant="outline">
                              {estrategia.categoria}
                            </Badge>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          {estrategia.descricao}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {estrategia.prazo}
                          </span>
                          <span className="flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" />
                            Impacto: {estrategia.impacto}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Cronograma */}
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Cronograma (4 Semanas)
                </h3>
                <div className="grid gap-4">
                  {planoIA.cronograma.map((semana, index) => (
                    <Card key={index}>
                      <CardHeader>
                        <CardTitle className="text-base">
                          Semana {semana.semana}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div>
                            <h4 className="font-medium text-sm mb-2">
                              Atividades:
                            </h4>
                            <ul className="list-disc list-inside space-y-1">
                              {semana.atividades.map((atividade, i) => (
                                <li
                                  key={i}
                                  className="text-sm text-muted-foreground"
                                >
                                  {atividade}
                                </li>
                              ))}
                            </ul>
                          </div>
                          <div>
                            <h4 className="font-medium text-sm mb-2">Metas:</h4>
                            <ul className="list-disc list-inside space-y-1">
                              {semana.metas.map((meta, i) => (
                                <li
                                  key={i}
                                  className="text-sm text-muted-foreground"
                                >
                                  {meta}
                                </li>
                              ))}
                            </ul>
                          </div>
                          {semana.observacoes && (
                            <div>
                              <h4 className="font-medium text-sm mb-2">
                                Observações:
                              </h4>
                              <p className="text-sm text-muted-foreground">
                                {semana.observacoes}
                              </p>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Métricas */}
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Métricas de Acompanhamento
                </h3>
                <div className="grid gap-4 md:grid-cols-2">
                  {planoIA.metricas.map((metrica, index) => (
                    <Card key={index}>
                      <CardContent className="pt-4">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium">{metrica.nome}</h4>
                          <Badge variant="outline">{metrica.frequencia}</Badge>
                        </div>
                        <div className="flex items-center gap-4">
                          <div>
                            <p className="text-sm text-muted-foreground">
                              Atual
                            </p>
                            <p className="text-lg font-bold">
                              {metrica.valorAtual} {metrica.unidade}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">
                              Meta
                            </p>
                            <p className="text-lg font-bold text-primary">
                              {metrica.valorMeta} {metrica.unidade}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Observações */}
              {planoIA.observacoes && (
                <div>
                  <h3 className="text-lg font-semibold mb-4">
                    Observações Gerais
                  </h3>
                  <Card>
                    <CardContent className="pt-4">
                      <p className="text-sm text-muted-foreground">
                        {planoIA.observacoes}
                      </p>
                    </CardContent>
                  </Card>
                </div>
              )}

              <div className="text-xs text-muted-foreground text-center pt-4 border-t">
                Plano gerado em{" "}
                {format(planoIA.geradoEm, "dd/MM/yyyy 'às' HH:mm", {
                  locale: ptBR,
                })}
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                Plano não disponível
              </h3>
              <p className="text-muted-foreground">
                Não foi possível carregar ou gerar o plano estratégico.
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
