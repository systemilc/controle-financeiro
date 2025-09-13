const XLSX = require('xlsx');

// Dados dos produtos com nomes similares mas códigos diferentes
const produtos = [
  { codigo: 'PROD001', nome: 'Notebook Dell Inspiron 15', preco: 2500.00, categoria: 'Eletrônicos' },
  { codigo: 'PROD002', nome: 'Notebook Dell Inspiron 14', preco: 2200.00, categoria: 'Eletrônicos' },
  { codigo: 'PROD003', nome: 'Notebook Dell Latitude 15', preco: 2800.00, categoria: 'Eletrônicos' },
  { codigo: 'PROD004', nome: 'Mouse Logitech M100', preco: 25.00, categoria: 'Acessórios' },
  { codigo: 'PROD005', nome: 'Mouse Logitech M200', preco: 35.00, categoria: 'Acessórios' },
  { codigo: 'PROD006', nome: 'Mouse Logitech M300', preco: 45.00, categoria: 'Acessórios' },
  { codigo: 'PROD007', nome: 'Teclado Microsoft Basic', preco: 80.00, categoria: 'Acessórios' },
  { codigo: 'PROD008', nome: 'Teclado Microsoft Wireless', preco: 120.00, categoria: 'Acessórios' },
  { codigo: 'PROD009', nome: 'Teclado Microsoft Ergonômico', preco: 150.00, categoria: 'Acessórios' },
  { codigo: 'PROD010', nome: 'Monitor Samsung 24"', preco: 800.00, categoria: 'Monitores' },
  { codigo: 'PROD011', nome: 'Monitor Samsung 27"', preco: 1200.00, categoria: 'Monitores' },
  { codigo: 'PROD012', nome: 'Monitor Samsung 32"', preco: 1800.00, categoria: 'Monitores' },
  { codigo: 'PROD013', nome: 'Smartphone iPhone 13', preco: 4000.00, categoria: 'Smartphones' },
  { codigo: 'PROD014', nome: 'Smartphone iPhone 14', preco: 4500.00, categoria: 'Smartphones' },
  { codigo: 'PROD015', nome: 'Smartphone iPhone 15', preco: 5000.00, categoria: 'Smartphones' },
  { codigo: 'PROD016', nome: 'Tablet iPad Air', preco: 3000.00, categoria: 'Tablets' },
  { codigo: 'PROD017', nome: 'Tablet iPad Pro', preco: 4500.00, categoria: 'Tablets' },
  { codigo: 'PROD018', nome: 'Tablet iPad Mini', preco: 2500.00, categoria: 'Tablets' },
  { codigo: 'PROD019', nome: 'Fone JBL Tune 500', preco: 150.00, categoria: 'Áudio' },
  { codigo: 'PROD020', nome: 'Fone JBL Tune 600', preco: 200.00, categoria: 'Áudio' },
  { codigo: 'PROD021', nome: 'Fone JBL Tune 700', preco: 250.00, categoria: 'Áudio' },
  { codigo: 'PROD022', nome: 'Caixa de Som JBL Go', preco: 180.00, categoria: 'Áudio' },
  { codigo: 'PROD023', nome: 'Caixa de Som JBL Charge', preco: 350.00, categoria: 'Áudio' },
  { codigo: 'PROD024', nome: 'Caixa de Som JBL Xtreme', preco: 500.00, categoria: 'Áudio' },
  { codigo: 'PROD025', nome: 'Câmera Canon EOS R5', preco: 8000.00, categoria: 'Câmeras' },
  { codigo: 'PROD026', nome: 'Câmera Canon EOS R6', preco: 6000.00, categoria: 'Câmeras' },
  { codigo: 'PROD027', nome: 'Câmera Canon EOS R7', preco: 4000.00, categoria: 'Câmeras' },
  { codigo: 'PROD028', nome: 'Impressora HP LaserJet', preco: 400.00, categoria: 'Impressoras' },
  { codigo: 'PROD029', nome: 'Impressora HP Deskjet', preco: 200.00, categoria: 'Impressoras' },
  { codigo: 'PROD030', nome: 'Impressora HP Officejet', preco: 300.00, categoria: 'Impressoras' }
];

// Criar workbook
const workbook = XLSX.utils.book_new();

// Converter dados para worksheet
const worksheet = XLSX.utils.json_to_sheet(produtos);

// Adicionar worksheet ao workbook
XLSX.utils.book_append_sheet(workbook, worksheet, 'Produtos');

// Salvar arquivo
XLSX.writeFile(workbook, 'planilha_teste_3.xlsx');

console.log('Planilha teste 3 criada com sucesso!');
console.log('Arquivo: planilha_teste_3.xlsx');
console.log('Total de produtos: 30');





