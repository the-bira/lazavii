"use client";

import * as React from "react";
import { Plus, Minus, Package } from "lucide-react";
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
import { useToast } from "@/hooks/use-toast";
import type { Produto } from "@/lib/types";

interface StockAdjustmentProps {
  product: Produto;
  onStockUpdate: (
    productId: string,
    newStock: number,
    reason: string
  ) => Promise<void>;
  trigger?: React.ReactNode;
}

export function StockAdjustment({
  product,
  onStockUpdate,
  trigger,
}: StockAdjustmentProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [adjustment, setAdjustment] = React.useState("");
  const [reason, setReason] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const adjustmentValue = parseInt(adjustment);
    if (isNaN(adjustmentValue) || adjustmentValue === 0) {
      toast({
        title: "Valor inválido",
        description: "Digite um valor válido para o ajuste de estoque.",
        variant: "destructive",
      });
      return;
    }

    if (!reason.trim()) {
      toast({
        title: "Motivo obrigatório",
        description: "Digite o motivo do ajuste de estoque.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const newStock = product.stock + adjustmentValue;
      await onStockUpdate(product.id, newStock, reason);

      toast({
        title: "Estoque atualizado",
        description: `Estoque ajustado de ${product.stock} para ${newStock} unidades.`,
      });

      setAdjustment("");
      setReason("");
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
      Ajustar Estoque
    </Button>
  );

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{trigger || defaultTrigger}</DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Ajustar Estoque</DialogTitle>
          <DialogDescription>
            Ajuste o estoque do produto: <strong>{product.name}</strong>
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Estoque Atual</Label>
            <div className="p-3 bg-muted rounded-md text-center">
              <span className="text-2xl font-bold">{product.stock}</span>
              <span className="text-sm text-muted-foreground ml-2">
                unidades
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="adjustment">Ajuste (+ ou -)</Label>
            <div className="flex items-center space-x-2">
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => {
                  const current = parseInt(adjustment) || 0;
                  setAdjustment((current - 1).toString());
                }}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <Input
                id="adjustment"
                type="number"
                value={adjustment}
                onChange={(e) => setAdjustment(e.target.value)}
                placeholder="0"
                className="text-center"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => {
                  const current = parseInt(adjustment) || 0;
                  setAdjustment((current + 1).toString());
                }}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Use números positivos para adicionar ou negativos para remover
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason">Motivo do Ajuste</Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Ex: Compra de estoque, venda, perda, etc."
              rows={3}
              required
            />
          </div>

          {adjustment && (
            <div className="p-3 bg-muted rounded-md">
              <div className="text-sm">
                <span className="text-muted-foreground">Novo estoque: </span>
                <span className="font-bold">
                  {product.stock + (parseInt(adjustment) || 0)} unidades
                </span>
              </div>
            </div>
          )}

          <div className="flex gap-2 pt-4">
            <Button type="submit" className="flex-1" disabled={isLoading}>
              {isLoading ? "Atualizando..." : "Atualizar Estoque"}
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
