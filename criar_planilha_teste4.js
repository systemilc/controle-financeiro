const XLSX = require('xlsx');

// Dados das notas fiscais com produtos similares mas códigos diferentes
const compras = [
  // Nota Fiscal 1 - Eletrônicos TechStore
  { numero_nota: 'NF2024001', nome_loja: 'TECHSTORE ELETRÔNICOS', codigo_produto: 'LEN001', nome_produto: 'Notebook Lenovo IdeaPad 3', quantidade: 1, valor_unitario: 1800.00, total: 1800.00, data_compra: '15/01/2024' },
  { numero_nota: 'NF2024001', nome_loja: 'TECHSTORE ELETRÔNICOS', codigo_produto: 'LEN002', nome_produto: 'Notebook Lenovo IdeaPad 5', quantidade: 1, valor_unitario: 2200.00, total: 2200.00, data_compra: '15/01/2024' },
  { numero_nota: 'NF2024001', nome_loja: 'TECHSTORE ELETRÔNICOS', codigo_produto: 'LEN003', nome_produto: 'Notebook Lenovo IdeaPad 7', quantidade: 1, valor_unitario: 2800.00, total: 2800.00, data_compra: '15/01/2024' },
  
  // Nota Fiscal 2 - Áudio SoundMax
  { numero_nota: 'NF2024002', nome_loja: 'SOUNDMAX ÁUDIO', codigo_produto: 'SON001', nome_produto: 'Fone Sony WH-1000XM4', quantidade: 2, valor_unitario: 1200.00, total: 2400.00, data_compra: '16/01/2024' },
  { numero_nota: 'NF2024002', nome_loja: 'SOUNDMAX ÁUDIO', codigo_produto: 'SON002', nome_produto: 'Fone Sony WH-1000XM5', quantidade: 1, valor_unitario: 1500.00, total: 1500.00, data_compra: '16/01/2024' },
  { numero_nota: 'NF2024002', nome_loja: 'SOUNDMAX ÁUDIO', codigo_produto: 'SON003', nome_produto: 'Fone Sony WF-1000XM4', quantidade: 3, valor_unitario: 800.00, total: 2400.00, data_compra: '16/01/2024' },
  
  // Nota Fiscal 3 - Smartphones MobileCenter
  { numero_nota: 'NF2024003', nome_loja: 'MOBILECENTER', codigo_produto: 'SAM001', nome_produto: 'Samsung Galaxy S21', quantidade: 1, valor_unitario: 2500.00, total: 2500.00, data_compra: '17/01/2024' },
  { numero_nota: 'NF2024003', nome_loja: 'MOBILECENTER', codigo_produto: 'SAM002', nome_produto: 'Samsung Galaxy S22', quantidade: 1, valor_unitario: 3000.00, total: 3000.00, data_compra: '17/01/2024' },
  { numero_nota: 'NF2024003', nome_loja: 'MOBILECENTER', codigo_produto: 'SAM003', nome_produto: 'Samsung Galaxy S23', quantidade: 1, valor_unitario: 3500.00, total: 3500.00, data_compra: '17/01/2024' },
  
  // Nota Fiscal 4 - Tablets iStore
  { numero_nota: 'NF2024004', nome_loja: 'ISTORE TABLETS', codigo_produto: 'APP001', nome_produto: 'iPad 9ª Geração', quantidade: 2, valor_unitario: 2800.00, total: 5600.00, data_compra: '18/01/2024' },
  { numero_nota: 'NF2024004', nome_loja: 'ISTORE TABLETS', codigo_produto: 'APP002', nome_produto: 'iPad 10ª Geração', quantidade: 1, valor_unitario: 3200.00, total: 3200.00, data_compra: '18/01/2024' },
  { numero_nota: 'NF2024004', nome_loja: 'ISTORE TABLETS', codigo_produto: 'APP003', nome_produto: 'iPad Air 5ª Geração', quantidade: 1, valor_unitario: 4500.00, total: 4500.00, data_compra: '18/01/2024' },
  
  // Nota Fiscal 5 - Monitores DisplayPro
  { numero_nota: 'NF2024005', nome_loja: 'DISPLAYPRO MONITORES', codigo_produto: 'LG001', nome_produto: 'Monitor LG 24" Full HD', quantidade: 3, valor_unitario: 600.00, total: 1800.00, data_compra: '19/01/2024' },
  { numero_nota: 'NF2024005', nome_loja: 'DISPLAYPRO MONITORES', codigo_produto: 'LG002', nome_produto: 'Monitor LG 27" Full HD', quantidade: 2, valor_unitario: 800.00, total: 1600.00, data_compra: '19/01/2024' },
  { numero_nota: 'NF2024005', nome_loja: 'DISPLAYPRO MONITORES', codigo_produto: 'LG003', nome_produto: 'Monitor LG 32" 4K', quantidade: 1, valor_unitario: 1500.00, total: 1500.00, data_compra: '19/01/2024' },
  
  // Nota Fiscal 6 - Acessórios GamingGear
  { numero_nota: 'NF2024006', nome_loja: 'GAMINGGEAR ACESSÓRIOS', codigo_produto: 'RAZ001', nome_produto: 'Teclado Razer BlackWidow V3', quantidade: 2, valor_unitario: 400.00, total: 800.00, data_compra: '20/01/2024' },
  { numero_nota: 'NF2024006', nome_loja: 'GAMINGGEAR ACESSÓRIOS', codigo_produto: 'RAZ002', nome_produto: 'Teclado Razer BlackWidow V4', quantidade: 1, valor_unitario: 500.00, total: 500.00, data_compra: '20/01/2024' },
  { numero_nota: 'NF2024006', nome_loja: 'GAMINGGEAR ACESSÓRIOS', codigo_produto: 'RAZ003', nome_produto: 'Teclado Razer DeathStalker V2', quantidade: 1, valor_unitario: 300.00, total: 300.00, data_compra: '20/01/2024' },
  { numero_nota: 'NF2024006', nome_loja: 'GAMINGGEAR ACESSÓRIOS', codigo_produto: 'RAZ004', nome_produto: 'Mouse Razer DeathAdder V2', quantidade: 3, valor_unitario: 200.00, total: 600.00, data_compra: '20/01/2024' },
  
  // Nota Fiscal 7 - Câmeras PhotoPro
  { numero_nota: 'NF2024007', nome_loja: 'PHOTOPRO CÂMERAS', codigo_produto: 'NIK001', nome_produto: 'Câmera Nikon D3500', quantidade: 1, valor_unitario: 2000.00, total: 2000.00, data_compra: '21/01/2024' },
  { numero_nota: 'NF2024007', nome_loja: 'PHOTOPRO CÂMERAS', codigo_produto: 'NIK002', nome_produto: 'Câmera Nikon D5600', quantidade: 1, valor_unitario: 3000.00, total: 3000.00, data_compra: '21/01/2024' },
  { numero_nota: 'NF2024007', nome_loja: 'PHOTOPRO CÂMERAS', codigo_produto: 'NIK003', nome_produto: 'Câmera Nikon D7500', quantidade: 1, valor_unitario: 4500.00, total: 4500.00, data_compra: '21/01/2024' },
  
  // Nota Fiscal 8 - Impressoras PrintMax
  { numero_nota: 'NF2024008', nome_loja: 'PRINTMAX IMPRESSORAS', codigo_produto: 'EPS001', nome_produto: 'Impressora Epson L3150', quantidade: 2, valor_unitario: 500.00, total: 1000.00, data_compra: '22/01/2024' },
  { numero_nota: 'NF2024008', nome_loja: 'PRINTMAX IMPRESSORAS', codigo_produto: 'EPS002', nome_produto: 'Impressora Epson L4160', quantidade: 1, valor_unitario: 600.00, total: 600.00, data_compra: '22/01/2024' },
  { numero_nota: 'NF2024008', nome_loja: 'PRINTMAX IMPRESSORAS', codigo_produto: 'EPS003', nome_produto: 'Impressora Epson L5190', quantidade: 1, valor_unitario: 700.00, total: 700.00, data_compra: '22/01/2024' },
  
  // Nota Fiscal 9 - Mix de produtos TechMix
  { numero_nota: 'NF2024009', nome_loja: 'TECHMIX VARIEDADES', codigo_produto: 'SON004', nome_produto: 'Fone Sony WF-1000XM5', quantidade: 2, valor_unitario: 1000.00, total: 2000.00, data_compra: '23/01/2024' },
  { numero_nota: 'NF2024009', nome_loja: 'TECHMIX VARIEDADES', codigo_produto: 'SAM004', nome_produto: 'Samsung Galaxy A54', quantidade: 1, valor_unitario: 1500.00, total: 1500.00, data_compra: '23/01/2024' },
  { numero_nota: 'NF2024009', nome_loja: 'TECHMIX VARIEDADES', codigo_produto: 'LG004', nome_produto: 'Monitor LG UltraWide 29"', quantidade: 1, valor_unitario: 1200.00, total: 1200.00, data_compra: '23/01/2024' },
  
  // Nota Fiscal 10 - Produtos premium PremiumTech
  { numero_nota: 'NF2024010', nome_loja: 'PREMIUMTECH', codigo_produto: 'APP004', nome_produto: 'iPad Pro 11"', quantidade: 1, valor_unitario: 6500.00, total: 6500.00, data_compra: '24/01/2024' },
  { numero_nota: 'NF2024010', nome_loja: 'PREMIUMTECH', codigo_produto: 'APP005', nome_produto: 'iPad Pro 12.9"', quantidade: 1, valor_unitario: 7500.00, total: 7500.00, data_compra: '24/01/2024' },
  { numero_nota: 'NF2024010', nome_loja: 'PREMIUMTECH', codigo_produto: 'NIK004', nome_produto: 'Câmera Nikon Z6', quantidade: 1, valor_unitario: 8000.00, total: 8000.00, data_compra: '24/01/2024' },
  { numero_nota: 'NF2024010', nome_loja: 'PREMIUMTECH', codigo_produto: 'NIK005', nome_produto: 'Câmera Nikon Z7', quantidade: 1, valor_unitario: 12000.00, total: 12000.00, data_compra: '24/01/2024' }
];

// Criar workbook
const workbook = XLSX.utils.book_new();

// Converter dados para worksheet
const worksheet = XLSX.utils.json_to_sheet(compras);

// Adicionar worksheet ao workbook
XLSX.utils.book_append_sheet(workbook, worksheet, 'Compras');

// Salvar arquivo
XLSX.writeFile(workbook, 'planilha_teste_4.xlsx');

console.log('Planilha teste 4 criada com sucesso!');
console.log('Arquivo: planilha_teste_4.xlsx');
console.log('Total de itens: 35');
console.log('Total de notas fiscais: 10');
console.log('Lojas: TECHSTORE, SOUNDMAX, MOBILECENTER, ISTORE, DISPLAYPRO, GAMINGGEAR, PHOTOPRO, PRINTMAX, TECHMIX, PREMIUMTECH');
