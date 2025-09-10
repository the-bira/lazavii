"use client";

import * as React from "react";
import { Check, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Produto } from "@/lib/types";

interface ProductAutocompleteProps {
  products: Produto[];
  value?: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function ProductAutocomplete({
  products,
  value,
  onValueChange,
  placeholder = "Buscar produto...",
  disabled = false,
}: ProductAutocompleteProps) {
  const [open, setOpen] = React.useState(false);
  const [searchTerm, setSearchTerm] = React.useState("");

  // Filtrar produtos baseado no termo de busca
  const filteredProducts = React.useMemo(() => {
    console.log(
      "🔍 [ProductAutocomplete] Produtos disponíveis:",
      products.length
    );
    console.log("🔍 [ProductAutocomplete] Termo de busca:", searchTerm);

    if (!searchTerm) return products.slice(0, 10); // Mostrar apenas os primeiros 10 quando não há busca

    const term = searchTerm.toLowerCase();
    const filtered = products
      .filter((product) => {
        const supplierName = (
          product.supplierName ||
          product.fornecedorNome ||
          ""
        ).toLowerCase();
        const productName = (product.name || product.nome || "").toLowerCase();
        const color = (product.color || product.cor || "").toLowerCase();

        return (
          supplierName.includes(term) ||
          productName.includes(term) ||
          color.includes(term)
        );
      })
      .slice(0, 10); // Limitar a 10 resultados

    console.log(
      "🔍 [ProductAutocomplete] Produtos filtrados:",
      filtered.length
    );
    return filtered;
  }, [products, searchTerm]);

  // Produto selecionado
  const selectedProduct = products.find((product) => product.id === value);

  const handleSelect = (productId: string) => {
    console.log("🔍 [ProductAutocomplete] Produto selecionado:", productId);
    onValueChange(productId);
    setOpen(false);
    setSearchTerm("");
  };

  const formatProductDisplay = (product: Produto) => {
    const supplierName = product.supplierName || product.fornecedorNome || "";
    const productName = product.name || product.nome || "";
    const color = product.color || product.cor || "";
    const stock = product.stock ?? product.estoque ?? 0;
    const salePrice = product.salePrice ?? product.precoVenda ?? 0;

    return `${supplierName} - ${productName} (${color}) - Estoque: ${stock} - R$ ${salePrice.toFixed(
      2
    )}`;
  };

  // Atualizar searchTerm quando um produto é selecionado
  React.useEffect(() => {
    if (selectedProduct) {
      setSearchTerm(formatProductDisplay(selectedProduct));
    }
  }, [selectedProduct]);

  return (
    <div className="space-y-2 relative">
      <div className="relative">
        <Input
          placeholder={placeholder}
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setOpen(true);
            // Se limpar o campo, limpar a seleção
            if (e.target.value === "") {
              onValueChange("");
            }
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => {
            // Delay para permitir clique nos itens
            setTimeout(() => setOpen(false), 200);
          }}
          disabled={disabled}
          className="w-full"
        />
        <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      </div>

      {open && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
          {filteredProducts.length > 0 ? (
            <div className="p-2 space-y-1">
              {filteredProducts.map((product) => (
                <div
                  key={product.id}
                  className={cn(
                    "flex items-center gap-2 p-3 rounded-md cursor-pointer hover:bg-muted",
                    value === product.id && "bg-muted"
                  )}
                  onMouseDown={(e) => {
                    e.preventDefault(); // Prevenir onBlur do input
                    handleSelect(product.id);
                  }}
                >
                  <Check
                    className={cn(
                      "h-4 w-4",
                      value === product.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">
                      {product.supplierName || product.fornecedorNome} -{" "}
                      {product.name || product.nome}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Badge variant="outline" className="text-xs">
                        {product.color || product.cor}
                      </Badge>
                      <span>Estoque: {product.stock ?? product.estoque}</span>
                      <span>
                        R${" "}
                        {(product.salePrice ?? product.precoVenda ?? 0).toFixed(
                          2
                        )}
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
  );
}
