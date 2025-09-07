const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const path = require('path');

const app = express();
const PORT = 3000;
const SALT_ROUNDS = 10;

// Configura o middleware para servir arquivos estáticos
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// Conecta ao banco de dados ou cria um novo arquivo se não existir
const db = new sqlite3.Database('financas.db', (err) => {
    if (err) {
        console.error(err.message);
    }
    console.log('Conectado ao banco de dados SQLite.');
});

// Atualiza a estrutura do banco de dados para a nova lógica
db.serialize(() => {
    db.run(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE,
            password TEXT,
            group_id INTEGER,
            role TEXT DEFAULT 'user',
            is_approved INTEGER DEFAULT 0
        )
    `);

    // Adiciona as novas colunas à tabela users se elas não existirem
    const userColumns = ['whatsapp', 'instagram', 'email', 'consent_lgpd', 'role', 'is_approved'];
    userColumns.forEach(col => {
        db.all(`PRAGMA table_info(users)`, (err, tableInfo) => {
            if (!tableInfo || !Array.isArray(tableInfo) || !tableInfo.some(c => c.name === col)) {
                let columnType = 'TEXT';
                if (col === 'consent_lgpd') {
                    columnType = 'INTEGER DEFAULT 0';
                } else if (col === 'role') {
                    columnType = 'TEXT DEFAULT \'user\'';
                } else if (col === 'is_approved') {
                    columnType = 'INTEGER DEFAULT 0';
                }
                db.run(`ALTER TABLE users ADD COLUMN ${col} ${columnType}`, (err) => {
                    if (err) {
                        console.error(`Erro ao adicionar a coluna ${col} em users:`, err.message);
                    }
                });
            }
        });
    });

    db.run(`
        CREATE TABLE IF NOT EXISTS accounts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT,
            group_id INTEGER
        )
    `);

    db.run(`
        CREATE TABLE IF NOT EXISTS categories (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            group_id INTEGER,
            name TEXT NOT NULL,
            type TEXT NOT NULL, -- 'income' ou 'expense'
            UNIQUE(group_id, name, type), -- Garante que não haja categorias duplicadas por grupo/tipo
            FOREIGN KEY(group_id) REFERENCES users(group_id)
        )
    `);
    
    db.run(`
        CREATE TABLE IF NOT EXISTS transactions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            account_id INTEGER,
            category_id INTEGER, -- Nova coluna para a categoria
            description TEXT,
            amount REAL,
            type TEXT,
            original_account_name TEXT,
            is_confirmed INTEGER DEFAULT 0,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            due_date TEXT,
            confirmed_at TEXT DEFAULT NULL,
            is_transfer INTEGER DEFAULT 0, -- Nova coluna
            FOREIGN KEY(user_id) REFERENCES users(id),
            FOREIGN KEY(account_id) REFERENCES accounts(id),
            FOREIGN KEY(category_id) REFERENCES categories(id)
        )
    `);

    // Altera a tabela de usuários para adicionar a coluna group_id se ela não existir
    db.all(`PRAGMA table_info(users)`, (err, tableInfo) => {
        if (!tableInfo || !Array.isArray(tableInfo) || !tableInfo.some(col => col.name === 'group_id')) {
            db.run(`ALTER TABLE users ADD COLUMN group_id INTEGER`, (err) => {
                if (err) {
                    console.error('Erro ao adicionar group_id na tabela users:', err.message);
                }
            });
        }
    });

    // Altera a tabela de contas para adicionar a coluna group_id e remover user_id
    db.all(`PRAGMA table_info(accounts)`, (err, tableInfo) => {
        if (!tableInfo || !Array.isArray(tableInfo) || !tableInfo.some(col => col.name === 'group_id')) {
            db.run(`ALTER TABLE accounts ADD COLUMN group_id INTEGER`, (err) => {
                if (err) {
                    console.error('Erro ao adicionar group_id na tabela accounts:', err.message);
                }
            });
            // Opcional: remover a coluna user_id se ela existir. Para simplificar, não faremos isso agora.
        }
    });
    
    // Altera a tabela de transações para adicionar as colunas se elas não existirem
    const transactionColumns = ['original_account_name', 'is_confirmed', 'created_at', 'due_date', 'confirmed_at'];
    transactionColumns.forEach(col => {
        db.all(`PRAGMA table_info(transactions)`, (err, tableInfo) => {
            if (!tableInfo || !Array.isArray(tableInfo) || !tableInfo.some(c => c.name === col)) {
                db.run(`ALTER TABLE transactions ADD COLUMN ${col} TEXT`, (err) => {
                    if (err) {
                        console.error(`Erro ao adicionar a coluna ${col} em transactions:`, err.message);
                    }
                });
            }
        });
    });

    // Insere um usuário de exemplo se não existir
    db.get("SELECT * FROM users WHERE username = 'admin'", (err, row) => {
        if (!row) {
            bcrypt.hash('123456', SALT_ROUNDS, (err, hash) => {
                if (err) throw err;
                const groupId = 1; // Cria o primeiro grupo para o admin
                db.run(`INSERT INTO users (username, password, group_id, role, is_approved) VALUES (?, ?, ?, ?, ?)`, ['admin', hash, groupId, 'admin', 1], (err) => {
                    if (err) {
                        console.error('Erro ao inserir usuário padrão:', err.message);
                    } else {
                        console.log('Usuário padrão "admin" criado com sucesso.');
                    }
                });
            });
        }
    });
});

const authenticate = (req, res, next) => {
    const userId = req.headers['x-user-id'];
    const groupId = req.headers['x-group-id'];
    
    console.log('--- Auth Middleware ---');
    console.log('Recebido User ID:', userId);
    console.log('Recebido Group ID:', groupId);

    if (!userId || !groupId) {
        console.log('Autenticação falhou: userId ou groupId ausentes.');
        return res.status(401).json({ message: 'Não autorizado' });
    }
    req.userId = userId;
    req.groupId = groupId;

    db.get(`SELECT role FROM users WHERE id = ?`, [userId], (err, user) => {
        if (err || !user) {
            console.log('Autenticação falhou: usuário não encontrado ou erro no DB ao buscar role.');
            return res.status(401).json({ message: 'Não autorizado' });
        }
        req.userRole = user.role;
        console.log('Autenticação bem-sucedida. Role:', req.userRole);
        next();
    });
};

const authorizeRole = (requiredRole) => (req, res, next) => {
    if (req.userRole === requiredRole) {
        next();
    } else {
        return res.status(403).json({ message: `Acesso negado. Apenas usuários com o papel '${requiredRole}' podem realizar esta ação.` });
    }
};

// --- ROTAS DA API ---

app.post('/api/register', (req, res) => {
    console.log('Dados de registro recebidos:', req.body);
    const { username, password, whatsapp, instagram, email, consent_lgpd } = req.body;

    if (!username || !password || !email || consent_lgpd !== 1) {
        return res.status(400).json({ message: 'Por favor, preencha todos os campos obrigatórios e aceite os termos da LGPD.' });
    }

    // Validação de senha no backend (repetindo a lógica do frontend por segurança)
    const minLength = 6;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    if (!(password.length >= minLength && hasUpperCase && hasLowerCase && hasNumber && hasSpecialChar)) {
        return res.status(400).json({ message: 'A senha deve ter no mínimo 6 caracteres, com letras maiúsculas, minúsculas, números e caracteres especiais.' });
    }

    db.get("SELECT * FROM users WHERE username = ?", [username], (err, userRow) => {
        if (err) {
            console.error('Erro ao verificar nome de usuário:', err.message);
            return res.status(500).json({ message: 'Erro no banco de dados' });
        }
        if (userRow) {
            return res.status(400).json({ message: 'Nome de usuário já cadastrado.' });
        }

        db.get("SELECT * FROM users WHERE email = ?", [email], (err, emailRow) => {
            if (err) {
                console.error('Erro ao verificar e-mail:', err.message);
                return res.status(500).json({ message: 'Erro no banco de dados' });
            }
            if (emailRow) {
                return res.status(400).json({ message: 'E-mail já cadastrado.' });
            }

            bcrypt.hash(password, SALT_ROUNDS, (err, hash) => {
                if (err) {
                    return res.status(500).json({ message: 'Erro ao criptografar senha', error: err.message });
                }

                // Encontra o maior group_id existente e adiciona 1, ou usa 1 se não houver nenhum
                db.get("SELECT MAX(group_id) as max_group_id FROM users", (err, result) => {
                    // Cada novo registro terá seu próprio grupo (group_id = id do usuário)
                    // O group_id final será definido após a inserção para ser igual ao userId
                    const initialGroupId = 0; // Valor temporário
                    db.run(
                        `INSERT INTO users (username, password, group_id, whatsapp, instagram, email, consent_lgpd, role, is_approved) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                        [username, hash, initialGroupId, whatsapp, instagram, email, consent_lgpd ? 1 : 0, 'user', 0],
                        function (err) {
                            if (err) {
                                return res.status(500).json({ message: 'Erro ao registrar usuário', error: err.message });
                            }
                            const newUserId = this.lastID;
                            // Atualiza o group_id para ser igual ao userId
                            db.run(`UPDATE users SET group_id = ? WHERE id = ?`, [newUserId, newUserId], (updateErr) => {
                                if (updateErr) {
                                    console.error('Erro ao atualizar group_id do novo usuário:', updateErr.message);
                                }

                                res.status(201).json({ message: 'Usuário registrado com sucesso e aguardando aprovação!', userId: newUserId, groupId: newUserId, role: 'user' });
                            });
                        }
                    );
                });
            });
        });
    });
});

app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    db.get("SELECT * FROM users WHERE username = ?", [username], async (err, user) => {
        if (err || !user) {
            return res.status(400).json({ message: 'Usuário ou senha inválidos' });
        }
        
        // Verifica se o usuário foi aprovado
        if (user.is_approved === 0) {
            return res.status(403).json({ message: 'Sua conta ainda não foi aprovada pelo administrador.' });
        }

        const match = await bcrypt.compare(password, user.password);
        if (match) {
            return res.json({ message: 'Login bem-sucedido', userId: user.id, groupId: user.group_id, userRole: user.role });
        } else {
            return res.status(400).json({ message: 'Usuário ou senha inválidos' });
        }
    });
});

app.post('/api/users/add', authenticate, (req, res) => {
    const { username, password, whatsapp, instagram, email } = req.body;
    const groupId = req.groupId;
    const creatorRole = req.userRole; // Papel do usuário logado

    // Define a role padrão para o novo usuário
    let newRole = 'collaborator'; 
    if (creatorRole === 'admin') {
        // Se o criador for admin, ele pode definir a role do novo usuário via payload
        newRole = req.body.role || 'collaborator';
    }

    bcrypt.hash(password, SALT_ROUNDS, (err, hash) => {
        if (err) {
            return res.status(500).json({ message: 'Erro ao criar usuário', error: err.message });
        }
        db.run(`INSERT INTO users (username, password, group_id, role, whatsapp, instagram, email) VALUES (?, ?, ?, ?, ?, ?, ?)`, [username, hash, groupId, newRole, whatsapp, instagram, email], (err) => {
            if (err) {
                return res.status(400).json({ message: 'Usuário já existe ou erro no banco.', error: err.message });
            }
            res.status(201).json({ message: 'Novo usuário adicionado ao grupo com sucesso.' });
        });
    });
});

app.get('/api/users/list', authenticate, (req, res) => {
    const groupId = req.groupId;
    const userRole = req.userRole;

    let query = '';
    let params = [];

    if (userRole === 'admin') {
        query = `SELECT id, username, email, whatsapp, instagram, consent_lgpd, role, group_id FROM users`;
    } else if (userRole === 'user' || userRole === 'collaborator') {
        // Usuários normais e colaboradores veem todos os membros do seu grupo
        query = `SELECT id, username, email, whatsapp, instagram, consent_lgpd, role, group_id FROM users WHERE group_id = ?`;
        params = [groupId];
    } else {
        return res.status(403).json({ message: 'Acesso negado para este tipo de usuário.' });
    }

    db.all(query, params, (err, rows) => {
        if (err) {
            return res.status(500).json({ message: 'Erro ao buscar usuários', error: err.message });
        }
        res.json(rows);
    });
});

// Novo endpoint para buscar dados de um único usuário
app.get('/api/users/:id', authenticate, (req, res) => {
    const { id } = req.params;
    const userIdToFetch = parseInt(id);
    const loggedInUserId = parseInt(req.userId);
    const userRole = req.userRole;
    const loggedInGroupId = parseInt(req.groupId);

    // Administradores podem buscar qualquer usuário.
    // Usuários normais podem buscar apenas a si mesmos OU colaboradores do seu grupo.
    if (userRole === 'admin' || loggedInUserId === userIdToFetch) {
        db.get(`SELECT id, username, email, whatsapp, instagram, consent_lgpd, role, group_id FROM users WHERE id = ?`, [userIdToFetch], (err, row) => {
            if (err) {
                console.error('Erro ao buscar usuário:', err.message);
                return res.status(500).json({ message: 'Erro ao buscar dados do usuário', error: err.message });
            }
            if (!row) {
                return res.status(404).json({ message: 'Usuário não encontrado.' });
            }
            res.json(row);
        });
    } else if (userRole === 'user') {
        // Se for um usuário normal, verifica se está tentando acessar um colaborador do mesmo grupo
        db.get(`SELECT group_id, role FROM users WHERE id = ?`, [userIdToFetch], (err, userToFetch) => {
            if (err || !userToFetch) {
                return res.status(404).json({ message: 'Usuário não encontrado.' });
            }
            if (userToFetch.group_id === loggedInGroupId && userToFetch.role === 'collaborator') {
                db.get(`SELECT id, username, email, whatsapp, instagram, consent_lgpd, role, group_id FROM users WHERE id = ?`, [userIdToFetch], (err, row) => {
                    if (err) {
                        console.error('Erro ao buscar usuário colaborador:', err.message);
                        return res.status(500).json({ message: 'Erro ao buscar dados do usuário colaborador', error: err.message });
                    }
                    res.json(row);
                });
            } else {
                console.log(`Acesso negado para User ID ${loggedInUserId} (role: ${userRole}, group: ${loggedInGroupId}) tentando acessar User ID ${userIdToFetch} (role: ${userToFetch.role}, group: ${userToFetch.group_id}). Razão: Mismatch de grupo ou papel não é colaborador.`);
                return res.status(403).json({ message: 'Acesso negado. Você não tem permissão para ver este usuário.' });
            }
        });
    }
     else {
        console.log(`Acesso negado para User ID ${loggedInUserId} (role: ${userRole}, group: ${loggedInGroupId}) tentando acessar User ID ${userIdToFetch}. Razão: Papel de usuário não permitido.`);
        return res.status(403).json({ message: 'Acesso negado. Você não tem permissão para ver este usuário.' });
    }
});

app.post('/api/accounts', authenticate, (req, res) => {
    const { name } = req.body;
    const groupId = req.groupId;
    db.run(`INSERT INTO accounts (group_id, name) VALUES (?, ?)`, [groupId, name], function(err) {
        if (err) {
            return res.status(500).json({ message: 'Erro ao criar conta', error: err.message });
        }
        res.status(201).json({ id: this.lastID, name });
    });
});

app.get('/api/accounts', authenticate, (req, res) => {
    const groupId = req.groupId;
    
    console.log('--- GET /api/accounts ---');
    console.log('Buscando contas para o Group ID:', groupId);

    db.all(`SELECT * FROM accounts WHERE group_id = ?`, [groupId], (err, rows) => {
        if (err) {
            console.error('Erro no banco de dados:', err.message);
            return res.status(500).json({ message: 'Erro ao buscar contas', error: err.message });
        }

        // Se nenhuma conta for encontrada, cria uma conta padrão para o grupo
        if (rows.length === 0) {
            console.log(`Nenhuma conta encontrada para o Group ID ${groupId}. Criando conta padrão.`);
            db.run(`INSERT INTO accounts (group_id, name) VALUES (?, ?)`, [groupId, 'Conta Principal'], function(insertErr) {
                if (insertErr) {
                    console.error('Erro ao criar conta padrão:', insertErr.message);
                    return res.status(500).json({ message: 'Erro ao criar conta padrão', error: insertErr.message });
                }
                // Após criar, busca novamente para retornar a conta padrão
                db.all(`SELECT * FROM accounts WHERE group_id = ?`, [groupId], (finalErr, finalRows) => {
                    if (finalErr) {
                        console.error('Erro ao buscar contas após criação de padrão:', finalErr.message);
                        return res.status(500).json({ message: 'Erro ao buscar contas', error: finalErr.message });
                    }
                    res.json(finalRows);
                });
            });
        } else {
            res.json(rows);
        }
    });
});

app.delete('/api/accounts/:id', authenticate, (req, res) => {
    const { id } = req.params;
    const { new_account_id, original_account_name } = req.body;
    const groupId = req.groupId;

    if (parseInt(id) === parseInt(new_account_id)) {
        return res.status(400).json({ message: 'Não é possível transferir transações para a mesma conta.' });
    }

    db.get(`SELECT COUNT(*) as count FROM accounts WHERE group_id = ?`, [groupId], (err, row) => {
        if (err) {
            return res.status(500).json({ message: 'Erro ao verificar contas', error: err.message });
        }
        if (row.count <= 1) {
            return res.status(400).json({ message: 'Não é possível deletar a única conta existente.' });
        }

        db.serialize(() => {
            db.run("BEGIN TRANSACTION;");
            db.run(`UPDATE transactions SET account_id = ?, original_account_name = ? WHERE account_id = ?`,
                [new_account_id, original_account_name, id],
                function(err) {
                    if (err) {
                        db.run("ROLLBACK;");
                        return res.status(500).json({ message: 'Erro ao transferir transações', error: err.message });
                    }
                    db.run(`DELETE FROM accounts WHERE id = ? AND group_id = ?`, [id, groupId], function(err) {
                        if (err) {
                            db.run("ROLLBACK;");
                            return res.status(500).json({ message: 'Erro ao deletar conta', error: err.message });
                        }
                        if (this.changes === 0) {
                            db.run("ROLLBACK;");
                            return res.status(404).json({ message: 'Conta não encontrada ou sem permissão' });
                        }
                        db.run("COMMIT;", (err) => {
                            if (err) {
                                return res.status(500).json({ message: 'Erro ao finalizar transação', error: err.message });
                            }
                            res.status(200).json({ message: 'Conta deletada e transações transferidas com sucesso.' });
                        });
                    });
                }
            );
        });
    });
});

app.post('/api/transactions', authenticate, (req, res) => {
    const { description, amount, type, account_id, due_date, is_transfer, category_id } = req.body; // Adicionado category_id
    const userId = req.userId;
    if (!account_id) {
        return res.status(400).json({ message: 'O ID da conta é obrigatório.' });
    }
    db.run(`INSERT INTO transactions (user_id, account_id, description, amount, type, due_date, is_transfer, category_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [userId, account_id, description, amount, type, due_date, is_transfer ? 1 : 0, category_id || null],
        function (err) {
            if (err) {
                console.error('Erro ao inserir transação no banco de dados:', err.message); // Adicionado para depuração
                return res.status(500).json({ message: 'Erro ao adicionar transação', error: err.message });
            }
            res.status(201).json({ id: this.lastID, description, amount, type, account_id, due_date, created_at: new Date().toISOString(), category_id });
        }
    );
});

app.put('/api/transactions/:id/confirm', authenticate, (req, res) => {
    const { id } = req.params;
    const userId = req.userId;
    
    console.log('--- PUT /api/transactions/:id/confirm ---');
    console.log('Confirmando transação com ID:', id);
    console.log('User ID do header:', userId);

    db.run(`
        UPDATE transactions
        SET is_confirmed = 1, confirmed_at = CURRENT_TIMESTAMP
        WHERE id = ?
          AND account_id IN (SELECT id FROM accounts WHERE group_id = ?)
    `,
        [id, req.groupId],
        function(err) {
            if (err) {
                console.error('Erro no banco de dados:', err.message);
                return res.status(500).json({ message: 'Erro ao confirmar transação', error: err.message });
            }
            if (this.changes === 0) {
                console.log('Transação não encontrada ou sem permissão.');
                return res.status(404).json({ message: 'Transação não encontrada ou sem permissão' });
            }
            console.log('Transação confirmada com sucesso.');
            res.status(200).json({ message: 'Transação confirmada com sucesso' });
        }
    );
});

app.get('/api/transactions', authenticate, (req, res) => {
    const groupId = req.groupId;
    
    console.log('--- GET /api/transactions ---');
    console.log('Buscando transações para o Group ID:', groupId);

    // Extrai os parâmetros de filtro da query string
    const { dateType, dateStart, dateEnd, types, account_id, category_id, isConfirmed } = req.query; // Adicionado category_id
    console.log('Filtros recebidos no backend:', { dateType, dateStart, dateEnd, types, account_id, category_id, isConfirmed });

    let whereClauses = ['a.group_id = ?'];
    let params = [groupId];

    // Filtro por tipo de data e intervalo
    if (dateType && dateStart && dateEnd) {
        // Garante que as datas sejam formatadas como 'YYYY-MM-DD'
        whereClauses.push(`DATE(t.${dateType}) BETWEEN ? AND ?`);
        params.push(dateStart);
        params.push(dateEnd);
    }

    // Filtro por tipos de transação (income, expense ou ambos)
    if (types) {
        const typeArray = types.split(',');
        if (typeArray.length === 1) {
            whereClauses.push(`t.type = ?`);
            params.push(typeArray[0]);
        } else if (typeArray.length === 2 && typeArray.includes('income') && typeArray.includes('expense')) {
            // Se ambos forem selecionados, não adiciona filtro por tipo
        }
    }

    // Filtro por conta bancária
    if (account_id) {
        whereClauses.push(`t.account_id = ?`);
        params.push(account_id);
    }

    // Filtro por categoria
    if (category_id) {
        whereClauses.push(`t.category_id = ?`);
        params.push(category_id);
    }

    // Status de Confirmação
    if (isConfirmed !== undefined && isConfirmed !== '') {
        whereClauses.push(`t.is_confirmed = ?`);
        params.push(parseInt(isConfirmed)); // Converte para inteiro
    }

    let query = `
        SELECT t.*, a.name as account_name, u.username as creator_name, c.name as category_name, t.is_transfer
        FROM transactions t
        LEFT JOIN accounts a ON t.account_id = a.id
        LEFT JOIN users u ON t.user_id = u.id
        LEFT JOIN categories c ON t.category_id = c.id
    `;

    if (whereClauses.length > 0) {
        query += ` WHERE ${whereClauses.join(' AND ')}`;
    }

    query += ` ORDER BY t.created_at DESC, t.id DESC`; // Ordena por data de criação mais recente e ID

    db.all(query, params, (err, rows) => {
        if (err) {
            console.error('Erro no banco de dados:', err.message);
            return res.status(500).json({ message: 'Erro ao buscar transações', error: err.message });
        }
        rows.forEach(row => {
            if (!row.account_name && row.original_account_name) {
                row.account_name = row.original_account_name + ' (Excluída)';
            }
        });
        res.json(rows);
    });
});

app.get('/api/transactions/:id', authenticate, (req, res) => {
    const { id } = req.params;
    const transactionId = parseInt(id);
    const groupId = req.groupId;

    if (isNaN(transactionId)) {
        return res.status(400).json({ message: 'ID da transação inválido.' });
    }

    const query = `
        SELECT t.*, a.name as account_name, u.username as creator_name, c.name as category_name
        FROM transactions t
        LEFT JOIN accounts a ON t.account_id = a.id
        LEFT JOIN users u ON t.user_id = u.id
        LEFT JOIN categories c ON t.category_id = c.id
        WHERE t.id = ? AND a.group_id = ?
    `;

    db.get(query, [transactionId, groupId], (err, row) => {
        if (err) {
            console.error('Erro ao buscar transação por ID:', err.message);
            return res.status(500).json({ message: 'Erro ao buscar transação.', error: err.message });
        }
        if (!row) {
            return res.status(404).json({ message: 'Transação não encontrada ou sem permissão.' });
        }
        res.json(row);
    });
});

app.put('/api/transactions/:id', authenticate, (req, res) => {
    const { id } = req.params;
    const { description, amount, type, account_id, due_date, category_id } = req.body; // Adicionado category_id
    const userId = req.userId;
    db.run(`
        UPDATE transactions
        SET description = ?, amount = ?, type = ?, account_id = ?, due_date = ?, category_id = ?
        WHERE id = ?
          AND account_id IN (SELECT id FROM accounts WHERE group_id = ?)
    `,
        [description, amount, type, account_id, due_date, category_id || null, id, req.groupId],
        function (err) {
            if (err) {
                return res.status(500).json({ message: 'Erro ao atualizar transação', error: err.message });
            }
            if (this.changes === 0) {
                return res.status(404).json({ message: 'Transação não encontrada ou sem permissão' });
            }
            res.status(200).json({ message: 'Transação atualizada com sucesso' });
        }
    );
});

app.delete('/api/transactions/:id', authenticate, (req, res) => {
    const { id } = req.params;
    const userId = req.userId;
    db.run(`
        DELETE FROM transactions
        WHERE id = ?
          AND account_id IN (SELECT id FROM accounts WHERE group_id = ?)
    `, [id, req.groupId], function (err) {
        if (err) {
            return res.status(500).json({ message: 'Erro ao deletar transação', error: err.message });
        }
        if (this.changes === 0) {
            return res.status(404).json({ message: 'Transação não encontrada ou sem permissão' });
        }
        res.status(200).json({ message: 'Transação deletada com sucesso' });
    });
});

// --- ROTAS DA API DE CATEGORIAS ---

// POST: Criar uma nova categoria
app.post('/api/categories', authenticate, (req, res) => {
    const { name, type } = req.body;
    const groupId = req.groupId;

    if (!name || !type || (type !== 'income' && type !== 'expense')) {
        return res.status(400).json({ message: 'Nome e tipo (income/expense) da categoria são obrigatórios.' });
    }

    db.run(`INSERT INTO categories (group_id, name, type) VALUES (?, ?, ?)`, [groupId, name, type], function(err) {
        if (err) {
            if (err.message.includes('UNIQUE constraint failed')) {
                return res.status(400).json({ message: 'Já existe uma categoria com este nome e tipo para o seu grupo.' });
            }
            console.error('Erro ao inserir categoria no banco de dados:', err.message);
            return res.status(500).json({ message: 'Erro ao criar categoria', error: err.message });
        }
        res.status(201).json({ id: this.lastID, name, type, group_id: groupId });
    });
});

// GET: Listar todas as categorias do grupo do usuário
app.get('/api/categories', authenticate, (req, res) => {
    const groupId = req.groupId;
    const { type } = req.query; // Pode filtrar por tipo (income/expense)

    let query = `SELECT id, name, type, group_id FROM categories WHERE group_id = ?`;
    let params = [groupId];

    if (type && (type === 'income' || type === 'expense')) {
        query += ` AND type = ?`;
        params.push(type);
    }

    query += ` ORDER BY name ASC`;

    db.all(query, params, (err, rows) => {
        if (err) {
            console.error('Erro ao buscar categorias no banco de dados:', err.message);
            return res.status(500).json({ message: 'Erro ao buscar categorias', error: err.message });
        }
        res.json(rows);
    });
});

// PUT: Atualizar uma categoria
app.put('/api/categories/:id', authenticate, (req, res) => {
    const { id } = req.params;
    const { name, type } = req.body;
    const groupId = req.groupId;

    if (!name || !type || (type !== 'income' && type !== 'expense')) {
        return res.status(400).json({ message: 'Nome e tipo (income/expense) da categoria são obrigatórios para atualização.' });
    }

    db.run(`
        UPDATE categories
        SET name = ?, type = ?
        WHERE id = ? AND group_id = ?
    `, [name, type, id, groupId], function(err) {
        if (err) {
            if (err.message.includes('UNIQUE constraint failed')) {
                return res.status(400).json({ message: 'Já existe uma categoria com este nome e tipo para o seu grupo.' });
            }
            console.error('Erro ao atualizar categoria no banco de dados:', err.message);
            return res.status(500).json({ message: 'Erro ao atualizar categoria', error: err.message });
        }
        if (this.changes === 0) {
            return res.status(404).json({ message: 'Categoria não encontrada ou sem permissão para atualizar.' });
        }
        res.status(200).json({ message: 'Categoria atualizada com sucesso!' });
    });
});

// DELETE: Deletar uma categoria
app.delete('/api/categories/:id', authenticate, (req, res) => {
    const { id } = req.params;
    const groupId = req.groupId;

    // Verifica se a categoria está sendo usada por alguma transação
    db.get(`SELECT COUNT(*) as count FROM transactions WHERE category_id = ? AND account_id IN (SELECT id FROM accounts WHERE group_id = ?)`, [id, groupId], (err, row) => {
        if (err) {
            console.error('Erro ao verificar uso da categoria:', err.message);
            return res.status(500).json({ message: 'Erro ao verificar uso da categoria', error: err.message });
        }
        if (row.count > 0) {
            return res.status(400).json({ message: 'Não é possível deletar esta categoria. Ela está vinculada a transações existentes.' });
        }

        db.run(`DELETE FROM categories WHERE id = ? AND group_id = ?`, [id, groupId], function(err) {
            if (err) {
                console.error('Erro ao deletar categoria no banco de dados:', err.message);
                return res.status(500).json({ message: 'Erro ao deletar categoria', error: err.message });
            }
            if (this.changes === 0) {
                return res.status(404).json({ message: 'Categoria não encontrada ou sem permissão para deletar.' });
            }
            res.status(200).json({ message: 'Categoria deletada com sucesso!' });
        });
    });
});

// --- ROTAS DA API DE USUÁRIOS ---

app.delete('/api/users/:id', authenticate, async (req, res) => {
    const { id } = req.params;
    const userIdToDelete = parseInt(id);
    const loggedInUserId = parseInt(req.userId);
    const userRole = req.userRole;
    const loggedInGroupId = parseInt(req.groupId);

    // Impede que o próprio usuário logado tente se deletar
    if (userIdToDelete === loggedInUserId) {
        return res.status(400).json({ message: 'Não é possível deletar o próprio usuário.' });
    }

    if (userRole === 'admin') {
        // Admin pode deletar qualquer usuário (exceto a si mesmo, já verificado acima)
        db.run(`DELETE FROM users WHERE id = ?`, [userIdToDelete], function (err) {
            if (err) {
                console.error('Erro ao deletar usuário por admin:', err.message);
                return res.status(500).json({ message: 'Erro ao deletar usuário', error: err.message });
            }
            if (this.changes === 0) {
                return res.status(404).json({ message: 'Usuário não encontrado ou sem permissão para deletar' });
            }
            res.status(200).json({ message: 'Usuário deletado com sucesso pelo admin!' });
        });
    } else if (userRole === 'user') {
        // Usuário normal pode deletar colaboradores do seu próprio grupo
        db.get(`SELECT group_id, role FROM users WHERE id = ?`, [userIdToDelete], (err, userToDelete) => {
            if (err || !userToDelete) {
                return res.status(404).json({ message: 'Usuário a ser deletado não encontrado.' });
            }

            // Verifica se o usuário a ser deletado é um colaborador do mesmo grupo
            if (userToDelete.group_id === loggedInGroupId && userToDelete.role === 'collaborator') {
                db.run(`DELETE FROM users WHERE id = ?`, [userIdToDelete], function (err) {
                    if (err) {
                        console.error('Erro ao deletar colaborador:', err.message);
                        return res.status(500).json({ message: 'Erro ao deletar colaborador', error: err.message });
                    }
                    if (this.changes === 0) {
                        return res.status(404).json({ message: 'Colaborador não encontrado ou sem permissão para deletar' });
                    }
                    res.status(200).json({ message: 'Colaborador deletado com sucesso pelo usuário!' });
                });
            } else {
                return res.status(403).json({ message: 'Acesso negado. Você não tem permissão para deletar este usuário (não é um colaborador do seu grupo, ou possui papel diferente).' });
            }
        });
    } else {
        return res.status(403).json({ message: 'Acesso negado. Seu papel não permite deletar usuários.' });
    }
});

app.put('/api/users/:id', authenticate, async (req, res) => {
    const { id } = req.params;
    const userIdToEdit = parseInt(id);
    const { username, whatsapp, instagram, email, consent_lgpd, role, group_id } = req.body;

    // 1. Autorização inicial
    if (req.userRole !== 'admin' && req.userId !== userIdToEdit) {
        // Se não for admin e não for o próprio usuário, verifica se é um colaborador do grupo
        if (req.userRole === 'user') {
            const userToEdit = await new Promise((resolve, reject) => {
                db.get(`SELECT group_id, role FROM users WHERE id = ?`, [userIdToEdit], (err, row) => {
                    if (err) reject(err); else resolve(row);
                });
            });

            if (!userToEdit || userToEdit.group_id !== parseInt(req.groupId) || userToEdit.role !== 'collaborator') {
                return res.status(403).json({ message: 'Acesso negado. Você só pode editar seus próprios dados ou os de colaboradores do seu grupo.' });
            }
        } else {
            return res.status(403).json({ message: 'Acesso negado. Você não tem permissão para editar este usuário.' });
        }
    }

    // 2. Validações adicionais (imutabilidade de role/group_id para não-admin e admin-principal)
    if (req.userRole !== 'admin') {
        // Usuários normais não podem alterar seu papel ou grupo
        if (role !== undefined || group_id !== undefined) {
            return res.status(403).json({ message: 'Acesso negado. Usuários não podem alterar seu papel ou grupo.' });
        }
    } else {
        // Admin pode alterar role e group_id, mas o admin principal (ID 1) não pode ter seu papel alterado
        if (userIdToEdit === 1 && (role !== undefined && role !== 'admin')) {
            return res.status(403).json({ message: 'Acesso negado. O papel do usuário admin (ID 1) não pode ser alterado.' });
        }
    }

    let updateFields = [];
    let updateParams = [];

    if (username !== undefined) { updateFields.push(`username = ?`); updateParams.push(username); }
    if (whatsapp !== undefined) { updateFields.push(`whatsapp = ?`); updateParams.push(whatsapp); }
    if (instagram !== undefined) { updateFields.push(`instagram = ?`); updateParams.push(instagram); }
    if (email !== undefined) { updateFields.push(`email = ?`); updateParams.push(email); }
    if (consent_lgpd !== undefined) { updateFields.push(`consent_lgpd = ?`); updateParams.push(consent_lgpd ? 1 : 0); }

    // Apenas admin pode alterar o role e group_id
    if (req.userRole === 'admin') {
        if (role !== undefined) { updateFields.push(`role = ?`); updateParams.push(role); }
        if (group_id !== undefined) { updateFields.push(`group_id = ?`); updateParams.push(group_id); }
    }

    if (updateFields.length === 0) {
        return res.status(400).json({ message: 'Nenhum campo para atualizar.' });
    }

    const query = `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`;
    updateParams.push(userIdToEdit);

    db.run(query, updateParams, function (err) {
        if (err) {
            console.error('Erro ao atualizar usuário:', err.message);
            return res.status(500).json({ message: 'Erro ao atualizar usuário.', error: err.message });
        }
        if (this.changes === 0) {
            return res.status(404).json({ message: 'Usuário não encontrado ou sem permissão para atualizar.' });
        }
        res.status(200).json({ message: 'Usuário atualizado com sucesso!' });
    });
});

app.put('/api/users/:id/change-password', authenticate, async (req, res) => {
    const { id } = req.params;
    const userIdToChange = parseInt(id);
    const { current_password, new_password } = req.body;

    // 1. Autorização: Usuário só pode alterar a própria senha
    if (parseInt(req.userId) !== userIdToChange) {
        return res.status(403).json({ message: 'Acesso negado. Você só pode alterar a sua própria senha.' });
    }

    // 2. Buscar senha atual do usuário
    db.get(`SELECT password FROM users WHERE id = ?`, [userIdToChange], async (err, user) => {
        if (err) {
            console.error('Erro ao buscar usuário para alteração de senha:', err.message);
            return res.status(500).json({ message: 'Erro no banco de dados.' });
        }
        if (!user) {
            return res.status(404).json({ message: 'Usuário não encontrado.' });
        }

        // 3. Comparar senha atual fornecida com a senha armazenada
        const match = await bcrypt.compare(current_password, user.password);
        if (!match) {
            return res.status(400).json({ message: 'Senha atual incorreta.' });
        }

        // 4. Validar nova senha (reutilizando lógica do registro)
        const minLength = 6;
        const hasUpperCase = /[A-Z]/.test(new_password);
        const hasLowerCase = /[a-z]/.test(new_password);
        const hasNumber = /[0-9]/.test(new_password);
        const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(new_password);

        if (!(new_password.length >= minLength && hasUpperCase && hasLowerCase && hasNumber && hasSpecialChar)) {
            return res.status(400).json({ message: 'A nova senha deve ter no mínimo 6 caracteres, com letras maiúsculas, minúsculas, números e caracteres especiais.' });
        }

        // 5. Criptografar nova senha
        bcrypt.hash(new_password, SALT_ROUNDS, (hashErr, newHashedPassword) => {
            if (hashErr) {
                console.error('Erro ao criptografar nova senha:', hashErr.message);
                return res.status(500).json({ message: 'Erro ao criptografar nova senha.' });
            }

            // 6. Atualizar senha no banco de dados
            db.run(`UPDATE users SET password = ? WHERE id = ?`, [newHashedPassword, userIdToChange], function (updateErr) {
                if (updateErr) {
                    console.error('Erro ao atualizar senha no banco de dados:', updateErr.message);
                    return res.status(500).json({ message: 'Erro ao atualizar senha.' });
                }
                if (this.changes === 0) {
                    return res.status(404).json({ message: 'Usuário não encontrado para atualizar a senha.' });
                }
                res.status(200).json({ message: 'Senha alterada com sucesso!' });
            });
        });
    });
});

// Rota para listar usuários pendentes de aprovação (apenas para admin)
app.get('/api/admin/users/pending', authenticate, authorizeRole('admin'), (req, res) => {
    db.all(`SELECT id, username, email FROM users WHERE is_approved = 0`, [], (err, rows) => {
        if (err) {
            console.error('Erro ao buscar usuários pendentes:', err.message);
            return res.status(500).json({ message: 'Erro ao buscar usuários pendentes.' });
        }
        res.json(rows);
    });
});

// Rota para aprovar um usuário (apenas para admin)
app.put('/api/admin/users/:id/approve', authenticate, authorizeRole('admin'), (req, res) => {
    const { id } = req.params;
    const userIdToApprove = parseInt(id);

    if (isNaN(userIdToApprove)) {
        return res.status(400).json({ message: 'ID do usuário inválido.' });
    }

    db.run(`UPDATE users SET is_approved = 1 WHERE id = ? AND is_approved = 0`, [userIdToApprove], function (err) {
        if (err) {
            console.error('Erro ao aprovar usuário:', err.message);
            return res.status(500).json({ message: 'Erro ao aprovar usuário.' });
        }
        if (this.changes === 0) {
            return res.status(404).json({ message: 'Usuário não encontrado, já aprovado ou sem permissão.' });
        }
        res.status(200).json({ message: 'Usuário aprovado com sucesso!' });
    });
});

app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});