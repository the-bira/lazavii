"use client";

import { usePathname } from "next/navigation";
import { useAuth } from "@/components/auth-provider";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LogOut, User } from "lucide-react";
import { useRouter } from "next/navigation";

const getPageTitle = (pathname: string) => {
  const routes: Record<string, string> = {
    "/dashboard": "Dashboard",
    "/fornecedores": "Fornecedores",
    "/vendas": "Vendas",
    "/custos": "Custos",
    "/metas": "Metas",
    "/relatorios": "Relatórios",
    "/logs": "Logs",
  };
  return routes[pathname] || "Página";
};

const getBreadcrumbItems = (pathname: string) => {
  const items = [{ label: "Dashboard", href: "/dashboard" }];

  if (pathname !== "/dashboard") {
    const currentPage = getPageTitle(pathname);
    items.push({ label: currentPage, href: pathname });
  }

  return items;
};

export function AppHeader() {
  const pathname = usePathname();
  const { user, signOut } = useAuth();
  const router = useRouter();

  const handleSignOut = () => {
    signOut();
    router.push("/login");
  };

  const breadcrumbItems = getBreadcrumbItems(pathname);
  const currentPage = getPageTitle(pathname);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4">
        {/* Breadcrumb */}
        <Breadcrumb>
          <BreadcrumbList>
            {breadcrumbItems.map((item, index) => (
              <div key={item.href} className="flex items-center">
                <BreadcrumbItem>
                  {index === breadcrumbItems.length - 1 ? (
                    <BreadcrumbPage className="font-medium">
                      {item.label}
                    </BreadcrumbPage>
                  ) : (
                    <BreadcrumbLink
                      href={item.href}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      {item.label}
                    </BreadcrumbLink>
                  )}
                </BreadcrumbItem>
                {index < breadcrumbItems.length - 1 && (
                  <BreadcrumbSeparator className="mx-2" />
                )}
              </div>
            ))}
          </BreadcrumbList>
        </Breadcrumb>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-10 w-10 rounded-full">
              <Avatar className="h-10 w-10">
                <AvatarImage
                  src={(user as any)?.photoURL ?? ""}
                  alt={user?.name ?? ""}
                />
                <AvatarFallback>
                  <User className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">
                  {user?.name || "Usuário"}
                </p>
                <p className="text-xs leading-none text-muted-foreground">
                  {user?.email}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>Sair</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
