export interface Usuario {
  id: string;
  nome: string;
  email: string;
  role: "admin" | "usuario";
  criadoEm: Date;
  atualizadoEm: Date;
}

export interface Fornecedor {
  id: string;
  nome: string;
  contato: string;
  telefone: string;
  email: string;
  endereco: string;
  produtosPrincipais: string[];
  status: "ativo" | "inativo";
  totalProdutos: number;
  criadoEm: Date;
  atualizadoEm: Date;
}

export interface Produto {
  id: string;
  name: string;
  supplierId: string;
  supplierName: string;
  purchasePrice: number;
  salePrice: number;
  color: string;
  sizing: string;
  stock: number;
  photoUrl?: string;
  status: "ativo" | "inativo";
  criadoEm: Date;
  atualizadoEm: Date;
  // Campos alternativos para compatibilidade
  nome?: string;
  fornecedorNome?: string;
  cor?: string;
  precoVenda?: number;
  custoCompra?: number;
  estoque?: number;
}

export interface ItemVenda {
  produtoId: string;
  produtoNome: string;
  fornecedorId: string;
  fornecedorNome: string;
  quantidade: number;
  precoUnitario: number;
  desconto?: number;
  precoTotal: number;
  custoUnitario: number;
  custoTotal: number;
  lucro: number;
}

export interface Venda {
  id: string;
  itens: ItemVenda[];
  cliente: string;
  dataVenda: Date;
  dataPagamento?: Date;
  dataVencimento?: Date;
  metodoPagamento: "dinheiro" | "cartao" | "pix" | "transferencia" | "fiado";
  observacoes?: string;
  desconto?: number;
  precoTotal: number;
  custoTotal: number;
  lucro: number;
  status: "concluida" | "pendente" | "pago" | "cancelada";
  statusPagamento: "pendente" | "pago" | "atrasado";
  criadoEm: Date;
  atualizadoEm: Date;
}

export interface Extorno {
  id: string;
  vendaId: string;
  motivo: string;
  valor: number;
  dataExtorno: Date;
  observacoes?: string;
  criadoEm: Date;
}

export interface Custo {
  id: string;
  descricao: string;
  categoria:
    | "operacional"
    | "marketing"
    | "administrativo"
    | "logistica"
    | "outros";
  valor: number;
  data: Date;
  dataVencimento?: Date;
  dataPagamento?: Date;
  fornecedorId?: string;
  fornecedorNome?: string;
  metodoPagamento:
    | "dinheiro"
    | "cartao"
    | "pix"
    | "transferencia"
    | "boleto"
    | "fiado";
  observacoes?: string;
  status: "pago" | "pendente" | "vencido";
  recorrente: boolean;
  criadoEm: Date;
  atualizadoEm: Date;
}

export interface Meta {
  id: string;
  titulo: string;
  descricao: string;
  tipo: "receita" | "vendas" | "lucro" | "custos";
  valorAlvo: number;
  valorAtual: number;
  dataInicio: Date;
  dataFim: Date;
  status: "ativa" | "concluida" | "pausada" | "vencida";
  criadaPorIA: boolean;
  planoIA?: PlanoMeta; // Plano gerado pela IA
  criadoEm: Date;
  atualizadoEm: Date;
}

export interface PlanoMeta {
  estrategias: EstrategiaMeta[];
  cronograma: CronogramaMeta[];
  metricas: MetricaMeta[];
  observacoes: string;
  geradoEm: Date;
}

export interface EstrategiaMeta {
  categoria:
    | "marketing"
    | "vendas"
    | "produtos"
    | "fornecedores"
    | "custos"
    | "operacional";
  titulo: string;
  descricao: string;
  prioridade: "alta" | "media" | "baixa";
  prazo: string;
  impacto: "alto" | "medio" | "baixo";
}

export interface CronogramaMeta {
  semana: number;
  atividades: string[];
  metas: string[];
  observacoes: string;
}

export interface MetricaMeta {
  nome: string;
  valorAtual: number;
  valorMeta: number;
  unidade: string;
  frequencia: "diaria" | "semanal" | "mensal";
}

export interface Insight {
  id: string;
  titulo: string;
  descricao: string;
  categoria: "vendas" | "custos" | "produtos" | "fornecedores" | "geral";
  prioridade: "alta" | "media" | "baixa";
  acao: string;
  criadoEm: Date;
  ativo: boolean;
}

export interface DashboardMetrics {
  receitaBruta: number;
  lucroLiquido: number;
  custosOperacionais: number;
  progressoMeta: number;
  vendas: Venda[];
  custos: Custo[];
  fornecedores: Fornecedor[];
}

// Registro de auditoria
export interface Log {
  id: string;
  user: string;
  action: string;
  details: string;
  timestamp: Date;
}

// Utilitário para criação de logs
export type CreateLog = Omit<Log, "id">;

// Tipos utilitários
export type CreateFornecedor = Omit<
  Fornecedor,
  "id" | "criadoEm" | "atualizadoEm"
>;
export type UpdateFornecedor = Partial<CreateFornecedor>;

export type CreateProduto = Omit<Produto, "id" | "criadoEm" | "atualizadoEm">;
export type UpdateProduto = Partial<CreateProduto>;

export type CreateVenda = Omit<Venda, "id" | "criadoEm" | "atualizadoEm">;
export type UpdateVenda = Partial<CreateVenda>;

export type CreateCusto = Omit<Custo, "id" | "criadoEm" | "atualizadoEm">;
export type UpdateCusto = Partial<CreateCusto>;

export type CreateMeta = Omit<Meta, "id" | "criadoEm" | "atualizadoEm">;
export type UpdateMeta = Partial<CreateMeta>;

export type CreateExtorno = Omit<Extorno, "id" | "criadoEm">;
