"use client";

import type React from "react";

import { useEffect, useState } from "react";
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
import {
  Plus,
  Search,
  Edit,
  Trash2,
  DollarSign,
  Calendar,
  TrendingDown,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { StockPurchase } from "@/components/ui/stock-purchase";

// Firestore helpers
import {
  getCustos as fetchCustos,
  createCusto as createCustoInDb,
  updateCusto as updateCustoInDb,
  deleteCusto as deleteCustoInDb,
  getProdutos as fetchProdutos,
  updateProdutoStock,
} from "@/lib/firebase-functions";

// Importa o tipo Custo do modelo
import type { Custo, Produto } from "@/lib/types";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

// A interface Custo será importada de '@/lib/types'. Os dados serão carregados do Firestore

const categorias = [
  { value: "operacional", label: "Operacional" },
  { value: "marketing", label: "Marketing" },
  { value: "administrativo", label: "Administrativo" },
  { value: "logistica", label: "Logística" },
  { value: "outros", label: "Outros" },
];

export default function CustosPage() {
  const [custos, setCustos] = useState<Custo[]>([]);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loadingCustos, setLoadingCustos] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCusto, setEditingCusto] = useState<Custo | null>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    descricao: "",
    categoria: "",
    valor: "",
    fornecedor: "",
    metodoPagamento: "",
    data: "",
    dataVencimento: "",
    observacoes: "",
    recorrente: false,
  });

  // Carregar custos e produtos do Firestore ao montar a página
  useEffect(() => {
    let isSubscribed = true;
    async function loadData() {
      try {
        setLoadingCustos(true);
        console.log("🔄 [loadData] Carregando dados de custos...");

        const [custosDb, produtosDb] = await Promise.all([
          fetchCustos(),
          fetchProdutos(),
        ]);

        if (isSubscribed) {
          setCustos(custosDb);
          setProdutos(produtosDb);
          console.log("✅ [loadData] Dados carregados:", {
            custos: custosDb.length,
            produtos: produtosDb.length,
          });
        }
      } catch (error) {
        console.error("❌ [loadData] Erro ao carregar dados:", error);
      } finally {
        if (isSubscribed) setLoadingCustos(false);
      }
    }
    loadData();
    return () => {
      isSubscribed = false;
    };
  }, []);

  const filteredCustos = custos.filter(
    (custo) =>
      custo.descricao.toLowerCase().includes(searchTerm.toLowerCase()) ||
      custo.categoria.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (custo.fornecedorNome || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase())
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const custoPayload = {
      descricao: formData.descricao,
      categoria: formData.categoria as Custo["categoria"],
      valor: Number.parseFloat(formData.valor),
      data: formData.data ? new Date(formData.data) : new Date(),
      dataVencimento: formData.dataVencimento
        ? new Date(formData.dataVencimento)
        : undefined,
      dataPagamento:
        formData.metodoPagamento === "fiado" ? undefined : new Date(),
      fornecedorId: undefined as string | undefined,
      fornecedorNome: formData.fornecedor || undefined,
      metodoPagamento: formData.metodoPagamento as Custo["metodoPagamento"],
      observacoes: formData.observacoes || undefined,
      status:
        formData.metodoPagamento === "fiado"
          ? ("pendente" as const)
          : ("pago" as const),
      recorrente: formData.recorrente,
    };

    if (editingCusto) {
      // Atualizar custo existente
      (async () => {
        const success = await updateCustoInDb(
          editingCusto.id,
          custoPayload as any
        );
        if (success) {
          setCustos((prev) =>
            prev.map((c) =>
              c.id === editingCusto.id ? { ...c, ...custoPayload } : c
            )
          );
          toast({
            title: "Custo atualizado",
            description: "O custo foi atualizado com sucesso.",
          });
        } else {
          toast({
            title: "Erro ao atualizar custo",
            description: "Não foi possível atualizar o custo. Tente novamente.",
            variant: "destructive",
          });
        }
      })();
    } else {
      // Criar novo custo
      (async () => {
        const newId = await createCustoInDb(custoPayload as any);
        if (newId) {
          const novoCusto: Custo = {
            id: newId,
            ...custoPayload,
          } as any;
          setCustos((prev) => [novoCusto, ...prev]);
          toast({
            title: "Custo registrado",
            description: "Novo custo foi registrado com sucesso.",
          });
        } else {
          toast({
            title: "Erro ao registrar custo",
            description: "Não foi possível salvar o custo. Tente novamente.",
            variant: "destructive",
          });
        }
      })();
    }

    // Reset form
    setFormData({
      descricao: "",
      categoria: "",
      valor: "",
      fornecedor: "",
      metodoPagamento: "",
      data: "",
      dataVencimento: "",
      observacoes: "",
      recorrente: false,
    });
    setEditingCusto(null);
    setIsDialogOpen(false);
  };

  const handleEdit = (custo: Custo) => {
    setEditingCusto(custo);
    setFormData({
      descricao: custo.descricao,
      categoria: custo.categoria,
      valor: custo.valor.toString(),
      fornecedor: custo.fornecedorNome || "",
      metodoPagamento: custo.metodoPagamento,
      data: format(custo.data, "yyyy-MM-dd"),
      dataVencimento: custo.dataVencimento
        ? format(custo.dataVencimento, "yyyy-MM-dd")
        : "",
      observacoes: custo.observacoes || "",
      recorrente: custo.recorrente,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    (async () => {
      const success = await deleteCustoInDb(id);
      if (success) {
        setCustos((prev) => prev.filter((c) => c.id !== id));
        toast({
          title: "Custo removido",
          description: "O custo foi removido com sucesso.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Erro ao remover custo",
          description: "Não foi possível remover o custo.",
          variant: "destructive",
        });
      }
    })();
  };

  const handleStockUpdate = async (
    productId: string,
    newStock: number,
    reason: string,
    cost: number
  ) => {
    console.log(
      "📦 [handleStockUpdate] Atualizando estoque do produto:",
      productId
    );
    console.log("📦 [handleStockUpdate] Novo estoque:", newStock);
    console.log("📦 [handleStockUpdate] Motivo:", reason);
    console.log("📦 [handleStockUpdate] Custo:", cost);

    try {
      // Atualizar estoque do produto
      const success = await updateProdutoStock(productId, newStock, reason);
      if (!success) {
        throw new Error("Falha ao atualizar estoque");
      }

      // Criar um custo para a compra de estoque
      const custoData = {
        descricao: `Compra de estoque - ${reason}`,
        categoria: "operacional" as const,
        valor: cost,
        fornecedorNome:
          produtos.find((p) => p.id === productId)?.supplierName || "",
        metodoPagamento: "dinheiro" as const,
        observacoes: `Compra de ${
          newStock - (produtos.find((p) => p.id === productId)?.stock || 0)
        } unidades`,
        recorrente: false,
        status: "pago" as const,
        data: new Date(),
      };

      const custoId = await createCustoInDb(custoData);
      if (custoId) {
        // Recarregar dados para atualizar a exibição
        const [custosDb, produtosDb] = await Promise.all([
          fetchCustos(),
          fetchProdutos(),
        ]);
        setCustos(custosDb);
        setProdutos(produtosDb);

        console.log(
          "✅ [handleStockUpdate] Estoque e custo atualizados com sucesso!"
        );
      } else {
        throw new Error("Falha ao criar custo");
      }
    } catch (error) {
      console.error(
        "❌ [handleStockUpdate] Falha ao atualizar estoque:",
        error
      );
      throw error;
    }
  };

  const toggleStatus = (id: string) => {
    const custo = custos.find((c) => c.id === id);
    if (!custo) return;
    const newStatus = custo.status === "pago" ? "pendente" : "pago";
    (async () => {
      const success = await updateCustoInDb(id, { status: newStatus } as any);
      if (success) {
        setCustos((prev) =>
          prev.map((c) => (c.id === id ? { ...c, status: newStatus } : c))
        );
      } else {
        toast({
          title: "Erro ao atualizar status",
          description: "Não foi possível atualizar o status do custo.",
          variant: "destructive",
        });
      }
    })();
  };

  const totalCustos = custos.reduce((acc, custo) => acc + custo.valor, 0);
  const custosPagos = custos
    .filter((c) => c.status === "pago")
    .reduce((acc, custo) => acc + custo.valor, 0);
  const custosPendentes = custos
    .filter((c) => c.status === "pendente")
    .reduce((acc, custo) => acc + custo.valor, 0);

  return (
    <MainLayout>
      <PageHeader title="Custos" subtitle="Gerencie suas despesas operacionais">
        <div className="flex gap-2">
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button
                onClick={() => {
                  setEditingCusto(null);
                  setFormData({
                    descricao: "",
                    categoria: "",
                    valor: "",
                    fornecedor: "",
                    metodoPagamento: "",
                    data: "",
                    dataVencimento: "",
                    observacoes: "",
                    recorrente: false,
                  });
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Novo Custo
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {editingCusto ? "Editar Custo" : "Novo Custo"}
                </DialogTitle>
                <DialogDescription>
                  {editingCusto
                    ? "Atualize as informações do custo."
                    : "Registre um novo custo no sistema."}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="descricao">Descrição</Label>
                  <Input
                    id="descricao"
                    value={formData.descricao}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        descricao: e.target.value,
                      }))
                    }
                    placeholder="Ex: Aluguel da loja"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="categoria">Categoria</Label>
                  <Select
                    value={formData.categoria}
                    onValueChange={(value) =>
                      setFormData((prev) => ({ ...prev, categoria: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      {categorias.map((categoria) => (
                        <SelectItem
                          key={categoria.value}
                          value={categoria.value}
                        >
                          {categoria.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="valor">Valor (R$)</Label>
                  <Input
                    id="valor"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.valor}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        valor: e.target.value,
                      }))
                    }
                    placeholder="0,00"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="data">Data</Label>
                  <Input
                    id="data"
                    type="date"
                    value={formData.data}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        data: e.target.value,
                      }))
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fornecedor">Fornecedor (opcional)</Label>
                  <Input
                    id="fornecedor"
                    value={formData.fornecedor}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        fornecedor: e.target.value,
                      }))
                    }
                    placeholder="Nome do fornecedor"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="metodoPagamento">Método de Pagamento</Label>
                  <Select
                    value={formData.metodoPagamento}
                    onValueChange={(value) =>
                      setFormData((prev) => ({
                        ...prev,
                        metodoPagamento: value,
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o método" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="dinheiro">Dinheiro</SelectItem>
                      <SelectItem value="cartao">Cartão</SelectItem>
                      <SelectItem value="pix">PIX</SelectItem>
                      <SelectItem value="transferencia">
                        Transferência
                      </SelectItem>
                      <SelectItem value="boleto">Boleto</SelectItem>
                      <SelectItem value="fiado">Fiado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dataVencimento">Data de Vencimento</Label>
                  <Input
                    id="dataVencimento"
                    type="date"
                    value={formData.dataVencimento}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        dataVencimento: e.target.value,
                      }))
                    }
                    disabled={formData.metodoPagamento !== "fiado"}
                    className={
                      formData.metodoPagamento !== "fiado" ? "opacity-50" : ""
                    }
                  />
                  {formData.metodoPagamento !== "fiado" && (
                    <p className="text-xs text-muted-foreground">
                      Disponível apenas para custos fiados
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="observacoes">Observações</Label>
                  <Textarea
                    id="observacoes"
                    value={formData.observacoes}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        observacoes: e.target.value,
                      }))
                    }
                    placeholder="Observações adicionais (opcional)"
                    rows={3}
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="recorrente"
                    checked={formData.recorrente}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        recorrente: e.target.checked,
                      }))
                    }
                    className="rounded border-gray-300"
                  />
                  <Label htmlFor="recorrente" className="text-sm">
                    Custo recorrente
                  </Label>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button type="submit" className="flex-1">
                    {editingCusto ? "Atualizar" : "Registrar"}
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

          <StockPurchase
            products={produtos}
            onStockUpdate={handleStockUpdate}
          />
        </div>
      </PageHeader>

      <div className="space-y-6">
        {/* Resumo dos custos */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total de Custos
              </CardTitle>
              <TrendingDown className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                R$ {totalCustos.toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground">
                {custos.length} registros
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Custos Pagos
              </CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                R$ {custosPagos.toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground">
                pagamentos realizados
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Custos Pendentes
              </CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                R$ {custosPendentes.toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground">
                aguardando pagamento
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Barra de pesquisa */}
        <Card>
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Pesquisar custos por descrição, categoria ou fornecedor..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Lista de custos */}
        <div className="grid gap-4">
          {filteredCustos.map((custo) => (
            <Card key={custo.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {custo.descricao}
                      <Badge
                        variant={
                          custo.status === "pago"
                            ? "default"
                            : custo.status === "pendente"
                            ? "secondary"
                            : "destructive"
                        }
                      >
                        {custo.status}
                      </Badge>
                      {custo.recorrente && (
                        <Badge variant="outline" className="text-xs">
                          Recorrente
                        </Badge>
                      )}
                    </CardTitle>
                    <CardDescription>
                      Categoria:{" "}
                      {
                        categorias.find((c) => c.value === custo.categoria)
                          ?.label
                      }
                      {custo.fornecedorNome &&
                        ` • Fornecedor: ${custo.fornecedorNome}`}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleEdit(custo)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleDelete(custo.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm font-medium">Valor</p>
                    <p className="text-2xl font-bold text-red-600">
                      R$ {custo.valor.toFixed(2)}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                      <Calendar className="h-4 w-4" />
                      {format(custo.data, "dd/MM/yyyy", { locale: ptBR })}
                    </div>
                    <Badge variant="outline">{custo.metodoPagamento}</Badge>
                  </div>
                </div>

                {custo.observacoes && (
                  <div className="mb-3 p-3 bg-muted rounded-lg">
                    <p className="text-sm">{custo.observacoes}</p>
                  </div>
                )}

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleStatus(custo.id)}
                  >
                    Marcar como {custo.status === "pago" ? "Pendente" : "Pago"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {loadingCustos ? (
          <Card>
            <CardContent className="text-center py-12">
              <h3 className="text-lg font-semibold mb-2">
                Carregando custos...
              </h3>
            </CardContent>
          </Card>
        ) : filteredCustos.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <TrendingDown className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                Nenhum custo encontrado
              </h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm
                  ? "Tente ajustar sua pesquisa."
                  : "Comece registrando seu primeiro custo."}
              </p>
              {!searchTerm && (
                <Button onClick={() => setIsDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Registrar Primeiro Custo
                </Button>
              )}
            </CardContent>
          </Card>
        ) : null}
      </div>
    </MainLayout>
  );
}
