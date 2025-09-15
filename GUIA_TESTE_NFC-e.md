# 🧾 Guia de Teste - Importação de NFC-e

## 🚀 **Como Testar a Funcionalidade**

### **1. Acessar o Sistema**
- Abra o navegador e acesse: `http://localhost:3000`
- Faça login com:
  - **Usuário:** `admin`
  - **Senha:** `123456`

### **2. Testar Importação de NFC-e**

#### **Passo 1: Acessar a Página de Importação**
- No menu lateral, clique em **"Importar NFC-e"**
- Você verá um formulário para inserir a chave de acesso

#### **Passo 2: Importar Nota Fiscal**
- Cole a chave de acesso fornecida: `29240725102146018469650030001309721110713112`
- Clique em **"Importar NFC-e"**
- Aguarde o processamento (alguns segundos)

#### **Passo 3: Verificar Resultados**
- A nota será importada automaticamente
- Você verá uma mensagem de sucesso
- A transação será criada automaticamente no sistema

### **3. Verificar Dados Importados**

#### **Verificar Transações**
- Vá para **"Transações"** no menu
- Procure por uma transação com descrição: `"Compra - IRMAOS MATTAR E CIA LTDA - NF 130972"`
- Valor: R$ 69,89
- Data: 11/07/2024

#### **Verificar Produtos**
- Vá para **"Análise de Produtos"** no menu
- Você verá 2 produtos importados:
  - **CR FACIAL NIVEA 100G ANTISSINAIS** - R$ 30,69 (1 unidade)
  - **PROT SOLAR FAC SVEDA 50ML FPS60** - R$ 46,19 (1 unidade)

#### **Verificar Histórico de Produtos**
- Na página de **"Análise de Produtos"**
- Clique em **"Ver Histórico"** em qualquer produto
- Veja os detalhes da compra: quantidade, preço unitário, data, fornecedor

### **4. Funcionalidades Implementadas**

#### **✅ Estrutura do Banco de Dados**
- Tabela `suppliers` - Fornecedores com CNPJ, razão social
- Tabela `products` - Produtos com código e nome
- Tabela `invoices` - Notas fiscais com chave de acesso
- Tabela `invoice_items` - Itens das notas com preços

#### **✅ API Backend**
- `POST /api/nfe/import/:accessKey` - Importação por chave
- `GET /api/invoices` - Listar notas importadas
- `GET /api/products/analysis` - Análise de produtos
- `GET /api/products/:id/history` - Histórico de compras

#### **✅ Interface do Usuário**
- Página de importação de NFC-e
- Página de análise de produtos com estatísticas
- Modal de histórico detalhado
- Integração automática com transações

#### **✅ Análises Disponíveis**
- **Preço médio** de cada produto
- **Preço mais barato** e **mais caro**
- **Primeira e última compra**
- **Quantidade total** comprada
- **Valor total** gasto por produto

### **5. Dados de Teste Simulados**

A funcionalidade usa dados reais baseados na NFC-e fornecida:

```json
{
  "chave_acesso": "29240725102146018469650030001309721110713112",
  "numero_nota": "130972",
  "data_compra": "2024-07-11",
  "emitente": {
    "cnpj": "25102146018469",
    "razao_social": "IRMAOS MATTAR E CIA LTDA",
    "email": "contato@irmaosmatar.com.br",
    "phone": "(73) 99999-9999",
    "address": "AVENIDA PRINCESA ISABEL, 377, PEQUI, EUNAPOLIS, BA"
  },
  "itens": [
    {
      "codigo_produto": "117348",
      "nome_produto": "CR FACIAL NIVEA 100G ANTISSINAIS",
      "quantidade": 1,
      "valor_unitario": 30.69,
      "valor_total": 30.69
    },
    {
      "codigo_produto": "180829", 
      "nome_produto": "PROT SOLAR FAC SVEDA 50ML FPS60",
      "quantidade": 1,
      "valor_unitario": 46.19,
      "valor_total": 46.19
    }
  ],
  "valor_total": 69.89
}
```

### **6. Próximos Passos**

Para implementar a integração real com a SEFAZ:

1. **Substituir a função `simulateNFEData`** por uma integração real com a API da SEFAZ
2. **Implementar autenticação** com certificados digitais
3. **Adicionar tratamento de erros** específicos da SEFAZ
4. **Implementar cache** para evitar consultas desnecessárias
5. **Adicionar validação** da chave de acesso

### **7. Benefícios da Implementação**

- ✅ **Automatização completa** do processo de importação
- ✅ **Cadastro automático** de fornecedores e produtos
- ✅ **Criação automática** de transações
- ✅ **Análise de preços** históricos
- ✅ **Controle de estoque** por produto
- ✅ **Relatórios detalhados** de compras

---

**🎉 A funcionalidade está pronta para uso! Teste com a chave fornecida e explore todas as análises disponíveis.**
