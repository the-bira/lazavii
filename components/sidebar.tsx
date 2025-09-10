"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Sparkles,
  LayoutDashboard,
  Users,
  ShoppingCart,
  DollarSign,
  Target,
  FileText,
  History,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

const navigation = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    name: "Fornecedores",
    href: "/fornecedores",
    icon: Users,
  },
  {
    name: "Registrar Venda",
    href: "/vendas",
    icon: ShoppingCart,
  },
  {
    name: "Custos",
    href: "/custos",
    icon: DollarSign,
  },
  {
    name: "Metas",
    href: "/metas",
    icon: Target,
  },
  {
    name: "Relatórios",
    href: "/relatorios",
    icon: FileText,
  },
  {
    name: "Logs",
    href: "/logs",
    icon: History,
  },
];

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2">
          <Sparkles className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-xl font-bold text-primary">
              Lazavii Financials
            </h1>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigation.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <SidebarMenuItem key={item.name}>
                    <SidebarMenuButton asChild isActive={isActive}>
                      <Link href={item.href}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.name}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <div className="px-2 py-1 text-sm text-muted-foreground">
              Lazavii Financials v1.0
            </div>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
