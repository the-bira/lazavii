import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  serverTimestamp,
} from "firebase/firestore";
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";
import { db, storage } from "./firebase";
import type {
  Fornecedor,
  Produto,
  Venda,
  Custo,
  Meta,
  PlanoMeta,
  Extorno,
  Insight,
  CreateFornecedor,
  UpdateFornecedor,
  CreateProduto,
  UpdateProduto,
  CreateVenda,
  CreateCusto,
  UpdateCusto,
  UpdateMeta,
  CreateMeta,
  CreateExtorno,
  DashboardMetrics,
  Log,
  CreateLog,
} from "./types";

// Utilitário para converter Timestamp do Firebase para Date
const timestampToDate = (timestamp: any): Date => {
  console.log("🕒 [timestampToDate] Convertendo timestamp:", {
    timestamp,
    tipo: typeof timestamp,
    temToDate: !!timestamp?.toDate,
    isDate: timestamp instanceof Date,
  });

  if (timestamp instanceof Date) {
    console.log(
      "🕒 [timestampToDate] Já é uma Date, retornando:",
      timestamp.toISOString()
    );
    return timestamp;
  }

  if (timestamp?.toDate) {
    const date = timestamp.toDate();
    console.log(
      "🕒 [timestampToDate] Convertido de Timestamp para Date:",
      date.toISOString()
    );
    return date;
  }

  const date = new Date(timestamp);
  console.log(
    "🕒 [timestampToDate] Convertido de string/number para Date:",
    date.toISOString()
  );
  return date;
};

// FORNECEDORES
export const getFornecedores = async (): Promise<Fornecedor[]> => {
  console.log("🔍 [getFornecedores] Buscando fornecedores...");

  try {
    const querySnapshot = await getDocs(collection(db, "fornecedores"));
    console.log(
      "📊 [getFornecedores] Documentos encontrados:",
      querySnapshot.docs.length
    );

    const fornecedores = querySnapshot.docs.map((doc) => {
      const data = doc.data();
      console.log("📄 [getFornecedor] Documento:", doc.id, data);

      return {
        id: doc.id,
        ...data,
        criadoEm: timestampToDate(data.criadoEm),
        atualizadoEm: timestampToDate(data.atualizadoEm),
      } as Fornecedor;
    });

    console.log(
      "✅ [getFornecedores] Fornecedores carregados:",
      fornecedores.length
    );
    return fornecedores;
  } catch (error) {
    console.error("❌ [getFornecedores] Erro ao buscar fornecedores:", error);
    return [];
  }
};

export const getFornecedor = async (id: string): Promise<Fornecedor | null> => {
  try {
    const docRef = doc(db, "fornecedores", id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        ...data,
        criadoEm: timestampToDate(data.criadoEm),
        atualizadoEm: timestampToDate(data.atualizadoEm),
      } as Fornecedor;
    }
    return null;
  } catch (error) {
    console.error("Erro ao buscar fornecedor:", error);
    return null;
  }
};

export const createFornecedor = async (
  fornecedor: CreateFornecedor
): Promise<string | null> => {
  console.log("🚀 [createFornecedor] Iniciando criação de fornecedor");
  console.log("📝 [createFornecedor] Dados recebidos:", fornecedor);

  try {
    // Validar dados obrigatórios - apenas nome e contato
    if (!fornecedor.nome || !fornecedor.contato) {
      console.error("❌ [createFornecedor] Dados obrigatórios não fornecidos");
      console.error("❌ [createFornecedor] Nome:", fornecedor.nome);
      console.error("❌ [createFornecedor] Contato:", fornecedor.contato);
      return null;
    }

    console.log("✅ [createFornecedor] Validação passou, criando documento...");

    const docData = {
      nome: fornecedor.nome,
      contato: fornecedor.contato,
      telefone: fornecedor.telefone || "",
      email: fornecedor.email || "",
      endereco: fornecedor.endereco || "",
      produtosPrincipais: fornecedor.produtosPrincipais || [],
      status: fornecedor.status || "ativo",
      totalProdutos: fornecedor.totalProdutos || 0,
      criadoEm: serverTimestamp(),
      atualizadoEm: serverTimestamp(),
    };

    console.log("📄 [createFornecedor] Dados do documento:", docData);

    const docRef = await addDoc(collection(db, "fornecedores"), docData);

    console.log("✅ [createFornecedor] Fornecedor criado com sucesso!");
    console.log("🆔 [createFornecedor] ID do documento:", docRef.id);

    return docRef.id;
  } catch (error) {
    console.error("❌ [createFornecedor] Erro ao criar fornecedor:", error);
    console.error("📝 [createFornecedor] Dados enviados:", fornecedor);
    return null;
  }
};

export const updateFornecedor = async (
  id: string,
  updates: UpdateFornecedor
): Promise<boolean> => {
  try {
    const docRef = doc(db, "fornecedores", id);
    await updateDoc(docRef, {
      ...updates,
      atualizadoEm: serverTimestamp(),
    });
    return true;
  } catch (error) {
    console.error("Erro ao atualizar fornecedor:", error);
    return false;
  }
};

export const deleteFornecedor = async (id: string): Promise<boolean> => {
  try {
    await deleteDoc(doc(db, "fornecedores", id));
    return true;
  } catch (error) {
    console.error("Erro ao deletar fornecedor:", error);
    return false;
  }
};

// PRODUTOS
export const getProdutos = async (): Promise<Produto[]> => {
  try {
    const querySnapshot = await getDocs(collection(db, "produtos"));
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      criadoEm: timestampToDate(doc.data().criadoEm),
      atualizadoEm: timestampToDate(doc.data().atualizadoEm),
    })) as Produto[];
  } catch (error) {
    console.error("Erro ao buscar produtos:", error);
    return [];
  }
};

export const createProduto = async (
  produto: CreateProduto
): Promise<string | null> => {
  console.log("🚀 [createProduto] Iniciando criação de produto");
  console.log("📝 [createProduto] Dados recebidos:", produto);

  try {
    // Validar dados obrigatórios
    if (!produto.name || !produto.supplierId || !produto.supplierName) {
      console.error("❌ [createProduto] Dados obrigatórios não fornecidos");
      console.error("❌ [createProduto] Nome:", produto.name);
      console.error("❌ [createProduto] SupplierId:", produto.supplierId);
      console.error("❌ [createProduto] SupplierName:", produto.supplierName);
      return null;
    }

    console.log("✅ [createProduto] Validação passou, criando documento...");

    const docData = {
      name: produto.name,
      supplierId: produto.supplierId,
      supplierName: produto.supplierName,
      purchasePrice: produto.purchasePrice || 0,
      salePrice: produto.salePrice || 0,
      color: produto.color || "",
      sizing: produto.sizing || "",
      stock: produto.stock || 0,
      photoUrl: produto.photoUrl || "",
      status: produto.status || "ativo",
      criadoEm: serverTimestamp(),
      atualizadoEm: serverTimestamp(),
    };

    console.log("📄 [createProduto] Dados do documento:", docData);

    const docRef = await addDoc(collection(db, "produtos"), docData);

    console.log("✅ [createProduto] Produto criado com sucesso!");
    console.log("🆔 [createProduto] ID do documento:", docRef.id);

    return docRef.id;
  } catch (error) {
    console.error("❌ [createProduto] Erro ao criar produto:", error);
    console.error("📝 [createProduto] Dados enviados:", produto);
    return null;
  }
};

export const deleteProduto = async (id: string): Promise<boolean> => {
  try {
    await deleteDoc(doc(db, "produtos", id));
    return true;
  } catch (error) {
    console.error("Erro ao deletar produto:", error);
    return false;
  }
};

export const getProdutosBySupplier = async (
  supplierId: string
): Promise<Produto[]> => {
  try {
    const q = query(collection(db, "produtos"), orderBy("supplierId", "asc"));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs
      .map((doc) => ({
        id: doc.id,
        ...doc.data(),
        criadoEm: timestampToDate(doc.data().criadoEm),
        atualizadoEm: timestampToDate(doc.data().atualizadoEm),
      }))
      .filter(
        (produto) => (produto as any).supplierId === supplierId
      ) as Produto[];
  } catch (error) {
    console.error("Erro ao buscar produtos do fornecedor:", error);
    return [];
  }
};

// Atualizar um produto existente (ex.: ajustar estoque, preço, etc.)
export const updateProduto = async (
  id: string,
  updates: UpdateProduto
): Promise<boolean> => {
  try {
    const docRef = doc(db, "produtos", id);
    await updateDoc(docRef, {
      ...updates,
      atualizadoEm: serverTimestamp(),
    });
    return true;
  } catch (error) {
    console.error("Erro ao atualizar produto:", error);
    return false;
  }
};

// VENDAS
export const getVendas = async (): Promise<Venda[]> => {
  try {
    console.log("🛒 [getVendas] Iniciando busca de vendas...");
    const q = query(collection(db, "vendas"), orderBy("dataVenda", "desc"));
    const querySnapshot = await getDocs(q);

    console.log(
      "🛒 [getVendas] Documentos encontrados:",
      querySnapshot.docs.length
    );

    const vendas = querySnapshot.docs.map((doc) => {
      const data = doc.data();
      console.log("🛒 [getVendas] Venda encontrada:", {
        id: doc.id,
        dataVenda: data.dataVenda,
        precoTotal: data.precoTotal,
        itens: data.itens?.length || 0,
      });

      return {
        id: doc.id,
        ...data,
        dataVenda: timestampToDate(data.dataVenda),
        criadoEm: timestampToDate(data.criadoEm),
        atualizadoEm: timestampToDate(data.atualizadoEm),
      } as Venda;
    });

    console.log("🛒 [getVendas] Vendas processadas:", vendas.length);
    return vendas;
  } catch (error) {
    console.error("❌ [getVendas] Erro ao buscar vendas:", error);
    return [];
  }
};

export const createVenda = async (
  venda: CreateVenda
): Promise<string | null> => {
  console.log("🛒 [createVenda] Iniciando criação de venda");
  console.log("📝 [createVenda] Dados recebidos:", venda);

  try {
    // Verificar se é uma venda com múltiplos produtos
    if (venda.itens && venda.itens.length > 0) {
      // Usar a função de múltiplos produtos
      return await createVendaMultiProduto(venda);
    }

    // Para vendas antigas (produto único), manter compatibilidade
    // Mas como não temos mais produtoId e quantidade no CreateVenda,
    // vamos redirecionar para a função de múltiplos produtos
    console.warn(
      "⚠️ [createVenda] Venda de produto único não suportada mais. Use createVendaMultiProduto."
    );
    return null;
  } catch (error) {
    console.error("❌ [createVenda] Erro ao criar venda:", error);
    return null;
  }
};

// Nova função para criar vendas com múltiplos produtos
export const createVendaMultiProduto = async (
  venda: Omit<Venda, "id" | "criadoEm" | "atualizadoEm">
): Promise<string | null> => {
  console.log(
    "🛒 [createVendaMultiProduto] Iniciando criação de venda com múltiplos produtos"
  );
  console.log("📝 [createVendaMultiProduto] Dados recebidos:", venda);

  try {
    // Verificar e atualizar estoque para cada produto
    for (const item of venda.itens) {
      const produtoRef = doc(db, "produtos", item.produtoId);
      const produtoSnap = await getDoc(produtoRef);

      if (!produtoSnap.exists()) {
        console.error(
          `❌ [createVendaMultiProduto] Produto ${item.produtoId} não encontrado`
        );
        return null;
      }

      const produtoData = produtoSnap.data() as any;
      const estoqueAtual = produtoData.stock ?? 0;

      console.log(
        `📦 [createVendaMultiProduto] Produto ${item.produtoNome} - Estoque atual: ${estoqueAtual}, Quantidade solicitada: ${item.quantidade}`
      );

      if (estoqueAtual < item.quantidade) {
        console.warn(
          `⚠️ [createVendaMultiProduto] Estoque insuficiente para produto ${item.produtoNome}`
        );
        return null;
      }

      // Atualizar o estoque
      const novoEstoque = estoqueAtual - item.quantidade;
      await updateDoc(produtoRef, {
        stock: novoEstoque,
        atualizadoEm: serverTimestamp(),
      });

      console.log(
        `✅ [createVendaMultiProduto] Estoque do produto ${item.produtoNome} atualizado para: ${novoEstoque}`
      );
    }

    // Determinar status de pagamento baseado no método
    const statusPagamento =
      venda.metodoPagamento === "fiado" ? "pendente" : "pago";
    const dataPagamento =
      venda.metodoPagamento === "fiado" ? undefined : new Date();

    // Registrar a venda
    const vendaData = {
      ...venda,
      statusPagamento,
      dataPagamento,
      criadoEm: serverTimestamp(),
      atualizadoEm: serverTimestamp(),
    };

    console.log("📄 [createVendaMultiProduto] Dados da venda:", vendaData);
    console.log(
      "📄 [createVendaMultiProduto] Data da venda original:",
      venda.dataVenda
    );
    console.log(
      "📄 [createVendaMultiProduto] Data da venda tipo:",
      typeof venda.dataVenda
    );

    const vendaRef = await addDoc(collection(db, "vendas"), vendaData);

    console.log("✅ [createVendaMultiProduto] Venda criada com sucesso!");
    console.log("🆔 [createVendaMultiProduto] ID da venda:", vendaRef.id);

    return vendaRef.id;
  } catch (error) {
    console.error("❌ [createVendaMultiProduto] Erro ao criar venda:", error);
    return null;
  }
};

// CUSTOS
export const getCustos = async (): Promise<Custo[]> => {
  try {
    const q = query(collection(db, "custos"), orderBy("data", "desc"));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      data: timestampToDate(doc.data().data),
      criadoEm: timestampToDate(doc.data().criadoEm),
      atualizadoEm: timestampToDate(doc.data().atualizadoEm),
    })) as Custo[];
  } catch (error) {
    console.error("Erro ao buscar custos:", error);
    return [];
  }
};

export const createCusto = async (
  custo: CreateCusto
): Promise<string | null> => {
  try {
    // Validar dados obrigatórios
    if (!custo.descricao || !custo.categoria || custo.valor === undefined) {
      console.error("Dados obrigatórios não fornecidos para custo");
      return null;
    }

    const docRef = await addDoc(collection(db, "custos"), {
      descricao: custo.descricao,
      categoria: custo.categoria,
      valor: custo.valor,
      data: custo.data || new Date(),
      fornecedorId: custo.fornecedorId || null,
      fornecedorNome: custo.fornecedorNome || null,
      metodoPagamento: custo.metodoPagamento || "dinheiro",
      observacoes: custo.observacoes || null,
      status: custo.status || "pago",
      recorrente: custo.recorrente || false,
      criadoEm: serverTimestamp(),
      atualizadoEm: serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    console.error("Erro ao criar custo:", error);
    console.error("Dados enviados:", custo);
    return null;
  }
};

// Atualizar custo
export const updateCusto = async (
  id: string,
  updates: UpdateCusto
): Promise<boolean> => {
  try {
    const docRef = doc(db, "custos", id);
    await updateDoc(docRef, {
      ...updates,
      atualizadoEm: serverTimestamp(),
    });
    return true;
  } catch (error) {
    console.error("Erro ao atualizar custo:", error);
    return false;
  }
};

// Deletar custo
export const deleteCusto = async (id: string): Promise<boolean> => {
  try {
    await deleteDoc(doc(db, "custos", id));
    return true;
  } catch (error) {
    console.error("Erro ao deletar custo:", error);
    return false;
  }
};

// METAS
export const getMetas = async (): Promise<Meta[]> => {
  try {
    const q = query(collection(db, "metas"), orderBy("criadoEm", "desc"));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      dataInicio: timestampToDate(doc.data().dataInicio),
      dataFim: timestampToDate(doc.data().dataFim),
      criadoEm: timestampToDate(doc.data().criadoEm),
      atualizadoEm: timestampToDate(doc.data().atualizadoEm),
    })) as Meta[];
  } catch (error) {
    console.error("Erro ao buscar metas:", error);
    return [];
  }
};

export const createMeta = async (meta: CreateMeta): Promise<string | null> => {
  try {
    // Validar dados obrigatórios
    if (!meta.titulo || !meta.tipo || meta.valorAlvo === undefined) {
      console.error("Dados obrigatórios não fornecidos para meta");
      return null;
    }

    const docRef = await addDoc(collection(db, "metas"), {
      titulo: meta.titulo,
      descricao: meta.descricao || "",
      tipo: meta.tipo,
      valorAlvo: meta.valorAlvo,
      valorAtual: meta.valorAtual || 0,
      dataInicio: meta.dataInicio || new Date(),
      dataFim: meta.dataFim,
      status: meta.status || "ativa",
      criadaPorIA: meta.criadaPorIA || false,
      criadoEm: serverTimestamp(),
      atualizadoEm: serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    console.error("Erro ao criar meta:", error);
    console.error("Dados enviados:", meta);
    return null;
  }
};

// Atualiza meta existente
export const updateMeta = async (
  id: string,
  updates: UpdateMeta
): Promise<boolean> => {
  try {
    const docRef = doc(db, "metas", id);
    await updateDoc(docRef, {
      ...updates,
      atualizadoEm: serverTimestamp(),
    });
    return true;
  } catch (error) {
    console.error("Erro ao atualizar meta:", error);
    return false;
  }
};

// Gerar plano de meta com IA
export const gerarPlanoMetaIA = async (
  meta: Meta,
  dadosNegocio: {
    vendas: Venda[];
    custos: Custo[];
    fornecedores: Fornecedor[];
    produtos: Produto[];
  }
): Promise<PlanoMeta | null> => {
  console.log(
    "🤖 [gerarPlanoMetaIA] Iniciando geração de plano para meta:",
    meta.titulo
  );

  try {
    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!apiKey) {
      console.error("❌ [gerarPlanoMetaIA] API Key do Gemini não configurada");
      return null;
    }

    // Preparar dados para análise
    const dadosResumo = {
      meta: {
        titulo: meta.titulo,
        tipo: meta.tipo,
        valorAlvo: meta.valorAlvo,
        valorAtual: meta.valorAtual,
        dataFim: meta.dataFim.toISOString().split("T")[0],
        diasRestantes: Math.ceil(
          (meta.dataFim.getTime() - new Date().getTime()) /
            (1000 * 60 * 60 * 24)
        ),
      },
      vendas: {
        total: dadosNegocio.vendas.length,
        receitaTotal: dadosNegocio.vendas.reduce(
          (sum, v) => sum + v.precoTotal,
          0
        ),
        vendasPorMes: dadosNegocio.vendas.reduce((acc, venda) => {
          const mes = venda.dataVenda.toLocaleDateString("pt-BR", {
            month: "short",
          });
          acc[mes] = (acc[mes] || 0) + venda.precoTotal;
          return acc;
        }, {} as Record<string, number>),
        produtosMaisVendidos: dadosNegocio.vendas.reduce((acc, venda) => {
          const itens = venda.itens || [];
          itens.forEach((item) => {
            acc[item.produtoNome] =
              (acc[item.produtoNome] || 0) + item.quantidade;
          });
          return acc;
        }, {} as Record<string, number>),
      },
      custos: {
        total: dadosNegocio.custos.length,
        valorTotal: dadosNegocio.custos.reduce((sum, c) => sum + c.valor, 0),
        porCategoria: dadosNegocio.custos.reduce((acc, custo) => {
          acc[custo.categoria] = (acc[custo.categoria] || 0) + custo.valor;
          return acc;
        }, {} as Record<string, number>),
      },
      fornecedores: {
        total: dadosNegocio.fornecedores.length,
        performance: dadosNegocio.vendas.reduce((acc, venda) => {
          const itens = venda.itens || [];
          itens.forEach((item) => {
            acc[item.fornecedorNome] =
              (acc[item.fornecedorNome] || 0) + item.precoTotal;
          });
          return acc;
        }, {} as Record<string, number>),
      },
      produtos: {
        total: dadosNegocio.produtos.length,
        comEstoque: dadosNegocio.produtos.filter(
          (p) => (p.stock || p.estoque || 0) > 0
        ).length,
        semEstoque: dadosNegocio.produtos.filter(
          (p) => (p.stock || p.estoque || 0) === 0
        ).length,
      },
    };

    const prompt = `Você é um consultor especializado em negócios de calçados. Analise os dados fornecidos e crie um plano estratégico detalhado para atingir a meta.

DADOS DO NEGÓCIO:
- Meta: ${dadosResumo.meta.titulo} (${dadosResumo.meta.tipo})
- Valor Alvo: R$ ${dadosResumo.meta.valorAlvo.toLocaleString("pt-BR")}
- Valor Atual: R$ ${dadosResumo.meta.valorAtual.toLocaleString("pt-BR")}
- Dias Restantes: ${dadosResumo.meta.diasRestantes} dias

VENDAS:
- Total de Vendas: ${dadosResumo.vendas.total}
- Receita Total: R$ ${dadosResumo.vendas.receitaTotal.toLocaleString("pt-BR")}
- Vendas por Mês: ${JSON.stringify(dadosResumo.vendas.vendasPorMes)}
- Produtos Mais Vendidos: ${JSON.stringify(
      dadosResumo.vendas.produtosMaisVendidos
    )}

CUSTOS:
- Total de Custos: ${dadosResumo.custos.total}
- Valor Total: R$ ${dadosResumo.custos.valorTotal.toLocaleString("pt-BR")}
- Por Categoria: ${JSON.stringify(dadosResumo.custos.porCategoria)}

FORNECEDORES:
- Total: ${dadosResumo.fornecedores.total}
- Performance: ${JSON.stringify(dadosResumo.fornecedores.performance)}

PRODUTOS:
- Total: ${dadosResumo.produtos.total}
- Com Estoque: ${dadosResumo.produtos.comEstoque}
- Sem Estoque: ${dadosResumo.produtos.semEstoque}

Crie um plano estratégico detalhado com:

1. ESTRATÉGIAS (mínimo 5, máximo 8):
   - Para cada estratégia: categoria (marketing/vendas/produtos/fornecedores/custos/operacional), título, descrição, prioridade (alta/media/baixa), prazo, impacto (alto/medio/baixo)

2. CRONOGRAMA (4 semanas):
   - Para cada semana: atividades específicas, metas semanais, observações

3. MÉTRICAS (mínimo 3, máximo 5):
   - Para cada métrica: nome, valor atual, valor meta, unidade, frequência (diaria/semanal/mensal)

4. OBSERVAÇÕES GERAIS:
   - Insights importantes e recomendações adicionais

Responda APENAS com um JSON válido no seguinte formato:
{
  "estrategias": [
    {
      "categoria": "marketing",
      "titulo": "Campanha Digital",
      "descricao": "Implementar campanhas no Instagram e Facebook focadas em produtos premium",
      "prioridade": "alta",
      "prazo": "2 semanas",
      "impacto": "alto"
    }
  ],
  "cronograma": [
    {
      "semana": 1,
      "atividades": ["Lançar campanha digital", "Otimizar estoque"],
      "metas": ["Aumentar vendas em 15%", "Reduzir custos em 5%"],
      "observacoes": "Foco em produtos com maior margem"
    }
  ],
  "metricas": [
    {
      "nome": "Vendas Diárias",
      "valorAtual": 0,
      "valorMeta": 5,
      "unidade": "vendas",
      "frequencia": "diaria"
    }
  ],
  "observacoes": "Foque em produtos com maior margem de lucro e otimize o mix de produtos."
}`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 2048,
          },
        }),
      }
    );

    if (!response.ok) {
      console.error(
        "❌ [gerarPlanoMetaIA] Erro na API do Gemini:",
        response.status
      );
      return null;
    }

    const data = await response.json();
    const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!responseText) {
      console.error("❌ [gerarPlanoMetaIA] Resposta vazia da API");
      return null;
    }

    // Extrair JSON da resposta
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error(
        "❌ [gerarPlanoMetaIA] Não foi possível extrair JSON da resposta"
      );
      return null;
    }

    const planoData = JSON.parse(jsonMatch[0]);

    const plano: PlanoMeta = {
      estrategias: planoData.estrategias || [],
      cronograma: planoData.cronograma || [],
      metricas: planoData.metricas || [],
      observacoes: planoData.observacoes || "",
      geradoEm: new Date(),
    };

    console.log("✅ [gerarPlanoMetaIA] Plano gerado com sucesso!");
    return plano;
  } catch (error) {
    console.error("❌ [gerarPlanoMetaIA] Erro ao gerar plano:", error);
    return null;
  }
};

// INSIGHTS
export const getInsights = async (): Promise<Insight[]> => {
  try {
    const q = query(collection(db, "insights"), orderBy("criadoEm", "desc"));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      criadoEm: timestampToDate(doc.data().criadoEm),
    })) as Insight[];
  } catch (error) {
    console.error("Erro ao buscar insights:", error);
    return [];
  }
};

export const createInsight = async (
  insight: Omit<Insight, "id" | "criadoEm">
): Promise<string | null> => {
  try {
    const docRef = await addDoc(collection(db, "insights"), {
      ...insight,
      criadoEm: serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    console.error("Erro ao criar insight:", error);
    return null;
  }
};

export const updateInsight = async (
  id: string,
  updates: Partial<Insight>
): Promise<boolean> => {
  try {
    const docRef = doc(db, "insights", id);
    await updateDoc(docRef, {
      ...updates,
      atualizadoEm: serverTimestamp(),
    });
    return true;
  } catch (error) {
    console.error("Erro ao atualizar insight:", error);
    return false;
  }
};

export const deleteInsight = async (id: string): Promise<boolean> => {
  try {
    const docRef = doc(db, "insights", id);
    await deleteDoc(docRef);
    return true;
  } catch (error) {
    console.error("Erro ao deletar insight:", error);
    return false;
  }
};

// Gerar insights com IA e salvar no banco
export const gerarInsightsIA = async (
  metrics: DashboardMetrics
): Promise<Insight[]> => {
  console.log("🤖 [gerarInsightsIA] Iniciando geração de insights...");

  try {
    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!apiKey) {
      console.error("❌ [gerarInsightsIA] API Key do Gemini não configurada");
      return [];
    }

    // Preparar dados para análise
    const dadosResumo = {
      totalVendas: metrics.vendas.length,
      receitaBruta: metrics.receitaBruta,
      custosOperacionais: metrics.custosOperacionais,
      lucroLiquido: metrics.lucroLiquido,
      fornecedores: metrics.fornecedores.length,
      vendasPorMes: metrics.vendas.reduce((acc, venda) => {
        const mes = venda.dataVenda.toLocaleDateString("pt-BR", {
          month: "short",
        });
        acc[mes] = (acc[mes] || 0) + venda.precoTotal;
        return acc;
      }, {} as Record<string, number>),
      produtosMaisVendidos: metrics.vendas.reduce((acc, venda) => {
        const itens = venda.itens || [];
        itens.forEach((item) => {
          acc[item.produtoNome] =
            (acc[item.produtoNome] || 0) + item.quantidade;
        });
        return acc;
      }, {} as Record<string, number>),
    };

    const prompt = `Você é um consultor especializado em negócios de calçados. Analise os dados fornecidos e gere insights práticos e acionáveis.

DADOS DO NEGÓCIO:
- Total de Vendas: ${dadosResumo.totalVendas}
- Receita Bruta: R$ ${dadosResumo.receitaBruta.toFixed(2)}
- Custos Operacionais: R$ ${dadosResumo.custosOperacionais.toFixed(2)}
- Lucro Líquido: R$ ${dadosResumo.lucroLiquido.toFixed(2)}
- Número de Fornecedores: ${dadosResumo.fornecedores}
- Vendas por Mês: ${JSON.stringify(dadosResumo.vendasPorMes)}
- Produtos Mais Vendidos: ${JSON.stringify(dadosResumo.produtosMaisVendidos)}

Gere 5-6 insights específicos, práticos e acionáveis para melhorar o negócio. Para cada insight, forneça:
- titulo: Título curto e direto
- descricao: Descrição detalhada do insight
- categoria: vendas/custos/produtos/fornecedores/geral
- prioridade: alta/media/baixa
- acao: Ação específica a ser tomada

Responda APENAS com um JSON válido no seguinte formato:
{
  "insights": [
    {
      "titulo": "Aumentar Margem de Lucro",
      "descricao": "Sua margem de lucro está baixa. Foque em produtos premium e negocie melhores preços com fornecedores.",
      "categoria": "vendas",
      "prioridade": "alta",
      "acao": "Implementar estratégia de upselling e negociar descontos por volume com fornecedores"
    }
  ]
}`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 2048,
          },
        }),
      }
    );

    if (!response.ok) {
      console.error(
        "❌ [gerarInsightsIA] Erro na API do Gemini:",
        response.status
      );
      return [];
    }

    const data = await response.json();
    const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!responseText) {
      console.error("❌ [gerarInsightsIA] Resposta vazia da API");
      return [];
    }

    // Extrair JSON da resposta
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error(
        "❌ [gerarInsightsIA] Não foi possível extrair JSON da resposta"
      );
      return [];
    }

    const insightsData = JSON.parse(jsonMatch[0]);
    const insights: Insight[] = [];

    // Desativar insights anteriores
    const insightsAnteriores = await getInsights();
    for (const insight of insightsAnteriores) {
      await updateInsight(insight.id, { ativo: false });
    }

    // Criar novos insights
    for (const insightData of insightsData.insights || []) {
      const insightId = await createInsight({
        titulo: insightData.titulo,
        descricao: insightData.descricao,
        categoria: insightData.categoria,
        prioridade: insightData.prioridade,
        acao: insightData.acao,
        ativo: true,
      });

      if (insightId) {
        insights.push({
          id: insightId,
          ...insightData,
          criadoEm: new Date(),
          ativo: true,
        });
      }
    }

    console.log("✅ [gerarInsightsIA] Insights gerados e salvos com sucesso!");
    return insights;
  } catch (error) {
    console.error("❌ [gerarInsightsIA] Erro ao gerar insights:", error);
    return [];
  }
};

// DASHBOARD METRICS
export const getDashboardMetrics = async (): Promise<DashboardMetrics> => {
  try {
    console.log("📊 [getDashboardMetrics] Iniciando busca de métricas...");

    const [vendas, custos, fornecedores] = await Promise.all([
      getVendas(),
      getCustos(),
      getFornecedores(),
    ]);

    console.log("📊 [getDashboardMetrics] Dados carregados:", {
      vendas: vendas.length,
      custos: custos.length,
      fornecedores: fornecedores.length,
    });

    // Log detalhado das vendas
    vendas.forEach((venda, index) => {
      console.log(`📊 [getDashboardMetrics] Venda ${index + 1}:`, {
        id: venda.id,
        dataVenda: venda.dataVenda.toISOString(),
        precoTotal: venda.precoTotal,
        itens: venda.itens?.length || 0,
      });
    });

    const receitaBruta = vendas.reduce(
      (total, venda) => total + venda.precoTotal,
      0
    );
    const custosOperacionais = custos.reduce(
      (total, custo) => total + custo.valor,
      0
    );
    const lucroLiquido = receitaBruta - custosOperacionais;

    console.log("📊 [getDashboardMetrics] Cálculos:", {
      receitaBruta,
      custosOperacionais,
      lucroLiquido,
    });

    // Buscar meta ativa para calcular progresso
    const metas = await getMetas();
    const metaAtiva = metas.find((meta) => meta.status === "ativa");
    const progressoMeta = metaAtiva
      ? (metaAtiva.valorAtual / metaAtiva.valorAlvo) * 100
      : 0;

    return {
      receitaBruta,
      lucroLiquido,
      custosOperacionais,
      progressoMeta,
      vendas,
      custos,
      fornecedores,
    };
  } catch (error) {
    console.error("Erro ao buscar métricas do dashboard:", error);
    return {
      receitaBruta: 0,
      lucroLiquido: 0,
      custosOperacionais: 0,
      progressoMeta: 0,
      vendas: [],
      custos: [],
      fornecedores: [],
    };
  }
};

// LOGS
/**
 * Busca todos os registros de log ordenados por data de criação (mais recentes primeiro).
 */
export const getLogs = async (): Promise<Log[]> => {
  try {
    const q = query(collection(db, "logs"), orderBy("timestamp", "desc"));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      timestamp: timestampToDate(doc.data().timestamp),
    })) as Log[];
  } catch (error) {
    console.error("Erro ao buscar logs:", error);
    return [];
  }
};

/**
 * Cria um novo registro de log. Os logs são úteis para auditoria e histórico de ações.
 */
export const createLog = async (log: CreateLog): Promise<string | null> => {
  try {
    const docRef = await addDoc(collection(db, "logs"), {
      ...log,
      timestamp: serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    console.error("Erro ao criar log:", error);
    return null;
  }
};

// EXTORNOS
export const createExtorno = async (
  extorno: CreateExtorno
): Promise<string | null> => {
  console.log("💸 [createExtorno] Iniciando criação de extorno");
  console.log("📝 [createExtorno] Dados recebidos:", extorno);

  try {
    // Primeiro, reverter o estoque do produto
    const vendaRef = doc(db, "vendas", extorno.vendaId);
    const vendaSnap = await getDoc(vendaRef);

    if (!vendaSnap.exists()) {
      console.error("❌ [createExtorno] Venda não encontrada");
      return null;
    }

    const vendaData = vendaSnap.data() as any;
    const produtoRef = doc(db, "produtos", vendaData.produtoId);
    const produtoSnap = await getDoc(produtoRef);

    if (produtoSnap.exists()) {
      const produtoData = produtoSnap.data() as any;
      const estoqueAtual = produtoData.stock ?? 0;
      const novoEstoque = estoqueAtual + vendaData.quantidade;

      await updateDoc(produtoRef, {
        stock: novoEstoque,
        atualizadoEm: serverTimestamp(),
      });

      console.log("📦 [createExtorno] Estoque revertido para:", novoEstoque);
    }

    // Atualizar status da venda para cancelada
    await updateDoc(vendaRef, {
      status: "cancelada",
      atualizadoEm: serverTimestamp(),
    });

    // Criar o extorno
    const extornoRef = await addDoc(collection(db, "extornos"), {
      ...extorno,
      criadoEm: serverTimestamp(),
    });

    console.log("✅ [createExtorno] Extorno criado com sucesso!");
    console.log("🆔 [createExtorno] ID do extorno:", extornoRef.id);

    return extornoRef.id;
  } catch (error) {
    console.error("❌ [createExtorno] Erro ao criar extorno:", error);
    return null;
  }
};

export const confirmarPagamento = async (vendaId: string): Promise<boolean> => {
  console.log(
    "💰 [confirmarPagamento] Confirmando pagamento da venda:",
    vendaId
  );

  try {
    const vendaRef = doc(db, "vendas", vendaId);
    await updateDoc(vendaRef, {
      statusPagamento: "pago",
      dataPagamento: new Date(),
      atualizadoEm: serverTimestamp(),
    });

    console.log("✅ [confirmarPagamento] Pagamento confirmado com sucesso!");
    return true;
  } catch (error) {
    console.error(
      "❌ [confirmarPagamento] Erro ao confirmar pagamento:",
      error
    );
    return false;
  }
};

export const getExtornos = async (): Promise<Extorno[]> => {
  try {
    const q = query(collection(db, "extornos"), orderBy("dataExtorno", "desc"));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      dataExtorno: timestampToDate(doc.data().dataExtorno),
      criadoEm: timestampToDate(doc.data().criadoEm),
    })) as Extorno[];
  } catch (error) {
    console.error("Erro ao buscar extornos:", error);
    return [];
  }
};

export const updateProdutoStock = async (
  productId: string,
  newStock: number,
  reason: string
): Promise<boolean> => {
  console.log(
    "📦 [updateProdutoStock] Atualizando estoque do produto:",
    productId
  );
  console.log("📦 [updateProdutoStock] Novo estoque:", newStock);
  console.log("📦 [updateProdutoStock] Motivo:", reason);

  try {
    const produtoRef = doc(db, "produtos", productId);
    await updateDoc(produtoRef, {
      stock: newStock,
      atualizadoEm: serverTimestamp(),
    });

    // Criar log do ajuste de estoque
    await createLog({
      user: "system",
      action: "ajuste_estoque",
      details: `Estoque ajustado para ${newStock} unidades. Motivo: ${reason}. Produto: ${productId}`,
      timestamp: new Date(),
    });

    console.log("✅ [updateProdutoStock] Estoque atualizado com sucesso!");
    return true;
  } catch (error) {
    console.error("❌ [updateProdutoStock] Erro ao atualizar estoque:", error);
    return false;
  }
};

// STORAGE - UPLOAD DE IMAGENS
/**
 * Faz upload de uma imagem para o Firebase Storage
 */
export const uploadImage = async (
  file: File,
  path: string = "produtos"
): Promise<string | null> => {
  try {
    if (!storage) {
      console.error("Firebase Storage não está configurado");
      return null;
    }

    // Gerar nome único para o arquivo
    const timestamp = Date.now();
    const fileName = `${timestamp}_${file.name}`;
    const storageRef = ref(storage, `${path}/${fileName}`);

    // Fazer upload do arquivo
    const snapshot = await uploadBytes(storageRef, file);

    // Obter URL de download
    const downloadURL = await getDownloadURL(snapshot.ref);

    return downloadURL;
  } catch (error) {
    console.error("Erro ao fazer upload da imagem:", error);
    return null;
  }
};

/**
 * Remove uma imagem do Firebase Storage
 */
export const deleteImage = async (url: string): Promise<boolean> => {
  try {
    if (!storage) {
      console.error("Firebase Storage não está configurado");
      return false;
    }

    // Extrair o caminho do arquivo da URL
    const urlParts = url.split("/");
    const fileName = urlParts[urlParts.length - 1].split("?")[0];
    const path = urlParts[urlParts.length - 2];

    const imageRef = ref(storage, `${path}/${fileName}`);
    await deleteObject(imageRef);

    return true;
  } catch (error) {
    console.error("Erro ao deletar imagem:", error);
    return false;
  }
};
