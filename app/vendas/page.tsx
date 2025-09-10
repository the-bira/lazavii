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
  ShoppingCart,
  Calendar,
  DollarSign,
  CheckCircle,
  XCircle,
  AlertCircle,
  RotateCcw,
  Edit,
  Trash2,
  Check,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { MultiProductSelect } from "@/components/ui/multi-product-select";

// Firestore helpers
import {
  getProdutos as fetchProdutos,
  getFornecedores as fetchFornecedores,
  getVendas as fetchVendas,
  createVenda as createVendaInDb,
  createVendaMultiProduto,
  updateVenda,
  deleteVenda,
  confirmarPagamento,
  createExtorno,
} from "@/lib/firebase-functions";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

// Importar o tipo Venda definido nos modelos, que contém IDs e nomes de produto/fornecedor
import type { Venda, ItemVenda } from "@/lib/types";

// Note: fornecedores e produtos serão carregados do Firestore

export default function VendasPage() {
  // Lista de vendas carregadas do Firestore
  const [vendas, setVendas] = useState<Venda[]>([]);
  // Lista de produtos disponíveis (para seleção)
  const [produtos, setProdutos] = useState<any[]>([]);
  // Lista de fornecedores disponíveis (para seleção)
  const [fornecedores, setFornecedores] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingVenda, setEditingVenda] = useState<Venda | null>(null);
  const { toast } = useToast();

  // Formulário de cadastro/edição de venda
  const [formData, setFormData] = useState({
    itens: [] as ItemVenda[],
    cliente: "",
    metodoPagamento: "",
    dataVenda: new Date().toISOString().split("T")[0], // Preenchido com data atual
    observacoes: "",
    desconto: 0,
  });

  // Carregar vendas, produtos e fornecedores do Firestore ao montar a página
  useEffect(() => {
    let isSubscribed = true;
    async function loadData() {
      try {
        setLoadingData(true);
        console.log("🔄 [loadData] Carregando dados de vendas...");

        const [vendasDb, produtosDb] = await Promise.all([
          fetchVendas(),
          fetchProdutos(),
        ]);

        if (isSubscribed) {
          setVendas(vendasDb);

          // Normalizar dados dos produtos para o ProductAutocomplete
          const produtosNormalizados = produtosDb.map((p) => ({
            ...p,
            // Garantir que os campos principais existam (sobrescrever se necessário)
            name: p.name || p.nome || "",
            supplierName: p.supplierName || p.fornecedorNome || "",
            color: p.color || p.cor || "",
            salePrice: p.salePrice ?? p.precoVenda ?? 0,
            purchasePrice: p.purchasePrice ?? p.custoCompra ?? 0,
            stock: p.stock ?? p.estoque ?? 0,
          }));

          setProdutos(produtosNormalizados);
          console.log("✅ [loadData] Dados carregados:", {
            vendas: vendasDb.length,
            produtos: produtosDb.length,
            produtosNormalizados: produtosNormalizados.length,
          });
          console.log(
            "📦 [loadData] Primeiros produtos normalizados:",
            produtosNormalizados.slice(0, 3)
          );
        }
      } catch (error) {
        console.error("❌ [loadData] Erro ao carregar dados de vendas:", error);
      } finally {
        if (isSubscribed) setLoadingData(false);
      }
    }
    loadData();
    return () => {
      isSubscribed = false;
    };
  }, []);

  const filteredVendas = vendas.filter((venda) => {
    const term = searchTerm.toLowerCase();
    const produtoNome =
      (venda as any).produtoNome || (venda as any).produto || "";
    const fornecedorNome =
      (venda as any).fornecedorNome || (venda as any).fornecedor || "";
    const cliente = venda.cliente || "";
    return (
      produtoNome.toLowerCase().includes(term) ||
      cliente.toLowerCase().includes(term) ||
      fornecedorNome.toLowerCase().includes(term)
    );
  });

  const calcularTotais = () => {
    const itens = formData.itens || [];
    const subtotal = itens.reduce((sum, item) => sum + item.precoTotal, 0);
    const valorDesconto = (subtotal * formData.desconto) / 100;
    const precoTotal = subtotal - valorDesconto;
    const custoTotal = itens.reduce((sum, item) => sum + item.custoTotal, 0);
    const lucro = precoTotal - custoTotal;

    return {
      subtotal,
      valorDesconto,
      precoTotal,
      custoTotal,
      lucro,
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.itens || formData.itens.length === 0) {
      toast({
        title: "Erro",
        description: "Adicione pelo menos um produto à venda.",
        variant: "destructive",
      });
      return;
    }

    const { precoTotal, custoTotal, lucro, subtotal, valorDesconto } =
      calcularTotais();

    if (editingVenda) {
      // Atualizar venda existente
      const vendaAtualizada: Venda = {
        ...editingVenda,
        itens: formData.itens,
        cliente: formData.cliente,
        metodoPagamento: formData.metodoPagamento as Venda["metodoPagamento"],
        dataVenda: new Date(formData.dataVenda),
        observacoes: formData.observacoes,
        desconto: formData.desconto,
        precoTotal,
        custoTotal,
        lucro,
        atualizadoEm: new Date(),
      };

      setVendas((prev) =>
        prev.map((v) => (v.id === editingVenda.id ? vendaAtualizada : v))
      );
      toast({
        title: "Venda atualizada",
        description:
          "A venda foi atualizada localmente. Sincronização com o banco não implementada.",
      });
    } else {
      // Criar nova venda
      const novaVendaData = {
        itens: formData.itens,
        cliente: formData.cliente,
        dataVenda: new Date(formData.dataVenda),
        metodoPagamento: formData.metodoPagamento as Venda["metodoPagamento"],
        statusPagamento:
          formData.metodoPagamento === "fiado"
            ? ("pendente" as const)
            : ("pago" as const),
        dataPagamento:
          formData.metodoPagamento === "fiado" ? undefined : new Date(),
        observacoes: formData.observacoes,
        desconto: formData.desconto,
        precoTotal,
        custoTotal,
        lucro,
        status: "concluida" as const,
      };

      try {
        console.log("🛒 [handleSubmit] Salvando venda no Firestore...");
        const vendaId = await createVendaMultiProduto(novaVendaData);

        if (vendaId) {
          const novaVenda: Venda = {
            id: vendaId,
            ...novaVendaData,
            criadoEm: new Date(),
            atualizadoEm: new Date(),
          };

          setVendas((prev) => [novaVenda, ...prev]);
          toast({
            title: "Venda registrada",
            description:
              "A venda foi registrada com sucesso no banco de dados.",
          });
        } else {
          toast({
            title: "Erro",
            description:
              "Não foi possível salvar a venda. Verifique o estoque dos produtos.",
            variant: "destructive",
          });
          return;
        }
      } catch (error) {
        console.error("❌ [handleSubmit] Erro ao salvar venda:", error);
        toast({
          title: "Erro",
          description: "Ocorreu um erro ao salvar a venda.",
          variant: "destructive",
        });
        return;
      }
    }

    // Reset form
    setFormData({
      itens: [],
      cliente: "",
      metodoPagamento: "",
      dataVenda: new Date().toISOString().split("T")[0],
      observacoes: "",
      desconto: 0,
    });
    setEditingVenda(null);
    setIsDialogOpen(false);
  };

  const handleEdit = (venda: Venda) => {
    setEditingVenda(venda);
    setFormData({
      itens: venda.itens || [],
      cliente: venda.cliente,
      metodoPagamento: venda.metodoPagamento,
      dataVenda: format(venda.dataVenda, "yyyy-MM-dd"),
      observacoes: venda.observacoes || "",
      desconto: venda.desconto || 0,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    // Remover venda localmente (remoção no banco não implementada)
    setVendas((prev) => prev.filter((v) => v.id !== id));
    toast({
      title: "Venda removida",
      description:
        "A venda foi removida localmente. Remoção permanente não implementada.",
      variant: "destructive",
    });
  };

  const handleConfirmPayment = async (id: string) => {
    try {
      const venda = vendas.find((v) => v.id === id);
      if (!venda) return;

      const vendaAtualizada: Venda = {
        ...venda,
        statusPagamento: "pago" as const,
        dataPagamento: new Date(),
        atualizadoEm: new Date(),
      };

      // Atualizar localmente (atualização no banco não implementada)
      setVendas((prev) => prev.map((v) => (v.id === id ? vendaAtualizada : v)));

      toast({
        title: "Pagamento confirmado",
        description: "O pagamento da venda foi confirmado com sucesso.",
      });
    } catch (error) {
      console.error("Erro ao confirmar pagamento:", error);
      toast({
        title: "Erro",
        description: "Não foi possível confirmar o pagamento.",
        variant: "destructive",
      });
    }
  };

  const totais = calcularTotais();

  return (
    <MainLayout>
      <PageHeader
        title="Registrar Venda"
        subtitle="Registre novas vendas e atualize o estoque"
      >
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={() => {
                setEditingVenda(null);
                setFormData({
                  itens: [],
                  cliente: "",
                  metodoPagamento: "",
                  dataVenda: new Date().toISOString().split("T")[0],
                  observacoes: "",
                  desconto: 0,
                });
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Nova Venda
            </Button>
          </DialogTrigger>
          <DialogContent className="w-full sm:max-w-[90vw] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingVenda ? "Editar Venda" : "Nova Venda"}
              </DialogTitle>
              <DialogDescription>
                {editingVenda
                  ? "Atualize as informações da venda."
                  : "Registre uma nova venda no sistema."}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Produtos</Label>
                <MultiProductSelect
                  products={produtos}
                  selectedItems={formData.itens}
                  onItemsChange={(items) => {
                    setFormData((prev) => ({
                      ...prev,
                      itens: items,
                    }));
                  }}
                  placeholder="Buscar e adicionar produtos..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="desconto">Desconto Geral (%)</Label>
                  <Input
                    id="desconto"
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={formData.desconto}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        desconto: Number(e.target.value) || 0,
                      }))
                    }
                    placeholder="0"
                  />
                </div>
              </div>

              {/* Resumo dos cálculos */}
              {formData.itens && formData.itens.length > 0 && (
                <Card className="bg-muted/50">
                  <CardContent className="pt-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="font-medium">Subtotal</p>
                        <p className="text-lg font-bold">
                          R$ {totais.subtotal.toFixed(2)}
                        </p>
                      </div>
                      {totais.valorDesconto > 0 && (
                        <div>
                          <p className="font-medium">Desconto</p>
                          <p className="text-lg font-bold text-orange-600">
                            -R$ {totais.valorDesconto.toFixed(2)}
                          </p>
                        </div>
                      )}
                      <div>
                        <p className="font-medium">Total da Venda</p>
                        <p className="text-lg font-bold text-green-600">
                          R$ {totais.precoTotal.toFixed(2)}
                        </p>
                      </div>
                      <div>
                        <p className="font-medium">Custo Total</p>
                        <p className="text-lg font-bold text-red-600">
                          R$ {totais.custoTotal.toFixed(2)}
                        </p>
                      </div>
                      <div className="md:col-span-2">
                        <p className="font-medium">Lucro</p>
                        <p className="text-lg font-bold text-primary">
                          R$ {totais.lucro.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="cliente">Cliente (opcional)</Label>
                  <Input
                    id="cliente"
                    value={formData.cliente}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        cliente: e.target.value,
                      }))
                    }
                    placeholder="Nome do cliente (opcional)"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dataVenda">Data da Venda</Label>
                  <Input
                    id="dataVenda"
                    type="date"
                    value={formData.dataVenda}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        dataVenda: e.target.value,
                      }))
                    }
                    required
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
                      <SelectItem value="fiado">Fiado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
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

              <div className="flex gap-2 pt-4">
                <Button type="submit" className="flex-1">
                  {editingVenda ? "Atualizar Venda" : "Registrar Venda"}
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
      </PageHeader>

      <div className="space-y-6">
        {/* Resumo das vendas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total de Vendas
              </CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{vendas.length}</div>
              <p className="text-xs text-muted-foreground">
                vendas registradas
              </p>
            </CardContent>
          </Card>

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
                {vendas
                  .reduce((acc, venda) => acc + venda.precoTotal, 0)
                  .toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground">em vendas</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Lucro Total</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">
                R${" "}
                {vendas.reduce((acc, venda) => acc + venda.lucro, 0).toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground">de lucro</p>
            </CardContent>
          </Card>
        </div>

        {/* Barra de pesquisa */}
        <Card>
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Pesquisar vendas por produto, cliente ou fornecedor..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Lista de vendas */}
        <div className="grid gap-4">
          {filteredVendas.map((venda) => (
            <Card key={venda.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {(venda as any).produtoNome ||
                        (venda as any).produto ||
                        "Produto"}
                      <Badge
                        variant={
                          venda.status === "concluida" ? "default" : "secondary"
                        }
                      >
                        {venda.status}
                      </Badge>
                    </CardTitle>
                    <CardDescription>
                      Cliente: {venda.cliente} • Fornecedor:{" "}
                      {(venda as any).fornecedorNome ||
                        (venda as any).fornecedor ||
                        "Fornecedor"}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    {venda.metodoPagamento === "fiado" &&
                      venda.statusPagamento === "pendente" && (
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => handleConfirmPayment(venda.id)}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <Check className="h-4 w-4 mr-1" />
                          Confirmar Pagamento
                        </Button>
                      )}
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleEdit(venda)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleDelete(venda.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 mb-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm font-medium">Valor Total</p>
                      <p className="text-lg font-bold text-green-600">
                        R$ {venda.precoTotal.toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Custo Total</p>
                      <p className="text-lg font-bold text-red-600">
                        R$ {venda.custoTotal.toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Lucro</p>
                      <p className="text-lg font-bold text-blue-600">
                        R$ {venda.lucro.toFixed(2)}
                      </p>
                    </div>
                  </div>

                  {/* Lista de produtos */}
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Produtos:</p>
                    {venda.itens?.map((item, index) => (
                      <div
                        key={index}
                        className="flex justify-between items-center p-2 bg-gray-50 rounded"
                      >
                        <div>
                          <span className="font-medium">
                            {item.produtoNome}
                          </span>
                          <span className="text-sm text-gray-600 ml-2">
                            ({item.fornecedorNome})
                          </span>
                        </div>
                        <div className="text-sm">
                          {item.quantidade}x R$ {item.precoUnitario.toFixed(2)}{" "}
                          = R$ {item.precoTotal.toFixed(2)}
                        </div>
                      </div>
                    )) || (
                      <div className="text-sm text-gray-600">
                        {(venda as any).produtoNome} -{" "}
                        {(venda as any).quantidade}x - R${" "}
                        {venda.precoTotal.toFixed(2)}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {format(venda.dataVenda, "dd/MM/yyyy", { locale: ptBR })}
                    </div>
                    <Badge variant="outline">{venda.metodoPagamento}</Badge>
                  </div>
                </div>

                {venda.observacoes && (
                  <div className="mt-3 p-3 bg-muted rounded-lg">
                    <p className="text-sm">{venda.observacoes}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredVendas.length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <ShoppingCart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                Nenhuma venda encontrada
              </h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm
                  ? "Tente ajustar sua pesquisa."
                  : "Comece registrando sua primeira venda."}
              </p>
              {!searchTerm && (
                <Button onClick={() => setIsDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Registrar Primeira Venda
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </MainLayout>
  );
}
