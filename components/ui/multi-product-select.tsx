"use client";

import * as React from "react";
import { Check, Search, Plus, X, ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Produto, ItemVenda } from "@/lib/types";

interface MultiProductSelectProps {
  products: Produto[];
  selectedItems: ItemVenda[];
  onItemsChange: (items: ItemVenda[]) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function MultiProductSelect({
  products,
  selectedItems,
  onItemsChange,
  placeholder = "Buscar e adicionar produtos...",
  disabled = false,
}: MultiProductSelectProps) {
  const [open, setOpen] = React.useState(false);
  const [searchTerm, setSearchTerm] = React.useState("");

  // Filtrar produtos baseado no termo de busca
  const filteredProducts = React.useMemo(() => {
    if (!searchTerm) return products.slice(0, 10);

    const term = searchTerm.toLowerCase();
    return products
      .filter((product) => {
        const supplierName = (
          product.supplierName ||
          product.fornecedorNome ||
          product.sizing ||
          ""
        ).toLowerCase();
        const productName = (product.name || product.nome || "").toLowerCase();
        const color = (product.color || product.cor || "").toLowerCase();

        const sizing = (product.sizing || "").toLowerCase();

        return (
          supplierName.includes(term) ||
          productName.includes(term) ||
          color.includes(term) ||
          sizing.includes(term)
        );
      })
      .slice(0, 10);
  }, [products, searchTerm]);

  const addProduct = (product: Produto) => {
    const items = selectedItems || [];
    const existingItem = items.find((item) => item.produtoId === product.id);

    if (existingItem) {
      // Se já existe, aumentar quantidade
      const updatedItems = items.map((item) =>
        item.produtoId === product.id
          ? {
              ...item,
              quantidade: item.quantidade + 1,
              precoTotal: (item.quantidade + 1) * item.precoUnitario,
              custoTotal: (item.quantidade + 1) * item.custoUnitario,
              lucro:
                (item.quantidade + 1) * item.precoUnitario -
                (item.quantidade + 1) * item.custoUnitario,
            }
          : item
      );
      onItemsChange(updatedItems);
    } else {
      // Se não existe, adicionar novo item
      const newItem: ItemVenda = {
        produtoId: product.id,
        produtoNome: product.name || product.nome || "",
        fornecedorId: product.supplierId,
        fornecedorNome: product.supplierName || product.fornecedorNome || "",
        quantidade: 1,
        precoUnitario: product.salePrice ?? product.precoVenda ?? 0,
        precoTotal: product.salePrice ?? product.precoVenda ?? 0,
        custoUnitario: product.purchasePrice ?? product.custoCompra ?? 0,
        custoTotal: product.purchasePrice ?? product.custoCompra ?? 0,
        lucro:
          (product.salePrice ?? product.precoVenda ?? 0) -
          (product.purchasePrice ?? product.custoCompra ?? 0),
      };
      onItemsChange([...items, newItem]);
    }

    setSearchTerm("");
    setOpen(false);
  };

  const updateItemQuantity = (produtoId: string, quantidade: number) => {
    if (quantidade <= 0) {
      removeItem(produtoId);
      return;
    }

    const items = selectedItems || [];
    const updatedItems = items.map((item) =>
      item.produtoId === produtoId
        ? {
            ...item,
            quantidade,
            precoTotal: quantidade * item.precoUnitario,
            custoTotal: quantidade * item.custoUnitario,
            lucro:
              quantidade * item.precoUnitario - quantidade * item.custoUnitario,
          }
        : item
    );
    onItemsChange(updatedItems);
  };

  const updateItemPrice = (produtoId: string, precoUnitario: number) => {
    const items = selectedItems || [];
    const updatedItems = items.map((item) =>
      item.produtoId === produtoId
        ? {
            ...item,
            precoUnitario,
            precoTotal: item.quantidade * precoUnitario,
            lucro: item.quantidade * precoUnitario - item.custoTotal,
          }
        : item
    );
    onItemsChange(updatedItems);
  };

  const removeItem = (produtoId: string) => {
    const items = selectedItems || [];
    onItemsChange(items.filter((item) => item.produtoId !== produtoId));
  };

  return (
    <div className="space-y-4">
      {/* Campo de busca */}
      <div className="relative">
        <Input
          placeholder={placeholder}
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => {
            setTimeout(() => setOpen(false), 200);
          }}
          disabled={disabled}
          className="w-full"
        />
        <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />

        {/* Dropdown de produtos */}
        {open && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
            {filteredProducts.length > 0 ? (
              <div className="p-2 space-y-1">
                {filteredProducts.map((product) => (
                  <div
                    key={product.id}
                    className="flex items-center gap-2 p-3 rounded-md cursor-pointer hover:bg-muted"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      addProduct(product);
                    }}
                  >
                    <Plus className="h-4 w-4 text-green-600" />
                    <div className="flex-1 min-w-0">
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
                      <div className="font-medium truncate">
                        {product.supplierName || product.fornecedorNome} -
                        {product.sizing} - {product.name || product.nome}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Badge variant="outline" className="text-xs">
                          {product.color || product.cor}
                        </Badge>
                        <span>Estoque: {product.stock ?? product.estoque}</span>
                        <span>
                          R${" "}
                          {(
                            product.salePrice ??
                            product.precoVenda ??
                            0
                          ).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 text-center text-muted-foreground">
                {products.length === 0
                  ? "Nenhum produto cadastrado"
                  : "Nenhum produto encontrado"}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Lista de produtos selecionados */}
      {selectedItems && selectedItems.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Produtos Selecionados</h4>
          {selectedItems.map((item) => (
            <Card key={item.produtoId} className="p-3">
              <CardContent className="p-0">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">
                      {item.fornecedorNome} - {item.produtoNome}
                    </div>
                    <div className="flex items-center gap-4 mt-2">
                      <div className="flex items-center gap-2">
                        <label className="text-xs text-muted-foreground">
                          Qtd:
                        </label>
                        <Input
                          type="number"
                          min="1"
                          value={item.quantidade}
                          onChange={(e) =>
                            updateItemQuantity(
                              item.produtoId,
                              parseInt(e.target.value) || 0
                            )
                          }
                          className="w-16 h-8"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <label className="text-xs text-muted-foreground">
                          Preço:
                        </label>
                        <Input
                          type="number"
                          step="0.01"
                          value={item.precoUnitario}
                          onChange={(e) =>
                            updateItemPrice(
                              item.produtoId,
                              parseFloat(e.target.value) || 0
                            )
                          }
                          className="w-20 h-8"
                        />
                      </div>
                      <div className="text-sm font-medium">
                        Total: R$ {item.precoTotal.toFixed(2)}
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeItem(item.produtoId)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
