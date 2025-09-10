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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Package,
  Phone,
  Mail,
  MapPin,
  ChevronDown,
  MoreHorizontal,
  Image as ImageIcon,
} from "lucide-react";
import { ImageUpload } from "@/components/ui/image-upload";
import { StockAdjustment } from "@/components/ui/stock-adjustment";
import { useToast } from "@/hooks/use-toast";

// Firestore helpers
import {
  getFornecedores as fetchFornecedores,
  createFornecedor as createFornecedorInDb,
  updateFornecedor as updateFornecedorInDb,
  deleteFornecedor as deleteFornecedorInDb,
  getProdutosBySupplier,
  createProduto as createProdutoInDb,
  updateProduto as updateProdutoInDb,
  deleteProduto as deleteProdutoInDb,
  updateProdutoStock,
} from "@/lib/firebase-functions";
import type { Fornecedor, Produto } from "@/lib/types";

interface SupplierWithProducts extends Fornecedor {
  produtos: Produto[];
}

export default function FornecedoresPage() {
  const [suppliers, setSuppliers] = useState<SupplierWithProducts[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedSuppliers, setExpandedSuppliers] = useState<Set<string>>(
    new Set()
  );
  const [isSupplierDialogOpen, setIsSupplierDialogOpen] = useState(false);
  const [isProductDialogOpen, setIsProductDialogOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Fornecedor | null>(
    null
  );
  const [editingProduct, setEditingProduct] = useState<Produto | null>(null);
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{
    type: "supplier" | "product";
    id: string;
    name: string;
    productCount?: number;
  } | null>(null);
  const { toast } = useToast();

  // Formulário de fornecedor
  const [supplierForm, setSupplierForm] = useState({
    nome: "",
    contato: "",
    telefone: "",
    email: "",
    endereco: "",
  });

  // Formulário de produto
  const [productForm, setProductForm] = useState({
    name: "",
    purchasePrice: "",
    salePrice: "",
    color: "",
    sizing: "",
    stock: "",
    photoUrl: "",
  });

  // Carregar dados iniciais
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    console.log("🔄 [loadData] Iniciando carregamento de dados...");
    try {
      setLoading(true);
      console.log("📡 [loadData] Buscando fornecedores...");

      const fornecedores = await fetchFornecedores();
      console.log(
        "👥 [loadData] Fornecedores encontrados:",
        fornecedores.length
      );

      const suppliersWithProducts: SupplierWithProducts[] = [];

      for (const supplier of fornecedores) {
        console.log(
          "📦 [loadData] Buscando produtos para fornecedor:",
          supplier.nome
        );
        const produtos = await getProdutosBySupplier(supplier.id);
        console.log(
          "📦 [loadData] Produtos encontrados para",
          supplier.nome,
          ":",
          produtos.length
        );

        suppliersWithProducts.push({
          ...supplier,
          produtos,
        });
      }

      console.log("✅ [loadData] Dados carregados com sucesso");
      console.log(
        "📊 [loadData] Total de fornecedores com produtos:",
        suppliersWithProducts.length
      );

      setSuppliers(suppliersWithProducts);
    } catch (error) {
      console.error("❌ [loadData] Erro ao carregar dados:", error);
      toast({
        title: "Erro ao carregar dados",
        description: "Não foi possível carregar os fornecedores e produtos.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      console.log("🏁 [loadData] Carregamento finalizado");
    }
  };

  const filteredSuppliers = suppliers.filter(
    (supplier) =>
      supplier.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supplier.contato.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleSupplierExpansion = (supplierId: string) => {
    const newExpanded = new Set(expandedSuppliers);
    if (newExpanded.has(supplierId)) {
      newExpanded.delete(supplierId);
    } else {
      newExpanded.add(supplierId);
    }
    setExpandedSuppliers(newExpanded);
  };

  // Handlers para fornecedores
  const handleSupplierSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const supplierData = {
      ...supplierForm,
      produtosPrincipais: [],
      status: "ativo" as const,
      totalProdutos: 0,
    };

    if (editingSupplier) {
      updateSupplier(editingSupplier.id, supplierData);
    } else {
      createSupplier(supplierData);
    }
  };

  const createSupplier = async (data: any) => {
    console.log("🚀 [createSupplier] Iniciando criação de fornecedor na UI");
    console.log("📝 [createSupplier] Dados do formulário:", data);

    const supplierId = await createFornecedorInDb(data);
    console.log("🆔 [createSupplier] ID retornado:", supplierId);

    if (supplierId) {
      const newSupplier: SupplierWithProducts = {
        id: supplierId,
        ...data,
        produtos: [],
      };
      console.log(
        "✅ [createSupplier] Adicionando fornecedor ao estado:",
        newSupplier
      );

      setSuppliers((prev) => {
        const updated = [...prev, newSupplier];
        console.log(
          "📊 [createSupplier] Estado atualizado, total de fornecedores:",
          updated.length
        );
        return updated;
      });

      toast({
        title: "Fornecedor criado",
        description: "Fornecedor foi criado com sucesso.",
      });
    } else {
      console.error(
        "❌ [createSupplier] Falha ao criar fornecedor - ID não retornado"
      );
      toast({
        title: "Erro ao criar fornecedor",
        description: "Não foi possível criar o fornecedor. Tente novamente.",
        variant: "destructive",
      });
    }
    resetSupplierForm();
  };

  const updateSupplier = async (id: string, data: any) => {
    const success = await updateFornecedorInDb(id, data);
    if (success) {
      setSuppliers((prev) =>
        prev.map((s) => (s.id === id ? { ...s, ...data } : s))
      );
      toast({
        title: "Fornecedor atualizado",
        description: "Fornecedor foi atualizado com sucesso.",
      });
    }
    resetSupplierForm();
  };

  const handleSupplierEdit = (supplier: Fornecedor) => {
    setEditingSupplier(supplier);
    setSupplierForm({
      nome: supplier.nome,
      contato: supplier.contato,
      telefone: supplier.telefone,
      email: supplier.email,
      endereco: supplier.endereco,
    });
    setIsSupplierDialogOpen(true);
  };

  const handleSupplierDelete = (supplier: SupplierWithProducts) => {
    setItemToDelete({
      type: "supplier",
      id: supplier.id,
      name: supplier.nome,
      productCount: supplier.produtos.length,
    });
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;

    if (itemToDelete.type === "supplier") {
      console.log(
        "🗑️ [confirmDelete] Excluindo fornecedor e produtos associados"
      );

      // Primeiro, deletar todos os produtos do fornecedor
      const supplier = suppliers.find((s) => s.id === itemToDelete.id) as
        | SupplierWithProducts
        | undefined;
      if (supplier && supplier.produtos.length > 0) {
        console.log(
          `📦 [confirmDelete] Deletando ${supplier.produtos.length} produtos do fornecedor`
        );
        for (const produto of supplier.produtos) {
          await deleteProdutoInDb(produto.id);
        }
      }

      // Depois, deletar o fornecedor
      const success = await deleteFornecedorInDb(itemToDelete.id);
      if (success) {
        setSuppliers((prev) => prev.filter((s) => s.id !== itemToDelete.id));
        toast({
          title: "Fornecedor excluído",
          description: `Fornecedor e ${
            itemToDelete.productCount || 0
          } produtos foram excluídos com sucesso.`,
        });
      }
    } else {
      const success = await deleteProdutoInDb(itemToDelete.id);
      if (success) {
        await loadData(); // Recarregar dados para atualizar contadores
        toast({
          title: "Produto excluído",
          description: "Produto foi excluído com sucesso.",
        });
      }
    }

    setDeleteDialogOpen(false);
    setItemToDelete(null);
  };

  // Handlers para produtos
  const handleProductSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    console.log("📦 [handleProductSubmit] Iniciando submit do produto");
    console.log(
      "🔍 [handleProductSubmit] selectedSupplierId atual:",
      selectedSupplierId
    );

    // Validar se o fornecedor foi selecionado
    if (!selectedSupplierId) {
      console.error("❌ [handleProductSubmit] selectedSupplierId está vazio!");
      toast({
        title: "Erro de validação",
        description: "Selecione um fornecedor para o produto.",
        variant: "destructive",
      });
      return;
    }

    const selectedSupplier = suppliers.find((s) => s.id === selectedSupplierId);
    if (!selectedSupplier) {
      toast({
        title: "Erro de validação",
        description: "Fornecedor não encontrado. Tente novamente.",
        variant: "destructive",
      });
      return;
    }

    const productData = {
      name: productForm.name,
      supplierId: selectedSupplierId,
      supplierName: selectedSupplier.nome,
      purchasePrice: parseFloat(productForm.purchasePrice),
      salePrice: parseFloat(productForm.salePrice),
      color: productForm.color,
      sizing: productForm.sizing,
      stock: parseInt(productForm.stock),
      photoUrl: productForm.photoUrl,
      status: "ativo" as const,
    };

    console.log("📦 [handleProductSubmit] Dados do produto:", productData);

    if (editingProduct) {
      updateProduct(editingProduct.id, productData);
    } else {
      createProduct(productData);
    }
  };

  const createProduct = async (data: any) => {
    console.log("🚀 [createProduct] Iniciando criação de produto na UI");
    console.log("📝 [createProduct] Dados do formulário:", data);

    const productId = await createProdutoInDb(data);
    console.log("🆔 [createProduct] ID retornado:", productId);

    if (productId) {
      await loadData(); // Recarregar dados para atualizar contadores

      // Manter o acordeão do fornecedor aberto após criar o produto
      setExpandedSuppliers((prev) => new Set([...prev, data.supplierId]));

      toast({
        title: "Produto criado",
        description: "Produto foi criado com sucesso.",
      });

      console.log(
        "📂 [createProduct] Acordeão mantido aberto para fornecedor:",
        data.supplierId
      );
    } else {
      console.error(
        "❌ [createProduct] Falha ao criar produto - ID não retornado"
      );
      toast({
        title: "Erro ao criar produto",
        description: "Não foi possível criar o produto. Tente novamente.",
        variant: "destructive",
      });
    }
    resetProductForm();
  };

  const updateProduct = async (id: string, data: any) => {
    console.log("✏️ [updateProduct] Atualizando produto:", id);
    const success = await updateProdutoInDb(id, data);
    if (success) {
      await loadData(); // Recarregar dados

      // Manter o acordeão do fornecedor aberto após atualizar o produto
      setExpandedSuppliers((prev) => new Set([...prev, data.supplierId]));

      toast({
        title: "Produto atualizado",
        description: "Produto foi atualizado com sucesso.",
      });

      console.log(
        "📂 [updateProduct] Acordeão mantido aberto para fornecedor:",
        data.supplierId
      );
    }
    resetProductForm();
  };

  const handleProductEdit = (product: Produto) => {
    console.log("✏️ [handleProductEdit] Editando produto:", product.name);
    setEditingProduct(product);
    setSelectedSupplierId(product.supplierId);
    setProductForm({
      name: product.name,
      purchasePrice: product.purchasePrice.toString(),
      salePrice: product.salePrice.toString(),
      color: product.color,
      sizing: product.sizing,
      stock: product.stock.toString(),
      photoUrl: product.photoUrl || "",
    });
    setIsProductDialogOpen(true);

    // Expandir o acordeão do fornecedor para mostrar as alterações
    setExpandedSuppliers((prev) => new Set([...prev, product.supplierId]));

    console.log(
      "📂 [handleProductEdit] Acordeão expandido para fornecedor:",
      product.supplierId
    );
  };

  const handleProductDelete = (product: Produto) => {
    setItemToDelete({ type: "product", id: product.id, name: product.name });
    setDeleteDialogOpen(true);
  };

  const handleStockUpdate = async (
    productId: string,
    newStock: number,
    reason: string
  ) => {
    console.log(
      "📦 [handleStockUpdate] Atualizando estoque do produto:",
      productId
    );
    console.log("📦 [handleStockUpdate] Novo estoque:", newStock);
    console.log("📦 [handleStockUpdate] Motivo:", reason);

    const success = await updateProdutoStock(productId, newStock, reason);
    if (success) {
      await loadData(); // Recarregar dados para atualizar a exibição
      console.log("✅ [handleStockUpdate] Estoque atualizado com sucesso!");
    } else {
      console.error("❌ [handleStockUpdate] Falha ao atualizar estoque");
      throw new Error("Falha ao atualizar estoque");
    }
  };

  const openProductDialog = (supplierId: string) => {
    console.log(
      "🔧 [openProductDialog] Abrindo diálogo para fornecedor:",
      supplierId
    );
    setSelectedSupplierId(supplierId);
    setEditingProduct(null);
    resetProductForm();
    setIsProductDialogOpen(true);

    // Expandir o acordeão do fornecedor para mostrar as alterações
    setExpandedSuppliers((prev) => new Set([...prev, supplierId]));

    console.log(
      "✅ [openProductDialog] selectedSupplierId definido como:",
      supplierId
    );
    console.log(
      "📂 [openProductDialog] Acordeão expandido para fornecedor:",
      supplierId
    );
  };

  const resetSupplierForm = () => {
    setSupplierForm({
      nome: "",
      contato: "",
      telefone: "",
      email: "",
      endereco: "",
    });
    setEditingSupplier(null);
    setIsSupplierDialogOpen(false);
  };

  const resetProductForm = () => {
    setProductForm({
      name: "",
      purchasePrice: "",
      salePrice: "",
      color: "",
      sizing: "",
      stock: "",
      photoUrl: "",
    });
    setEditingProduct(null);
    // Não limpar selectedSupplierId aqui - deve ser mantido
    setIsProductDialogOpen(false);
  };

  return (
    <MainLayout>
      <PageHeader
        title="Fornecedores e Produtos"
        subtitle="Gerencie seus fornecedores e catálogo de produtos"
      >
        <Dialog
          open={isSupplierDialogOpen}
          onOpenChange={setIsSupplierDialogOpen}
        >
          <DialogTrigger asChild>
            <Button onClick={resetSupplierForm}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Fornecedor
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingSupplier ? "Editar Fornecedor" : "Novo Fornecedor"}
              </DialogTitle>
              <DialogDescription>
                {editingSupplier
                  ? "Atualize as informações do fornecedor."
                  : "Cadastre um novo fornecedor no sistema."}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSupplierSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome da Empresa</Label>
                <Input
                  id="nome"
                  value={supplierForm.nome}
                  onChange={(e) =>
                    setSupplierForm((prev) => ({
                      ...prev,
                      nome: e.target.value,
                    }))
                  }
                  placeholder="Ex: Calçados Elegance"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contato">Pessoa de Contato</Label>
                <Input
                  id="contato"
                  value={supplierForm.contato}
                  onChange={(e) =>
                    setSupplierForm((prev) => ({
                      ...prev,
                      contato: e.target.value,
                    }))
                  }
                  placeholder="Ex: Maria Silva"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="telefone">Telefone (opcional)</Label>
                <Input
                  id="telefone"
                  value={supplierForm.telefone}
                  onChange={(e) =>
                    setSupplierForm((prev) => ({
                      ...prev,
                      telefone: e.target.value,
                    }))
                  }
                  placeholder="(11) 99999-9999"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email (opcional)</Label>
                <Input
                  id="email"
                  type="email"
                  value={supplierForm.email}
                  onChange={(e) =>
                    setSupplierForm((prev) => ({
                      ...prev,
                      email: e.target.value,
                    }))
                  }
                  placeholder="contato@empresa.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endereco">Endereço (opcional)</Label>
                <Input
                  id="endereco"
                  value={supplierForm.endereco}
                  onChange={(e) =>
                    setSupplierForm((prev) => ({
                      ...prev,
                      endereco: e.target.value,
                    }))
                  }
                  placeholder="Cidade, Estado"
                />
              </div>
              <div className="flex gap-2 pt-4">
                <Button type="submit" className="flex-1">
                  {editingSupplier ? "Atualizar" : "Cadastrar"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={resetSupplierForm}
                >
                  Cancelar
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </PageHeader>

      <div className="space-y-6">
        {/* Barra de pesquisa */}
        <Card>
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Pesquisar fornecedores..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Lista de fornecedores com acordeão */}
        <div className="space-y-4">
          {filteredSuppliers.map((supplier) => (
            <Card key={supplier.id}>
              <Collapsible
                open={expandedSuppliers.has(supplier.id)}
                onOpenChange={() => toggleSupplierExpansion(supplier.id)}
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <CollapsibleTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <ChevronDown
                            className={`h-4 w-4 transition-transform ${
                              expandedSuppliers.has(supplier.id)
                                ? "rotate-180"
                                : ""
                            }`}
                          />
                        </Button>
                      </CollapsibleTrigger>
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          {supplier.nome}
                          <Badge
                            variant={
                              supplier.status === "ativo"
                                ? "default"
                                : "secondary"
                            }
                          >
                            {supplier.status}
                          </Badge>
                        </CardTitle>
                        <CardDescription>
                          Contato: {supplier.contato} •{" "}
                          {supplier.produtos.length} produtos
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openProductDialog(supplier.id)}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Produto
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSupplierEdit(supplier)}
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Editar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSupplierDelete(supplier)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Excluir
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{supplier.telefone}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{supplier.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{supplier.endereco}</span>
                    </div>
                  </div>

                  <CollapsibleContent>
                    <div className="mt-4">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold">Produtos</h3>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openProductDialog(supplier.id)}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Adicionar Produto
                        </Button>
                      </div>

                      {supplier.produtos.length > 0 ? (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Foto</TableHead>
                              <TableHead>Nome</TableHead>
                              <TableHead>Cor</TableHead>
                              <TableHead>Numeração</TableHead>
                              <TableHead>Preço Compra</TableHead>
                              <TableHead>Preço Venda</TableHead>
                              <TableHead>Estoque</TableHead>
                              <TableHead>Ações</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {supplier.produtos.map((product) => (
                              <TableRow key={product.id}>
                                <TableCell>
                                  {product.photoUrl ? (
                                    <img
                                      src={product.photoUrl}
                                      alt={product.name}
                                      className="w-12 h-12 object-cover rounded"
                                    />
                                  ) : (
                                    <div className="w-12 h-12 bg-muted rounded flex items-center justify-center">
                                      <ImageIcon className="h-6 w-6 text-muted-foreground" />
                                    </div>
                                  )}
                                </TableCell>
                                <TableCell className="font-medium">
                                  {product.name}
                                </TableCell>
                                <TableCell>
                                  <Badge variant="outline">
                                    {product.color}
                                  </Badge>
                                </TableCell>
                                <TableCell>{product.sizing}</TableCell>
                                <TableCell>
                                  R$ {product.purchasePrice.toFixed(2)}
                                </TableCell>
                                <TableCell>
                                  R$ {product.salePrice.toFixed(2)}
                                </TableCell>
                                <TableCell>{product.stock}</TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    <StockAdjustment
                                      product={product}
                                      onStockUpdate={handleStockUpdate}
                                    />
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon">
                                          <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent>
                                        <DropdownMenuItem
                                          onClick={() =>
                                            handleProductEdit(product)
                                          }
                                        >
                                          <Edit className="h-4 w-4 mr-2" />
                                          Editar
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                          onClick={() =>
                                            handleProductDelete(product)
                                          }
                                          className="text-destructive"
                                        >
                                          <Trash2 className="h-4 w-4 mr-2" />
                                          Excluir
                                        </DropdownMenuItem>
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      ) : (
                        <div className="text-center py-8 text-muted-foreground">
                          <Package className="h-12 w-12 mx-auto mb-4" />
                          <p>Nenhum produto cadastrado</p>
                          <Button
                            variant="outline"
                            size="sm"
                            className="mt-2"
                            onClick={() => openProductDialog(supplier.id)}
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Adicionar Primeiro Produto
                          </Button>
                        </div>
                      )}
                    </div>
                  </CollapsibleContent>
                </CardContent>
              </Collapsible>
            </Card>
          ))}
        </div>

        {/* Dialog de produto */}
        <Dialog
          open={isProductDialogOpen}
          onOpenChange={setIsProductDialogOpen}
        >
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingProduct ? "Editar Produto" : "Novo Produto"}
              </DialogTitle>
              <DialogDescription>
                {editingProduct
                  ? "Atualize as informações do produto."
                  : `Cadastre um novo produto para o fornecedor: ${
                      suppliers.find((s) => s.id === selectedSupplierId)
                        ?.nome || "Fornecedor não encontrado"
                    }`}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleProductSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome do Produto</Label>
                  <Input
                    id="name"
                    value={productForm.name}
                    onChange={(e) =>
                      setProductForm((prev) => ({
                        ...prev,
                        name: e.target.value,
                      }))
                    }
                    placeholder="Ex: Scarpin Couro Preto"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="color">Cor</Label>
                  <Input
                    id="color"
                    value={productForm.color}
                    onChange={(e) =>
                      setProductForm((prev) => ({
                        ...prev,
                        color: e.target.value,
                      }))
                    }
                    placeholder="Ex: Preto"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="sizing">Numeração</Label>
                  <Input
                    id="sizing"
                    value={productForm.sizing}
                    onChange={(e) =>
                      setProductForm((prev) => ({
                        ...prev,
                        sizing: e.target.value,
                      }))
                    }
                    placeholder="Ex: 34-39"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="stock">Estoque Inicial</Label>
                  <Input
                    id="stock"
                    type="number"
                    min="0"
                    value={productForm.stock}
                    onChange={(e) =>
                      setProductForm((prev) => ({
                        ...prev,
                        stock: e.target.value,
                      }))
                    }
                    placeholder="0"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="purchasePrice">Preço de Compra (R$)</Label>
                  <Input
                    id="purchasePrice"
                    type="number"
                    step="0.01"
                    min="0"
                    value={productForm.purchasePrice}
                    onChange={(e) =>
                      setProductForm((prev) => ({
                        ...prev,
                        purchasePrice: e.target.value,
                      }))
                    }
                    placeholder="0,00"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="salePrice">Preço de Venda (R$)</Label>
                  <Input
                    id="salePrice"
                    type="number"
                    step="0.01"
                    min="0"
                    value={productForm.salePrice}
                    onChange={(e) =>
                      setProductForm((prev) => ({
                        ...prev,
                        salePrice: e.target.value,
                      }))
                    }
                    placeholder="0,00"
                    required
                  />
                </div>
              </div>

              <ImageUpload
                value={productForm.photoUrl}
                onChange={(url) =>
                  setProductForm((prev) => ({ ...prev, photoUrl: url }))
                }
                path="produtos"
              />

              <div className="flex gap-2 pt-4">
                <Button type="submit" className="flex-1">
                  {editingProduct ? "Atualizar" : "Cadastrar"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={resetProductForm}
                >
                  Cancelar
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Dialog de confirmação de exclusão */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
              <AlertDialogDescription>
                {itemToDelete?.type === "supplier" ? (
                  <div className="space-y-2">
                    <p>
                      Tem certeza que deseja excluir o fornecedor "
                      {itemToDelete.name}"?
                    </p>
                    {itemToDelete.productCount &&
                      itemToDelete.productCount > 0 && (
                        <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
                          <p className="text-destructive font-medium">
                            ⚠️ ATENÇÃO: Esta ação também excluirá{" "}
                            {itemToDelete.productCount} produto(s) associado(s)
                            a este fornecedor.
                          </p>
                          <p className="text-sm text-destructive/80 mt-1">
                            Esta ação não pode ser desfeita.
                          </p>
                        </div>
                      )}
                  </div>
                ) : (
                  <p>
                    Tem certeza que deseja excluir o produto "
                    {itemToDelete?.name}"? Esta ação não pode ser desfeita.
                  </p>
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {itemToDelete?.type === "supplier" &&
                itemToDelete.productCount &&
                itemToDelete.productCount > 0
                  ? "Excluir Fornecedor e Produtos"
                  : "Excluir"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {loading ? (
          <Card>
            <CardContent className="text-center py-12">
              <h3 className="text-lg font-semibold mb-2">
                Carregando dados...
              </h3>
            </CardContent>
          </Card>
        ) : filteredSuppliers.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                Nenhum fornecedor encontrado
              </h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm
                  ? "Tente ajustar sua pesquisa."
                  : "Comece cadastrando seu primeiro fornecedor."}
              </p>
              {!searchTerm && (
                <Button onClick={() => setIsSupplierDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Cadastrar Primeiro Fornecedor
                </Button>
              )}
            </CardContent>
          </Card>
        ) : null}
      </div>
    </MainLayout>
  );
}
