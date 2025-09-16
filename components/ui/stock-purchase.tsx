"use client";

import * as React from "react";
import { ImageIcon, Package, Plus, Search } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import type { Produto } from "@/lib/types";

interface StockPurchaseProps {
  products: Produto[];
  onStockUpdate: (
    productId: string,
    newStock: number,
    reason: string,
    cost: number
  ) => Promise<void>;
  trigger?: React.ReactNode;
}

export function StockPurchase({
  products,
  onStockUpdate,
  trigger,
}: StockPurchaseProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [selectedProduct, setSelectedProduct] = React.useState<Produto | null>(
    null
  );
  const [quantity, setQuantity] = React.useState("");
  const [cost, setCost] = React.useState("");
  const [reason, setReason] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const { toast } = useToast();

  // Filtrar produtos baseado no termo de busca
  const filteredProducts = React.useMemo(() => {
    if (!searchTerm) return products; // Mostrar todos os produtos quando não há busca

    const term = searchTerm.toLowerCase();
    return products.filter((product) => {
      const pictureUrl = product.photoUrl?.toLowerCase() || "";
      const supplierName = product.supplierName?.toLowerCase() || "";
      const productName = product.name?.toLowerCase() || "";
      const color = product.color?.toLowerCase() || "";
      const sizing = product.sizing?.toLowerCase() || "";

      return (
        pictureUrl.includes(term) ||
        supplierName.includes(term) ||
        productName.includes(term) ||
        color.includes(term) ||
        sizing.includes(term)
      );
    });
  }, [products, searchTerm]);

  // Paginação
  const [currentPage, setCurrentPage] = React.useState(1);
  const itemsPerPage = 10;
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedProducts = filteredProducts.slice(startIndex, endIndex);

  // Reset página quando termo de busca muda
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const handleProductSelect = (product: Produto) => {
    setSelectedProduct(product);
    setCost(product.purchasePrice.toString());
    setQuantity("");
    setReason("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedProduct) {
      toast({
        title: "Produto não selecionado",
        description: "Selecione um produto para adicionar ao estoque.",
        variant: "destructive",
      });
      return;
    }

    const quantityValue = parseInt(quantity);
    const costValue = parseFloat(cost);

    if (isNaN(quantityValue) || quantityValue <= 0) {
      toast({
        title: "Quantidade inválida",
        description: "Digite uma quantidade válida maior que zero.",
        variant: "destructive",
      });
      return;
    }

    if (isNaN(costValue) || costValue <= 0) {
      toast({
        title: "Custo inválido",
        description: "Digite um custo válido maior que zero.",
        variant: "destructive",
      });
      return;
    }

    if (!reason.trim()) {
      toast({
        title: "Motivo obrigatório",
        description: "Digite o motivo da compra de estoque.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const newStock = selectedProduct.stock + quantityValue;
      await onStockUpdate(selectedProduct.id, newStock, reason, costValue);

      toast({
        title: "Estoque atualizado",
        description: `${quantityValue} unidades adicionadas ao estoque de ${selectedProduct.name}.`,
      });

      // Reset form
      setSelectedProduct(null);
      setQuantity("");
      setCost("");
      setReason("");
      setSearchTerm("");
      setIsOpen(false);
    } catch (error) {
      toast({
        title: "Erro ao atualizar estoque",
        description: "Não foi possível atualizar o estoque. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const defaultTrigger = (
    <Button variant="outline" size="sm">
      <Package className="h-4 w-4 mr-2" />
      Comprar Estoque
    </Button>
  );

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{trigger || defaultTrigger}</DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Comprar Estoque</DialogTitle>
          <DialogDescription>
            Adicione produtos ao estoque registrando uma compra
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Busca de produtos */}
          <div className="space-y-2">
            <Label>Buscar Produto</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Digite para buscar produto..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Lista de produtos */}
          <div className="border rounded-md">
            {filteredProducts.length > 0 ? (
              <div className="max-h-80 overflow-y-auto">
                <div className="p-2 space-y-2">
                  {paginatedProducts.map((product) => (
                    <div
                      key={product.id}
                      className={`p-3 border rounded-md cursor-pointer hover:bg-muted ${
                        selectedProduct?.id === product.id
                          ? "bg-muted border-primary"
                          : ""
                      }`}
                      onClick={() => handleProductSelect(product)}
                    >
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
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">
                            {product.supplierName} - {product.name} -{" "}
                            {product.sizing}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Badge variant="outline" className="text-xs">
                              {product.color}
                            </Badge>
                            <span>Estoque: {product.stock}</span>
                            <span>R$ {product.purchasePrice.toFixed(2)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Paginação */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between p-3 border-t">
                    <div className="text-sm text-muted-foreground">
                      Mostrando {startIndex + 1} a{" "}
                      {Math.min(endIndex, filteredProducts.length)} de{" "}
                      {filteredProducts.length} produtos
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setCurrentPage((prev) => Math.max(1, prev - 1))
                        }
                        disabled={currentPage === 1}
                      >
                        Anterior
                      </Button>
                      <span className="text-sm">
                        Página {currentPage} de {totalPages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setCurrentPage((prev) =>
                            Math.min(totalPages, prev + 1)
                          )
                        }
                        disabled={currentPage === totalPages}
                      >
                        Próxima
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-4 text-center text-muted-foreground">
                {searchTerm
                  ? "Nenhum produto encontrado"
                  : "Nenhum produto cadastrado"}
              </div>
            )}
          </div>

          {/* Produto selecionado */}
          {selectedProduct && (
            <div className="p-4 bg-muted rounded-md">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">
                    {selectedProduct.supplierName} - {selectedProduct.name}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Badge variant="outline" className="text-xs">
                      {selectedProduct.color}
                    </Badge>
                    <span>Estoque atual: {selectedProduct.stock}</span>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedProduct(null)}
                >
                  ✕
                </Button>
              </div>
            </div>
          )}

          {/* Campos de entrada */}
          {selectedProduct && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="quantity">Quantidade</Label>
                  <Input
                    id="quantity"
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    placeholder="0"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cost">Custo Unitário (R$)</Label>
                  <Input
                    id="cost"
                    type="number"
                    step="0.01"
                    min="0"
                    value={cost}
                    onChange={(e) => setCost(e.target.value)}
                    placeholder="0,00"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="reason">Motivo da Compra</Label>
                <Textarea
                  id="reason"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Ex: Compra de estoque, reposição, etc."
                  rows={3}
                  required
                />
              </div>

              {quantity && cost && (
                <div className="p-3 bg-muted rounded-md">
                  <div className="text-sm space-y-1">
                    <div>
                      <span className="text-muted-foreground">
                        Novo estoque:{" "}
                      </span>
                      <span className="font-bold">
                        {selectedProduct.stock + (parseInt(quantity) || 0)}{" "}
                        unidades
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">
                        Custo total:{" "}
                      </span>
                      <span className="font-bold">
                        R${" "}
                        {(
                          (parseInt(quantity) || 0) * (parseFloat(cost) || 0)
                        ).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          <div className="flex gap-2 pt-4">
            <Button
              type="submit"
              className="flex-1"
              disabled={isLoading || !selectedProduct}
            >
              {isLoading ? "Processando..." : "Adicionar ao Estoque"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
            >
              Cancelar
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
